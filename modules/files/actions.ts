'use server'

import { revalidatePath } from 'next/cache'

import type { ActionState } from '@/lib/action-state'
import { reject, runAction } from '@/lib/server/form'
import { audit } from '@/modules/audit/log'
import { requireStaff } from '@/modules/auth/session'
import { findPatientById } from '@/modules/patients/repository'
import { stampFor } from '@/modules/patients/stamp'
import type { Crop, Point, Shape } from './annotations'
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

const shapeTypes = new Set(['flecha', 'elipse', 'rectangulo', 'poligono', 'trazo', 'texto'])

/** Guarda la capa de anotaciones de una imagen (la imagen original no se modifica). Solo el médico. */
export async function saveImageAnnotations(input: { patientId: string; fileId: string; imageWidth: number; imageHeight: number; shapes: Shape[]; crop?: Crop }): Promise<ActionState> {
  try {
    const user = await requireStaff('oncology.write')
    const files = await repository.listPatientFiles(input.patientId)
    const file = files.find((f) => f.id === input.fileId && f.contentType.startsWith('image/'))
    if (!file) return { ok: false, error: 'La imagen no pertenece a esta paciente.' }
    const valid = Array.isArray(input.shapes) && input.shapes.length <= 300 && input.shapes.every((s) =>
      shapeTypes.has(s.type) && /^#[0-9a-fA-F]{6}$/.test(s.color) && s.width > 0 && Array.isArray(s.points) && s.points.length > 0 && s.points.length <= 4000
      && s.points.every((p) => Array.isArray(p) && p.length === 2 && p.every(Number.isFinite)) && (s.text === undefined || (typeof s.text === 'string' && s.text.length <= 120)))
    if (!valid || !(input.imageWidth > 0) || !(input.imageHeight > 0)) return { ok: false, error: 'Las anotaciones no son válidas.' }
    const shapes = input.shapes.map(({ id, type, color, width, points, text, fill }) => ({
      id: String(id).slice(0, 40), type, color, width: Math.min(Math.max(width, 0.5), 200),
      points: points.map(([x, y]) => [Math.round(x * 10) / 10, Math.round(y * 10) / 10] as Point), ...(text ? { text } : {}), ...(fill ? { fill: true } : {}),
    }))
    const W = Math.round(input.imageWidth), H = Math.round(input.imageHeight)
    let crop: Crop | undefined
    if (input.crop) {
      const { x, y, width, height } = input.crop
      if (![x, y, width, height].every(Number.isFinite)) return { ok: false, error: 'El recorte no es válido.' }
      const cx = Math.min(Math.max(Math.round(x), 0), W - 1), cy = Math.min(Math.max(Math.round(y), 0), H - 1)
      crop = { x: cx, y: cy, width: Math.max(1, Math.min(Math.round(width), W - cx)), height: Math.max(1, Math.min(Math.round(height), H - cy)) }
    }
    await repository.saveAnnotations(file.id, { imageWidth: W, imageHeight: H, shapes, ...(crop ? { crop } : {}), recorded: stampFor(user.name) })
    const what = [shapes.length ? `${shapes.length} marca(s)` : '', crop ? `recorte ${crop.width}×${crop.height}` : ''].filter(Boolean).join(' y ')
    audit(user, 'modificacion', 'Imagen', input.patientId, what ? `Editó la imagen ${file.name}: ${what}` : `Quitó las anotaciones y el recorte de la imagen ${file.name}`)
    revalidatePath(`/sistema/pacientes/${input.patientId}`, 'layout')
    return { ok: true, message: 'Anotaciones guardadas' }
  } catch (error) {
    if (error && typeof error === 'object' && 'digest' in error) throw error // redirecciones de requireStaff
    return { ok: false, error: error instanceof Error ? error.message : 'No se pudieron guardar las anotaciones.' }
  }
}
