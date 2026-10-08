import 'server-only'

import { requireStaff } from '@/modules/auth/session'
import * as repository from './repository'
import type { PatientFile } from './types'

/** Archivos del expediente: solo el personal que puede consultar el expediente. */
export async function getPatientFiles(patientId: string): Promise<PatientFile[]> {
  await requireStaff('record')
  return repository.listPatientFiles(patientId)
}
