import { CalendarPlus, ImagePlus, Plus, ScanHeart } from 'lucide-react'

import { ActionButton, ActionForm } from '@/components/ui/action-form'
import { Dialog } from '@/components/ui/dialog'
import { Checkbox, Field, FieldGrid, FormSection, Input, Select, Textarea } from '@/components/ui/field'
import { formatDate, todayISO } from '@/lib/format'
import * as actions from '../actions'
import {
  answerLabels, answers, breastFindings, breastQuadrants, breastSymptoms, cancerRelatives, cancerTypes, recommendationInfo,
  recommendations, thermalGradeInfo, thermalGrades, vascularPatternLabels, vascularPatterns, visitLabels, visits,
  type Appointment, type Campaign, type RiskFactors, type Screening,
} from '../types'

/*
 * Formularios de oncología. Igual que en el expediente: diálogo + `ActionForm` en el cliente
 * y validación real en la Server Action.
 */

const PatientField = ({ id }: { id: string }) => <input type="hidden" name="patientId" value={id} />

function AnswerSelect({ name, value }: { name: string; value?: string }) {
  return (
    <Select name={name} defaultValue={value ?? ''}>
      <option value="">Sin dato</option>
      {answers.map((a) => <option key={a} value={a}>{answerLabels[a]}</option>)}
    </Select>
  )
}

export function OncologyDatalists() {
  return (
    <>
      <datalist id="cancer-relatives">{cancerRelatives.map((r) => <option key={r} value={r} />)}</datalist>
      <datalist id="cancer-types">{cancerTypes.map((t) => <option key={t} value={t} />)}</datalist>
    </>
  )
}

// ── Cuestionario y factores de riesgo ───────────────────────────────────────────

export function ScreeningDialog({ patientId, screening }: { patientId: string; screening?: Screening }) {
  return (
    <Dialog title="Cuestionario de tamizaje" description="Respuestas de la paciente (preregistro o consulta)." trigger="Editar" triggerStyle={{ variant: 'ghost', size: 'sm' }}>
      <ActionForm action={actions.saveScreening}>
        <PatientField id={patientId} />
        <FieldGrid>
          <Field label="¿Algún familiar con cáncer?"><AnswerSelect name="familyCancer" value={screening?.familyCancer} /></Field>
          <Field label="¿Se ha hecho mastografía?"><AnswerSelect name="previousMammography" value={screening?.previousMammography} /></Field>
          <Field label="¿Se autoexplora los senos?"><AnswerSelect name="breastSelfExam" value={screening?.breastSelfExam} /></Field>
          <Field label="¿Química sanguínea reciente?"><AnswerSelect name="recentBloodChemistry" value={screening?.recentBloodChemistry} /></Field>
          <Field label="¿Puede hacerse o traer el estudio?"><AnswerSelect name="canBringBloodChemistry" value={screening?.canBringBloodChemistry} /></Field>
        </FieldGrid>
        <Field label="Si no puede, ¿por qué?"><Input name="bloodChemistryReason" defaultValue={screening?.bloodChemistryReason} /></Field>
      </ActionForm>
    </Dialog>
  )
}

export function RiskFactorsDialog({ patientId, risk }: { patientId: string; risk?: RiskFactors }) {
  const rows = [...(risk?.familyCancers ?? []), { relative: '', cancerType: '', ageAtDiagnosis: undefined }, { relative: '', cancerType: '', ageAtDiagnosis: undefined }]
  return (
    <Dialog title="Factores de riesgo de cáncer de mama" description="Menarca, menopausia y gestas se toman de la historia gineco-obstétrica." trigger={risk ? 'Editar' : <><Plus /> Registrar</>} triggerStyle={{ variant: risk ? 'ghost' : 'secondary', size: 'sm' }} wide>
      <ActionForm action={actions.saveRiskFactors} className="space-y-8">
        <PatientField id={patientId} />

        <FormSection title="Antecedentes familiares de cáncer" description="Deja en blanco las filas que no uses.">
          {rows.map((row, i) => (
            <FieldGrid key={i} cols={3}>
              <Field label="Parentesco"><Input name="fcRelative" list="cancer-relatives" defaultValue={row.relative} autoComplete="off" /></Field>
              <Field label="Tipo de cáncer"><Input name="fcType" list="cancer-types" defaultValue={row.cancerType} autoComplete="off" /></Field>
              <Field label="Edad al diagnóstico"><Input name="fcAge" inputMode="numeric" defaultValue={row.ageAtDiagnosis} /></Field>
            </FieldGrid>
          ))}
        </FormSection>

        <FormSection title="Antecedentes personales">
          <div className="grid gap-3 sm:grid-cols-2">
            <Checkbox name="personalBreastCancer" label="Cáncer de mama previo" defaultChecked={risk?.personalBreastCancer} />
            <Checkbox name="previousBiopsy" label="Biopsia de mama previa" defaultChecked={risk?.previousBiopsy} />
            <Checkbox name="atypicalHyperplasia" label="Hiperplasia atípica o CLIS en biopsia" defaultChecked={risk?.atypicalHyperplasia} />
            <Checkbox name="chestRadiation" label="Radioterapia en tórax" defaultChecked={risk?.chestRadiation} />
            <Checkbox name="hormoneTherapy" label="Terapia hormonal de reemplazo" defaultChecked={risk?.hormoneTherapy} />
            <Checkbox name="breastImplants" label="Implantes mamarios" defaultChecked={risk?.breastImplants} />
          </div>
          <FieldGrid>
            <Field label="Otro cáncer personal"><Input name="personalOtherCancer" defaultValue={risk?.personalOtherCancer} /></Field>
            <Field label="Detalle de la terapia hormonal"><Input name="hormoneTherapyDetail" defaultValue={risk?.hormoneTherapyDetail} /></Field>
            <Field label="Mutación conocida (BRCA1, BRCA2…)"><Input name="knownMutation" defaultValue={risk?.knownMutation} /></Field>
          </FieldGrid>
          <FieldGrid cols={4}>
            <Field label="Edad 1er embarazo"><Input name="firstPregnancyAge" inputMode="numeric" defaultValue={risk?.firstPregnancyAge} /></Field>
            <Field label="Lactancia (meses)"><Input name="breastfeedingMonths" inputMode="numeric" defaultValue={risk?.breastfeedingMonths} /></Field>
            <Field label="Última mastografía"><Input name="lastMammography" type="date" max={todayISO()} defaultValue={risk?.lastMammography} /></Field>
            <Field label="BI-RADS"><Input name="lastMammographyBirads" placeholder="Ej. 2" defaultValue={risk?.lastMammographyBirads} /></Field>
          </FieldGrid>
        </FormSection>

        <FormSection title="Síntomas actuales" description="Cualquier síntoma requiere estudio diagnóstico, no solo tamizaje.">
          <div className="grid gap-3 sm:grid-cols-2">
            {breastSymptoms.map((s) => <Checkbox key={s} name="symptoms" value={s} label={s} defaultChecked={risk?.symptoms.includes(s)} />)}
          </div>
        </FormSection>

        <Field label="Notas"><Textarea name="notes" className="min-h-20" defaultValue={risk?.notes} /></Field>
      </ActionForm>
    </Dialog>
  )
}

// ── Exploración clínica ─────────────────────────────────────────────────────────

function BreastSideFields({ side, title }: { side: 'right' | 'left'; title: string }) {
  return (
    <FormSection title={title}>
      <div className="grid gap-3 sm:grid-cols-2">
        {breastFindings.map((f) => <Checkbox key={f} name={`${side}Findings`} value={f} label={f} />)}
      </div>
      <FieldGrid cols={3}>
        <Field label="Cuadrante"><Select name={`${side}Quadrant`} defaultValue=""><option value="">—</option>{breastQuadrants.map((q) => <option key={q}>{q}</option>)}</Select></Field>
        <Field label="Tamaño (cm)"><Input name={`${side}Size`} inputMode="decimal" /></Field>
        <Field label="Notas"><Input name={`${side}Notes`} /></Field>
      </FieldGrid>
      <Checkbox name={`${side}Nodes`} label="Adenopatía axilar palpable" />
    </FormSection>
  )
}

export function BreastExamDialog({ patientId }: { patientId: string }) {
  return (
    <Dialog title="Exploración clínica de mama" description="Sin hallazgos marcados se registra como “Sin alteraciones”." trigger={<><Plus /> Exploración</>} wide>
      <ActionForm action={actions.addBreastExam} className="space-y-8">
        <PatientField id={patientId} />
        <BreastSideFields side="right" title="Mama derecha" />
        <BreastSideFields side="left" title="Mama izquierda" />
        <Field label="Impresión diagnóstica"><Textarea name="impression" className="min-h-20" /></Field>
      </ActionForm>
    </Dialog>
  )
}

// ── Termografía ─────────────────────────────────────────────────────────────────

function ThermalSideFields({ side, title }: { side: 'right' | 'left'; title: string }) {
  return (
    <FormSection title={title}>
      <FieldGrid cols={4}>
        <Field label="T. máxima (°C)"><Input name={`${side}Max`} inputMode="decimal" placeholder="34.2" /></Field>
        <Field label="T. media (°C)"><Input name={`${side}Mean`} inputMode="decimal" /></Field>
        <Field label="Patrón vascular"><Select name={`${side}Pattern`} defaultValue=""><option value="">—</option>{vascularPatterns.map((p) => <option key={p} value={p}>{vascularPatternLabels[p]}</option>)}</Select></Field>
        <Field label="Clasificación">
          <Select name={`${side}Grade`} required defaultValue=""><option value="" disabled>Selecciona</option>{thermalGrades.map((g) => <option key={g} value={g}>{g} · {thermalGradeInfo[g].label}</option>)}</Select>
        </Field>
      </FieldGrid>
      <Field label="Zonas hipertérmicas (cuadrante, extensión)"><Input name={`${side}HotSpots`} placeholder="Ej. cuadrante superior externo, 2 cm" /></Field>
    </FormSection>
  )
}

export function ThermographyDialog({ patient, campaigns, campaignId, triggerStyle }: {
  patient: { id: string; name: string }
  campaigns: Campaign[]
  campaignId?: string
  triggerStyle?: Parameters<typeof Dialog>[0]['triggerStyle']
}) {
  return (
    <Dialog title="Registrar termografía mamaria" description={patient.name} trigger={<><ScanHeart /> Termografía</>} triggerStyle={triggerStyle ?? { variant: 'primary', size: 'sm' }} wide>
      <ActionForm action={actions.recordThermography} submitLabel="Firmar y guardar" className="space-y-8">
        <PatientField id={patient.id} />
        <FormSection title="Protocolo">
          <FieldGrid cols={4}>
            <Field label="Campaña" className="col-span-2">
              <Select name="campaignId" defaultValue={campaignId ?? ''}>
                <option value="">Fuera de campaña</option>
                {campaigns.map((c) => <option key={c.id} value={c.id}>{c.name} · {formatDate(c.date, 'medium')}</option>)}
              </Select>
            </Field>
            <Field label="T. de la sala (°C)"><Input name="roomTemp" inputMode="decimal" placeholder="21" /></Field>
            <Field label="Aclimatación (min)"><Input name="acclimatizationMin" inputMode="numeric" placeholder="15" /></Field>
          </FieldGrid>
          <Field label="Equipo"><Input name="equipment" placeholder="Marca y modelo de la cámara térmica" /></Field>
        </FormSection>

        <ThermalSideFields side="right" title="Mama derecha" />
        <ThermalSideFields side="left" title="Mama izquierda" />

        <FormSection title="Interpretación">
          <Field label="Hallazgos e interpretación"><Textarea name="findings" required /></Field>
          <FieldGrid>
            <Field label="Recomendación" hint="Si la dejas en automático se sugiere según la clasificación y la diferencia térmica.">
              <Select name="recommendation" defaultValue=""><option value="">Automática</option>{recommendations.map((r) => <option key={r} value={r}>{recommendationInfo[r].label}</option>)}</Select>
            </Field>
            <Field label="Indicaciones adicionales"><Input name="recommendationDetail" /></Field>
          </FieldGrid>
        </FormSection>

        <FormSection title="Imágenes térmicas" description="JPG, PNG, TIFF o BMP de hasta 20 MB cada una.">
          <FieldGrid>
            <Field label="Archivos"><Input name="images" type="file" accept="image/*" multiple className="h-auto py-2.5" /></Field>
            <Field label="Proyección"><Input name="imageLabel" placeholder="Ej. Frontal, oblicuas" /></Field>
          </FieldGrid>
        </FormSection>
        <p className="text-[13px] leading-5 text-subtle">Al guardar se agrega como estudio con resultado en el expediente y, si hay cita en la campaña, se marca como atendida.</p>
      </ActionForm>
    </Dialog>
  )
}

export function ThermographyImagesDialog({ patientId, thermographyId }: { patientId: string; thermographyId: string }) {
  return (
    <Dialog title="Agregar imágenes térmicas" trigger={<><ImagePlus /> Imágenes</>} triggerStyle={{ variant: 'ghost', size: 'sm' }}>
      <ActionForm action={actions.addThermographyImages} submitLabel="Subir">
        <PatientField id={patientId} />
        <input type="hidden" name="thermographyId" value={thermographyId} />
        <Field label="Archivos"><Input name="images" type="file" accept="image/*" multiple required className="h-auto py-2.5" /></Field>
        <Field label="Proyección"><Input name="imageLabel" placeholder="Ej. Oblicua derecha" /></Field>
      </ActionForm>
    </Dialog>
  )
}

// ── Campañas y citas ────────────────────────────────────────────────────────────

export function CampaignDialog() {
  return (
    <Dialog title="Nueva campaña" trigger={<><Plus /> Campaña</>}>
      <ActionForm action={actions.createCampaign}>
        <Field label="Nombre"><Input name="name" required defaultValue="Campaña de termografía mamaria" /></Field>
        <FieldGrid>
          <Field label="Fecha"><Input name="date" type="date" required defaultValue={todayISO()} /></Field>
          <Field label="Lugar"><Input name="location" /></Field>
        </FieldGrid>
        <Field label="Notas"><Textarea name="notes" className="min-h-20" /></Field>
      </ActionForm>
    </Dialog>
  )
}

/** Agenda a una paciente: desde la campaña (elige paciente) o desde el expediente (elige campaña). */
export function ScheduleDialog({ campaigns, patients, patientId, walkIn = false }: {
  campaigns: Campaign[]
  patients?: { id: string; name: string; record: string }[]
  patientId?: string
  walkIn?: boolean
}) {
  return (
    <Dialog
      title={walkIn ? 'Llegada sin cita' : 'Agendar en campaña'}
      description={walkIn ? 'Queda en espera de inmediato. Si es paciente nueva, primero abre su expediente.' : undefined}
      trigger={<><CalendarPlus /> {walkIn ? 'Sin cita' : 'Agendar'}</>}
    >
      <ActionForm action={actions.scheduleAppointment} submitLabel={walkIn ? 'Registrar llegada' : 'Agendar'}>
        <input type="hidden" name="origin" value={walkIn ? 'espontanea' : 'agenda'} />
        {patientId ? <PatientField id={patientId} /> : (
          <Field label="Paciente">
            <Select name="patientId" required defaultValue=""><option value="" disabled>Selecciona</option>{patients?.map((p) => <option key={p.id} value={p.id}>{p.name} · {p.record}</option>)}</Select>
          </Field>
        )}
        {campaigns.length === 1 ? <input type="hidden" name="campaignId" value={campaigns[0].id} /> : (
          <Field label="Campaña">
            <Select name="campaignId" required defaultValue={campaigns[0]?.id}>{campaigns.map((c) => <option key={c.id} value={c.id}>{c.name} · {formatDate(c.date, 'medium')}</option>)}</Select>
          </Field>
        )}
        <FieldGrid>
          <Field label="Hora"><Input name="time" type="time" required defaultValue={walkIn ? undefined : '10:00'} /></Field>
          <Field label="Visita"><Select name="visit" defaultValue="primera-vez">{visits.map((v) => <option key={v} value={v}>{visitLabels[v]}</option>)}</Select></Field>
        </FieldGrid>
        <Field label="Notas"><Input name="notes" /></Field>
      </ActionForm>
    </Dialog>
  )
}

/**
 * Acciones de la cita (el estado se muestra aparte): el médico registra la llegada a la hora de la cita,
 * la termografía la marca como atendida, o se marca que no asistió. Cada cambio queda con fecha, hora, persona y sede.
 */
export function AppointmentActions({ patientId, appointment }: { patientId: string; appointment: Pick<Appointment, 'id' | 'status'> }) {
  const fields = (status: string) => ({ patientId, appointmentId: appointment.id, status })
  const ghost = { variant: 'ghost', size: 'sm' } as const
  switch (appointment.status) {
    case 'programada':
      return (
        <span className="flex flex-wrap gap-1">
          <ActionButton action={actions.setAppointmentStatus} fields={fields('presente')} style={{ variant: 'secondary', size: 'sm' }}>Registrar llegada</ActionButton>
          <ActionButton action={actions.setAppointmentStatus} fields={fields('no-asistio')} style={ghost}>No asistió</ActionButton>
        </span>
      )
    case 'presente':
      return <ActionButton action={actions.setAppointmentStatus} fields={fields('atendida')} style={ghost} confirmText="¿Marcar como atendida sin registrar termografía?">Atendida</ActionButton>
    case 'no-asistio':
    case 'cancelada':
      return <ActionButton action={actions.setAppointmentStatus} fields={fields('programada')} style={ghost}>Regresar a pendiente</ActionButton>
    default:
      return null
  }
}

