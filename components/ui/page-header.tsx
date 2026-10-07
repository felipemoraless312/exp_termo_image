import { cn } from '@/lib/utils'

export function PageHeader({ eyebrow, title, description, actions, className }: {
  eyebrow?: string
  title: React.ReactNode
  description?: React.ReactNode
  actions?: React.ReactNode
  className?: string
}) {
  return (
    <header className={cn('mb-8 flex flex-wrap items-end justify-between gap-4', className)}>
      <div className="min-w-0">
        {eyebrow && <p className="text-eyebrow">{eyebrow}</p>}
        <h1 className="mt-1 text-title-1">{title}</h1>
        {description && <p className="mt-2 max-w-2xl text-[15px] text-muted-foreground">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </header>
  )
}

export function SectionTitle({ children, action, className }: { children: React.ReactNode; action?: React.ReactNode; className?: string }) {
  return (
    <div className={cn('mb-3 mt-10 flex items-baseline justify-between gap-4 px-1 first:mt-0', className)}>
      <h2 className="text-title-3">{children}</h2>
      {action}
    </div>
  )
}
