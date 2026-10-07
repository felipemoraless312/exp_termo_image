'use server'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

import { CONTACT_COOKIE, PATIENT_COOKIE, STAFF_COOKIE, sessionCookieOptions } from './session'
import { verifyStaffCredentials } from '@/modules/staff/data'
import { findPatientByRecord } from '@/modules/patients/repository'
import { findActiveContactByCode, updateContact } from '@/modules/access/repository'
import { audit } from '@/modules/audit/log'

export type FormState = { error?: string } | undefined

// DEMO: correo y contraseña. En la fase 2 se agrega el segundo factor.
export async function signInStaff(_: FormState, formData: FormData): Promise<FormState> {
  const email = String(formData.get('email') ?? '')
  const password = String(formData.get('password') ?? '')
  if (!email || !password) return { error: 'Escribe tu correo y contraseña.' }

  const user = await verifyStaffCredentials(email, password)
  if (!user) return { error: 'Correo o contraseña incorrectos.' }

  ;(await cookies()).set(STAFF_COOKIE, user.id, sessionCookieOptions)
  redirect('/sistema')
}

export async function signOutStaff() {
  ;(await cookies()).delete(STAFF_COOKIE)
  redirect('/?acceso=medico')
}

/** Acceso del paciente con número de expediente y fecha de nacimiento (formato AAAA-MM-DD). */
export async function signInPatient(_: FormState, formData: FormData): Promise<FormState> {
  const record = String(formData.get('record') ?? '')
  const birthDate = String(formData.get('birthDate') ?? '')
  if (!record || !birthDate) return { error: 'Completa ambos campos.' }

  const patient = await findPatientByRecord(record)
  if (!patient || patient.birthDate !== birthDate) {
    return { error: 'Los datos no coinciden con ningún expediente.' }
  }

  const jar = await cookies()
  jar.delete(CONTACT_COOKIE)
  jar.set(PATIENT_COOKIE, patient.id, sessionCookieOptions)
  redirect('/portal')
}

/** Acceso del contacto autorizado con el número de expediente del paciente y el código que este le compartió. */
export async function signInContact(_: FormState, formData: FormData): Promise<FormState> {
  const record = String(formData.get('record') ?? '')
  const code = String(formData.get('code') ?? '')
  if (!record || !code) return { error: 'Completa ambos campos.' }

  const patient = await findPatientByRecord(record)
  const contact = patient ? await findActiveContactByCode(patient.id, code) : undefined
  if (!patient || !contact) return { error: 'El código no es válido o la autorización fue revocada.' }

  await updateContact(contact.id, (c) => { c.lastAccessAt = new Date().toISOString() })
  audit({ id: contact.id, name: contact.name, role: 'contacto' }, 'acceso', 'Expediente', patient.id, `${contact.name} (${contact.relationship}) inició sesión como contacto autorizado`)

  const jar = await cookies()
  jar.delete(PATIENT_COOKIE)
  jar.set(CONTACT_COOKIE, contact.id, sessionCookieOptions)
  redirect('/portal')
}

export async function signOutPortal() {
  const jar = await cookies()
  jar.delete(PATIENT_COOKIE)
  jar.delete(CONTACT_COOKIE)
  redirect('/')
}
