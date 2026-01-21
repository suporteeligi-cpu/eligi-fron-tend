'use client';

import Image from 'next/image';
import { useEffect, useState } from 'react';
import '@/app/components/auth/authform.css';
import AuthSwitcher from '@/app/components/auth/AuthSwitcher';

type UiState = 'idle' | 'loading' | 'error' | 'check-email';

export default function RegisterPage() {
  const [uiState, setUiState] = useState<UiState>('idle');
  const [error, setError] = useState<string | null>(null);
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');

  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
  });

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
        `${process.env.NEXT_PUBLIC_API_URL}/auth/register`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form),
        }
      );

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Erro no cadastro');
      }

      setUiState('check-email');
    } catch (err) {
      setUiState('error');
      setError(err instanceof Error ? err.message : 'Erro inesperado');
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

            {uiState === 'check-email' ? (
              <>
                <h2 className="authsheet-title">
                  Verifique seu e-mail 📧
                </h2>
                <p className="authsheet-message">
                  Enviamos instruções para concluir seu cadastro.
                </p>
              </>
            ) : (
              <>
                <AuthSwitcher />

                <h2 className="authsheet-title">Crie sua conta</h2>

                {error && (
                  <p className="authsheet-message">{error}</p>
                )}

                <form onSubmit={submit}>
                  <div className="authsheet-input">
                    <input
                      placeholder="Nome completo"
                      value={form.name}
                      onChange={e => update('name', e.target.value)}
                      required
                    />
                  </div>

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
                    />
                  </div>

                  <button
                    className={`authsheet-submit ${
                      uiState === 'loading' ? 'loading' : ''
                    }`}
                    disabled={uiState === 'loading'}
                  >
                    {uiState === 'loading'
                      ? <span className="authsheet-spinner" />
                      : 'Criar conta'}
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
