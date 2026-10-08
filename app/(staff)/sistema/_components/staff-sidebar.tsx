'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LogOut, MoreHorizontal, PanelLeftClose, PanelLeftOpen, X } from 'lucide-react'

import { PlatformLogo } from '@/components/brand/logo'
import { Avatar } from '@/components/ui/avatar'
import { signOutStaff } from '@/modules/auth/actions'
import { staffRoleLabels, type StaffRole } from '@/modules/auth/permissions'
import { cn } from '@/lib/utils'
import { isActive, mobileNavigationFor, navigationFor } from './navigation'

type User = { name: string; role: StaffRole }

/** Cookie con la preferencia de la barra lateral; el layout la lee para pintar el ancho correcto desde el servidor. */
export const SIDEBAR_COOKIE = 'md_sidebar'

/** Barra lateral plegable: completa (w-60) o solo íconos (w-16). El estado vive en `data-sidebar` del contenedor `#staff-shell`. */
export function StaffSidebar({ user, initialCollapsed }: { user: User; initialCollapsed: boolean }) {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(initialCollapsed)
  const groups = navigationFor(user.role)
  const hrefs = groups.flatMap((group) => group.items.map((item) => item.href))

  function toggle() {
    const next = !collapsed
    setCollapsed(next)
    document.getElementById('staff-shell')?.setAttribute('data-sidebar', next ? 'collapsed' : 'expanded')
    document.cookie = `${SIDEBAR_COOKIE}=${next ? 'collapsed' : 'expanded'}; path=/; max-age=31536000; samesite=lax`
  }

  return (
    <aside className="no-print fixed inset-y-0 left-0 z-30 hidden w-60 flex-col border-r border-border bg-card/60 backdrop-blur-xl transition-[width] duration-200 md:flex group-data-[sidebar=collapsed]/shell:w-16">
      <div className="flex items-center justify-between gap-2 px-5 pb-4 pt-5 group-data-[sidebar=collapsed]/shell:justify-center group-data-[sidebar=collapsed]/shell:px-0">
        <PlatformLogo className="min-w-0 group-data-[sidebar=collapsed]/shell:hidden" />
        <button
          type="button"
          onClick={toggle}
          aria-expanded={!collapsed}
          aria-label={collapsed ? 'Mostrar menú' : 'Ocultar menú'}
          title={collapsed ? 'Mostrar menú' : 'Ocultar menú'}
          className="flex size-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          {collapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
        </button>
      </div>
      <nav aria-label="Sistema" className="flex-1 space-y-6 overflow-y-auto px-3 py-3 group-data-[sidebar=collapsed]/shell:px-2">
        {groups.map((group) => (
          <div key={group.label}>
            <p className="px-3 pb-1.5 text-[11px] font-semibold text-subtle group-data-[sidebar=collapsed]/shell:sr-only">{group.label}</p>
            <ul className="space-y-0.5">
              {group.items.map(({ href, label, icon: Icon }) => {
                const active = isActive(pathname, href, hrefs)
                return (
                  <li key={href}>
                    <Link href={href} title={collapsed ? label : undefined} aria-current={active ? 'page' : undefined} className={cn('flex h-9 items-center gap-3 rounded-lg px-3 text-[14px] transition-colors group-data-[sidebar=collapsed]/shell:justify-center group-data-[sidebar=collapsed]/shell:px-0', active ? 'bg-accent font-medium text-accent-foreground' : 'text-foreground/80 hover:bg-muted')}>
                      <Icon size={17} aria-hidden="true" className={cn('shrink-0', !active && 'text-muted-foreground')} />
                      <span className="truncate group-data-[sidebar=collapsed]/shell:sr-only">{label}</span>
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
    <div className="flex items-center gap-3 border-t border-border p-4 group-data-[sidebar=collapsed]/shell:flex-col group-data-[sidebar=collapsed]/shell:px-0">
      <Avatar name={user.name} size={34} />
      <div className="min-w-0 flex-1 group-data-[sidebar=collapsed]/shell:sr-only">
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
