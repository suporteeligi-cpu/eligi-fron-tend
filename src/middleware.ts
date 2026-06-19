import { NextRequest, NextResponse } from 'next/server'

// Rotas que só fazem sentido sem sessão
const PUBLIC_ONLY = ['/', '/login', '/register', '/forgot-password']

// Rotas que exigem sessão
const PROTECTED_PREFIX = '/dashboard'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Considera autenticado se tiver QUALQUER um dos dois tokens.
  // O accessToken dura 15min — pode estar expirado no reload.
  // O refreshToken dura 7 dias — o interceptor do axios renova
  // o accessToken automaticamente assim que a página carrega.
  const hasSession =
    !!request.cookies.get('accessToken')?.value ||
    !!request.cookies.get('refreshToken')?.value

  const isPublicOnly = PUBLIC_ONLY.includes(pathname)
  const isProtected  = pathname.startsWith(PROTECTED_PREFIX)

  // Roles que ficam travados na agenda
  const AGENDA_ONLY_ROLES = ['BASIC_STAFF', 'RECEPTIONIST']

  // Reautenticação forçada: o client detectou sessão morta e mandou pra cá.
  // Sem isto o cookie stale (httpOnly, o client não apaga) ricochetearia o
  // /login de volta pro /dashboard e prenderia o usuário.
  const isReauth = request.nextUrl.searchParams.get('reauth') === '1'

  // Logado tentando acessar rota pública (/, /login, /register)
  if (hasSession && isPublicOnly && !isReauth) {
    const userRole = request.cookies.get('userRole')?.value ?? ''
    const target = AGENDA_ONLY_ROLES.includes(userRole)
      ? '/dashboard/agenda'
      : '/dashboard'
    return NextResponse.redirect(new URL(target, request.url))
  }

  // BASIC_STAFF: só agenda e comissões próprias (server-side)
  const userRole = request.cookies.get('userRole')?.value ?? ''
  const BASIC_STAFF_ALLOWED = ['/dashboard/agenda', '/dashboard/financeiro/comissoes']
  if (hasSession && userRole === 'BASIC_STAFF' && isProtected &&
      !BASIC_STAFF_ALLOWED.some(r => pathname.startsWith(r))) {
    return NextResponse.redirect(new URL('/dashboard/agenda', request.url))
  }

  // Não logado tentando acessar rota protegida
  if (!hasSession && isProtected) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('next', pathname)
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon|icons|manifest|api/).*)',
  ],
}
