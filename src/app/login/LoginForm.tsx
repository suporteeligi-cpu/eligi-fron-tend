'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { AuthCard } from '../components/auth/AuthCard'
import { AuthInput } from '../components/auth/AuthInput'
import { AuthButton } from '../components/auth/AuthButton'
import { loginRequest, getMe } from '@/lib/auth.api'
import styles from './Login.module.css'

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

  function isValidEmail(value: string) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErrors({})

    if (!isValidEmail(email)) {
      setErrors({ email: 'Email inválido' })
      return
    }

    setLoading(true)

    try {
      const tokens = await loginRequest(email, password)
      localStorage.setItem('accessToken', tokens.accessToken)

      const me = await getMe()

      if (me.role === 'BUSINESS_OWNER') router.push('/onboarding')
      if (me.role === 'AFFILIATE') router.push('/dashboard')
    } catch (err: unknown) {
      const code =
        err &&
        typeof err === 'object' &&
        'response' in err &&
        err.response &&
        typeof err.response === 'object' &&
        'data' in err.response &&
        err.response.data &&
        typeof err.response.data === 'object' &&
        'code' in err.response.data
          ? (err.response.data as { code?: string }).code
          : undefined

      if (code === 'EMAIL_NOT_FOUND') {
        setErrors({ email: 'Email não encontrado' })
      } else if (code === 'INVALID_PASSWORD') {
        setErrors({ password: 'Senha incorreta' })
      } else {
        setErrors({ general: 'Email ou senha inválidos' })
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
