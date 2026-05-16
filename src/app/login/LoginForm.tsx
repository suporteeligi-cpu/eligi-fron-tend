'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { GoogleLogin, CredentialResponse } from '@react-oauth/google'
import { useAuth } from '@/hooks/useAuth'
import { AuthCard }   from '../components/auth/AuthCard'
import { AuthInput }  from '../components/auth/AuthInput'
import { AuthButton } from '../components/auth/AuthButton'
import { mapAuthError } from '@/lib/auth.error.map'
import styles from './Login.module.css'

type ApiError = { code: string }

export default function LoginForm() {
  const router                     = useRouter()
  const { login, loginWithGoogle } = useAuth()

  const [email,        setEmail]        = useState('')
  const [password,     setPassword]     = useState('')
  const [loading,      setLoading]      = useState(false)
  const [hasSubmitted, setHasSubmitted] = useState(false)
  const [errors,       setErrors]       = useState<{
    email?: string; password?: string; general?: string
  }>({})

  /* ── Google ── */
  async function handleGoogleSuccess(response: CredentialResponse) {
    if (!response.credential) {
      setErrors({ general: 'Token Google inválido.' })
      return
    }
    try {
      setLoading(true)
      await loginWithGoogle(response.credential, 'login')
    } catch {
      setErrors({ general: 'Erro ao autenticar com Google.' })
    } finally {
      setLoading(false)
    }
  }

  /* ── Submit ── */
  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (loading) return

    setHasSubmitted(true)
    setLoading(true)
    setErrors({})

    try {
      await login(email, password)
    } catch (error: unknown) {
      const mapped = mapAuthError(
        (error && typeof error === 'object' && 'code' in error)
          ? (error as ApiError).code
          : 'UNKNOWN'
      )
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
      title="Acessar conta"
      subtitle="Entre para continuar no eligi"
      loading={loading}
      errorMessage={hasSubmitted ? errors.general : undefined}
    >
      {/* Switch */}
      <div className={styles.authSwitch}>
        <button type="button" className={`${styles.authSwitchButton} ${styles.authSwitchButtonActive}`}>
          Entrar
        </button>
        <button type="button" className={styles.authSwitchButton} onClick={() => router.push('/register')}>
          Criar conta
        </button>
      </div>

      {/* Form */}
      <form className={styles.authForm} onSubmit={handleSubmit} noValidate>
        <AuthInput
          label="Email"
          type="email"
          value={email}
          onChange={setEmail}
          error={hasSubmitted ? errors.email : undefined}
          disabled={loading}
          autoComplete="email"
          required
        />

        <AuthInput
          label="Senha"
          type="password"
          value={password}
          onChange={setPassword}
          error={hasSubmitted ? errors.password : undefined}
          disabled={loading}
          autoComplete="current-password"
          required
        />

        <div className={styles.forgotPassword}>
          <button
            type="button"
            className={styles.forgotLink}
            onClick={() => router.push('/forgot-password')}
          >
            Esqueci minha senha
          </button>
        </div>

        <AuthButton type="submit" loading={loading} disabled={loading}>
          Entrar
        </AuthButton>
      </form>

      {/* Divider */}
      <div className={styles.divider}>
        <span className={styles.dividerLabel}>ou continue com</span>
      </div>

      {/* Google */}
      <div className={styles.googleWrapper}>
        <GoogleLogin
          onSuccess={handleGoogleSuccess}
          onError={() => setErrors({ general: 'Erro ao autenticar com Google.' })}
          width="100%"
          theme="outline"
          size="large"
          text="signin_with"
        />
      </div>
    </AuthCard>
  )
}