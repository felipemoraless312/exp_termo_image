import 'server-only'

import { createHash, randomBytes, scryptSync, timingSafeEqual } from 'node:crypto'

/** Hash de contraseña con scrypt en formato `salt:hash` (hex). */
export function hashPassword(password: string, salt = randomBytes(16).toString('hex')): string {
  return `${salt}:${scryptSync(password, salt, 32).toString('hex')}`
}

export function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(':')
  if (!salt || !hash || !/^[0-9a-f]{64}$/.test(hash)) return false
  const candidate = scryptSync(password, salt, 32)
  return timingSafeEqual(candidate, Buffer.from(hash, 'hex'))
}

/** Huella de un código de acceso. Los códigos son aleatorios y largos, así que basta SHA-256. */
export function hashCode(code: string): string {
  return createHash('sha256').update(normalizeCode(code)).digest('hex')
}

/** Ignora mayúsculas, espacios y guiones: "k7p4 m2qx" equivale a "K7P4-M2QX". */
export function normalizeCode(code: string): string {
  return code.toUpperCase().replace(/[^A-Z0-9]/g, '')
}

// Sin 0/O ni 1/I/L para que el código se pueda dictar por teléfono sin confusiones.
const alphabet = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'

/** Código de acceso legible de 8 caracteres en dos bloques: `K7P4-M2QX`. */
export function generateAccessCode(): string {
  const bytes = randomBytes(8)
  const chars = Array.from(bytes, (byte) => alphabet[byte % alphabet.length]).join('')
  return `${chars.slice(0, 4)}-${chars.slice(4)}`
}
