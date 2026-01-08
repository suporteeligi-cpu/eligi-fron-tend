'use client'

import './authsheet.css'
import Image from 'next/image'
import { useEffect, useState } from 'react'

type Mode = 'login' | 'register'

interface AuthSheetProps {
  open: boolean
  onClose: () => void
  initialMode?: Mode
}

export default function AuthSheet({
  open,
  onClose,
  initialMode = 'login',
}: AuthSheetProps) {
  const [mode, setMode] = useState<Mode>(initialMode)
  const [loading, setLoading] = useState(false)

  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
  })

  useEffect(() => {
    setMode(initialMode)
  }, [initialMode])

  if (!open) return null

  function update(field: keyof typeof form, value: string) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)

    try {
      const endpoint =
        mode === 'login'
          ? '/auth/login'
          : '/auth/register'

      const payload =
        mode === 'login'
          ? { email: form.email, password: form.password }
          : form

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}${endpoint}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        }
      )

      if (!res.ok) {
        const errData = await res.json()
        throw new Error(errData.error || 'Erro ao autenticar')
      }

      const tokens = await res.json()

      localStorage.setItem('accessToken', tokens.accessToken)
      localStorage.setItem('refreshToken', tokens.refreshToken)

      window.location.href = '/app'
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Erro inesperado')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="authsheet-root">
      <div className="authsheet-overlay" onClick={onClose}>
        <div
          className="authsheet-panel"
          onClick={e => e.stopPropagation()}
        >
          <div className="authsheet-card">
            {/* LOGO */}
            <div className="authsheet-logo">
              <Image
                src="/images/logo.png"
                alt="ELIGI"
                width={96}
                height={96}
                priority
                draggable={false}
              />
            </div>

            {/* TABS */}
            <div className="authsheet-tabs">
              <button
                className={mode === 'login' ? 'active' : ''}
                onClick={() => setMode('login')}
                type="button"
              >
                Entrar
              </button>
              <button
                className={mode === 'register' ? 'active' : ''}
                onClick={() => setMode('register')}
                type="button"
              >
                Criar conta
              </button>
            </div>

            {/* TITLE */}
            <h2 className="authsheet-title">
              {mode === 'login'
                ? 'Bem-vindo de volta'
                : 'Criar nova conta'}
            </h2>

            {/* FORM */}
            <form onSubmit={submit}>
              {mode === 'register' && (
                <div className="authsheet-input">
                  <input
                    placeholder="Nome completo"
                    value={form.name}
                    onChange={e => update('name', e.target.value)}
                    required
                  />
                </div>
              )}

              <div className="authsheet-input">
                <input
                  type="email"
                  placeholder="E-mail"
                  value={form.email}
                  onChange={e => update('email', e.target.value)}
                  required
                />
              </div>

              <div className="authsheet-input">
                <input
                  type="password"
                  placeholder="Senha"
                  value={form.password}
                  onChange={e => update('password', e.target.value)}
                  required
                  minLength={6}
                />
              </div>

              <button
                className="authsheet-submit"
                disabled={loading}
              >
                {loading
                  ? 'Carregando…'
                  : mode === 'login'
                  ? 'Entrar'
                  : 'Criar conta'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
