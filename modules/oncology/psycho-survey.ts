/*
 * Encuesta de psico-oncología (`encuesta_psico.doc`): conocimiento de las mujeres sobre la prevención
 * del cáncer de mama y de cérvix. La definición vive aquí; la API solo guarda las respuestas
 * (`{ idPregunta: opción }`), así que cambiar el texto de una pregunta no altera lo ya capturado.
 * Las instrucciones de salto del original ("si la respuesta es NO pase a la 6") se muestran como ayuda.
 *
 * Versión 2 (`nueva_encuesta.xlsx`, formulario de Google): agrega preguntas de mastografía, detección oportuna,
 * conocimiento general del cáncer de mama y resultados de química sanguínea. El Excel solo trae el texto de las
 * preguntas, así que las que piden elegir de una lista que no viene en él quedan como respuesta abierta.
 */

import type { Stamp } from '@/modules/patients/stamp'

export const PSYCHO_SURVEY_KIND = 'psico-oncologia'
export const PSYCHO_SURVEY_VERSION = 2

export type SurveyQuestion = {
  id: string
  text: string
  /** Opciones de respuesta única. Sin opciones, es una respuesta abierta (`input`: número por omisión, o texto). */
  options?: readonly string[]
  /** Opción que habilita escribir el detalle ("Otros ___"). */
  other?: string
  input?: 'text' | 'number'
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
    id: 'general',
    title: 'Datos generales',
    questions: [
      { id: 'servicio', text: 'Usted viene al servicio de', options: ['Colposcopía', 'Clínica de Mama', 'Ambas', 'Otro'], other: 'Otro' },
      { id: 'vidaSexual', text: 'En caso de ser soltera, ¿cómo es su vida sexual?', options: ['Activa', 'Esporádica', 'Sin vida sexual'] },
      { id: 'aniosPareja', text: '¿Cuánto tiempo lleva viviendo con su pareja? (años)', input: 'number' },
    ],
  },
  {
    id: 'colposcopia',
    title: '¿Qué sabe usted de la colposcopía?',
    questions: [
      { id: 'col1', text: '¿Qué tan importante considera usted la colposcopía?', options: importance },
      { id: 'col2', text: '¿Sabe usted para qué sirve la colposcopía?', options: ['Para detectar lesiones precancerosas y cáncer', 'Para detectar infecciones', 'No sabe', 'Otros'], other: 'Otros' },
      { id: 'col3', text: 'Si vino a hacerse la colposcopía, ¿qué la motivó para hacerse el estudio?', options: ['Saber su estado de salud', 'Prevenir alguna enfermedad', 'Recomendación de algún familiar/amigo', 'Órdenes médicas', 'Porque tengo síntomas que me preocupan', 'Otros'], other: 'Otros' },
      { id: 'col4', text: '¿Es la primera vez que se la realiza?', options: yesNo, hint: 'Si la respuesta es NO, pase a la pregunta 6.' },
      { id: 'col5', text: 'Si respondió que SÍ, ¿por qué no había asistido a realizarse la prueba?', options: ['Porque no sabía que existía', 'Cuestiones económicas', 'Vergüenza', 'Miedo', 'Otros'], other: 'Otros' },
      { id: 'col6', text: 'Si respondió que NO, ¿cuántos estudios de colposcopía se ha realizado?', input: 'number' },
      { id: 'col7', text: '¿Tiene importancia para usted que sea un doctor o una doctora quien le haga la colposcopía?', options: yesNo },
      { id: 'col8', text: '¿Sabe usted con qué frecuencia se debe realizar una colposcopía?', options: frequency },
      { id: 'col9', text: '¿Cómo supo usted de la existencia de la colposcopía?', options: learnedFrom, other: 'Otros' },
      { id: 'col10', text: '¿Sabía usted si el cáncer de cérvix se puede detectar oportunamente?', options: yesNoUnknown },
      { id: 'col11', text: '¿Sabe usted qué pruebas se usan para la detección oportuna del cáncer de cérvix?', options: ['Papanicolaou', 'Colposcopía', 'Prueba de captura de híbridos', 'Todas las anteriores', 'No sabe'] },
      { id: 'col12', text: '¿Sabe con qué frecuencia debe realizarse un Papanicolaou?', options: frequency },
      { id: 'col13', text: '¿Sabe usted por qué es importante hacerse el estudio del Papanicolaou?', options: ['Detectar a tiempo un cáncer', 'Detecta infecciones', 'Otros', 'No sabe'], other: 'Otros' },
    ],
  },
  {
    id: 'cacu',
    title: '¿Qué sabe usted del cáncer cervicouterino o del cuello de la matriz?',
    questions: [
      { id: 'cacu1', text: '¿Sabe usted que existe el cáncer de cérvix?', options: yesNo, hint: 'Si la respuesta es NO, pase a la pregunta 3.' },
      { id: 'cacu2', text: 'Si su respuesta fue SÍ, ¿cómo se enteró usted que existe el cáncer de cérvix?', options: learnedFrom, other: 'Otros' },
      { id: 'cacu3', text: '¿Qué es lo que sabe acerca del cáncer cervicouterino?', options: ['Es una enfermedad que se puede detectar oportunamente', 'Es de transmisión sexual', 'Es una enfermedad incurable', '1 y 2 verdaderos', '1 y 2 falsos', 'No sabe'] },
      { id: 'cacu4', text: '¿Sabe usted qué es lo que provoca esta enfermedad?', options: ['Bacteria', 'Virus', 'Genética', 'No sabe', 'Otros'], other: 'Otros' },
      { id: 'cacu5', text: '¿Piensa que usted podría desarrollar un cáncer cervicouterino?', options: yesNoUnknown },
      { id: 'cacu6', text: 'Si su respuesta fue SÍ, explique por qué', options: ['Tengo la infección del virus del papiloma humano', 'Tengo un familiar con cáncer', 'Tengo flujo/dolor/sangrado', 'Resultado de Papanicolaou anormal', 'Otros', 'No sabe'], other: 'Otros' },
      { id: 'cacu7', text: '¿Considera importante para el desarrollo de un cáncer de cérvix el que usted no acuda a sus revisiones?', options: yesNoUnknown },
      { id: 'cacu8', text: '¿El número de parejas sexuales incrementa el riesgo de padecer este tipo de cáncer?', options: yesNoUnknown },
      { id: 'cacu9', text: '¿Considera usted que el comienzo de la vida sexual a edad muy temprana influye para que se desarrolle esta enfermedad?', options: yesNoUnknown },
      { id: 'cacu10', text: '¿Considera usted que el fumar aumenta el riesgo de desarrollar el cáncer de cérvix?', options: yesNoUnknown },
      { id: 'cacu11', text: '¿Considera usted que una alimentación sana previene el cáncer de cérvix?', options: yesNoUnknown },
    ],
  },
  {
    id: 'vph',
    title: '¿Qué sabe usted del VPH (virus del papiloma humano)?',
    questions: [
      { id: 'vph1', text: '¿Sabe usted qué es el virus del papiloma humano?', options: yesNoUnknown },
      { id: 'vph2', text: '¿Conoce a alguien que tenga o haya tenido virus del papiloma humano?', options: yesNoUnknown },
      { id: 'vph3', text: '¿Considera que el virus del papiloma humano es frecuente?', options: yesNoUnknown },
      { id: 'vph4', text: '¿Considera usted que el virus del papiloma humano se presenta con síntomas o molestias?', options: yesNoUnknown },
      { id: 'vph5', text: '¿Sabía usted que las verrugas genitales son una manifestación de infección por virus del papiloma humano?', options: yesNoUnknown },
      { id: 'vph6', text: '¿Sabe usted si existe alguna(s) prueba(s) para detectar este virus?', options: yesNoUnknown },
      { id: 'vph7', text: '¿Sabe usted si el Papanicolaou, la colposcopía y la prueba de captura de híbridos ayudan a identificar el virus del papiloma humano?', options: yesNoUnknown },
      { id: 'vph8', text: '¿Sabe usted que la prueba de captura de híbridos es la prueba más eficaz para detectar el virus del papiloma humano?', options: yesNoUnknown },
      { id: 'vph9', text: '¿Sabe si existe tratamiento(s) para la infección del virus del papiloma humano en el cérvix?', options: yesNoUnknown, hint: 'Si la respuesta es NO, pase a la pregunta 11.' },
      { id: 'vph10', text: 'Si la respuesta es SÍ, ¿podría especificar cuál(es)?', options: ['Criocirugía', 'Electrocirugía', 'Vaporización con láser', 'Todos los anteriores', 'Ninguno de los anteriores', 'No sabe'] },
      { id: 'vph11', text: '¿Sabe usted si existe una vacuna para prevenir el contagio del virus del papiloma humano?', options: yesNoUnknown },
      { id: 'vph12', text: '¿Sabe usted que la vacuna es eficaz sólo para las niñas y mujeres que no hayan iniciado vida sexual?', options: yesNoUnknown },
      { id: 'vph13', text: '¿Sabe usted que la vacuna también es eficaz en mujeres de 16 a 26 años con vida sexual pero que no se hayan contagiado todavía por el virus del papiloma humano?', options: yesNoUnknown },
      { id: 'vph14', text: '¿Sabe usted que la vacuna todavía NO debe aplicarse en niños, jóvenes y adultos?', options: yesNoUnknown },
      { id: 'vph15', text: '¿Sabe usted cómo se infecta el virus del papiloma humano?', options: yesNoUnknown },
      { id: 'vph16', text: 'El virus del papiloma humano se transmite únicamente por vía sexual', options: yesNoUnknown },
      { id: 'vph17', text: '¿Sabe usted si el virus del papiloma humano tiene efectos a largo plazo?', options: yesNoUnknown },
      { id: 'vph18', text: '¿La infección por el virus del papiloma humano puede provocar cáncer de cérvix?', options: yesNoUnknown },
      { id: 'vph19', text: '¿Sabe usted si el virus del papiloma humano también lo contraen los hombres?', options: yesNoUnknown },
      { id: 'vph20', text: '¿Qué le gustaría saber acerca del virus del papiloma humano?', options: ['Cómo se infecta', 'Los problemas que causa', 'Cómo se controla', 'Cómo se previene', 'Todos los anteriores', 'Nada'] },
      { id: 'vph21', text: '¿El uso del condón ayuda a prevenir la infección del virus del papiloma humano?', options: yesNoUnknown },
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
      { id: 'auto11', text: '¿De qué manera se autoexamina?', options: ['Acostada', 'Frente a un espejo', 'Mientras se baña'] },
      { id: 'auto12', text: '¿Desde qué edad examina sus senos? (años)', input: 'number' },
      { id: 'auto13', text: '¿En qué momento del ciclo menstrual debe examinarse?', options: ['Periodo menstrual', 'Una semana posterior al ciclo menstrual', 'En cualquier momento del ciclo menstrual', 'No sabe'] },
    ],
  },
  {
    id: 'cama',
    title: '¿Qué sabe usted del cáncer de mama?',
    questions: [
      { id: 'cama1', text: '¿Sabe usted que existe el cáncer de mama?', options: yesNo, hint: 'Si la respuesta es NO, pase a la pregunta 3.' },
      { id: 'cama2', text: 'Si su respuesta fue SÍ, ¿cómo se enteró usted que existe el cáncer de mama?', options: learnedFrom, other: 'Otros' },
      { id: 'cama3', text: '¿Qué es lo que sabe acerca del cáncer de mama?', options: ['Es una enfermedad que se puede detectar oportunamente', 'Es una enfermedad incurable', '1 y 2 verdaderos', '1 y 2 falsos', 'No sabe'] },
      { id: 'cama4', text: '¿El tener antecedente familiar de cáncer de mama incrementa el riesgo de padecerlo?', options: yesNoUnknown },
      { id: 'cama5', text: '¿Considera usted que el uso de anticonceptivos orales aumenta el riesgo de desarrollar un cáncer de mama?', options: yesNoUnknown },
      { id: 'cama6', text: '¿Considera usted que el fumar aumenta el riesgo de desarrollar un cáncer de mama?', options: yesNoUnknown },
      { id: 'cama7', text: '¿Sabe usted si la obesidad influye en el desarrollo del cáncer de seno?', options: yesNoUnknown },
      { id: 'cama8', text: '¿Una alimentación balanceada disminuye el riesgo de desarrollar este tipo de enfermedad?', options: yesNoUnknown },
      { id: 'cama9', text: '¿El ejercicio físico disminuye las probabilidades de desarrollar un cáncer de mama?', options: yesNoUnknown },
      { id: 'cama10', text: '¿Piensa que usted podría desarrollar un cáncer de seno?', options: yesNoUnknown },
      { id: 'cama11', text: 'Si respondió que SÍ, explique por qué', options: ['Tengo síntomas que me preocupan', 'Tengo un familiar con cáncer', 'Resultado de mastografía/ultrasonido anormal', 'Otros', 'No sabe'], other: 'Otros' },
      { id: 'cama12', text: '¿Considera importante para el desarrollo de un cáncer de seno el que usted no acuda a sus revisiones?', options: yesNoUnknown },
      { id: 'cama13', text: '¿Piensa usted que el cáncer de mama es exclusivo de mujeres mayores de 40 años?', options: yesNoUnknown },
      { id: 'cama14', text: '¿El enrojecimiento de la mama puede ser un síntoma de cáncer de mama?', options: yesNoUnknown },
      { id: 'cama15', text: '¿Considera usted que el hundimiento del pezón es un síntoma de este tipo de enfermedad?', options: yesNoUnknown },
      { id: 'cama16', text: '¿Sabe usted si los bultos o bolitas en el seno pueden ser un principio de cáncer de mama?', options: yesNoUnknown },
      { id: 'cama17', text: '¿Sabía usted si el cáncer de mama se puede detectar oportunamente?', options: yesNoUnknown },
      { id: 'cama18', text: '¿Sabe usted qué pruebas se usan para la detección oportuna del cáncer de mama?', options: ['Mastografía', 'Termografía', '1 y 2', 'Ultrasonido', 'Todos los anteriores', 'No sabe'] },
    ],
  },
  {
    id: 'mastografia',
    title: '¿Qué sabe usted de la mastografía?',
    questions: [
      { id: 'masto1', text: '¿Qué tan importante considera usted el estudio de la mastografía?', options: importance },
      { id: 'masto2', text: '¿Sabe usted para qué sirve la mastografía?', options: ['Para detectar un cáncer oportunamente', 'No sabe', 'Otros'], other: 'Otros' },
      { id: 'masto3', text: 'Si viene a realizarse la mastografía, ¿qué la motivó?', options: ['Saber su estado de salud', 'Prevenir alguna enfermedad', 'Recomendación de algún familiar/amigo', 'Órdenes médicas', 'Porque tengo síntomas que me preocupan', 'Otros'], other: 'Otros' },
      { id: 'masto4', text: '¿Es la primera vez que se la realiza?', options: yesNo, hint: 'Si la respuesta es NO, no conteste la siguiente pregunta.' },
      { id: 'masto5', text: 'Si respondió que SÍ, ¿por qué no había asistido a realizarse la prueba?', options: ['Porque no sabía que existía', 'Cuestiones económicas', 'Vergüenza', 'Miedo', 'Es dolorosa', 'Otros'], other: 'Otros' },
      { id: 'masto6', text: 'Si respondió que NO, ¿cuántos estudios de mastografía se ha realizado?', input: 'number' },
      { id: 'masto7', text: '¿Sabe usted si la mastografía emplea rayos X?', options: yesNoUnknown },
      { id: 'masto8', text: '¿Considera usted que los rayos X de la mastografía pueden ocasionarle algún tipo de cáncer?', options: yesNoUnknown },
      { id: 'masto9', text: '¿Tiene importancia para usted que sea un doctor o una doctora quien le haga la mastografía?', options: yesNo },
      { id: 'masto10', text: '¿Algún médico le ha recomendado realizarse la mastografía?', options: yesNo },
      { id: 'masto11', text: '¿Sabe usted con qué frecuencia se debe realizar una mastografía?', options: frequency },
      { id: 'masto12', text: '¿Cómo supo usted de la existencia de esta prueba?', options: learnedFrom, other: 'Otros' },
      { id: 'masto13', text: '¿Sabe cómo se realiza una mastografía?', options: yesNo },
      { id: 'masto14', text: '¿Sabe si durante la mastografía se ejerce presión sobre las mamas?', options: yesNoUnknown },
      { id: 'masto15', text: '¿Sabe qué molestias podría sentir durante el estudio?', options: yesNo },
      { id: 'masto16', text: '¿Sabe qué debe hacer si siente dolor o demasiada incomodidad durante el procedimiento?', options: yesNo },
      { id: 'masto17', text: '¿Considera que toda mujer que se realiza una mastografía tiene cáncer de mama?', options: yesNoUnknown },
      { id: 'masto18', text: '¿Un resultado anormal de mastografía significa necesariamente que la mujer tiene cáncer?', options: yesNoUnknown },
      { id: 'masto19', text: '¿Sabe qué puede suceder después de realizarse una mastografía?', options: yesNo },
      { id: 'masto20', text: '¿Sabe si una mujer puede necesitar otros estudios después de la mastografía?', options: yesNoUnknown },
      { id: 'masto21', text: '¿Qué estudios podrían solicitarse si se necesita evaluar una alteración?', input: 'text', hint: 'Puede anotar varios.' },
      { id: 'masto22', text: '¿Alguien le explicó previamente cómo se realiza el estudio?', options: yesNo },
      { id: 'masto23', text: '¿Sabe qué recomendaciones debe seguir antes de acudir a una mastografía?', options: yesNo },
      { id: 'masto24', text: '¿Qué le gustaría saber antes de realizarse el estudio?', input: 'text', hint: 'Puede anotar varias cosas.' },
      { id: 'masto25', text: '¿Cuál es su principal duda sobre la mastografía?', input: 'text' },
    ],
  },
  {
    id: 'deteccion',
    title: 'Detección oportuna del cáncer de mama',
    questions: [
      { id: 'det1', text: '¿Sabe qué significa detectar el cáncer de mama oportunamente?', options: yesNo },
      { id: 'det2', text: '¿Qué estudio conoce para detectar cambios en las mamas antes de que se presenten molestias?', input: 'text' },
      { id: 'det3', text: '¿Cuáles cambios pueden ser señales de alarma?', input: 'text', hint: 'Puede anotar varios.' },
      { id: 'det4', text: '¿Una bolita en la mama siempre significa que una mujer tiene cáncer?', options: yesNoUnknown },
      { id: 'det5', text: 'Si una mujer no tiene molestias, ¿significa que no necesita informarse sobre la detección del cáncer de mama?', options: yesNoUnknown },
      { id: 'det6', text: '¿Qué debe hacer una mujer si identifica un cambio nuevo en su mama?', input: 'text' },
      { id: 'det7', text: '¿Sabe qué es una mastografía?', options: yesNo },
      { id: 'det8', text: '¿Considera que la mastografía es útil para la detección temprana del cáncer de mama?', options: yesNoUnknown },
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
      { id: 'con5', text: '¿Quién puede desarrollar cáncer de mama?', input: 'text' },
      { id: 'con6', text: '¿Una mujer puede tener cáncer de mama aunque no sienta dolor ni tenga molestias?', options: yesNoUnknown },
      { id: 'con7', text: '¿Tener una madre, hermana o hija con cáncer de mama puede aumentar el riesgo de padecerlo?', options: yesNoUnknown },
      { id: 'con8', text: '¿Una mujer sin antecedentes familiares puede desarrollar cáncer de mama?', options: yesNoUnknown },
    ],
  },
  {
    id: 'quimica',
    title: 'Resultados de química sanguínea',
    description: 'La captura el personal con los resultados del laboratorio. Deje vacío lo que no se haya realizado.',
    staffOnly: true,
    questions: [
      { id: 'qs1', text: 'Glucosa (mg/dL)', input: 'number' },
      { id: 'qs2', text: 'Creatinina (mg/dL)', input: 'number', hint: 'Función renal.' },
      { id: 'qs3', text: 'Urea (mg/dL)', input: 'number', hint: 'Función renal.' },
      { id: 'qs4', text: 'Nitrógeno ureico en sangre (BUN) (mg/dL)', input: 'number', hint: 'Función renal.' },
      { id: 'qs5', text: 'Colesterol total (mg/dL)', input: 'number' },
      { id: 'qs6', text: 'Triglicéridos (mg/dL)', input: 'number' },
      { id: 'qs7', text: 'Colesterol HDL (mg/dL)', input: 'number' },
      { id: 'qs8', text: 'Colesterol LDL (mg/dL)', input: 'number' },
      { id: 'qs9', text: 'Ácido úrico (mg/dL)', input: 'number' },
      { id: 'qs10', text: 'TGO / AST (U/L)', input: 'number', hint: 'Función hepática (opcional).' },
      { id: 'qs11', text: 'TGP / ALT (U/L)', input: 'number', hint: 'Función hepática (opcional).' },
      { id: 'qs12', text: 'Bilirrubina total (mg/dL)', input: 'number', hint: 'Función hepática (opcional).' },
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
