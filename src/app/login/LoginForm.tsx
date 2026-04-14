'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { AuthCard } from '../components/auth/AuthCard'
import { AuthInput } from '../components/auth/AuthInput'
import { AuthButton } from '../components/auth/AuthButton'
import { mapAuthError } from '@/lib/auth.error.map'
import styles from './Login.module.css'

type ApiError = { code: string }
type Mode = 'login' | 'register'

interface GoogleCredentialResponse {
  credential?: string
}

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string
            callback: (response: GoogleCredentialResponse) => void
          }) => void
          renderButton: (
            parent: HTMLElement,
            options: {
              theme?: string
              size?: string
              width?: string | number
            }
          ) => void
        }
      }
    }
  }
}

export default function LoginForm() {
  const router = useRouter()
  const { login, loginWithGoogle } = useAuth() // 🔥 removido refetchUser

  const googleButtonRef = useRef<HTMLDivElement>(null)

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

  /* =========================================
     GOOGLE INIT
  ========================================= */

  useEffect(() => {
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID
    if (!clientId) return
    if (!window.google) return
    if (!googleButtonRef.current) return

    window.google.accounts.id.initialize({
      client_id: clientId,
      callback: async (response: GoogleCredentialResponse) => {
        try {
          setLoading(true)

          if (!response.credential) {
            throw new Error('Token Google inválido')
          }

          await loginWithGoogle(response.credential, 'login')

          // 🔥 REDIRECIONA
          router.push('/dashboard')

        } catch {
          setErrors({
            general: 'Erro ao autenticar com Google.'
          })
        } finally {
          setLoading(false)
        }
      }
    })

    window.google.accounts.id.renderButton(
      googleButtonRef.current,
      {
        theme: 'outline',
        size: 'large',
        width: '100%'
      }
    )
  }, [loginWithGoogle, router]) // 🔥 removido refetchUser

  /* =========================================
     SUBMIT
  ========================================= */

  async function handleSubmit(
    e: React.FormEvent<HTMLFormElement>
  ) {
    e.preventDefault()
    if (loading) return

    setHasSubmitted(true)
    setLoading(true)
    setErrors({})

    try {
      // 🔐 LOGIN
      await login(email, password)

      // 🔥 REDIRECIONA
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

  /* =========================================
     MODE SWITCH
  ========================================= */

  function handleSwitch(newMode: Mode) {
    setMode(newMode)

    if (newMode === 'register') {
      router.push('/register')
    }
  }

  /* =========================================
     UI
  ========================================= */

  return (
    <AuthCard
      title="Acessar conta"
      subtitle="Entre para continuar no ELIGI"
      loading={loading}
      errorMessage={hasSubmitted ? errors.general : undefined}
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

      <div className={styles.googleWrapper}>
        <div ref={googleButtonRef} />
      </div>
    </AuthCard>
  )
}