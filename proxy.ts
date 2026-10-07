import { NextResponse, type NextRequest } from 'next/server'

/*
 * Comprobación optimista: si no hay cookie de sesión, redirige al login sin renderizar.
 * No autoriza nada; la verificación real ocurre en el servidor (modules/auth/session.ts).
 * Los nombres de cookie se repiten aquí porque proxy no debe importar módulos `server-only`.
 * El portal lo usan el paciente (`md_patient`) y sus contactos autorizados (`md_contact`).
 */
const surfaces = [
  { prefix: '/sistema', cookies: ['md_staff'], login: '/?acceso=medico', open: ['/sistema/login'] },
  { prefix: '/portal', cookies: ['md_patient', 'md_contact'], login: '/', open: ['/portal/login'] },
]

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  const surface = surfaces.find((s) => pathname === s.prefix || pathname.startsWith(`${s.prefix}/`))
  if (!surface || surface.open.includes(pathname)) return NextResponse.next()

  if (!surface.cookies.some((name) => request.cookies.has(name))) {
    return NextResponse.redirect(new URL(surface.login, request.url))
  }
  return NextResponse.next()
}

export const config = {
  matcher: ['/sistema/:path*', '/portal/:path*'],
}
