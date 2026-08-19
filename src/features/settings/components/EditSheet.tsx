'use client';

// src/features/settings/components/EditSheet.tsx
//
// @eligi:edit-sheet-modulo
// Folha de edicao do mobile: um assunto por vez, titulo grande, e um botao que
// diz o que faz ("Salvar endereço", nao "Salvar").
//
// REGRAS DE LAYOUT DO PROJETO (nao negociaveis)
// - Topo respeita a navbar fixa (104px) e a base respeita o bottom-nav
//   (64px + safe-area). Modal que cobre a navegacao prende o usuario.
// - A animacao de entrada NAO vai no elemento `position: fixed`. No Android
//   Chrome, transform com animation-fill-mode:both em fixed desposiciona a
//   folha. Ela vive num filho `position: relative`.

import { useEffect } from 'react';
import { X, Check, Loader2, AlertTriangle } from 'lucide-react';

const NAVBAR_H = 104;
const BOTTOM_NAV_H = 64;

interface Props {
  title: string;
  subtitle?: string;
  eyebrow?: string;
  icon?: React.ReactNode;
  saveLabel: string;
  saving?: boolean;
  error?: string | null;
  onSave: () => void;
  onClose: () => void;
  children: React.ReactNode;
}

export function EditSheet({
  title, subtitle, eyebrow = 'Você está editando', icon,
  saveLabel, saving = false, error, onSave, onClose, children,
}: Props) {
  // Esc fecha; o body para de rolar atras da folha.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  return (
    <>
      <style>{`
        @keyframes eligi-sheet-up { from { transform: translateY(16px); opacity: 0 } to { transform: translateY(0); opacity: 1 } }
        @keyframes eligi-scrim-in { from { opacity: 0 } to { opacity: 1 } }
        @keyframes eligi-spin { to { transform: rotate(360deg) } }
        @media (prefers-reduced-motion: reduce) {
          .eligi-sheet-anim { animation: none !important }
        }
      `}</style>

      <div
        onClick={onClose}
        style={{
          position: 'fixed',
          left: 0,
          right: 0,
          top: NAVBAR_H,
          bottom: `calc(${BOTTOM_NAV_H}px + env(safe-area-inset-bottom, 0px))`,
          background: 'rgba(12,12,18,0.34)',
          backdropFilter: 'blur(2px)',
          zIndex: 10998,
          animation: 'eligi-scrim-in 0.22s ease',
        }}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        style={{
          position: 'fixed',
          left: 0,
          right: 0,
          bottom: `calc(${BOTTOM_NAV_H}px + env(safe-area-inset-bottom, 0px))`,
          zIndex: 10999,
          maxHeight: `calc(100dvh - ${NAVBAR_H + BOTTOM_NAV_H}px - env(safe-area-inset-bottom, 0px))`,
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <div
          className="eligi-sheet-anim"
          style={{
            position: 'relative',
            display: 'flex',
            flexDirection: 'column',
            minHeight: 0,
            maxHeight: '100%',
            background: '#fff',
            borderRadius: '24px 24px 0 0',
            boxShadow: '0 -18px 46px rgba(12,12,18,0.20)',
            animation: 'eligi-sheet-up 0.28s cubic-bezier(0.2,0.8,0.2,1)',
            fontFamily: '-apple-system,"SF Pro Display",system-ui,sans-serif',
          }}
        >
          <div style={{ padding: '10px 0 0', flex: 'none' }}>
            <div style={{ width: 40, height: 5, borderRadius: 3, background: '#d8d8dd', margin: '0 auto' }} />
          </div>

          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '12px 18px 0', flex: 'none' }}>
            {icon && (
              <span style={{ width: 38, height: 38, borderRadius: 11, background: 'rgba(220,38,38,0.08)', color: '#dc2626', display: 'grid', placeItems: 'center', flex: 'none' }}>
                {icon}
              </span>
            )}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: 'rgba(0,0,0,0.42)' }}>
                {eyebrow}
              </div>
              <h2 style={{ margin: '2px 0 0', fontSize: 24, fontWeight: 800, letterSpacing: '-0.03em', color: '#0f0f14', lineHeight: 1.15 }}>
                {title}
              </h2>
              {subtitle && (
                <p style={{ margin: '6px 0 0', fontSize: 13, lineHeight: 1.45, color: 'rgba(0,0,0,0.5)' }}>
                  {subtitle}
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Fechar"
              style={{ width: 40, height: 40, borderRadius: '50%', border: 'none', background: '#f1f1f4', color: '#52525b', display: 'grid', placeItems: 'center', cursor: 'pointer', flex: 'none', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }}
            >
              <X size={18} />
            </button>
          </div>

          <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', WebkitOverflowScrolling: 'touch', padding: '4px 18px 8px' }}>
            {children}
          </div>

          <div style={{ flex: 'none', padding: '12px 18px 18px', borderTop: '1px solid #f1f1f4', background: '#fff' }}>
            {error && (
              <div style={{ display: 'flex', gap: 9, alignItems: 'flex-start', background: '#fef2f2', border: '1px solid #fecaca', color: '#991b1b', borderRadius: 11, padding: '10px 12px', fontSize: 12, fontWeight: 600, marginBottom: 10, lineHeight: 1.45 }}>
                <AlertTriangle size={15} style={{ flex: 'none', marginTop: 1 }} />
                <span>{error}</span>
              </div>
            )}
            <button
              type="button"
              onClick={onSave}
              disabled={saving}
              style={{
                width: '100%',
                minHeight: 52,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 9,
                background: 'linear-gradient(135deg,#dc2626,#b91c1c)',
                color: '#fff',
                fontWeight: 700,
                fontSize: 16,
                borderRadius: 14,
                border: 'none',
                cursor: saving ? 'default' : 'pointer',
                opacity: saving ? 0.7 : 1,
                fontFamily: 'inherit',
                touchAction: 'manipulation',
                WebkitTapHighlightColor: 'transparent',
              }}
            >
              {saving ? <Loader2 size={17} style={{ animation: 'eligi-spin 1s linear infinite' }} /> : <Check size={17} />}
              {saving ? 'Salvando…' : saveLabel}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

export default EditSheet;
