'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LogOut, MoreHorizontal, X } from 'lucide-react'

import { PlatformLogo } from '@/components/brand/logo'
import { Avatar } from '@/components/ui/avatar'
import { signOutStaff } from '@/modules/auth/actions'
import { staffRoleLabels, type StaffRole } from '@/modules/auth/permissions'
import { cn } from '@/lib/utils'
import { isActive, mobileNavigationFor, navigationFor } from './navigation'

type User = { name: string; role: StaffRole }

export function StaffSidebar({ user }: { user: User }) {
  const pathname = usePathname()
  const groups = navigationFor(user.role)
  const hrefs = groups.flatMap((group) => group.items.map((item) => item.href))

  return (
    <aside className="no-print fixed inset-y-0 left-0 z-30 hidden w-60 flex-col border-r border-border bg-card/60 backdrop-blur-xl md:flex">
      <div className="px-5 pb-4 pt-5"><PlatformLogo /></div>
      <nav aria-label="Sistema" className="flex-1 space-y-6 overflow-y-auto px-3 py-3">
        {groups.map((group) => (
          <div key={group.label}>
            <p className="px-3 pb-1.5 text-[11px] font-semibold text-subtle">{group.label}</p>
            <ul className="space-y-0.5">
              {group.items.map(({ href, label, icon: Icon }) => {
                const active = isActive(pathname, href, hrefs)
                return (
                  <li key={href}>
                    <Link href={href} aria-current={active ? 'page' : undefined} className={cn('flex h-9 items-center gap-3 rounded-lg px-3 text-[14px] transition-colors', active ? 'bg-accent font-medium text-accent-foreground' : 'text-foreground/80 hover:bg-muted')}>
                      <Icon size={17} aria-hidden="true" className={active ? '' : 'text-muted-foreground'} />{label}
                    </Link>
                  </li>
                )
              })}
            </ul>
          </div>
        ))}
      </nav>
      <UserCard user={user} />
    </aside>
  )
}

function UserCard({ user }: { user: User }) {
  return (
    <div className="flex items-center gap-3 border-t border-border p-4">
      <Avatar name={user.name} size={34} />
      <div className="min-w-0 flex-1">
        <p className="truncate text-[13px] font-medium">{user.name}</p>
        <p className="text-xs text-muted-foreground">{staffRoleLabels[user.role]}</p>
      </div>
      <form action={signOutStaff}>
        <button type="submit" aria-label="Cerrar sesión" className="flex size-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
          <LogOut size={16} />
        </button>
      </form>
    </div>
  )
}

/** Barra de pestañas inferior para móvil, con hoja "Más" para el resto de las secciones. */
export function StaffTabBar({ user }: { user: User }) {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const tabs = mobileNavigationFor(user.role)
  const groups = navigationFor(user.role)
  const hrefs = groups.flatMap((group) => group.items.map((item) => item.href))
  const moreActive = !tabs.some((tab) => isActive(pathname, tab.href, hrefs))

  return (
    <>
      <nav aria-label="Sistema" className="no-print material fixed inset-x-0 bottom-0 z-30 border-t border-border pb-[env(safe-area-inset-bottom)] md:hidden">
        <ul className="grid grid-cols-5">
          {tabs.map(({ href, label, icon: Icon }) => {
            const active = isActive(pathname, href, hrefs)
            return (
              <li key={href}>
                <Link href={href} aria-current={active ? 'page' : undefined} className={cn('flex h-14 flex-col items-center justify-center gap-0.5 text-[10px] font-medium', active ? 'text-primary' : 'text-muted-foreground')}>
                  <Icon size={21} aria-hidden="true" />{label}
                </Link>
              </li>
            )
          })}
          <li>
            <button type="button" onClick={() => setOpen(true)} aria-expanded={open} className={cn('flex h-14 w-full flex-col items-center justify-center gap-0.5 text-[10px] font-medium', moreActive ? 'text-primary' : 'text-muted-foreground')}>
              <MoreHorizontal size={21} aria-hidden="true" />Más
            </button>
          </li>
        </ul>
      </nav>

      {open && (
        <div className="fixed inset-0 z-40 md:hidden" role="dialog" aria-modal="true" aria-label="Todas las secciones">
          <button type="button" aria-label="Cerrar" className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <div className="animate-rise absolute inset-x-0 bottom-0 max-h-[85dvh] overflow-y-auto rounded-t-3xl bg-background pb-[calc(env(safe-area-inset-bottom)+1rem)]">
            <div className="sticky top-0 flex items-center justify-between bg-background px-5 pb-2 pt-4">
              <p className="text-title-3">Secciones</p>
              <button type="button" onClick={() => setOpen(false)} aria-label="Cerrar" className="flex size-8 items-center justify-center rounded-full bg-muted"><X size={16} /></button>
            </div>
            {groups.map((group) => (
              <div key={group.label} className="px-4 pt-4">
                <p className="px-2 pb-1.5 text-[12px] font-medium text-muted-foreground">{group.label}</p>
                <ul className="divide-y divide-separator overflow-hidden rounded-2xl bg-card">
                  {group.items.map(({ href, label, icon: Icon }) => (
                    <li key={href}>
                      <Link href={href} onClick={() => setOpen(false)} className={cn('flex h-12 items-center gap-3 px-4 text-[15px]', isActive(pathname, href, hrefs) && 'font-medium text-primary')}>
                        <Icon size={18} aria-hidden="true" className="text-muted-foreground" />{label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
            <div className="px-4 pt-6"><div className="overflow-hidden rounded-2xl bg-card"><UserCard user={user} /></div></div>
          </div>
        </div>
      )}
    </>
  )
}
