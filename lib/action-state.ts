/** Resultado de una Server Action de formulario. Lo comparten el servidor y `ActionForm`. */
export type ActionState =
  | { ok: true; message?: string }
  | { ok: false; error: string; /** Pide confirmación explícita (p. ej. alerta de alergia) antes de reintentar. */ confirm?: string }
  | undefined
