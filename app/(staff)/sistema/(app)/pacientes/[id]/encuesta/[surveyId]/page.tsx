import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ChevronLeft } from 'lucide-react'

import { Card } from '@/components/ui/card'
import { PageHeader } from '@/components/ui/page-header'
import { PrintButton } from '@/components/ui/print-button'
import { ageFrom, formatDate, formatDateTime } from '@/lib/format'
import { listPatientSurveys } from '@/modules/oncology/data'
import { answeredCount, otherKey, psychoSurvey, psychoSurveyQuestions } from '@/modules/oncology/psycho-survey'
import { visitLabels } from '@/modules/oncology/types'
import { getPatient } from '@/modules/patients/data'

export const metadata = { title: 'Encuesta de psico-oncología' }

export default async function PsychoSurveyPage({ params }: PageProps<'/sistema/pacientes/[id]/encuesta/[surveyId]'>) {
  const { id, surveyId } = await params
  const [patient, surveys] = await Promise.all([getPatient(id), listPatientSurveys(id)])
  const survey = surveys.find((s) => s.id === surveyId)
  if (!patient || !survey) notFound()
  const { answers } = survey

  return (
    <>
      <Link href={`/sistema/pacientes/${patient.id}?seccion=oncologia`} className="no-print -ml-1 mb-6 inline-flex items-center gap-0.5 text-[14px] text-accent-foreground hover:underline">
        <ChevronLeft size={17} aria-hidden="true" /> {patient.name}
      </Link>
      <PageHeader
        eyebrow={`${patient.record} · ${ageFrom(patient.birthDate)} años · nacimiento ${formatDate(patient.birthDate, 'medium')}`}
        title="Encuesta de psico-oncología"
        description={`${patient.name} · ${formatDateTime(survey.createdAt)}${survey.visit ? ` · ${visitLabels[survey.visit]}` : ''} · aplicó ${survey.appliedBy} · ${answeredCount(answers)} de ${psychoSurveyQuestions.length} contestadas`}
        actions={<div className="no-print"><PrintButton /></div>}
      />
      <div className="space-y-4">
        {psychoSurvey.map((section) => (
          <Card key={section.id} className="p-5 sm:p-7">
            <h2 className="text-title-3">{section.title}</h2>
            <ol className="mt-4 divide-y divide-separator">
              {section.questions.map((question, i) => {
                const value = answers[question.id]
                const detail = answers[otherKey(question.id)]
                return (
                  <li key={question.id} className="flex flex-col gap-1 py-3 sm:flex-row sm:items-baseline sm:justify-between sm:gap-6">
                    <span className="text-[14px] text-muted-foreground">{i + 1}. {question.text}</span>
                    <span className={value ? 'shrink-0 text-[15px] font-medium sm:max-w-[45%] sm:text-right' : 'shrink-0 text-[14px] text-subtle'}>{value ? `${value}${detail ? `: ${detail}` : ''}` : 'Sin respuesta'}</span>
                  </li>
                )
              })}
            </ol>
          </Card>
        ))}
      </div>
    </>
  )
}
