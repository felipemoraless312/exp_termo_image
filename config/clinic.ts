import { platform } from './platform'
import { site } from './site'

/**
 * Establecimiento que aparece en el sistema y en el encabezado de las notas (NOM-004-SSA3-2012:
 * nombre, domicilio y, si lo tiene, aviso de funcionamiento sanitario).
 * En este proyecto se usa solo la marca Medora y la sede de la campaña.
 */
export const clinic = {
  name: platform.name,
  shortName: platform.name,
  /** Aviso sanitario del establecimiento; vacío mientras no se tenga uno propio. */
  sanitaryNotice: '',
  address: {
    lines: [site.name],
  },
} as const

export type Clinic = typeof clinic
