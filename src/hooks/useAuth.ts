'use client'
import { useEffect, useState, useCallback } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import {
  loginRequest,
  registerRequest,
  getMe,
  googleLoginRequest,
  logoutRequest,
  refreshRequest, // @eligi:auth-import-refresh
} from '@/lib/auth.api'
import { AuthUser } from '@/types/auth.types'

type Role = 'BUSINESS_OWNER' | 'AFFILIATE'

// Rotas que não precisam de autenticação
const PUBLIC_ROUTES = ['/login', '/register', '/forgot-password', '/reset-password', '/']

export function useAuth() {
  const router   = useRouter()
  const pathname = usePathname()

  const [user,    setUser]    = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [authError, setAuthError] = useState<'expired' | 'offline' | null>(null)

  const refetchUser = useCallback(async (): Promise<AuthUser> => {
    const me: AuthUser = await getMe()
    setUser(me)
    return me
  }, [])

  useEffect(() => {
    let cancelled = false

    async function loadUser() {
      // Rota pública: não carrega usuário (evita loop refresh → redirect).
      const isPublic = PUBLIC_ROUTES.some(r => pathname === r || pathname?.startsWith('/onboarding'))
      if (isPublic) {
        if (!cancelled) setLoading(false)
        return
      }

      const MAX_TRIES = 4
      const sleep = (ms: number) => new Promise<void>(res => setTimeout(res, ms))

      for (let attempt = 1; attempt <= MAX_TRIES; attempt++) {
        if (cancelled) return

        try {
          const me = await getMe()
          if (cancelled) return
          setUser(me)
          setAuthError(null)
          setLoading(false)
          return
        } catch (err) {
          if (cancelled) return

          const status = (err as { response?: { status?: number } })?.response?.status

          // @eligi:auth-comentario-4xx
          // 4xx numa rota protegida. 401 tem tratamento proprio logo abaixo
          // (precisa de prova). Os demais 4xx nao sao recuperaveis aqui.
          // @eligi:auth-401-prova-refresh
          // 401 NAO prova sessao morta. apiClient e lib/api sao duas
          // instancias axios com filas de refresh independentes, entao
          // um 401 pode ser so a corrida entre elas (visto em producao:
          // dois /auth/refresh 200 em 195ms). Prova decisiva: pedir o
          // refresh aqui. 200 = a Session esta viva -> re-tenta o getMe.
          if (status === 401) {
            let sessionAlive = false
            try {
              await refreshRequest()
              sessionAlive = true
            } catch {
              sessionAlive = false
            }
            if (cancelled) return

            if (sessionAlive && attempt < MAX_TRIES) {
              continue
            }

            setUser(null)
            setAuthError('expired')
            setLoading(false)
            if (typeof window !== 'undefined') window.location.href = '/login?reauth=1'
            return
          }

          if (status != null && status >= 400 && status < 500) {
            setUser(null)
            setAuthError('expired')
            setLoading(false)
            // @eligi:auth-comentario-reauth
            // hard nav com ?reauth=1: o middleware libera o /login mesmo com o
            // cookie stale presente, e o login refaz os cookies por cima.
            // @eligi:auth-sem-logout-automatico
            // NUNCA chamar logoutRequest() aqui. AuthService.logout grava
            // revokedAt na Session: o refreshToken de 7 dias, ainda valido,
            // passa a bater em SESSION_INVALID 401 para sempre. Era isto que
            // transformava um 4xx de 200ms em reautenticacao permanente.
            // Sessao morta se prova pelo /auth/refresh, nao se fabrica.
            if (typeof window !== 'undefined') window.location.href = '/login?reauth=1'
            return
          }

          // 5xx ou sem resposta (rede / CORS / cold start do Railway): pode ser
          // transitório com sessão ainda viva → espera e re-tenta.
          if (attempt < MAX_TRIES) {
            await sleep(attempt * 500)
            continue
          }

          // Esgotou: backend indisponível. NÃO desloga (sessão pode estar viva)
          // e NÃO redireciona — estado offline pro usuário re-tentar / sair.
          setUser(null)
          setAuthError('offline')
          setLoading(false)
          return
        }
      }
    }

    void loadUser()
    return () => { cancelled = true }
  }, [pathname, router])

  function redirectByRole(me: AuthUser) {
    if (me.role === 'BUSINESS_OWNER' && !me.onboardingDone) {
      router.push('/onboarding')
    } else {
      router.push('/dashboard')
    }
  }

  async function login(email: string, password: string) {
    await loginRequest(email, password)
    const me = await refetchUser()
    redirectByRole(me)
  }

  async function register(name: string, email: string, password: string, role: Role) {
    await registerRequest(name, email, password, role)
    const me = await refetchUser()
    redirectByRole(me)
  }

  async function loginWithGoogle(idToken: string, mode: 'login' | 'register') {
    await googleLoginRequest(idToken, mode)
    const me = await refetchUser()
    redirectByRole(me)
  }

  async function logout() {
    try { await logoutRequest() } catch { /* best-effort */ }
    setUser(null)
    router.replace('/login')
  }

  return { user, loading, authError, login, register, loginWithGoogle, logout, refetchUser }
}