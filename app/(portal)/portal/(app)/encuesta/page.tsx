import { redirect } from 'next/navigation'
import { CircleCheck } from 'lucide-react'

import { Card } from '@/components/ui/card'
import { PageHeader } from '@/components/ui/page-header'
import { formatDateTime } from '@/lib/format'
import { requirePortalViewer } from '@/modules/auth/session'
import { getPortalPsychoSurvey } from '@/modules/oncology/data'
import { patientSurveySections } from '@/modules/oncology/psycho-survey'
import { PortalPsychoSurveyForm, PsychoSurveyAnswers } from '@/modules/oncology/components/psycho-survey-form'

export const metadata = { title: 'Encuesta' }

/** La paciente contesta la encuesta de psico-oncología; si ya la contestó, ve sus respuestas. */
export default async function PortalSurveyPage() {
  const viewer = await requirePortalViewer()
  if (viewer.kind !== 'paciente') redirect('/portal') // la encuesta es personal: un contacto autorizado no la contesta
  const { survey, campaignName } = await getPortalPsychoSurvey()

  if (survey) {
    return (
      <>
        <PageHeader title="Mi encuesta" description={campaignName ? `Encuesta de la ${campaignName.toLowerCase()}.` : undefined} />
        <Card className="mb-6 flex items-start gap-3 p-5 sm:p-6">
          <CircleCheck size={22} className="mt-0.5 shrink-0 text-success" aria-hidden="true" />
          <div>
            <p className="font-medium">¡Gracias por contestar!</p>
            <p className="mt-1 text-[14px] leading-6 text-muted-foreground">
              Enviaste tus respuestas el {formatDateTime(survey.createdAt)}. Si quieres cambiar alguna, coméntalo al personal el día de tu cita.
            </p>
          </div>
        </Card>
        <PsychoSurveyAnswers survey={survey} sections={patientSurveySections} />
      </>
    )
  }

  return (
    <>
      <PageHeader
        title="Encuesta de psico-oncología"
        description="Este cuestionario tiene como objetivo saber qué tanto conocen las mujeres sobre la prevención del cáncer de mama y de cérvix, para diseñar estrategias que aumenten la participación en estos programas. Tu ayuda es muy valiosa. Si no sabes una respuesta, no te preocupes: marca “No sabe”."
      />
      <PortalPsychoSurveyForm curp={viewer.patient.curp} />
    </>
  )
}
