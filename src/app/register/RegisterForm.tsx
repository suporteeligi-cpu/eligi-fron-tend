'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { AuthCard } from '../components/auth/AuthCard'
import { AuthInput } from '../components/auth/AuthInput'
import { AuthButton } from '../components/auth/AuthButton'
import { AuthRoleSelect } from '../components/auth/AuthRoleSelect'
import { registerRequest, getMe } from '@/lib/auth.api'
import styles from './Register.module.css'

type Role = 'BUSINESS_OWNER' | 'AFFILIATE'

export default function RegisterForm() {
  const router = useRouter()

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState<Role>('BUSINESS_OWNER')

  const [loading, setLoading] = useState(false)

  const [errors, setErrors] = useState<{
    name?: string
    email?: string
    password?: string
    general?: string
  }>({})

  function isValidEmail(value: string) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErrors({})

    // 🔍 validações locais
    if (!name.trim()) {
      setErrors({ name: 'Informe seu nome completo' })
      return
    }

    if (!isValidEmail(email)) {
      setErrors({ email: 'Email inválido' })
      return
    }

    if (password.length < 6) {
      setErrors({ password: 'Senha deve ter no mínimo 6 caracteres' })
      return
    }

    setLoading(true)

    try {
      const tokens = await registerRequest(
        name,
        email,
        password,
        role
      )

      localStorage.setItem('accessToken', tokens.accessToken)

      const me = await getMe()

      if (me.role === 'BUSINESS_OWNER') router.push('/onboarding')
      if (me.role === 'AFFILIATE') router.push('/dashboard')
    } catch (err: any) {
      const code = err?.response?.data?.code

      if (code === 'EMAIL_ALREADY_EXISTS') {
        setErrors({ email: 'Este email já está cadastrado' })
      } else if (code === 'WEAK_PASSWORD') {
        setErrors({ password: 'Senha muito fraca' })
      } else {
        setErrors({
          general: 'Erro ao criar conta. Verifique os dados.'
        })
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthCard
      title="Cadastre-se"
      subtitle="Comece agora mesmo a usar o ELIGI"
      loading={loading}
    >
      <div className={styles.authSwitch}>
        <button
          type="button"
          className={styles.authSwitchButton}
          onClick={() => router.push('/login')}
        >
          Entrar
        </button>

        <button
          type="button"
          className={`${styles.authSwitchButton} ${styles.authSwitchButtonActive}`}
        >
          Criar conta
        </button>
      </div>

      <form className={styles.authForm} onSubmit={handleSubmit}>
        <AuthInput
          label="Nome completo"
          value={name}
          onChange={setName}
          error={errors.name}
          required
        />

        <AuthRoleSelect value={role} onChange={setRole} />

        <AuthInput
          label="Email"
          type="email"
          value={email}
          onChange={setEmail}
          error={errors.email}
          required
        />

        <AuthInput
          label="Senha"
          type="password"
          value={password}
          onChange={setPassword}
          error={errors.password}
          required
        />

        {errors.general && (
          <p className={styles.authError}>{errors.general}</p>
        )}

        <AuthButton type="submit" loading={loading}>
          Criar conta
        </AuthButton>
      </form>
    </AuthCard>
  )
}
