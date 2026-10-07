/*
 * Acceso asistido: el paciente autoriza a un contacto de confianza (p. ej. su contacto de emergencia)
 * para consultar su expediente desde el portal, con un código de acceso personal.
 * La autorización se puede revocar en cualquier momento y cada consulta queda en la bitácora.
 */

export type AccessScope = 'emergencia' | 'completo'

export const accessScopes: Record<AccessScope, { label: string; description: string }> = {
  emergencia: {
    label: 'Información de emergencia',
    description: 'Datos de identificación, alergias, grupo sanguíneo, diagnósticos activos, tratamiento y dispositivos implantados.',
  },
  completo: {
    label: 'Expediente completo',
    description: 'Todo lo anterior, más consultas, estudios liberados y documentos. Solo lectura.',
  },
}
export const accessScopeKeys = Object.keys(accessScopes) as AccessScope[]

export const relationships = ['Cónyuge', 'Padre o madre', 'Hijo o hija', 'Hermano o hermana', 'Tutor legal', 'Otro'] as const

export interface AuthorizedContact {
  id: string
  patientId: string
  name: string
  relationship: string
  phone: string
  scope: AccessScope
  /** SHA-256 del código; el código en claro solo se muestra al paciente una vez. */
  codeHash: string
  createdAt: string
  revokedAt?: string
  lastAccessAt?: string
}
