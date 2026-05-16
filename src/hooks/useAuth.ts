'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  loginRequest,
  registerRequest,
  getMe,
  googleLoginRequest,
  logoutRequest,
} from '@/lib/auth.api'
import { AuthUser } from '@/types/auth.types'

type Role = 'BUSINESS_OWNER' | 'AFFILIATE'

export function useAuth() {
  const router = useRouter()

  const [user,    setUser]    = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)

  /* ── Fetch current user ── */
  const refetchUser = useCallback(async (): Promise<AuthUser> => {
    const me: AuthUser = await getMe()
    setUser(me)
    return me
  }, [])

  /* ── Load on mount ── */
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
    if (me.role === 'BUSINESS_OWNER' && !me.businessId) {
      router.push('/onboarding')
    } else {
      router.push('/dashboard')
    }
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
    await registerRequest(name, email, password, role)
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
    setUser(null)
    router.replace('/login')
  }, [router])

  return { user, loading, login, register, loginWithGoogle, logout, refetchUser }
}