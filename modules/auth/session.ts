import 'server-only'

import { cache } from 'react'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

import { canAccess, type StaffArea } from './permissions'
import { findStaffById, type StaffMember } from '@/modules/staff/data'
import { findPatientById } from '@/modules/patients/repository'
import { findActiveContact } from '@/modules/access/repository'
import type { AuthorizedContact } from '@/modules/access/types'
import type { Patient } from '@/modules/patients/types'

/*
 * DEMO: la cookie solo guarda un identificador sin firmar.
 * En la fase 2 se sustituye por sesiones en base de datos (Better Auth) con MFA para el personal;
 * el resto de la app no cambia porque solo usa las funciones de este archivo.
 *
 * Tres tipos de usuario:
 *  - médico (`/sistema`): ve y modifica los expedientes de todos sus pacientes;
 *  - paciente (`/portal`): ve su propio expediente y administra quién más puede verlo;
 *  - contacto autorizado (`/portal`): ve el expediente del paciente que lo autorizó, según el alcance otorgado.
 */
export const STAFF_COOKIE = 'md_staff'
export const PATIENT_COOKIE = 'md_patient'
export const CONTACT_COOKIE = 'md_contact'

export const sessionCookieOptions = {
  httpOnly: true,
  sameSite: 'lax',
  secure: process.env.NODE_ENV === 'production',
  path: '/',
  maxAge: 60 * 60 * 8,
} as const

export const getStaffSession = cache(async (): Promise<StaffMember | null> => {
  const id = (await cookies()).get(STAFF_COOKIE)?.value
  return id ? (await findStaffById(id)) ?? null : null
})

/** Exige sesión del médico y, opcionalmente, permiso sobre un área. */
export async function requireStaff(area?: StaffArea): Promise<StaffMember> {
  const user = await getStaffSession()
  if (!user) redirect('/sistema/login')
  if (area && !canAccess(user.role, area)) redirect('/sistema')
  return user
}

export const getPatientSession = cache(async (): Promise<Patient | null> => {
  const id = (await cookies()).get(PATIENT_COOKIE)?.value
  return id ? (await findPatientById(id)) ?? null : null
})

/** Solo el propio paciente (no sus contactos) puede usar esta función: p. ej. autorizar o revocar accesos. */
export async function requirePatient(): Promise<Patient> {
  const patient = await getPatientSession()
  if (!patient) redirect('/portal')
  return patient
}

export type PortalViewer =
  | { kind: 'paciente'; patient: Patient }
  | { kind: 'contacto'; patient: Patient; contact: AuthorizedContact }

/** Quién está usando el portal. Una autorización revocada invalida la sesión del contacto de inmediato. */
export const getPortalViewer = cache(async (): Promise<PortalViewer | null> => {
  const patient = await getPatientSession()
  if (patient) return { kind: 'paciente', patient }

  const contactId = (await cookies()).get(CONTACT_COOKIE)?.value
  const contact = contactId ? await findActiveContact(contactId) : undefined
  const owner = contact ? await findPatientById(contact.patientId) : undefined
  return contact && owner ? { kind: 'contacto', patient: owner, contact } : null
})

export async function requirePortalViewer(): Promise<PortalViewer> {
  const viewer = await getPortalViewer()
  if (!viewer) redirect('/portal/login')
  return viewer
}
