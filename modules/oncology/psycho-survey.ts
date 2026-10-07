/*
 * Encuesta de psico-oncología (`encuesta_psico.doc`): conocimiento de las mujeres sobre la prevención
 * del cáncer de mama. La definición vive aquí; la API solo guarda las respuestas
 * (`{ idPregunta: opción }`), así que cambiar el texto de una pregunta no altera lo ya capturado.
 * Las instrucciones de salto del original ("si la respuesta es NO pase a la 6") se muestran como ayuda.
 *
 * Versión 3 (`nueva_encuesta_2.xlsx`, formulario de Google): solo las preguntas de ese archivo, en el orden y con el
 * texto exactos de sus encabezados (sin los datos de identificación, que ya están en el expediente, salvo la CURP).
 * Las preguntas que ya existían conservan su id, así que lo capturado antes con el mismo texto se sigue mostrando.
 * El Excel solo trae el texto, así que las que piden elegir de una lista que no viene en él quedan como respuesta abierta.
 */

import type { Stamp } from '@/modules/patients/stamp'

export const PSYCHO_SURVEY_KIND = 'psico-oncologia'
export const PSYCHO_SURVEY_VERSION = 3

export type SurveyQuestion = {
  id: string
  text: string
  /** Opciones de respuesta única. Sin opciones, es una respuesta abierta (`input`: número por omisión, o texto). */
  options?: readonly string[]
  /** Opción que habilita escribir el detalle ("Otros ___"). */
  other?: string
  /** `curp`: se valida el formato oficial (18 caracteres) y no se lista en los resultados agregados. */
  input?: 'text' | 'number' | 'curp'
  hint?: string
}

export type SurveySection = {
  id: string
  title: string
  description?: string
  /** Solo la captura el personal (p. ej. resultados de laboratorio); no se muestra a la paciente en el portal. */
  staffOnly?: boolean
  questions: SurveyQuestion[]
}

const yesNo = ['Sí', 'No'] as const
const yesNoUnknown = ['Sí', 'No', 'No sabe'] as const
const frequency = ['Cada año', 'Cada 2-3 años', 'Cada 5 años', 'Cada 10 años', 'No sabe'] as const
const importance = ['Poco', 'Regular', 'Mucho', 'No sabe'] as const
const learnedFrom = ['Doctor', 'Radio/Televisión/Prensa', 'Familiares/Amigos', 'Otros'] as const

export const psychoSurvey: SurveySection[] = [
  {
    id: 'identificacion',
    title: 'Datos de identificación',
    questions: [
      { id: 'curp', text: 'CURP', input: 'curp' },
    ],
  },
  {
    id: 'quimica',
    title: 'Resultados de química sanguínea',
    description: 'La captura el personal con los resultados del laboratorio. Deje vacío lo que no se haya realizado.',
    staffOnly: true,
    questions: [
      { id: 'qs1', text: '1.Glucosa (mg/dL)', input: 'number' },
      { id: 'qs2', text: '2. Creatinina (mg/dL)', input: 'number' },
      { id: 'qs3', text: '3. Urea (mg/dL)', input: 'number' },
      { id: 'qs4', text: '4. Nitrógeno Ureico en Sangre (BUN) (mg/dL)', input: 'number' },
      { id: 'qs5', text: '5. Colesterol Total (mg/dL)', input: 'number' },
      { id: 'qs6', text: '6. Triglicéridos (mg/dL)', input: 'number' },
      { id: 'qs7', text: '7. Colesterol HDL (mg/dL)', input: 'number' },
      { id: 'qs8', text: '8. Colesterol LDL (mg/dL)', input: 'number' },
      { id: 'qs9', text: '9.Ácido Úrico (mg/dL)', input: 'number' },
      { id: 'qs10', text: '10.Función Hepática ( Opcional) TGO / AST ( mg/dL / U/L )', input: 'number' },
      { id: 'qs11', text: '11.Función Hepática ( Opcional) TGP / ALT (U/L)', input: 'number' },
      { id: 'qs12', text: '12.Función Hepática ( Opcional) Bilirrubina Total (mg/dL)', input: 'number' },
    ],
  },
  {
    id: 'conocimiento',
    title: 'Conocimiento general sobre el cáncer de mama',
    questions: [
      { id: 'con1', text: '¿Ha escuchado hablar del cáncer de mama?', options: yesNo },
      { id: 'con2', text: '¿Sabe qué es el cáncer de mama?', options: yesNo },
      { id: 'con3', text: '¿Qué considera que es el cáncer de mama?', input: 'text' },
      { id: 'con4', text: '¿Considera que el cáncer de mama puede detectarse antes de que produzca síntomas?', options: yesNoUnknown },
      { id: 'con6', text: '¿Una mujer puede tener cáncer de mama aunque no sienta dolor ni tenga molestias?', options: yesNoUnknown },
      { id: 'con5', text: '¿Quién puede desarrollar cáncer de mama?', input: 'text' },
      { id: 'con7', text: '¿Tener una madre, hermana o hija con cáncer de mama puede aumentar el riesgo de padecerlo?', options: yesNoUnknown },
      { id: 'con8', text: '¿Una mujer sin antecedentes familiares puede desarrollar cáncer de mama?', options: yesNoUnknown },
    ],
  },
  {
    id: 'cama',
    title: '¿Qué sabe usted del cáncer de mama?',
    questions: [
      { id: 'camaB1', text: '¿Sabe usted que existe el cáncer de mama? (Si la respuesta es NO, omita la siguiente pregunta)', options: yesNo },
      { id: 'camaB2', text: 'Si su respuesta fue SÍ, ¿cómo se enteró usted que existe el cáncer de mama?', options: learnedFrom, other: 'Otros' },
      { id: 'camaB3', text: '¿Qué es lo que sabe acerca del cáncer de mama?', options: ['Es una enfermedad que se puede detectar oportunamente', 'Es una enfermedad incurable', '1 y 2 verdaderos', '1 y 2 falsos', 'No sabe'] },
      { id: 'camaB4', text: '¿El tener antecedente familiar de cáncer de mama incrementa el riesgo de padecerlo?', options: yesNoUnknown },
      { id: 'camaB5', text: '¿Considera usted que el uso de anticonceptivos orales aumenta el riesgo a desarrollar un cáncer de mama?', options: yesNoUnknown },
      { id: 'camaB6', text: '¿Considera usted que el fumar aumenta el riesgo a desarrollar un cáncer de mama?', options: yesNoUnknown },
      { id: 'camaB7', text: '¿Sabe usted si la obesidad influye en el desarrollo del cáncer de seno?', options: yesNoUnknown },
      { id: 'camaB8', text: '¿Una alimentación balanceada disminuye el riesgo a desarrollar este tipo de enfermedad?', options: yesNoUnknown },
      { id: 'camaB9', text: '¿El ejercicio físico disminuye las probabilidades de desarrollar un cáncer de mama?', options: yesNoUnknown },
      { id: 'camaB10', text: '¿Piensa que usted podría desarrollar un cáncer de seno?', options: yesNoUnknown },
      { id: 'camaB11', text: 'Si respondió que SÍ explique por qué:', options: ['Tengo síntomas que me preocupan', 'Tengo un familiar con cáncer', 'Resultado de mastografía/ultrasonido anormal', 'Otros', 'No sabe'], other: 'Otros' },
      { id: 'camaB12', text: 'Considera importante para el desarrollo de un cáncer de seno el que usted no acuda a sus revisiones', options: yesNoUnknown },
      { id: 'camaB13', text: '¿Piensa usted que el cáncer de mama es exclusivo en mujeres mayores de 40 años?', options: yesNoUnknown },
      { id: 'camaB14', text: '¿El enrojecimiento de la mama puede ser un síntoma de cáncer de mama?', options: yesNoUnknown },
      { id: 'camaB15', text: '¿Considera usted que el hundimiento del pezón es un síntoma de este tipo de enfermedad?', options: yesNoUnknown },
      { id: 'camaB16', text: '¿Sabe usted si los bultos o bolitas en el seno pueden ser un principio de cáncer de mama?', options: yesNoUnknown },
      { id: 'camaB17', text: '¿Sabía usted si el cáncer de mama se puede detectar oportunamente?', options: yesNoUnknown },
      { id: 'camaB18', text: '¿Sabe usted qué pruebas se usan para la detección oportuna del cáncer de mama?', options: ['Mastografía', 'Termografía', '1 y 2', 'Ultrasonido', 'Todos los anteriores', 'No sabe'] },
    ],
  },
  {
    id: 'deteccion',
    title: 'Detección oportuna del cáncer de mama',
    questions: [
      { id: 'det1', text: '¿Sabe qué significa detectar el cáncer de mama oportunamente?', options: yesNo },
      { id: 'det2', text: '¿Qué estudio conoce para detectar cambios en las mamas antes de que se presenten molestias?', input: 'text' },
      { id: 'det3', text: '¿Cuáles de los siguientes cambios pueden ser señales de alarma? (Puede marcar varias.)', input: 'text' },
      { id: 'det4', text: '¿Una bolita en la mama siempre significa que una mujer tiene cáncer?', options: yesNoUnknown },
      { id: 'det5', text: '¿Si una mujer no tiene molestias, significa que no necesita informarse sobre la detección del cáncer de mama?', options: yesNoUnknown },
      { id: 'det6', text: '¿Qué debe hacer una mujer si identifica un cambio nuevo en su mama?', input: 'text' },
      { id: 'det7', text: '¿Sabe qué es una mastografía?', options: yesNo },
      { id: 'det8', text: '¿Considera que la mastografía es útil para la detección temprana del cáncer de mama?', options: yesNoUnknown },
    ],
  },
  {
    id: 'autoexamen',
    title: '¿Qué sabe usted del autoexamen mamario?',
    questions: [
      { id: 'auto1', text: '¿Sabe usted que las mujeres deben autoexaminarse los senos?', options: yesNo },
      { id: 'auto2', text: '¿Usted examina sus senos?', options: yesNo },
      { id: 'auto3', text: 'En caso de que no examine sus senos, ¿cuál es la razón?', options: ['No sabe cómo hacerlo', 'Toma mucho tiempo', 'Me da vergüenza', 'No es agradable', 'Otro'], other: 'Otro' },
      { id: 'auto4', text: '¿Qué tan importante considera la autoexploración para la detección oportuna del cáncer de seno?', options: importance },
      { id: 'auto5', text: '¿Cada cuánto tiempo examina sus senos?', options: ['A diario', 'Cada semana', 'Cada mes', 'A veces', 'Nunca'] },
      { id: 'auto6', text: '¿Se examina también sus axilas?', options: yesNo },
      { id: 'auto7', text: '¿Se examina también el cuello?', options: yesNo },
      { id: 'auto8', text: '¿Cuánto tiempo dedica para examinarse?', options: ['10 min', 'Más de 10 min', 'Menos de 10 min'] },
      { id: 'auto9', text: '¿Alguien le enseñó a examinarse?', options: yesNo },
      { id: 'auto10', text: '¿Quién?', options: ['Familiar', 'Conocido', 'Tele/Radio/Prensa', 'Médico/Enfermera'] },
      { id: 'auto11', text: '¿De qué manera se auto-examina?', options: ['Acostada', 'Frente a un espejo', 'Mientras se baña'] },
      { id: 'auto12', text: '¿Desde que edad examina sus senos?', input: 'number' },
      { id: 'auto13', text: '¿En qué momento del ciclo menstrual debe examinarse?', options: ['Periodo menstrual', 'Una semana posterior al ciclo menstrual', 'En cualquier momento del ciclo menstrual', 'No sabe'] },
    ],
  },
  {
    id: 'mastografia',
    title: '¿Qué sabe usted de la mastografía?',
    questions: [
      { id: 'masto1', text: '¿Qué tan importante considera usted el estudio de la mastografía?', options: importance },
      { id: 'masto2', text: '¿Sabe usted para qué sirve una mastografía?', options: ['Para detectar un cáncer oportunamente', 'No sabe', 'Otros'], other: 'Otros' },
      { id: 'masto13', text: '¿Sabe cómo se realiza una mastografía?', options: yesNo },
      { id: 'masto14', text: '¿Sabe si durante la mastografía se ejerce presión sobre las mamas?', options: yesNoUnknown },
      { id: 'masto15', text: '¿Sabe qué molestias podría sentir durante el estudio?', options: yesNo },
      { id: 'masto16', text: '¿Sabe qué debe hacer si siente dolor o demasiada incomodidad durante el procedimiento?', options: yesNo },
      { id: 'masto3', text: '¿Si viene a realizarse la mastografía qué la motivó?', options: ['Saber su estado de salud', 'Prevenir alguna enfermedad', 'Recomendación de algún familiar/amigo', 'Órdenes médicas', 'Porque tengo síntomas que me preocupan', 'Otros'], other: 'Otros' },
      { id: 'masto4', text: '¿Es la primera vez que se la realiza? (Si la respuesta es NO, no conteste la siguiente pregunta)', options: yesNo },
      { id: 'masto5', text: 'Si respondió que SÍ ¿Por qué no había asistido a realizarse la prueba?', options: ['Porque no sabía que existía', 'Cuestiones económicas', 'Vergüenza', 'Miedo', 'Es dolorosa', 'Otros'], other: 'Otros' },
      { id: 'masto6', text: 'Si respondió que NO, especifique ¿cuántos estudios de mastografía se ha realizado?', input: 'number' },
      { id: 'masto22', text: '¿Alguien le explicó previamente cómo se realiza el estudio?', options: yesNo },
      { id: 'masto23', text: '¿Sabe qué recomendaciones debe seguir antes de acudir a una mastografía?', options: yesNo },
      { id: 'masto7', text: '¿Sabe usted si la mastografía emplea rayos x?', options: yesNoUnknown },
      { id: 'masto17', text: '¿Considera que toda mujer que se realiza una mastografía tiene cáncer de mama?', options: yesNoUnknown },
      { id: 'masto8', text: '¿Considera usted que los rayos x de la mastografía pueden ocasionarle algún tipo de cáncer?', options: yesNoUnknown },
      { id: 'masto18', text: '¿Un resultado anormal de mastografía significa necesariamente que la mujer tiene cáncer?', options: yesNoUnknown },
      { id: 'masto19', text: '¿Sabe qué puede suceder después de realizarse una mastografía?', options: yesNo },
      { id: 'masto20', text: '¿Sabe si una mujer puede necesitar otros estudios después de la mastografía?', options: yesNoUnknown },
      { id: 'masto21', text: '¿Qué estudios podrían solicitarse si se necesita evaluar una alteración? (Puede marcar varias)', input: 'text' },
      { id: 'masto9', text: '¿Tiene importancia para usted que sea un doctor o una doctora quien le haga la mastografía?', options: yesNo },
      { id: 'masto10', text: '¿Algún médico le ha recomendado realizarse la mastografía?', options: yesNo },
      { id: 'masto11', text: '¿Sabe usted con que frecuencia se debe realizar una mastografía?', options: frequency },
      { id: 'masto12', text: '¿Cómo supo usted de la existencia de esta prueba?', options: learnedFrom, other: 'Otros' },
      { id: 'masto24', text: '¿Qué le gustaría saber antes de realizarse el estudio? (Puede marcar varias)', input: 'text' },
      { id: 'masto25', text: '¿Cuál es su principal duda sobre la mastografía?', input: 'text' },
    ],
  },
]

/** Lo que contesta la paciente desde el portal (sin las secciones que captura el personal). */
export const patientSurveySections = psychoSurvey.filter((section) => !section.staffOnly)

export const psychoSurveyQuestions = psychoSurvey.flatMap((section) => section.questions)
export const otherKey = (questionId: string) => `${questionId}__otro`

export interface SurveyResponse {
  id: string
  kind: string
  version: number
  patientId: string
  campaignId?: string
  visit?: 'primera-vez' | 'subsecuente'
  answers: Record<string, string>
  appliedBy: string
  createdAt: string
  recorded?: Stamp
}

/** Respuestas contestadas (sin contar los detalles de "Otros"). */
export function answeredCount(answers: Record<string, string>) {
  return psychoSurveyQuestions.filter((q) => answers[q.id]).length
}
