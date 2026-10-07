/**
 * Roles y permisos del personal. Este archivo no depende del servidor:
 * la UI lo usa para ocultar opciones y el servidor para autorizar (la fuente de verdad).
 *
 * Alcance actual: expediente clínico electrónico. El único perfil del personal es el médico,
 * que consulta y modifica los expedientes de todos sus pacientes. El paciente y sus contactos
 * autorizados entran por el portal (ver `session.ts`) y solo leen.
 */
export const staffRoles = ['medico'] as const
export type StaffRole = (typeof staffRoles)[number]

export const staffRoleLabels: Record<StaffRole, string> = {
  medico: 'Médico',
}

export type StaffArea =
  | 'dashboard' | 'patients' | 'patients.write'
  | 'record' | 'record.write' | 'notes.medical' | 'notes.nursing' | 'prescribe' | 'studies.result'
  | 'consultations' | 'audit' | 'oncology' | 'oncology.write'

const doctor: readonly StaffRole[] = ['medico']

const areaPermissions: Record<StaffArea, readonly StaffRole[]> = {
  dashboard: doctor,
  patients: doctor,
  'patients.write': doctor,
  record: doctor,
  'record.write': doctor,
  'notes.medical': doctor,
  'notes.nursing': doctor,
  prescribe: doctor,
  'studies.result': doctor,
  consultations: doctor,
  audit: doctor,
  oncology: doctor,
  'oncology.write': doctor,
}

export function isStaffRole(value: unknown): value is StaffRole {
  return typeof value === 'string' && (staffRoles as readonly string[]).includes(value)
}

export function canAccess(role: StaffRole, area: StaffArea): boolean {
  return areaPermissions[area].includes(role)
}
