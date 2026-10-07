import Link from 'next/link'
import { BarChart3, CalendarCheck, ClipboardList, Clock, History, MapPin, Ribbon, ScanHeart, UserPlus, Users } from 'lucide-react'

import { KpiGrid, Meter, type Kpi } from '@/components/charts/figures'
import { Avatar } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { buttonVariants } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { EmptyState } from '@/components/ui/empty-state'
import { FilterForm, FilterSelect } from '@/components/ui/filter-form'
import { LinkTabs } from '@/components/ui/link-tabs'
import { PageHeader } from '@/components/ui/page-header'
import { PrintButton } from '@/components/ui/print-button'
import { site } from '@/config/site'
import { ageFrom, formatDate, minutesNow, todayISO } from '@/lib/format'
import { canAccess } from '@/modules/auth/permissions'
import { requireStaff } from '@/modules/auth/session'
import { getCampaignAgenda, listCampaigns, pickCurrentCampaign } from '@/modules/oncology/data'
import { AppointmentActions, CampaignDialog, ScheduleDialog, ThermographyDialog } from '@/modules/oncology/components/oncology-forms'
import {
  appointmentOriginLabels, appointmentStatusInfo, formatLogEntry, recommendationInfo, riskLevelInfo, screeningFlags, thermalGradeInfo, visitLabels,
  type AgendaItem, type AppointmentStatus, type Campaign,
} from '@/modules/oncology/types'
import { listPatients } from '@/modules/patients/data'
import { VitalsDialog } from '@/modules/patients/components/chart-forms'

export const metadata = { title: 'Campaña de mama' }

const fold = (value: string) => value.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase()
const toMinutes = (time: string) => Number(time.slice(0, 2)) * 60 + Number(time.slice(3, 5))

/** Filtros de la agenda, en el orden en que avanza una paciente durante el día. */
const statusTabs: { key: AppointmentStatus | 'todas'; label: string }[] = [
  { key: 'todas', label: 'Todas' },
  { key: 'programada', label: 'Pendientes' },
  { key: 'presente', label: 'En espera' },
  { key: 'atendida', label: 'Atendidas' },
  { key: 'no-asistio', label: 'No asistieron' },
]

/** Tablero del día de la campaña: avance, quién sigue, llegada, termografía y encuesta de cada paciente. */
export default async function CampaignPage({ searchParams }: PageProps<'/sistema/campana'>) {
  const user = await requireStaff('oncology')
  const params = await searchParams
  const campaigns = await listCampaigns()
  const selected = campaigns.find((c) => c.id === params.id) ?? pickCurrentCampaign(campaigns)
  const canWrite = canAccess(user.role, 'oncology.write')
  const canCheckIn = canAccess(user.role, 'campaign.checkin')
  const canVitals = canAccess(user.role, 'vitals')

  if (!selected) {
    return (
      <>
        <PageHeader title="Campaña de mama" />
        <Card><EmptyState icon={Ribbon} title="Sin campañas" description="Crea una campaña o importa el preregistro con `npm run importar`." action={canWrite && <CampaignDialog />} /></Card>
      </>
    )
  }

  const [agenda, patients] = await Promise.all([getCampaignAgenda(selected.id), listPatients()])
  if (!agenda) return <Card><EmptyState title="No se pudo cargar la campaña" /></Card>

  const query = typeof params.q === 'string' ? params.q : ''
  const tab = statusTabs.find((t) => t.key === params.estado)?.key ?? 'todas'
  const active = agenda.appointments.filter((a) => a.status !== 'cancelada')
  const items = active.filter((a) => (tab === 'todas' || a.status === tab) && (!query || [a.patient.name, a.patient.record, a.patient.phone].some((v) => fold(v).includes(fold(query)))))
  const scheduled = new Set(active.map((a) => a.patientId))
  const available = patients.filter((p) => !scheduled.has(p.id)).map((p) => ({ id: p.id, name: p.name, record: p.record }))
  const { stats } = agenda
  const highRisk = active.filter((a) => a.assessment.level === 'alto').length
  const surveys = active.filter((a) => a.surveyId).length
  const done = stats.atendida + stats['no-asistio']

  // Quién sigue: solo el día de la campaña, la primera cita pendiente desde media hora antes de ahora (o la más atrasada).
  const isToday = agenda.campaign.date === todayISO()
  const pending = active.filter((a) => a.status === 'programada')
  const next = isToday ? pending.find((a) => toMinutes(a.time) >= minutesNow() - 30) ?? pending[0] : undefined
  const waiting = active.filter((a) => a.status === 'presente')

  const kpis: Kpi[] = [
    { label: 'Pendientes', value: String(stats.programada), icon: Users, hint: `de ${stats.total} citas` },
    { label: 'En espera', value: String(stats.presente), icon: Clock, hint: 'ya llegaron', tone: stats.presente ? 'warning' : 'default' },
    { label: 'Atendidas', value: String(stats.atendida), icon: CalendarCheck, hint: `${surveys} encuesta(s) aplicada(s)` },
    { label: 'Riesgo alto', value: String(highRisk), icon: Ribbon, hint: 'requieren seguimiento', tone: highRisk ? 'danger' : 'default' },
  ]

  const groups = new Map<string, AgendaItem[]>()
  for (const item of items) groups.set(item.time, [...(groups.get(item.time) ?? []), item])
  const count = (key: AppointmentStatus | 'todas') => (key === 'todas' ? active.length : active.filter((a) => a.status === key).length)
  const href = (key: string) => `/sistema/campana?${new URLSearchParams({ ...(params.id ? { id: selected.id } : {}), ...(key !== 'todas' ? { estado: key } : {}), ...(query ? { q: query } : {}) })}`

  return (
    <>
      <PageHeader
        eyebrow={formatDate(agenda.campaign.date)}
        title={agenda.campaign.name}
        description={<span className="inline-flex items-center gap-1.5"><MapPin size={15} aria-hidden="true" />{agenda.campaign.location ?? site.name}</span>}
        actions={
          <div className="no-print flex flex-wrap gap-2">
            {canWrite && <ScheduleDialog campaigns={[agenda.campaign]} patients={available} walkIn />}
            {canWrite && <ScheduleDialog campaigns={[agenda.campaign]} patients={available} />}
            <Link href="/sistema/pacientes/nuevo" className={buttonVariants({ variant: 'secondary', size: 'sm' })}><UserPlus /> Paciente nueva</Link>
            <Link href={`/sistema/campana/encuesta?id=${selected.id}`} className={buttonVariants({ variant: 'secondary', size: 'sm' })}><BarChart3 /> Resultados de encuesta</Link>
            <PrintButton label="Lista" />
            {canWrite && <CampaignDialog />}
          </div>
        }
      />

      <div className="no-print space-y-4">
        <KpiGrid items={kpis} />
        <Card className="grid gap-5 p-5 sm:p-6 lg:grid-cols-[1.2fr_1fr]">
          <div className="space-y-4">
            <Meter label="Avance del día" value={done} max={stats.total} display={`${done} de ${stats.total}`} tone="success" hint="Atendidas y no asistieron, sobre el total de citas." />
            <Meter label="Encuestas de psico-oncología" value={surveys} max={stats.total} display={`${surveys} de ${stats.total}`} />
          </div>
          <div className="space-y-2 text-[14px]">
            {next && <p><span className="text-muted-foreground">Sigue:</span> <strong>{next.time}</strong> · <Link href={`/sistema/pacientes/${next.patient.id}?seccion=oncologia`} className="font-medium hover:underline">{next.patient.name}</Link></p>}
            {!isToday && <p className="text-muted-foreground">Todas las citas inician como pendientes. El día de la campaña ({formatDate(agenda.campaign.date, 'medium')}) el médico registra cada llegada a la hora de la cita.</p>}
            {isToday && !pending.length && <p className="text-muted-foreground">Sin citas pendientes.</p>}
            {waiting.length > 0 && <p><span className="text-muted-foreground">En espera:</span> {waiting.map((w) => `${w.patient.name} (${w.time})`).join(', ')}</p>}
          </div>
        </Card>
      </div>

      <LinkTabs className="no-print mt-8" label="Filtrar por estado" current={tab} items={statusTabs.map((t) => ({ key: t.key, label: t.label, count: count(t.key), href: href(t.key) }))} />
      <FilterForm action="/sistema/campana" query={query} placeholder="Buscar por nombre, expediente o teléfono" className="no-print mt-4">
        {tab !== 'todas' && <input type="hidden" name="estado" value={tab} />}
        {campaigns.length > 1 && <FilterSelect name="id" value={params.id ? selected.id : undefined} label="Campaña actual" options={campaigns.map((c: Campaign) => ({ value: c.id, label: `${formatDate(c.date, 'medium')} · ${c.total ?? 0} citas` }))} />}
      </FilterForm>

      {items.length ? (
        <div className="space-y-6">
          {[...groups.entries()].map(([time, group]) => (
            <section key={time} aria-label={`Citas de las ${time}`}>
              <h2 className="mb-2 flex items-center gap-2 px-1 text-[13px] font-semibold text-muted-foreground"><Clock size={14} aria-hidden="true" /> {time} · {group.length}</h2>
              <Card className="divide-y divide-separator py-1">
                {group.map((item) => <AgendaRow key={item.id} item={item} campaign={agenda.campaign} canWrite={canWrite} canCheckIn={canCheckIn} canVitals={canVitals} isNext={item.id === next?.id} />)}
              </Card>
            </section>
          ))}
        </div>
      ) : <Card><EmptyState icon={Users} title={query || tab !== 'todas' ? 'Sin pacientes en este filtro' : 'Sin citas'} /></Card>}

      <p className="mt-6 px-1 text-[12px] leading-5 text-subtle">
        Cada movimiento queda registrado con fecha, hora, persona y sede ({site.name}). La termografía es un estudio complementario: no sustituye a la mastografía de tamizaje (NOM-041-SSA2-2011, cada 2 años de 40 a 69 años).
      </p>
    </>
  )
}

function AgendaRow({ item, campaign, canWrite, canCheckIn, canVitals, isNext }: { item: AgendaItem; campaign: Campaign; canWrite: boolean; canCheckIn: boolean; canVitals: boolean; isNext: boolean }) {
  const age = ageFrom(item.patient.birthDate, new Date(`${campaign.date}T12:00:00`))
  const flags = screeningFlags(item.screening, age)
  const risk = riskLevelInfo[item.assessment.level]
  const status = appointmentStatusInfo[item.status]
  const last = item.log?.at(-1)
  return (
    <div className={`flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-start sm:gap-4 sm:px-6 ${isNext ? 'bg-accent/50' : ''}`}>
      <div className="flex shrink-0 items-center gap-2 sm:w-28 sm:flex-col sm:items-start sm:pt-1">
        <Badge tone={status.tone}>{status.label}</Badge>
        {isNext && <span className="text-[12px] font-medium text-accent-foreground">Sigue</span>}
      </div>
      <Link href={`/sistema/pacientes/${item.patient.id}?seccion=oncologia`} className="flex min-w-0 flex-1 items-start gap-3.5 hover:opacity-80">
        <Avatar src={item.patient.photo} name={item.patient.name} size={40} />
        <span className="min-w-0">
          <span className="block font-medium">{item.patient.name}</span>
          <span className="mt-0.5 block text-[13px] text-muted-foreground">
            {item.patient.record} · {age} años · {item.patient.phone} · {visitLabels[item.visit]}
            {item.origin !== 'preregistro' && ` · ${appointmentOriginLabels[item.origin]}`}
          </span>
          <span className="mt-2 flex flex-wrap gap-1.5">
            {item.assessment.level !== 'habitual' && <Badge tone={risk.tone}>{risk.label}</Badge>}
            {item.assessment.symptomatic && <Badge tone="danger">Sintomática</Badge>}
            {flags.map((f) => <Badge key={f.label} tone={f.tone}>{f.label}</Badge>)}
            {item.thermography && <Badge tone={thermalGradeInfo[item.thermography.grade].tone}><ScanHeart size={12} aria-hidden="true" />{item.thermography.folio} · {item.thermography.grade}</Badge>}
            {item.thermography && <Badge tone={recommendationInfo[item.thermography.recommendation].tone}>{recommendationInfo[item.thermography.recommendation].label}</Badge>}
            {item.surveyId && <Badge tone="success"><ClipboardList size={12} aria-hidden="true" />Encuesta</Badge>}
          </span>
          {item.notes && <span className="mt-1.5 block text-[13px] text-muted-foreground">{item.notes}</span>}
          {last && <span className="mt-1.5 flex items-start gap-1.5 text-[12px] leading-5 text-subtle"><History size={13} className="mt-0.5 shrink-0" aria-hidden="true" />{formatLogEntry(last)}</span>}
        </span>
      </Link>
      {(canWrite || canCheckIn || canVitals) && (
        <div className="no-print flex shrink-0 flex-wrap items-center gap-2 sm:justify-end">
          {canCheckIn && <AppointmentActions patientId={item.patient.id} appointment={item} />}
          {canVitals && item.status === 'presente' && <VitalsDialog patient={item.patient} />}
          {canWrite && item.status === 'presente' && <ThermographyDialog patient={item.patient} campaigns={[campaign]} campaignId={campaign.id} />}
          {canWrite && !item.surveyId && (item.status === 'presente' || item.status === 'atendida') && (
            <Link href={`/sistema/pacientes/${item.patient.id}/encuesta`} className={buttonVariants({ variant: 'secondary', size: 'sm' })}><ClipboardList /> Encuesta</Link>
          )}
        </div>
      )}
    </div>
  )
}
