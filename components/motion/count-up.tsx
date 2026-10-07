'use client'

import { useEffect, useRef } from 'react'

/**
 * Cifra que cuenta desde cero cuando aparece en pantalla ("45+" → 0…45+).
 * El servidor renderiza el valor final, así que sin JavaScript se ve correcto.
 */
export function CountUp({ value, duration = 1400 }: { value: string; duration?: number }) {
  const ref = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    const el = ref.current
    const match = value.match(/^(\d+)(.*)$/)
    if (!el || !match || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const target = Number(match[1])
    const suffix = match[2]
    let frame = 0

    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return
      observer.disconnect()
      const start = performance.now()
      const tick = (now: number) => {
        const t = Math.min(1, (now - start) / duration)
        const eased = 1 - (1 - t) ** 3
        el.textContent = `${Math.round(target * eased)}${suffix}`
        if (t < 1) frame = requestAnimationFrame(tick)
      }
      el.textContent = `0${suffix}`
      frame = requestAnimationFrame(tick)
    }, { threshold: 0.6 })

    observer.observe(el)
    return () => {
      observer.disconnect()
      cancelAnimationFrame(frame)
    }
  }, [value, duration])

  return <span ref={ref}>{value}</span>
}
