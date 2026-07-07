import { NextRequest, NextResponse } from 'next/server'
import { resolveAccessRedirect } from '@/app/components/navigation/routeAccess'

// Rotas que só fazem sentido sem sessão
const PUBLIC_ONLY = ['/', '/login', '/register', '/forgot-password']

// Rotas que exigem sessão
const PROTECTED_PREFIX = '/dashboard'

// Cargos que caem direto na agenda ao acessar rota pública logado
const AGENDA_ONLY_ROLES = ['BASIC_STAFF', 'RECEPTIONIST']

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Considera autenticado se tiver QUALQUER um dos dois tokens.
  // accessToken dura 15min (pode estar expirado no reload); refreshToken dura 7d
  // e o interceptor do axios renova o accessToken assim que a página carrega.
  const hasSession =
    !!request.cookies.get('accessToken')?.value ||
    !!request.cookies.get('refreshToken')?.value

  const userRole = request.cookies.get('userRole')?.value ?? ''
  const isPublicOnly = PUBLIC_ONLY.includes(pathname)
  const isProtected = pathname.startsWith(PROTECTED_PREFIX)

  // Reautenticação forçada: o client detectou sessão morta e mandou pra cá.
  // Sem isto o cookie stale (httpOnly, o client não apaga) ricochetearia o
  // /login de volta pro /dashboard e prenderia o usuário.
  const isReauth = request.nextUrl.searchParams.get('reauth') === '1'

  // Logado tentando acessar rota pública (/, /login, /register)
  if (hasSession && isPublicOnly && !isReauth) {
    const target = AGENDA_ONLY_ROLES.includes(userRole)
      ? '/dashboard/agenda'
      : '/dashboard'
    return NextResponse.redirect(new URL(target, request.url))
  }

  // Não logado tentando acessar rota protegida
  if (!hasSession && isProtected) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('next', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Autorização por cargo (SSOT em routeAccess). Cobre TODOS os cargos.
  // Fail-open pro cargo desconhecido/cookie vazio: o backend é a fronteira real
  // e o error boundary cobre o 403 que escapar (evita travar sessão legítima).
  if (hasSession && isProtected) {
    const redirect = resolveAccessRedirect(userRole, pathname)
    if (redirect) {
      return NextResponse.redirect(new URL(redirect, request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon|icons|manifest|api/).*)',
  ],
}
