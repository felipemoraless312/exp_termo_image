import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ChevronLeft } from 'lucide-react'

import { PageHeader } from '@/components/ui/page-header'
import { PrintButton } from '@/components/ui/print-button'
import { ageFrom, formatDate, formatDateTime } from '@/lib/format'
import { listPatientSurveys } from '@/modules/oncology/data'
import { answeredCount, psychoSurveyQuestions } from '@/modules/oncology/psycho-survey'
import { PsychoSurveyAnswers } from '@/modules/oncology/components/psycho-survey-form'
import { visitLabels } from '@/modules/oncology/types'
import { getPatient } from '@/modules/patients/data'

export const metadata = { title: 'Encuesta de psico-oncología' }

export default async function PsychoSurveyPage({ params }: PageProps<'/sistema/pacientes/[id]/encuesta/[surveyId]'>) {
  const { id, surveyId } = await params
  const [patient, surveys] = await Promise.all([getPatient(id), listPatientSurveys(id)])
  const survey = surveys.find((s) => s.id === surveyId)
  if (!patient || !survey) notFound()

  return (
    <>
      <Link href={`/sistema/pacientes/${patient.id}?seccion=oncologia`} className="no-print -ml-1 mb-6 inline-flex items-center gap-0.5 text-[14px] text-accent-foreground hover:underline">
        <ChevronLeft size={17} aria-hidden="true" /> {patient.name}
      </Link>
      <PageHeader
        eyebrow={`${patient.record} · ${ageFrom(patient.birthDate)} años · nacimiento ${formatDate(patient.birthDate, 'medium')}`}
        title="Encuesta de psico-oncología"
        description={`${patient.name} · ${formatDateTime(survey.createdAt)}${survey.visit ? ` · ${visitLabels[survey.visit]}` : ''} · aplicó ${survey.appliedBy} · ${answeredCount(survey.answers)} de ${psychoSurveyQuestions.length} contestadas`}
        actions={<div className="no-print"><PrintButton /></div>}
      />
      <PsychoSurveyAnswers survey={survey} />
    </>
  )
}
