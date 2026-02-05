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
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
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

      if (me.role === 'BUSINESS_OWNER') {
        router.push('/onboarding')
      }

      if (me.role === 'AFFILIATE') {
        router.push('/dashboard')
      }
    } catch {
      setError('Erro ao criar conta. Verifique os dados.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthCard
      title="Criar conta no ELIGI"
      subtitle="Comece agora a organizar seu negócio"
    >
      <form className={styles.form} onSubmit={handleSubmit}>
        <AuthInput
          label="Nome completo"
          value={name}
          onChange={e => setName(e.target.value)}
          required
        />

        <AuthRoleSelect value={role} onChange={setRole} />

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

        {error && <p className={styles.error}>{error}</p>}

        <AuthButton type="submit" loading={loading}>
          Criar conta
        </AuthButton>

        <button
          type="button"
          className={styles.link}
          onClick={() => router.push('/login')}
        >
          Já tenho conta
        </button>
      </form>
    </AuthCard>
  )
}
