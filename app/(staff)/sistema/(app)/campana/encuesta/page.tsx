import Link from 'next/link'
import { ChevronLeft, ClipboardList } from 'lucide-react'

import { BarList } from '@/components/charts/figures'
import { Card } from '@/components/ui/card'
import { EmptyState } from '@/components/ui/empty-state'
import { PageHeader } from '@/components/ui/page-header'
import { PrintButton } from '@/components/ui/print-button'
import { formatDate } from '@/lib/format'
import { requireStaff } from '@/modules/auth/session'
import { listCampaigns, listPsychoSurveys, pickCurrentCampaign } from '@/modules/oncology/data'
import { psychoSurvey, type SurveyQuestion, type SurveyResponse } from '@/modules/oncology/psycho-survey'

export const metadata = { title: 'Resultados de la encuesta' }

const percent = (value: number, total: number) => (total ? `${Math.round((value / total) * 100)} %` : '—')

function QuestionResult({ question, number, surveys }: { question: SurveyQuestion; number: number; surveys: SurveyResponse[] }) {
  const values = surveys.map((s) => s.answers[question.id]).filter((v): v is string => !!v)
  const answered = values.length

  if (!question.options && question.input === 'text') {
    return (
      <li className="py-4">
        <p className="text-[14px] font-medium">{number}. {question.text}</p>
        <p className="mt-0.5 text-[12px] text-subtle">{answered} de {surveys.length} contestaron</p>
        {answered > 0 && (
          <ul className="mt-2 list-disc space-y-1 pl-5 text-[13px] text-muted-foreground">
            {values.map((value, i) => <li key={i}>{value}</li>)}
          </ul>
        )}
      </li>
    )
  }

  if (!question.options) {
    const numbers = values.map(Number).filter(Number.isFinite).sort((a, b) => a - b)
    const mean = numbers.length ? numbers.reduce((sum, n) => sum + n, 0) / numbers.length : undefined
    return (
      <li className="py-4">
        <p className="text-[14px] font-medium">{number}. {question.text}</p>
        <p className="mt-1 text-[13px] text-muted-foreground">
          {numbers.length ? `Promedio ${mean!.toFixed(1)} · mediana ${numbers[Math.floor(numbers.length / 2)]} · de ${numbers[0]} a ${numbers.at(-1)} · ${answered} respuestas` : 'Sin respuestas'}
        </p>
      </li>
    )
  }

  return (
    <li className="py-4">
      <p className="text-[14px] font-medium">{number}. {question.text}</p>
      <p className="mb-3 mt-0.5 text-[12px] text-subtle">{answered} de {surveys.length} contestaron</p>
      {answered > 0 && (
        <BarList
          caption={question.text}
          items={question.options.map((option) => {
            const count = values.filter((v) => v === option).length
            return { label: option, value: count, sub: percent(count, answered) }
          })}
        />
      )}
    </li>
  )
}

/** Resultados agregados de la encuesta de psico-oncología: insumo para las estrategias de prevención. */
export default async function SurveyResultsPage({ searchParams }: PageProps<'/sistema/campana/encuesta'>) {
  await requireStaff('oncology')
  const params = await searchParams
  const campaigns = await listCampaigns()
  const all = params.id === 'todas'
  const campaign = all ? undefined : campaigns.find((c) => c.id === params.id) ?? pickCurrentCampaign(campaigns)
  const surveys = await listPsychoSurveys(campaign?.id)

  return (
    <>
      <Link href={`/sistema/campana${campaign ? `?id=${campaign.id}` : ''}`} className="no-print -ml-1 mb-6 inline-flex items-center gap-0.5 text-[14px] text-accent-foreground hover:underline">
        <ChevronLeft size={17} aria-hidden="true" /> Campaña
      </Link>
      <PageHeader
        eyebrow={campaign ? `${campaign.name} · ${formatDate(campaign.date)}` : 'Todas las campañas y consultas'}
        title="Resultados de la encuesta de psico-oncología"
        description={`${surveys.length} encuesta(s) aplicada(s). Los porcentajes se calculan sobre quienes contestaron cada pregunta.`}
        actions={
          <div className="no-print flex flex-wrap gap-2">
            {all
              ? campaign === undefined && campaigns[0] && <Link href="/sistema/campana/encuesta" className="text-[13px] font-medium text-accent-foreground hover:underline">Ver solo la campaña actual</Link>
              : <Link href="/sistema/campana/encuesta?id=todas" className="text-[13px] font-medium text-accent-foreground hover:underline">Ver todas</Link>}
            <PrintButton />
          </div>
        }
      />
      {surveys.length ? (
        <div className="space-y-4">
          {psychoSurvey.map((section) => (
            <Card key={section.id} className="p-5 sm:p-7">
              <h2 className="text-title-3">{section.title}</h2>
              <ol className="mt-2 divide-y divide-separator">
                {section.questions.map((question, i) => <QuestionResult key={question.id} question={question} number={i + 1} surveys={surveys} />)}
              </ol>
            </Card>
          ))}
        </div>
      ) : <Card><EmptyState icon={ClipboardList} title="Aún no hay encuestas aplicadas" description="Se aplican desde el expediente de cada paciente (pestaña Oncología → Encuesta) o desde la agenda de la campaña." /></Card>}
    </>
  )
}
