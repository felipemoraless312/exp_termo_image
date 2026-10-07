import { HeartPulse, Pill, Plus } from 'lucide-react'

import { ActionButton, ActionForm } from '@/components/ui/action-form'
import { Dialog } from '@/components/ui/dialog'
import { Checkbox, Field, FieldGrid, FormSection, Input, Select, Textarea } from '@/components/ui/field'
import { cie10Options } from '@/modules/catalogs/cie10'
import {
  allergyKindLabels, allergyKinds, allergySeverities, commonMedications, commonStudies, familyConditions, frequencies, implantTypes, mriSafety, mriSafetyLabels,
  relatives, routes, studyCategories, studyCategoryLabels, vaccines,
} from '@/modules/catalogs/clinical'
import { todayISO } from '@/lib/format'
import * as actions from '../actions'
import { consciousnessLabels, type ClinicalRecord, type Consent, type Medication, type Patient, type Problem, type Study } from '../types'

/*
 * Formularios del expediente. Son Server Components: el diálogo y el envío los maneja
 * `Dialog` + `ActionForm` en el cliente, y la validación real ocurre en la Server Action.
 */

const PatientField = ({ id }: { id: string }) => <input type="hidden" name="patientId" value={id} />

/** Listas de sugerencias compartidas por los formularios de la página (un solo `<datalist>` cada una). */
export function ChartDatalists({ medicationNames = commonMedications }: { medicationNames?: readonly string[] }) {
  const studies = Object.values(commonStudies).flat()
  return (
    <>
      <datalist id="cie10-list">{cie10Options.map((option) => <option key={option} value={option} />)}</datalist>
      <datalist id="medication-list">{medicationNames.map((name) => <option key={name} value={name} />)}</datalist>
      <datalist id="study-list">{studies.map((name) => <option key={name} value={name} />)}</datalist>
      <datalist id="family-list">{familyConditions.map((name) => <option key={name} value={name} />)}</datalist>
      <datalist id="vaccine-list">{vaccines.map((name) => <option key={name} value={name} />)}</datalist>
    </>
  )
}

// ── Signos vitales ──────────────────────────────────────────────────────────────

export function VitalsDialog({ patient, triggerStyle }: { patient: Pick<Patient, 'id' | 'name'>; triggerStyle?: Parameters<typeof Dialog>[0]['triggerStyle'] }) {
  return (
    <Dialog title="Registrar signos vitales" description={patient.name} trigger={<><HeartPulse /> Signos vitales</>} triggerStyle={triggerStyle} wide>
      <ActionForm action={actions.recordVitals} submitLabel="Registrar">
        <PatientField id={patient.id} />
        <FieldGrid cols={4}>
          <Field label="TA sistólica (mmHg)"><Input name="systolic" inputMode="numeric" placeholder="120" /></Field>
          <Field label="TA diastólica (mmHg)"><Input name="diastolic" inputMode="numeric" placeholder="80" /></Field>
          <Field label="Frec. cardiaca (lpm)"><Input name="heartRate" inputMode="numeric" placeholder="72" /></Field>
          <Field label="Frec. respiratoria (rpm)"><Input name="respiratoryRate" inputMode="numeric" placeholder="16" /></Field>
          <Field label="Temperatura (°C)"><Input name="temperature" inputMode="decimal" placeholder="36.5" /></Field>
          <Field label="SpO₂ (%)"><Input name="spo2" inputMode="numeric" placeholder="98" /></Field>
          <Field label="Glucosa capilar (mg/dL)"><Input name="glucose" inputMode="numeric" /></Field>
          <Field label="Dolor EVA (0–10)"><Input name="pain" type="number" min={0} max={10} /></Field>
          <Field label="Peso (kg)"><Input name="weight" inputMode="decimal" /></Field>
          <Field label="Estatura (cm)"><Input name="height" inputMode="numeric" /></Field>
          <Field label="Estado de conciencia (AVPU)" className="col-span-2">
            <Select name="consciousness" defaultValue="A">
              {Object.entries(consciousnessLabels).map(([key, label]) => <option key={key} value={key}>{key} · {label}</option>)}
            </Select>
          </Field>
        </FieldGrid>
        <Checkbox name="onOxygen" label="Recibe oxígeno suplementario" hint="Se considera en el cálculo de NEWS2." />
        <Field label="Observaciones"><Textarea name="notes" className="min-h-20" /></Field>
      </ActionForm>
    </Dialog>
  )
}

// ── Alergias y problemas ────────────────────────────────────────────────────────

export function AllergyDialog({ patientId }: { patientId: string }) {
  return (
    <Dialog title="Registrar alergia" trigger={<><Plus /> Alergia</>}>
      <ActionForm action={actions.addAllergy}>
        <PatientField id={patientId} />
        <Field label="Agente (medicamento, alimento, sustancia)"><Input name="agent" required placeholder="Ej. Penicilina" /></Field>
        <FieldGrid>
          <Field label="Tipo"><Select name="kind" defaultValue="medicamento">{allergyKinds.map((k) => <option key={k} value={k}>{allergyKindLabels[k]}</option>)}</Select></Field>
          <Field label="Severidad"><Select name="severity" defaultValue="moderada">{allergySeverities.map((s) => <option key={s} value={s}>{s[0].toUpperCase() + s.slice(1)}</option>)}</Select></Field>
        </FieldGrid>
        <Field label="Reacción presentada"><Input name="reaction" required placeholder="Ej. Urticaria, anafilaxia, broncoespasmo" /></Field>
      </ActionForm>
    </Dialog>
  )
}

export function RemoveAllergyDialog({ patientId, allergyId, agent }: { patientId: string; allergyId: string; agent: string }) {
  return (
    <Dialog title={`Descartar alergia a ${agent}`} description="Solo si se registró por error o se descartó con pruebas. Queda constancia en la bitácora." trigger="Descartar" triggerStyle={{ variant: 'ghost', size: 'sm' }}>
      <ActionForm action={actions.removeAllergy} submitLabel="Descartar alergia" submitStyle={{ variant: 'danger' }}>
        <PatientField id={patientId} />
        <input type="hidden" name="allergyId" value={allergyId} />
        <Field label="Motivo"><Input name="reason" required placeholder="Ej. Registrada por error, prueba de provocación negativa" /></Field>
      </ActionForm>
    </Dialog>
  )
}

export function ProblemDialog({ patientId }: { patientId: string }) {
  return (
    <Dialog title="Agregar diagnóstico" description="Busca por código o descripción de la CIE-10." trigger={<><Plus /> Diagnóstico</>}>
      <ActionForm action={actions.addProblem}>
        <PatientField id={patientId} />
        <Field label="Diagnóstico (CIE-10)"><Input name="diagnosis" list="cie10-list" required placeholder="Ej. K21.9 o reflujo" autoComplete="off" /></Field>
        <FieldGrid>
          <Field label="Tipo"><Select name="kind" defaultValue="cronico"><option value="cronico">Crónico</option><option value="agudo">Agudo</option></Select></Field>
          <Field label="Desde"><Input name="since" type="date" max={todayISO()} defaultValue={todayISO()} /></Field>
        </FieldGrid>
        <Field label="Notas"><Input name="notes" /></Field>
      </ActionForm>
    </Dialog>
  )
}

export function ProblemStatusActions({ patientId, problem }: { patientId: string; problem: Problem }) {
  const next = problem.status === 'activo' ? [['controlado', 'Controlado'], ['resuelto', 'Resuelto']] : problem.status === 'controlado' ? [['activo', 'Reactivar'], ['resuelto', 'Resuelto']] : [['activo', 'Reactivar']]
  return (
    <span className="hidden gap-1 sm:flex">
      {next.map(([status, label]) => (
        <ActionButton key={status} action={actions.updateProblemStatus} fields={{ patientId, problemId: problem.id, status }} style={{ variant: 'ghost', size: 'sm' }}>{label}</ActionButton>
      ))}
    </span>
  )
}

// ── Antecedentes ────────────────────────────────────────────────────────────────

export function FamilyHistoryDialog({ patientId }: { patientId: string }) {
  return (
    <Dialog title="Antecedente heredofamiliar" trigger={<><Plus /> Agregar</>} triggerStyle={{ variant: 'ghost', size: 'sm' }}>
      <ActionForm action={actions.addFamilyHistory}>
        <PatientField id={patientId} />
        <FieldGrid>
          <Field label="Parentesco"><Select name="relative" required defaultValue="">{[<option key="" value="" disabled>Selecciona</option>, ...relatives.map((r) => <option key={r}>{r}</option>)]}</Select></Field>
          <Field label="Padecimiento"><Input name="condition" list="family-list" required autoComplete="off" /></Field>
        </FieldGrid>
        <Field label="Notas" hint="Edad de diagnóstico, si vive, causa de muerte."><Input name="notes" /></Field>
      </ActionForm>
    </Dialog>
  )
}

export function SurgeryDialog({ patientId }: { patientId: string }) {
  return (
    <Dialog title="Antecedente quirúrgico" trigger={<><Plus /> Agregar</>} triggerStyle={{ variant: 'ghost', size: 'sm' }}>
      <ActionForm action={actions.addSurgery}>
        <PatientField id={patientId} />
        <Field label="Procedimiento"><Input name="procedure" required /></Field>
        <FieldGrid>
          <Field label="Fecha"><Input name="date" type="date" max={todayISO()} required /></Field>
          <Field label="Hospital"><Input name="hospital" /></Field>
        </FieldGrid>
        <Field label="Complicaciones"><Input name="complications" placeholder="Sin complicaciones" /></Field>
      </ActionForm>
    </Dialog>
  )
}

export function HospitalizationDialog({ patientId }: { patientId: string }) {
  return (
    <Dialog title="Hospitalización previa" trigger={<><Plus /> Agregar</>} triggerStyle={{ variant: 'ghost', size: 'sm' }}>
      <ActionForm action={actions.addHospitalization}>
        <PatientField id={patientId} />
        <Field label="Motivo"><Input name="reason" required /></Field>
        <FieldGrid>
          <Field label="Fecha de ingreso"><Input name="date" type="date" max={todayISO()} required /></Field>
          <Field label="Días de estancia"><Input name="days" type="number" min={0} /></Field>
        </FieldGrid>
      </ActionForm>
    </Dialog>
  )
}

export function ImmunizationDialog({ patientId }: { patientId: string }) {
  return (
    <Dialog title="Registrar vacuna" trigger={<><Plus /> Agregar</>} triggerStyle={{ variant: 'ghost', size: 'sm' }}>
      <ActionForm action={actions.addImmunization}>
        <PatientField id={patientId} />
        <Field label="Vacuna"><Input name="vaccine" list="vaccine-list" required autoComplete="off" /></Field>
        <FieldGrid cols={3}>
          <Field label="Dosis"><Input name="dose" required placeholder="1a, refuerzo…" /></Field>
          <Field label="Fecha"><Input name="date" type="date" max={todayISO()} required /></Field>
          <Field label="Lote"><Input name="lot" /></Field>
        </FieldGrid>
      </ActionForm>
    </Dialog>
  )
}

/** Antecedentes personales no patológicos, otros patológicos y gineco-obstétricos. */
export function HistoryDialog({ patient, history }: { patient: Patient; history: ClinicalRecord['history'] }) {
  const np = history.nonPathological
  const go = history.gynecoObstetric ?? {}
  return (
    <Dialog title="Editar antecedentes" description={patient.name} trigger="Editar" triggerStyle={{ variant: 'ghost', size: 'sm' }} wide>
      <ActionForm action={actions.updateHistory} className="space-y-8">
        <PatientField id={patient.id} />
        <FormSection title="Personales no patológicos">
          <FieldGrid cols={3}>
            <Field label="Tabaquismo"><Select name="smoking" defaultValue={np.smoking}><option value="nunca">Nunca ha fumado</option><option value="exfumador">Exfumador</option><option value="actual">Fumador actual</option></Select></Field>
            <Field label="Cigarrillos al día"><Input name="cigarettesPerDay" type="number" min={0} defaultValue={np.cigarettesPerDay} /></Field>
            <Field label="Años fumando"><Input name="smokingYears" type="number" min={0} defaultValue={np.smokingYears} /></Field>
            <Field label="Alcohol"><Select name="alcohol" defaultValue={np.alcohol}><option value="no">No consume</option><option value="ocasional">Ocasional</option><option value="frecuente">Frecuente</option></Select></Field>
            <Field label="Detalle de consumo" className="sm:col-span-2"><Input name="alcoholDetail" defaultValue={np.alcoholDetail} /></Field>
          </FieldGrid>
          <FieldGrid>
            <Field label="Otras sustancias"><Input name="drugs" defaultValue={np.drugs} /></Field>
            <Field label="Actividad física"><Input name="physicalActivity" defaultValue={np.physicalActivity} /></Field>
            <Field label="Alimentación"><Input name="diet" defaultValue={np.diet} /></Field>
            <Field label="Sueño"><Input name="sleep" defaultValue={np.sleep} /></Field>
            <Field label="Vivienda y servicios"><Input name="housing" defaultValue={np.housing} /></Field>
            <Field label="Zoonosis"><Input name="zoonosis" defaultValue={np.zoonosis} /></Field>
          </FieldGrid>
        </FormSection>
        <FormSection title="Otros personales patológicos">
          <Field label="Transfusiones"><Input name="transfusions" defaultValue={history.transfusions} /></Field>
          <Field label="Traumatismos"><Input name="traumas" defaultValue={history.traumas} /></Field>
        </FormSection>
        {patient.sex === 'mujer' && (
          <FormSection title="Gineco-obstétricos">
            <FieldGrid cols={4}>
              <Field label="Menarca (años)"><Input name="menarche" type="number" defaultValue={go.menarche} /></Field>
              <Field label="Ritmo"><Input name="cycles" placeholder="28 × 5" defaultValue={go.cycles} /></Field>
              <Field label="FUM"><Input name="lastMenstrualPeriod" type="date" defaultValue={go.lastMenstrualPeriod} /></Field>
              <Field label="IVSA (años)"><Input name="sexualOnset" type="number" defaultValue={go.sexualOnset} /></Field>
              <Field label="Gestas"><Input name="pregnancies" type="number" min={0} defaultValue={go.pregnancies} /></Field>
              <Field label="Partos"><Input name="births" type="number" min={0} defaultValue={go.births} /></Field>
              <Field label="Cesáreas"><Input name="cesareans" type="number" min={0} defaultValue={go.cesareans} /></Field>
              <Field label="Abortos"><Input name="abortions" type="number" min={0} defaultValue={go.abortions} /></Field>
              <Field label="Método anticonceptivo" className="col-span-2"><Input name="contraception" defaultValue={go.contraception} /></Field>
              <Field label="Menopausia (años)"><Input name="menopause" type="number" defaultValue={go.menopause} /></Field>
              <Field label="Última citología"><Input name="lastPap" type="date" defaultValue={go.lastPap} /></Field>
              <Field label="Última mastografía"><Input name="lastMammography" type="date" defaultValue={go.lastMammography} /></Field>
            </FieldGrid>
          </FormSection>
        )}
      </ActionForm>
    </Dialog>
  )
}

// ── Tratamiento ─────────────────────────────────────────────────────────────────

export function PrescribeDialog({ patient }: { patient: Patient }) {
  return (
    <Dialog
      title="Nueva receta"
      description={patient.allergies.length ? `Alergias: ${patient.allergies.map((a) => a.agent).join(', ')}` : 'Sin alergias registradas'}
      trigger={<><Pill /> Prescribir</>}
      triggerStyle={{ variant: 'primary', size: 'sm' }}
      wide
    >
      <ActionForm action={actions.prescribeMedication} submitLabel="Emitir receta">
        <PatientField id={patient.id} />
        <Field label="Medicamento (denominación genérica, concentración y forma)" hint="Si está en el inventario de farmacia se podrá surtir en la clínica.">
          <Input name="name" list="medication-list" required autoComplete="off" placeholder="Ej. Omeprazol 20 mg cápsulas" />
        </Field>
        <FieldGrid cols={3}>
          <Field label="Dosis"><Input name="dose" required placeholder="20 mg" /></Field>
          <Field label="Vía"><Select name="route" defaultValue="Oral">{routes.map((r) => <option key={r}>{r}</option>)}</Select></Field>
          <Field label="Frecuencia"><Select name="frequency" defaultValue="Cada 24 horas">{frequencies.map((f) => <option key={f}>{f}</option>)}</Select></Field>
          <Field label="Duración"><Input name="duration" required placeholder="7 días" /></Field>
          <Field label="Cantidad a surtir"><Input name="quantity" type="number" min={1} defaultValue={1} /></Field>
        </FieldGrid>
        <Field label="Indicaciones para el paciente"><Textarea name="instructions" className="min-h-20" /></Field>
      </ActionForm>
    </Dialog>
  )
}

export function MedicationStatusDialog({ patientId, medication }: { patientId: string; medication: Medication }) {
  return (
    <Dialog title={`Suspender o concluir ${medication.name}`} trigger="Cambiar" triggerStyle={{ variant: 'ghost', size: 'sm' }}>
      <ActionForm action={actions.changeMedicationStatus}>
        <PatientField id={patientId} />
        <input type="hidden" name="medicationId" value={medication.id} />
        <Field label="Acción"><Select name="status" defaultValue="concluido"><option value="concluido">Concluir tratamiento</option><option value="suspendido">Suspender (reacción adversa, ineficacia…)</option></Select></Field>
        <Field label="Motivo"><Input name="reason" required /></Field>
      </ActionForm>
    </Dialog>
  )
}

// ── Estudios ────────────────────────────────────────────────────────────────────

export function OrderStudyDialog({ patientId }: { patientId: string }) {
  return (
    <Dialog title="Solicitar estudio" trigger={<><Plus /> Solicitar estudio</>} triggerStyle={{ variant: 'primary', size: 'sm' }}>
      <ActionForm action={actions.orderStudy} submitLabel="Solicitar">
        <PatientField id={patientId} />
        <FieldGrid>
          <Field label="Tipo"><Select name="category" defaultValue="laboratorio">{studyCategories.map((c) => <option key={c} value={c}>{studyCategoryLabels[c]}</option>)}</Select></Field>
          <Field label="Prioridad"><Select name="priority" defaultValue="rutina"><option value="rutina">Rutina</option><option value="urgente">Urgente</option></Select></Field>
        </FieldGrid>
        <Field label="Estudio"><Input name="name" list="study-list" required autoComplete="off" /></Field>
        <Field label="Indicación clínica"><Input name="indication" placeholder="Justificación del estudio" /></Field>
      </ActionForm>
    </Dialog>
  )
}

export function StudyResultDialog({ patientId, study }: { patientId: string; study: Study }) {
  return (
    <Dialog title={`Resultado · ${study.name}`} description={study.folio} trigger="Capturar resultado" triggerStyle={{ variant: 'primary', size: 'sm' }} wide>
      <ActionForm action={actions.recordStudyResult}>
        <PatientField id={patientId} />
        <input type="hidden" name="studyId" value={study.id} />
        <Field label="Interpretación o reporte"><Textarea name="summary" required /></Field>
        <Field label="Valores (opcional)" hint="Una línea por analito: Analito | valor | unidad | rango. Ej. Hemoglobina | 11.2 | g/dL | 12 – 16">
          <Textarea name="values" className="min-h-24 font-mono text-[13px]" placeholder={'Glucosa | 98 | mg/dL | 70 – 100\nCreatinina | 0.9 | mg/dL | 0.6 – 1.2'} />
        </Field>
        <Checkbox name="release" label="Liberar resultado en el portal del paciente" />
      </ActionForm>
    </Dialog>
  )
}

export function StudyActions({ patientId, study, canResult }: { patientId: string; study: Study; canResult: boolean }) {
  const fields = { patientId, studyId: study.id }
  return (
    <>
      {study.status === 'solicitado' && <ActionButton action={actions.updateStudyStatus} fields={{ ...fields, status: 'en-proceso' }}>Muestra recibida</ActionButton>}
      {canResult && (study.status === 'solicitado' || study.status === 'en-proceso') && <StudyResultDialog patientId={patientId} study={study} />}
      {canResult && study.status === 'resultado' && (
        <ActionButton action={actions.releaseStudy} fields={fields}>{study.releasedToPatient ? 'Retirar del portal' : 'Liberar al paciente'}</ActionButton>
      )}
      {canResult && (study.status === 'solicitado' || study.status === 'en-proceso') && (
        <ActionButton action={actions.updateStudyStatus} fields={{ ...fields, status: 'cancelado' }} style={{ variant: 'ghost', size: 'sm' }} confirmText="¿Cancelar esta solicitud de estudio?">Cancelar</ActionButton>
      )}
    </>
  )
}

// ── Dispositivos, consentimientos y adendas ─────────────────────────────────────

export function DeviceDialog({ patientId }: { patientId: string }) {
  return (
    <Dialog title="Registrar dispositivo implantado" description="Trazabilidad por número de serie o lote ante alertas sanitarias." trigger={<><Plus /> Dispositivo</>}>
      <ActionForm action={actions.addDevice}>
        <PatientField id={patientId} />
        <Field label="Tipo"><Select name="type" required defaultValue="">{[<option key="" value="" disabled>Selecciona</option>, ...implantTypes.map((t) => <option key={t}>{t}</option>)]}</Select></Field>
        <FieldGrid>
          <Field label="Marca"><Input name="brand" required /></Field>
          <Field label="Modelo"><Input name="model" /></Field>
          <Field label="Número de serie o lote"><Input name="serial" /></Field>
          <Field label="Sitio anatómico"><Input name="site" required /></Field>
          <Field label="Fecha de implante"><Input name="implantedAt" type="date" max={todayISO()} required /></Field>
          <Field label="Compatibilidad con RM"><Select name="mriSafety" defaultValue="desconocida">{mriSafety.map((m) => <option key={m} value={m}>{mriSafetyLabels[m]}</option>)}</Select></Field>
        </FieldGrid>
        <Field label="Notas"><Input name="notes" /></Field>
      </ActionForm>
    </Dialog>
  )
}

export function ConsentDialog({ patient }: { patient: Patient }) {
  return (
    <Dialog title="Carta de consentimiento bajo información" description="Contenido mínimo según la NOM-004-SSA3-2012, numeral 10.1." trigger={<><Plus /> Consentimiento</>} wide>
      <ActionForm action={actions.addConsent} submitLabel="Registrar consentimiento">
        <PatientField id={patient.id} />
        <Field label="Acto autorizado (procedimiento)"><Input name="procedure" required /></Field>
        <Field label="Riesgos"><Textarea name="risks" required className="min-h-20" /></Field>
        <Field label="Beneficios esperados"><Textarea name="benefits" required className="min-h-20" /></Field>
        <Field label="Alternativas"><Textarea name="alternatives" className="min-h-16" /></Field>
        <FieldGrid>
          <Field label="Otorga"><Select name="signer" defaultValue="paciente"><option value="paciente">El paciente</option><option value="representante">Familiar, tutor o representante legal</option></Select></Field>
          <Field label="Nombre de quien firma"><Input name="signerName" required defaultValue={patient.name} /></Field>
          <Field label="Testigo 1"><Input name="witness1" required /></Field>
          <Field label="Testigo 2"><Input name="witness2" required /></Field>
        </FieldGrid>
      </ActionForm>
    </Dialog>
  )
}

export function RevokeConsentButton({ patientId, consent }: { patientId: string; consent: Consent }) {
  if (consent.status !== 'vigente') return null
  return (
    <ActionButton action={actions.revokeConsent} fields={{ patientId, consentId: consent.id }} style={{ variant: 'ghost', size: 'sm' }} confirmText={`¿Registrar la revocación del consentimiento para "${consent.procedure}"?`}>
      Revocar
    </ActionButton>
  )
}

export function AddendumDialog({ patientId, noteId }: { patientId: string; noteId: string }) {
  return (
    <Dialog title="Agregar adenda" description="Las notas firmadas no se modifican; las aclaraciones se agregan con fecha, hora y autor." trigger={<><Plus /> Adenda</>}>
      <ActionForm action={actions.addAddendum} submitLabel="Agregar adenda">
        <PatientField id={patientId} />
        <input type="hidden" name="noteId" value={noteId} />
        <Field label="Texto"><Textarea name="text" required /></Field>
      </ActionForm>
    </Dialog>
  )
}
