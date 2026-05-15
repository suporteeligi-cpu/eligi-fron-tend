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
import api from '@/lib/apiClient'
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
        // Tenta buscar o usuário normalmente
        // O interceptor do apiClient já vai fazer o refresh automaticamente
        // se o accessToken estiver expirado
        const me = await getMe()
        if (!cancelled) setUser(me)
      } catch {
        // getMe falhou mesmo após tentativa de refresh pelo interceptor
        // → sessão realmente inválida, limpa o estado
        if (!cancelled) setUser(null)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    loadUser()
    return () => { cancelled = true }
  }, [])

  /* ── Redirect by role ── */
  function redirectByRole(me: AuthUser) {
    if (me.role === 'BUSINESS_OWNER' && !me.businessId) {
      router.push('/onboarding')
    } else {
      router.push('/dashboard')
    }
  }

  /* ── Login ── */
  async function login(email: string, password: string) {
    await loginRequest(email, password)
    const me = await refetchUser()
    redirectByRole(me)
  }

  /* ── Register ── */
  async function register(
    name: string,
    email: string,
    password: string,
    role: Role,
  ) {
    await registerRequest(name, email, password, role)
    const me = await refetchUser()
    redirectByRole(me)
  }

  /* ── Google ── */
  async function loginWithGoogle(idToken: string, mode: 'login' | 'register') {
    await googleLoginRequest(idToken, mode)
    const me = await refetchUser()
    redirectByRole(me)
  }

  /* ── Logout ── */
  async function logout() {
    try {
      await logoutRequest()
    } catch {
      // best-effort
    }
    setUser(null)
    router.replace('/login')
  }

  return {
    user,
    loading,
    login,
    register,
    loginWithGoogle,
    logout,
    refetchUser,
  }
}