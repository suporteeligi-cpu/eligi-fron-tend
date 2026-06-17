"use client"
// src/app/dashboard/configuracoes/assinatura/page.tsx

import { useState, useEffect, useCallback } from 'react'
import type { CSSProperties, ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Loader2, Sparkles, Gift, CheckCircle2, AlertTriangle } from 'lucide-react'
import api from '@/shared/lib/apiClient'

type AccessStatus =
  | 'EXEMPT' | 'ACTIVE' | 'TRIAL'
  | 'BLOCKED_TRIAL_EXPIRED' | 'BLOCKED_PAST_DUE' | 'BLOCKED_CANCELED'

interface SubscriptionView {
  access: { status: AccessStatus; blocked: boolean; trialDaysLeft: number }
  hasSubscription: boolean
  plan?: 'AUTONOMO' | 'ESTABELECIMENTO' | null
  value?: number | null
  currentPeriodEnd?: string | null
  extraSeats?: number
}

const PLAN_LABEL: Record<'AUTONOMO' | 'ESTABELECIMENTO', string> = {
  AUTONOMO: 'Autonomo',
  ESTABELECIMENTO: 'Estabelecimento',
}

const fmtBRL = (v: number) =>
  v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })

export default function AssinaturaPage() {
  const router = useRouter()
  const [data, setData] = useState<SubscriptionView | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    try {
      setError(null)
      const res = await api.get('/billing/subscription')
      setData(res.data?.data ?? null)
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: { message?: string } } } }
      setError(e.response?.data?.error?.message ?? 'Erro ao carregar a assinatura')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  function openSubscribe() {
    // reusa o overlay de assinatura do BillingGuard
    window.dispatchEvent(new CustomEvent('billing:blocked'))
  }

  const status = data?.access.status
  const planLabel = data?.plan ? PLAN_LABEL[data.plan] : ''

  return (
    <>
      <style>{`
        @keyframes fadeUp { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes a-spin { to { transform: rotate(360deg); } }
      `}</style>

      <div style={{
        maxWidth: 720,
        animation: 'fadeUp 0.3s ease',
        fontFamily: '-apple-system, system-ui, sans-serif',
      }}>
        <button
          onClick={() => router.push('/dashboard/configuracoes')}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            background: 'transparent', border: 'none',
            color: 'rgba(0,0,0,0.45)', fontSize: 13, cursor: 'pointer',
            padding: 0, marginBottom: 18,
          }}
        >
          <ArrowLeft size={15} /> Configuracoes
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
          <div style={{
            width: 42, height: 42, borderRadius: 12, flexShrink: 0,
            background: 'linear-gradient(135deg,rgba(220,38,38,0.10),rgba(185,28,28,0.06))',
            border: '1px solid rgba(220,38,38,0.12)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Sparkles size={20} color="#dc2626" strokeWidth={1.8} />
          </div>
          <div>
            <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, letterSpacing: '-0.02em', color: '#0f0f14' }}>
              Sua Assinatura Eligi
            </h2>
            <p style={{ margin: '2px 0 0', fontSize: 13, color: 'rgba(0,0,0,0.45)' }}>
              Seu plano, valor mensal e situacao da cobranca.
            </p>
          </div>
        </div>

        {loading && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: 40, color: 'rgba(0,0,0,0.4)' }}>
            <Loader2 size={18} style={{ animation: 'a-spin 0.8s linear infinite' }} /> Carregando...
          </div>
        )}

        {!loading && error && (
          <div style={{
            padding: '14px 16px', borderRadius: 12, fontSize: 13,
            background: 'rgba(220,38,38,0.06)', border: '1px solid rgba(220,38,38,0.18)', color: '#b91c1c',
          }}>
            {error}
          </div>
        )}

        {!loading && !error && data && (
          <div style={{
            padding: '22px 24px', borderRadius: 16,
            background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(20px)',
            border: '1px solid rgba(0,0,0,0.07)', boxShadow: '0 1px 6px rgba(0,0,0,0.04)',
          }}>
            {status === 'EXEMPT' && (
              <StateRow icon={<CheckCircle2 size={18} color="#10B981" />} title="Conta cortesia"
                desc="Este acesso e isento de cobranca." />
            )}

            {status === 'TRIAL' && (
              <>
                <StateRow icon={<Gift size={18} color="#dc2626" />}
                  title={`Periodo de teste - ${data.access.trialDaysLeft} ${data.access.trialDaysLeft === 1 ? 'dia restante' : 'dias restantes'}`}
                  desc="Voce esta explorando o Eligi gratuitamente. Assine para nao perder o acesso quando o teste acabar." />
                <button onClick={openSubscribe} style={ctaStyle}>Assinar agora</button>
              </>
            )}

            {status === 'ACTIVE' && (
              <>
                <StateRow icon={<CheckCircle2 size={18} color="#10B981" />}
                  title={`Plano ${planLabel} - ativo`}
                  desc="Sua assinatura esta em dia." />
                <div style={infoGrid}>
                  <Info label="Valor mensal" value={data.value != null ? `R$ ${fmtBRL(data.value)}` : '-'} />
                  <Info label="Proximo vencimento" value={data.currentPeriodEnd ? fmtDate(data.currentPeriodEnd) : '-'} />
                  {data.extraSeats ? (
                    <Info label="Profissionais extras" value={`${data.extraSeats} (+R$ ${fmtBRL(19.9 * data.extraSeats)})`} />
                  ) : null}
                </div>
              </>
            )}

            {status === 'BLOCKED_PAST_DUE' && (
              <StateRow icon={<AlertTriangle size={18} color="#dc2626" />} title="Pagamento atrasado"
                desc="Ha uma cobranca em aberto. Regularize para reativar o acesso." />
            )}
            {status === 'BLOCKED_CANCELED' && (
              <StateRow icon={<AlertTriangle size={18} color="#dc2626" />} title="Assinatura cancelada"
                desc="Assine novamente para voltar a usar o Eligi." />
            )}
            {status === 'BLOCKED_TRIAL_EXPIRED' && (
              <>
                <StateRow icon={<AlertTriangle size={18} color="#dc2626" />} title="Teste encerrado"
                  desc="Seu periodo de teste terminou. Assine para continuar." />
                <button onClick={openSubscribe} style={ctaStyle}>Assinar agora</button>
              </>
            )}
          </div>
        )}
      </div>
    </>
  )
}

const ctaStyle: CSSProperties = {
  marginTop: 18, padding: '11px 20px', borderRadius: 10, border: 'none',
  background: 'linear-gradient(135deg,#dc2626,#b91c1c)', color: '#fff',
  fontSize: 14, fontWeight: 600, cursor: 'pointer',
}
const infoGrid: CSSProperties = {
  marginTop: 18, display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: 14,
}

function StateRow({ icon, title, desc }: { icon: ReactNode; title: string; desc: string }) {
  return (
    <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
      <div style={{ marginTop: 1 }}>{icon}</div>
      <div>
        <div style={{ fontSize: 15, fontWeight: 600, color: '#111827', marginBottom: 3 }}>{title}</div>
        <div style={{ fontSize: 13, color: 'rgba(0,0,0,0.5)', lineHeight: 1.5 }}>{desc}</div>
      </div>
    </div>
  )
}
function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(0,0,0,0.35)', letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 15, fontWeight: 600, color: '#0f0f14' }}>{value}</div>
    </div>
  )
}
