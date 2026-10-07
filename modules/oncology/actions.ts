'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

import type { ActionState } from '@/lib/action-state'
import { reject, runAction, type FormFields } from '@/lib/server/form'
import { audit } from '@/modules/audit/log'
import { requireStaff } from '@/modules/auth/session'
import * as patients from '@/modules/patients/repository'
import { stampFor } from '@/modules/patients/stamp'
import { site } from '@/config/site'
import * as repository from './repository'
import {
  answers, appointmentOrigins, appointmentStatuses, appointmentStatusInfo, recommendations, thermalGrades, vascularPatterns, visits,
  type BreastSide, type FamilyCancer, type ThermalSide,
} from './types'
import { currentAnswerKeys, PSYCHO_SURVEY_KIND, PSYCHO_SURVEY_VERSION } from './psycho-survey'
import { readPsychoSurveyAnswers } from './survey-answers'

const refresh = () => revalidatePath('/sistema', 'layout')

async function patientOf(form: FormFields) {
  const patient = await patients.findPatientById(form.text('patientId', 'Paciente'))
  return patient ?? reject('El expediente no existe.')
}

/** Imágenes adjuntas en el formulario (el campo vacío llega como un archivo de 0 bytes). */
function imagesFrom(formData: FormData): File[] {
  return formData.getAll('images').filter((value): value is File => value instanceof File && value.size > 0)
}

const time = /^([01]\d|2[0-3]):[0-5]\d$/

// ── Tamizaje y factores de riesgo ───────────────────────────────────────────────

export async function saveScreening(_: ActionState, formData: FormData): Promise<ActionState> {
  return runAction(formData, async (form) => {
    const user = await requireStaff('oncology.write')
    const patient = await patientOf(form)
    await repository.saveScreening(patient.id, {
      familyCancer: form.optionalChoice('familyCancer', answers),
      previousMammography: form.optionalChoice('previousMammography', answers),
      breastSelfExam: form.optionalChoice('breastSelfExam', answers),
      recentBloodChemistry: form.optionalChoice('recentBloodChemistry', answers),
      canBringBloodChemistry: form.optionalChoice('canBringBloodChemistry', answers),
      bloodChemistryReason: form.optional('bloodChemistryReason', 300),
      source: 'consulta',
      submittedAt: new Date().toISOString(),
      recorded: stampFor(user.name),
    })
    audit(user, 'modificacion', 'Oncología', patient.id, 'Actualizó el cuestionario de tamizaje de cáncer de mama')
    refresh()
    return { ok: true, message: 'Cuestionario actualizado' }
  })
}

export async function saveRiskFactors(_: ActionState, formData: FormData): Promise<ActionState> {
  return runAction(formData, async (form) => {
    const user = await requireStaff('oncology.write')
    const patient = await patientOf(form)

    const relatives = formData.getAll('fcRelative').map(String)
    const types = formData.getAll('fcType').map(String)
    const ages = formData.getAll('fcAge').map(String)
    const familyCancers: FamilyCancer[] = []
    relatives.forEach((relative, i) => {
      const cancerType = types[i]?.trim()
      if (!relative.trim() && !cancerType) return
      if (!relative.trim() || !cancerType) reject('Cada antecedente familiar necesita parentesco y tipo de cáncer.')
      const age = ages[i]?.trim() ? Number(ages[i]) : undefined
      if (age !== undefined && (!Number.isInteger(age) || age < 0 || age > 110)) reject('La edad al diagnóstico no es válida.')
      familyCancers.push({ relative: relative.trim(), cancerType, ageAtDiagnosis: age })
    })

    await repository.saveRiskFactors(patient.id, {
      personalBreastCancer: form.bool('personalBreastCancer'),
      personalOtherCancer: form.optional('personalOtherCancer', 200),
      familyCancers,
      firstPregnancyAge: form.number('firstPregnancyAge', 'Edad del primer embarazo', { min: 10, max: 60 }),
      breastfeedingMonths: form.number('breastfeedingMonths', 'Meses de lactancia', { min: 0, max: 240 }),
      hormoneTherapy: form.bool('hormoneTherapy'),
      hormoneTherapyDetail: form.optional('hormoneTherapyDetail', 200),
      previousBiopsy: form.bool('previousBiopsy'),
      atypicalHyperplasia: form.bool('atypicalHyperplasia'),
      chestRadiation: form.bool('chestRadiation'),
      knownMutation: form.optional('knownMutation', 80),
      lastMammography: form.date('lastMammography', 'Fecha de la última mastografía'),
      lastMammographyBirads: form.optional('lastMammographyBirads', 10),
      breastImplants: form.bool('breastImplants'),
      symptoms: form.list('symptoms'),
      notes: form.optional('notes', 1000),
      recorded: stampFor(user.name),
    })
    audit(user, 'modificacion', 'Oncología', patient.id, 'Actualizó los factores de riesgo de cáncer de mama')
    refresh()
    return { ok: true, message: 'Factores de riesgo guardados' }
  })
}

function readBreastSide(form: FormFields, side: 'right' | 'left'): BreastSide {
  const findings = form.list(`${side}Findings`)
  return {
    findings: findings.length ? findings : ['Sin alteraciones'],
    quadrant: form.optional(`${side}Quadrant`, 60),
    sizeCm: form.number(`${side}Size`, 'Tamaño de la lesión', { min: 0, max: 30 }),
    axillaryNodes: form.bool(`${side}Nodes`),
    notes: form.optional(`${side}Notes`, 500),
  }
}

export async function addBreastExam(_: ActionState, formData: FormData): Promise<ActionState> {
  return runAction(formData, async (form) => {
    const user = await requireStaff('oncology.write')
    const patient = await patientOf(form)
    const right = readBreastSide(form, 'right')
    const left = readBreastSide(form, 'left')
    for (const side of [right, left]) {
      if (side.findings.includes('Sin alteraciones') && side.findings.length > 1) reject('“Sin alteraciones” no puede combinarse con otros hallazgos en la misma mama.')
    }
    await repository.insertBreastExam(patient.id, { right, left, impression: form.optional('impression', 1000), examiner: user.name, recorded: stampFor(user.name) })
    audit(user, 'alta', 'Oncología', patient.id, 'Registró exploración clínica de mama')
    refresh()
    return { ok: true, message: 'Exploración registrada' }
  })
}

// ── Termografía ─────────────────────────────────────────────────────────────────

function readThermalSide(form: FormFields, side: 'right' | 'left', label: string): ThermalSide {
  return {
    maxTemp: form.number(`${side}Max`, `Temperatura máxima ${label}`, { min: 25, max: 42 }),
    meanTemp: form.number(`${side}Mean`, `Temperatura media ${label}`, { min: 25, max: 42 }),
    vascularPattern: form.optionalChoice(`${side}Pattern`, vascularPatterns),
    hotSpots: form.optional(`${side}HotSpots`, 200),
    grade: form.choice(`${side}Grade`, `Clasificación ${label}`, thermalGrades),
  }
}

export async function recordThermography(_: ActionState, formData: FormData): Promise<ActionState> {
  return runAction(formData, async (form) => {
    const user = await requireStaff('oncology.write')
    const patient = await patientOf(form)
    const images = imagesFrom(formData)
    const thermography = await repository.insertThermography(patient.id, {
      campaignId: form.optional('campaignId', 40),
      equipment: form.optional('equipment', 120),
      roomTemp: form.number('roomTemp', 'Temperatura de la sala', { min: 10, max: 35 }),
      acclimatizationMin: form.number('acclimatizationMin', 'Minutos de aclimatación', { min: 0, max: 60 }),
      right: readThermalSide(form, 'right', 'de la mama derecha'),
      left: readThermalSide(form, 'left', 'de la mama izquierda'),
      findings: form.text('findings', 'Hallazgos e interpretación', 4000),
      recommendation: form.optionalChoice('recommendation', recommendations),
      recommendationDetail: form.optional('recommendationDetail', 1000),
      performedBy: user.name,
      performedByLicense: user.license,
      recorded: stampFor(user.name),
    })
    audit(user, 'alta', 'Termografía', patient.id, `Registró la termografía ${thermography.folio} (${thermography.grade})`)
    refresh()

    if (images.length) {
      try {
        await repository.uploadThermographyImages(thermography.id, images, form.optional('imageLabel', 80), stampFor(user.name))
      } catch (error) {
        return { ok: false, error: `La termografía ${thermography.folio} se guardó, pero las imágenes no se subieron (${error instanceof Error ? error.message : 'error'}). Agrégalas desde la tarjeta del estudio.` }
      }
    }
    return { ok: true, message: `Termografía ${thermography.folio} registrada` }
  })
}

export async function addThermographyImages(_: ActionState, formData: FormData): Promise<ActionState> {
  return runAction(formData, async (form) => {
    const user = await requireStaff('oncology.write')
    const patient = await patientOf(form)
    const images = imagesFrom(formData)
    if (!images.length) reject('Selecciona al menos una imagen.')
    const thermographyId = form.text('thermographyId', 'Termografía')
    await repository.uploadThermographyImages(thermographyId, images, form.optional('imageLabel', 80), stampFor(user.name))
    audit(user, 'alta', 'Termografía', patient.id, `Agregó ${images.length} imagen(es) térmica(s)`)
    refresh()
    return { ok: true, message: 'Imágenes agregadas' }
  })
}

// ── Campañas ────────────────────────────────────────────────────────────────────

export async function createCampaign(_: ActionState, formData: FormData): Promise<ActionState> {
  return runAction(formData, async (form) => {
    const user = await requireStaff('oncology.write')
    const campaign = await repository.insertCampaign({
      name: form.text('name', 'Nombre', 160),
      date: form.requiredDate('date', 'Fecha'),
      location: form.optional('location', 200) ?? site.name,
      notes: form.optional('notes', 1000),
      recorded: stampFor(user.name),
    })
    audit(user, 'alta', 'Campaña', campaign.id, `Creó la campaña ${campaign.name} (${campaign.date})`)
    refresh()
    return { ok: true, message: 'Campaña creada' }
  })
}

export async function scheduleAppointment(_: ActionState, formData: FormData): Promise<ActionState> {
  return runAction(formData, async (form) => {
    const user = await requireStaff('oncology.write')
    const patient = await patientOf(form)
    const hour = form.text('time', 'Hora')
    if (!time.test(hour)) reject('Escribe la hora en formato de 24 h (p. ej. 10:30).')
    const origin = form.choice('origin', 'Tipo de registro', appointmentOrigins)
    await repository.insertAppointment(form.text('campaignId', 'Campaña'), {
      patientId: patient.id, time: hour, visit: form.choice('visit', 'Tipo de visita', visits), origin, notes: form.optional('notes', 500), recorded: stampFor(user.name),
    })
    audit(user, 'alta', 'Cita de campaña', patient.id, `${origin === 'espontanea' ? 'Registró llegada sin cita' : 'Agendó cita'} a las ${hour}`)
    refresh()
    return { ok: true, message: origin === 'espontanea' ? 'Paciente registrada en espera' : 'Cita agendada' }
  })
}

export async function setAppointmentStatus(_: ActionState, formData: FormData): Promise<ActionState> {
  return runAction(formData, async (form) => {
    const user = await requireStaff('campaign.checkin')
    const patient = await patientOf(form)
    const status = form.choice('status', 'Estado', appointmentStatuses)
    await repository.updateAppointment(form.text('appointmentId', 'Cita'), { status, recorded: stampFor(user.name) })
    audit(user, 'modificacion', 'Cita de campaña', patient.id, `Cita → ${appointmentStatusInfo[status].label.toLowerCase()}`)
    refresh()
    return { ok: true, message: status === 'presente' ? `Llegada de ${patient.firstName} registrada` : appointmentStatusInfo[status].label }
  })
}

// ── Encuesta de psico-oncología ─────────────────────────────────────────────────

export async function savePsychoSurvey(_: ActionState, formData: FormData): Promise<ActionState> {
  let target: string | undefined
  const result = await runAction(formData, async (form) => {
    const user = await requireStaff('oncology.write')
    const patient = await patientOf(form)
    const answers = readPsychoSurveyAnswers(form)

    const survey = await repository.insertSurvey(patient.id, {
      kind: PSYCHO_SURVEY_KIND, version: PSYCHO_SURVEY_VERSION, answers, appliedBy: user.name, recorded: stampFor(user.name),
      campaignId: form.optional('campaignId', 40), visit: form.optionalChoice('visit', visits),
    })
    audit(user, 'alta', 'Encuesta', patient.id, 'Registró la encuesta de psico-oncología')
    refresh()
    target = `/sistema/pacientes/${patient.id}/encuesta/${survey.id}`
  })
  if (target) redirect(target)
  return result
}

/** Corrige una encuesta ya guardada. Las respuestas anteriores quedan en el historial de la encuesta (API) y en la bitácora. */
export async function updatePsychoSurvey(_: ActionState, formData: FormData): Promise<ActionState> {
  let target: string | undefined
  const result = await runAction(formData, async (form) => {
    const user = await requireStaff('oncology.write')
    const patient = await patientOf(form)
    const surveyId = form.text('surveyId', 'Encuesta')
    const survey = (await repository.listPatientSurveys(patient.id)).find((s) => s.id === surveyId) ?? reject('La encuesta no existe.')
    const answers = readPsychoSurveyAnswers(form)
    // Respuestas a preguntas de versiones anteriores de la encuesta: el formulario actual no las muestra, así que se conservan.
    const kept = Object.fromEntries(Object.entries(survey.answers).filter(([key]) => !currentAnswerKeys.has(key)))
    const changed = [...new Set([...Object.keys(answers), ...Object.keys(survey.answers)])].filter((key) => currentAnswerKeys.has(key) && answers[key] !== survey.answers[key]).length

    await repository.updateSurvey(patient.id, survey.id, {
      answers: { ...kept, ...answers }, campaignId: form.optional('campaignId', 40), visit: form.optionalChoice('visit', visits), edited: stampFor(user.name),
    })
    audit(user, 'modificacion', 'Encuesta', patient.id, `Corrigió la encuesta de psico-oncología del ${survey.createdAt.slice(0, 10)} (${changed} respuesta(s) cambiada(s))`)
    refresh()
    target = `/sistema/pacientes/${patient.id}/encuesta/${survey.id}?editada=1`
  })
  if (target) redirect(target)
  return result
}
