import 'server-only'

/*
 * Cliente de la API del expediente (FastAPI en `api/`). Solo lo usa el servidor de Next.js:
 * la clave viaja en `X-API-Key` y la API escucha únicamente en 127.0.0.1.
 */

const baseUrl = process.env.MEDORA_API_URL ?? 'http://127.0.0.1:8000'

export class ApiError extends Error {
  constructor(message: string, readonly status: number) {
    super(message)
  }
}

type Options = { method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'; body?: unknown; form?: FormData }

async function send(path: string, { method = 'GET', body, form }: Options = {}): Promise<Response> {
  const key = process.env.MEDORA_API_KEY
  if (!key) throw new Error('Falta MEDORA_API_KEY en .env.local.')
  const headers: Record<string, string> = { 'X-API-Key': key }
  if (body !== undefined) headers['Content-Type'] = 'application/json'
  try {
    return await fetch(`${baseUrl}${path}`, { method, headers, body: form ?? (body !== undefined ? JSON.stringify(body) : undefined), cache: 'no-store' })
  } catch {
    throw new ApiError('No hay conexión con la API del expediente. Inicia el servidor con `npm run api`.', 0)
  }
}

async function errorFrom(response: Response): Promise<ApiError> {
  const payload = await response.json().catch(() => undefined) as { detail?: unknown } | undefined
  const detail = payload?.detail
  const message = typeof detail === 'string' ? detail
    : Array.isArray(detail) ? `Datos no válidos: ${detail.map((d: { loc?: unknown[]; msg?: string }) => `${(d.loc ?? []).slice(1).join('.')} ${d.msg ?? ''}`.trim()).join('; ')}`
      : `Error ${response.status} de la API`
  return new ApiError(message, response.status)
}

export async function api<T>(path: string, options?: Options): Promise<T> {
  const response = await send(path, options)
  if (!response.ok) throw await errorFrom(response)
  return response.json() as Promise<T>
}

/** Igual que `api`, pero devuelve `undefined` si el recurso no existe (404). */
export async function apiMaybe<T>(path: string, options?: Options): Promise<T | undefined> {
  const response = await send(path, options)
  if (response.status === 404) return undefined
  if (!response.ok) throw await errorFrom(response)
  return response.json() as Promise<T>
}

/** Respuesta cruda (p. ej. imágenes) para reenviarla tal cual al navegador. */
export async function apiRaw(path: string): Promise<Response> {
  return send(path)
}
