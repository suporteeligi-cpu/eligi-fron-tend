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

  const refetchUser = useCallback(async (): Promise<AuthUser> => {
    const me: AuthUser = await getMe()
    setUser(me)
    return me
  }, [])

  useEffect(() => {
    let cancelled = false

    // Se já está em rota pública, não tenta carregar o usuário
    // para evitar o loop de refresh → redirect
    const isPublic = PUBLIC_ROUTES.some(r => pathname === r || pathname?.startsWith('/onboarding'))
    if (isPublic) {
      setLoading(false)
      return
    }

    async function loadUser() {
      try {
        const me = await getMe()
        if (!cancelled) setUser(me)
      } catch {
        if (!cancelled) {
          setUser(null)
          // Só redireciona se não estiver já em rota pública
          if (!PUBLIC_ROUTES.some(r => pathname === r)) {
            router.replace('/login')
          }
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    loadUser()
    return () => { cancelled = true }
  }, [pathname, router])

  function redirectByRole(me: AuthUser) {
    if (me.role === 'BUSINESS_OWNER' && !me.businessId) {
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

  return { user, loading, login, register, loginWithGoogle, logout, refetchUser }
}