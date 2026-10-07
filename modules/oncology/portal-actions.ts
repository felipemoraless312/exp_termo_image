'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

import type { ActionState } from '@/lib/action-state'
import { reject, runAction } from '@/lib/server/form'
import { audit } from '@/modules/audit/log'
import { requirePatient } from '@/modules/auth/session'
import { stampFor } from '@/modules/patients/stamp'
import { PSYCHO_SURVEY_KIND, PSYCHO_SURVEY_VERSION } from './psycho-survey'
import * as repository from './repository'
import { readPsychoSurveyAnswers } from './survey-answers'

/**
 * La paciente contesta la encuesta de psico-oncología desde su portal (nunca un contacto autorizado).
 * Queda ligada a su cita de campaña vigente y solo se contesta una vez por campaña.
 */
export async function submitOwnPsychoSurvey(_: ActionState, formData: FormData): Promise<ActionState> {
  let done = false
  const result = await runAction(formData, async (form) => {
    const patient = await requirePatient()
    const answers = readPsychoSurveyAnswers(form)
    const [chart, surveys] = await Promise.all([repository.findOncologyChart(patient.id), repository.listPatientSurveys(patient.id)])
    const appointment = chart?.appointments.find((a) => a.status !== 'cancelada' && a.status !== 'no-asistio')
    if (surveys.some((s) => s.kind === PSYCHO_SURVEY_KIND && s.campaignId === appointment?.campaign.id)) reject('Ya contestaste esta encuesta. ¡Gracias!')

    const by = `${patient.name} (contestada por la paciente en el portal)`
    await repository.insertSurvey(patient.id, {
      kind: PSYCHO_SURVEY_KIND, version: PSYCHO_SURVEY_VERSION, answers, appliedBy: by, recorded: stampFor(by),
      campaignId: appointment?.campaign.id, visit: appointment?.visit,
    })
    audit({ id: patient.id, name: patient.name, role: 'paciente' }, 'alta', 'Encuesta', patient.id, 'Contestó la encuesta de psico-oncología desde el portal')
    revalidatePath('/portal', 'layout')
    revalidatePath('/sistema', 'layout')
    done = true
  })
  if (done) redirect('/portal/encuesta')
  return result
}
