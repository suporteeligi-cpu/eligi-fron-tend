'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  loginRequest,
  registerRequest,
  getMe,
  googleLoginRequest
} from '@/lib/auth.api'
import { AuthUser } from '@/types/auth.types'
import { logoutRequest } from '@/lib/auth.api'

type Role = 'BUSINESS_OWNER' | 'AFFILIATE'

export function useAuth() {
  const router = useRouter()

  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)

  /* =====================================================
     🔎 Carrega usuário ao iniciar (se tiver token)
  ===================================================== */

  useEffect(() => {
    async function loadUser() {
      const token = localStorage.getItem('accessToken')

      if (!token) {
        setLoading(false)
        return
      }

      try {
        const response = await getMe()

        // agora o contrato é fixo: { success, data }
        const me: AuthUser = response.data

        setUser(me)
      } catch {
        localStorage.removeItem('accessToken')
        localStorage.removeItem('refreshToken')
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
    const tokens = await loginRequest(email, password)

    localStorage.setItem('accessToken', tokens.accessToken)
    localStorage.setItem('refreshToken', tokens.refreshToken)

    const response = await getMe()
    const me: AuthUser = response.data

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
    const tokens = await registerRequest(
      name,
      email,
      password,
      role
    )

    localStorage.setItem('accessToken', tokens.accessToken)
    localStorage.setItem('refreshToken', tokens.refreshToken)

    const response = await getMe()
    const me: AuthUser = response.data

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
    const tokens = await googleLoginRequest(idToken, mode)

    localStorage.setItem('accessToken', tokens.accessToken)
    localStorage.setItem('refreshToken', tokens.refreshToken)

    const response = await getMe()
    const me: AuthUser = response.data

    setUser(me)
    redirectByRole(me)
  }

  /* =====================================================
     🔁 REDIRECIONAMENTO INTELIGENTE
  ===================================================== */

  function redirectByRole(user: AuthUser) {
    if (user.role === 'BUSINESS_OWNER') {
      // Se ainda não tem business, vai onboarding
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
      // garantimos limpeza local
    }

     localStorage.removeItem('accessToken')
     localStorage.removeItem('refreshToken')

     setUser(null)

      // Reset total do app
     window.location.href = '/login'
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
