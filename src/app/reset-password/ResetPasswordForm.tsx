'use client'

import { useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { AuthCard } from '../components/auth/AuthCard'
import { AuthInput } from '../components/auth/AuthInput'
import { AuthButton } from '../components/auth/AuthButton'
import { api } from '@/lib/api'
import styles from './ResetPassword.module.css'

export default function ResetPasswordForm() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const token = searchParams.get('token')

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const [error, setError] = useState<string | undefined>()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (loading) return

    if (!token) {
      setError('Token inválido ou ausente.')
      return
    }

    if (password.length < 8) {
      setError('A senha deve ter pelo menos 8 caracteres.')
      return
    }

    if (password !== confirmPassword) {
      setError('As senhas não coincidem.')
      return
    }

    setLoading(true)
    setError(undefined)

    try {
      await api.post('/auth/reset-password', {
        token,
        password
      })

      setSuccess(true)

      setTimeout(() => {
        router.push('/login')
      }, 2000)

    } catch {
      setError('Token inválido ou expirado.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthCard
      title="Nova senha"
      subtitle="Defina sua nova senha com segurança"
      loading={loading}
      errorMessage={error}
      successMessage={
        success
          ? 'Senha redefinida com sucesso. Redirecionando...'
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
            label="Nova senha"
            type="password"
            value={password}
            onChange={setPassword}
            disabled={loading}
            required
          />

          <AuthInput
            label="Confirmar senha"
            type="password"
            value={confirmPassword}
            onChange={setConfirmPassword}
            disabled={loading}
            required
          />

          <AuthButton
            type="submit"
            loading={loading}
            disabled={loading}
          >
            Redefinir senha
          </AuthButton>
        </form>
      )}
    </AuthCard>
  )
}
