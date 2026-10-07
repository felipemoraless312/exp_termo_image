import Link from 'next/link'
import { FileText, Magnet, ShieldAlert, TriangleAlert } from 'lucide-react'

import { Badge, type BadgeTone } from '@/components/ui/badge'
import { Card, CardHeader } from '@/components/ui/card'
import { EmptyState } from '@/components/ui/empty-state'
import { List, ListItem } from '@/components/ui/list'
import { allergyKindLabels, mriSafetyLabels, studyCategoryLabels } from '@/modules/catalogs/clinical'
import { formatDate, formatDateTime } from '@/lib/format'
import { cn } from '@/lib/utils'
import { bmi, news2, vitalFlags, type Flag } from '../clinical-rules'
import { noteTemplates } from '../note-templates'
import { formatStamp, type Stamp } from '../stamp'
import {
  consciousnessLabels, medicationStatus, problemStatus, studyStatus,
  type ClinicalDocument, type ClinicalNote, type Consent, type ImplantedDevice, type Medication, type Patient, type Problem, type Study, type VitalSigns,
} from '../types'

/** Piezas del expediente, compartidas entre el sistema interno y el portal del paciente. */

/** Quién, cuándo y dónde se capturó (y, si aplica, modificó) un registro. */
export function StampNote({ registered, updated, className }: { registered?: Stamp; updated?: Stamp; className?: string }) {
  const lines = [formatStamp(registered), formatStamp(updated, 'Modificó')].filter(Boolean)
  if (!lines.length) return null
  return <span className={cn('mt-0.5 block text-[12px] leading-5 text-subtle', className)}>{lines.join(' · ')}</span>
}

export function AllergyNotice({ patient }: { patient: Patient }) {
  if (!patient.allergies.length) {
    return (
      <div className="flex gap-3 rounded-2xl bg-muted p-4 text-muted-foreground">
        <ShieldAlert size={19} className="mt-0.5 shrink-0" aria-hidden="true" />
        <p className="text-[14px] leading-6">Sin alergias conocidas. Confirmar con el paciente antes de prescribir o administrar medicamentos.</p>
      </div>
    )
  }
  return (
    <div role="alert" className="flex gap-3 rounded-2xl bg-danger-soft p-4 text-danger">
      <ShieldAlert size={19} className="mt-0.5 shrink-0" aria-hidden="true" />
      <div className="text-[14px] leading-6">
        <p className="font-semibold">Alergias: {patient.allergies.map((a) => a.agent).join(', ')}</p>
        <ul className="mt-0.5">
          {patient.allergies.map((a) => <li key={a.id}>{a.agent} ({allergyKindLabels[a.kind].toLowerCase()}, {a.severity}): {a.reaction}</li>)}
        </ul>
      </div>
    </div>
  )
}

/** Avisos de seguridad del dispositivo implantado (p. ej. marcapasos y resonancia magnética). */
export function DeviceNotice({ devices }: { devices: ImplantedDevice[] }) {
  const risky = devices.filter((d) => d.mriSafety !== 'segura')
  if (!risky.length) return null
  return (
    <div className="flex gap-3 rounded-2xl bg-warning-soft p-4 text-warning">
      <Magnet size={19} className="mt-0.5 shrink-0" aria-hidden="true" />
      <p className="text-[14px] leading-6">
        <b className="font-semibold">Dispositivo implantado: </b>
        {risky.map((d) => `${d.type} ${d.brand}${d.model ? ` ${d.model}` : ''} (${mriSafetyLabels[d.mriSafety].toLowerCase()})`).join('; ')}.
      </p>
    </div>
  )
}

// ── Signos vitales ──────────────────────────────────────────────────────────────

function Measure({ label, value, unit, flag }: { label: string; value?: React.ReactNode; unit?: string; flag?: Flag }) {
  return (
    <div>
      <dt className="text-[13px] text-muted-foreground">{label}</dt>
      <dd className={cn('mt-1 text-[17px] font-semibold tabular-nums', flag?.tone === 'danger' && 'text-danger', flag?.tone === 'warning' && 'text-warning')}>
        {value ?? <span className="text-subtle">—</span>}
        {value !== undefined && unit && <span className="ml-1 text-[13px] font-normal text-muted-foreground">{unit}</span>}
      </dd>
      {flag && <dd className={cn('mt-0.5 text-xs font-medium', flag.tone === 'danger' ? 'text-danger' : 'text-warning')}>{flag.label}</dd>}
    </div>
  )
}

export function VitalsCard({ vitals, action }: { vitals?: VitalSigns; action?: React.ReactNode }) {
  if (!vitals) {
    return (
      <Card>
        <CardHeader title="Signos vitales" action={action} />
        <EmptyState title="Sin signos vitales registrados" className="py-8" />
      </Card>
    )
  }
  const flags = vitalFlags(vitals)
  const score = news2(vitals)
  const index = bmi(vitals.weight, vitals.height)

  return (
    <Card>
      <CardHeader title="Signos vitales" description={`${formatDateTime(vitals.takenAt)} · ${vitals.recordedBy}${vitals.registered ? ` · ${vitals.registered.location}` : ''}`} action={action} />
      {score && (
        <div className="mx-5 mt-4 flex flex-wrap items-center gap-x-3 gap-y-1 rounded-xl bg-muted px-4 py-3 sm:mx-6">
          <Badge tone={score.tone}>NEWS2 {score.score}</Badge>
          <span className="text-[13px] leading-5 text-muted-foreground">Riesgo {score.risk.replace('-', ' ')}. {score.response}</span>
        </div>
      )}
      <dl className="grid grid-cols-2 gap-x-6 gap-y-5 p-5 sm:grid-cols-4 sm:p-6">
        <Measure label="Presión arterial" value={vitals.systolic !== undefined ? `${vitals.systolic}/${vitals.diastolic}` : undefined} unit="mmHg" flag={flags.bloodPressure} />
        <Measure label="Frecuencia cardiaca" value={vitals.heartRate} unit="lpm" flag={flags.heartRate} />
        <Measure label="Frecuencia respiratoria" value={vitals.respiratoryRate} unit="rpm" flag={flags.respiratoryRate} />
        <Measure label="Temperatura" value={vitals.temperature} unit="°C" flag={flags.temperature} />
        <Measure label="Saturación O₂" value={vitals.spo2} unit={vitals.onOxygen ? '% con O₂' : '% aire'} flag={flags.spo2} />
        <Measure label="Glucosa capilar" value={vitals.glucose} unit="mg/dL" flag={flags.glucose} />
        <Measure label="Dolor (EVA)" value={vitals.pain !== undefined ? `${vitals.pain}/10` : undefined} flag={flags.pain} />
        <Measure label="Estado de conciencia" value={consciousnessLabels[vitals.consciousness]} />
        <Measure label="Peso" value={vitals.weight} unit="kg" />
        <Measure label="Estatura" value={vitals.height?.toFixed(2)} unit="m" />
        <Measure label="IMC" value={index?.value} unit={index?.category} />
      </dl>
      {vitals.notes && <p className="border-t border-separator px-5 py-4 text-[14px] text-muted-foreground sm:px-6">{vitals.notes}</p>}
    </Card>
  )
}

export function VitalsTable({ vitals }: { vitals: VitalSigns[] }) {
  if (!vitals.length) return <Card><EmptyState title="Sin registros de signos vitales" /></Card>
  const rows = [...vitals].reverse()
  const cell = (value: React.ReactNode, flag?: Flag) => <td className={cn('whitespace-nowrap px-3 py-3 tabular-nums', flag?.tone === 'danger' && 'font-semibold text-danger', flag?.tone === 'warning' && 'font-semibold text-warning')}>{value ?? '—'}</td>

  return (
    <Card className="overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-[14px]">
          <thead className="border-b border-separator text-[12px] text-muted-foreground">
            <tr>{['Fecha', 'TA', 'FC', 'FR', 'Temp.', 'SpO₂', 'Gluc.', 'Peso', 'EVA', 'NEWS2', 'Registró'].map((h) => <th key={h} scope="col" className="whitespace-nowrap px-3 py-3 font-medium first:pl-5">{h}</th>)}</tr>
          </thead>
          <tbody className="divide-y divide-separator">
            {rows.map((v) => {
              const flags = vitalFlags(v)
              const score = news2(v)
              return (
                <tr key={v.id}>
                  <td className="whitespace-nowrap py-3 pl-5 pr-3 text-muted-foreground">{formatDateTime(v.takenAt)}</td>
                  {cell(v.systolic !== undefined ? `${v.systolic}/${v.diastolic}` : undefined, flags.bloodPressure)}
                  {cell(v.heartRate, flags.heartRate)}
                  {cell(v.respiratoryRate, flags.respiratoryRate)}
                  {cell(v.temperature, flags.temperature)}
                  {cell(v.spo2, flags.spo2)}
                  {cell(v.glucose, flags.glucose)}
                  {cell(v.weight)}
                  {cell(v.pain, flags.pain)}
                  <td className="px-3 py-3">{score ? <Badge tone={score.tone}>{score.score}</Badge> : '—'}</td>
                  <td className="whitespace-nowrap px-3 py-3 pr-5 text-muted-foreground">{v.recordedBy}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </Card>
  )
}

// ── Problemas, tratamiento y estudios ───────────────────────────────────────────

export function ProblemList({ problems, actions }: { problems: Problem[]; actions?: (problem: Problem) => React.ReactNode }) {
  if (!problems.length) return <EmptyState title="Sin diagnósticos registrados" className="py-8" />
  return (
    <List>
      {problems.map((p) => (
        <ListItem
          key={p.id}
          leading={<span className="w-14 shrink-0 font-mono text-[13px] font-semibold text-accent-foreground">{p.code ?? '—'}</span>}
          title={p.description}
          description={<>{[p.kind === 'cronico' ? 'Crónico' : 'Agudo', `desde ${formatDate(p.since, 'medium')}`, p.notes].filter(Boolean).join(' · ')}<StampNote registered={p.registered} updated={p.updated} /></>}
          trailing={<span className="flex items-center gap-2"><Badge tone={problemStatus[p.status].tone}>{problemStatus[p.status].label}</Badge>{actions?.(p)}</span>}
        />
      ))}
    </List>
  )
}

export function MedicationList({ medications, actions, empty = 'Sin medicamentos registrados' }: { medications: Medication[]; actions?: (m: Medication) => React.ReactNode; empty?: string }) {
  if (!medications.length) return <EmptyState title={empty} className="py-8" />
  return (
    <List>
      {medications.map((m) => (
        <ListItem
          key={m.id}
          title={m.name}
          description={
            <>
              {m.dose} · {m.route} · {m.frequency} · {m.duration}
              {m.instructions && <> · {m.instructions}</>}
              <span className="mt-0.5 block text-subtle">
                {m.prescriptionFolio} · {m.prescribedBy} · {formatDate(m.startDate, 'medium')}
                {m.statusReason && ` · ${m.statusReason}`}
              </span>
              <StampNote registered={m.registered} updated={m.updated} />
            </>
          }
          trailing={<span className="flex items-center gap-2"><Badge tone={medicationStatus[m.status].tone}>{medicationStatus[m.status].label}</Badge>{actions?.(m)}</span>}
        />
      ))}
    </List>
  )
}

export function StudyCard({ study, actions }: { study: Study; actions?: React.ReactNode }) {
  return (
    <Card>
      <div className="flex flex-wrap items-start justify-between gap-3 px-5 pt-5 sm:px-6">
        <div className="min-w-0">
          <p className="text-[12px] font-medium text-muted-foreground">{studyCategoryLabels[study.category]} · {study.folio}{study.priority === 'urgente' && ' · Urgente'}</p>
          <h3 className="mt-0.5 font-semibold">{study.name}</h3>
          <p className="mt-0.5 text-[13px] text-subtle">Solicitado {formatDateTime(study.orderedAt)} · {study.orderedBy}{study.registered && ` · ${study.registered.location}`}{study.indication && ` · ${study.indication}`}</p>
          {study.updated && <StampNote updated={study.updated} />}
        </div>
        <Badge tone={studyStatus[study.status].tone}>{studyStatus[study.status].label}</Badge>
      </div>
      {study.result && (
        <div className="mt-4 border-t border-separator px-5 py-4 sm:px-6">
          <p className="text-[14px] leading-6">{study.result.summary}</p>
          {study.result.values.length > 0 && (
            <div className="mt-3 overflow-x-auto">
              <table className="w-full text-[13px]">
                <thead className="text-muted-foreground"><tr><th className="py-1.5 text-left font-medium">Analito</th><th className="py-1.5 text-right font-medium">Resultado</th><th className="py-1.5 pl-4 text-right font-medium">Referencia</th></tr></thead>
                <tbody className="divide-y divide-separator">
                  {study.result.values.map((v) => (
                    <tr key={v.analyte}>
                      <td className="py-1.5">{v.analyte}</td>
                      <td className={cn('py-1.5 text-right font-semibold tabular-nums', v.flag && 'text-danger')}>{v.value} {v.unit}{v.flag && ` ${v.flag === 'alto' ? '↑' : '↓'}`}</td>
                      <td className="py-1.5 pl-4 text-right text-muted-foreground tabular-nums">{v.range ?? '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <p className="mt-3 text-[12px] text-subtle">Resultado {formatDateTime(study.result.at)} · {study.result.reportedBy}{study.releasedToPatient ? ' · Visible para el paciente' : ''}</p>
        </div>
      )}
      {actions ? <div className="flex flex-wrap gap-2 px-5 pb-5 pt-4 sm:px-6">{actions}</div> : <div className="pb-5" />}
    </Card>
  )
}

// ── Notas ───────────────────────────────────────────────────────────────────────

export function NoteTimeline({ notes, hrefFor, compact = false }: { notes: ClinicalNote[]; hrefFor?: (note: ClinicalNote) => string; compact?: boolean }) {
  if (!notes.length) return <Card><EmptyState icon={FileText} title="Sin notas clínicas" /></Card>
  return (
    <Card className="p-5 sm:p-6">
      <ol className="space-y-7">
        {notes.map((note) => {
          const template = noteTemplates[note.type]
          const summary = note.sections.plan ?? note.sections.subjetivo ?? note.sections.motivo ?? note.sections.valoracion ?? Object.values(note.sections)[0]
          const title = hrefFor ? <Link href={hrefFor(note)} className="hover:underline">{template.label}</Link> : template.label
          return (
            <li key={note.id} className="grid gap-1 sm:grid-cols-[9.5rem_1fr] sm:gap-6">
              <time dateTime={note.createdAt} className="text-[13px] font-medium text-muted-foreground tabular-nums">{formatDateTime(note.createdAt)}</time>
              <div className="min-w-0">
                <h3 className="font-semibold">{title}</h3>
                {note.diagnoses.length > 0 && <p className="mt-1 text-[13px] text-accent-foreground">{note.diagnoses.map((d) => (d.code ? `${d.code} ${d.description}` : d.description)).join(' · ')}</p>}
                {summary && <p className={cn('mt-1 leading-6 text-muted-foreground', compact && 'line-clamp-3')}>{summary}</p>}
                <p className="mt-2 text-[13px] text-subtle">{note.author} · {note.authorRole}{note.addenda.length > 0 && ` · ${note.addenda.length} adenda(s)`}</p>
              </div>
            </li>
          )
        })}
      </ol>
    </Card>
  )
}

// ── Dispositivos, consentimientos y documentos ──────────────────────────────────

const mriTone: Record<ImplantedDevice['mriSafety'], BadgeTone> = { segura: 'success', condicional: 'warning', insegura: 'danger', desconocida: 'neutral' }

export function DeviceList({ devices }: { devices: ImplantedDevice[] }) {
  if (!devices.length) return <EmptyState title="Sin dispositivos implantados" description="Marcapasos, stents, prótesis, mallas o clips quedan registrados aquí con su número de serie para trazabilidad." className="py-8" />
  return (
    <List>
      {devices.map((d) => (
        <ListItem
          key={d.id}
          title={`${d.type} · ${d.brand}${d.model ? ` ${d.model}` : ''}`}
          description={<>{[d.site, `implantado ${formatDate(d.implantedAt, 'medium')}`, d.serial && `Serie ${d.serial}`, d.notes].filter(Boolean).join(' · ')}<StampNote registered={d.registered} /></>}
          trailing={<Badge tone={mriTone[d.mriSafety]}>{mriSafetyLabels[d.mriSafety]}</Badge>}
        />
      ))}
    </List>
  )
}

export function ConsentList({ consents, actions }: { consents: Consent[]; actions?: (c: Consent) => React.ReactNode }) {
  if (!consents.length) return <EmptyState title="Sin consentimientos registrados" className="py-8" />
  return (
    <List>
      {consents.map((c) => (
        <ListItem
          key={c.id}
          title={c.procedure}
          description={
            <>
              Riesgos: {c.risks}
              <span className="mt-0.5 block text-subtle">Otorgado por {c.signerName} ({c.signer}) · Testigos: {c.witnesses.join(', ')} · {c.physician} · {formatDateTime(c.signedAt)}{c.registered && ` · ${c.registered.location}`}</span>
              {c.updated && <StampNote updated={c.updated} />}
            </>
          }
          trailing={<span className="flex items-center gap-2"><Badge tone={c.status === 'vigente' ? 'success' : 'neutral'}>{c.status === 'vigente' ? 'Vigente' : 'Revocado'}</Badge>{actions?.(c)}</span>}
        />
      ))}
    </List>
  )
}

export function DocumentsList({ documents, action }: { documents: ClinicalDocument[]; action?: (id: string) => React.ReactNode }) {
  if (!documents.length) return <Card><EmptyState icon={FileText} title="Sin documentos" /></Card>
  return (
    <Card className="py-1.5">
      <List>
        {documents.map((d) => (
          <ListItem key={d.id} icon={FileText} title={d.name} description={`${d.kind} · ${formatDate(d.date, 'medium')}`} trailing={action?.(d.id)} />
        ))}
      </List>
    </Card>
  )
}

export function ClinicalWarning({ children }: { children: React.ReactNode }) {
  return (
    <p className="flex gap-2 rounded-xl bg-warning-soft px-4 py-3 text-[13px] leading-5 text-warning">
      <TriangleAlert size={16} className="mt-0.5 shrink-0" aria-hidden="true" />
      <span>{children}</span>
    </p>
  )
}
