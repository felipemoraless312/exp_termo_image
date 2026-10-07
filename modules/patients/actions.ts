'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

import type { ActionState } from '@/lib/action-state'
import { reject, runAction, type FormFields } from '@/lib/server/form'
import { newId } from '@/lib/server/memory'
import { todayISO } from '@/lib/format'
import { audit } from '@/modules/audit/log'
import { canAccess } from '@/modules/auth/permissions'
import { requireStaff } from '@/modules/auth/session'
import { parseDiagnosis } from '@/modules/catalogs/cie10'
import { allergyKinds, allergySeverities, bloodTypes, mriSafety, sexes, studyCategories } from '@/modules/catalogs/clinical'
import { allergyConflicts } from './clinical-rules'
import { noteTemplates, noteTypes } from './note-templates'
import * as repository from './repository'
import { sealNote } from './signature'
import { stampFor } from './stamp'
import { site } from '@/config/site'
import { patientStatuses, type ClinicalNote, type ClinicalRecord, type Consciousness, type Patient } from './types'

const refresh = () => revalidatePath('/sistema', 'layout')

/** Persiste la ficha y el expediente modificados por la acción y refresca las páginas del sistema. */
async function commit(patient: Patient, record?: ClinicalRecord) {
  await repository.saveChart(patient, record)
  refresh()
}

async function recordOf(form: FormFields): Promise<{ patient: Patient; record: ClinicalRecord }> {
  const id = form.text('patientId', 'Paciente')
  const [patient, record] = await Promise.all([repository.findPatientById(id), repository.findRecordByPatientId(id)])
  if (!patient || !record) reject('El expediente no existe.')
  return { patient, record }
}

// ── Ficha de identificación ─────────────────────────────────────────────────────

const curpPattern = /^[A-Z]{4}\d{6}[HMX][A-Z]{5}[A-Z0-9]\d$/

function readDemographics(form: FormFields) {
  const firstName = form.text('firstName', 'Nombre', 80)
  const lastName = form.text('lastName', 'Primer apellido', 80)
  const secondLastName = form.optional('secondLastName', 80)
  const curp = form.optional('curp', 18)?.toUpperCase()
  if (curp && !curpPattern.test(curp)) reject('La CURP no tiene un formato válido (18 caracteres).')
  const birthDate = form.requiredDate('birthDate', 'Fecha de nacimiento')
  if (birthDate > todayISO()) reject('La fecha de nacimiento no puede ser futura.')
  const phone = form.text('phone', 'Teléfono', 20)
  if (phone.replace(/\D/g, '').length < 10) reject('Escribe un teléfono de 10 dígitos.')
  const email = form.optional('email', 120)
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) reject('El correo no es válido.')

  return {
    firstName, lastName, secondLastName, curp, birthDate, phone, email,
    name: [firstName, lastName, secondLastName].filter(Boolean).join(' '),
    birthPlace: form.optional('birthPlace', 120),
    sex: form.choice('sex', 'Sexo', sexes),
    maritalStatus: form.optional('maritalStatus', 40),
    occupation: form.optional('occupation', 80),
    education: form.optional('education', 40),
    religion: form.optional('religion', 60),
    indigenousLanguage: form.optional('indigenousLanguage', 60),
    bloodType: form.optionalChoice('bloodType', bloodTypes) ?? 'Desconocido',
    // Domicilio y contacto de emergencia pueden quedar pendientes (p. ej. pacientes del preregistro de una campaña).
    address: {
      street: form.optional('street', 160) ?? '',
      neighborhood: form.optional('neighborhood', 100) ?? '',
      municipality: form.optional('municipality', 100) ?? '',
      state: form.optional('state', 60) ?? '',
      zip: form.optional('zip', 5) ?? '',
    },
    insurance: { type: form.optional('insuranceType', 60) ?? '', policy: form.optional('insurancePolicy', 40) },
    emergencyContact: {
      name: form.optional('emergencyName', 120) ?? '',
      relationship: form.optional('emergencyRelationship', 40) ?? '',
      phone: form.optional('emergencyPhone', 20) ?? '',
    },
  } satisfies Partial<Patient>
}

export async function createPatient(_: ActionState, formData: FormData): Promise<ActionState> {
  let target: string | undefined
  const result = await runAction(formData, async (form) => {
    const user = await requireStaff('patients.write')
    const data = readDemographics(form)
    if (data.curp && (await repository.findPatientByCurp(data.curp))) reject('Ya existe un expediente con esa CURP.')

    const patient = await repository.insertPatient({ ...data, status: 'activo', allergies: [], registered: stampFor(user.name) })
    const folio = patient.record
    audit(user, 'alta', 'Expediente', patient.id, `Abrió el expediente ${folio} de ${patient.name}`)
    refresh()
    target = canAccess(user.role, 'record') ? `/sistema/pacientes/${patient.id}` : `/sistema/pacientes?q=${encodeURIComponent(folio)}`
  })
  // redirect() fuera de runAction: lanza una excepción que Next necesita recibir intacta.
  if (target) redirect(target)
  return result
}

export async function updatePatient(_: ActionState, formData: FormData): Promise<ActionState> {
  let id: string | undefined
  const result = await runAction(formData, async (form) => {
    const user = await requireStaff('patients.write')
    id = form.text('patientId', 'Paciente')
    const data = readDemographics(form)
    const status = form.optionalChoice('status', patientStatuses)
    const duplicate = data.curp ? await repository.findPatientByCurp(data.curp) : undefined
    if (duplicate && duplicate.id !== id) reject('Otra persona ya tiene registrada esa CURP.')
    const patient = await repository.updatePatient(id, (p) => Object.assign(p, data, status ? { status } : {}, { updated: stampFor(user.name) }))
    if (!patient) reject('El expediente no existe.')
    audit(user, 'modificacion', 'Expediente', patient.id, 'Actualizó la ficha de identificación')
    refresh()
  })
  if (id && result?.ok) redirect(`/sistema/pacientes/${id}?seccion=historia`)
  return result
}

// ── Alergias y lista de problemas ───────────────────────────────────────────────

export async function addAllergy(_: ActionState, formData: FormData): Promise<ActionState> {
  return runAction(formData, async (form) => {
    const user = await requireStaff('record.write')
    const { patient } = await recordOf(form)
    const agent = form.text('agent', 'Agente', 80)
    if (patient.allergies.some((a) => a.agent.toLowerCase() === agent.toLowerCase())) reject('Esa alergia ya está registrada.')
    patient.allergies.push({
      id: newId('al'), agent,
      kind: form.choice('kind', 'Tipo de alergia', allergyKinds),
      reaction: form.text('reaction', 'Reacción', 200),
      severity: form.choice('severity', 'Severidad', allergySeverities),
      recordedAt: todayISO(),
      registered: stampFor(user.name),
    })
    audit(user, 'alta', 'Alergia', patient.id, `Registró alergia a ${agent}`)
    await commit(patient)
    return { ok: true, message: 'Alergia registrada' }
  })
}

export async function removeAllergy(_: ActionState, formData: FormData): Promise<ActionState> {
  return runAction(formData, async (form) => {
    const user = await requireStaff('record.write')
    const { patient } = await recordOf(form)
    const allergyId = form.text('allergyId', 'Alergia')
    const allergy = patient.allergies.find((a) => a.id === allergyId) ?? reject('La alergia no existe.')
    const reason = form.text('reason', 'Motivo', 200)
    patient.allergies = patient.allergies.filter((a) => a.id !== allergyId)
    audit(user, 'cancelacion', 'Alergia', patient.id, `Descartó la alergia a ${allergy.agent}: ${reason}`)
    await commit(patient)
    return { ok: true, message: 'Alergia descartada' }
  })
}

export async function addProblem(_: ActionState, formData: FormData): Promise<ActionState> {
  return runAction(formData, async (form) => {
    const user = await requireStaff('record.write')
    const { patient, record } = await recordOf(form)
    const diagnosis = parseDiagnosis(form.text('diagnosis', 'Diagnóstico', 200))
    record.problems.unshift({
      id: newId('pr'), ...diagnosis,
      kind: form.choice('kind', 'Tipo', ['cronico', 'agudo'] as const),
      status: 'activo',
      since: form.date('since', 'Fecha de inicio') ?? todayISO(),
      notes: form.optional('notes', 300),
      registered: stampFor(user.name),
    })
    audit(user, 'alta', 'Problema clínico', patient.id, `Agregó ${diagnosis.code ?? ''} ${diagnosis.description}`.trim())
    await commit(patient, record)
    return { ok: true, message: 'Diagnóstico agregado' }
  })
}

export async function updateProblemStatus(_: ActionState, formData: FormData): Promise<ActionState> {
  return runAction(formData, async (form) => {
    const user = await requireStaff('record.write')
    const { patient, record } = await recordOf(form)
    const problem = record.problems.find((p) => p.id === form.text('problemId', 'Problema')) ?? reject('El diagnóstico no existe.')
    problem.status = form.choice('status', 'Estado', ['activo', 'controlado', 'resuelto'] as const)
    problem.updated = stampFor(user.name)
    audit(user, 'modificacion', 'Problema clínico', patient.id, `Cambió ${problem.description} a ${problem.status}`)
    await commit(patient, record)
    return { ok: true, message: 'Estado actualizado' }
  })
}

// ── Antecedentes ────────────────────────────────────────────────────────────────

export async function addFamilyHistory(_: ActionState, formData: FormData): Promise<ActionState> {
  return runAction(formData, async (form) => {
    const user = await requireStaff('record.write')
    const { patient, record } = await recordOf(form)
    const item = { id: newId('fh'), relative: form.text('relative', 'Parentesco', 40), condition: form.text('condition', 'Padecimiento', 120), notes: form.optional('notes', 200), registered: stampFor(user.name) }
    record.history.family.push(item)
    audit(user, 'alta', 'Antecedente heredofamiliar', patient.id, `${item.relative}: ${item.condition}`)
    await commit(patient, record)
    return { ok: true, message: 'Antecedente agregado' }
  })
}

export async function addSurgery(_: ActionState, formData: FormData): Promise<ActionState> {
  return runAction(formData, async (form) => {
    const user = await requireStaff('record.write')
    const { patient, record } = await recordOf(form)
    const item = {
      id: newId('sx'), procedure: form.text('procedure', 'Procedimiento', 160), date: form.requiredDate('date', 'Fecha'),
      hospital: form.optional('hospital', 120), complications: form.optional('complications', 200), registered: stampFor(user.name),
    }
    record.history.surgeries.push(item)
    audit(user, 'alta', 'Antecedente quirúrgico', patient.id, item.procedure)
    await commit(patient, record)
    return { ok: true, message: 'Antecedente quirúrgico agregado' }
  })
}

export async function addHospitalization(_: ActionState, formData: FormData): Promise<ActionState> {
  return runAction(formData, async (form) => {
    const user = await requireStaff('record.write')
    const { patient, record } = await recordOf(form)
    const item = { id: newId('hz'), reason: form.text('reason', 'Motivo', 160), date: form.requiredDate('date', 'Fecha'), days: form.number('days', 'Días de estancia', { min: 0, max: 365 }), registered: stampFor(user.name) }
    record.history.hospitalizations.push(item)
    audit(user, 'alta', 'Hospitalización previa', patient.id, item.reason)
    await commit(patient, record)
    return { ok: true, message: 'Hospitalización agregada' }
  })
}

export async function addImmunization(_: ActionState, formData: FormData): Promise<ActionState> {
  return runAction(formData, async (form) => {
    const user = await requireStaff('record.write')
    const { patient, record } = await recordOf(form)
    const item = { id: newId('im'), vaccine: form.text('vaccine', 'Vacuna', 80), dose: form.text('dose', 'Dosis', 40), date: form.requiredDate('date', 'Fecha de aplicación'), lot: form.optional('lot', 40), registered: stampFor(user.name) }
    record.history.immunizations.push(item)
    audit(user, 'alta', 'Inmunización', patient.id, `${item.vaccine} (${item.dose})`)
    await commit(patient, record)
    return { ok: true, message: 'Vacuna registrada' }
  })
}

export async function updateHistory(_: ActionState, formData: FormData): Promise<ActionState> {
  return runAction(formData, async (form) => {
    const user = await requireStaff('record.write')
    const { patient, record } = await recordOf(form)
    record.history.nonPathological = {
      smoking: form.choice('smoking', 'Tabaquismo', ['nunca', 'exfumador', 'actual'] as const),
      cigarettesPerDay: form.number('cigarettesPerDay', 'Cigarrillos al día', { min: 0, max: 100 }),
      smokingYears: form.number('smokingYears', 'Años fumando', { min: 0, max: 90 }),
      alcohol: form.choice('alcohol', 'Consumo de alcohol', ['no', 'ocasional', 'frecuente'] as const),
      alcoholDetail: form.optional('alcoholDetail', 160),
      drugs: form.optional('drugs', 160),
      physicalActivity: form.optional('physicalActivity', 160),
      diet: form.optional('diet', 200),
      sleep: form.optional('sleep', 80),
      housing: form.optional('housing', 200),
      zoonosis: form.optional('zoonosis', 160),
    }
    record.history.transfusions = form.optional('transfusions', 300)
    record.history.traumas = form.optional('traumas', 300)
    record.history.updated = stampFor(user.name)

    if (patient.sex === 'mujer') {
      record.history.gynecoObstetric = {
        menarche: form.number('menarche', 'Menarca', { min: 7, max: 20 }),
        cycles: form.optional('cycles', 60),
        lastMenstrualPeriod: form.date('lastMenstrualPeriod', 'FUM'),
        sexualOnset: form.number('sexualOnset', 'IVSA', { min: 8, max: 80 }),
        pregnancies: form.number('pregnancies', 'Gestas', { min: 0, max: 30 }),
        births: form.number('births', 'Partos', { min: 0, max: 30 }),
        cesareans: form.number('cesareans', 'Cesáreas', { min: 0, max: 30 }),
        abortions: form.number('abortions', 'Abortos', { min: 0, max: 30 }),
        contraception: form.optional('contraception', 80),
        lastPap: form.date('lastPap', 'Última citología'),
        lastMammography: form.date('lastMammography', 'Última mastografía'),
        menopause: form.number('menopause', 'Menopausia', { min: 20, max: 70 }),
      }
    }
    audit(user, 'modificacion', 'Historia clínica', patient.id, 'Actualizó antecedentes personales no patológicos')
    await commit(patient, record)
    return { ok: true, message: 'Antecedentes actualizados' }
  })
}

// ── Signos vitales ──────────────────────────────────────────────────────────────

export async function recordVitals(_: ActionState, formData: FormData): Promise<ActionState> {
  return runAction(formData, async (form) => {
    const user = await requireStaff('record.write')
    const { patient, record } = await recordOf(form)
    const systolic = form.number('systolic', 'TA sistólica', { min: 40, max: 300 })
    const diastolic = form.number('diastolic', 'TA diastólica', { min: 20, max: 200 })
    if ((systolic === undefined) !== (diastolic === undefined)) reject('Registra la presión sistólica y diastólica juntas.')
    if (systolic !== undefined && diastolic !== undefined && diastolic >= systolic) reject('La diastólica debe ser menor que la sistólica.')
    const heightCm = form.number('height', 'Estatura', { min: 30, max: 250 })

    const vitals = {
      id: newId('vs'), takenAt: new Date().toISOString(), systolic, diastolic,
      heartRate: form.number('heartRate', 'Frecuencia cardiaca', { min: 20, max: 250 }),
      respiratoryRate: form.number('respiratoryRate', 'Frecuencia respiratoria', { min: 4, max: 70 }),
      temperature: form.number('temperature', 'Temperatura', { min: 30, max: 44 }),
      spo2: form.number('spo2', 'Saturación', { min: 50, max: 100 }),
      onOxygen: form.bool('onOxygen'),
      consciousness: (form.optionalChoice('consciousness', ['A', 'C', 'V', 'P', 'U'] as const) ?? 'A') as Consciousness,
      glucose: form.number('glucose', 'Glucosa capilar', { min: 10, max: 900 }),
      weight: form.number('weight', 'Peso', { min: 0.5, max: 400 }),
      height: heightCm ? heightCm / 100 : undefined,
      pain: form.number('pain', 'Dolor (EVA)', { min: 0, max: 10 }),
      notes: form.optional('notes', 300),
      recordedBy: user.name,
      registered: stampFor(user.name),
    }
    const measured = [vitals.systolic, vitals.heartRate, vitals.respiratoryRate, vitals.temperature, vitals.spo2, vitals.glucose, vitals.weight].filter((v) => v !== undefined)
    if (!measured.length) reject('Registra al menos un signo vital.')

    record.vitals.push(vitals)
    audit(user, 'alta', 'Signos vitales', patient.id, 'Registró signos vitales')
    await commit(patient, record)
    return { ok: true, message: 'Signos vitales registrados' }
  })
}

// ── Notas médicas ───────────────────────────────────────────────────────────────

export async function createNote(_: ActionState, formData: FormData): Promise<ActionState> {
  let target: string | undefined
  const result = await runAction(formData, async (form) => {
    const type = form.choice('type', 'Tipo de nota', noteTypes)
    const template = noteTemplates[type]
    const user = await requireStaff(template.permission)
    const { patient, record } = await recordOf(form)
    if (!form.bool('attest')) reject('Confirma la declaración para firmar la nota.')

    const sections: Record<string, string> = {}
    for (const field of template.fields) {
      const value = 'required' in field && field.required ? form.text(field.key, field.label, 8000) : form.optional(field.key, 8000)
      if (value) sections[field.key] = value
    }
    const diagnoses = form.list('diagnoses').map(parseDiagnosis)
    if (template.permission === 'notes.medical' && !diagnoses.length) reject('Agrega al menos un diagnóstico.')

    const createdAt = new Date().toISOString()
    const base = {
      id: newId('nt'), type, createdAt, author: user.name, authorRole: 'Médico', authorLicense: user.license,
      sections, diagnoses, prognosis: template.prognosis ? form.optional('prognosis', 120) : undefined,
      vitalsId: form.bool('linkVitals') ? record.vitals.at(-1)?.id : undefined,
      registered: stampFor(user.name, new Date(createdAt)),
    }
    const note: ClinicalNote = { ...base, signature: { at: createdAt, hash: sealNote(base, createdAt) }, addenda: [] }
    record.notes.unshift(note)

    // Los diagnósticos nuevos pasan a la lista de problemas para no perderlos de vista.
    for (const diagnosis of diagnoses) {
      if (diagnosis.code && !record.problems.some((p) => p.code === diagnosis.code && p.status !== 'resuelto')) {
        record.problems.unshift({ id: newId('pr'), ...diagnosis, kind: 'agudo', status: 'activo', since: todayISO(), registered: stampFor(user.name) })
      }
    }
    audit(user, 'firma', 'Nota clínica', patient.id, `Firmó ${template.label.toLowerCase()}`)
    await commit(patient, record)
    target = `/sistema/pacientes/${patient.id}/notas/${note.id}`
  })
  if (target) redirect(target)
  return result
}

export async function addAddendum(_: ActionState, formData: FormData): Promise<ActionState> {
  return runAction(formData, async (form) => {
    const user = await requireStaff('record.write')
    const { patient, record } = await recordOf(form)
    const note = record.notes.find((n) => n.id === form.text('noteId', 'Nota')) ?? reject('La nota no existe.')
    note.addenda.push({ at: new Date().toISOString(), author: user.name, text: form.text('text', 'Texto de la adenda', 4000), location: site.name })
    audit(user, 'modificacion', 'Nota clínica', patient.id, `Agregó adenda a ${noteTemplates[note.type].label.toLowerCase()}`)
    await commit(patient, record)
    return { ok: true, message: 'Adenda agregada' }
  })
}

// ── Tratamiento ─────────────────────────────────────────────────────────────────

export async function prescribeMedication(_: ActionState, formData: FormData): Promise<ActionState> {
  return runAction(formData, async (form) => {
    const user = await requireStaff('prescribe')
    const { patient, record } = await recordOf(form)
    const name = form.text('name', 'Medicamento', 160)

    const conflicts = allergyConflicts(name, patient.allergies)
    if (conflicts.length && !form.bool('confirm')) {
      reject(`Alerta de alergia: ${conflicts.map((c) => c.detail).join(' ')}`, 'Confirmo que valoré el riesgo y deseo prescribirlo')
    }
    const duplicate = record.medications.find((m) => m.status === 'activo' && m.name.toLowerCase() === name.toLowerCase())
    if (duplicate) reject(`${name} ya está activo en el tratamiento.`)

    const folio = await repository.nextFolio('REC')
    record.medications.unshift({
      id: newId('rx'), name,
      dose: form.text('dose', 'Dosis', 60),
      route: form.text('route', 'Vía de administración', 40),
      frequency: form.text('frequency', 'Frecuencia', 60),
      duration: form.text('duration', 'Duración', 60),
      quantity: form.number('quantity', 'Cantidad a surtir', { min: 1, max: 100 }),
      instructions: form.optional('instructions', 300),
      startDate: todayISO(), status: 'activo', prescribedBy: user.name, prescriptionFolio: folio, registered: stampFor(user.name),
    })
    audit(user, 'alta', 'Receta', patient.id, `Prescribió ${name} (${folio})${conflicts.length ? ' con alerta de alergia confirmada' : ''}`)
    await commit(patient, record)
    return { ok: true, message: `Receta ${folio} emitida` }
  })
}

export async function changeMedicationStatus(_: ActionState, formData: FormData): Promise<ActionState> {
  return runAction(formData, async (form) => {
    const user = await requireStaff('prescribe')
    const { patient, record } = await recordOf(form)
    const medication = record.medications.find((m) => m.id === form.text('medicationId', 'Medicamento')) ?? reject('El medicamento no existe.')
    medication.status = form.choice('status', 'Estado', ['suspendido', 'concluido'] as const)
    medication.statusReason = form.text('reason', 'Motivo', 200)
    medication.updated = stampFor(user.name)
    audit(user, 'modificacion', 'Receta', patient.id, `${medication.status === 'suspendido' ? 'Suspendió' : 'Concluyó'} ${medication.name}: ${medication.statusReason}`)
    await commit(patient, record)
    return { ok: true, message: 'Tratamiento actualizado' }
  })
}

// ── Estudios ────────────────────────────────────────────────────────────────────

export async function orderStudy(_: ActionState, formData: FormData): Promise<ActionState> {
  return runAction(formData, async (form) => {
    const user = await requireStaff('notes.medical')
    const { patient, record } = await recordOf(form)
    const folio = await repository.nextFolio('EST')
    const name = form.text('name', 'Estudio', 160)
    record.studies.unshift({
      id: newId('st'), folio, name,
      category: form.choice('category', 'Tipo de estudio', studyCategories),
      priority: form.choice('priority', 'Prioridad', ['rutina', 'urgente'] as const),
      status: 'solicitado', orderedAt: new Date().toISOString(), orderedBy: user.name,
      indication: form.optional('indication', 300), releasedToPatient: false, registered: stampFor(user.name),
    })
    audit(user, 'alta', 'Solicitud de estudio', patient.id, `Solicitó ${name} (${folio})`)
    await commit(patient, record)
    return { ok: true, message: `Solicitud ${folio} creada` }
  })
}

/** Cada línea de valores: "Analito | valor | unidad | rango". Marca alto/bajo si el valor sale del rango. */
function parseLabValues(raw?: string) {
  return (raw ?? '').split('\n').map((line) => line.split('|').map((part) => part.trim())).filter(([analyte, value]) => analyte && value).map(([analyte, value, unit, range]) => {
    const [low, high] = (range ?? '').split(/[–-]/).map((n) => Number(n.trim().replace(',', '.')))
    const numeric = Number(value.replace(',', '.'))
    const flag = Number.isFinite(numeric) && Number.isFinite(low) && Number.isFinite(high) ? (numeric > high ? 'alto' : numeric < low ? 'bajo' : undefined) : undefined
    return { analyte, value, unit: unit || undefined, range: range || undefined, flag } as const
  })
}

export async function recordStudyResult(_: ActionState, formData: FormData): Promise<ActionState> {
  return runAction(formData, async (form) => {
    const user = await requireStaff('studies.result')
    const { patient, record } = await recordOf(form)
    const study = record.studies.find((s) => s.id === form.text('studyId', 'Estudio')) ?? reject('El estudio no existe.')
    study.result = { at: new Date().toISOString(), summary: form.text('summary', 'Interpretación', 4000), values: parseLabValues(form.optional('values', 4000)), reportedBy: user.name }
    study.status = 'resultado'
    study.releasedToPatient = form.bool('release')
    study.updated = stampFor(user.name)
    audit(user, 'alta', 'Resultado de estudio', patient.id, `Capturó el resultado de ${study.name} (${study.folio})`)
    await commit(patient, record)
    return { ok: true, message: 'Resultado guardado' }
  })
}

export async function updateStudyStatus(_: ActionState, formData: FormData): Promise<ActionState> {
  return runAction(formData, async (form) => {
    const user = await requireStaff('studies.result')
    const { patient, record } = await recordOf(form)
    const study = record.studies.find((s) => s.id === form.text('studyId', 'Estudio')) ?? reject('El estudio no existe.')
    const status = form.choice('status', 'Estado', ['en-proceso', 'cancelado'] as const)
    study.status = status
    study.updated = stampFor(user.name)
    audit(user, 'modificacion', 'Solicitud de estudio', patient.id, `${study.name} (${study.folio}) → ${status}`)
    await commit(patient, record)
    return { ok: true, message: status === 'cancelado' ? 'Solicitud cancelada' : 'Muestra recibida, estudio en proceso' }
  })
}

export async function releaseStudy(_: ActionState, formData: FormData): Promise<ActionState> {
  return runAction(formData, async (form) => {
    const user = await requireStaff('studies.result')
    const { patient, record } = await recordOf(form)
    const study = record.studies.find((s) => s.id === form.text('studyId', 'Estudio')) ?? reject('El estudio no existe.')
    study.releasedToPatient = !study.releasedToPatient
    study.updated = stampFor(user.name)
    audit(user, 'modificacion', 'Resultado de estudio', patient.id, `${study.releasedToPatient ? 'Liberó' : 'Retiró'} ${study.name} en el portal`)
    await commit(patient, record)
    return { ok: true, message: study.releasedToPatient ? 'Visible en el portal del paciente' : 'Retirado del portal' }
  })
}

// ── Dispositivos implantados y consentimientos ──────────────────────────────────

export async function addDevice(_: ActionState, formData: FormData): Promise<ActionState> {
  return runAction(formData, async (form) => {
    const user = await requireStaff('record.write')
    const { patient, record } = await recordOf(form)
    const device = {
      id: newId('dv'), type: form.text('type', 'Tipo de dispositivo', 80), brand: form.text('brand', 'Marca', 80),
      model: form.optional('model', 80), serial: form.optional('serial', 60), site: form.text('site', 'Sitio anatómico', 80),
      implantedAt: form.requiredDate('implantedAt', 'Fecha de implante'), mriSafety: form.choice('mriSafety', 'Compatibilidad con RM', mriSafety),
      notes: form.optional('notes', 300), registered: stampFor(user.name),
    }
    record.devices.push(device)
    audit(user, 'alta', 'Dispositivo implantado', patient.id, `${device.type} ${device.brand} ${device.serial ?? ''}`.trim())
    await commit(patient, record)
    return { ok: true, message: 'Dispositivo registrado' }
  })
}

export async function addConsent(_: ActionState, formData: FormData): Promise<ActionState> {
  return runAction(formData, async (form) => {
    const user = await requireStaff('notes.medical')
    const { patient, record } = await recordOf(form)
    const witnesses = [form.optional('witness1', 120), form.optional('witness2', 120)].filter((w): w is string => !!w)
    if (witnesses.length < 2) reject('La NOM-004 requiere el nombre de dos testigos.')
    const consent = {
      id: newId('ci'), procedure: form.text('procedure', 'Procedimiento', 200), risks: form.text('risks', 'Riesgos', 2000),
      benefits: form.text('benefits', 'Beneficios', 2000), alternatives: form.optional('alternatives', 2000),
      signedAt: new Date().toISOString(), signer: form.choice('signer', 'Quién otorga', ['paciente', 'representante'] as const),
      signerName: form.text('signerName', 'Nombre de quien firma', 120), witnesses, physician: user.name, status: 'vigente' as const, registered: stampFor(user.name),
    }
    record.consents.unshift(consent)
    record.documents.unshift({ id: newId('d'), name: `Consentimiento_${consent.procedure.slice(0, 30).replace(/\s+/g, '_')}.pdf`, kind: 'Consentimiento', date: todayISO(), registered: stampFor(user.name) })
    audit(user, 'alta', 'Consentimiento informado', patient.id, consent.procedure)
    await commit(patient, record)
    return { ok: true, message: 'Consentimiento registrado' }
  })
}

export async function revokeConsent(_: ActionState, formData: FormData): Promise<ActionState> {
  return runAction(formData, async (form) => {
    const user = await requireStaff('record.write')
    const { patient, record } = await recordOf(form)
    const consent = record.consents.find((c) => c.id === form.text('consentId', 'Consentimiento')) ?? reject('El consentimiento no existe.')
    consent.status = 'revocado'
    consent.updated = stampFor(user.name)
    audit(user, 'cancelacion', 'Consentimiento informado', patient.id, `Revocó el consentimiento de ${consent.procedure}`)
    await commit(patient, record)
    return { ok: true, message: 'Consentimiento revocado' }
  })
}
