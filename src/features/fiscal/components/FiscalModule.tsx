// src/features/fiscal/components/FiscalModule.tsx
'use client'

import { ReceiptText } from 'lucide-react'
import { colors, inkLight } from '@/shared/theme'
import { useFiscal } from '../hooks/useFiscal'
import FiscalPaywall from './FiscalPaywall'
import FiscalCentral from './FiscalCentral'

// respeita a navbar fixa (regra permanente do eligi)
const NAVBAR_OFFSET = 104

export default function FiscalModule() {
  const { overview, billing, loading, error, refetch } = useFiscal()

  return (
    <div style={{ maxWidth: 1180, margin: '0 auto', padding: '0 20px', paddingTop: NAVBAR_OFFSET + 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 13, marginBottom: 20 }}>
        <div
          style={{
            width: 42,
            height: 42,
            borderRadius: 13,
            background: colors.red.gradient,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 3px 10px rgba(220,38,38,0.22)',
            flexShrink: 0,
          }}
        >
          <ReceiptText size={21} color="#fff" />
        </div>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 700, color: inkLight.strong, margin: 0, lineHeight: 1.15 }}>
            Notas Fiscais
          </h1>
          <p style={{ fontSize: 13, color: inkLight.label, margin: '2px 0 0' }}>
            Emissão de NFS-e no padrão nacional
          </p>
        </div>
      </div>

      {loading && (
        <div style={{ padding: 60, textAlign: 'center', color: inkLight.faint, fontSize: 14 }}>Carregando…</div>
      )}

      {!loading && error && (
        <div
          style={{
            background: inkLight.bad.bg,
            border: `1px solid ${inkLight.bad.border}`,
            borderRadius: 14,
            padding: 18,
            fontSize: 13.5,
            color: inkLight.bad.text,
          }}
        >
          {error}{' '}
          <button
            onClick={refetch}
            style={{
              background: 'none',
              border: 'none',
              color: inkLight.strong,
              textDecoration: 'underline',
              cursor: 'pointer',
              fontSize: 13.5,
              fontFamily: 'inherit',
            }}
          >
            Tentar de novo
          </button>
        </div>
      )}

      {!loading && !error && !billing.nfseAddon && (
        <FiscalPaywall hasSubscription={billing.hasSubscription} onActivated={refetch} />
      )}

      {!loading && !error && billing.nfseAddon && overview && (
        <FiscalCentral overview={overview} onChanged={refetch} />
      )}
    </div>
  )
}
