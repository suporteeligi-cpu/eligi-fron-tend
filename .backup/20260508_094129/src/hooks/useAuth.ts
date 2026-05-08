'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  loginRequest,
  registerRequest,
  getMe,
  googleLoginRequest,
  logoutRequest
} from '@/lib/auth.api'
import { AuthUser } from '@/types/auth.types'

type Role = 'BUSINESS_OWNER' | 'AFFILIATE'

export function useAuth() {
  const router = useRouter()

  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)

  /* =====================================================
     🔎 REFETCH USER (🔥 ESSENCIAL)
  ===================================================== */

  const refetchUser = useCallback(async () => {
    const response = await getMe()
    const me: AuthUser = response
    setUser(me)
    return me
  }, [])

  /* =====================================================
     🔎 LOAD INICIAL
  ===================================================== */

  useEffect(() => {
    async function loadUser() {
      try {
        await refetchUser()
      } catch {
        setUser(null)
      } finally {
        setLoading(false)
      }
    }

    loadUser()
  }, [refetchUser])

  /* =====================================================
     🔐 LOGIN
  ===================================================== */

  async function login(email: string, password: string) {
    await loginRequest(email, password)

    const me = await refetchUser()

    redirectByRole(me)
  }

  /* =====================================================
     📝 REGISTER
  ===================================================== */

  async function register(
    name: string,
    email: string,
    password: string,
    role: Role
  ) {
    await registerRequest(name, email, password, role)

    const me = await refetchUser()

    redirectByRole(me)
  }

  /* =====================================================
     🟢 GOOGLE LOGIN
  ===================================================== */

  async function loginWithGoogle(
    idToken: string,
    mode: 'login' | 'register'
  ) {
    await googleLoginRequest(idToken, mode)

    const me = await refetchUser()

    redirectByRole(me)
  }

  /* =====================================================
     🔁 REDIRECT
  ===================================================== */

  function redirectByRole(user: AuthUser) {
    if (user.role === 'BUSINESS_OWNER') {
      if (!user.businessId) {
        router.push('/onboarding')
      } else {
        router.push('/dashboard')
      }
    } else {
      router.push('/dashboard')
    }
  }

  /* =====================================================
     🚪 LOGOUT
  ===================================================== */

  async function logout() {
    try {
      await logoutRequest()
    } catch {
      // ignora erro
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
    refetchUser // 🔥 AGORA DISPONÍVEL
  }
}