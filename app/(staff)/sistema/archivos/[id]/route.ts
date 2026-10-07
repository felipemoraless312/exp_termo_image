import { apiRaw } from '@/lib/server/api'
import { canAccess } from '@/modules/auth/permissions'
import { getStaffSession } from '@/modules/auth/session'

/** Imágenes del expediente (p. ej. termografías). Solo el personal con sesión; la API nunca se expone al navegador. */
export async function GET(_: Request, { params }: RouteContext<'/sistema/archivos/[id]'>) {
  const user = await getStaffSession()
  if (!user || !canAccess(user.role, 'record')) return new Response('No autorizado', { status: 401 })

  const { id } = await params
  const upstream = await apiRaw(`/archivos/${encodeURIComponent(id)}`).catch(() => undefined)
  if (!upstream?.ok || !upstream.body) return new Response('Archivo no encontrado', { status: upstream?.status === 404 ? 404 : 502 })

  return new Response(upstream.body, {
    headers: {
      'Content-Type': upstream.headers.get('Content-Type') ?? 'application/octet-stream',
      'Content-Disposition': upstream.headers.get('Content-Disposition') ?? 'inline',
      'Cache-Control': 'private, no-store',
      'X-Content-Type-Options': 'nosniff',
    },
  })
}
