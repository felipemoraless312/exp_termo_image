import type { LucideIcon } from 'lucide-react'
import { LayoutGrid, Ribbon, Stethoscope, UserPlus, Users } from 'lucide-react'

import { canAccess, type StaffArea, type StaffRole } from '@/modules/auth/permissions'

export type NavItem = { area: StaffArea; href: string; label: string; icon: LucideIcon }
export type NavGroup = { label: string; items: NavItem[] }

const groups: NavGroup[] = [
  {
    label: 'Expediente clínico',
    items: [
      { area: 'dashboard', href: '/sistema', label: 'Resumen', icon: LayoutGrid },
      { area: 'patients', href: '/sistema/pacientes', label: 'Pacientes', icon: Users },
      { area: 'patients.write', href: '/sistema/pacientes/nuevo', label: 'Nuevo paciente', icon: UserPlus },
      { area: 'consultations', href: '/sistema/consultas', label: 'Notas clínicas', icon: Stethoscope },
    ],
  },
  {
    label: 'Oncología',
    items: [
      { area: 'oncology', href: '/sistema/campana', label: 'Campaña de mama', icon: Ribbon },
    ],
  },
]

export function navigationFor(role: StaffRole): NavGroup[] {
  return groups
    .map((group) => ({ ...group, items: group.items.filter((item) => canAccess(role, item.area)) }))
    .filter((group) => group.items.length > 0)
}

/** Accesos de la barra inferior en móvil: los cuatro primeros permitidos ("Nuevo paciente" está en la lista de pacientes). */
export function mobileNavigationFor(role: StaffRole): NavItem[] {
  return navigationFor(role).flatMap((group) => group.items).filter((item) => item.area !== 'patients.write').slice(0, 4)
}

/** Activa la entrada más específica: "Nuevo paciente" no debe encender también "Pacientes". */
export function isActive(pathname: string, href: string, siblings: string[] = []) {
  if (href === '/sistema') return pathname === href
  const matches = pathname === href || pathname.startsWith(`${href}/`)
  return matches && !siblings.some((other) => other !== href && other.startsWith(`${href}/`) && (pathname === other || pathname.startsWith(`${other}/`)))
}

/**
 * Cookie con la preferencia de la barra lateral (plegada o no). Vive aquí y no en `staff-sidebar.tsx`:
 * una constante importada desde un módulo 'use client' llega al servidor como referencia, no como texto.
 */
export const SIDEBAR_COOKIE = 'md_sidebar'
