'use client'

import { useEffect, useState } from 'react'
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

type Mode = 'login' | 'register'

declare global {
  interface Window {
    google?: any
  }
}

export default function LoginForm() {
  const router = useRouter()
  const { login, loginWithGoogle } = useAuth()

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

  // 🔵 Inicializa Google manualmente
  useEffect(() => {
    if (!window.google) return

    window.google.accounts.id.initialize({
      client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!,
      callback: async (response: any) => {
        try {
          setLoading(true)

          if (!response.credential) {
            throw new Error('Token Google inválido')
          }

          await loginWithGoogle(
            response.credential,
            'login'
          )

        } catch {
          setErrors({
            general: 'Erro ao autenticar com Google.'
          })
        } finally {
          setLoading(false)
        }
      }
    })
  }, [])

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

  function handleGoogleClick() {
    if (!window.google) return
    window.google.accounts.id.prompt()
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

      {/* 🔥 BOTÃO GOOGLE CUSTOM */}
      <div className={styles.googleWrapper}>
        <button
          type="button"
          className={styles.googleCustomButton}
          onClick={handleGoogleClick}
          disabled={loading}
        >
          <svg width="18" height="18" viewBox="0 0 48 48">
            <path fill="#EA4335" d="M24 9.5c3.54 0 6.37 1.23 8.5 3.24l6.32-6.32C34.91 2.54 29.9 0 24 0 14.82 0 6.93 5.48 3.24 13.44l7.38 5.73C12.55 13.11 17.8 9.5 24 9.5z"/>
            <path fill="#4285F4" d="M46.14 24.55c0-1.64-.15-3.22-.43-4.75H24v9h12.45c-.54 2.92-2.18 5.4-4.64 7.08l7.3 5.68C43.9 37.46 46.14 31.52 46.14 24.55z"/>
            <path fill="#FBBC05" d="M10.62 28.27a14.5 14.5 0 010-8.54l-7.38-5.73C1.16 17.08 0 20.41 0 24c0 3.59 1.16 6.92 3.24 9.99l7.38-5.72z"/>
            <path fill="#34A853" d="M24 48c6.48 0 11.92-2.14 15.9-5.82l-7.3-5.68c-2.03 1.36-4.63 2.16-8.6 2.16-6.2 0-11.45-3.61-13.38-8.67l-7.38 5.72C6.93 42.52 14.82 48 24 48z"/>
          </svg>

          <span>Continuar com Google</span>
        </button>
      </div>
    </AuthCard>
  )
}