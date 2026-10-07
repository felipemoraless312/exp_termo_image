import 'server-only'

import { reject, type FormFields } from '@/lib/server/form'
import { otherKey, psychoSurveyQuestions } from './psycho-survey'

/**
 * Lee y valida las respuestas de la encuesta de psico-oncología. La usan el personal (en el sistema)
 * y la propia paciente (en el portal), así que ambas capturas quedan con el mismo formato.
 */
export function readPsychoSurveyAnswers(form: FormFields): Record<string, string> {
  const answers: Record<string, string> = {}
  for (const question of psychoSurveyQuestions) {
    const value = form.optional(question.id, 300)
    if (!value) continue
    if (question.options && !question.options.includes(value)) reject(`Respuesta no válida en: ${question.text}`)
    if (question.input === 'number' && !/^\d{1,3}(\.\d)?$/.test(value)) reject(`Escribe solo un número en: ${question.text}`)
    answers[question.id] = value
    const detail = question.other && value === question.other ? form.optional(otherKey(question.id), 300) : undefined
    if (detail) answers[otherKey(question.id)] = detail
  }
  if (!Object.keys(answers).length) reject('La encuesta está vacía: contesta al menos una pregunta.')
  return answers
}
