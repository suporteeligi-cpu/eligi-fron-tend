'use client'
import { useEffect, useState, useCallback } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import {
  loginRequest,
  registerRequest,
  getMe,
  googleLoginRequest,
  logoutRequest,
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

          // 401 = o interceptor já tentou o refresh e ele falhou → sessão morta.
          if (status === 401) {
            setUser(null)
            setAuthError('expired')
            setLoading(false)
            // O middleware checa PRESENÇA do cookie; sem limpar, o /login
            // ricochetearia pro /dashboard. Hard nav garante releitura do
            // cookie já expirado.
            try { await logoutRequest() } catch { /* best-effort */ }
            if (typeof window !== 'undefined') window.location.href = '/login'
            return
          }

          // Transitório (rede / 5xx / cold start do Railway): espera e re-tenta.
          if (attempt < MAX_TRIES) {
            await sleep(attempt * 500)
            continue
          }

          // Esgotou: backend indisponível. NÃO desloga (sessão pode estar
          // viva) e NÃO redireciona — estado offline pro usuário re-tentar.
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