/** Escala "bonita" para ejes: máximo redondeado y 4–5 marcas (0, 5, 10, 15…). */
export function niceScale(maxValue: number, targetTicks = 4) {
  const max = Math.max(1, maxValue)
  const rough = max / targetTicks
  const power = 10 ** Math.floor(Math.log10(rough))
  const step = [1, 2, 2.5, 5, 10].map((m) => m * power).find((s) => s >= rough) ?? 10 * power
  const top = Math.ceil(max / step) * step
  return { max: top, ticks: Array.from({ length: Math.round(top / step) + 1 }, (_, i) => Math.round(i * step * 100) / 100) }
}

/** Compacta cifras grandes: 1,284 · 12.9 mil · 4.2 M. */
export function compact(value: number) {
  return new Intl.NumberFormat('es-MX', { notation: 'compact', maximumFractionDigits: 1 }).format(value)
}

export type Series = { key: string; name: string; color: string }
