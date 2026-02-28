'use client'

import { useEffect, useState } from 'react'
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
     🔎 Carrega usuário ao iniciar (via cookie)
  ===================================================== */

  useEffect(() => {
    async function loadUser() {
      try {
        const response = await getMe()
        const me: AuthUser = response
        setUser(me)
      } catch {
        setUser(null)
      } finally {
        setLoading(false)
      }
    }

    loadUser()
  }, [])

  /* =====================================================
     🔐 LOGIN
  ===================================================== */

  async function login(email: string, password: string) {
    await loginRequest(email, password)

    const response = await getMe()
    const me: AuthUser = response

    setUser(me)
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

    const response = await getMe()
    const me: AuthUser = response

    setUser(me)
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

    const response = await getMe()
    const me: AuthUser = response

    setUser(me)
    redirectByRole(me)
  }

  /* =====================================================
     🔁 REDIRECIONAMENTO INTELIGENTE
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
      // Mesmo que falhe no servidor,
      // limpamos estado local
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
    logout
  }
}