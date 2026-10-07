import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ChevronLeft } from 'lucide-react'

import { ActionForm } from '@/components/ui/action-form'
import { Card, CardHeader } from '@/components/ui/card'
import { Checkbox, Field, Input, Select, Textarea } from '@/components/ui/field'
import { LinkTabs } from '@/components/ui/link-tabs'
import { PageHeader } from '@/components/ui/page-header'
import { canAccess } from '@/modules/auth/permissions'
import { requireStaff } from '@/modules/auth/session'
import { createNote } from '@/modules/patients/actions'
import { getPatientChart } from '@/modules/patients/data'
import { noteTemplates, noteTypes, prognosisOptions, type NoteType } from '@/modules/patients/note-templates'
import { AllergyNotice, DeviceNotice, MedicationList, ProblemList, VitalsCard } from '@/modules/patients/components/clinical-chart'
import { ChartDatalists } from '@/modules/patients/components/chart-forms'
import { ageFrom, formatDateTime, hoursSince } from '@/lib/format'

export const metadata = { title: 'Nueva nota' }

export default async function NewNotePage({ params, searchParams }: PageProps<'/sistema/pacientes/[id]/notas/nueva'>) {
  const [{ id }, query, user] = await Promise.all([params, searchParams, requireStaff('record.write')])
  const chart = await getPatientChart(id)
  if (!chart) notFound()
  const { patient, record } = chart

  const allowed = noteTypes.filter((type) => canAccess(user.role, noteTemplates[type].permission))
  const fallback: NoteType = allowed.includes('evolucion') ? (record.notes.length ? 'evolucion' : 'historia-clinica') : allowed[0]
  const type = allowed.find((t) => t === query.tipo) ?? fallback
  const template = noteTemplates[type]
  const latest = record.vitals.at(-1)
  const recentVitals = latest && hoursSince(latest.takenAt) < 24

  return (
    <>
      <Link href={`/sistema/pacientes/${patient.id}?seccion=notas`} className="-ml-1 mb-6 inline-flex items-center gap-0.5 text-[14px] text-accent-foreground hover:underline">
        <ChevronLeft size={17} aria-hidden="true" /> {patient.name}
      </Link>
      <PageHeader eyebrow={`${patient.record} · ${ageFrom(patient.birthDate)} años`} title={template.label} description={template.description} />

      <LinkTabs label="Tipo de nota" current={type} items={allowed.map((t) => ({ key: t, label: noteTemplates[t].label, href: `/sistema/pacientes/${patient.id}/notas/nueva?tipo=${t}` }))} />
      <ChartDatalists />

      <div className="mt-6 grid items-start gap-6 lg:grid-cols-[1fr_20rem]">
        <Card className="p-5 sm:p-7">
          <ActionForm key={type} action={createNote} submitLabel="Firmar y guardar" pendingLabel="Firmando…" className="space-y-5">
            <input type="hidden" name="patientId" value={patient.id} />
            <input type="hidden" name="type" value={type} />

            {template.fields.map((field) => (
              <Field key={field.key} label={'required' in field && field.required ? field.label : `${field.label} (opcional)`} hint={'hint' in field ? field.hint : undefined}>
                {field.rows === 1
                  ? <Input name={field.key} required={'required' in field && field.required} />
                  : <Textarea name={field.key} rows={field.rows} required={'required' in field && field.required} style={{ minHeight: `${(field.rows ?? 3) * 1.6 + 1.5}rem` }} />}
              </Field>
            ))}

            {template.permission === 'notes.medical' && (
              <fieldset className="space-y-2">
                <legend className="mb-1.5 text-[13px] font-medium text-muted-foreground">Diagnósticos (CIE-10) · el primero es el principal</legend>
                {[0, 1, 2].map((i) => (
                  <Input key={i} name="diagnoses" list="cie10-list" autoComplete="off" required={i === 0} placeholder={i === 0 ? 'Diagnóstico principal: código o descripción' : 'Diagnóstico secundario (opcional)'} />
                ))}
              </fieldset>
            )}

            {template.prognosis && (
              <Field label="Pronóstico">
                <Select name="prognosis" defaultValue={prognosisOptions[0]}>{prognosisOptions.map((p) => <option key={p}>{p}</option>)}</Select>
              </Field>
            )}

            {recentVitals && <Checkbox name="linkVitals" defaultChecked label={`Incluir signos vitales del ${formatDateTime(latest.takenAt)}`} />}

            <div className="rounded-xl bg-muted p-4">
              <Checkbox
                name="attest"
                required
                label={<>Firmo electrónicamente como <b>{user.name}</b>{user.license && ` (${user.license})`}.</>}
                hint="Declaro que la información es veraz. Una vez firmada, la nota no se puede modificar; las correcciones se agregan como adendas."
              />
            </div>
          </ActionForm>
        </Card>

        <aside className="space-y-4 lg:sticky lg:top-8">
          <AllergyNotice patient={patient} />
          <DeviceNotice devices={record.devices} />
          <VitalsCard vitals={latest} />
          <Card>
            <CardHeader title="Problemas activos" />
            <div className="mt-2 pb-2"><ProblemList problems={record.problems.filter((p) => p.status !== 'resuelto')} /></div>
          </Card>
          <Card>
            <CardHeader title="Tratamiento activo" />
            <div className="mt-2 pb-2"><MedicationList medications={record.medications.filter((m) => m.status === 'activo')} empty="Sin tratamiento activo" /></div>
          </Card>
        </aside>
      </div>
    </>
  )
}
