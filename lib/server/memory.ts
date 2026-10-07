import 'server-only'

import { randomUUID } from 'node:crypto'

/*
 * Almacenamiento en memoria del proceso para la demo.
 * Se guarda en `globalThis` para sobrevivir a la recarga en caliente de `next dev`;
 * los datos se reinician al detener el servidor. En la fase 2 cada repositorio
 * sustituye estas colecciones por tablas de Postgres sin cambiar sus funciones públicas.
 */
const store = ((globalThis as { __medoraStore?: Map<string, unknown> }).__medoraStore ??= new Map())

export function collection<T>(key: string, seed: () => T): T {
  if (!store.has(key)) store.set(key, seed())
  return store.get(key) as T
}

export function newId(prefix: string) {
  return `${prefix}-${randomUUID().slice(0, 8)}`
}

/** Folio consecutivo legible (`OT-0012`) por tipo de documento. */
export function nextFolio(prefix: string, width = 4) {
  const counters = collection('folios', () => new Map<string, number>())
  const next = (counters.get(prefix) ?? 0) + 1
  counters.set(prefix, next)
  return `${prefix}-${String(next).padStart(width, '0')}`
}

/** Ajusta el contador para que los folios nuevos no choquen con los datos sembrados. */
export function seedFolio(prefix: string, last: number) {
  const counters = collection('folios', () => new Map<string, number>())
  counters.set(prefix, Math.max(counters.get(prefix) ?? 0, last))
}
