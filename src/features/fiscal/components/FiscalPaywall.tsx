// src/features/fiscal/components/FiscalPaywall.tsx
'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ReceiptText } from 'lucide-react'
import api from '@/shared/lib/apiClient'
import { colors, glassCard, inkLight, radius, shadows } from '@/shared/theme'
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
    <div style={{ position: 'relative', borderRadius: radius['2xl'], overflow: 'hidden' }}>
      {/* prévia borrada da central */}
      <div style={{ filter: 'blur(5px)', opacity: 0.5, pointerEvents: 'none', padding: 22 }} aria-hidden>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: 12, marginBottom: 14 }}>
          {['Notas no mês', 'Valor emitido', 'Rejeitadas'].map((label) => (
            <div key={label} style={{ ...glassCard, padding: '16px 18px' }}>
              <div style={{ fontSize: 12, color: inkLight.label, marginBottom: 6 }}>{label}</div>
              <div style={{ fontSize: 26, fontWeight: 600, color: inkLight.strong }}>···</div>
            </div>
          ))}
        </div>
        <div style={{ ...glassCard, height: 230 }} />
      </div>

      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 20,
          background: 'linear-gradient(180deg, rgba(245,245,247,0.55), rgba(245,245,247,0.88))',
        }}
      >
        <div
          style={{
            background: 'rgba(255,255,255,0.94)',
            backdropFilter: 'blur(32px) saturate(160%)',
            WebkitBackdropFilter: 'blur(32px) saturate(160%)',
            border: `1px solid ${colors.gray.border}`,
            borderRadius: radius['2xl'],
            boxShadow: shadows.lg,
            padding: '30px 30px 26px',
            maxWidth: 470,
            width: '100%',
            textAlign: 'center',
          }}
        >
          <div
            style={{
              width: 54,
              height: 54,
              borderRadius: 16,
              background: colors.red.gradient,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 15px',
              boxShadow: shadows.redMd,
            }}
          >
            <ReceiptText size={25} color="#fff" />
          </div>

          <h2 style={{ fontSize: 21, fontWeight: 700, color: inkLight.strong, margin: '0 0 8px', letterSpacing: '-0.2px' }}>
            Emita NFS-e direto do caixa
          </h2>
          <p style={{ fontSize: 13.5, color: inkLight.label, lineHeight: 1.55, margin: '0 0 18px' }}>
            Obrigatória pro Simples Nacional a partir de setembro/2026. Ative e cada atendimento
            fechado pode virar nota — automática, oficial, sem site de prefeitura.
          </p>

          <div style={{ fontSize: 15, color: inkLight.label, marginBottom: 4 }}>
            <b style={{ fontSize: 30, fontWeight: 700, color: inkLight.strong, letterSpacing: '-0.8px' }}>R$ 29,90</b>
            /mês
          </div>
          <div style={{ fontSize: 11.5, color: inkLight.faint, marginBottom: 20 }}>
            Entra na sua próxima fatura, junto com a assinatura · desative quando quiser
          </div>

          {error && <div style={{ fontSize: 12.5, color: inkLight.bad.text, marginBottom: 12 }}>{error}</div>}

          <button
            onClick={activate}
            disabled={busy || !hasSubscription}
            style={{
              width: '100%',
              background: busy || !hasSubscription ? 'rgba(0,0,0,0.07)' : colors.red.gradient,
              color: busy || !hasSubscription ? inkLight.faint : '#fff',
              border: 'none',
              borderRadius: radius.md,
              padding: '14px 32px',
              fontSize: 14.5,
              fontWeight: 700,
              fontFamily: 'inherit',
              cursor: busy || !hasSubscription ? 'not-allowed' : 'pointer',
              boxShadow: busy || !hasSubscription ? 'none' : shadows.redMd,
            }}
          >
            {busy ? 'Ativando…' : 'Ativar por R$ 29,90/mês'}
          </button>

          {!hasSubscription && (
            <div style={{ fontSize: 12, color: inkLight.warn.text, marginTop: 12, lineHeight: 1.5 }}>
              Você precisa de uma assinatura ativa pra contratar o módulo.{' '}
              <Link href="/dashboard/configuracoes" style={{ color: colors.red.DEFAULT, textDecoration: 'underline' }}>
                Ativar assinatura
              </Link>
            </div>
          )}

          <div style={{ fontSize: 11.5, color: inkLight.faint, marginTop: 16, lineHeight: 1.7 }}>
            Você vai precisar de: Inscrição Municipal · certificado A1 (e-CNPJ) · município no padrão nacional
          </div>
        </div>
      </div>
    </div>
  )
}
