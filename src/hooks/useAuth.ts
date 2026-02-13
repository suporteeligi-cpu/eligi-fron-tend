'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { loginRequest, registerRequest, getMe } from '@/lib/auth.api'

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
        setUser(null)
      } finally {
        setLoading(false)
      }
    }

    loadUser()
  }, [])

  async function login(email: string, password: string) {
    const tokens = await loginRequest(email, password)

    localStorage.setItem('accessToken', tokens.accessToken)

    const me = await getMe()
    setUser(me)

    if (me.role === 'BUSINESS_OWNER') {
      router.push('/onboarding')
    } else {
      router.push('/dashboard')
    }
  }

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

    const me = await getMe()
    setUser(me)

    if (me.role === 'BUSINESS_OWNER') {
      router.push('/onboarding')
    } else {
      router.push('/dashboard')
    }
  }

  function logout() {
    localStorage.removeItem('accessToken')
    setUser(null)
    router.push('/login')
  }

  return {
    user,
    loading,
    login,
    register,
    logout
  }
}
