'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { GoogleLogin } from '@react-oauth/google'
import type { CredentialResponse } from '@react-oauth/google'
import { useAuth } from '@/hooks/useAuth'
import { api } from '@/lib/api'
import { AuthCard } from '../components/auth/AuthCard'
import { AuthInput } from '../components/auth/AuthInput'
import { AuthButton } from '../components/auth/AuthButton'
import { mapAuthError } from '@/lib/auth.error.map'
import styles from './Login.module.css'


type ApiError = {
  code: string
}

type Mode = 'login' | 'register'

export default function LoginForm() {
  const router = useRouter()
  const { login } = useAuth()

  const [mode, setMode] = useState<Mode>('login')
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
      router.push('/dashboard')
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
      } else {
        setErrors({
          general: 'Erro inesperado. Tente novamente.'
        })
      }
    } finally {
      setLoading(false)
    }
  }

  function handleSwitch(newMode: Mode) {
    setMode(newMode)
    if (newMode === 'register') {
      router.push('/register')
    }
  }

  async function handleGoogleSuccess(
  credentialResponse: CredentialResponse
) {
  try {
    setLoading(true)

    if (!credentialResponse.credential) {
      throw new Error('Token Google inválido')
    }

    const { data } = await api.post('/auth/google', {
      idToken: credentialResponse.credential
    })

    localStorage.setItem(
      'accessToken',
      data.accessToken
    )

    localStorage.setItem(
      'refreshToken',
      data.refreshToken
    )

    router.push('/dashboard')

  } catch {
    setErrors({
      general: 'Erro ao autenticar com Google.'
    })
  } finally {
    setLoading(false)
  }
}

  return (
    <AuthCard
      title="Acessar conta"
      subtitle="Entre para continuar no ELIGI"
      loading={loading}
      errorMessage={
        hasSubmitted ? errors.general : undefined
      }
    >
      {/* SWITCH */}
      <div className={styles.authSwitch}>
        <button
          type="button"
          className={
            mode === 'login'
              ? `${styles.authSwitchButton} ${styles.authSwitchButtonActive}`
              : styles.authSwitchButton
          }
          onClick={() => handleSwitch('login')}
        >
          Login
        </button>

        <button
          type="button"
          className={
            mode === 'register'
              ? `${styles.authSwitchButton} ${styles.authSwitchButtonActive}`
              : styles.authSwitchButton
          }
          onClick={() => handleSwitch('register')}
        >
          Criar conta
        </button>
      </div>

      {/* FORM */}
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

        <div className={styles.forgotPassword}>
          <button
            type="button"
            onClick={() =>
              router.push('/forgot-password')
            }
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

      {/* GOOGLE LOGIN CORRETO */}
      <div className={styles.googleWrapper}>
        <GoogleLogin
          onSuccess={handleGoogleSuccess}
          onError={() =>
            setErrors({
              general: 'Erro ao autenticar com Google.'
            })
          }
        />
      </div>
    </AuthCard>
  )
}