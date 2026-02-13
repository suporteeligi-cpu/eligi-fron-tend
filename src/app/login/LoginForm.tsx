'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { AuthCard } from '../components/auth/AuthCard'
import { AuthInput } from '../components/auth/AuthInput'
import { AuthButton } from '../components/auth/AuthButton'
import { mapAuthError } from '@/lib/auth.error.map'
import styles from './Login.module.css'

type ApiError = {
  code: string
}

export default function LoginForm() {
  const router = useRouter()
  const { login } = useAuth()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const [loading, setLoading] = useState(false)
  const [hasSubmitted, setHasSubmitted] = useState(false)

  const [errors, setErrors] = useState<{
    email?: string
    password?: string
    general?: string
  }>({})

  async function handleSubmit(
    e: React.FormEvent<HTMLFormElement>
  ) {
    e.preventDefault()

    if (loading) return

    setHasSubmitted(true)
    setLoading(true)
    setErrors({})

    try {
      await login(email, password)
    } catch (error: unknown) {
      if (
        error &&
        typeof error === 'object' &&
        'code' in error
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
      errorMessage={
        hasSubmitted ? errors.general : undefined
      }
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
          error={
            hasSubmitted ? errors.email : undefined
          }
          disabled={loading}
          required
        />

        <AuthInput
          label="Senha"
          type="password"
          value={password}
          onChange={setPassword}
          error={
            hasSubmitted
              ? errors.password
              : undefined
          }
          disabled={loading}
          required
        />

        <div className={styles.forgotPassword}>
          <button
            type="button"
            onClick={() => router.push('/forgot-password')}
            className={styles.forgotLink}
          >
            Esqueci minha senha
          </button>
        </div>

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
