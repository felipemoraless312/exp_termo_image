import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ChevronLeft, CircleCheck, Pencil } from 'lucide-react'

import { buttonVariants } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { PageHeader } from '@/components/ui/page-header'
import { PrintButton } from '@/components/ui/print-button'
import { ageFrom, formatDate, formatDateTime } from '@/lib/format'
import { canAccess } from '@/modules/auth/permissions'
import { requireStaff } from '@/modules/auth/session'
import { listPatientSurveys } from '@/modules/oncology/data'
import { answeredCount, currentAnswerKeys, psychoSurveyQuestions } from '@/modules/oncology/psycho-survey'
import { PsychoSurveyAnswers } from '@/modules/oncology/components/psycho-survey-form'
import { visitLabels } from '@/modules/oncology/types'
import { getPatient } from '@/modules/patients/data'

export const metadata = { title: 'Encuesta de psico-oncología' }

export default async function PsychoSurveyPage({ params, searchParams }: PageProps<'/sistema/pacientes/[id]/encuesta/[surveyId]'>) {
  const [{ id, surveyId }, { editada }, user] = await Promise.all([params, searchParams, requireStaff('oncology')])
  const [patient, surveys] = await Promise.all([getPatient(id), listPatientSurveys(id)])
  const survey = surveys.find((s) => s.id === surveyId)
  if (!patient || !survey) notFound()
  const edits = survey.edits ?? []
  const changedIn = (previous: Record<string, string>, next: Record<string, string>) =>
    [...currentAnswerKeys].filter((key) => (previous[key] ?? '') !== (next[key] ?? '')).length

  return (
    <>
      <Link href={`/sistema/pacientes/${patient.id}?seccion=oncologia`} className="no-print -ml-1 mb-6 inline-flex items-center gap-0.5 text-[14px] text-accent-foreground hover:underline">
        <ChevronLeft size={17} aria-hidden="true" /> {patient.name}
      </Link>
      <PageHeader
        eyebrow={`${patient.record} · ${ageFrom(patient.birthDate)} años · nacimiento ${formatDate(patient.birthDate, 'medium')}`}
        title="Encuesta de psico-oncología"
        description={`${patient.name} · ${formatDateTime(survey.createdAt)}${survey.visit ? ` · ${visitLabels[survey.visit]}` : ''} · aplicó ${survey.appliedBy} · ${answeredCount(survey.answers)} de ${psychoSurveyQuestions.length} contestadas`}
        actions={
          <div className="no-print flex flex-wrap gap-2">
            {canAccess(user.role, 'oncology.write') && (
              <Link href={`/sistema/pacientes/${patient.id}/encuesta/${survey.id}/editar`} className={buttonVariants({ variant: 'secondary', size: 'md' })}><Pencil /> Editar</Link>
            )}
            <PrintButton />
          </div>
        }
      />
      {editada && (
        <Card className="no-print mb-4 flex items-center gap-3 p-4 sm:p-5">
          <CircleCheck size={20} className="shrink-0 text-success" aria-hidden="true" />
          <p className="text-[14px] font-medium">Correcciones guardadas.</p>
        </Card>
      )}
      <PsychoSurveyAnswers survey={survey} />
      {edits.length > 0 && (
        <Card className="mt-4 p-5 sm:p-7">
          <h2 className="text-title-3">Historial de correcciones</h2>
          <p className="mt-1 text-[13px] text-subtle">Las respuestas anteriores a cada corrección se conservan en la base de datos.</p>
          <ol className="mt-3 divide-y divide-separator">
            {edits.map((edit, i) => (
              <li key={edit.at} className="py-3 text-[14px]">
                <span className="font-medium">{formatDateTime(edit.at)}</span>
                <span className="text-muted-foreground"> · {edit.by} · {edit.location} · {changedIn(edit.previousAnswers, edits[i + 1]?.previousAnswers ?? survey.answers)} respuesta(s) cambiada(s)</span>
              </li>
            ))}
          </ol>
        </Card>
      )}
    </>
  )
}
