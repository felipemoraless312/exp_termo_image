import type { LucideIcon } from 'lucide-react'

import { cn } from '@/lib/utils'

export function EmptyState({ icon: Icon, title, description, action, className }: {
  icon?: LucideIcon
  title: string
  description?: string
  action?: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn('flex flex-col items-center px-6 py-12 text-center', className)}>
      {Icon && <span className="flex size-11 items-center justify-center rounded-full bg-muted text-muted-foreground"><Icon size={20} aria-hidden="true" /></span>}
      <p className="mt-3 font-medium">{title}</p>
      {description && <p className="mt-1 max-w-sm text-[14px] leading-6 text-muted-foreground">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}
