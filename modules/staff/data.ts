import 'server-only'

import type { StaffRole } from '@/modules/auth/permissions'
import { verifyPassword } from '@/lib/server/password'
import { platform } from '@/config/platform'

export type StaffMember = { id: string; name: string; email: string; role: StaffRole; license?: string }

type StaffAccount = StaffMember & { passwordHash: string }

// DEMO: en la fase 2 se reemplaza por la tabla `users` (Better Auth) filtrada por clínica.
// Contraseñas de demostración (hash scrypt `salt:hash`): médico "medico2026", enfermería "enfermeria2026".
const staff: StaffAccount[] = [
  {
    id: 'u-medico', name: 'Dr. Francisco', email: `francisco@${platform.staffDomain}`, role: 'medico', license: 'Céd. prof. 1234567 · Esp. 7654321',
    passwordHash: '8b7b8249c5676811462000c91ac3c7b8:e856b53be3343fa134ca587b6f6cd41d221a47c4c13ea7d069cf435da63fa3f3',
  },
  // Enfermería de prueba. Contraseña: "enfermeria2026". Cambiar el nombre por el de la enfermera real y su cédula.
  {
    id: 'u-enfermeria', name: 'Enfermería UP Chiapas', email: `enfermeria@${platform.staffDomain}`, role: 'enfermeria',
    passwordHash: '6f227b6fbba9df0c465930a79044ce3b:e7247fc11e1f2614d1bb1efd5e99cc54bf015438c14393853298da4042e8b9e8',
  },
]

function publicFields(account: StaffAccount): StaffMember {
  const { id, name, email, role, license } = account
  return { id, name, email, role, license }
}

export async function findStaffById(id: string): Promise<StaffMember | undefined> {
  const account = staff.find((member) => member.id === id)
  return account && publicFields(account)
}

/** Devuelve la cuenta solo si el correo y la contraseña coinciden. */
export async function verifyStaffCredentials(email: string, password: string): Promise<StaffMember | undefined> {
  const account = staff.find((member) => member.email.toLowerCase() === email.trim().toLowerCase())
  if (!account || !verifyPassword(password, account.passwordHash)) return undefined
  return publicFields(account)
}
