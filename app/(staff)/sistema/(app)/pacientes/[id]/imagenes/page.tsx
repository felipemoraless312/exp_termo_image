import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ChevronLeft } from 'lucide-react'

import { PageHeader } from '@/components/ui/page-header'
import { canAccess } from '@/modules/auth/permissions'
import { requireStaff } from '@/modules/auth/session'
import { AnnotationEditor } from '@/modules/files/components/annotation-editor'
import { getAnnotations, getPatientFiles } from '@/modules/files/data'
import { THERMAL_CATEGORY } from '@/modules/files/types'
import { getPatient } from '@/modules/patients/data'

export const metadata = { title: 'Imágenes térmicas' }

/** Visor y editor de anotaciones de las imágenes térmicas de la paciente (segmentar, resaltar, señalar). */
export default async function ThermalImagesPage({ params, searchParams }: PageProps<'/sistema/pacientes/[id]/imagenes'>) {
  const [{ id }, { f }, user] = await Promise.all([params, searchParams, requireStaff('oncology')])
  const [patient, files, annotations] = await Promise.all([getPatient(id), getPatientFiles(id), getAnnotations(id)])
  if (!patient) notFound()
  const images = files
    .filter((file) => file.label === THERMAL_CATEGORY && file.contentType.startsWith('image/'))
    .sort((a, b) => a.name.localeCompare(b.name, 'es', { numeric: true }))
    .map(({ id: fileId, name }) => ({ id: fileId, name }))
  const canEdit = canAccess(user.role, 'oncology.write')

  return (
    <>
      <Link href={`/sistema/pacientes/${patient.id}?seccion=oncologia`} className="-ml-1 mb-6 inline-flex items-center gap-0.5 text-[14px] text-accent-foreground hover:underline">
        <ChevronLeft size={17} aria-hidden="true" /> {patient.name}
      </Link>
      <PageHeader
        eyebrow={`${patient.record} · ${images.length} imagen(es) térmica(s)`}
        title={canEdit ? 'Anotar imágenes térmicas' : 'Imágenes térmicas'}
        description={canEdit ? 'Elija una imagen y resalte, segmente o señale las zonas de interés.' : 'Las anotaciones las hace el médico.'}
      />
      <AnnotationEditor patientId={patient.id} images={images} annotations={annotations} initialFileId={typeof f === 'string' ? f : undefined} canEdit={canEdit} />
    </>
  )
}
