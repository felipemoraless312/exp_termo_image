import 'server-only'

import { createHash } from 'node:crypto'

import type { ClinicalNote } from './types'

/**
 * Sello de integridad de una nota: SHA-256 de su contenido firmado.
 * Si alguien alterara la nota, el sello dejaría de coincidir.
 * DEMO: en producción se usa la e.firma (FIEL) del profesional o un proveedor de firma electrónica avanzada.
 */
export function sealNote(note: Omit<ClinicalNote, 'signature' | 'addenda'>, signedAt: string) {
  const payload = JSON.stringify([note.id, note.type, note.createdAt, note.author, note.sections, note.diagnoses, note.prognosis ?? '', signedAt])
  return createHash('sha256').update(payload).digest('hex')
}
