import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

/**
 * Next.js middleware za zaštitu ruta koje zahtevaju autentifikaciju.
 *
 * Proverava da li postoji `refresh_token` cookie — ako ne postoji,
 * korisnik nije ulogovan i redirect-uje se na /login.
 *
 * Napomena: Ovo ne može da proveri korisnikovu ulogu (ADMIN vs STANDARD)
 * jer je refresh_token httpOnly i potpisan na backendu. Admin provera
 * ostaje na komponentnom nivou.
 */
export function middleware(request: NextRequest) {
  const refreshToken = request.cookies.get('refresh_token')

  if (!refreshToken) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('redirect', request.nextUrl.pathname)
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/judge/:path*',
    '/my-registrations/:path*',
    '/favorites/:path*',
    '/training/new',
    '/training/:eventId/edit',
  ],
}
