'use server'

import { revalidatePath } from 'next/cache'

import type { ActionState } from '@/lib/action-state'
import { reject, runAction } from '@/lib/server/form'
import { newId } from '@/lib/server/memory'
import { generateAccessCode, hashCode } from '@/lib/server/password'
import { audit } from '@/modules/audit/log'
import { requirePatient } from '@/modules/auth/session'
import * as repository from './repository'
import { accessScopeKeys, accessScopes, relationships } from './types'

/** Resultado de autorizar: además del mensaje, devuelve el código en claro para mostrarlo una sola vez. */
export type GrantState = (ActionState & { code?: string; contactName?: string }) | undefined

const MAX_ACTIVE = 5

export async function grantAccess(_: GrantState, formData: FormData): Promise<GrantState> {
  let issued: { code: string; contactName: string } | undefined
  const result = await runAction(formData, async (form) => {
    const patient = await requirePatient()
    const active = (await repository.listContactsByPatient(patient.id)).filter((c) => !c.revokedAt)
    if (active.length >= MAX_ACTIVE) reject(`Puedes tener hasta ${MAX_ACTIVE} contactos autorizados. Revoca alguno para agregar otro.`)

    const name = form.text('name', 'Nombre del contacto', 120)
    const phone = form.text('phone', 'Teléfono', 20)
    if (phone.replace(/\D/g, '').length < 10) reject('Escribe un teléfono de 10 dígitos.')
    if (active.some((c) => c.name.toLowerCase() === name.toLowerCase())) reject(`${name} ya tiene acceso. Revócalo primero si quieres cambiar el alcance.`)
    if (!form.bool('consent')) reject('Confirma que autorizas compartir tu información.')

    const code = generateAccessCode()
    const contact = {
      id: newId('ac'), patientId: patient.id, name, phone,
      relationship: form.choice('relationship', 'Parentesco', relationships),
      scope: form.choice('scope', 'Nivel de acceso', accessScopeKeys),
      codeHash: hashCode(code), createdAt: new Date().toISOString(),
    }
    await repository.insertContact(contact)
    audit({ id: patient.id, name: patient.name, role: 'paciente' }, 'alta', 'Acceso asistido', patient.id, `Autorizó a ${name} (${contact.relationship}): ${accessScopes[contact.scope].label.toLowerCase()}`)
    revalidatePath('/portal/acceso-asistido')
    issued = { code, contactName: name }
  })
  return result?.ok ? { ...result, ...issued } : result
}

export async function revokeAccess(_: ActionState, formData: FormData): Promise<ActionState> {
  return runAction(formData, async (form) => {
    const patient = await requirePatient()
    const id = form.text('contactId', 'Contacto')
    const contact = await repository.findActiveContact(id)
    // Un paciente solo puede revocar sus propias autorizaciones.
    if (!contact || contact.patientId !== patient.id) reject('La autorización no existe o ya fue revocada.')
    await repository.updateContact(id, (c) => { c.revokedAt = new Date().toISOString() })
    audit({ id: patient.id, name: patient.name, role: 'paciente' }, 'cancelacion', 'Acceso asistido', patient.id, `Revocó el acceso de ${contact.name}`)
    revalidatePath('/portal/acceso-asistido')
    return { ok: true, message: `Se revocó el acceso de ${contact.name}` }
  })
}
