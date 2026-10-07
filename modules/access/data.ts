import 'server-only'

import { requirePatient, requireStaff } from '@/modules/auth/session'
import * as repository from './repository'
import type { AuthorizedContact } from './types'

export type { AuthorizedContact } from './types'

/** Contactos que el paciente autenticado ha autorizado (vigentes y revocados). */
export async function listMyContacts(): Promise<AuthorizedContact[]> {
  const patient = await requirePatient()
  return repository.listContactsByPatient(patient.id)
}

/** Para el médico: quién más tiene acceso al expediente de un paciente. */
export async function listPatientContacts(patientId: string): Promise<AuthorizedContact[]> {
  await requireStaff('record')
  return repository.listContactsByPatient(patientId)
}
