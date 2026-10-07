import type { StaffArea } from '@/modules/auth/permissions'

/**
 * Plantillas de notas según los apartados que exige la NOM-004-SSA3-2012 (numerales 6 a 9).
 * Toda nota incluye además: fecha y hora, signos vitales, diagnósticos (CIE-10),
 * pronóstico y nombre, cédula y firma de quien la elabora.
 */
export type NoteField = { key: string; label: string; hint?: string; rows?: number; required?: boolean }
export type NoteTemplate = { label: string; description: string; permission: StaffArea; prognosis: boolean; fields: NoteField[] }

export const noteTemplates = {
  'historia-clinica': {
    label: 'Historia clínica',
    description: 'Valoración inicial: interrogatorio, exploración física, diagnóstico y plan.',
    permission: 'notes.medical',
    prognosis: true,
    fields: [
      { key: 'motivo', label: 'Motivo de consulta', required: true, rows: 2 },
      { key: 'padecimiento', label: 'Padecimiento actual', hint: 'Inicio, evolución, características y estado actual.', required: true, rows: 5 },
      { key: 'aparatos', label: 'Interrogatorio por aparatos y sistemas', rows: 4 },
      { key: 'exploracion', label: 'Exploración física', hint: 'Habitus exterior, cabeza, cuello, tórax, abdomen, extremidades, genitales (si aplica).', required: true, rows: 6 },
      { key: 'estudios', label: 'Resultados de estudios previos', rows: 3 },
      { key: 'plan', label: 'Indicación terapéutica y plan', required: true, rows: 4 },
    ],
  },
  evolucion: {
    label: 'Nota de evolución',
    description: 'Seguimiento en formato SOAP.',
    permission: 'notes.medical',
    prognosis: true,
    fields: [
      { key: 'subjetivo', label: 'Subjetivo · evolución y actualización del cuadro clínico', required: true, rows: 4 },
      { key: 'objetivo', label: 'Objetivo · exploración física y resultados relevantes', required: true, rows: 4 },
      { key: 'analisis', label: 'Análisis', rows: 3 },
      { key: 'plan', label: 'Plan · tratamiento e indicaciones médicas', required: true, rows: 4 },
    ],
  },
  interconsulta: {
    label: 'Nota de interconsulta',
    description: 'Solicitud y respuesta de valoración por otro servicio.',
    permission: 'notes.medical',
    prognosis: true,
    fields: [
      { key: 'servicio', label: 'Servicio consultado', required: true, rows: 1 },
      { key: 'motivo', label: 'Motivo de la interconsulta', required: true, rows: 3 },
      { key: 'criterios', label: 'Criterios diagnósticos', rows: 3 },
      { key: 'sugerencias', label: 'Sugerencias diagnósticas y de tratamiento', required: true, rows: 4 },
    ],
  },
  urgencias: {
    label: 'Nota de urgencias',
    description: 'Atención inicial en el servicio de urgencias.',
    permission: 'notes.medical',
    prognosis: true,
    fields: [
      { key: 'motivo', label: 'Motivo de la atención', required: true, rows: 2 },
      { key: 'triage', label: 'Clasificación de triage', hint: 'Rojo, amarillo o verde, con la justificación.', rows: 1 },
      { key: 'resumen', label: 'Resumen del interrogatorio, exploración y estado mental', required: true, rows: 5 },
      { key: 'estudios', label: 'Resultados de estudios de urgencia', rows: 3 },
      { key: 'tratamiento', label: 'Tratamiento y procedimientos realizados', required: true, rows: 4 },
      { key: 'destino', label: 'Destino del paciente', hint: 'Alta, observación, hospitalización, quirófano o traslado.', required: true, rows: 1 },
    ],
  },
  preoperatoria: {
    label: 'Nota preoperatoria',
    description: 'Elaborada por el cirujano antes del procedimiento.',
    permission: 'notes.medical',
    prognosis: true,
    fields: [
      { key: 'fecha', label: 'Fecha programada de la cirugía', required: true, rows: 1 },
      { key: 'diagnostico', label: 'Diagnóstico preoperatorio', required: true, rows: 2 },
      { key: 'plan', label: 'Plan quirúrgico y tipo de intervención', required: true, rows: 3 },
      { key: 'riesgo', label: 'Riesgo quirúrgico', hint: 'ASA, Goldman u otra escala utilizada.', required: true, rows: 2 },
      { key: 'cuidados', label: 'Cuidados y plan terapéutico preoperatorios', rows: 3 },
    ],
  },
  postoperatoria: {
    label: 'Nota postoperatoria',
    description: 'Elaborada por el cirujano al terminar la intervención.',
    permission: 'notes.medical',
    prognosis: true,
    fields: [
      { key: 'diagnostico', label: 'Diagnóstico postoperatorio', required: true, rows: 2 },
      { key: 'operacion', label: 'Operación realizada y técnica quirúrgica', required: true, rows: 4 },
      { key: 'hallazgos', label: 'Hallazgos transoperatorios', required: true, rows: 3 },
      { key: 'conteo', label: 'Reporte de gasas y compresas', required: true, rows: 1 },
      { key: 'incidentes', label: 'Incidentes y accidentes', rows: 2 },
      { key: 'sangrado', label: 'Cuantificación de sangrado y transfusiones', rows: 1 },
      { key: 'equipo', label: 'Equipo quirúrgico (cirujano, ayudantes, anestesiólogo, instrumentista)', required: true, rows: 2 },
      { key: 'estado', label: 'Estado postquirúrgico inmediato', required: true, rows: 2 },
      { key: 'plan', label: 'Plan de manejo y tratamiento postoperatorio', required: true, rows: 3 },
      { key: 'patologia', label: 'Piezas enviadas a patología', rows: 1 },
    ],
  },
  egreso: {
    label: 'Nota de egreso',
    description: 'Resumen al alta hospitalaria.',
    permission: 'notes.medical',
    prognosis: true,
    fields: [
      { key: 'ingreso', label: 'Fecha de ingreso y de egreso', required: true, rows: 1 },
      { key: 'motivo', label: 'Motivo del egreso', hint: 'Mejoría, curación, alta voluntaria, traslado o defunción.', required: true, rows: 1 },
      { key: 'resumen', label: 'Resumen de la evolución y estado actual', required: true, rows: 5 },
      { key: 'manejo', label: 'Manejo durante la estancia hospitalaria', required: true, rows: 3 },
      { key: 'pendientes', label: 'Problemas clínicos pendientes', rows: 2 },
      { key: 'plan', label: 'Plan de manejo, tratamiento y recomendaciones de vigilancia', required: true, rows: 4 },
    ],
  },
  referencia: {
    label: 'Nota de referencia o traslado',
    description: 'Envío del paciente a otro establecimiento.',
    permission: 'notes.medical',
    prognosis: true,
    fields: [
      { key: 'destino', label: 'Establecimiento que envía y que recibe', required: true, rows: 2 },
      { key: 'motivo', label: 'Motivo de envío', required: true, rows: 2 },
      { key: 'resumen', label: 'Resumen clínico', required: true, rows: 5 },
      { key: 'terapeutica', label: 'Terapéutica empleada', rows: 3 },
    ],
  },
  enfermeria: {
    label: 'Nota de enfermería',
    description: 'Registro de valoración, cuidados y procedimientos de enfermería.',
    permission: 'notes.nursing',
    prognosis: false,
    fields: [
      { key: 'valoracion', label: 'Valoración y estado general', required: true, rows: 3 },
      { key: 'cuidados', label: 'Cuidados e intervenciones realizadas', required: true, rows: 4 },
      { key: 'medicamentos', label: 'Medicamentos administrados (fármaco, dosis, vía, hora)', rows: 3 },
      { key: 'riesgos', label: 'Escalas de riesgo', hint: 'Caídas (Downton), úlceras por presión (Braden), dolor.', rows: 2 },
      { key: 'observaciones', label: 'Observaciones y pendientes para el siguiente turno', rows: 3 },
    ],
  },
} satisfies Record<string, NoteTemplate>

export type NoteType = keyof typeof noteTemplates
export const noteTypes = Object.keys(noteTemplates) as NoteType[]

export const prognosisOptions = ['Bueno para la vida y para la función', 'Bueno para la vida, reservado para la función', 'Reservado a evolución', 'Malo para la vida', 'Grave'] as const
