import 'server-only'

import { api } from '@/lib/server/api'
import type { PatientFile } from './types'

/* Acceso crudo a los archivos del expediente (API), sin verificar sesión. */

const segment = encodeURIComponent

export async function listPatientFiles(patientId: string): Promise<PatientFile[]> {
  return api(`/pacientes/${segment(patientId)}/archivos`)
}

export async function uploadPatientFiles(patientId: string, files: File[], category: string): Promise<PatientFile[]> {
  const form = new FormData()
  for (const file of files) form.append('files', file, file.name)
  form.set('category', category)
  return api(`/pacientes/${segment(patientId)}/archivos`, { method: 'POST', form })
}
