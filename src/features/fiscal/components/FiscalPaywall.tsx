// src/features/fiscal/components/FiscalPaywall.tsx
'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ReceiptText } from 'lucide-react'
import api from '@/shared/lib/apiClient'
import { apiErrorMessage } from '../utils'

interface Props {
  hasSubscription: boolean
  onActivated: () => void
}

export default function FiscalPaywall({ hasSubscription, onActivated }: Props) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const activate = () => {
    if (busy) return
    setBusy(true)
    setError(null)
    api
      .post('/billing/nfse-addon', { enabled: true })
      .then(() => onActivated())
      .catch((err: unknown) => setError(apiErrorMessage(err)))
      .finally(() => setBusy(false))
  }

  return (
    <div
      style={{
        position: 'relative',
        borderRadius: 22,
        overflow: 'hidden',
        border: '1px solid rgba(255,255,255,0.09)',
      }}
    >
      {/* central "fantasma" borrada atrás do paywall */}
      <div style={{ filter: 'blur(5px)', opacity: 0.4, pointerEvents: 'none', padding: 24 }} aria-hidden>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: 12, marginBottom: 16 }}>
          {['Notas no mês', 'Valor emitido', 'Rejeitadas', 'Certificado'].map((label) => (
            <div
              key={label}
              style={{ background: 'rgba(255,255,255,0.045)', border: '1px solid rgba(255,255,255,0.09)', borderRadius: 16, padding: 18 }}
            >
              <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.6, color: 'rgba(255,255,255,0.4)' }}>{label}</div>
              <div style={{ fontSize: 23, fontWeight: 800, marginTop: 8 }}>···</div>
            </div>
          ))}
        </div>
        <div style={{ background: 'rgba(255,255,255,0.045)', border: '1px solid rgba(255,255,255,0.09)', borderRadius: 18, height: 220 }} />
      </div>

      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 20,
          background: 'radial-gradient(ellipse at center, rgba(10,10,15,0.55), rgba(10,10,15,0.9))',
        }}
      >
        <div
          style={{
            background: 'rgba(18,18,26,0.94)',
            border: '1px solid rgba(255,255,255,0.09)',
            borderRadius: 20,
            padding: '30px 30px 26px',
            maxWidth: 460,
            width: '100%',
            textAlign: 'center',
            backdropFilter: 'blur(30px)',
            boxShadow: '0 24px 70px rgba(0,0,0,0.5)',
          }}
        >
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 17,
              background: 'linear-gradient(135deg,#dc2626,#b91c1c)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px',
              boxShadow: '0 10px 30px rgba(220,38,38,0.4)',
            }}
          >
            <ReceiptText size={26} color="#fff" />
          </div>
          <h2 style={{ fontSize: 20, fontWeight: 800, letterSpacing: '-0.3px', margin: '0 0 8px' }}>
            Emita NFS-e direto do caixa
          </h2>
          <p style={{ fontSize: 13.5, color: 'rgba(255,255,255,0.6)', lineHeight: 1.55, margin: '0 0 18px' }}>
            Obrigatória pro Simples Nacional a partir de setembro/2026. Ative e cada atendimento
            fechado pode virar nota — automática, oficial, sem site de prefeitura.
          </p>
          <div style={{ fontSize: 15, marginBottom: 4 }}>
            <b style={{ fontSize: 30, fontWeight: 800, letterSpacing: '-0.8px' }}>R$ 29,90</b>/mês
          </div>
          <div style={{ fontSize: 11.5, color: 'rgba(255,255,255,0.4)', marginBottom: 20 }}>
            Entra na sua próxima fatura, junto com a assinatura · desative quando quiser
          </div>

          {error && (
            <div style={{ fontSize: 12.5, color: '#fca5a5', marginBottom: 12 }}>{error}</div>
          )}

          <button
            onClick={activate}
            disabled={busy || !hasSubscription}
            style={{
              background: 'linear-gradient(135deg,#dc2626,#b91c1c)',
              border: 'none',
              color: '#fff',
              fontSize: 14.5,
              fontWeight: 700,
              padding: '14px 36px',
              borderRadius: 13,
              cursor: busy || !hasSubscription ? 'not-allowed' : 'pointer',
              width: '100%',
              opacity: busy || !hasSubscription ? 0.55 : 1,
              boxShadow: '0 8px 28px rgba(220,38,38,0.35)',
            }}
          >
            {busy ? 'Ativando…' : 'Ativar por R$ 29,90/mês'}
          </button>

          {!hasSubscription && (
            <div style={{ fontSize: 12, color: '#fbbf24', marginTop: 12, lineHeight: 1.5 }}>
              Você precisa de uma assinatura ativa pra contratar o módulo.{' '}
              <Link href="/dashboard/configuracoes" style={{ color: '#fff', textDecoration: 'underline' }}>
                Ativar assinatura
              </Link>
            </div>
          )}

          <div style={{ fontSize: 11.5, color: 'rgba(255,255,255,0.4)', marginTop: 16, lineHeight: 1.7 }}>
            Você vai precisar de: Inscrição Municipal · certificado A1 (e-CNPJ) · município no
            padrão nacional
          </div>
        </div>
      </div>
    </div>
  )
}
