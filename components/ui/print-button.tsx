'use client'

import { Printer } from 'lucide-react'

import { buttonVariants } from './button'

export function PrintButton({ label = 'Imprimir' }: { label?: string }) {
  return (
    <button type="button" onClick={() => window.print()} className={buttonVariants({ variant: 'secondary', size: 'sm' })}>
      <Printer /> {label}
    </button>
  )
}
