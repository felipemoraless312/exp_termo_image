import { FileText, Paperclip, Upload } from 'lucide-react'

import { ActionForm } from '@/components/ui/action-form'
import { Card, CardHeader } from '@/components/ui/card'
import { Dialog } from '@/components/ui/dialog'
import { EmptyState } from '@/components/ui/empty-state'
import { Field, Input, Select } from '@/components/ui/field'
import { formatDateTime } from '@/lib/format'
import { uploadPatientFiles } from '../actions'
import { getPatientFiles } from '../data'
import { ACCEPTED_FILES, fileCategories, formatSize, isImage, MAX_FILE_MB, THERMAL_CATEGORY, type PatientFile } from '../types'

const ACCEPTED_IMAGES = ACCEPTED_FILES.replace('application/pdf,', '')

/** Con `category` fija (p. ej. imágenes térmicas desde Oncología) no se pregunta el tipo; las térmicas solo aceptan imágenes. */
export function UploadFilesDialog({ patientId, category }: { patientId: string; category?: (typeof fileCategories)[number] }) {
  const thermal = category === THERMAL_CATEGORY
  return (
    <Dialog
      title={thermal ? 'Subir imágenes térmicas' : 'Subir estudios o imágenes'}
      description={`${thermal ? 'Imágenes' : 'PDF o imágenes'} (JPG, PNG, TIFF, BMP, WEBP) de hasta ${MAX_FILE_MB} MB cada uno. Puede elegir varios a la vez.`}
      trigger={<><Upload /> {thermal ? 'Subir imágenes' : 'Subir archivos'}</>}
      triggerStyle={thermal ? { variant: 'ghost', size: 'sm' } : undefined}
    >
      <ActionForm action={uploadPatientFiles} submitLabel="Subir" pendingLabel="Subiendo…">
        <input type="hidden" name="patientId" value={patientId} />
        {category ? <input type="hidden" name="category" value={category} /> : (
          <Field label="Tipo de estudio">
            <Select name="category" defaultValue="" required>
              <option value="" disabled>Selecciona…</option>
              {fileCategories.map((c) => <option key={c} value={c}>{c}</option>)}
            </Select>
          </Field>
        )}
        <Field label="Archivos"><Input name="files" type="file" accept={thermal ? ACCEPTED_IMAGES : ACCEPTED_FILES} multiple required className="h-auto py-2.5" /></Field>
      </ActionForm>
    </Dialog>
  )
}

/** Miniaturas que abren la imagen completa en otra pestaña. */
export function ImageGrid({ images }: { images: PatientFile[] }) {
  return (
    <ul className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
      {images.map((image) => (
        <li key={image.id}>
          <a href={`/sistema/archivos/${image.id}`} target="_blank" rel="noreferrer" className="block overflow-hidden rounded-xl bg-muted">
            {/* eslint-disable-next-line @next/next/no-img-element -- archivo protegido por sesión; el optimizador de imágenes no envía la cookie */}
            <img src={`/sistema/archivos/${image.id}`} alt={image.name} loading="lazy" className="aspect-[4/3] w-full object-cover" />
          </a>
          <p className="mt-1 truncate text-[12px] text-muted-foreground">{image.name}</p>
        </li>
      ))}
    </ul>
  )
}

function FileGroup({ title, files }: { title: string; files: PatientFile[] }) {
  const images = files.filter(isImage)
  const documents = files.filter((f) => !isImage(f))
  return (
    <Card className="p-5 sm:p-6">
      <h3 className="text-[15px] font-semibold">{title} <span className="font-normal text-muted-foreground">· {files.length}</span></h3>
      {documents.length > 0 && (
        <ul className="mt-3 divide-y divide-separator">
          {documents.map((file) => (
            <li key={file.id}>
              <a href={`/sistema/archivos/${file.id}`} target="_blank" rel="noreferrer" className="flex items-center gap-3 py-2.5 hover:underline">
                <FileText size={18} className="shrink-0 text-muted-foreground" aria-hidden="true" />
                <span className="min-w-0 flex-1 truncate text-[14px] font-medium">{file.name}</span>
                <span className="shrink-0 text-[12px] text-muted-foreground">{formatSize(file.size)} · {formatDateTime(file.createdAt)}</span>
              </a>
            </li>
          ))}
        </ul>
      )}
      {images.length > 0 && <ImageGrid images={images} />}
    </Card>
  )
}

/** Estudios e imágenes adjuntos al expediente, agrupados por tipo. */
export async function PatientFilesSection({ patientId, canUpload }: { patientId: string; canUpload: boolean }) {
  const files = await getPatientFiles(patientId)
  const groups = new Map<string, PatientFile[]>()
  for (const file of files) {
    const key = file.label ?? 'Otro estudio o documento'
    groups.set(key, [...(groups.get(key) ?? []), file])
  }
  const ordered = [...groups].sort(([a], [b]) => {
    const ia = (fileCategories as readonly string[]).indexOf(a), ib = (fileCategories as readonly string[]).indexOf(b)
    return (ia < 0 ? 99 : ia) - (ib < 0 ? 99 : ib)
  })

  return (
    <section className="mt-8 space-y-3">
      <CardHeader title="Archivos de estudios e imágenes" description="Resultados de laboratorio, mastografías, imágenes de termografía y otros documentos" action={canUpload && <UploadFilesDialog patientId={patientId} />} className="px-1" />
      {ordered.length ? ordered.map(([title, list]) => <FileGroup key={title} title={title} files={list} />)
        : <Card><EmptyState icon={Paperclip} title="Sin archivos" description={canUpload ? 'Use “Subir archivos” para adjuntar resultados en PDF o imágenes.' : undefined} /></Card>}
    </section>
  )
}
