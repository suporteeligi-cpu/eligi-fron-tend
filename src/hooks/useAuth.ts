'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  loginRequest,
  registerRequest,
  getMe,
  googleLoginRequest
} from '@/lib/auth.api'

type Role = 'BUSINESS_OWNER' | 'AFFILIATE'

interface User {
  id: string
  name: string
  email: string
  role: Role
}

export function useAuth() {
  const router = useRouter()

  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  // 🔎 Verifica token ao iniciar
  useEffect(() => {
    async function loadUser() {
      const token = localStorage.getItem('accessToken')

      if (!token) {
        setLoading(false)
        return
      }

      try {
        const me = await getMe()
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

  // 🔐 LOGIN NORMAL
  async function login(email: string, password: string) {
    const tokens = await loginRequest(email, password)

    localStorage.setItem('accessToken', tokens.accessToken)
    localStorage.setItem('refreshToken', tokens.refreshToken)

    const me = await getMe()
    setUser(me)

    redirectByRole(me.role)
  }

  // 📝 REGISTER NORMAL
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

    const me = await getMe()
    setUser(me)

    redirectByRole(me.role)
  }

  // 🟢 GOOGLE LOGIN (UNIFICADO)
  async function loginWithGoogle(
  idToken: string,
  mode: 'login' | 'register'
) {
  const tokens = await googleLoginRequest(idToken, mode)

  localStorage.setItem('accessToken', tokens.accessToken)
  localStorage.setItem('refreshToken', tokens.refreshToken)

  const me = await getMe()
  setUser(me)

  redirectByRole(me.role)
  }

  function redirectByRole(role: Role) {
    if (role === 'BUSINESS_OWNER') {
      router.push('/onboarding')
    } else {
      router.push('/dashboard')
    }
  }

  function logout() {
    localStorage.removeItem('accessToken')
    localStorage.removeItem('refreshToken')
    setUser(null)
    router.push('/login')
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