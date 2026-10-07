import { site } from '@/config/site'
import { formatDateTime } from '@/lib/format'

/** Quién, cuándo y dónde se capturó un registro. Todo registro nuevo del expediente lleva uno. */
export type Stamp = { at: string; by: string; location: string }

export function stampFor(by: string, at = new Date()): Stamp {
  return { at: at.toISOString(), by, location: site.name }
}

/** "7 oct 2026, 10:32 · Dr. Francisco Ramos · Universidad Politécnica de Chiapas" */
export function formatStamp(stamp?: Stamp, verb = 'Registró'): string | undefined {
  return stamp ? `${verb} ${stamp.by} · ${formatDateTime(stamp.at)} · ${stamp.location}` : undefined
}
