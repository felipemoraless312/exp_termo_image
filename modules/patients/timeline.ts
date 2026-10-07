import { noteTemplates } from './note-templates'
import type { ClinicalRecord, Patient } from './types'

/*
 * Línea de tiempo del historial clínico: reúne en orden cronológico todo lo registrado en el expediente
 * (antecedentes, consultas, signos vitales, recetas, estudios, implantes, consentimientos y vacunas),
 * para que quien lo consulte vea la historia completa y no solo la última consulta.
 */

export type TimelineKind = 'nota' | 'signos' | 'receta' | 'estudio' | 'diagnostico' | 'antecedente' | 'dispositivo' | 'consentimiento' | 'vacuna' | 'alergia'

export const timelineKindLabels: Record<TimelineKind, string> = {
  nota: 'Consulta',
  signos: 'Signos vitales',
  receta: 'Tratamiento',
  estudio: 'Estudio',
  diagnostico: 'Diagnóstico',
  antecedente: 'Antecedente',
  dispositivo: 'Dispositivo',
  consentimiento: 'Consentimiento',
  vacuna: 'Vacuna',
  alergia: 'Alergia',
}

export type TimelineEvent = {
  id: string
  date: string
  kind: TimelineKind
  title: string
  detail?: string
  /** Para enlazar a la nota completa cuando el evento es una consulta. */
  noteId?: string
}

export function buildTimeline(patient: Patient, record: ClinicalRecord): TimelineEvent[] {
  const events: TimelineEvent[] = []
  const push = (event: TimelineEvent) => event.date && events.push(event)

  for (const note of record.notes) {
    push({
      id: note.id, date: note.createdAt, kind: 'nota', noteId: note.id,
      title: noteTemplates[note.type].label,
      detail: [note.diagnoses.map((d) => `${d.code ?? ''} ${d.description}`.trim()).join(' · '), note.author].filter(Boolean).join(' — '),
    })
  }
  for (const v of record.vitals) {
    const parts = [
      v.systolic && v.diastolic && `TA ${v.systolic}/${v.diastolic}`,
      v.heartRate && `FC ${v.heartRate}`,
      v.temperature && `T ${v.temperature} °C`,
      v.spo2 && `SpO₂ ${v.spo2} %`,
      v.glucose && `Glucosa ${v.glucose}`,
      v.weight && `Peso ${v.weight} kg`,
    ].filter(Boolean)
    push({ id: v.id, date: v.takenAt, kind: 'signos', title: 'Signos vitales', detail: parts.join(' · ') })
  }
  for (const m of record.medications) {
    push({ id: m.id, date: m.startDate, kind: 'receta', title: `Inicia ${m.name}`, detail: `${m.dose} · ${m.frequency} · ${m.duration} — ${m.prescribedBy}` })
  }
  for (const s of record.studies) {
    push({ id: `${s.id}-o`, date: s.orderedAt, kind: 'estudio', title: `Se solicita ${s.name}`, detail: s.indication })
    if (s.result) push({ id: `${s.id}-r`, date: s.result.at, kind: 'estudio', title: `Resultado: ${s.name}`, detail: s.result.summary })
  }
  for (const p of record.problems) {
    push({ id: p.id, date: p.since, kind: 'diagnostico', title: p.description, detail: [p.code, p.kind === 'cronico' ? 'Crónico' : 'Agudo', p.notes].filter(Boolean).join(' · ') })
  }
  for (const s of record.history.surgeries) {
    push({ id: s.id, date: s.date, kind: 'antecedente', title: `Cirugía: ${s.procedure}`, detail: [s.hospital, s.complications].filter(Boolean).join(' · ') })
  }
  for (const h of record.history.hospitalizations) {
    push({ id: h.id, date: h.date, kind: 'antecedente', title: `Hospitalización: ${h.reason}`, detail: h.days !== undefined ? `${h.days} días de estancia` : undefined })
  }
  for (const d of record.devices) {
    push({ id: d.id, date: d.implantedAt, kind: 'dispositivo', title: `Implante: ${d.type} ${d.brand}`, detail: [d.model, d.site].filter(Boolean).join(' · ') })
  }
  for (const c of record.consents) {
    push({ id: c.id, date: c.signedAt, kind: 'consentimiento', title: `Consentimiento: ${c.procedure}`, detail: c.status === 'revocado' ? 'Revocado' : `Otorgado por ${c.signerName}` })
  }
  for (const i of record.history.immunizations) {
    push({ id: i.id, date: i.date, kind: 'vacuna', title: i.vaccine, detail: i.dose })
  }
  for (const a of patient.allergies) {
    push({ id: a.id, date: a.recordedAt, kind: 'alergia', title: `Alergia a ${a.agent}`, detail: `${a.reaction} · ${a.severity}` })
  }

  return events.sort((a, b) => b.date.localeCompare(a.date))
}
