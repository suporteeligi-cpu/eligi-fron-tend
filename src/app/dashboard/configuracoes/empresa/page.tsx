'use client'
// src/app/dashboard/configuracoes/empresa/page.tsx

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Loader2 } from 'lucide-react'
import api from '@/shared/lib/apiClient'

import TimezoneCard from './components/TimezoneCard'

interface BusinessSettings {
  id:       string
  name:     string
  timezone: string
}

export default function EmpresaPage() {
  const router = useRouter()
  const [data, setData]       = useState<BusinessSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState<string | null>(null)

  const fetch = useCallback(async () => {
    try {
      setError(null)
      const res = await api.get('/business-settings')
      setData(res.data?.data ?? null)
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: string } } }
      setError(e.response?.data?.error ?? 'Erro ao carregar')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetch() }, [fetch])

  return (
    <>
      <style>{`
        @keyframes fadeUp { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes pos-spin { to { transform: rotate(360deg); } }
      `}</style>

      <div style={{
        maxWidth: 720,
        animation: 'fadeUp 0.3s ease',
        fontFamily: '-apple-system,"SF Pro Display",system-ui,sans-serif',
      }}>
        <button
          onClick={() => router.push('/dashboard/configuracoes')}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            background: 'transparent',
            border: 'none',
            color: 'rgba(0,0,0,0.45)',
            fontSize: 13,
            cursor: 'pointer',
            padding: 0,
            marginBottom: 8,
            fontFamily: 'inherit',
          }}
        >
          <ArrowLeft size={13} />
          Configurações
        </button>

        <div style={{ marginBottom: 24 }}>
          <h2 style={{
            margin: 0,
            fontSize: 22,
            fontWeight: 700,
            letterSpacing: '-0.025em',
            color: '#0f0f14',
          }}>
            Detalhes da empresa
          </h2>
          <p style={{
            margin: '4px 0 0',
            fontSize: 14,
            color: 'rgba(0,0,0,0.45)',
          }}>
            Configure as informações principais do seu negócio.
          </p>
        </div>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
            <Loader2 size={24} style={{ animation: 'pos-spin 0.8s linear infinite', color: '#dc2626' }} />
          </div>
        ) : error || !data ? (
          <div style={{
            padding: '14px 16px',
            background: 'rgba(220,38,38,0.06)',
            border: '1px solid rgba(220,38,38,0.18)',
            borderRadius: 11,
            color: '#dc2626',
            fontSize: 13,
            textAlign: 'center',
          }}>
            {error ?? 'Erro ao carregar configurações'}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <TimezoneCard
              initialTimezone={data.timezone}
              onSaved={(tz) => setData(d => d ? { ...d, timezone: tz } : d)}
            />

            {/* Placeholder pra futuras seções */}
            <div style={{
              padding: '16px 20px',
              background: 'rgba(255,255,255,0.6)',
              borderRadius: 14,
              border: '1px dashed rgba(0,0,0,0.10)',
              fontSize: 12,
              color: 'rgba(0,0,0,0.45)',
              textAlign: 'center',
            }}>
              Outras configurações (nome, endereço, logo) em breve.
            </div>
          </div>
        )}
      </div>
    </>
  )
}
