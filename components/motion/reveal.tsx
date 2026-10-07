'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'

/**
 * Marca con `data-revealed` los elementos `[data-reveal]` cuando entran en pantalla;
 * el CSS de `globals.css` hace la animación. Un solo observador para toda la página.
 */
export function RevealObserver() {
  const pathname = usePathname()

  useEffect(() => {
    const root = document.documentElement
    root.classList.add('reveal-on')
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue
          entry.target.setAttribute('data-revealed', '')
          observer.unobserve(entry.target)
        }
      },
      { rootMargin: '0px 0px -8% 0px', threshold: 0.12 },
    )
    document.querySelectorAll('[data-reveal]:not([data-revealed])').forEach((el) => observer.observe(el))
    return () => observer.disconnect()
  }, [pathname])

  return null
}
