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

  // Logado tentando acessar rota pública (/, /login, /register)
  if (hasSession && isPublicOnly) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
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
