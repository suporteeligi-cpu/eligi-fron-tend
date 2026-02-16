'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useGoogleLogin } from '@react-oauth/google'
import { useAuth } from '@/hooks/useAuth'
import { api } from '@/lib/api'
import { AuthCard } from '../components/auth/AuthCard'
import { AuthInput } from '../components/auth/AuthInput'
import { AuthButton } from '../components/auth/AuthButton'
import { mapAuthError } from '@/lib/auth.error.map'
import { GoogleIcon } from '../components/ui/GoogleIcon'
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

  const googleLogin = useGoogleLogin({
    flow: 'implicit',
    onSuccess: async (tokenResponse) => {
      try {
        setLoading(true)

        const { data } = await api.post('/auth/google', {
          idToken: tokenResponse.access_token
        })

        localStorage.setItem('accessToken', data.accessToken)
        localStorage.setItem('refreshToken', data.refreshToken)

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

  function handleSwitch(newMode: Mode) {
    setMode(newMode)
    if (newMode === 'register') {
      router.push('/register')
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

        <AuthButton
          type="submit"
          loading={loading}
          disabled={loading}
        >
          Entrar
        </AuthButton>
      </form>

      {/* GOOGLE BUTTON COM MICRO-INTERAÇÃO */}
      <button
        type="button"
        disabled={loading}
        className={styles.googleButton}
        onMouseMove={(e) => {
          const target = e.currentTarget
          const rect = target.getBoundingClientRect()

          const x = e.clientX - rect.left
          const y = e.clientY - rect.top

          const centerX = rect.width / 2
          const centerY = rect.height / 2

          const moveX = (x - centerX) / 18
          const moveY = (y - centerY) / 18

          const icon = target.querySelector('svg')

          if (icon instanceof SVGSVGElement) {
            icon.style.transform =
                `translate(${moveX}px, ${moveY}px) scale(1.05)`
         }

        }}
        onMouseLeave={(e) => {
          const icon = e.currentTarget.querySelector('svg')

          if (icon instanceof SVGSVGElement) {
            icon.style.transform = 'translate(0px, 0px) scale(1)'
          }

        }}
        onClick={() => googleLogin()}
      >
        <GoogleIcon />
        <span className={styles.googleText}>
          Continuar com Google
        </span>
      </button>

    </AuthCard>
  )
}
