"""
Modelos validados de la API. Los nombres viajan en camelCase para coincidir con los tipos de la app web.
"""

from __future__ import annotations

from typing import Any, Literal

from pydantic import BaseModel, ConfigDict, Field, ValidationInfo, field_validator
from pydantic.alias_generators import to_camel


class Camel(BaseModel):
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)

    def doc(self) -> dict[str, Any]:
        return self.model_dump(by_alias=True, exclude_none=True)


class Stamp(Camel):
    """Quién, cuándo y dónde se capturó un registro."""

    at: str
    by: str = Field(min_length=2, max_length=160)
    location: str = Field(min_length=2, max_length=200)


# ── Expediente ──────────────────────────────────────────────────────────────────


class PatientIn(BaseModel):
    """Ficha de identificación. Se validan los campos que la API usa; el resto se conserva tal cual."""

    model_config = ConfigDict(extra="allow")

    name: str = Field(min_length=2, max_length=200)
    firstName: str = Field(min_length=1)
    lastName: str = Field(min_length=1)
    birthDate: str = Field(pattern=r"^\d{4}-\d{2}-\d{2}$")
    sex: Literal["mujer", "hombre", "no-especificado"]
    phone: str
    curp: str | None = None


class ChartSave(BaseModel):
    """Guardado del expediente completo con bloqueo optimista (`version` es la que se leyó)."""

    patient: dict[str, Any] | None = None
    record: dict[str, Any]
    version: int | None = None


class Actor(BaseModel):
    id: str
    name: str
    role: Literal["medico", "enfermeria", "paciente", "contacto", "sistema"]


class AuditIn(BaseModel):
    actor: Actor
    action: Literal["consulta", "acceso", "alta", "modificacion", "firma", "cancelacion"]
    entity: str
    entityId: str
    summary: str = Field(max_length=1000)


# ── Oncología ───────────────────────────────────────────────────────────────────

Answer = Literal["si", "no", "no-sabe"]
ThermalGrade = Literal["TH1", "TH2", "TH3", "TH4", "TH5"]
VascularPattern = Literal["normal", "aumentado", "asimetrico", "anarquico"]
Recommendation = Literal["control-anual", "control-6-meses", "ultrasonido", "mastografia", "valoracion-oncologica"]
AppointmentStatus = Literal["programada", "presente", "atendida", "no-asistio", "cancelada"]
Visit = Literal["primera-vez", "subsecuente"]


class Screening(Camel):
    """Cuestionario de tamizaje (preregistro o en consulta)."""

    family_cancer: Answer | None = None
    previous_mammography: Answer | None = None
    breast_self_exam: Answer | None = None
    recent_blood_chemistry: Answer | None = None
    can_bring_blood_chemistry: Answer | None = None
    blood_chemistry_reason: str | None = Field(default=None, max_length=300)
    source: Literal["preregistro", "consulta"] = "consulta"
    submitted_at: str | None = None
    recorded: Stamp | None = None


class FamilyCancer(Camel):
    relative: str = Field(min_length=1, max_length=60)
    cancer_type: str = Field(min_length=1, max_length=80)
    age_at_diagnosis: int | None = Field(default=None, ge=0, le=110)


FIRST_DEGREE = {"Madre", "Padre", "Hermana", "Hermano", "Hija", "Hijo"}


class RiskFactors(Camel):
    personal_breast_cancer: bool = False
    personal_other_cancer: str | None = Field(default=None, max_length=200)
    family_cancers: list[FamilyCancer] = []
    first_pregnancy_age: int | None = Field(default=None, ge=10, le=60)
    breastfeeding_months: int | None = Field(default=None, ge=0, le=240)
    hormone_therapy: bool = False
    hormone_therapy_detail: str | None = Field(default=None, max_length=200)
    previous_biopsy: bool = False
    atypical_hyperplasia: bool = False
    chest_radiation: bool = False
    known_mutation: str | None = Field(default=None, max_length=80)
    last_mammography: str | None = Field(default=None, pattern=r"^\d{4}-\d{2}-\d{2}$")
    last_mammography_birads: str | None = Field(default=None, max_length=10)
    breast_implants: bool = False
    symptoms: list[str] = []
    notes: str | None = Field(default=None, max_length=1000)
    recorded: Stamp | None = None


class BreastSide(Camel):
    findings: list[str] = []
    quadrant: str | None = Field(default=None, max_length=60)
    size_cm: float | None = Field(default=None, ge=0, le=30)
    axillary_nodes: bool = False
    notes: str | None = Field(default=None, max_length=500)


class BreastExamIn(Camel):
    right: BreastSide
    left: BreastSide
    impression: str | None = Field(default=None, max_length=1000)
    examiner: str = Field(min_length=2, max_length=120)
    recorded: Stamp | None = None


class BreastExam(BreastExamIn):
    id: str
    at: str


class OncologyProfile(Camel):
    screening: Screening | None = None
    risk: RiskFactors | None = None
    breast_exams: list[BreastExam] = []


class ThermalSide(Camel):
    max_temp: float | None = Field(default=None, ge=25, le=42)
    mean_temp: float | None = Field(default=None, ge=25, le=42)
    vascular_pattern: VascularPattern | None = None
    hot_spots: str | None = Field(default=None, max_length=200)
    grade: ThermalGrade


class ThermographyIn(Camel):
    campaign_id: str | None = None
    equipment: str | None = Field(default=None, max_length=120)
    room_temp: float | None = Field(default=None, ge=10, le=35)
    acclimatization_min: int | None = Field(default=None, ge=0, le=60)
    right: ThermalSide
    left: ThermalSide
    findings: str = Field(min_length=3, max_length=4000)
    recommendation: Recommendation | None = None
    recommendation_detail: str | None = Field(default=None, max_length=1000)
    performed_by: str = Field(min_length=2, max_length=120)
    performed_by_license: str | None = Field(default=None, max_length=120)
    recorded: Stamp | None = None


class FileRef(Camel):
    id: str
    name: str
    content_type: str
    size: int
    label: str | None = None
    created_at: str
    recorded: Stamp | None = None


class Thermography(ThermographyIn):
    id: str
    folio: str
    patient_id: str
    performed_at: str
    delta_t: float | None = None
    grade: ThermalGrade
    asymmetry: bool = False
    recommendation: Recommendation
    study_id: str | None = None
    images: list[FileRef] = []


class CampaignIn(Camel):
    name: str = Field(min_length=3, max_length=160)
    kind: Literal["termografia-mamaria"] = "termografia-mamaria"
    date: str = Field(pattern=r"^\d{4}-\d{2}-\d{2}$")
    location: str | None = Field(default=None, max_length=200)
    notes: str | None = Field(default=None, max_length=1000)
    recorded: Stamp | None = None


    @field_validator("recorded", mode="before")
    @classmethod
    def _parse_recorded(cls, value: Any) -> Any:
        import json

        return json.loads(value) if isinstance(value, str) else value


class Campaign(CampaignIn):
    id: str
    created_at: str


class AppointmentIn(Camel):
    patient_id: str
    time: str = Field(pattern=r"^([01]\d|2[0-3]):[0-5]\d$")
    visit: Visit = "primera-vez"
    origin: Literal["preregistro", "agenda", "espontanea"] = "agenda"
    notes: str | None = Field(default=None, max_length=500)
    recorded: Stamp | None = None


class AppointmentPatch(Camel):
    status: AppointmentStatus | None = None
    time: str | None = Field(default=None, pattern=r"^([01]\d|2[0-3]):[0-5]\d$")
    notes: str | None = Field(default=None, max_length=500)
    recorded: Stamp | None = None


class Appointment(Camel):
    id: str
    campaign_id: str
    patient_id: str
    time: str
    visit: Visit
    status: AppointmentStatus
    origin: str
    checked_in_at: str | None = None
    completed_at: str | None = None
    notes: str | None = None
    source: dict[str, Any] | None = None
    created_at: str
    recorded: Stamp | None = None
    log: list[dict[str, Any]] = []

    @field_validator("source", "recorded", "log", mode="before")
    @classmethod
    def _parse_json(cls, value: Any, info: ValidationInfo) -> Any:
        """Las columnas JSON llegan como texto desde SQLite; una bitácora vacía es una lista vacía."""
        import json

        if value is None and info.field_name == "log":
            return []
        return json.loads(value) if isinstance(value, str) else value


# ── Encuestas ───────────────────────────────────────────────────────────────────


def _clean_answers(value: dict[str, str]) -> dict[str, str]:
    if len(value) > 300:
        raise ValueError("Demasiadas respuestas.")
    for key, answer in value.items():
        if len(key) > 60 or len(answer) > 500:
            raise ValueError(f"Respuesta demasiado larga: {key}")
    return {k: v.strip() for k, v in value.items() if v and v.strip()}


class SurveyIn(Camel):
    """Respuestas de un cuestionario. La definición de las preguntas vive en la app web; aquí se guardan tal cual."""

    kind: str = Field(pattern=r"^[a-z0-9-]{3,40}$")
    version: int = Field(ge=1)
    campaign_id: str | None = None
    visit: Visit | None = None
    answers: dict[str, str]
    applied_by: str = Field(min_length=2, max_length=120)
    recorded: Stamp | None = None

    @field_validator("answers")
    @classmethod
    def _check_answers(cls, value: dict[str, str]) -> dict[str, str]:
        return _clean_answers(value)


class Survey(SurveyIn):
    id: str
    patient_id: str
    created_at: str


class SurveyEdit(Camel):
    """Corrección de una encuesta ya guardada. Se conservan quién la aplicó y cuándo; la edición se agrega al historial."""

    campaign_id: str | None = None
    visit: Visit | None = None
    answers: dict[str, str]
    edited: Stamp

    @field_validator("answers")
    @classmethod
    def _check_answers(cls, value: dict[str, str]) -> dict[str, str]:
        return _clean_answers(value)
