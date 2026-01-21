'use client';

import Image from 'next/image';
import { useEffect, useState } from 'react';
import '@/app/components/auth/authform.css';
import AuthSwitcher from '@/app/components/auth/AuthSwitcher';


type UiState = 'idle' | 'loading' | 'error' | 'reset-sent';

export default function LoginPage() {
  const [uiState, setUiState] = useState<UiState>('idle');
  const [error, setError] = useState<string | null>(null);
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');

  const [form, setForm] = useState({
    email: '',
    password: '',
  });

  /* ===== Theme sync (igual ao original) ===== */
  useEffect(() => {
    const root = document.documentElement;

    const sync = () => {
      setTheme(
        (root.getAttribute('data-theme') as 'light' | 'dark') ?? 'dark'
      );
    };

    sync();

    const obs = new MutationObserver(sync);
    obs.observe(root, { attributes: true, attributeFilter: ['data-theme'] });

    return () => obs.disconnect();
  }, []);

  function update(field: keyof typeof form, value: string) {
    setForm(prev => ({ ...prev, [field]: value }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setUiState('loading');
    setError(null);

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/auth/login`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form),
        }
      );

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Falha no login');
      }

      const tokens = await res.json();
      localStorage.setItem('accessToken', tokens.accessToken);
      localStorage.setItem('refreshToken', tokens.refreshToken);
      window.location.href = '/app';
    } catch (err) {
      setUiState('error');
      setError(err instanceof Error ? err.message : 'Erro inesperado');
    }
  }

  async function sendReset() {
    setUiState('loading');
    setError(null);

    try {
      await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/auth/forgot-password`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: form.email }),
        }
      );
      setUiState('reset-sent');
    } catch {
      setUiState('error');
      setError('Erro ao enviar link');
    }
  }

  const logoSrc =
    theme === 'dark'
      ? '/images/logo.branco.png'
      : '/images/logo.png';

  return (
    <div className="authsheet-root is-open">
      <div className="authsheet-overlay">
        <div className="authsheet-panel">
          <div className="authsheet-card">
            <div className="authsheet-logo">
              <Image src={logoSrc} alt="ELIGI" width={96} height={96} />
            </div>
            
            <AuthSwitcher />

            
            <h2 className="authsheet-title">Bem-vindo de volta</h2>

            {error && <p className="authsheet-message">{error}</p>}
            {uiState === 'reset-sent' && (
              <p className="authsheet-message">
                Verifique seu e-mail 🔐
              </p>
            )}

            <form onSubmit={submit}>
              <div className="authsheet-input authsheet-input-clearable">
                <input
                  type="email"
                  placeholder="E-mail"
                  value={form.email}
                  onChange={e => update('email', e.target.value)}
                  required
                />
              </div>

              <div className="authsheet-input authsheet-input-clearable">
                <input
                  type="password"
                  placeholder="Senha"
                  value={form.password}
                  onChange={e => update('password', e.target.value)}
                  required
                />
              </div>

              <button
                type="button"
                className="authsheet-link"
                onClick={sendReset}
              >
                Esqueci minha senha
              </button>

              <button
                className={`authsheet-submit ${
                  uiState === 'loading' ? 'loading' : ''
                }`}
                disabled={uiState === 'loading'}
              >
                {uiState === 'loading'
                  ? <span className="authsheet-spinner" />
                  : 'Entrar'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
