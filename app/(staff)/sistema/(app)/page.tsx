import Link from 'next/link'
import { Activity, FileText, FlaskConical, HeartPulse, MapPin, Ribbon, ScrollText, UserPlus, Users } from 'lucide-react'

import { KpiGrid, Meter, type Kpi } from '@/components/charts/figures'
import { Avatar } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { buttonVariants } from '@/components/ui/button'
import { Card, CardHeader } from '@/components/ui/card'
import { EmptyState } from '@/components/ui/empty-state'
import { List, ListItem } from '@/components/ui/list'
import { PageHeader } from '@/components/ui/page-header'
import { firstName, formatDate, formatDateTime, formatTime, formatWeekday, greeting, todayISO } from '@/lib/format'
import { requireStaff } from '@/modules/auth/session'
import { canAccess } from '@/modules/auth/permissions'
import { listLatestVitals, listPatients, listPendingStudies, listRecentActivity, listRecentNotes } from '@/modules/patients/data'
import { getCampaignAgenda, listCampaigns, pickCurrentCampaign } from '@/modules/oncology/data'
import { appointmentStatusInfo, riskLevelInfo, type CampaignAgenda } from '@/modules/oncology/types'
import { site } from '@/config/site'
import { news2, vitalFlags } from '@/modules/patients/clinical-rules'
import { noteTemplates } from '@/modules/patients/note-templates'

export const metadata = { title: 'Resumen' }

const linkClass = 'text-[13px] font-medium text-accent-foreground hover:underline'

/** Resumen del médico: campaña en curso, alertas clínicas, actividad reciente, notas y estudios pendientes. */
export default async function DashboardPage() {
  const user = await requireStaff('dashboard')
  const [patients, vitals, notes, studies, activity, campaigns] = await Promise.all([listPatients(), listLatestVitals(), listRecentNotes(6), listPendingStudies(), canAccess(user.role, 'audit') ? listRecentActivity(8) : Promise.resolve([]), listCampaigns()])
  const current = pickCurrentCampaign(campaigns)
  const agenda = current ? await getCampaignAgenda(current.id) : undefined

  const alerts = vitals
    .map(({ patient, vitals: v }) => ({ patient, vitals: v, score: news2(v), flags: Object.values(vitalFlags(v)) }))
    .filter((a) => (a.score && a.score.risk !== 'bajo') || a.flags.some((f) => f?.tone === 'danger'))
    .sort((a, b) => (b.score?.score ?? 0) - (a.score?.score ?? 0))

  const followUp = patients.filter((p) => p.status === 'seguimiento' || p.status === 'hospitalizado').length
  const urgent = studies.filter((s) => s.priority === 'urgente').length
  const kpis: Kpi[] = [
    { label: 'Pacientes', value: String(patients.length), icon: Users, hint: 'expedientes abiertos', href: '/sistema/pacientes' },
    { label: 'En seguimiento', value: String(followUp), icon: HeartPulse, href: '/sistema/pacientes?estado=seguimiento' },
    { label: 'Estudios pendientes', value: String(studies.length), icon: FlaskConical, hint: urgent ? `${urgent} urgente(s)` : undefined, tone: urgent ? 'warning' : 'default' },
    { label: 'Alertas clínicas', value: String(alerts.length), icon: Activity, hint: 'NEWS2 o signos críticos (24 h)', tone: alerts.length ? 'danger' : 'default' },
  ]

  return (
    <>
      <PageHeader
        eyebrow={formatWeekday()}
        title={`${greeting()}, ${firstName(user.name)}`}
        actions={canAccess(user.role, 'patients.write') && <Link href="/sistema/pacientes/nuevo" className={buttonVariants()}><UserPlus /> Nuevo paciente</Link>}
      />
      {agenda && <CampaignPanel agenda={agenda} />}

      <KpiGrid items={kpis} className={agenda ? 'mt-4' : undefined} />

      {alerts.length > 0 && (
        <section className="mt-4 rounded-2xl bg-danger-soft p-5" aria-label="Alertas clínicas">
          <h2 className="flex items-center gap-2 text-[15px] font-semibold text-danger"><Activity size={17} aria-hidden="true" /> Pacientes que requieren valoración</h2>
          <ul className="mt-3 grid gap-2 sm:grid-cols-2">
            {alerts.map((a) => (
              <li key={a.patient.id}>
                <Link href={`/sistema/pacientes/${a.patient.id}?seccion=signos`} className="flex items-center justify-between gap-3 rounded-xl bg-card px-4 py-3 shadow-card hover:bg-muted/60">
                  <span className="min-w-0">
                    <span className="block truncate font-medium">{a.patient.name}</span>
                    <span className="block truncate text-[13px] text-muted-foreground">{formatTime(a.vitals.takenAt)} · {a.flags.map((f) => f?.label).filter(Boolean).join(' · ')}</span>
                  </span>
                  {a.score && <Badge tone={a.score.tone}>NEWS2 {a.score.score}</Badge>}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {canAccess(user.role, 'audit') && <Card className="mt-4">
        <CardHeader title="Actividad reciente" description={`Cada registro guarda fecha, hora y quién lo capturó · ${site.name}`} />
        <div className="mt-2 pb-2">
          {activity.length ? (
            <List>
              {activity.map((e) => (
                <ListItem key={e.id} icon={ScrollText} title={e.summary} description={`${formatDateTime(e.at)} · ${e.actorName} · ${e.entity}`} href={e.entity === 'Campaña' ? '/sistema/campana' : `/sistema/pacientes/${e.entityId}`} />
              ))}
            </List>
          ) : <p className="px-6 py-5 text-[14px] text-muted-foreground">Sin actividad registrada.</p>}
        </div>
      </Card>}

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader title="Notas recientes" action={<Link href="/sistema/consultas" className={linkClass}>Ver todas</Link>} />
          <div className="mt-2 pb-2">
            {notes.length ? (
              <List>
                {notes.map((note) => (
                  <ListItem
                    key={note.id}
                    href={`/sistema/pacientes/${note.patient.id}/notas/${note.id}`}
                    leading={<Avatar src={note.patient.photo} name={note.patient.name} size={36} />}
                    title={note.patient.name}
                    description={`${noteTemplates[note.type].label} · ${formatDateTime(note.createdAt)}`}
                  />
                ))}
              </List>
            ) : <EmptyState icon={FileText} title="Sin notas registradas" />}
          </div>
        </Card>

        <Card>
          <CardHeader title="Estudios pendientes" description="Solicitados o en proceso" />
          <div className="mt-2 pb-2">
            {studies.length ? (
              <List>
                {studies.slice(0, 6).map((s) => (
                  <ListItem
                    key={s.id}
                    href={`/sistema/pacientes/${s.patient.id}?seccion=estudios`}
                    title={s.name}
                    description={`${s.patient.name} · ${s.folio} · ${formatDate(s.orderedAt, 'medium')}`}
                    trailing={s.priority === 'urgente' ? <Badge tone="danger">Urgente</Badge> : undefined}
                  />
                ))}
              </List>
            ) : <p className="px-6 py-5 text-[14px] text-muted-foreground">Sin estudios pendientes.</p>}
          </div>
        </Card>
      </div>
    </>
  )
}

/** Campaña en curso: avance del día, quién está en espera y pacientes de riesgo alto. */
function CampaignPanel({ agenda }: { agenda: CampaignAgenda }) {
  const { campaign, stats } = agenda
  const active = agenda.appointments.filter((a) => a.status !== 'cancelada')
  const isToday = campaign.date === todayISO()
  const waiting = active.filter((a) => a.status === 'presente')
  const highRisk = active.filter((a) => a.assessment.level === 'alto' || a.assessment.symptomatic)
  const done = stats.atendida + stats['no-asistio']
  return (
    <Card>
      <CardHeader
        title={<span className="flex items-center gap-2"><Ribbon size={18} className="text-accent-foreground" aria-hidden="true" />{campaign.name}</span>}
        description={<span className="inline-flex flex-wrap items-center gap-1.5">{isToday ? 'Hoy' : formatDate(campaign.date)} · <MapPin size={13} aria-hidden="true" />{campaign.location ?? site.name}</span>}
        action={<Link href="/sistema/campana" className={buttonVariants({ size: 'sm' })}>Abrir agenda</Link>}
      />
      <div className="grid gap-6 px-5 pb-5 pt-4 sm:px-6 sm:pb-6 lg:grid-cols-[1.2fr_1fr]">
        <div className="space-y-4">
          <Meter label="Avance" value={done} max={stats.total} display={`${done} de ${stats.total}`} tone="success" />
          <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {(['programada', 'presente', 'atendida', 'no-asistio'] as const).map((status) => (
              <div key={status} className="rounded-xl bg-muted/70 px-3 py-2.5">
                <dt className="text-[12px] text-muted-foreground">{status === 'programada' ? 'Pendientes' : appointmentStatusInfo[status].label}</dt>
                <dd className="mt-0.5 text-[1.25rem] font-semibold tabular-nums">{stats[status]}</dd>
              </div>
            ))}
          </dl>
          {waiting.length > 0 && <p className="text-[14px]"><span className="text-muted-foreground">En espera:</span> {waiting.map((w) => w.patient.name).join(', ')}</p>}
        </div>
        <div>
          <p className="text-[13px] font-medium text-muted-foreground">Requieren atención prioritaria ({highRisk.length})</p>
          {highRisk.length ? (
            <ul className="mt-2 space-y-1.5">
              {highRisk.slice(0, 5).map((a) => (
                <li key={a.id}>
                  <Link href={`/sistema/pacientes/${a.patient.id}?seccion=oncologia`} className="flex items-center justify-between gap-3 rounded-lg px-2 py-1.5 text-[14px] hover:bg-muted/60">
                    <span className="min-w-0 truncate">{a.time} · {a.patient.name}</span>
                    <Badge tone={a.assessment.symptomatic ? 'danger' : riskLevelInfo[a.assessment.level].tone}>{a.assessment.symptomatic ? 'Sintomática' : riskLevelInfo[a.assessment.level].label}</Badge>
                  </Link>
                </li>
              ))}
            </ul>
          ) : <p className="mt-2 text-[14px] text-muted-foreground">Ninguna con la información registrada hasta ahora.</p>}
        </div>
      </div>
    </Card>
  )
}
