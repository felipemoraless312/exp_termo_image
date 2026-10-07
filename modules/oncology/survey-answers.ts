import 'server-only'

import { reject, type FormFields } from '@/lib/server/form'
import { otherKey, patientSurveySections, psychoSurvey } from './psycho-survey'

/**
 * Lee y valida las respuestas de la encuesta de psico-oncología. La usan el personal (en el sistema)
 * y la propia paciente (en el portal), así que ambas capturas quedan con el mismo formato.
 * Desde el portal solo se leen las secciones de la paciente (no los resultados de laboratorio).
 */
export function readPsychoSurveyAnswers(form: FormFields, by: 'staff' | 'patient' = 'staff'): Record<string, string> {
  const sections = by === 'staff' ? psychoSurvey : patientSurveySections
  const answers: Record<string, string> = {}
  for (const question of sections.flatMap((section) => section.questions)) {
    let value = form.optional(question.id, 300)
    if (!value) continue
    if (question.options && !question.options.includes(value)) reject(`Respuesta no válida en: ${question.text}`)
    if (!question.options && question.input !== 'text') {
      value = value.replace(',', '.')
      if (!/^\d{1,4}(\.\d{1,2})?$/.test(value)) reject(`Escribe solo un número en: ${question.text}`)
    }
    answers[question.id] = value
    const detail = question.other && value === question.other ? form.optional(otherKey(question.id), 300) : undefined
    if (detail) answers[otherKey(question.id)] = detail
  }
  if (!Object.keys(answers).length) reject('La encuesta está vacía: contesta al menos una pregunta.')
  return answers
}
