import type { Metadata } from 'next'

import { RevealObserver } from '@/components/motion/reveal'
import { RevealBootstrap } from '@/components/motion/reveal-bootstrap'
import { platform } from '@/config/platform'
import { SiteFooter } from './_components/site-footer'
import { SiteHeader } from './_components/site-header'

export const metadata: Metadata = {
  // `absolute`: el sitio público no hereda la plantilla de títulos de la plataforma.
  title: { absolute: `${platform.name} | ${platform.tagline}`, template: `%s · ${platform.name}` },
  description: platform.description,
}

export default function PublicLayout({ children }: LayoutProps<'/'>) {
  return (
    <>
      <RevealBootstrap />
      <SiteHeader />
      <main>{children}</main>
      <SiteFooter />
      <RevealObserver />
    </>
  )
}
