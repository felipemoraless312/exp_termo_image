import type { BadgeTone } from '@/components/ui/badge'
import { formatDateTime } from '@/lib/format'
import type { Stamp } from '@/modules/patients/stamp'

/*
 * Oncología: tamizaje de cáncer de mama (NOM-041-SSA2-2011), termografía mamaria y campañas.
 * Los datos y las reglas de orientación viven en la API (`api/app/oncology_rules.py`).
 * La termografía es un estudio complementario: no sustituye a la mastografía.
 */

export type Answer = 'si' | 'no' | 'no-sabe'
export const answers = ['si', 'no', 'no-sabe'] as const
export const answerLabels: Record<Answer, string> = { si: 'Sí', no: 'No', 'no-sabe': 'No sabe' }

export const thermalGrades = ['TH1', 'TH2', 'TH3', 'TH4', 'TH5'] as const
export type ThermalGrade = (typeof thermalGrades)[number]
export const thermalGradeInfo: Record<ThermalGrade, { label: string; tone: BadgeTone }> = {
  TH1: { label: 'Normal no vascular', tone: 'success' },
  TH2: { label: 'Normal vascular', tone: 'success' },
  TH3: { label: 'Dudoso', tone: 'warning' },
  TH4: { label: 'Anormal', tone: 'danger' },
  TH5: { label: 'Muy anormal', tone: 'danger' },
}

export const vascularPatterns = ['normal', 'aumentado', 'asimetrico', 'anarquico'] as const
export type VascularPattern = (typeof vascularPatterns)[number]
export const vascularPatternLabels: Record<VascularPattern, string> = { normal: 'Normal', aumentado: 'Aumentado', asimetrico: 'Asimétrico', anarquico: 'Anárquico' }

export const recommendations = ['control-anual', 'control-6-meses', 'ultrasonido', 'mastografia', 'valoracion-oncologica'] as const
export type Recommendation = (typeof recommendations)[number]
export const recommendationInfo: Record<Recommendation, { label: string; tone: BadgeTone }> = {
  'control-anual': { label: 'Control anual', tone: 'success' },
  'control-6-meses': { label: 'Control en 6 meses', tone: 'accent' },
  ultrasonido: { label: 'Ultrasonido mamario complementario', tone: 'warning' },
  mastografia: { label: 'Mastografía', tone: 'warning' },
  'valoracion-oncologica': { label: 'Valoración oncológica', tone: 'danger' },
}

export type RiskLevel = 'alto' | 'intermedio' | 'habitual'
export const riskLevelInfo: Record<RiskLevel, { label: string; tone: BadgeTone }> = {
  alto: { label: 'Riesgo alto', tone: 'danger' },
  intermedio: { label: 'Riesgo intermedio', tone: 'warning' },
  habitual: { label: 'Riesgo habitual', tone: 'success' },
}

export const appointmentStatuses = ['programada', 'presente', 'atendida', 'no-asistio', 'cancelada'] as const
export type AppointmentStatus = (typeof appointmentStatuses)[number]
export const appointmentStatusInfo: Record<AppointmentStatus, { label: string; tone: BadgeTone }> = {
  programada: { label: 'Pendiente', tone: 'neutral' },
  presente: { label: 'En espera', tone: 'accent' },
  atendida: { label: 'Atendida', tone: 'success' },
  'no-asistio': { label: 'No asistió', tone: 'warning' },
  cancelada: { label: 'Cancelada', tone: 'neutral' },
}

export const visits = ['primera-vez', 'subsecuente'] as const
export type Visit = (typeof visits)[number]
export const visitLabels: Record<Visit, string> = { 'primera-vez': 'Primera vez', subsecuente: 'Subsecuente' }

export const appointmentOrigins = ['preregistro', 'agenda', 'espontanea'] as const
export const appointmentOriginLabels: Record<(typeof appointmentOrigins)[number], string> = { preregistro: 'Preregistro', agenda: 'Agendada', espontanea: 'Sin cita' }

// ── Catálogos de captura ────────────────────────────────────────────────────────

export const breastFindings = [
  'Sin alteraciones', 'Masa palpable', 'Engrosamiento', 'Retracción del pezón', 'Secreción por el pezón', 'Piel de naranja', 'Eritema',
  'Ulceración', 'Asimetría', 'Dolor a la palpación',
] as const

export const breastSymptoms = [
  'Bolita o masa en la mama', 'Dolor mamario', 'Secreción por el pezón', 'Hundimiento del pezón', 'Cambios en la piel de la mama',
  'Bolita en la axila', 'Cambio de tamaño o forma',
] as const

export const breastQuadrants = ['Superior externo', 'Superior interno', 'Inferior externo', 'Inferior interno', 'Retroareolar', 'Prolongación axilar'] as const

export const cancerRelatives = ['Madre', 'Hermana', 'Hija', 'Padre', 'Hermano', 'Hijo', 'Abuela materna', 'Abuela paterna', 'Tía materna', 'Tía paterna', 'Prima', 'Otro'] as const
export const cancerTypes = ['Cáncer de mama', 'Cáncer de ovario', 'Cáncer cervicouterino', 'Cáncer de endometrio', 'Cáncer de colon', 'Cáncer de próstata', 'Cáncer de páncreas', 'Leucemia o linfoma', 'Otro cáncer'] as const

// ── Modelo ──────────────────────────────────────────────────────────────────────

export interface Screening {
  familyCancer?: Answer
  previousMammography?: Answer
  breastSelfExam?: Answer
  recentBloodChemistry?: Answer
  canBringBloodChemistry?: Answer
  bloodChemistryReason?: string
  source: 'preregistro' | 'consulta'
  submittedAt?: string
  recorded?: Stamp
}

export interface FamilyCancer { relative: string; cancerType: string; ageAtDiagnosis?: number }

export interface RiskFactors {
  personalBreastCancer: boolean
  personalOtherCancer?: string
  familyCancers: FamilyCancer[]
  firstPregnancyAge?: number
  breastfeedingMonths?: number
  hormoneTherapy: boolean
  hormoneTherapyDetail?: string
  previousBiopsy: boolean
  atypicalHyperplasia: boolean
  chestRadiation: boolean
  knownMutation?: string
  lastMammography?: string
  lastMammographyBirads?: string
  breastImplants: boolean
  symptoms: string[]
  notes?: string
  recorded?: Stamp
}

export interface BreastSide { findings: string[]; quadrant?: string; sizeCm?: number; axillaryNodes: boolean; notes?: string }

export interface BreastExam { id: string; at: string; examiner: string; right: BreastSide; left: BreastSide; impression?: string; recorded?: Stamp }

export interface OncologyProfile { screening?: Screening; risk?: RiskFactors; breastExams: BreastExam[] }

export interface ThermalSide { maxTemp?: number; meanTemp?: number; vascularPattern?: VascularPattern; hotSpots?: string; grade: ThermalGrade }

export interface FileRef { id: string; name: string; contentType: string; size: number; label?: string; createdAt: string }

export interface Thermography {
  id: string
  folio: string
  patientId: string
  campaignId?: string
  performedAt: string
  performedBy: string
  performedByLicense?: string
  equipment?: string
  roomTemp?: number
  acclimatizationMin?: number
  right: ThermalSide
  left: ThermalSide
  deltaT?: number
  asymmetry: boolean
  grade: ThermalGrade
  findings: string
  recommendation: Recommendation
  recommendationDetail?: string
  studyId?: string
  images: FileRef[]
  recorded?: Stamp
}

export interface Assessment {
  age: number
  level: RiskLevel
  factors: { level: 'alto' | 'moderado' | 'informativo'; label: string }[]
  recommendations: string[]
  mammographyDue: boolean
  symptomatic: boolean
}

export interface Campaign { id: string; name: string; kind: 'termografia-mamaria'; date: string; location?: string; notes?: string; createdAt: string; total?: number; recorded?: Stamp }

/** Cambio de estado de una cita: fecha y hora, quién lo hizo y en qué sede. */
export interface AppointmentLogEntry { status: AppointmentStatus; at: string; by?: string; location?: string; note?: string }

export interface Appointment {
  id: string
  campaignId: string
  patientId: string
  time: string
  visit: Visit
  status: AppointmentStatus
  origin: (typeof appointmentOrigins)[number]
  checkedInAt?: string
  completedAt?: string
  notes?: string
  createdAt: string
  recorded?: Stamp
  log?: AppointmentLogEntry[]
}

export interface OncologyChart {
  profile: OncologyProfile
  assessment: Assessment
  thermographies: Thermography[]
  appointments: (Appointment & { campaign: Pick<Campaign, 'id' | 'name' | 'date'> })[]
}

export interface AgendaItem extends Appointment {
  patient: { id: string; record: string; name: string; birthDate: string; phone: string; photo?: string }
  screening?: Screening
  assessment: Assessment
  thermography?: Pick<Thermography, 'id' | 'folio' | 'grade' | 'recommendation' | 'deltaT' | 'asymmetry'>
  surveyId?: string
}

export interface CampaignAgenda {
  campaign: Campaign
  appointments: AgendaItem[]
  stats: { total: number; programada: number; presente: number; atendida: number; 'no-asistio': number }
}

/** Avisos rápidos del cuestionario para la agenda de la campaña. */
export function screeningFlags(screening?: Screening, age?: number): { label: string; tone: BadgeTone }[] {
  if (!screening) return []
  const flags: { label: string; tone: BadgeTone }[] = []
  if (screening.familyCancer === 'si') flags.push({ label: 'Familiar con cáncer', tone: 'warning' })
  if (screening.familyCancer === 'no-sabe') flags.push({ label: 'Antecedente familiar desconocido', tone: 'neutral' })
  if (screening.previousMammography === 'no') flags.push({ label: age !== undefined && age >= 40 ? 'Nunca se ha hecho mastografía' : 'Sin mastografía previa', tone: age !== undefined && age >= 40 ? 'warning' : 'neutral' })
  if (screening.breastSelfExam === 'no') flags.push({ label: 'No se autoexplora', tone: 'neutral' })
  if (screening.recentBloodChemistry === 'no') flags.push({ label: screening.canBringBloodChemistry === 'no' ? 'Sin química sanguínea (no puede traerla)' : 'Traerá química sanguínea', tone: screening.canBringBloodChemistry === 'no' ? 'warning' : 'neutral' })
  return flags
}

const logLabels: Record<AppointmentStatus, string> = {
  programada: 'Cita pendiente', presente: 'Llegada registrada', atendida: 'Atendida', 'no-asistio': 'Marcada como no asistió', cancelada: 'Cancelada',
}

/** "Llegada registrada · 7 oct 2026, 10:02 · Dr. Francisco · Universidad Politécnica de Chiapas" */
export function formatLogEntry(entry: AppointmentLogEntry): string {
  return [entry.note ?? logLabels[entry.status], formatDateTime(entry.at), entry.by, entry.location].filter(Boolean).join(' · ')
}
