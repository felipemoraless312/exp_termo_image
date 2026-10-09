import 'server-only'

import { requireStaff } from '@/modules/auth/session'
import * as repository from './repository'
import type { AnnotationMap } from './annotations'
import type { PatientFile } from './types'

/** Archivos del expediente: solo el personal que puede consultar el expediente. */
export async function getPatientFiles(patientId: string): Promise<PatientFile[]> {
  await requireStaff('record')
  return repository.listPatientFiles(patientId)
}

/** Anotaciones de las imágenes de la paciente, por id de archivo. */
export async function getAnnotations(patientId: string): Promise<AnnotationMap> {
  await requireStaff('record')
  return repository.listAnnotations(patientId)
}
