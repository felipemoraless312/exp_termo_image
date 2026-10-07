import type { Metadata } from 'next'
import Link from 'next/link'
import { LogOut, UserCheck } from 'lucide-react'

import { PlatformLogo } from '@/components/brand/logo'
import { Avatar } from '@/components/ui/avatar'
import { accessScopes } from '@/modules/access/types'
import { signOutPortal } from '@/modules/auth/actions'
import { requirePortalViewer } from '@/modules/auth/session'
import { canSeeFullRecord } from '@/modules/patients/data'
import { PortalNav, type PortalNavItem } from '../_components/portal-nav'

export const metadata: Metadata = {
  title: { default: 'Portal del paciente', template: '%s · Portal del paciente' },
  robots: { index: false, follow: false },
}

export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  const viewer = await requirePortalViewer()
  const { patient } = viewer
  const isPatient = viewer.kind === 'paciente'
  const full = canSeeFullRecord(viewer)

  const items: PortalNavItem[] = [
    { href: '/portal', label: 'Inicio' },
    ...(full ? [
      { href: '/portal/historial', label: 'Historial' },
      { href: '/portal/consultas', label: 'Consultas' },
      { href: '/portal/estudios', label: 'Estudios' },
      { href: '/portal/documentos', label: 'Documentos' },
    ] : []),
    { href: '/portal/informacion', label: isPatient ? 'Mis datos' : 'Datos del paciente' },
    ...(isPatient ? [{ href: '/portal/acceso-asistido', label: 'Acceso asistido' }] : []),
  ]

  return (
    <div className="min-h-dvh">
      <header className="material sticky top-0 z-30 border-b border-border/60">
        <div className="mx-auto max-w-4xl px-5">
          <div className="flex h-14 items-center justify-between">
            <Link href="/portal"><PlatformLogo /></Link>
            <div className="flex items-center gap-2">
              <span className="hidden text-right sm:block">
                <span className="block text-[13px] font-medium">{isPatient ? patient.name : viewer.contact.name}</span>
                <span className="block text-xs text-muted-foreground">{isPatient ? patient.record : `Contacto de ${patient.firstName}`}</span>
              </span>
              <Avatar src={isPatient ? patient.photo : undefined} name={isPatient ? patient.name : viewer.contact.name} size={32} />
              <form action={signOutPortal}>
                <button type="submit" aria-label="Cerrar sesión" className="flex size-8 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground"><LogOut size={16} /></button>
              </form>
            </div>
          </div>
          <div className="pb-3"><PortalNav items={items} /></div>
        </div>
      </header>
      {!isPatient && (
        <div className="border-b border-border/60 bg-accent/60">
          <p className="mx-auto flex max-w-4xl items-start gap-2 px-5 py-3 text-[13px] leading-5 text-accent-foreground">
            <UserCheck size={16} className="mt-0.5 shrink-0" aria-hidden="true" />
            <span>
              Estás consultando el expediente de <b className="font-semibold">{patient.name}</b> como contacto autorizado ({viewer.contact.relationship}).
              Alcance: {accessScopes[viewer.contact.scope].label.toLowerCase()}. Solo lectura; cada consulta queda registrada.
            </span>
          </p>
        </div>
      )}
      <main className="mx-auto max-w-4xl px-5 pb-20 pt-10">{children}</main>
    </div>
  )
}
