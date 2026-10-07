import Link from 'next/link'
import { notFound } from 'next/navigation'
import { BadgeCheck, ChevronLeft } from 'lucide-react'

import { Card } from '@/components/ui/card'
import { PlatformLogo } from '@/components/brand/logo'
import { clinic } from '@/config/clinic'
import { canAccess } from '@/modules/auth/permissions'
import { requireStaff } from '@/modules/auth/session'
import { sexLabels } from '@/modules/catalogs/clinical'
import { getPatientChart } from '@/modules/patients/data'
import { noteTemplates } from '@/modules/patients/note-templates'
import { AddendumDialog } from '@/modules/patients/components/chart-forms'
import { PrintButton } from '@/components/ui/print-button'
import { ageFrom, formatDateTime } from '@/lib/format'

export const metadata = { title: 'Nota clínica' }

/** Nota completa con los datos de identificación que exige la NOM-004, lista para imprimir. */
export default async function NotePage({ params }: PageProps<'/sistema/pacientes/[id]/notas/[noteId]'>) {
  const [{ id, noteId }, user] = await Promise.all([params, requireStaff('record')])
  const chart = await getPatientChart(id)
  const note = chart?.record.notes.find((n) => n.id === noteId)
  if (!chart || !note) notFound()
  const { patient, record } = chart
  const template = noteTemplates[note.type]
  const vitals = note.vitalsId ? record.vitals.find((v) => v.id === note.vitalsId) : undefined

  return (
    <>
      <div className="no-print mb-6 flex flex-wrap items-center justify-between gap-3">
        <Link href={`/sistema/pacientes/${patient.id}?seccion=notas`} className="-ml-1 inline-flex items-center gap-0.5 text-[14px] text-accent-foreground hover:underline">
          <ChevronLeft size={17} aria-hidden="true" /> Notas de {patient.name}
        </Link>
        <div className="flex gap-2">
          {canAccess(user.role, 'record.write') && <AddendumDialog patientId={patient.id} noteId={note.id} />}
          <PrintButton />
        </div>
      </div>

      <Card className="p-6 sm:p-10 print:p-0 print:shadow-none">
        <header className="flex flex-wrap items-start justify-between gap-4 border-b border-separator pb-5">
          <div>
            <PlatformLogo />
            {(clinic.address.lines.length > 0 || clinic.sanitaryNotice) && (
              <p className="mt-2 text-[12px] text-muted-foreground">{[clinic.address.lines.join(', '), clinic.sanitaryNotice && `Aviso sanitario ${clinic.sanitaryNotice}`].filter(Boolean).join(' · ')}</p>
            )}
          </div>
          <div className="text-right">
            <h1 className="text-title-3">{template.label}</h1>
            <p className="text-[13px] text-muted-foreground">{formatDateTime(note.createdAt)}</p>
          </div>
        </header>

        <dl className="grid grid-cols-2 gap-x-6 gap-y-2 border-b border-separator py-4 text-[13px] sm:grid-cols-4">
          <div className="col-span-2"><dt className="text-muted-foreground">Paciente</dt><dd className="font-medium">{patient.name}</dd></div>
          <div><dt className="text-muted-foreground">Expediente</dt><dd className="font-medium">{patient.record}</dd></div>
          <div><dt className="text-muted-foreground">Edad · sexo</dt><dd className="font-medium">{ageFrom(patient.birthDate)} años · {sexLabels[patient.sex]}</dd></div>
          {patient.allergies.length > 0 && <div className="col-span-2 sm:col-span-4"><dt className="text-muted-foreground">Alergias</dt><dd className="font-semibold text-danger">{patient.allergies.map((a) => a.agent).join(', ')}</dd></div>}
        </dl>

        {vitals && (
          <p className="border-b border-separator py-4 text-[13px] tabular-nums">
            <span className="text-muted-foreground">Signos vitales: </span>
            {[
              vitals.systolic !== undefined && `TA ${vitals.systolic}/${vitals.diastolic} mmHg`, vitals.heartRate && `FC ${vitals.heartRate} lpm`,
              vitals.respiratoryRate && `FR ${vitals.respiratoryRate} rpm`, vitals.temperature && `T ${vitals.temperature} °C`, vitals.spo2 && `SpO₂ ${vitals.spo2} %`,
              vitals.glucose && `Glucosa ${vitals.glucose} mg/dL`, vitals.weight && `Peso ${vitals.weight} kg`, vitals.height && `Talla ${vitals.height} m`,
            ].filter(Boolean).join(' · ')}
          </p>
        )}

        <div className="space-y-5 py-6">
          {template.fields.filter((field) => note.sections[field.key]).map((field) => (
            <section key={field.key}>
              <h2 className="text-[13px] font-semibold text-muted-foreground">{field.label}</h2>
              <p className="mt-1 whitespace-pre-line leading-7">{note.sections[field.key]}</p>
            </section>
          ))}
          {note.diagnoses.length > 0 && (
            <section>
              <h2 className="text-[13px] font-semibold text-muted-foreground">Diagnósticos</h2>
              <ol className="mt-1 list-decimal space-y-0.5 pl-5 leading-7">{note.diagnoses.map((d, i) => <li key={i}>{d.code && <b className="font-mono font-semibold">{d.code} </b>}{d.description}</li>)}</ol>
            </section>
          )}
          {note.prognosis && (
            <section>
              <h2 className="text-[13px] font-semibold text-muted-foreground">Pronóstico</h2>
              <p className="mt-1 leading-7">{note.prognosis}</p>
            </section>
          )}
        </div>

        {note.addenda.length > 0 && (
          <div className="space-y-3 border-t border-separator py-5">
            <h2 className="text-[13px] font-semibold text-muted-foreground">Adendas</h2>
            {note.addenda.map((a, i) => (
              <div key={i} className="rounded-xl bg-muted p-4">
                <p className="whitespace-pre-line leading-6">{a.text}</p>
                <p className="mt-2 text-[12px] text-subtle">{a.author} · {formatDateTime(a.at)}</p>
              </div>
            ))}
          </div>
        )}

        <footer className="mt-4 flex flex-wrap items-end justify-between gap-6 border-t border-separator pt-6">
          <div>
            <p className="font-semibold">{note.author}</p>
            <p className="text-[13px] text-muted-foreground">{note.authorRole}{note.authorLicense && ` · ${note.authorLicense}`}</p>
          </div>
          <div className="max-w-full text-right">
            <p className="inline-flex items-center gap-1.5 text-[13px] font-medium text-success"><BadgeCheck size={16} aria-hidden="true" /> Firmada electrónicamente · {formatDateTime(note.signature.at)}</p>
            <p className="mt-1 break-all font-mono text-[11px] text-subtle">SHA-256 {note.signature.hash}</p>
          </div>
        </footer>
      </Card>
    </>
  )
}
