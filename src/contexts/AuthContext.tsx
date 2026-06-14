'use client'

import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import {
  loginRequest,
  registerRequest,
  getMe,
  googleLoginRequest,
  logoutRequest,
} from '@/lib/auth.api'
import { AuthUser } from '@/types/auth.types'

type Role = 'BUSINESS_OWNER' | 'MANAGER' | 'RECEPTIONIST' | 'STAFF' | 'BASIC_STAFF' | 'PROFESSIONAL' | 'AFFILIATE'

interface AuthContextValue {
  user:            AuthUser | null
  loading:         boolean
  login:           (email: string, password: string) => Promise<void>
  register:        (name: string, email: string, password: string, role: Role) => Promise<void>
  loginWithGoogle: (idToken: string, mode: 'login' | 'register') => Promise<void>
  logout:          () => Promise<void>
  refetchUser:     () => Promise<AuthUser>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter()

  const [user,    setUser]    = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)

  /* ── Fetch current user ── */
  const refetchUser = useCallback(async (): Promise<AuthUser> => {
    const me = await getMe()
    setUser(me)
    return me
  }, [])

  /* ── Load on mount — uma única vez, para todo o app ── */
  useEffect(() => {
    let cancelled = false

    async function loadUser() {
      try {
        const me = await getMe()
        if (!cancelled) setUser(me)
      } catch {
        if (!cancelled) setUser(null)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    loadUser()
    return () => { cancelled = true }
  }, [])

  /* ── Redirect by role ── */
  const redirectByRole = useCallback((me: AuthUser) => {
    // Grava role num cookie acessível pelo middleware (não-httpOnly, 7 dias)
    document.cookie = `userRole=${me.role};path=/;max-age=${7 * 24 * 3600};samesite=lax`

    // Owner sem negócio → onboarding
    if (me.role === 'BUSINESS_OWNER' && !me.businessId) {
      router.push('/onboarding')
      return
    }
    // BASIC_STAFF e RECEPTIONIST → agenda sempre
    const agendaOnlyRoles = ['BASIC_STAFF', 'RECEPTIONIST']
    if (agendaOnlyRoles.includes(me.role)) {
      router.push('/dashboard/agenda')
      return
    }
    // Demais funcionários → agenda (mas podem navegar pelo menu)
    const staffRoles = ['MANAGER', 'STAFF']
    if (staffRoles.includes(me.role)) {
      router.push('/dashboard/agenda')
      return
    }
    // Owner/Affiliate → dashboard
    router.push('/dashboard')
  }, [router])

  /* ── Login ── */
  const login = useCallback(async (email: string, password: string) => {
    await loginRequest(email, password)
    const me = await refetchUser()
    redirectByRole(me)
  }, [refetchUser, redirectByRole])

  /* ── Register ── */
  const register = useCallback(async (
    name: string,
    email: string,
    password: string,
    role: Role,
  ) => {
    await registerRequest(name, email, password, role as 'BUSINESS_OWNER' | 'AFFILIATE')
    const me = await refetchUser()
    redirectByRole(me)
  }, [refetchUser, redirectByRole])

  /* ── Google ── */
  const loginWithGoogle = useCallback(async (
    idToken: string,
    mode: 'login' | 'register',
  ) => {
    await googleLoginRequest(idToken, mode)
    const me = await refetchUser()
    redirectByRole(me)
  }, [refetchUser, redirectByRole])

  /* ── Logout ── */
  const logout = useCallback(async () => {
    try { await logoutRequest() } catch { /* best-effort */ }
    // Limpa cookie de role
    document.cookie = 'userRole=;path=/;max-age=0'
    setUser(null)
    router.replace('/login')
  }, [router])

  return (
    <AuthContext.Provider value={{
      user, loading, login, register, loginWithGoogle, logout, refetchUser
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth deve ser usado dentro de <AuthProvider>')
  return ctx
}
