import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ChevronLeft } from 'lucide-react'

import { PageHeader } from '@/components/ui/page-header'
import { ageFrom, formatDateTime } from '@/lib/format'
import { requireStaff } from '@/modules/auth/session'
import { listCampaigns, listPatientSurveys } from '@/modules/oncology/data'
import { PsychoSurveyForm } from '@/modules/oncology/components/psycho-survey-form'
import { getPatient } from '@/modules/patients/data'

export const metadata = { title: 'Corregir encuesta' }

/** Corrige una encuesta ya guardada: el formulario llega con sus respuestas y las anteriores quedan en el historial. */
export default async function EditPsychoSurveyPage({ params }: PageProps<'/sistema/pacientes/[id]/encuesta/[surveyId]/editar'>) {
  const [{ id, surveyId }] = await Promise.all([params, requireStaff('oncology.write')])
  const [patient, surveys, campaigns] = await Promise.all([getPatient(id), listPatientSurveys(id), listCampaigns()])
  const survey = surveys.find((s) => s.id === surveyId)
  if (!patient || !survey) notFound()

  return (
    <>
      <Link href={`/sistema/pacientes/${patient.id}/encuesta/${survey.id}`} className="-ml-1 mb-6 inline-flex items-center gap-0.5 text-[14px] text-accent-foreground hover:underline">
        <ChevronLeft size={17} aria-hidden="true" /> Encuesta sin cambios
      </Link>
      <PageHeader
        eyebrow={`${patient.record} · ${ageFrom(patient.birthDate)} años`}
        title="Corregir encuesta de psico-oncología"
        description={`${patient.name} · aplicada el ${formatDateTime(survey.createdAt)} por ${survey.appliedBy}. Corrija lo necesario y guarde: las respuestas anteriores quedan registradas en el historial de la encuesta.`}
      />
      <PsychoSurveyForm patientId={patient.id} campaigns={campaigns} survey={survey} />
    </>
  )
}
