'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

import { cn } from '@/lib/utils'

export type PortalNavItem = { href: string; label: string }

/** Los apartados dependen de quién entra: el paciente o un contacto con alcance limitado. */
export function PortalNav({ items }: { items: PortalNavItem[] }) {
  const pathname = usePathname()

  return (
    <nav aria-label="Portal" className="-mx-5 overflow-x-auto px-5 [scrollbar-width:none]">
      <ul className="flex gap-1">
        {items.map(({ href, label }) => {
          const active = pathname === href
          return (
            <li key={href}>
              <Link href={href} aria-current={active ? 'page' : undefined} className={cn('flex h-8 items-center whitespace-nowrap rounded-full px-3.5 text-[13px] font-medium transition-colors', active ? 'bg-foreground text-background' : 'text-muted-foreground hover:bg-muted hover:text-foreground')}>
                {label}
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
