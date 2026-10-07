import 'server-only'

import { api, apiMaybe } from '@/lib/server/api'
import type { ClinicalRecord, Patient } from './types'

/*
 * Acceso crudo a los datos, sin autorización. Los datos viven en la API del expediente (FastAPI + SQLite, carpeta `api/`).
 * Solo `data.ts`, `actions.ts`, `auth/session.ts` y el módulo de oncología deben importar este archivo.
 * Los pacientes de demostración anteriores quedaron en `respaldo-datos-demo.ts.txt`.
 */

const segment = encodeURIComponent

export async function findPatientById(id: string): Promise<Patient | undefined> {
  return apiMaybe<Patient>(`/pacientes/${segment(id)}`)
}

export async function findPatientByRecord(record: string): Promise<Patient | undefined> {
  const value = record.trim()
  return value ? apiMaybe<Patient>(`/pacientes/por-expediente/${segment(value)}`) : undefined
}

export async function findPatientByCurp(curp: string): Promise<Patient | undefined> {
  return apiMaybe<Patient>(`/pacientes/por-curp/${segment(curp)}`)
}

/** Búsqueda sin distinguir mayúsculas ni acentos ("maria" encuentra "María"), ordenada por nombre. */
export async function searchPatients(query?: string): Promise<Patient[]> {
  const q = query?.trim()
  return api<Patient[]>(`/pacientes${q ? `?q=${segment(q)}` : ''}`)
}

/** Abre el expediente: la API asigna el id y el número de expediente consecutivo. */
export async function insertPatient(data: Omit<Patient, 'id' | 'record' | 'createdAt'>): Promise<Patient> {
  return api<Patient>('/pacientes', { method: 'POST', body: data })
}

export async function updatePatient(id: string, update: (patient: Patient) => void): Promise<Patient | undefined> {
  const patient = await findPatientById(id)
  if (!patient) return undefined
  update(patient)
  return api<Patient>(`/pacientes/${segment(id)}`, { method: 'PUT', body: patient })
}

export async function findRecordByPatientId(patientId: string): Promise<ClinicalRecord | undefined> {
  return apiMaybe<ClinicalRecord>(`/expedientes/${segment(patientId)}`)
}

/**
 * Guarda la ficha y el expediente en una sola transacción. Si alguien más lo modificó después de leerlo,
 * la API responde 409 y la acción muestra el mensaje para recargar.
 */
export async function saveChart(patient: Patient, record?: ClinicalRecord): Promise<void> {
  const current = record ?? (await findRecordByPatientId(patient.id))
  if (!current) throw new Error('El expediente no existe.')
  const { version } = await api<{ version: number }>(`/expedientes/${segment(patient.id)}`, {
    method: 'PUT',
    body: { patient, record: current, version: current.version },
  })
  current.version = version
}

export async function listRecords(): Promise<ClinicalRecord[]> {
  return api<ClinicalRecord[]>('/expedientes')
}

/** Folio consecutivo legible (`REC-0001`, `EST-0001`), único aunque se reinicie el servidor. */
export async function nextFolio(prefix: string, width = 4): Promise<string> {
  return (await api<{ folio: string }>(`/folios/${segment(prefix)}?width=${width}`, { method: 'POST' })).folio
}
