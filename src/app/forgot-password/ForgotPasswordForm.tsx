'use client'

import { useState } from 'react'
import { AuthCard } from '../components/auth/AuthCard'
import { AuthInput } from '../components/auth/AuthInput'
import { AuthButton } from '../components/auth/AuthButton'
import { api } from '@/lib/api'

export default function ForgotPasswordForm() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (loading) return

    setLoading(true)

    try {
      await api.post('/auth/forgot-password', { email })
      setSuccess(true)
    } catch {
      // Não revelamos se email existe (segurança)
      setSuccess(true)
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthCard
      title="Redefinir senha"
      subtitle="Informe seu e-mail para receber o link"
      loading={loading}
      successMessage={
        success
          ? 'Se o e-mail existir, você receberá instruções em instantes.'
          : undefined
      }
    >
      <form onSubmit={handleSubmit}>
        <AuthInput
          label="Email"
          type="email"
          value={email}
          onChange={setEmail}
          disabled={loading}
          required
        />

        <AuthButton type="submit" loading={loading}>
          Enviar link
        </AuthButton>
      </form>
    </AuthCard>
  )
}
