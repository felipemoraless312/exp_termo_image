import type { LucideIcon } from 'lucide-react'

import { cn } from '@/lib/utils'

export type StatItem = { label: string; value: string; icon?: LucideIcon; hint?: string }

export function StatGrid({ items, className }: { items: StatItem[]; className?: string }) {
  return (
    <div className={cn('grid grid-cols-2 gap-3 lg:grid-cols-4', className)}>
      {items.map(({ label, value, icon: Icon, hint }) => (
        <div key={label} className="rounded-2xl bg-card p-4 shadow-card sm:p-5">
          <div className="flex items-center gap-2 text-[13px] text-muted-foreground">
            {Icon && <Icon size={15} aria-hidden="true" />}
            <span className="truncate">{label}</span>
          </div>
          <p className="mt-3 text-[1.75rem] font-semibold leading-none tracking-tight tabular-nums">{value}</p>
          {hint && <p className="mt-2 text-xs text-subtle">{hint}</p>}
        </div>
      ))}
    </div>
  )
}
