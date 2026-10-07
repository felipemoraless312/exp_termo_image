import Link from 'next/link'
import { ChevronRight, ClipboardList, ShieldAlert, ShieldCheck } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { canSeeFullRecord, getPortalChart } from '@/modules/patients/data'
import { getPortalPsychoSurvey } from '@/modules/oncology/data'
import { buttonVariants } from '@/components/ui/button'
import { firstName, formatDate, greeting } from '@/lib/format'

export default async function PortalHomePage() {
  const [{ viewer, patient, record }, { survey }] = await Promise.all([getPortalChart(), getPortalPsychoSurvey()])
  const isPatient = viewer.kind === 'paciente'
  const full = canSeeFullRecord(viewer)
  const lastNote = record.notes[0]
  const medications = record.medications.filter((m) => m.status === 'activo')
  const problems = record.problems.filter((p) => p.status !== 'resuelto')

  return (
    <>
      <p className="text-eyebrow">{greeting()}</p>
      <h1 className="mt-1 text-title-1">{isPatient ? `Hola, ${firstName(patient.name)}.` : `Expediente de ${patient.name}`}</h1>

      <div className="mt-8 rounded-3xl bg-primary p-7 text-primary-foreground sm:p-9">
        <p className="text-[13px] font-medium opacity-80">Información clave</p>
        <dl className="mt-4 grid gap-5 sm:grid-cols-3">
          <div>
            <dt className="text-[13px] opacity-80">Grupo sanguíneo</dt>
            <dd className="mt-1 text-title-2">{patient.bloodType}</dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="text-[13px] opacity-80">Alergias</dt>
            <dd className="mt-1 flex items-start gap-2 text-[17px] font-medium">
              {patient.allergies.length > 0 && <ShieldAlert size={18} className="mt-1 shrink-0" aria-hidden="true" />}
              {patient.allergies.length ? patient.allergies.map((a) => `${a.agent} (${a.severity})`).join(', ') : 'Sin alergias registradas'}
            </dd>
          </div>
        </dl>
      </div>

      {isPatient && !survey && (
        <Card className="mt-4 flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <ClipboardList size={22} className="mt-0.5 shrink-0 text-accent-foreground" aria-hidden="true" />
            <div>
              <h2 className="font-semibold">Contesta tu encuesta</h2>
              <p className="mt-1 text-[14px] leading-6 text-muted-foreground">Unas preguntas sobre la prevención del cáncer de mama y de cérvix. Toma unos 10 minutos y nos ayuda mucho.</p>
            </div>
          </div>
          <Link href="/portal/encuesta" className={buttonVariants({ className: 'shrink-0' })}>Contestar</Link>
        </Card>
      )}

      {full && (
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Tile href="/portal/historial" label="Historial clínico" value="Ver línea de tiempo" />
          <Tile href="/portal/consultas" label="Última consulta" value={lastNote ? formatDate(lastNote.createdAt, 'medium') : '—'} />
          <Tile href="/portal/estudios" label="Estudios" value={`${record.studies.length} disponibles`} />
          <Tile href="/portal/documentos" label="Documentos" value={`${record.documents.length} archivos`} />
        </div>
      )}

      <Card className="mt-4 p-6">
        <h2 className="font-semibold">Diagnósticos activos</h2>
        <ul className="mt-3 space-y-2">
          {!problems.length && <li className="text-muted-foreground">Sin diagnósticos activos.</li>}
          {problems.map((p) => (
            <li key={p.id} className="flex items-start justify-between gap-4">
              <span>{p.description}{p.code && <span className="text-muted-foreground"> · {p.code}</span>}</span>
              <Badge tone={p.status === 'activo' ? 'warning' : 'accent'}>{p.status === 'activo' ? 'Activo' : 'Controlado'}</Badge>
            </li>
          ))}
        </ul>
      </Card>

      <Card className="mt-4 p-6">
        <h2 className="font-semibold">Tratamiento actual</h2>
        <ul className="mt-3 space-y-3">
          {!medications.length && <li className="text-muted-foreground">Sin tratamiento activo.</li>}
          {medications.map((m) => (
            <li key={m.id} className="flex items-start justify-between gap-4">
              <span>
                <span className="block font-medium">{m.name}</span>
                <span className="block text-[14px] leading-6 text-muted-foreground">{m.dose} · {m.route} · {m.frequency} · {m.duration}{m.instructions && ` · ${m.instructions}`}</span>
              </span>
              <Badge tone="accent">Activo</Badge>
            </li>
          ))}
        </ul>
      </Card>

      {record.devices.length > 0 && (
        <Card className="mt-4 p-6">
          <h2 className="font-semibold">Dispositivos implantados</h2>
          <ul className="mt-3 space-y-2">
            {record.devices.map((d) => (
              <li key={d.id}>
                <span className="block font-medium">{d.type} {d.brand}{d.model && ` ${d.model}`}</span>
                <span className="block text-[14px] leading-6 text-muted-foreground">{d.site}{d.notes && ` · ${d.notes}`}</span>
              </li>
            ))}
          </ul>
        </Card>
      )}

      <p className="mt-10 flex items-start gap-2 text-[13px] leading-5 text-subtle">
        <ShieldCheck size={16} className="mt-0.5 shrink-0" aria-hidden="true" />
        {isPatient
          ? 'Tu información clínica es confidencial. Para corregir datos, solicítalo desde “Mis datos”. Puedes autorizar a un contacto de confianza desde “Acceso asistido”.'
          : 'Esta información es confidencial y se comparte con autorización del paciente. Úsala solo para apoyar su atención.'}
      </p>
    </>
  )
}

function Tile({ href, label, value }: { href: string; label: string; value: string }) {
  return (
    <Link href={href} className="rounded-2xl bg-card p-5 shadow-card transition-colors hover:bg-muted/60">
      <p className="text-[13px] text-muted-foreground">{label}</p>
      <p className="mt-1.5 flex items-center justify-between font-semibold">{value}<ChevronRight size={16} className="text-subtle" aria-hidden="true" /></p>
    </Link>
  )
}
