import 'server-only'

import { cache } from 'react'
import { redirect } from 'next/navigation'

import { requirePortalViewer, requireStaff, type PortalViewer } from '@/modules/auth/session'
import { audit, readAuditEvents, type AuditEvent } from '@/modules/audit/log'
import * as repository from './repository'
import type { ClinicalNote, ClinicalRecord, Patient, Study } from './types'

export type { ClinicalRecord, Patient } from './types'

/*
 * Data Access Layer de pacientes: cada función verifica sesión y permiso antes de leer.
 * Las consultas al expediente quedan registradas en la bitácora (NOM-024-SSA3-2012).
 */

export async function listPatients(query?: string): Promise<Patient[]> {
  await requireStaff('patients')
  return repository.searchPatients(query)
}

export async function getPatient(id: string): Promise<Patient | undefined> {
  await requireStaff('patients')
  return repository.findPatientById(id)
}

/** `cache` evita registrar dos consultas cuando la página y sus metadatos leen el mismo expediente. */
export const getPatientChart = cache(async (id: string): Promise<{ patient: Patient; record: ClinicalRecord } | null> => {
  const user = await requireStaff('record')
  const [patient, record] = await Promise.all([repository.findPatientById(id), repository.findRecordByPatientId(id)])
  if (!patient || !record) return null
  audit(user, 'consulta', 'Expediente', patient.id, `Consultó el expediente ${patient.record}`)
  return { patient, record }
})

export type NoteWithPatient = ClinicalNote & { patient: Patient }

export async function listRecentNotes(limit = 20): Promise<NoteWithPatient[]> {
  await requireStaff('consultations')
  const [patients, records] = await Promise.all([repository.searchPatients(), repository.listRecords()])
  return records
    .flatMap((record) => record.notes.map((note) => ({ ...note, patient: patients.find((p) => p.id === record.patientId)! })))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, limit)
}

export type StudyWithPatient = Study & { patient: Patient }

/** Estudios solicitados o en proceso de todos los pacientes, urgentes primero. */
export async function listPendingStudies(): Promise<StudyWithPatient[]> {
  await requireStaff('record')
  const [patients, records] = await Promise.all([repository.searchPatients(), repository.listRecords()])
  return records
    .flatMap((record) => record.studies.map((study) => ({ ...study, patient: patients.find((p) => p.id === record.patientId)! })))
    .filter((study) => study.status === 'solicitado' || study.status === 'en-proceso')
    .sort((a, b) => (a.priority === b.priority ? b.orderedAt.localeCompare(a.orderedAt) : a.priority === 'urgente' ? -1 : 1))
}

/** Pacientes con signos vitales registrados en las últimas 24 h (para detectar alertas en el tablero). */
export async function listLatestVitals(): Promise<{ patient: Patient; vitals: ClinicalRecord['vitals'][number] }[]> {
  await requireStaff('record')
  const since = new Date(Date.now() - 24 * 3_600_000).toISOString()
  const [patients, records] = await Promise.all([repository.searchPatients(), repository.listRecords()])
  return records.flatMap((record) => {
    const latest = record.vitals.at(-1)
    const patient = patients.find((p) => p.id === record.patientId)
    return latest && patient && latest.takenAt >= since ? [{ patient, vitals: latest }] : []
  })
}

/** Actividad reciente de todo el sistema (bitácora): qué se registró, cuándo y quién. */
export async function listRecentActivity(limit = 8): Promise<AuditEvent[]> {
  await requireStaff('audit')
  return (await readAuditEvents({ limit: limit * 3 })).filter((e) => e.action !== 'consulta').slice(0, limit)
}

/** Bitácora de un expediente: consultas del médico, accesos de contactos y cambios de autorizaciones. */
export async function listRecordEvents(patientId: string, limit = 100): Promise<AuditEvent[]> {
  await requireStaff('audit')
  return readAuditEvents({ entityId: patientId, limit })
}

// ── Portal ──────────────────────────────────────────────────────────────────────

/** Apartados del portal que exigen acceso al expediente completo (no solo a la información de emergencia). */
export type PortalSection = 'historial' | 'consultas' | 'estudios' | 'documentos'

export function canSeeFullRecord(viewer: PortalViewer): boolean {
  return viewer.kind === 'paciente' || viewer.contact.scope === 'completo'
}

/**
 * Expediente visible en el portal para el paciente o su contacto autorizado: solo lo que el médico ha liberado.
 * Las notas de enfermería son registros operativos internos y no se muestran.
 */
export const getPortalChart = cache(async (section?: PortalSection): Promise<{ viewer: PortalViewer; patient: Patient; record: ClinicalRecord }> => {
  const viewer = await requirePortalViewer()
  if (section && !canSeeFullRecord(viewer)) redirect('/portal')

  const { patient } = viewer
  const record = await repository.findRecordByPatientId(patient.id)
  if (!record) throw new Error('Expediente no encontrado')

  if (viewer.kind === 'contacto') {
    const { contact } = viewer
    audit({ id: contact.id, name: contact.name, role: 'contacto' }, 'consulta', 'Expediente', patient.id, `${contact.name} consultó ${section ?? 'el resumen del expediente'} desde el portal`)
  }

  return {
    viewer,
    patient,
    record: {
      ...record,
      notes: record.notes.filter((note) => note.type !== 'enfermeria'),
      studies: record.studies.filter((s) => s.releasedToPatient && s.status === 'resultado'),
    },
  }
})
