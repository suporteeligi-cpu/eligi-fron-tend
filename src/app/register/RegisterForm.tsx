'use client'

import { useEffect, useCallback, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { AuthCard }         from '../components/auth/AuthCard'
import { AuthInput }        from '../components/auth/AuthInput'
import { AuthButton }       from '../components/auth/AuthButton'
import { GoogleAuthButton } from '../components/auth/GoogleAuthButton'
import { mapAuthError }     from '@/lib/auth.error.map'
import styles from './Register.module.css'

/* ── Types ── */
interface ApiError {
  code?: string
  field?: 'name' | 'email' | 'password'
  message?: string
}

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
            callback: (r: GoogleCredentialResponse) => void
          }) => void
          prompt: () => void
        }
      }
    }
  }
}

/* ── Component ── */
export default function RegisterForm() {
  const router                        = useRouter()
  const { register, loginWithGoogle } = useAuth()

  const [name,     setName]     = useState('')
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [loading,  setLoading]  = useState(false)
  const [errors,   setErrors]   = useState<{
    name?: string; email?: string; password?: string; general?: string
  }>({})

  /* ── Google init ── */
  useEffect(() => {
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID
    if (!clientId || !window.google) return

    window.google.accounts.id.initialize({
      client_id: clientId,
      callback: async ({ credential }: GoogleCredentialResponse) => {
        if (!credential) {
          setErrors({ general: 'Token Google inválido.' })
          return
        }
        try {
          setLoading(true)
          await loginWithGoogle(credential, 'register')
        } catch {
          setErrors({ general: 'Erro ao registrar com Google.' })
        } finally {
          setLoading(false)
        }
      },
    })
  }, [loginWithGoogle])

  /* ── Google click ── */
  const handleGoogleClick = useCallback(() => {
    if (!window.google) {
      setErrors({ general: 'Google não disponível.' })
      return
    }
    setErrors({})
    window.google.accounts.id.prompt()
  }, [])

  /* ── Submit ── */
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (loading) return

    const nextErrors: typeof errors = {}
    if (!name.trim())                 nextErrors.name     = 'Informe seu nome.'
    if (!email.trim())                nextErrors.email    = 'Informe o e-mail.'
    if (password.length < 8)          nextErrors.password = 'Mínimo 8 caracteres.'
    else if (!/[A-Z]/.test(password)) nextErrors.password = 'Inclua 1 letra maiúscula.'
    else if (!/[0-9]/.test(password)) nextErrors.password = 'Inclua 1 número.'

    if (Object.keys(nextErrors).length) {
      setErrors(nextErrors)
      return
    }

    setLoading(true)
    setErrors({})

    try {
      await register(name.trim(), email.trim(), password, 'BUSINESS_OWNER')
    } catch (error: unknown) {
      const e = (error && typeof error === 'object') ? (error as ApiError) : ({} as ApiError)
      const mapped = mapAuthError(e.code ?? 'UNKNOWN', e.message)

      if (mapped.field) {
        setErrors({ [mapped.field]: mapped.message })
      } else {
        setErrors({ general: mapped.message })
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthCard
      title="Criar conta"
      subtitle="Comece agora mesmo a usar o eligi"
      loading={loading}
      errorMessage={errors.general}
    >
      {/* Switch */}
      <div className={styles.authSwitch}>
        <button type="button" className={styles.authSwitchButton} onClick={() => router.push('/login')}>
          Entrar
        </button>
        <button type="button" className={`${styles.authSwitchButton} ${styles.authSwitchButtonActive}`}>
          Criar conta
        </button>
      </div>

      {/* Form */}
      <form className={styles.authForm} onSubmit={handleSubmit} noValidate>
        <AuthInput
          label="Nome completo"
          value={name}
          onChange={setName}
          error={errors.name}
          disabled={loading}
          autoComplete="name"
          required
        />

        <AuthInput
          label="Email"
          type="email"
          value={email}
          onChange={setEmail}
          error={errors.email}
          disabled={loading}
          autoComplete="email"
          required
        />

        <AuthInput
          label="Senha"
          type="password"
          value={password}
          onChange={setPassword}
          error={errors.password}
          disabled={loading}
          autoComplete="new-password"
          required
        />

        <AuthButton type="submit" loading={loading} disabled={loading}>
          Criar conta
        </AuthButton>
      </form>

      {/* Divider */}
      <div className={styles.divider}>
        <span className={styles.dividerLabel}>ou continue com</span>
      </div>

      {/* Google */}
      <div className={styles.googleWrapper}>
        <GoogleAuthButton
          onClick={handleGoogleClick}
          loading={loading}
          label="Registrar com Google"
        />
      </div>
    </AuthCard>
  )
}