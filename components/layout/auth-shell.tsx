import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'

import { PlatformLogo } from '@/components/brand/logo'

/** Pantalla centrada para inicio de sesión y avisos de acceso. */
export function AuthShell({ caption, title, description, children, footer }: {
  caption: string
  title: string
  description?: string
  children: React.ReactNode
  footer?: React.ReactNode
}) {
  return (
    <main className="flex min-h-dvh flex-col px-5 py-6">
      <Link href="/" className="inline-flex items-center gap-1 self-start rounded-full py-1 pr-3 text-[13px] text-muted-foreground transition-colors hover:text-foreground">
        <ChevronLeft size={16} aria-hidden="true" /> Inicio
      </Link>
      <div className="flex flex-1 items-center justify-center py-10">
        <div className="animate-rise w-full max-w-sm">
          <PlatformLogo caption={caption} />
          <h1 className="mt-10 text-title-2">{title}</h1>
          {description && <p className="mt-2 text-[15px] leading-6 text-muted-foreground">{description}</p>}
          <div className="mt-8">{children}</div>
          {footer && <div className="mt-8 text-center text-[13px] text-subtle">{footer}</div>}
        </div>
      </div>
    </main>
  )
}
