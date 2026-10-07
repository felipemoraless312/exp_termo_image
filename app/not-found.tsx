import Link from 'next/link'

import { buttonVariants } from '@/components/ui/button'

export default function NotFound() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center px-6 text-center">
      <p className="text-eyebrow">Error 404</p>
      <h1 className="mt-2 text-title-1">Esta página no existe.</h1>
      <p className="mt-3 max-w-sm text-muted-foreground">Revisa la dirección o vuelve al inicio.</p>
      <Link href="/" className={buttonVariants({ className: 'mt-8' })}>Ir al inicio</Link>
    </main>
  )
}
