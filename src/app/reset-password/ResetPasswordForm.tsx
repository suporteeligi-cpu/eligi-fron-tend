'use client'

import { useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { AuthCard } from '../components/auth/AuthCard'
import { AuthInput } from '../components/auth/AuthInput'
import { AuthButton } from '../components/auth/AuthButton'
import { api } from '@/lib/api'
import axios from 'axios' // @eligi:reset-imports
import { PasswordChecklist } from '../components/auth/PasswordChecklist'
import { firstPasswordError } from '@/lib/passwordRules'
import styles from './ResetPassword.module.css'

// @eligi:reset-error-map
// O back devolve { code, message }. Antes, todo erro virava "token invalido",
// inclusive senha fraca e falta de rede -- a pessoa pedia link novo a toa.
function resetErrorMessage(err: unknown): string {
  if (!axios.isAxiosError(err)) return 'Não foi possível redefinir a senha. Tente novamente.'
  if (!err.response) return 'Sem conexão com o servidor. Verifique a internet e tente de novo.'
  const data: unknown = err.response.data
  const body = (typeof data === 'object' && data !== null ? data : {}) as {
    code?: unknown
    message?: unknown
    error?: { code?: unknown; message?: unknown }
  }
  const code = typeof body.code === 'string' ? body.code
    : typeof body.error?.code === 'string' ? body.error.code : undefined
  const message = typeof body.message === 'string' ? body.message
    : typeof body.error?.message === 'string' ? body.error.message : undefined

  if (code === 'INVALID_TOKEN') {
    return 'Este link expirou ou já foi usado. Peça um novo em "Esqueci minha senha" e use o e-mail mais recente.'
  }
  if (code === 'WEAK_PASSWORD') return message ?? 'A senha não atende aos requisitos.'
  if (code === 'TOO_MANY_ATTEMPTS') return message ?? 'Muitas tentativas. Aguarde alguns minutos.'
  return message ?? 'Não foi possível redefinir a senha. Tente novamente.'
}

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

    // @eligi:reset-rules — mesma regra do back (8+, maiuscula, numero)
    const pwError = firstPasswordError(password)
    if (pwError) {
      setError(pwError)
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

    } catch (err) {
      setError(resetErrorMessage(err)) // @eligi:reset-catch
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
          {/* @eligi:reset-checklist */}
          <PasswordChecklist password={password} />

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
