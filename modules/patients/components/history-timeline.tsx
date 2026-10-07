import Link from 'next/link'
import type { LucideIcon } from 'lucide-react'
import { ClipboardList, FileSignature, FlaskConical, HeartPulse, History, Pill, ShieldAlert, Stethoscope, Syringe, Tag, Cpu } from 'lucide-react'

import { Card } from '@/components/ui/card'
import { EmptyState } from '@/components/ui/empty-state'
import { formatDate } from '@/lib/format'
import { cn } from '@/lib/utils'
import { timelineKindLabels, type TimelineEvent, type TimelineKind } from '../timeline'

const icons: Record<TimelineKind, LucideIcon> = {
  nota: Stethoscope,
  signos: HeartPulse,
  receta: Pill,
  estudio: FlaskConical,
  diagnostico: Tag,
  antecedente: ClipboardList,
  dispositivo: Cpu,
  consentimiento: FileSignature,
  vacuna: Syringe,
  alergia: ShieldAlert,
}

/** Historial clínico completo en orden cronológico, agrupado por año. */
export function HistoryTimeline({ events, hrefFor }: { events: TimelineEvent[]; hrefFor?: (noteId: string) => string }) {
  if (!events.length) return <Card><EmptyState icon={History} title="El historial aún está vacío" description="Aquí aparecerá cada consulta, estudio y tratamiento registrado." /></Card>

  const years = [...new Set(events.map((e) => e.date.slice(0, 4)))]
  const counts = events.reduce<Partial<Record<TimelineKind, number>>>((acc, e) => ({ ...acc, [e.kind]: (acc[e.kind] ?? 0) + 1 }), {})

  return (
    <>
      <ul className="mb-6 flex flex-wrap gap-2" aria-label="Resumen del historial">
        {(Object.keys(counts) as TimelineKind[]).map((kind) => (
          <li key={kind} className="rounded-full bg-accent px-3 py-1 text-[13px] font-medium text-accent-foreground">{timelineKindLabels[kind]} · {counts[kind]}</li>
        ))}
      </ul>
      <div className="space-y-8">
        {years.map((year) => (
          <section key={year} aria-label={`Año ${year}`}>
            <h3 className="mb-3 text-title-3 tabular-nums">{year}</h3>
            <Card className="p-5 sm:p-6">
              <ol className="relative space-y-6 pl-11">
                <li aria-hidden="true" className="absolute bottom-2 left-[15px] top-2 w-px bg-separator" />
                {events.filter((e) => e.date.startsWith(year)).map((event) => {
                  const Icon = icons[event.kind]
                  const href = event.noteId && hrefFor ? hrefFor(event.noteId) : undefined
                  return (
                    <li key={event.id} className="relative">
                      <span className={cn('absolute -left-11 top-0 flex size-8 items-center justify-center rounded-full ring-4 ring-card', event.kind === 'alergia' ? 'bg-danger-soft text-danger' : 'bg-accent text-primary')}>
                        <Icon size={15} aria-hidden="true" />
                      </span>
                      <p className="text-[13px] text-muted-foreground">{formatDate(event.date, 'medium')} · {timelineKindLabels[event.kind]}</p>
                      <p className="mt-0.5 font-medium leading-6">
                        {href ? <Link href={href} className="hover:text-accent-foreground hover:underline">{event.title}</Link> : event.title}
                      </p>
                      {event.detail && <p className="mt-0.5 text-[14px] leading-6 text-muted-foreground">{event.detail}</p>}
                    </li>
                  )
                })}
              </ol>
            </Card>
          </section>
        ))}
      </div>
    </>
  )
}
