/** Archivo del expediente (estudio de laboratorio en PDF, imagen u otro documento). `label` es su categoría. */
export interface PatientFile { id: string; name: string; contentType: string; size: number; label?: string; createdAt: string }

export const fileCategories = [
  'Química sanguínea',
  'Citometría hemática',
  'Coagulación',
  'Perfil tiroideo',
  'Mastografía',
  'Ultrasonido',
  'Imágenes de termografía',
  'Otro estudio o documento',
] as const

export const ACCEPTED_FILES = 'application/pdf,image/jpeg,image/png,image/tiff,image/bmp,image/webp'
export const MAX_FILE_MB = 20

export const isImage = (file: PatientFile) => file.contentType.startsWith('image/')

export function formatSize(bytes: number) {
  return bytes >= 1024 * 1024 ? `${(bytes / (1024 * 1024)).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`
}
