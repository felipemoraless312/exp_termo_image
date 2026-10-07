import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

import { cn } from '@/lib/utils'

/** Lista agrupada estilo iOS: filas separadas por líneas finas con sangría. */
export function List({ className, ...props }: React.ComponentProps<'ul'>) {
  return <ul className={cn('divide-y divide-separator', className)} {...props} />
}

type ListItemProps = {
  title: React.ReactNode
  description?: React.ReactNode
  icon?: LucideIcon
  leading?: React.ReactNode
  trailing?: React.ReactNode
  href?: string
  className?: string
}

export function ListItem({ title, description, icon: Icon, leading, trailing, href, className }: ListItemProps) {
  const content = (
    <>
      {leading ?? (Icon && (
        <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-accent text-accent-foreground">
          <Icon size={16} aria-hidden="true" />
        </span>
      ))}
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[15px] font-medium">{title}</span>
        {description && <span className="mt-0.5 block text-[13px] leading-5 text-muted-foreground">{description}</span>}
      </span>
      {trailing}
      {href && <ChevronRight size={16} className="shrink-0 text-subtle" aria-hidden="true" />}
    </>
  )
  const rowClass = cn('flex min-h-14 items-center gap-3.5 px-5 py-3 sm:px-6', className)

  return (
    <li>
      {href
        ? <Link href={href} className={cn(rowClass, 'transition-colors hover:bg-muted/60 focus-visible:-outline-offset-2')}>{content}</Link>
        : <div className={rowClass}>{content}</div>}
    </li>
  )
}

/** Par etiqueta / valor para fichas de datos. */
export function DescriptionList({ className, ...props }: React.ComponentProps<'dl'>) {
  return <dl className={cn('divide-y divide-separator', className)} {...props} />
}

export function DescriptionItem({ label, children, className }: { label: React.ReactNode; children: React.ReactNode; className?: string }) {
  return (
    <div className={cn('flex flex-col gap-0.5 px-5 py-3 sm:flex-row sm:items-baseline sm:justify-between sm:gap-6 sm:px-6', className)}>
      <dt className="shrink-0 text-[13px] text-muted-foreground">{label}</dt>
      <dd className="text-[15px] sm:text-right">{children}</dd>
    </div>
  )
}
