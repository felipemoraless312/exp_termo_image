import { ActionForm } from '@/components/ui/action-form'
import { Card } from '@/components/ui/card'
import { Field, FieldGrid, Input, Select } from '@/components/ui/field'
import { formatDate } from '@/lib/format'
import { savePsychoSurvey } from '../actions'
import { otherKey, psychoSurvey, type SurveyQuestion } from '../psycho-survey'
import { visitLabels, visits, type Campaign, type Visit } from '../types'

/** Opciones como botones grandes (radio nativo): cómodo en tablet y sin JavaScript. */
function Question({ question, number }: { question: SurveyQuestion; number: number }) {
  const label = `${number}. ${question.text}`
  if (!question.options) {
    return (
      <Field label={label} hint={question.hint}>
        <Input name={question.id} inputMode="decimal" className="max-w-40" autoComplete="off" />
      </Field>
    )
  }
  return (
    <fieldset>
      <legend className="text-[15px] font-medium leading-6">{label}</legend>
      {question.hint && <p className="mt-0.5 text-[13px] text-subtle">{question.hint}</p>}
      <div className="mt-2.5 flex flex-wrap gap-2">
        {question.options.map((option) => (
          <label
            key={option}
            className="cursor-pointer select-none rounded-full border border-input bg-card px-3.5 py-2 text-[14px] leading-5 transition-colors hover:bg-muted has-[:checked]:border-primary has-[:checked]:bg-primary has-[:checked]:text-primary-foreground has-[:focus-visible]:ring-4 has-[:focus-visible]:ring-ring/30"
          >
            <input type="radio" name={question.id} value={option} className="sr-only" />
            {option}
          </label>
        ))}
      </div>
      {question.other && <Input name={otherKey(question.id)} placeholder={`Si eligió “${question.other}”, especifique`} className="mt-2.5 max-w-md" autoComplete="off" />}
    </fieldset>
  )
}

export function PsychoSurveyForm({ patientId, campaigns, campaignId, visit }: { patientId: string; campaigns: Campaign[]; campaignId?: string; visit?: Visit }) {
  return (
    <ActionForm action={savePsychoSurvey} submitLabel="Guardar encuesta" cancel={false} className="space-y-6">
      <input type="hidden" name="patientId" value={patientId} />
      <Card className="p-5 sm:p-7">
        <FieldGrid>
          <Field label="Campaña">
            <Select name="campaignId" defaultValue={campaignId ?? ''}>
              <option value="">Fuera de campaña</option>
              {campaigns.map((c) => <option key={c.id} value={c.id}>{c.name} · {formatDate(c.date, 'medium')}</option>)}
            </Select>
          </Field>
          <Field label="Visita">
            <Select name="visit" defaultValue={visit ?? 'primera-vez'}>{visits.map((v) => <option key={v} value={v}>{visitLabels[v]}</option>)}</Select>
          </Field>
        </FieldGrid>
      </Card>
      {psychoSurvey.map((section) => (
        <Card key={section.id} className="p-5 sm:p-7">
          <h2 className="text-title-3">{section.title}</h2>
          <div className="mt-6 space-y-7">
            {section.questions.map((question, i) => <Question key={question.id} question={question} number={i + 1} />)}
          </div>
        </Card>
      ))}
      <p className="px-1 text-[13px] leading-5 text-subtle">Las preguntas sin respuesta se guardan como no contestadas. Si no sabe la respuesta, marque “No sabe”.</p>
    </ActionForm>
  )
}
