'use client'
// src/app/dashboard/configuracoes/empresa/page.tsx

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Loader2, Palette, ChevronDown } from 'lucide-react'
import api from '@/shared/lib/apiClient'
import { type BusinessTheme } from '@/shared/profileTheme'

import TimezoneCard from './components/TimezoneCard'
import ProfileThemeEditor from '@/features/settings/components/ProfileThemeEditor'

interface BusinessSettings {
  id:       string
  name:     string
  timezone: string
  theme:    BusinessTheme
  logoUrl:  string | null
  coverUrl: string | null
}

export default function EmpresaPage() {
  const router = useRouter()
  const [data, setData]       = useState<BusinessSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState<string | null>(null)
  const [showTheme, setShowTheme] = useState(false)

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
        maxWidth: showTheme ? 980 : 720,
        transition: 'max-width 0.3s ease',
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
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14, maxWidth: 720 }}>
              <TimezoneCard
                initialTimezone={data.timezone}
                onSaved={(tz) => setData(d => d ? { ...d, timezone: tz } : d)}
              />

              {/* Botão Aparência — abre/fecha o editor de cores + logo/capa */}
              <button
                onClick={() => setShowTheme(v => !v)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 14,
                  width: '100%',
                  textAlign: 'left',
                  padding: '16px 18px',
                  background: showTheme ? 'rgba(220,38,38,0.04)' : 'rgba(255,255,255,0.7)',
                  border: `1px solid ${showTheme ? 'rgba(220,38,38,0.20)' : 'rgba(0,0,0,0.08)'}`,
                  borderRadius: 14,
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  transition: 'background 0.2s ease, border-color 0.2s ease',
                }}
              >
                <span style={{
                  display: 'grid',
                  placeItems: 'center',
                  width: 38,
                  height: 38,
                  borderRadius: 10,
                  background: 'linear-gradient(135deg,#dc2626,#b91c1c)',
                  color: '#fff',
                  flex: 'none',
                }}>
                  <Palette size={18} />
                </span>
                <span style={{ flex: 1, minWidth: 0 }}>
                  <span style={{ display: 'block', fontSize: 14, fontWeight: 600, color: '#0f0f14' }}>
                    Aparência do perfil público
                  </span>
                  <span style={{ display: 'block', fontSize: 12.5, color: 'rgba(0,0,0,0.45)', marginTop: 2 }}>
                    Cores, logo e capa da página de agendamento
                  </span>
                </span>
                <ChevronDown
                  size={18}
                  style={{
                    color: 'rgba(0,0,0,0.4)',
                    flex: 'none',
                    transition: 'transform 0.2s ease',
                    transform: showTheme ? 'rotate(180deg)' : 'none',
                  }}
                />
              </button>

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
                Outras configurações (nome, endereço) em breve.
              </div>
            </div>

            {/* Editor expandível */}
            {showTheme && (
              <div style={{ animation: 'fadeUp 0.25s ease', marginTop: 14 }}>
                <ProfileThemeEditor
                  initialTheme={data.theme}
                  initialLogo={data.logoUrl}
                  initialCover={data.coverUrl}
                  onSaved={(theme) => setData(d => d ? { ...d, theme } : d)}
                />
              </div>
            )}
          </div>
        )}
      </div>
    </>
  )
}
