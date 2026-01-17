'use client'

import './authsheet.css'
import Image from 'next/image'
import { useEffect, useState } from 'react'

type Mode = 'login' | 'register'

type UiState =
  | 'idle'
  | 'loading'
  | 'error'
  | 'check-email'
  | 'reset-sent'

interface AuthSheetProps {
  open: boolean
  onClose: () => void

  /** modo direto (usado por /login e /register) */
  mode?: Mode

  /** compatibilidade com uso antigo */
  initialMode?: Mode
}

export default function AuthSheet({
  open,
  onClose,
  mode,
  initialMode = 'login',
}: AuthSheetProps) {
  const resolvedMode: Mode = mode ?? initialMode ?? 'login'

  const [currentMode, setCurrentMode] = useState<Mode>(resolvedMode)
  const [uiState, setUiState] = useState<UiState>('idle')
  const [error, setError] = useState<string | null>(null)

  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
  })

  /* ======================================================
     Sync externo de modo (login / register)
  ====================================================== */
  useEffect(() => {
    setCurrentMode(resolvedMode)
    setUiState('idle')
    setError(null)
    setForm({ name: '', email: '', password: '' })
  }, [resolvedMode])

  if (!open) return null

  function update(field: keyof typeof form, value: string) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()

    setUiState('loading')
    setError(null)

    try {
      const endpoint =
        currentMode === 'login'
          ? '/auth/login'
          : '/auth/register'

      const payload =
        currentMode === 'login'
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
        throw new Error(errData.error || 'Falha na autenticação')
      }

      if (currentMode === 'register') {
        setUiState('check-email')
        return
      }

      const tokens = await res.json()

      localStorage.setItem('accessToken', tokens.accessToken)
      localStorage.setItem('refreshToken', tokens.refreshToken)

      window.location.href = '/app'
    } catch (err) {
      setUiState('error')
      setError(
        err instanceof Error
          ? err.message
          : 'Erro inesperado'
      )
    }
  }

  /* ======================================================
     RESET PASSWORD
  ====================================================== */
  async function sendResetPassword() {
    setUiState('loading')
    setError(null)

    try {
      await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/auth/forgot-password`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: form.email }),
        }
      )

      setUiState('reset-sent')
    } catch {
      setUiState('error')
      setError('Erro ao enviar link de redefinição')
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

            {/* CHECK EMAIL */}
            {uiState === 'check-email' && (
              <>
                <h2 className="authsheet-title">
                  Verifique seu e-mail 📧
                </h2>
                <p className="authsheet-message">
                  Enviamos instruções para concluir seu cadastro.
                </p>
              </>
            )}

            {/* RESET SENT */}
            {uiState === 'reset-sent' && (
              <>
                <h2 className="authsheet-title">
                  Link enviado 🔐
                </h2>
                <p className="authsheet-message">
                  Verifique seu e-mail para redefinir a senha.
                </p>
              </>
            )}

            {(uiState !== 'check-email' &&
              uiState !== 'reset-sent') && (
              <>
                {/* TABS */}
                <div className="authsheet-tabs">
                  <button
                    type="button"
                    className={currentMode === 'login' ? 'active' : ''}
                    onClick={() => setCurrentMode('login')}
                  >
                    Entrar
                  </button>

                  <button
                    type="button"
                    className={currentMode === 'register' ? 'active' : ''}
                    onClick={() => setCurrentMode('register')}
                  >
                    Criar conta
                  </button>
                </div>

                <h2 className="authsheet-title">
                  {currentMode === 'login'
                    ? 'Bem-vindo de volta'
                    : 'Crie sua conta'}
                </h2>

                {error && (
                  <div className="authsheet-error">
                    {error}
                  </div>
                )}

                <form onSubmit={submit}>
                  {/* NAME */}
                  {currentMode === 'register' && (
                    <div className="authsheet-input authsheet-input-clearable">
                      <input
                        placeholder="Nome completo"
                        value={form.name}
                        onChange={e =>
                          update('name', e.target.value)
                        }
                        required
                      />

                      {form.name && (
                        <button
                          type="button"
                          className="authsheet-clear"
                          onClick={() => update('name', '')}
                          aria-label="Limpar nome"
                        >
                          ×
                        </button>
                      )}
                    </div>
                  )}

                  {/* EMAIL */}
                  <div className="authsheet-input authsheet-input-clearable">
                    <input
                      type="email"
                      placeholder="E-mail"
                      value={form.email}
                      onChange={e =>
                        update('email', e.target.value)
                      }
                      required
                    />

                    {form.email && (
                      <button
                        type="button"
                        className="authsheet-clear"
                        onClick={() => update('email', '')}
                        aria-label="Limpar e-mail"
                      >
                        ×
                      </button>
                    )}
                  </div>

                  {/* PASSWORD */}
                  <div className="authsheet-input authsheet-input-clearable">
                    <input
                      type="password"
                      placeholder="Senha"
                      value={form.password}
                      onChange={e =>
                        update('password', e.target.value)
                      }
                      required
                      minLength={6}
                    />

                    {form.password && (
                      <button
                        type="button"
                        className="authsheet-clear"
                        onClick={() => update('password', '')}
                        aria-label="Limpar senha"
                      >
                        ×
                      </button>
                    )}
                  </div>

                  {currentMode === 'login' && (
                    <button
                      type="button"
                      className="authsheet-link"
                      onClick={sendResetPassword}
                    >
                      Esqueci minha senha
                    </button>
                  )}

                  <button
                    className="authsheet-submit"
                    disabled={uiState === 'loading'}
                  >
                    {uiState === 'loading'
                      ? 'Processando…'
                      : currentMode === 'login'
                      ? 'Entrar'
                      : 'Criar conta'}
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
