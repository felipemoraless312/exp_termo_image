import type { CSSProperties } from 'react'

/** Atributos para que un elemento aparezca al hacer scroll, con retraso escalonado opcional. */
export function reveal(index = 0, variant: '' | 'scale' | 'left' | 'line' = '') {
  return { 'data-reveal': variant, style: { '--reveal-delay': `${Math.min(index, 8) * 80}ms` } as CSSProperties }
}
