import Link from 'next/link'
import { ArrowDownRight, ArrowUpRight, ChevronRight } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

import { cn } from '@/lib/utils'
import type { Series } from './scale'

/*
 * Figuras de dashboard que no necesitan JavaScript: indicadores, minigráficas,
 * medidores y barras horizontales. Los valores siempre se muestran como texto,
 * así que el color nunca es el único canal de información.
 */

export function Sparkline({ values, className, label }: { values: number[]; className?: string; label?: string }) {
  if (values.length < 2) return null
  const w = 96
  const h = 28
  const max = Math.max(...values, 1)
  const min = Math.min(...values, 0)
  const x = (i: number) => (i / (values.length - 1)) * (w - 4) + 2
  const y = (v: number) => h - 3 - ((v - min) / (max - min || 1)) * (h - 6)
  const path = values.map((v, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(' ')
  const last = values.length - 1
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className={cn('h-7 w-24 overflow-visible', className)} role="img" aria-label={label ?? `Tendencia: ${values.join(', ')}`}>
      <path d={`${path} L${x(last)},${h} L${x(0)},${h} Z`} fill="var(--series-1)" opacity={0.1} />
      <path d={path} fill="none" stroke="var(--subtle)" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={x(last)} cy={y(values[last])} r={3.5} fill="var(--series-1)" stroke="var(--card)" strokeWidth={2} />
    </svg>
  )
}

export type Kpi = {
  label: string
  value: string
  icon?: LucideIcon
  hint?: string
  /** Variación frente a un periodo; `good` indica si subir es bueno. */
  delta?: { value: number; period: string; good: 'up' | 'down'; suffix?: string }
  trend?: number[]
  href?: string
  tone?: 'default' | 'warning' | 'danger'
}

export function KpiGrid({ items, className }: { items: Kpi[]; className?: string }) {
  return <div className={cn('grid grid-cols-2 gap-3 lg:grid-cols-4', className)}>{items.map((kpi) => <KpiTile key={kpi.label} {...kpi} />)}</div>
}

export function KpiTile({ label, value, icon: Icon, hint, delta, trend, href, tone = 'default' }: Kpi) {
  const positive = delta ? (delta.good === 'up' ? delta.value >= 0 : delta.value <= 0) : true
  const content = (
    <>
      <div className="flex items-center justify-between gap-2 text-[13px] text-muted-foreground">
        <span className="flex min-w-0 items-center gap-2">
          {Icon && <span className={cn('flex size-7 shrink-0 items-center justify-center rounded-lg', tone === 'danger' ? 'bg-danger-soft text-danger' : tone === 'warning' ? 'bg-warning-soft text-warning' : 'bg-accent text-accent-foreground')}><Icon size={15} aria-hidden="true" /></span>}
          <span className="truncate">{label}</span>
        </span>
        {href && <ChevronRight size={15} className="shrink-0 text-subtle" aria-hidden="true" />}
      </div>
      <div className="mt-3 flex items-end justify-between gap-2">
        <p className={cn('text-[1.875rem] font-semibold leading-none tracking-tight', tone === 'danger' && 'text-danger')}>{value}</p>
        {trend && <Sparkline values={trend} label={`Tendencia de ${label.toLowerCase()}`} className="hidden sm:block" />}
      </div>
      {(delta || hint) && (
        <p className="mt-2 flex flex-wrap items-center gap-x-1.5 text-xs text-subtle">
          {delta && (
            <span className={cn('inline-flex items-center font-medium', positive ? 'text-success' : 'text-danger')}>
              {delta.value >= 0 ? <ArrowUpRight size={13} aria-hidden="true" /> : <ArrowDownRight size={13} aria-hidden="true" />}
              {delta.value >= 0 ? '+' : ''}{delta.value}{delta.suffix ?? ''}
            </span>
          )}
          {delta && <span>{delta.period}</span>}
          {hint && <span>{delta ? `· ${hint}` : hint}</span>}
        </p>
      )}
    </>
  )
  const className = 'block rounded-2xl bg-card p-4 shadow-card sm:p-5'
  return href ? <Link href={href} className={cn(className, 'transition-colors hover:bg-muted/50')}>{content}</Link> : <div className={className}>{content}</div>
}

/** Medidor: proporción contra un límite. La pista es un tono claro del mismo color que el relleno. */
export function Meter({ label, value, max, display, tone = 'accent', marker, hint }: {
  label: React.ReactNode
  value: number
  max: number
  display?: string
  tone?: 'accent' | 'success' | 'warning' | 'danger'
  /** Marca de referencia (p. ej. existencia mínima). */
  marker?: { value: number; label: string }
  hint?: string
}) {
  const pct = Math.max(0, Math.min(100, (value / (max || 1)) * 100))
  const fill = { accent: 'bg-primary', success: 'bg-success', warning: 'bg-warning', danger: 'bg-danger' }[tone]
  const track = { accent: 'bg-accent', success: 'bg-success-soft', warning: 'bg-warning-soft', danger: 'bg-danger-soft' }[tone]
  return (
    <div>
      <div className="flex items-baseline justify-between gap-3 text-[13px]">
        <span className="min-w-0 truncate">{label}</span>
        <span className="shrink-0 font-semibold tabular-nums">{display ?? `${Math.round(pct)} %`}</span>
      </div>
      <div className={cn('relative mt-1.5 h-2 rounded-full', track)} role="meter" aria-valuemin={0} aria-valuemax={max} aria-valuenow={value} aria-label={typeof label === 'string' ? label : undefined}>
        <div className={cn('h-full rounded-full', fill)} style={{ width: `${pct}%` }} />
        {marker && <span className="absolute -top-1 h-4 w-0.5 rounded-full bg-foreground/50" style={{ left: `${Math.min(100, (marker.value / (max || 1)) * 100)}%` }} title={marker.label} />}
      </div>
      {hint && <p className="mt-1 text-[12px] text-subtle">{hint}</p>}
    </div>
  )
}

/** Lista de barras horizontales ordenadas, con el valor al final de cada barra. */
export function BarList({ items, color = 'var(--series-1)', format = (v) => v.toLocaleString('es-MX'), caption }: {
  items: { label: string; value: number; href?: string; sub?: string }[]
  color?: string
  format?: (value: number) => string
  caption: string
}) {
  const max = Math.max(...items.map((i) => i.value), 1)
  return (
    <figure>
      <ul className="space-y-3">
        {items.map((item) => {
          const row = (
            <>
              <div className="flex items-baseline justify-between gap-3 text-[13px]">
                <span className="min-w-0 truncate">{item.label}{item.sub && <span className="ml-1.5 text-subtle">{item.sub}</span>}</span>
                <span className="shrink-0 font-semibold tabular-nums">{format(item.value)}</span>
              </div>
              <div className="mt-1.5 h-2 rounded-r-[4px]" style={{ width: `${Math.max(2, (item.value / max) * 100)}%`, background: color }} />
            </>
          )
          return <li key={item.label}>{item.href ? <Link href={item.href} className="block rounded-lg hover:opacity-80">{row}</Link> : row}</li>
        })}
      </ul>
      <figcaption className="sr-only">{caption}</figcaption>
    </figure>
  )
}

/** Composición de un total en una sola barra, con leyenda que muestra cada cifra. */
export function PartBar({ parts, caption, className }: { parts: (Series & { value: number })[]; caption: string; className?: string }) {
  const total = parts.reduce((sum, p) => sum + p.value, 0)
  return (
    <figure className={className}>
      <div className="flex h-3 gap-[2px] overflow-hidden rounded-full bg-muted" role="img" aria-label={`${caption}: ${parts.map((p) => `${p.name} ${p.value}`).join(', ')}`}>
        {parts.filter((p) => p.value > 0).map((p) => <div key={p.key} style={{ flexGrow: p.value, background: p.color }} title={`${p.name}: ${p.value}`} />)}
      </div>
      <ul className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1.5 text-[13px] sm:flex sm:flex-wrap">
        {parts.map((p) => (
          <li key={p.key} className="flex items-center gap-1.5">
            <span className="size-2.5 shrink-0 rounded-[3px]" style={{ background: p.color }} />
            <span className="text-muted-foreground">{p.name}</span>
            <b className="font-semibold tabular-nums">{p.value}</b>
            {total > 0 && <span className="text-subtle">({Math.round((p.value / total) * 100)} %)</span>}
          </li>
        ))}
      </ul>
      <figcaption className="sr-only">{caption}</figcaption>
    </figure>
  )
}

/** Varias barras de composición alineadas (p. ej. estado de equipos por área). */
export function StackedBarList({ rows, series, caption }: { rows: { label: string; values: Record<string, number>; href?: string }[]; series: Series[]; caption: string }) {
  const max = Math.max(...rows.map((r) => series.reduce((sum, s) => sum + (r.values[s.key] ?? 0), 0)), 1)
  return (
    <figure>
      <ul className="space-y-3">
        {rows.map((row) => {
          const total = series.reduce((sum, s) => sum + (row.values[s.key] ?? 0), 0)
          const body = (
            <>
              <div className="flex items-baseline justify-between gap-3 text-[13px]">
                <span className="truncate">{row.label}</span>
                <span className="shrink-0 tabular-nums text-muted-foreground">{series.map((s) => row.values[s.key] ?? 0).join(' · ')}</span>
              </div>
              <div className="mt-1.5 flex h-2 gap-[2px]" style={{ width: `${(total / max) * 100}%` }}>
                {series.map((s, i) => (row.values[s.key] ?? 0) > 0 && (
                  <div key={s.key} className={cn(i === series.length - 1 || series.slice(i + 1).every((n) => !(row.values[n.key] ?? 0)) ? 'rounded-r-[4px]' : '')} style={{ flexGrow: row.values[s.key], background: s.color }} title={`${s.name}: ${row.values[s.key]}`} />
                ))}
              </div>
            </>
          )
          return <li key={row.label}>{row.href ? <Link href={row.href} className="block hover:opacity-80">{body}</Link> : body}</li>
        })}
      </ul>
      <ul className="mt-4 flex flex-wrap gap-x-4 gap-y-1 text-[12px] text-muted-foreground">
        {series.map((s) => <li key={s.key} className="flex items-center gap-1.5"><span className="size-2.5 rounded-[3px]" style={{ background: s.color }} />{s.name}</li>)}
      </ul>
      <figcaption className="sr-only">{caption}. Valores por fila en el orden: {series.map((s) => s.name).join(', ')}.</figcaption>
    </figure>
  )
}

/** Tarjeta contenedora de una gráfica con título, descripción y acción. */
export function ChartCard({ title, description, action, children, className }: { title: string; description?: string; action?: React.ReactNode; children: React.ReactNode; className?: string }) {
  return (
    <section className={cn('rounded-2xl bg-card p-5 shadow-card sm:p-6', className)}>
      <header className="mb-5 flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h2 className="text-[15px] font-semibold">{title}</h2>
          {description && <p className="mt-0.5 text-[13px] text-muted-foreground">{description}</p>}
        </div>
        {action}
      </header>
      {children}
    </section>
  )
}
