'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Home, Bike, Loader2 } from 'lucide-react';
import { getMe } from '@/lib/auth.api';
import api from '@/shared/lib/apiClient';

type Mode = 'FIXED' | 'MOBILE';

export default function DefinirAtendimentoPage() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [saving, setSaving] = useState<Mode | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Guard: só SOLO sem serviceMode definido fica aqui; resto vai pro dashboard.
  useEffect(() => {
    let cancelled = false;
    async function sync() {
      try {
        const me = await getMe();
        if (cancelled) return;
        if (me.journeyType !== 'SOLO' || me.serviceMode != null || !me.onboardingDone) {
          router.replace('/dashboard');
          return;
        }
        setChecking(false);
      } catch {
        if (!cancelled) router.replace('/login');
      }
    }
    sync();
    return () => {
      cancelled = true;
    };
  }, [router]);

  async function choose(mode: Mode) {
    if (saving) return;
    setSaving(mode);
    setError(null);
    try {
      await api.post('/onboarding/service-mode', { serviceMode: mode });
      router.replace('/dashboard');
    } catch {
      setError('Não foi possível salvar agora. Tente novamente.');
      setSaving(null);
    }
  }

  if (checking) {
    return (
      <div style={S.center}>
        <style>{`@keyframes eligi-spin { to { transform: rotate(360deg); } }`}</style>
        <div style={S.spinner} />
      </div>
    );
  }

  return (
    <div style={S.root}>
      <div style={S.glow} />
      <div style={S.shell}>
        <span style={S.wordmark}>eligi</span>
        <h1 style={S.title}>Como você atende?</h1>
        <p style={S.subtitle}>
          Falta só isso pra deixar seu perfil completo. Você pode mudar depois nas configurações.
        </p>

        <div style={S.cards}>
          <button
            type="button"
            onClick={() => choose('FIXED')}
            disabled={!!saving}
            style={{ ...S.card, ...(saving === 'FIXED' ? S.cardActive : {}) }}
          >
            <span style={S.cardIcon}>
              {saving === 'FIXED' ? (
                <Loader2 size={26} style={{ animation: 'eligi-spin 1s linear infinite' }} />
              ) : (
                <Home size={26} />
              )}
            </span>
            <span style={S.cardTitle}>Tenho um local fixo</span>
            <span style={S.cardDesc}>Meus clientes vão até o meu endereço</span>
          </button>

          <button
            type="button"
            onClick={() => choose('MOBILE')}
            disabled={!!saving}
            style={{ ...S.card, ...(saving === 'MOBILE' ? S.cardActive : {}) }}
          >
            <span style={S.cardIcon}>
              {saving === 'MOBILE' ? (
                <Loader2 size={26} style={{ animation: 'eligi-spin 1s linear infinite' }} />
              ) : (
                <Bike size={26} />
              )}
            </span>
            <span style={S.cardTitle}>Atendo a domicílio</span>
            <span style={S.cardDesc}>Eu vou até o cliente</span>
          </button>
        </div>

        {error && <p style={S.error}>{error}</p>}
      </div>
      <style>{`@keyframes eligi-spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

const S: Record<string, React.CSSProperties> = {
  root: {
    minHeight: '100dvh',
    background: '#0a0a0f',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
    padding: 20,
  },
  glow: {
    position: 'absolute',
    top: '-20%',
    left: '50%',
    transform: 'translateX(-50%)',
    width: 600,
    height: 600,
    borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(220,38,38,0.18) 0%, rgba(220,38,38,0) 70%)',
    pointerEvents: 'none',
  },
  shell: {
    position: 'relative',
    zIndex: 1,
    width: '100%',
    maxWidth: 460,
    textAlign: 'center',
  },
  wordmark: {
    fontSize: 22,
    fontWeight: 700,
    letterSpacing: '-0.02em',
    color: '#fff',
    display: 'block',
    marginBottom: 28,
  },
  title: {
    fontSize: 26,
    fontWeight: 600,
    color: '#fff',
    margin: 0,
    letterSpacing: '-0.02em',
  },
  subtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.55)',
    marginTop: 10,
    marginBottom: 28,
    lineHeight: 1.5,
  },
  cards: {
    display: 'flex',
    gap: 14,
    flexWrap: 'wrap',
  },
  card: {
    flex: '1 1 180px',
    minWidth: 160,
    padding: '24px 18px',
    borderRadius: 18,
    border: '1px solid rgba(255,255,255,0.1)',
    background: 'rgba(255,255,255,0.03)',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 10,
    color: '#fff',
  },
  cardActive: {
    border: '1.5px solid #dc2626',
    background: 'rgba(220,38,38,0.08)',
  },
  cardIcon: {
    width: 52,
    height: 52,
    borderRadius: 14,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'rgba(220,38,38,0.12)',
    color: '#dc2626',
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: 600,
    color: '#fff',
  },
  cardDesc: {
    fontSize: 12.5,
    color: 'rgba(255,255,255,0.5)',
    lineHeight: 1.4,
  },
  error: {
    color: '#f87171',
    fontSize: 13,
    marginTop: 18,
  },
  center: {
    minHeight: '100dvh',
    background: '#0a0a0f',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  spinner: {
    width: 40,
    height: 40,
    borderRadius: '50%',
    border: '3px solid rgba(220,38,38,0.18)',
    borderTop: '3px solid #dc2626',
    animation: 'eligi-spin 0.9s linear infinite',
  },
};
