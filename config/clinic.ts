import { platform } from './platform'

/**
 * Establecimiento que aparece en el encabezado de las notas (NOM-004-SSA3-2012:
 * nombre, domicilio y, si lo tiene, aviso de funcionamiento sanitario).
 */
export const clinic = {
  name: platform.fullName,
  shortName: platform.name,
  /** Aviso sanitario del establecimiento; vacío mientras no se tenga uno. */
  sanitaryNotice: '',
  /** Domicilio para el encabezado de las notas; vacío mientras no se defina. */
  address: { lines: [] as string[] },
} as const

export type Clinic = typeof clinic
