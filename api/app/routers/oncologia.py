"""Oncología: tamizaje de cáncer de mama, termografía mamaria y campañas."""

from __future__ import annotations

import json
import sqlite3
from datetime import date
from pathlib import Path
from typing import Any

from fastapi import APIRouter, File, Form, HTTPException, UploadFile
from fastapi.responses import FileResponse

from .. import db
from ..oncology_rules import ASYMMETRY_DELTA, assess, overall_grade, suggest_recommendation
from ..schemas import (
    Appointment, AppointmentIn, AppointmentPatch, BreastExam, BreastExamIn, Campaign, CampaignIn, FileRef, OncologyProfile, RiskFactors,
    Screening, Stamp, Survey, SurveyEdit, SurveyIn, Thermography, ThermographyIn, ThermographyReport,
)
from ..settings import ALLOWED_IMAGE_TYPES, FILES_DIR, MAX_UPLOAD_BYTES
from .expedientes import get_patient_or_404

router = APIRouter(tags=["oncologia"])

GRADE_LABELS = {"TH1": "normal", "TH2": "normal con patrón vascular", "TH3": "anormal benigno", "TH4": "anormal probablemente maligno", "TH5": "muy anormal con alta probabilidad de malignidad"}


# ── Lectura ─────────────────────────────────────────────────────────────────────


def load_profile(conn: sqlite3.Connection, patient_id: str) -> OncologyProfile:
    row = conn.execute("SELECT data FROM oncology_profiles WHERE patient_id = ?", (patient_id,)).fetchone()
    return OncologyProfile.model_validate(json.loads(row["data"])) if row else OncologyProfile()


def save_profile(conn: sqlite3.Connection, patient_id: str, profile: OncologyProfile) -> None:
    conn.execute(
        "INSERT INTO oncology_profiles(patient_id, data, updated_at) VALUES (?,?,?) ON CONFLICT(patient_id) DO UPDATE SET data = excluded.data, updated_at = excluded.updated_at",
        (patient_id, db.dumps(profile.doc()), db.now_iso()),
    )


def _files_for(conn: sqlite3.Connection, owner_id: str) -> list[dict[str, Any]]:
    rows = conn.execute("SELECT * FROM files WHERE owner_id = ? ORDER BY created_at", (owner_id,)).fetchall()
    return [FileRef(id=r["id"], name=r["name"], content_type=r["content_type"], size=r["size"], label=r["label"], created_at=r["created_at"]).doc() for r in rows]


def load_thermographies(conn: sqlite3.Connection, patient_id: str) -> list[dict[str, Any]]:
    rows = conn.execute("SELECT id, data FROM thermographies WHERE patient_id = ? ORDER BY created_at DESC", (patient_id,)).fetchall()
    return [{**json.loads(r["data"]), "images": _files_for(conn, r["id"])} for r in rows]


def append_log(row: sqlite3.Row | None, status: str, recorded: Stamp | None, note: str | None = None) -> str:
    """Agrega un cambio de estado al historial de la cita: estado, fecha y hora, quién y en qué sede."""
    log = json.loads(row["log"]) if row is not None and row["log"] else []
    entry: dict[str, Any] = {"status": status, "at": db.now_iso()}
    if recorded:
        entry.update(by=recorded.by, location=recorded.location)
    if note:
        entry["note"] = note
    log.append(entry)
    return db.dumps(log)


def _appointment(row: sqlite3.Row) -> dict[str, Any]:
    return Appointment.model_validate(dict(row)).doc()


def _campaign(row: sqlite3.Row) -> dict[str, Any]:
    return Campaign.model_validate(dict(row)).doc()


def patient_assessment(conn: sqlite3.Connection, patient: dict[str, Any], on: date | None = None) -> dict[str, Any]:
    loaded = db.load_record(conn, patient["id"])
    record = loaded[0] if loaded else db.empty_record(patient["id"])
    return assess(patient, record, load_profile(conn, patient["id"]), load_thermographies(conn, patient["id"]), on)


@router.get("/pacientes/{patient_id}/oncologia")
def get_oncology(patient_id: str) -> dict[str, Any]:
    with db.reader() as conn:
        patient = get_patient_or_404(conn, patient_id)
        profile = load_profile(conn, patient_id)
        thermographies = load_thermographies(conn, patient_id)
        loaded = db.load_record(conn, patient_id)
        record = loaded[0] if loaded else db.empty_record(patient_id)
        rows = conn.execute(
            "SELECT a.*, c.name AS campaign_name, c.date AS campaign_date FROM appointments a JOIN campaigns c ON c.id = a.campaign_id WHERE a.patient_id = ? ORDER BY c.date DESC",
            (patient_id,),
        ).fetchall()
    appointments = [{**_appointment(r), "campaign": {"id": r["campaign_id"], "name": r["campaign_name"], "date": r["campaign_date"]}} for r in rows]
    return {
        "profile": profile.doc(),
        "assessment": assess(patient, record, profile, thermographies),
        "thermographies": thermographies,
        "appointments": appointments,
    }


# ── Tamizaje, factores de riesgo y exploración ─────────────────────────────────


@router.put("/pacientes/{patient_id}/oncologia/tamizaje")
def put_screening(patient_id: str, body: Screening) -> dict[str, Any]:
    with db.transaction() as conn:
        get_patient_or_404(conn, patient_id)
        profile = load_profile(conn, patient_id)
        profile.screening = body
        save_profile(conn, patient_id, profile)
    return profile.doc()


@router.put("/pacientes/{patient_id}/oncologia/factores")
def put_risk(patient_id: str, body: RiskFactors) -> dict[str, Any]:
    with db.transaction() as conn:
        get_patient_or_404(conn, patient_id)
        profile = load_profile(conn, patient_id)
        profile.risk = body
        save_profile(conn, patient_id, profile)
    return profile.doc()


@router.post("/pacientes/{patient_id}/oncologia/exploraciones", status_code=201)
def add_breast_exam(patient_id: str, body: BreastExamIn) -> dict[str, Any]:
    exam = BreastExam(**body.model_dump(), id=db.new_id("ex"), at=db.now_iso())
    with db.transaction() as conn:
        get_patient_or_404(conn, patient_id)
        profile = load_profile(conn, patient_id)
        profile.breast_exams.append(exam)
        save_profile(conn, patient_id, profile)
    return exam.doc()


# ── Termografía ─────────────────────────────────────────────────────────────────


@router.post("/pacientes/{patient_id}/oncologia/termografias", status_code=201)
def add_thermography(patient_id: str, body: ThermographyIn) -> dict[str, Any]:
    """
    Registra e interpreta la termografía. En la misma transacción la agrega como estudio con resultado
    en el expediente y, si la paciente tenía cita en la campaña, la marca como atendida.
    """
    grade = overall_grade(body.right.grade, body.left.grade)
    delta = round(abs(body.right.max_temp - body.left.max_temp), 2) if body.right.max_temp is not None and body.left.max_temp is not None else None
    asymmetry = delta is not None and delta >= ASYMMETRY_DELTA
    recommendation = body.recommendation or suggest_recommendation(grade, asymmetry)
    performed_at = db.now_iso()

    with db.transaction() as conn:
        patient = get_patient_or_404(conn, patient_id)
        campaign = None
        if body.campaign_id:
            row = conn.execute("SELECT * FROM campaigns WHERE id = ?", (body.campaign_id,)).fetchone()
            if not row:
                raise HTTPException(404, "La campaña no existe.")
            campaign = _campaign(row)

        loaded = db.load_record(conn, patient_id)
        if not loaded:
            raise HTTPException(404, "El expediente no existe.")
        record, _ = loaded
        study_id = db.new_id("st")
        values = [
            {"analyte": "Mama derecha", "value": f"{body.right.grade} ({GRADE_LABELS[body.right.grade]})" + (f" · máx {body.right.max_temp} °C" if body.right.max_temp is not None else "")},
            {"analyte": "Mama izquierda", "value": f"{body.left.grade} ({GRADE_LABELS[body.left.grade]})" + (f" · máx {body.left.max_temp} °C" if body.left.max_temp is not None else "")},
        ]
        if delta is not None:
            values.append({"analyte": "Diferencia térmica (ΔT)", "value": f"{delta}", "unit": "°C", "range": f"0 – {ASYMMETRY_DELTA - 0.1:.1f}", **({"flag": "alto"} if asymmetry else {})})
        record["studies"].insert(0, {
            "id": study_id, "folio": db.next_folio(conn, "EST"), "name": "Termografía mamaria", "category": "imagen", "priority": "rutina",
            "status": "resultado", "orderedAt": performed_at, "orderedBy": body.performed_by,
            "indication": f"Tamizaje de cáncer de mama{' · ' + campaign['name'] if campaign else ''}",
            "releasedToPatient": False,
            "result": {"at": performed_at, "summary": f"Clasificación global {grade} ({GRADE_LABELS[grade]}). {body.findings}", "values": values, "reportedBy": body.performed_by},
            **({"registered": body.recorded.doc()} if body.recorded else {}),
        })
        db.store_record(conn, patient_id, record, None)

        thermography = Thermography(
            **body.model_dump(exclude={"recommendation"}), id=db.new_id("tg"), folio=db.next_folio(conn, "TER"), patient_id=patient_id,
            performed_at=performed_at, delta_t=delta, grade=grade, asymmetry=asymmetry, recommendation=recommendation, study_id=study_id,
        )
        conn.execute(
            "INSERT INTO thermographies(id, patient_id, campaign_id, data, created_at) VALUES (?,?,?,?,?)",
            (thermography.id, patient_id, body.campaign_id, db.dumps(thermography.doc()), performed_at),
        )
        if campaign:
            row = conn.execute("SELECT * FROM appointments WHERE campaign_id = ? AND patient_id = ? AND status <> 'cancelada'", (campaign["id"], patient["id"])).fetchone()
            if row:
                conn.execute(
                    "UPDATE appointments SET status = 'atendida', completed_at = ?, checked_in_at = COALESCE(checked_in_at, ?), log = ? WHERE id = ?",
                    (performed_at, performed_at, append_log(row, "atendida", body.recorded, f"Termografía {thermography.folio}"), row["id"]),
                )
    return thermography.doc()


@router.post("/termografias/{thermography_id}/imagenes", status_code=201)
async def upload_images(
    thermography_id: str, files: list[UploadFile] = File(...), label: str | None = Form(None), recorded_by: str | None = Form(None), location: str | None = Form(None),
) -> list[dict[str, Any]]:
    with db.reader() as conn:
        row = conn.execute("SELECT patient_id FROM thermographies WHERE id = ?", (thermography_id,)).fetchone()
    if not row:
        raise HTTPException(404, "La termografía no existe.")
    patient_id = row["patient_id"]
    target_dir = FILES_DIR / patient_id
    target_dir.mkdir(parents=True, exist_ok=True)

    saved: list[dict[str, Any]] = []
    written: list[Path] = []
    try:
        for upload in files:
            if upload.content_type not in ALLOWED_IMAGE_TYPES:
                raise HTTPException(415, f"{upload.filename}: solo se aceptan imágenes JPG, PNG, TIFF, BMP o WEBP.")
            content = await upload.read(MAX_UPLOAD_BYTES + 1)
            if len(content) > MAX_UPLOAD_BYTES:
                raise HTTPException(413, f"{upload.filename}: la imagen excede {MAX_UPLOAD_BYTES // (1024 * 1024)} MB.")
            file_id = db.new_id("f")
            suffix = Path(upload.filename or "").suffix.lower()[:6] or ".jpg"
            path = target_dir / f"{file_id}{suffix}"
            path.write_bytes(content)
            written.append(path)
            saved.append({"id": file_id, "name": Path(upload.filename or file_id).name[:200], "content_type": upload.content_type, "size": len(content), "path": str(path.relative_to(FILES_DIR))})

        stamp = db.now_iso()
        recorded = Stamp(at=stamp, by=recorded_by, location=location) if recorded_by and location else None
        if recorded:
            label = f"{label or 'Imagen'} · subió {recorded.by} en {recorded.location}"
        with db.transaction() as conn:
            for f in saved:
                conn.execute(
                    "INSERT INTO files(id, patient_id, owner_id, name, content_type, size, path, label, created_at) VALUES (?,?,?,?,?,?,?,?,?)",
                    (f["id"], patient_id, thermography_id, f["name"], f["content_type"], f["size"], f["path"], label, stamp),
                )
    except BaseException:
        for path in written:
            path.unlink(missing_ok=True)
        raise
    return [FileRef(id=f["id"], name=f["name"], content_type=f["content_type"], size=f["size"], label=label, created_at=stamp).doc() for f in saved]


@router.put("/termografias/{thermography_id}/informe")
def save_thermography_report(thermography_id: str, body: ThermographyReport) -> dict[str, Any]:
    """Guarda qué imágenes (de la misma paciente), qué diagnóstico y qué fecha lleva el informe impreso."""
    if len(set(body.image_ids)) != len(body.image_ids):
        raise HTTPException(422, "Una imagen está repetida en el informe.")
    with db.transaction() as conn:
        row = conn.execute("SELECT patient_id, data FROM thermographies WHERE id = ?", (thermography_id,)).fetchone()
        if not row:
            raise HTTPException(404, "La termografía no existe.")
        for file_id in body.image_ids:
            f = conn.execute("SELECT patient_id, content_type FROM files WHERE id = ?", (file_id,)).fetchone()
            if not f or f["patient_id"] != row["patient_id"] or not f["content_type"].startswith("image/"):
                raise HTTPException(422, "Una de las imágenes no pertenece a esta paciente.")
        data = json.loads(row["data"])
        data["report"] = body.doc()
        conn.execute("UPDATE thermographies SET data = ? WHERE id = ?", (db.dumps(data), thermography_id))
    return data["report"]


@router.get("/archivos/{file_id}")
def get_file(file_id: str) -> FileResponse:
    with db.reader() as conn:
        row = conn.execute("SELECT * FROM files WHERE id = ?", (file_id,)).fetchone()
    if not row:
        raise HTTPException(404, "El archivo no existe.")
    path = (FILES_DIR / row["path"]).resolve()
    if FILES_DIR.resolve() not in path.parents or not path.exists():
        raise HTTPException(404, "El archivo no existe.")
    return FileResponse(path, media_type=row["content_type"], filename=row["name"], content_disposition_type="inline")


# ── Campañas y citas ────────────────────────────────────────────────────────────


@router.get("/campanas")
def list_campaigns() -> list[dict[str, Any]]:
    with db.reader() as conn:
        rows = conn.execute(
            "SELECT c.*, (SELECT count(*) FROM appointments a WHERE a.campaign_id = c.id AND a.status <> 'cancelada') AS total FROM campaigns c ORDER BY c.date DESC"
        ).fetchall()
    return [{**_campaign(r), "total": r["total"]} for r in rows]


@router.post("/campanas", status_code=201)
def create_campaign(body: CampaignIn) -> dict[str, Any]:
    campaign = Campaign(**body.model_dump(), id=db.new_id("cp"), created_at=db.now_iso())
    with db.transaction() as conn:
        conn.execute(
            "INSERT INTO campaigns(id, name, kind, date, location, notes, created_at, recorded) VALUES (?,?,?,?,?,?,?,?)",
            (campaign.id, campaign.name, campaign.kind, campaign.date, campaign.location, campaign.notes, campaign.created_at, db.dumps(campaign.recorded.doc()) if campaign.recorded else None),
        )
    return campaign.doc()


@router.get("/campanas/{campaign_id}")
def get_campaign(campaign_id: str) -> dict[str, Any]:
    """Agenda del día: citas con datos de la paciente, cuestionario, nivel de riesgo y resultado de la termografía."""
    with db.reader() as conn:
        row = conn.execute("SELECT * FROM campaigns WHERE id = ?", (campaign_id,)).fetchone()
        if not row:
            raise HTTPException(404, "La campaña no existe.")
        campaign = _campaign(row)
        on = date.fromisoformat(campaign["date"])
        appointments = []
        for a in conn.execute("SELECT * FROM appointments WHERE campaign_id = ? ORDER BY time, created_at", (campaign_id,)).fetchall():
            patient = get_patient_or_404(conn, a["patient_id"])
            profile = load_profile(conn, patient["id"])
            thermo = conn.execute(
                "SELECT data FROM thermographies WHERE patient_id = ? AND campaign_id = ? ORDER BY created_at DESC LIMIT 1", (patient["id"], campaign_id)
            ).fetchone()
            thermo_data = json.loads(thermo["data"]) if thermo else None
            survey = conn.execute("SELECT id FROM surveys WHERE patient_id = ? AND campaign_id = ? ORDER BY created_at DESC LIMIT 1", (patient["id"], campaign_id)).fetchone()
            appointments.append({
                **_appointment(a),
                "patient": {k: patient.get(k) for k in ("id", "record", "name", "birthDate", "phone", "photo")},
                "screening": profile.screening.doc() if profile.screening else None,
                "assessment": patient_assessment(conn, patient, on),
                "thermography": {k: thermo_data[k] for k in ("id", "folio", "grade", "recommendation", "deltaT", "asymmetry") if k in thermo_data} if thermo_data else None,
                "surveyId": survey["id"] if survey else None,
            })
    active = [a for a in appointments if a["status"] != "cancelada"]
    stats = {status: sum(1 for a in active if a["status"] == status) for status in ("programada", "presente", "atendida", "no-asistio")}
    return {"campaign": campaign, "appointments": appointments, "stats": {"total": len(active), **stats}}


@router.post("/campanas/{campaign_id}/citas", status_code=201)
def schedule(campaign_id: str, body: AppointmentIn) -> dict[str, Any]:
    with db.transaction() as conn:
        if not conn.execute("SELECT 1 FROM campaigns WHERE id = ?", (campaign_id,)).fetchone():
            raise HTTPException(404, "La campaña no existe.")
        get_patient_or_404(conn, body.patient_id)
        existing = conn.execute("SELECT * FROM appointments WHERE campaign_id = ? AND patient_id = ?", (campaign_id, body.patient_id)).fetchone()
        if existing and existing["status"] != "cancelada":
            raise HTTPException(409, f"La paciente ya tiene cita en esta campaña a las {existing['time']}.")
        stamp = db.now_iso()
        status = "presente" if body.origin == "espontanea" else "programada"
        note = "Llegó sin cita" if status == "presente" else f"Agendada a las {body.time}"
        recorded = db.dumps(body.recorded.doc()) if body.recorded else None
        if existing:
            conn.execute(
                "UPDATE appointments SET time = ?, visit = ?, status = ?, origin = ?, notes = ?, checked_in_at = ?, completed_at = NULL, log = ? WHERE id = ?",
                (body.time, body.visit, status, body.origin, body.notes, stamp if status == "presente" else None, append_log(existing, status, body.recorded, note), existing["id"]),
            )
            appointment_id = existing["id"]
        else:
            appointment_id = db.new_id("ct")
            conn.execute(
                "INSERT INTO appointments(id, campaign_id, patient_id, time, visit, status, origin, checked_in_at, notes, created_at, recorded, log) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)",
                (appointment_id, campaign_id, body.patient_id, body.time, body.visit, status, body.origin, stamp if status == "presente" else None, body.notes, stamp,
                 recorded, append_log(None, status, body.recorded, note)),
            )
        return _appointment(conn.execute("SELECT * FROM appointments WHERE id = ?", (appointment_id,)).fetchone())


@router.patch("/citas/{appointment_id}")
def update_appointment(appointment_id: str, body: AppointmentPatch) -> dict[str, Any]:
    with db.transaction() as conn:
        row = conn.execute("SELECT * FROM appointments WHERE id = ?", (appointment_id,)).fetchone()
        if not row:
            raise HTTPException(404, "La cita no existe.")
        changes: dict[str, Any] = body.model_dump(exclude_none=True, exclude={"recorded"})
        stamp = db.now_iso()
        if body.status and body.status != row["status"]:
            changes["log"] = append_log(row, body.status, body.recorded)
        if body.status == "presente":
            changes["checked_in_at"] = row["checked_in_at"] or stamp
        if body.status == "atendida":
            changes["completed_at"] = stamp
            changes["checked_in_at"] = row["checked_in_at"] or stamp
        if body.status == "programada":
            changes["checked_in_at"] = None
            changes["completed_at"] = None
        if changes:
            assignments = ", ".join(f"{column} = ?" for column in changes)
            conn.execute(f"UPDATE appointments SET {assignments} WHERE id = ?", (*changes.values(), appointment_id))
        return _appointment(conn.execute("SELECT * FROM appointments WHERE id = ?", (appointment_id,)).fetchone())


# ── Encuestas ───────────────────────────────────────────────────────────────────


def _survey(row: sqlite3.Row) -> dict[str, Any]:
    return json.loads(row["data"])


@router.post("/pacientes/{patient_id}/encuestas", status_code=201)
def add_survey(patient_id: str, body: SurveyIn) -> dict[str, Any]:
    if not body.answers:
        raise HTTPException(422, "La encuesta no tiene respuestas.")
    survey = Survey(**body.model_dump(), id=db.new_id("en"), patient_id=patient_id, created_at=db.now_iso())
    with db.transaction() as conn:
        get_patient_or_404(conn, patient_id)
        if body.campaign_id and not conn.execute("SELECT 1 FROM campaigns WHERE id = ?", (body.campaign_id,)).fetchone():
            raise HTTPException(404, "La campaña no existe.")
        conn.execute(
            "INSERT INTO surveys(id, patient_id, campaign_id, kind, data, created_at) VALUES (?,?,?,?,?,?)",
            (survey.id, patient_id, body.campaign_id, body.kind, db.dumps(survey.doc()), survey.created_at),
        )
    return survey.doc()


@router.put("/pacientes/{patient_id}/encuestas/{survey_id}")
def edit_survey(patient_id: str, survey_id: str, body: SurveyEdit) -> dict[str, Any]:
    """Corrige las respuestas. Las anteriores quedan en `edits` (con quién, cuándo y dónde), nunca se pierden."""
    if not body.answers:
        raise HTTPException(422, "La encuesta no tiene respuestas.")
    with db.transaction() as conn:
        row = conn.execute("SELECT data FROM surveys WHERE id = ? AND patient_id = ?", (survey_id, patient_id)).fetchone()
        if not row:
            raise HTTPException(404, "La encuesta no existe.")
        if body.campaign_id and not conn.execute("SELECT 1 FROM campaigns WHERE id = ?", (body.campaign_id,)).fetchone():
            raise HTTPException(404, "La campaña no existe.")
        survey = _survey(row)
        edit = {**body.edited.doc(), "previousAnswers": survey["answers"]}
        if survey.get("campaignId"):
            edit["previousCampaignId"] = survey["campaignId"]
        if survey.get("visit"):
            edit["previousVisit"] = survey["visit"]
        survey["answers"] = body.answers
        survey.pop("campaignId", None)
        survey.pop("visit", None)
        if body.campaign_id:
            survey["campaignId"] = body.campaign_id
        if body.visit:
            survey["visit"] = body.visit
        survey["edits"] = [*survey.get("edits", []), edit]
        conn.execute("UPDATE surveys SET data = ?, campaign_id = ? WHERE id = ?", (db.dumps(survey), body.campaign_id, survey_id))
    return survey


@router.get("/pacientes/{patient_id}/encuestas")
def patient_surveys(patient_id: str) -> list[dict[str, Any]]:
    with db.reader() as conn:
        rows = conn.execute("SELECT data FROM surveys WHERE patient_id = ? ORDER BY created_at DESC", (patient_id,)).fetchall()
    return [_survey(r) for r in rows]


@router.get("/encuestas")
def list_surveys(kind: str, campaignId: str | None = None) -> list[dict[str, Any]]:
    """Todas las encuestas de un tipo (opcionalmente de una campaña), para los resultados agregados."""
    sql = "SELECT data FROM surveys WHERE kind = ?" + (" AND campaign_id = ?" if campaignId else "") + " ORDER BY created_at"
    with db.reader() as conn:
        rows = conn.execute(sql, (kind, campaignId) if campaignId else (kind,)).fetchall()
    return [_survey(r) for r in rows]
