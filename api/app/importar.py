"""
Importa el preregistro de la campaña de termografía mamaria (Formularios de Google → Excel).

    api\\.venv\\Scripts\\python -m app.importar aspirantes.xlsx --fecha 2026-10-07     (desde la carpeta api/)
    npm run importar                                                                 (desde la raíz)

Por cada aspirante abre el expediente (o reutiliza el existente: mismo nombre y fecha de nacimiento),
guarda el cuestionario de tamizaje y agenda la cita en la campaña. Se puede ejecutar varias veces:
no duplica expedientes ni citas. Si una persona se registró dos veces, vale su último registro.
"""

from __future__ import annotations

import argparse
import json
import re
import sys
import unicodedata
from dataclasses import dataclass, field
from datetime import date, datetime, timedelta, timezone
from pathlib import Path
from typing import Any

import openpyxl

from . import db
from .oncology_rules import age_on
from .routers.oncologia import load_profile, save_profile
from .schemas import Screening, Stamp
from .settings import PROJECT_DIR

ACTOR = {"id": "sistema", "name": "Importación del preregistro", "role": "sistema"}
SITE = "Universidad Politécnica de Chiapas"
PREREGISTRATION = "Preregistro en línea (formulario)"
CAMPAIGN_NAME = "Campaña de termografía mamaria"
CLINIC_TZ = timezone(timedelta(hours=-6))  # Chiapas, sin horario de verano
PARTICLES = {"de", "del", "la", "las", "los", "y", "da", "van", "von"}

MARITAL = {"CASADA": "Casado(a)", "SOLTERA": "Soltero(a)", "UNIÓN LIBRE": "Unión libre", "UNION LIBRE": "Unión libre"}
EDUCATION = {"PRIMARIA": "Primaria", "SECUNDARIA": "Secundaria", "BACHILLERATO": "Bachillerato", "LICENCIATURA O MÁS": "Licenciatura", "LICENCIATURA O MAS": "Licenciatura"}
VISIT = {"1RA VEZ": "primera-vez", "SUBSECUENTE": "subsecuente"}


def fold(value: str) -> str:
    return "".join(c for c in unicodedata.normalize("NFD", value) if unicodedata.category(c) != "Mn").lower()


def answer(value: Any) -> str | None:
    text = fold(str(value or "")).strip()
    return {"si": "si", "no": "no", "no sabe": "no-sabe"}.get(text)


def title_word(word: str, first: bool) -> str:
    lower = word.lower()
    return lower if lower in PARTICLES and not first else lower[:1].upper() + lower[1:]


def split_name(raw: str) -> tuple[str, str, str | None]:
    """
    "María del Rosario Suchiapa de la Cruz" → ("María del Rosario", "Suchiapa", "de la Cruz").
    Toma los dos últimos apellidos (con sus partículas); con solo dos palabras, nombre y un apellido.
    """
    words = [title_word(w, i == 0) for i, w in enumerate(raw.split())]

    def take_surname(tokens: list[str]) -> tuple[list[str], str]:
        surname = [tokens.pop()]
        while tokens and tokens[-1].lower() in PARTICLES and len(tokens) > 1:
            surname.insert(0, tokens.pop())
        return tokens, " ".join(surname)

    tokens = list(words)
    tokens, second = take_surname(tokens)
    if len(tokens) <= 1:
        return " ".join(tokens) or second, second, None
    tokens, first = take_surname(tokens)
    if not tokens:
        return first, second, None
    return " ".join(tokens), first, second


def phone(value: Any) -> str:
    digits = re.sub(r"\D", "", str(int(value)) if isinstance(value, float) else str(value or ""))
    return f"{digits[:3]} {digits[3:6]} {digits[6:]}" if len(digits) == 10 else digits


def slot(value: Any) -> str:
    text = str(value or "").strip().upper().replace(".", "")
    parsed = datetime.strptime(text, "%I:%M %p")
    return parsed.strftime("%H:%M")


def reported_age(value: Any) -> int | None:
    match = re.search(r"\d+", str(value or ""))
    return int(match.group()) if match else None


@dataclass
class Applicant:
    row: int
    submitted: datetime
    name: str
    first_name: str
    last_name: str
    second_last_name: str | None
    birth_date: str
    age: int | None
    marital_raw: str
    education_raw: str
    visit: str
    phone: str
    time: str
    screening: Screening
    raw: dict[str, Any]
    notes: list[str] = field(default_factory=list)


def read_applicants(path: Path) -> list[Applicant]:
    sheet = openpyxl.load_workbook(path, read_only=True, data_only=True).worksheets[0]
    rows = list(sheet.iter_rows(values_only=True))
    headers = [str(h or "").strip() for h in rows[0]]
    applicants = []
    for index, values in enumerate(rows[1:], start=2):
        if not values or not values[1]:
            continue
        (submitted, name, birth, age, marital, education, visit, cell, time, family, mammo, self_exam, chemistry, can_bring, reason) = (tuple(values) + (None,) * 15)[:15]
        clean_name = " ".join(str(name).split())
        first, last, second = split_name(clean_name)
        submitted_at = submitted.replace(tzinfo=CLINIC_TZ) if isinstance(submitted, datetime) else datetime.now(CLINIC_TZ)
        applicants.append(Applicant(
            row=index, submitted=submitted_at, name=" ".join(filter(None, [first, last, second])),
            first_name=first, last_name=last, second_last_name=second,
            birth_date=(birth.date() if isinstance(birth, datetime) else date.fromisoformat(str(birth))).isoformat(),
            age=reported_age(age), marital_raw=str(marital or "").strip().upper(), education_raw=str(education or "").strip().upper(),
            visit=VISIT.get(str(visit or "").strip().upper(), "primera-vez"), phone=phone(cell), time=slot(time),
            screening=Screening(
                family_cancer=answer(family), previous_mammography=answer(mammo), breast_self_exam=answer(self_exam),
                recent_blood_chemistry=answer(chemistry), can_bring_blood_chemistry=answer(can_bring),
                blood_chemistry_reason=(str(reason).strip() or None) if reason else None,
                source="preregistro", submitted_at=submitted_at.astimezone(timezone.utc).isoformat(timespec="seconds").replace("+00:00", "Z"),
            ),
            raw={h or f"col{i}": (v.isoformat() if isinstance(v, datetime) else v) for i, (h, v) in enumerate(zip(headers, values))},
        ))
    return applicants


def deduplicate(applicants: list[Applicant]) -> tuple[list[Applicant], list[str]]:
    latest: dict[tuple[str, str], Applicant] = {}
    notes = []
    for a in sorted(applicants, key=lambda a: a.submitted):
        key = (fold(a.name), a.birth_date)
        if key in latest:
            previous = latest[key]
            notes.append(f"{a.name}: registro duplicado (filas {previous.row} y {a.row}); se usa el último (cita {a.time} en lugar de {previous.time}).")
        latest[key] = a
    return sorted(latest.values(), key=lambda a: a.submitted), notes


def utc(moment: datetime) -> str:
    return moment.astimezone(timezone.utc).isoformat(timespec="milliseconds").replace("+00:00", "Z")


def run(path: Path, campaign_date: str, location: str) -> int:
    db.init_db()
    applicants, notes = deduplicate(read_applicants(path))
    created = updated = scheduled = 0
    on = date.fromisoformat(campaign_date)

    with db.transaction() as conn:
        row = conn.execute("SELECT id FROM campaigns WHERE date = ? AND kind = 'termografia-mamaria'", (campaign_date,)).fetchone()
        if row:
            campaign_id = row["id"]
            conn.execute("UPDATE campaigns SET location = ? WHERE id = ?", (location, campaign_id))
        else:
            campaign_id = db.new_id("cp")
            conn.execute(
                "INSERT INTO campaigns(id, name, kind, date, location, notes, created_at) VALUES (?,?,?,?,?,?,?)",
                (campaign_id, CAMPAIGN_NAME, "termografia-mamaria", campaign_date, location, f"Preregistro importado de {path.name}", db.now_iso()),
            )
            db.write_audit(conn, ACTOR, "alta", "Campaña", campaign_id, f"Creó la {CAMPAIGN_NAME.lower()} del {campaign_date}")

        for a in applicants:
            # Cada registro lleva fecha y hora, quién lo capturó y la sede: aquí, la hora en que llenó el formulario.
            stamp = Stamp(at=utc(a.submitted), by=PREREGISTRATION, location=location)
            a.screening.recorded = stamp
            age = age_on(a.birth_date, on)
            if a.age is not None and abs(a.age - age) > 1:
                notes.append(f"{a.name}: dice tener {a.age} años, pero por su fecha de nacimiento ({a.birth_date}) tendrá {age}. Verificar.")
            if a.second_last_name is None:
                notes.append(f"{a.name}: solo se registró un apellido. Verificar nombre completo.")
            if a.marital_raw not in MARITAL:
                notes.append(f"{a.name}: estado civil «{a.marital_raw.title()}» no se pudo precisar; quedó sin especificar.")

            existing = next(
                (p for p in (json.loads(r["data"]) for r in conn.execute("SELECT data FROM patients WHERE birth_date = ?", (a.birth_date,))) if fold(p["name"]) == fold(a.name)),
                None,
            )
            demographics = {
                "name": a.name, "firstName": a.first_name, "lastName": a.last_name, "birthDate": a.birth_date, "sex": "mujer", "phone": a.phone,
                "maritalStatus": MARITAL.get(a.marital_raw), "education": EDUCATION.get(a.education_raw),
            }
            if a.second_last_name:
                demographics["secondLastName"] = a.second_last_name
            if existing:
                patient = {**existing, **{k: v for k, v in demographics.items() if v and not existing.get(k)}, "phone": a.phone}
                patient.setdefault("registered", stamp.doc())
                db.save_patient(conn, patient)
                updated += 1
            else:
                patient = db.insert_patient(conn, {
                    **{k: v for k, v in demographics.items() if v is not None},
                    "bloodType": "Desconocido", "status": "activo", "allergies": [],
                    "address": {"street": "", "neighborhood": "", "municipality": "", "state": "Chiapas", "zip": ""},
                    "insurance": {"type": ""}, "emergencyContact": {"name": "", "relationship": "", "phone": ""},
                    "createdAt": utc(a.submitted), "registered": stamp.doc(),
                })
                db.write_audit(conn, ACTOR, "alta", "Expediente", patient["id"], f"Abrió el expediente {patient['record']} desde el preregistro de la campaña")
                created += 1

            profile = load_profile(conn, patient["id"])
            if not profile.screening or profile.screening.source == "preregistro":
                profile.screening = a.screening
                save_profile(conn, patient["id"], profile)

            appointment = conn.execute("SELECT id, status, recorded, log FROM appointments WHERE campaign_id = ? AND patient_id = ?", (campaign_id, patient["id"])).fetchone()
            source = db.dumps({"fila": a.row, "archivo": path.name, "respuestas": a.raw})
            recorded = db.dumps(stamp.doc())
            log = db.dumps([{"status": "programada", **stamp.doc(), "note": f"Preregistro: cita a las {a.time}"}])
            if appointment:
                if appointment["status"] == "programada":
                    conn.execute("UPDATE appointments SET time = ?, visit = ?, source = ? WHERE id = ?", (a.time, a.visit, source, appointment["id"]))
                if not appointment["recorded"]:
                    conn.execute("UPDATE appointments SET recorded = ?, log = COALESCE(log, ?) WHERE id = ?", (recorded, log, appointment["id"]))
            else:
                conn.execute(
                    "INSERT INTO appointments(id, campaign_id, patient_id, time, visit, status, origin, source, created_at, recorded, log) VALUES (?,?,?,?,?,?,?,?,?,?,?)",
                    (db.new_id("ct"), campaign_id, patient["id"], a.time, a.visit, "programada", "preregistro", source, db.now_iso(), recorded, log),
                )
                scheduled += 1

    print(f"Campaña {campaign_date} ({campaign_id})")
    print(f"  {len(applicants)} aspirantes · {created} expedientes nuevos · {updated} ya existían · {scheduled} citas nuevas")
    if notes:
        print("\nPara revisar:")
        for note in notes:
            print(f"  - {note}")
    return 0


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("archivo", nargs="?", default=str(PROJECT_DIR / "aspirantes.xlsx"))
    parser.add_argument("--fecha", default=(date.today() + timedelta(days=1)).isoformat(), help="Fecha de la campaña (AAAA-MM-DD). Por omisión, mañana.")
    parser.add_argument("--lugar", default=SITE, help="Sede de la campaña; queda como ubicación de cada registro.")
    args = parser.parse_args()
    sys.stdout.reconfigure(encoding="utf-8")
    return run(Path(args.archivo), args.fecha, args.lugar)


if __name__ == "__main__":
    raise SystemExit(main())
