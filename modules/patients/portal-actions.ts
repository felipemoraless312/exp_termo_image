'use server'

import { revalidatePath } from 'next/cache'

import type { ActionState } from '@/lib/action-state'
import { reject, runAction } from '@/lib/server/form'
import { audit } from '@/modules/audit/log'
import { requirePatient } from '@/modules/auth/session'
import { educationLevels, emergencyRelationships, maritalStatuses } from '@/modules/catalogs/clinical'
import * as repository from './repository'
import { stampFor } from './stamp'

/*
 * Acciones del portal que ejecuta la propia paciente (nunca un contacto autorizado).
 * Puede actualizar sus datos de contacto y sociodemográficos; nombre, fecha de nacimiento, CURP y número
 * de expediente identifican al expediente (NOM-004 / NOM-024) y solo los corrige la clínica.
 */

export async function updateOwnInformation(_: ActionState, formData: FormData): Promise<ActionState> {
  return runAction(formData, async (form) => {
    const patient = await requirePatient()
    const phone = form.text('phone', 'Teléfono', 20)
    if (phone.replace(/\D/g, '').length < 10) reject('Escribe un teléfono de 10 dígitos.')
    const email = form.optional('email', 120)
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) reject('El correo no es válido.')
    const zip = form.optional('zip', 5)
    if (zip && !/^\d{5}$/.test(zip)) reject('El código postal debe tener 5 dígitos.')
    const emergencyPhone = form.optional('emergencyPhone', 20)
    if (emergencyPhone && emergencyPhone.replace(/\D/g, '').length < 10) reject('El teléfono del contacto de emergencia debe tener 10 dígitos.')

    const changes = {
      phone, email,
      maritalStatus: form.optionalChoice('maritalStatus', maritalStatuses),
      education: form.optionalChoice('education', educationLevels),
      occupation: form.optional('occupation', 80),
      address: {
        street: form.optional('street', 160) ?? '',
        neighborhood: form.optional('neighborhood', 100) ?? '',
        municipality: form.optional('municipality', 100) ?? '',
        state: form.optional('state', 60) ?? '',
        zip: zip ?? '',
      },
      emergencyContact: {
        name: form.optional('emergencyName', 120) ?? '',
        relationship: form.optionalChoice('emergencyRelationship', emergencyRelationships) ?? '',
        phone: emergencyPhone ?? '',
      },
      updated: stampFor(`${patient.name} (paciente, desde el portal)`),
    }
    const saved = await repository.updatePatient(patient.id, (p) => Object.assign(p, changes))
    if (!saved) reject('El expediente no existe.')

    audit({ id: patient.id, name: patient.name, role: 'paciente' }, 'modificacion', 'Expediente', patient.id, 'Actualizó sus datos de contacto desde el portal')
    revalidatePath('/portal', 'layout')
    revalidatePath('/sistema', 'layout')
    return { ok: true, message: 'Tus datos se actualizaron' }
  })
}
