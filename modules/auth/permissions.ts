/**
 * Roles y permisos del personal. Este archivo no depende del servidor:
 * la UI lo usa para ocultar opciones y el servidor para autorizar (la fuente de verdad).
 *
 * Perfiles del personal: el médico consulta y modifica todo el expediente; enfermería registra signos vitales
 * y somatometría antes de la consulta, la llegada de las pacientes y sus notas de enfermería, y consulta el resto. El paciente y sus contactos
 * autorizados entran por el portal (ver `session.ts`) y solo leen.
 */
export const staffRoles = ['medico', 'enfermeria'] as const
export type StaffRole = (typeof staffRoles)[number]

export const staffRoleLabels: Record<StaffRole, string> = {
  medico: 'Médico',
  enfermeria: 'Enfermería',
}

export type StaffArea =
  | 'dashboard' | 'patients' | 'patients.write'
  | 'record' | 'record.write' | 'notes.medical' | 'notes.nursing' | 'prescribe' | 'studies.result'
  | 'consultations' | 'audit' | 'oncology' | 'oncology.write'
  /** Signos vitales y somatometría. */
  | 'vitals'
  /** Registrar llegada, inasistencia o regresar a pendiente una cita de campaña. */
  | 'campaign.checkin'

const doctor: readonly StaffRole[] = ['medico']
const clinical: readonly StaffRole[] = ['medico', 'enfermeria']

const areaPermissions: Record<StaffArea, readonly StaffRole[]> = {
  dashboard: clinical,
  patients: clinical,
  'patients.write': doctor,
  record: clinical,
  'record.write': doctor,
  'notes.medical': doctor,
  'notes.nursing': clinical,
  prescribe: doctor,
  'studies.result': doctor,
  consultations: clinical,
  audit: doctor,
  oncology: clinical,
  'oncology.write': doctor,
  vitals: clinical,
  'campaign.checkin': clinical,
}

export function isStaffRole(value: unknown): value is StaffRole {
  return typeof value === 'string' && (staffRoles as readonly string[]).includes(value)
}

export function canAccess(role: StaffRole, area: StaffArea): boolean {
  return areaPermissions[area].includes(role)
}
