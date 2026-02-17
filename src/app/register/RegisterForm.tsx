'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useGoogleLogin } from '@react-oauth/google'
import { AuthCard } from '../components/auth/AuthCard'
import { AuthInput } from '../components/auth/AuthInput'
import { AuthButton } from '../components/auth/AuthButton'
import { AuthRoleSelect } from '../components/auth/AuthRoleSelect'
import { GoogleIcon } from '../components/ui/GoogleIcon'
import { registerRequest, getMe } from '@/lib/auth.api'
import { api } from '@/lib/api'
import { mapAuthError } from '@/lib/auth.error.map'
import styles from './Register.module.css'

type Role = 'BUSINESS_OWNER' | 'AFFILIATE'

interface ApiError {
  code: string
  message?: string
  field?: 'name' | 'email' | 'password'
}

export default function RegisterForm() {
  const router = useRouter()

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] =
    useState<Role>('BUSINESS_OWNER')

  const [loading, setLoading] = useState(false)

  const [errors, setErrors] = useState<{
    name?: string
    email?: string
    password?: string
    general?: string
  }>({})

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (loading) return

    setLoading(true)
    setErrors({})

    try {
      const tokens = await registerRequest(
        name,
        email,
        password,
        role
      )

      localStorage.setItem(
        'accessToken',
        tokens.accessToken
      )

      const me = await getMe()

      if (me.role === 'BUSINESS_OWNER') {
        router.push('/onboarding')
      } else {
        router.push('/dashboard')
      }

    } catch (error: unknown) {
      if (
        error &&
        typeof error === 'object' &&
        'code' in error &&
        typeof (error as { code: unknown }).code === 'string'
      ) {
        const apiError = error as ApiError
        const mapped = mapAuthError(apiError.code)

        if (mapped.field) {
          setErrors({
            [mapped.field]: mapped.message
          })
        } else {
          setErrors({
            general: mapped.message
          })
        }
      } else {
        setErrors({
          general: 'Erro inesperado'
        })
      }
    } finally {
      setLoading(false)
    }
  }

  const googleRegister = useGoogleLogin({
    flow: 'implicit',
    onSuccess: async (tokenResponse) => {
      try {
        setLoading(true)

        const { data } = await api.post('/auth/google', {
          idToken: tokenResponse.access_token,
          role // 🔥 AGORA ENVIAMOS O ROLE
        })

        localStorage.setItem(
          'accessToken',
          data.accessToken
        )

        localStorage.setItem(
          'refreshToken',
          data.refreshToken
        )

        const me = await getMe()

        if (me.role === 'BUSINESS_OWNER') {
          router.push('/onboarding')
        } else {
          router.push('/dashboard')
        }

      } catch {
        setErrors({
          general: 'Erro ao registrar com Google.'
        })
      } finally {
        setLoading(false)
      }
    }
  })

  return (
    <AuthCard
      title="Cadastre-se"
      subtitle="Comece agora mesmo a usar o ELIGI"
      loading={loading}
      errorMessage={errors.general}
    >
      <div className={styles.authSwitch}>
        <button
          type="button"
          className={styles.authSwitchButton}
          onClick={() => router.push('/login')}
        >
          Entrar
        </button>

        <button
          type="button"
          className={`${styles.authSwitchButton} ${styles.authSwitchButtonActive}`}
        >
          Criar conta
        </button>
      </div>

      <form
        className={styles.authForm}
        onSubmit={handleSubmit}
        noValidate
      >
        <AuthInput
          label="Nome completo"
          value={name}
          onChange={setName}
          error={errors.name}
          disabled={loading}
          required
        />

        <AuthRoleSelect
          value={role}
          onChange={setRole}
        />

        <AuthInput
          label="Email"
          type="email"
          value={email}
          onChange={setEmail}
          error={errors.email}
          disabled={loading}
          required
        />

        <AuthInput
          label="Senha"
          type="password"
          value={password}
          onChange={setPassword}
          error={errors.password}
          disabled={loading}
          required
        />

        <AuthButton
          type="submit"
          loading={loading}
          disabled={loading}
        >
          Criar conta
        </AuthButton>
      </form>

      <div className={styles.divider}>
        <span>ou</span>
      </div>

      <button
        type="button"
        disabled={loading}
        className={styles.googleButton}
        onClick={() => googleRegister()}
      >
        <GoogleIcon />
        <span className={styles.googleText}>
          Registrar com Google
        </span>
      </button>
    </AuthCard>
  )
}
