import 'server-only'

import { collection } from '@/lib/server/memory'
import { hashCode } from '@/lib/server/password'
import type { AuthorizedContact } from './types'

/*
 * Acceso crudo a las autorizaciones, sin verificar sesión.
 * DEMO: en memoria. En la fase 2 es una tabla con `clinic_id`, `patient_id` y el hash del código.
 */

function seedContacts(): AuthorizedContact[] {
  return [
    // Demo: expediente EXP-000123 · código ELNA-2026 (expediente completo).
    { id: 'ac-1', patientId: '1', name: 'Elena López', relationship: 'Cónyuge', phone: '55 4182 7064', scope: 'completo', codeHash: hashCode('ELNA-2026'), createdAt: '2026-09-27T17:00:00.000Z' },
    // Demo: expediente EXP-000131 · código LUCY-2026 (solo información de emergencia).
    { id: 'ac-2', patientId: '4', name: 'Lucía Torres García', relationship: 'Hijo o hija', phone: '961 245 8813', scope: 'emergencia', codeHash: hashCode('LUCY-2026'), createdAt: '2026-10-01T15:30:00.000Z' },
  ]
}

const contacts = () => collection('authorized-contacts', seedContacts)

export async function listContactsByPatient(patientId: string): Promise<AuthorizedContact[]> {
  return contacts().filter((c) => c.patientId === patientId).sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}

/** Autorización vigente (no revocada) por su identificador. */
export async function findActiveContact(id: string): Promise<AuthorizedContact | undefined> {
  return contacts().find((c) => c.id === id && !c.revokedAt)
}

export async function findActiveContactByCode(patientId: string, code: string): Promise<AuthorizedContact | undefined> {
  const hash = hashCode(code)
  return contacts().find((c) => c.patientId === patientId && !c.revokedAt && c.codeHash === hash)
}

export async function insertContact(contact: AuthorizedContact): Promise<void> {
  contacts().push(contact)
}

export async function updateContact(id: string, update: (contact: AuthorizedContact) => void): Promise<AuthorizedContact | undefined> {
  const contact = contacts().find((c) => c.id === id)
  if (contact) update(contact)
  return contact
}
