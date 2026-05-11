'use client'

import { CreditCard } from 'lucide-react'

export default function FinanceiroPage() {
  return (
    <>
      <style>{`
        @keyframes eligi-fade-up {
          from { opacity: 0; transform: translateY(14px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes eligi-pulse-dot {
          0%, 100% { opacity: 1; transform: scale(1); }
          50%       { opacity: 0.5; transform: scale(0.85); }
        }
      `}</style>

      <div style={{
        display: 'flex', flexDirection: 'column', gap: '28px',
        animation: 'eligi-fade-up 400ms cubic-bezier(0.22,1,0.36,1) both',
      }}>
        <div>
          <h2 style={{
            fontSize: '22px', fontWeight: 700, letterSpacing: '-0.025em',
            color: 'var(--text-primary, #0f0f14)', margin: 0, lineHeight: 1.2,
          }}>
            Financeiro
          </h2>
          <p style={{ fontSize: '14px', color: 'var(--text-secondary, #6b7280)', marginTop: '4px' }}>
            Visão financeira do seu negócio.
          </p>
        </div>

        <div style={{
          background: 'rgba(255,255,255,0.72)',
          backdropFilter: 'blur(20px) saturate(160%)',
          WebkitBackdropFilter: 'blur(20px) saturate(160%)',
          borderRadius: '20px',
          border: '1px solid rgba(255,255,255,0.60)',
          boxShadow: '0 2px 0 rgba(255,255,255,0.85) inset, 0 8px 28px rgba(0,0,0,0.06)',
          padding: '64px 32px',
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          gap: '16px', textAlign: 'center', minHeight: '340px',
        }}>
          <div style={{
            width: '56px', height: '56px', borderRadius: '16px',
            background: 'linear-gradient(145deg,#ef4444 0%,#dc2626 60%,#b91c1c 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 8px 24px rgba(220,38,38,0.28)',
          }}>
            <CreditCard size={26} color="#fff" />
          </div>

          <div>
            <h3 style={{
              fontSize: '18px', fontWeight: 700, letterSpacing: '-0.02em',
              color: 'var(--text-primary, #0f0f14)', margin: '0 0 6px',
            }}>
              Módulo em desenvolvimento
            </h3>
            <p style={{
              fontSize: '14px', color: 'var(--text-secondary, #6b7280)',
              maxWidth: '360px', lineHeight: 1.6,
            }}>
              Faturamento, repasses e relatórios financeiros chegam em breve.
            </p>
          </div>

          <div style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            padding: '8px 14px', borderRadius: '999px',
            background: 'rgba(220,38,38,0.07)',
            border: '1px solid rgba(220,38,38,0.15)',
          }}>
            <span style={{
              width: '7px', height: '7px', borderRadius: '50%',
              background: '#dc2626',
              animation: 'eligi-pulse-dot 1.6s ease-in-out infinite',
              display: 'inline-block',
            }} />
            <span style={{ fontSize: '13px', fontWeight: 600, color: '#dc2626' }}>
              Em breve
            </span>
          </div>
        </div>
      </div>
    </>
  )
}