// src/features/fiscal/components/FiscalModule.tsx
'use client'

import { ReceiptText } from 'lucide-react'
import { useFiscal } from '../hooks/useFiscal'
import FiscalPaywall from './FiscalPaywall'
import FiscalCentral from './FiscalCentral'

export default function FiscalModule() {
  const { overview, billing, loading, error, refetch } = useFiscal()

  return (
    <div style={{ maxWidth: 1020, margin: '0 auto', padding: '24px 16px 90px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 24 }}>
        <div
          style={{
            width: 44,
            height: 44,
            borderRadius: 13,
            background: 'linear-gradient(135deg,#dc2626,#b91c1c)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <ReceiptText size={22} color="#fff" />
        </div>
        <div>
          <h1 style={{ fontSize: 21, fontWeight: 700, letterSpacing: '-0.3px', margin: 0 }}>
            Notas Fiscais
          </h1>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)', margin: '2px 0 0' }}>
            Emissão de NFS-e no padrão nacional
          </p>
        </div>
      </div>

      {loading && (
        <div style={{ textAlign: 'center', padding: '60px 0', color: 'rgba(255,255,255,0.5)', fontSize: 14 }}>
          Carregando…
        </div>
      )}

      {!loading && error && (
        <div
          style={{
            background: 'rgba(220,38,38,0.08)',
            border: '1px solid rgba(220,38,38,0.3)',
            borderRadius: 14,
            padding: 18,
            fontSize: 13.5,
            color: '#fca5a5',
          }}
        >
          {error}{' '}
          <button
            onClick={refetch}
            style={{
              background: 'none',
              border: 'none',
              color: '#fff',
              textDecoration: 'underline',
              cursor: 'pointer',
              fontSize: 13.5,
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
