import Link from 'next/link'

import { cn } from '@/lib/utils'

/**
 * Pestañas basadas en la URL (`?seccion=notas`): el servidor solo renderiza la sección activa,
 * el botón "atrás" funciona y cada sección se puede compartir o recargar.
 */
export function LinkTabs({ items, current, label, className }: {
  items: { href: string; key: string; label: string; count?: number }[]
  current: string
  label: string
  className?: string
}) {
  return (
    <nav aria-label={label} className={cn('-mx-5 overflow-x-auto px-5 [scrollbar-width:none] sm:mx-0 sm:px-0', className)}>
      <ul className="flex w-max gap-1 rounded-full bg-muted p-1">
        {items.map((item) => {
          const active = item.key === current
          return (
            <li key={item.key}>
              <Link
                href={item.href}
                scroll={false}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'flex h-8 items-center gap-1.5 whitespace-nowrap rounded-full px-3.5 text-[13px] font-medium transition-[background-color,color,box-shadow] duration-200',
                  active ? 'bg-card text-foreground shadow-card' : 'text-muted-foreground hover:text-foreground',
                )}
              >
                {item.label}
                {item.count !== undefined && item.count > 0 && <span className="rounded-full bg-foreground/10 px-1.5 text-[11px] tabular-nums">{item.count}</span>}
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
