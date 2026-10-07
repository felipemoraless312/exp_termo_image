import 'server-only'

import type { ActionState } from '@/lib/action-state'
import { ApiError } from './api'

class ValidationError extends Error {
  constructor(message: string, readonly confirm?: string) {
    super(message)
  }
}

/** Corta la acción con un mensaje para el usuario. */
export function reject(message: string, confirm?: string): never {
  throw new ValidationError(message, confirm)
}

const isoDate = /^\d{4}-\d{2}-\d{2}$/

/** Lectura validada de `FormData`. Cada método lanza un error legible si el dato no es válido. */
export class FormFields {
  constructor(private readonly data: FormData) {}

  optional(key: string, max = 2000): string | undefined {
    const value = String(this.data.get(key) ?? '').trim()
    if (value.length > max) reject(`El campo excede ${max} caracteres.`)
    return value || undefined
  }

  text(key: string, label: string, max = 2000): string {
    return this.optional(key, max) ?? reject(`${label} es obligatorio.`)
  }

  number(key: string, label: string, { min, max, required = false }: { min?: number; max?: number; required?: boolean } = {}): number | undefined {
    const raw = this.optional(key)
    if (raw === undefined) return required ? reject(`${label} es obligatorio.`) : undefined
    const value = Number(raw.replace(',', '.'))
    if (!Number.isFinite(value)) reject(`${label} debe ser un número.`)
    if (min !== undefined && value < min) reject(`${label} debe ser mayor o igual a ${min}.`)
    if (max !== undefined && value > max) reject(`${label} debe ser menor o igual a ${max}.`)
    return value
  }

  requiredNumber(key: string, label: string, range: { min?: number; max?: number } = {}): number {
    return this.number(key, label, { ...range, required: true })!
  }

  date(key: string, label: string): string | undefined {
    const value = this.optional(key)
    if (value && !isoDate.test(value)) reject(`${label} no es una fecha válida.`)
    return value
  }

  requiredDate(key: string, label: string): string {
    return this.date(key, label) ?? reject(`${label} es obligatorio.`)
  }

  choice<T extends string>(key: string, label: string, options: readonly T[]): T {
    const value = this.optional(key)
    if (!value || !(options as readonly string[]).includes(value)) reject(`Selecciona ${label.toLowerCase()}.`)
    return value as T
  }

  optionalChoice<T extends string>(key: string, options: readonly T[]): T | undefined {
    const value = this.optional(key)
    return value && (options as readonly string[]).includes(value) ? (value as T) : undefined
  }

  bool(key: string): boolean {
    const value = this.data.get(key)
    return value === 'on' || value === 'true' || value === '1'
  }

  list(key: string): string[] {
    return this.data.getAll(key).map((value) => String(value).trim()).filter(Boolean)
  }
}

/** Ejecuta el cuerpo de una acción y traduce los errores de validación a `ActionState`. */
export async function runAction(formData: FormData, handler: (form: FormFields) => Promise<ActionState | void>): Promise<ActionState> {
  try {
    return (await handler(new FormFields(formData))) ?? { ok: true }
  } catch (error) {
    if (error instanceof ValidationError) return { ok: false, error: error.message, confirm: error.confirm }
    if (error instanceof ApiError) return { ok: false, error: error.message }
    throw error // redirect(), notFound() y errores inesperados siguen su curso normal
  }
}
