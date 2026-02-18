'use client'

import { useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { AuthCard } from '../components/auth/AuthCard'
import { AuthInput } from '../components/auth/AuthInput'
import { AuthButton } from '../components/auth/AuthButton'
import { api } from '@/lib/api'
import styles from './ForgotPassword.module.css'

export default function ForgotPasswordForm() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const initialEmail = searchParams.get('email') ?? ''

  const [email, setEmail] = useState(initialEmail)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (loading) return

    setLoading(true)

    // 🔒 Proteção contra timing attack
    const start = Date.now()

    try {
      await api.post('/auth/forgot-password', { email })
    } catch {
      // Nunca revelamos se o e-mail existe
    } finally {
      const elapsed = Date.now() - start
      const minDelay = 800

      if (elapsed < minDelay) {
        await new Promise(resolve =>
          setTimeout(resolve, minDelay - elapsed)
        )
      }

      setSuccess(true)
      setLoading(false)
    }
  }

  return (
    <AuthCard
      title="Redefinir senha"
      subtitle="Informe seu e-mail para receber o link de redefinição"
      loading={loading}
      successMessage={
        success
          ? 'Se o e-mail estiver cadastrado, você receberá instruções em instantes.'
          : undefined
      }
    >
      {!success && (
        <form
          className={styles.form}
          onSubmit={handleSubmit}
          noValidate
        >
          <AuthInput
            label="Email"
            type="email"
            value={email}
            onChange={setEmail}
            disabled={loading}
            required
          />

          <AuthButton
            type="submit"
            loading={loading}
            disabled={loading}
          >
            Enviar link
          </AuthButton>

          <div className={styles.backToLogin}>
            <button
              type="button"
              onClick={() => router.push('/login')}
              className={styles.link}
            >
              Voltar para login
            </button>
          </div>
        </form>
      )}
    </AuthCard>
  )
}
