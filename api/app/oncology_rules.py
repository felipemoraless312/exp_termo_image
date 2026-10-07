"""
Reglas de orientación para el tamizaje de cáncer de mama.

No es un modelo de riesgo validado (Gail, Tyrer-Cuzick): agrupa los factores reconocidos por la
NOM-041-SSA2-2011 y las guías de tamizaje en tres niveles para priorizar la atención en la campaña.
La decisión final es siempre del médico; la termografía es complementaria y no sustituye a la mastografía.
"""

from __future__ import annotations

from datetime import date
from typing import Any

from .schemas import FIRST_DEGREE, OncologyProfile

GRADE_ORDER = ["TH1", "TH2", "TH3", "TH4", "TH5"]
ASYMMETRY_DELTA = 1.0  # °C entre regiones homólogas
BREAST_OR_OVARY = ("mama", "ovario")


def age_on(birth_date: str, on: date | None = None) -> int:
    on = on or date.today()
    born = date.fromisoformat(birth_date)
    return on.year - born.year - ((on.month, on.day) < (born.month, born.day))


def _years_since(iso: str | None, on: date) -> float | None:
    if not iso:
        return None
    return (on - date.fromisoformat(iso[:10])).days / 365.25


def overall_grade(right: str, left: str) -> str:
    return max(right, left, key=GRADE_ORDER.index)


def suggest_recommendation(grade: str, asymmetry: bool) -> str:
    if grade in ("TH4", "TH5"):
        return "valoracion-oncologica"
    if grade == "TH3":
        return "ultrasonido"
    return "control-6-meses" if asymmetry else "control-anual"


def assess(patient: dict[str, Any], record: dict[str, Any], profile: OncologyProfile, thermographies: list[dict[str, Any]], on: date | None = None) -> dict[str, Any]:
    on = on or date.today()
    age = age_on(patient["birthDate"], on)
    gyn = (record.get("history") or {}).get("gynecoObstetric") or {}
    screening = profile.screening
    risk = profile.risk
    factors: list[dict[str, str]] = []
    recommendations: list[str] = []

    def add(level: str, label: str) -> None:
        factors.append({"level": level, "label": label})

    # Antecedentes personales y genéticos
    if risk:
        if risk.personal_breast_cancer:
            add("alto", "Antecedente personal de cáncer de mama")
        if risk.known_mutation:
            add("alto", f"Mutación conocida: {risk.known_mutation}")
        if risk.chest_radiation:
            add("alto", "Radioterapia previa en tórax")
        if risk.atypical_hyperplasia:
            add("alto", "Hiperplasia atípica o carcinoma lobulillar in situ en biopsia previa")
        elif risk.previous_biopsy:
            add("moderado", "Biopsia de mama previa")
        if risk.personal_other_cancer:
            add("moderado", f"Antecedente personal de cáncer: {risk.personal_other_cancer}")
        if risk.hormone_therapy:
            add("moderado", "Terapia hormonal de reemplazo")
        if risk.breast_implants:
            add("informativo", "Implantes mamarios (puede alterar la imagen térmica y mastográfica)")

        # Antecedentes familiares
        relevant = [f for f in risk.family_cancers if any(word in f.cancer_type.lower() for word in BREAST_OR_OVARY)]
        first_degree = [f for f in relevant if f.relative in FIRST_DEGREE]
        if len(first_degree) >= 2:
            add("alto", "Dos o más familiares de primer grado con cáncer de mama u ovario")
        elif any(f.age_at_diagnosis is not None and f.age_at_diagnosis < 50 for f in first_degree):
            add("alto", "Familiar de primer grado con cáncer de mama u ovario antes de los 50 años")
        elif any(f.relative in ("Padre", "Hermano", "Hijo") and "mama" in f.cancer_type.lower() for f in relevant):
            add("alto", "Familiar varón con cáncer de mama")
        elif first_degree:
            add("moderado", "Familiar de primer grado con cáncer de mama u ovario")
        elif relevant:
            add("moderado", "Familiar de segundo grado con cáncer de mama u ovario")
        others = [f for f in risk.family_cancers if f not in relevant]
        if others:
            add("informativo", "Otros cánceres en la familia: " + ", ".join(f"{f.cancer_type} ({f.relative.lower()})" for f in others))
    if screening and screening.family_cancer == "si" and not (risk and risk.family_cancers):
        add("moderado", "Refiere familiar con cáncer (sin detallar parentesco ni tipo)")

    # Factores hormonales y reproductivos (de la historia gineco-obstétrica)
    if gyn.get("menarche") is not None and gyn["menarche"] < 12:
        add("informativo", f"Menarca temprana ({gyn['menarche']} años)")
    if gyn.get("menopause") is not None and gyn["menopause"] > 55:
        add("informativo", f"Menopausia tardía ({gyn['menopause']} años)")
    if gyn.get("pregnancies") == 0 and age >= 30:
        add("informativo", "Nuligesta")
    elif risk and risk.first_pregnancy_age and risk.first_pregnancy_age > 30:
        add("informativo", f"Primer embarazo después de los 30 años ({risk.first_pregnancy_age})")

    # Síntomas y exploración: requieren estudio diagnóstico, no de tamizaje
    exam = profile.breast_exams[-1] if profile.breast_exams else None
    abnormal_exam = bool(exam and any(f != "Sin alteraciones" for side in (exam.right, exam.left) for f in side.findings))
    if exam and (exam.right.axillary_nodes or exam.left.axillary_nodes):
        abnormal_exam = True
    symptoms = risk.symptoms if risk else []
    if symptoms or abnormal_exam:
        recommendations.append("Síntomas o exploración anormal: estudio diagnóstico (mastografía y/o ultrasonido) y valoración médica, independientemente de la termografía.")

    last_thermo = thermographies[0] if thermographies else None
    if last_thermo and last_thermo["grade"] in ("TH4", "TH5"):
        recommendations.append(f"Termografía {last_thermo['grade']}: referir a valoración oncológica con mastografía diagnóstica y ultrasonido.")
    elif last_thermo and last_thermo["grade"] == "TH3":
        recommendations.append("Termografía TH3: complementar con ultrasonido mamario y/o mastografía.")

    # Mastografía de tamizaje (NOM-041-SSA2-2011: cada 2 años entre 40 y 69 años)
    last_mammo = (risk.last_mammography if risk else None) or gyn.get("lastMammography")
    since = _years_since(last_mammo, on)
    never = screening is not None and screening.previous_mammography == "no" and not last_mammo
    mammography_due = 40 <= age <= 69 and (never or since is None or since >= 2)
    if mammography_due:
        detail = "nunca se ha realizado una" if never else ("no hay fecha registrada de la última" if since is None else f"la última fue hace {since:.0f} años")
        recommendations.append(f"Mastografía de tamizaje: tiene {age} años y {detail} (NOM-041: cada 2 años de 40 a 69 años).")

    level = "alto" if any(f["level"] == "alto" for f in factors) else "intermedio" if any(f["level"] == "moderado" for f in factors) else "habitual"
    if level == "alto":
        recommendations.append("Riesgo alto: valoración por oncología o clínica de mama y considerar asesoría genética.")
        if age < 40:
            recommendations.append("Menor de 40 años con riesgo alto: el tamizaje se individualiza (mastografía o resonancia según especialista).")
    if screening and screening.breast_self_exam == "no":
        recommendations.append("No se autoexplora: enseñar la autoexploración mensual (7 a 10 días después de la menstruación).")
    if screening and screening.recent_blood_chemistry == "no":
        recommendations.append("Sin química sanguínea reciente: solicitarla o registrar el resultado si la trae.")

    return {
        "age": age,
        "level": level,
        "factors": factors,
        "recommendations": recommendations,
        "mammographyDue": mammography_due,
        "symptomatic": bool(symptoms or abnormal_exam),
    }
