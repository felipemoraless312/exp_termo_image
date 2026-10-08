'use server'

import { revalidatePath } from 'next/cache'

import type { ActionState } from '@/lib/action-state'
import { reject, runAction } from '@/lib/server/form'
import { audit } from '@/modules/audit/log'
import { requireStaff } from '@/modules/auth/session'
import { findPatientById } from '@/modules/patients/repository'
import * as repository from './repository'
import { fileCategories, MAX_FILE_MB, THERMAL_CATEGORY } from './types'

const accepted = new Set(['application/pdf', 'image/jpeg', 'image/png', 'image/tiff', 'image/bmp', 'image/webp'])

/** Sube estudios (PDF) o imágenes al expediente. Se guardan todos o ninguno. */
export async function uploadPatientFiles(_: ActionState, formData: FormData): Promise<ActionState> {
  return runAction(formData, async (form) => {
    const user = await requireStaff('files.upload')
    const patient = (await findPatientById(form.text('patientId', 'Paciente'))) ?? reject('El expediente no existe.')
    const category = form.choice('category', 'Tipo de estudio', fileCategories)
    // El campo de archivo vacío llega como un archivo de 0 bytes.
    const files = formData.getAll('files').filter((value): value is File => value instanceof File && value.size > 0)
    if (!files.length) reject('Selecciona al menos un archivo.')
    for (const file of files) {
      if (!accepted.has(file.type)) reject(`${file.name}: solo se aceptan PDF o imágenes (JPG, PNG, TIFF, BMP, WEBP).`)
      if (file.size > MAX_FILE_MB * 1024 * 1024) reject(`${file.name}: el archivo excede ${MAX_FILE_MB} MB.`)
      if (category === THERMAL_CATEGORY && !file.type.startsWith('image/')) reject(`${file.name}: en imágenes de termografía solo se aceptan imágenes.`)
    }

    await repository.uploadPatientFiles(patient.id, files, category)
    audit(user, 'alta', 'Archivo', patient.id, `Subió ${files.length} archivo(s) de ${category}: ${files.map((f) => f.name).join(', ').slice(0, 300)}`)
    revalidatePath(`/sistema/pacientes/${patient.id}`)
    return { ok: true, message: files.length === 1 ? 'Archivo subido' : `${files.length} archivos subidos` }
  })
}
