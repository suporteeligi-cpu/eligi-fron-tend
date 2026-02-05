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
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const tokens = await loginRequest(email, password)
      localStorage.setItem('accessToken', tokens.accessToken)

      const me = await getMe()

      if (me.role === 'BUSINESS_OWNER') {
        router.push('/onboarding')
      }

      if (me.role === 'AFFILIATE') {
        router.push('/dashboard')
      }
    } catch {
      setError('Email ou senha inválidos')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthCard
      title="Entrar no ELIGI"
      subtitle="Acesse sua conta para continuar"
    >
      {/* 🔁 Switch protegido Login / Register */}
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
          onChange={e => setEmail(e.target.value)}
          required
        />

        <AuthInput
          label="Senha"
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
        />

        {error && <p className={styles.authError}>{error}</p>}

        <AuthButton type="submit" loading={loading}>
          Entrar
        </AuthButton>
      </form>
    </AuthCard>
  )
}
