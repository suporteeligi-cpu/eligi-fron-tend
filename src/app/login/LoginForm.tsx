'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { AuthCard } from '../components/auth/AuthCard'
import { AuthInput } from '../components/auth/AuthInput'
import { AuthButton } from '../components/auth/AuthButton'
import { loginRequest, getMe } from '@/lib/auth.api'
import styles from './Login.module.css'

type ApiErrorResponse = {
  code?: string
  field?: 'email' | 'password'
  message?: string
}

export default function LoginForm() {
  const router = useRouter()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const [errors, setErrors] = useState<{
    email?: string
    password?: string
    general?: string
  }>({})

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErrors({})

    setLoading(true)

    try {
      const tokens = await loginRequest(email, password)
      localStorage.setItem('accessToken', tokens.accessToken)

      const me = await getMe()

      if (me.role === 'BUSINESS_OWNER') router.push('/onboarding')
      if (me.role === 'AFFILIATE') router.push('/dashboard')
    } catch (err: unknown) {
      let apiError: ApiErrorResponse | undefined

      if (
        err &&
        typeof err === 'object' &&
        'response' in err &&
        err.response &&
        typeof err.response === 'object' &&
        'data' in err.response
      ) {
        apiError = err.response.data as ApiErrorResponse
      }

      if (apiError?.field && apiError?.message) {
        setErrors({ [apiError.field]: apiError.message })
      } else {
        setErrors({
          general: apiError?.message ?? 'Erro ao realizar login'
        })
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthCard
      title="Login"
      subtitle="Acesse sua conta para continuar"
      loading={loading}
    >
      <div className={styles.authSwitch}>
        <button
          type="button"
          className={`${styles.authSwitchButton} ${styles.authSwitchButtonActive}`}
        >
          Entrar
        </button>

        <button
          type="button"
          className={styles.authSwitchButton}
          onClick={() => router.push('/register')}
        >
          Criar conta
        </button>
      </div>

      <form className={styles.authForm} onSubmit={handleSubmit}>
        <AuthInput
          label="Email"
          type="email"
          value={email}
          onChange={setEmail}
          error={errors.email}
          required
        />

        <AuthInput
          label="Senha"
          type="password"
          value={password}
          onChange={setPassword}
          error={errors.password}
          required
        />

        {errors.general && (
          <p className={styles.authError}>{errors.general}</p>
        )}

        <AuthButton type="submit" loading={loading}>
          Entrar
        </AuthButton>
      </form>
    </AuthCard>
  )
}
