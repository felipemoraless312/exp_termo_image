import Link from 'next/link'

import { PlatformLogo } from '@/components/brand/logo'
import { platform } from '@/config/platform'

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-background">
      <div className="mx-auto grid max-w-6xl gap-10 px-5 py-12 text-[13px] text-muted-foreground sm:grid-cols-2 lg:grid-cols-4">
        <div className="lg:col-span-2">
          <PlatformLogo className="text-foreground" caption={platform.tagline} />
          <p className="mt-4 max-w-sm leading-6">{platform.description}</p>
        </div>
        <div>
          <h2 className="font-medium text-foreground">Conoce el programa</h2>
          <ul className="mt-3 space-y-2">
            <li><Link href="/#que-es" className="hover:text-foreground">¿Qué es un expediente electrónico?</Link></li>
            <li><Link href="/#contenido" className="hover:text-foreground">Qué contiene</Link></li>
            <li><Link href="/#seguridad" className="hover:text-foreground">Privacidad y seguridad</Link></li>
          </ul>
        </div>
        <div>
          <h2 className="font-medium text-foreground">Accesos</h2>
          <ul className="mt-3 space-y-2">
            <li><Link href="/portal" className="hover:text-foreground">Portal del paciente</Link></li>
            <li><Link href="/portal/login" className="hover:text-foreground">Contacto autorizado</Link></li>
            <li><Link href="/sistema/login" className="hover:text-foreground">Acceso médico</Link></li>
          </ul>
        </div>
      </div>
      <div className="mx-auto flex max-w-6xl flex-wrap justify-between gap-2 border-t border-separator px-5 py-5 text-xs text-subtle">
        <p>© {new Date().getFullYear()} {platform.name} · {platform.tagline}</p>
        <p>Entorno de demostración · datos ficticios</p>
      </div>
    </footer>
  )
}
