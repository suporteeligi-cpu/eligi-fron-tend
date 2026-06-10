import { NextRequest, NextResponse } from 'next/server'

// Rotas que só fazem sentido sem sessão
const PUBLIC_ONLY = ['/', '/login', '/register', '/forgot-password']

// Rotas que exigem sessão
const PROTECTED_PREFIX = '/dashboard'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Lê o accessToken do cookie (httpOnly — só acessível server-side)
  const token = request.cookies.get('accessToken')?.value

  const isPublicOnly  = PUBLIC_ONLY.includes(pathname)
  const isProtected   = pathname.startsWith(PROTECTED_PREFIX)

  // Logado tentando acessar rota pública (/, /login, /register)
  if (token && isPublicOnly) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  // Não logado tentando acessar rota protegida
  if (!token && isProtected) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('next', pathname)
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Roda em todas as rotas EXCETO:
     * - _next/static (arquivos estáticos)
     * - _next/image  (otimização de imagem)
     * - favicon, ícones, manifesto
     * - rotas de API internas
     */
    '/((?!_next/static|_next/image|favicon|icons|manifest|api/).*)',
  ],
}
