import 'server-only'

import { api } from '@/lib/server/api'

/*
 * Bitácora de auditoría (NOM-024-SSA3-2012): quién consultó o modificó qué y cuándo.
 * Solo se agregan eventos, nunca se editan ni se borran.
 * Se guarda en la API del expediente, en una tabla de solo inserción con sello de tiempo del servidor.
 */

export type AuditAction = 'consulta' | 'acceso' | 'alta' | 'modificacion' | 'firma' | 'cancelacion'

export const auditActionLabels: Record<AuditAction, string> = {
  consulta: 'Consulta',
  acceso: 'Acceso',
  alta: 'Alta',
  modificacion: 'Modificación',
  firma: 'Firma',
  cancelacion: 'Cancelación',
}

/** Quién realiza la acción: el médico, el paciente, un contacto autorizado o un proceso del sistema (p. ej. importación). */
export type AuditActor = { id: string; name: string; role: 'medico' | 'paciente' | 'contacto' | 'sistema' }

export const auditRoleLabels: Record<AuditActor['role'], string> = {
  medico: 'Médico',
  paciente: 'Paciente',
  contacto: 'Contacto autorizado',
  sistema: 'Sistema',
}

export type AuditEvent = {
  id: string
  at: string
  actorId: string
  actorName: string
  actorRole: AuditActor['role']
  action: AuditAction
  entity: string
  entityId: string
  summary: string
}

/** Registra el evento sin detener la acción; si la API no responde, queda constancia en el log del servidor. */
export function audit(actor: AuditActor, action: AuditAction, entity: string, entityId: string, summary: string) {
  const event = { actor: { id: actor.id, name: actor.name, role: actor.role }, action, entity, entityId, summary }
  api('/bitacora', { method: 'POST', body: event }).catch((error) => console.error('No se pudo registrar en la bitácora', event, error))
}

export async function readAuditEvents(filter: { entityId?: string; limit?: number } = {}): Promise<AuditEvent[]> {
  const params = new URLSearchParams({ limit: String(filter.limit ?? 200) })
  if (filter.entityId) params.set('entityId', filter.entityId)
  return api<AuditEvent[]>(`/bitacora?${params}`)
}
