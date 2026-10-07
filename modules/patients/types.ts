import type { BadgeTone } from '@/components/ui/badge'
import type { AllergyKind, AllergySeverity, BloodType, MriSafety, Sex, StudyCategory } from '@/modules/catalogs/clinical'
import type { NoteType } from './note-templates'
import type { Stamp } from './stamp'

export type { Stamp } from './stamp'

/*
 * Modelo del expediente clínico electrónico, organizado según la NOM-004-SSA3-2012:
 * ficha de identificación, historia clínica (antecedentes), notas médicas, signos vitales,
 * tratamiento, auxiliares de diagnóstico, consentimientos y documentos.
 * Las notas firmadas son inalterables; las correcciones se agregan como adendas.
 * Cada registro guarda `registered` (fecha y hora, quién y sede) y, si cambia de estado, `updated`.
 */

export type PatientStatus = 'activo' | 'seguimiento' | 'hospitalizado' | 'alta' | 'inactivo'

export const patientStatus: Record<PatientStatus, { label: string; tone: BadgeTone }> = {
  activo: { label: 'Activo', tone: 'accent' },
  seguimiento: { label: 'En seguimiento', tone: 'accent' },
  hospitalizado: { label: 'Hospitalizado', tone: 'warning' },
  alta: { label: 'Alta', tone: 'success' },
  inactivo: { label: 'Inactivo', tone: 'neutral' },
}
export const patientStatuses = Object.keys(patientStatus) as PatientStatus[]

export interface Allergy {
  id: string
  agent: string
  kind: AllergyKind
  reaction: string
  severity: AllergySeverity
  recordedAt: string
  registered?: Stamp
}

export interface Address {
  street: string
  neighborhood: string
  municipality: string
  state: string
  zip: string
}

export interface Contact {
  name: string
  relationship: string
  phone: string
}

/** Ficha de identificación. El número de expediente no cambia nunca (NOM-024). */
export interface Patient {
  id: string
  record: string
  name: string
  firstName: string
  lastName: string
  secondLastName?: string
  curp?: string
  birthDate: string
  birthPlace?: string
  sex: Sex
  maritalStatus?: string
  occupation?: string
  education?: string
  religion?: string
  indigenousLanguage?: string
  phone: string
  email?: string
  address: Address
  insurance: { type: string; policy?: string }
  emergencyContact: Contact
  legalGuardian?: Contact
  bloodType: BloodType
  status: PatientStatus
  photo?: string
  allergies: Allergy[]
  createdAt: string
  /** Alta del expediente: cuándo, quién y en qué sede. */
  registered?: Stamp
  /** Última actualización de la ficha (por la clínica o por la paciente desde el portal). */
  updated?: Stamp
}

// ── Historia clínica ────────────────────────────────────────────────────────────

export interface FamilyHistoryItem { id: string; relative: string; condition: string; notes?: string; registered?: Stamp }
export interface SurgeryItem { id: string; procedure: string; date: string; hospital?: string; complications?: string; registered?: Stamp }
export interface HospitalizationItem { id: string; reason: string; date: string; days?: number; registered?: Stamp }
export interface Immunization { id: string; vaccine: string; dose: string; date: string; lot?: string; registered?: Stamp }

export type SmokingStatus = 'nunca' | 'exfumador' | 'actual'
export type AlcoholUse = 'no' | 'ocasional' | 'frecuente'

export interface NonPathologicalHistory {
  smoking: SmokingStatus
  cigarettesPerDay?: number
  smokingYears?: number
  alcohol: AlcoholUse
  alcoholDetail?: string
  drugs?: string
  physicalActivity?: string
  diet?: string
  sleep?: string
  housing?: string
  zoonosis?: string
}

export interface GynecoObstetricHistory {
  menarche?: number
  cycles?: string
  lastMenstrualPeriod?: string
  sexualOnset?: number
  pregnancies?: number
  births?: number
  cesareans?: number
  abortions?: number
  contraception?: string
  lastPap?: string
  lastMammography?: string
  menopause?: number
}

export interface ClinicalHistory {
  family: FamilyHistoryItem[]
  surgeries: SurgeryItem[]
  hospitalizations: HospitalizationItem[]
  transfusions?: string
  traumas?: string
  nonPathological: NonPathologicalHistory
  gynecoObstetric?: GynecoObstetricHistory
  immunizations: Immunization[]
  /** Última actualización de los antecedentes. */
  updated?: Stamp
}

// ── Lista de problemas y diagnósticos (CIE-10) ──────────────────────────────────

export type ProblemStatus = 'activo' | 'controlado' | 'resuelto'
export const problemStatus: Record<ProblemStatus, { label: string; tone: BadgeTone }> = {
  activo: { label: 'Activo', tone: 'warning' },
  controlado: { label: 'Controlado', tone: 'accent' },
  resuelto: { label: 'Resuelto', tone: 'neutral' },
}

export interface Diagnosis { code?: string; description: string }

export interface Problem extends Diagnosis {
  id: string
  kind: 'cronico' | 'agudo'
  status: ProblemStatus
  since: string
  notes?: string
  registered?: Stamp
  updated?: Stamp
}

// ── Signos vitales ──────────────────────────────────────────────────────────────

export type Consciousness = 'A' | 'C' | 'V' | 'P' | 'U'
export const consciousnessLabels: Record<Consciousness, string> = {
  A: 'Alerta', C: 'Confusión de reciente inicio', V: 'Responde a la voz', P: 'Responde al dolor', U: 'No responde',
}

export interface VitalSigns {
  id: string
  takenAt: string
  systolic?: number
  diastolic?: number
  heartRate?: number
  respiratoryRate?: number
  temperature?: number
  spo2?: number
  onOxygen: boolean
  consciousness: Consciousness
  glucose?: number
  weight?: number
  height?: number
  pain?: number
  notes?: string
  recordedBy: string
  registered?: Stamp
}

// ── Tratamiento ─────────────────────────────────────────────────────────────────

export type MedicationStatus = 'activo' | 'suspendido' | 'concluido'
export const medicationStatus: Record<MedicationStatus, { label: string; tone: BadgeTone }> = {
  activo: { label: 'Activo', tone: 'accent' },
  suspendido: { label: 'Suspendido', tone: 'danger' },
  concluido: { label: 'Concluido', tone: 'neutral' },
}

export interface Medication {
  id: string
  name: string
  dose: string
  route: string
  frequency: string
  duration: string
  quantity?: number
  instructions?: string
  startDate: string
  status: MedicationStatus
  prescribedBy: string
  prescriptionFolio: string
  statusReason?: string
  registered?: Stamp
  updated?: Stamp
}

// ── Notas médicas ───────────────────────────────────────────────────────────────

export interface Addendum { at: string; author: string; text: string; location?: string }

export interface ClinicalNote {
  id: string
  type: NoteType
  createdAt: string
  author: string
  authorRole: string
  authorLicense?: string
  sections: Record<string, string>
  diagnoses: Diagnosis[]
  prognosis?: string
  vitalsId?: string
  /** Firma electrónica simple: SHA-256 del contenido al momento de firmar. */
  signature: { at: string; hash: string }
  addenda: Addendum[]
  registered?: Stamp
}

// ── Auxiliares de diagnóstico ───────────────────────────────────────────────────

export type StudyStatus = 'solicitado' | 'en-proceso' | 'resultado' | 'cancelado'
export const studyStatus: Record<StudyStatus, { label: string; tone: BadgeTone }> = {
  solicitado: { label: 'Solicitado', tone: 'warning' },
  'en-proceso': { label: 'En proceso', tone: 'accent' },
  resultado: { label: 'Con resultado', tone: 'success' },
  cancelado: { label: 'Cancelado', tone: 'neutral' },
}

export interface LabValue { analyte: string; value: string; unit?: string; range?: string; flag?: 'alto' | 'bajo' }

export interface Study {
  id: string
  folio: string
  name: string
  category: StudyCategory
  priority: 'rutina' | 'urgente'
  status: StudyStatus
  orderedAt: string
  orderedBy: string
  indication?: string
  result?: { at: string; summary: string; values: LabValue[]; reportedBy: string }
  releasedToPatient: boolean
  registered?: Stamp
  updated?: Stamp
}

// ── Dispositivos médicos implantados ────────────────────────────────────────────

export interface ImplantedDevice {
  id: string
  type: string
  brand: string
  model?: string
  serial?: string
  site: string
  implantedAt: string
  mriSafety: MriSafety
  notes?: string
  registered?: Stamp
}

// ── Consentimientos y documentos ────────────────────────────────────────────────

export interface Consent {
  id: string
  procedure: string
  risks: string
  benefits: string
  alternatives?: string
  signedAt: string
  signer: 'paciente' | 'representante'
  signerName: string
  witnesses: string[]
  physician: string
  status: 'vigente' | 'revocado'
  registered?: Stamp
  updated?: Stamp
}

export interface ClinicalDocument { id: string; name: string; kind: string; date: string; registered?: Stamp }

export interface ClinicalRecord {
  patientId: string
  /** Versión que entrega la API; se devuelve al guardar para detectar ediciones simultáneas. */
  version?: number
  history: ClinicalHistory
  problems: Problem[]
  vitals: VitalSigns[]
  medications: Medication[]
  notes: ClinicalNote[]
  studies: Study[]
  devices: ImplantedDevice[]
  consents: Consent[]
  documents: ClinicalDocument[]
}
