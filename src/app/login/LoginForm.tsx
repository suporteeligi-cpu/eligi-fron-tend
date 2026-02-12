'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { AuthCard } from '../components/auth/AuthCard'
import { AuthInput } from '../components/auth/AuthInput'
import { AuthButton } from '../components/auth/AuthButton'
import { loginRequest } from '@/lib/auth.api'
import styles from './Login.module.css'

type ApiErrorResponse = {
  field?: 'email' | 'password'
  message?: string
}

export default function LoginForm() {
  const router = useRouter()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const [loading, setLoading] = useState(false)
  const [hasSubmitted, setHasSubmitted] = useState(false)

  const [errors, setErrors] = useState<{
    email?: string
    password?: string
    general?: string
  }>({})

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()

    if (loading) return

    setHasSubmitted(true)
    setLoading(true)
    setErrors({})

    try {
      const tokens = await loginRequest(email, password)

      localStorage.setItem('accessToken', tokens.accessToken)

      router.push('/onboarding')
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
          general: apiError?.message ?? 'Email ou senha inválidos'
        })
      }

      console.log('Erro completo:', err)

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
      <form
        className={styles.authForm}
        onSubmit={handleSubmit}
        noValidate
      >
        <AuthInput
          label="Email"
          type="email"
          value={email}
          onChange={setEmail}
          error={hasSubmitted ? errors.email : undefined}
          disabled={loading}
          required
        />

        <AuthInput
          label="Senha"
          type="password"
          value={password}
          onChange={setPassword}
          error={hasSubmitted ? errors.password : undefined}
          disabled={loading}
          required
        />

        {hasSubmitted && errors.general && (
          <p className={styles.authError}>{errors.general}</p>
        )}

        <AuthButton
          type="submit"
          loading={loading}
          disabled={loading}
        >
          Entrar
        </AuthButton>
      </form>
    </AuthCard>
  )
}
