"use client"
// src/app/dashboard/configuracoes/assinatura/page.tsx

import { useState, useEffect, useCallback } from 'react'
import type { CSSProperties, ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Loader2, Sparkles, Gift, CheckCircle2, AlertTriangle } from 'lucide-react'
import api from '@/shared/lib/apiClient'

type AccessStatus =
  | 'EXEMPT' | 'ACTIVE' | 'TRIAL'
  | 'BLOCKED_TRIAL_EXPIRED' | 'BLOCKED_PAST_DUE' | 'BLOCKED_CANCELED' | 'CANCELED_GRACE'

interface SubscriptionView {
  access: { status: AccessStatus; blocked: boolean; trialDaysLeft: number }
  hasSubscription: boolean
  plan?: 'AUTONOMO' | 'ESTABELECIMENTO' | null
  value?: number | null
  currentPeriodEnd?: string | null
  extraSeats?: number
  activeCount?: number
  nextChange?: { delta: number; expectedValue: number; activeCount: number } | null
}

const PLAN_LABEL: Record<'AUTONOMO' | 'ESTABELECIMENTO', string> = {
  AUTONOMO: 'Autonomo',
  ESTABELECIMENTO: 'Estabelecimento',
}
const PLAN_BASE: Record<'AUTONOMO' | 'ESTABELECIMENTO', number> = { AUTONOMO: 59.9, ESTABELECIMENTO: 99.9 }
const EXTRA_SEAT_PRICE = 19.9
/** Chip de vencimento conforme a regua dos lembretes do sino (T-7/T-3/T-1). */
function renewChip(iso: string): { label: string; bg: string; fg: string; border: string } | null {
  const days = Math.ceil((new Date(iso).getTime() - Date.now()) / 86_400_000)
  if (days < 0) return null
  if (days === 0 || days === 1) return { label: days === 0 ? 'vence hoje' : 'vence amanha', bg: 'rgba(220,38,38,0.1)', fg: '#991b1b', border: 'rgba(220,38,38,0.3)' }
  if (days <= 3) return { label: `em ${days} dias`, bg: 'rgba(245,158,11,0.1)', fg: '#b45309', border: 'rgba(245,158,11,0.3)' }
  if (days <= 7) return { label: `em ${days} dias`, bg: 'rgba(234,179,8,0.08)', fg: '#a16207', border: 'rgba(234,179,8,0.25)' }
  return { label: `renova em ${days} dias`, bg: 'rgba(16,185,129,0.08)', fg: '#047857', border: 'rgba(16,185,129,0.25)' }
}
type ProfLite = { id: string; name: string; role?: string | null; avatarUrl?: string | null }

const fmtBRL = (v: number) =>
  v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })

export default function AssinaturaPage() {
  const router = useRouter()
  const [data, setData] = useState<SubscriptionView | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [confirmCancel, setConfirmCancel] = useState(false)
  const [canceling, setCanceling] = useState(false)
  const [resuming, setResuming] = useState(false)
  const [changingPlan, setChangingPlan] = useState(false)
  const [seatProfs, setSeatProfs] = useState<ProfLite[] | null>(null)
  const [keepId, setKeepId] = useState<string | null>(null)
  const [paidFlag] = useState(() => typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('pago') === '1')

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

  async function doCancel() {
    setCanceling(true)
    try {
      await api.post('/billing/cancel')
      await load()
      setConfirmCancel(false)
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: { message?: string } } } }
      setError(e.response?.data?.error?.message ?? 'Nao foi possivel cancelar a assinatura')
    } finally {
      setCanceling(false)
    }
  }
  async function doResume() {
    setResuming(true)
    try {
      await api.post('/billing/resume')
      await load()
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: { message?: string } } } }
      setError(e.response?.data?.error?.message ?? 'Nao foi possivel reativar a assinatura')
    } finally {
      setResuming(false)
    }
  }
  async function doChangePlan(target: 'AUTONOMO' | 'ESTABELECIMENTO', keepProfessionalIds?: string[]) {
    setChangingPlan(true)
    setError(null)
    try {
      await api.post('/billing/change-plan', { plan: target, ...(keepProfessionalIds ? { keepProfessionalIds } : {}) })
      setSeatProfs(null)
      await load()
    } catch (err: unknown) {
      const e = err as { response?: { status?: number; data?: { error?: { code?: string; message?: string }; data?: { professionals?: ProfLite[] } } } }
      if (e.response?.status === 409 && e.response.data?.error?.code === 'SEAT_SELECTION_REQUIRED') {
        setSeatProfs(e.response.data?.data?.professionals ?? [])
        setKeepId(null)
        return
      }
      setError(e.response?.data?.error?.message ?? 'Nao foi possivel trocar de plano')
    } finally {
      setChangingPlan(false)
    }
  }

  const status = data?.access.status
  const planLabel = data?.plan ? PLAN_LABEL[data.plan] : ''
  const otherPlan: 'AUTONOMO' | 'ESTABELECIMENTO' = data?.plan === 'AUTONOMO' ? 'ESTABELECIMENTO' : 'AUTONOMO'
  const endLabel = data?.currentPeriodEnd ? fmtDate(data.currentPeriodEnd) : 'o fim do ciclo'

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

        {paidFlag && !loading && status !== 'ACTIVE' && (
          <div style={{
            padding: '12px 16px', borderRadius: 12, fontSize: 13, marginBottom: 16,
            background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.25)', color: '#047857',
          }}>
            Pagamento recebido. Estamos confirmando com o provedor de pagamento - pode levar alguns instantes. Atualize a pagina em breve.
          </div>
        )}
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

            {status === 'ACTIVE' && data.plan && (
              <>
                <style>{`@keyframes assinatura-flip{from{transform:rotateY(0)}to{transform:rotateY(360deg)}}@keyframes assinatura-ring{0%,100%{opacity:.55;transform:scale(1)}50%{opacity:.18;transform:scale(1.06)}}@media (prefers-reduced-motion:reduce){.assinatura-globo,.assinatura-ring{animation:none}}`}</style>
                <div style={{ display: 'flex', alignItems: 'center', gap: 18, paddingBottom: 18, marginBottom: 16, borderBottom: '0.5px solid rgba(0,0,0,0.06)' }}>
                  <div style={{ position: 'relative', width: 84, height: 84, flexShrink: 0, perspective: 600 }}>
                    <div className="assinatura-ring" style={{ position: 'absolute', inset: 4, borderRadius: '50%', border: '1px solid rgba(220,38,38,0.3)', animation: 'assinatura-ring 4.5s ease-in-out infinite', pointerEvents: 'none' }} />
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img className="assinatura-globo" src="/globo.png" alt="Eligi ativo" style={{ width: 76, height: 76, margin: 4, animation: 'assinatura-flip 9s linear infinite', display: 'block' }} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <span style={{ fontSize: 17, fontWeight: 500, color: '#18181b' }}>Plano {planLabel}</span>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '3px 9px', borderRadius: 999, fontSize: 11.5, fontWeight: 500, background: 'rgba(16,185,129,0.1)', color: '#047857', border: '0.5px solid rgba(16,185,129,0.25)' }}>
                        <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#10B981' }} />Ativo
                      </span>
                    </div>
                    <div style={{ fontSize: 13, color: '#71717a' }}>Sua assinatura esta em dia. Tudo funcionando.</div>
                  </div>
                </div>
                <div style={infoGrid}>
                  <Info label="Valor mensal" value={data.value != null ? `R$ ${fmtBRL(data.value)}` : '-'} />
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <span style={{ fontSize: 11.5, color: '#71717a', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Proximo vencimento</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 14, fontWeight: 500, color: '#18181b' }}>{data.currentPeriodEnd ? fmtDate(data.currentPeriodEnd) : '-'}</span>
                      {data.currentPeriodEnd && (() => {
                        const chip = renewChip(data.currentPeriodEnd)
                        return chip ? (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 8px', borderRadius: 999, fontSize: 11, fontWeight: 500, background: chip.bg, color: chip.fg, border: `0.5px solid ${chip.border}` }}>{chip.label}</span>
                        ) : null
                      })()}
                    </span>
                  </div>
                  <Info label="Profissionais ativos" value={`${data.activeCount ?? 0}${data.plan === 'ESTABELECIMENTO' ? ` (3 inclusos${(data.activeCount ?? 0) > 3 ? ` + ${(data.activeCount ?? 0) - 3} extras` : ''})` : ''}`} />
                </div>
                {data.value != null && (
                  <div style={{ background: 'rgba(220,38,38,0.04)', border: '0.5px solid rgba(220,38,38,0.1)', borderRadius: 10, padding: '12px 14px', marginTop: 16, fontSize: 12.5 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0', color: '#525252' }}>
                      <span>{planLabel} (base{data.plan === 'ESTABELECIMENTO' ? ', 3 profissionais' : ''})</span>
                      <span>R$ {fmtBRL(PLAN_BASE[data.plan])}</span>
                    </div>
                    {data.plan === 'ESTABELECIMENTO' && (data.extraSeats ?? 0) > 0 && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0', color: '#525252' }}>
                        <span>{data.extraSeats} × profissional extra</span>
                        <span>R$ {fmtBRL(EXTRA_SEAT_PRICE * (data.extraSeats ?? 0))}</span>
                      </div>
                    )}
                    <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 8, marginTop: 6, borderTop: '0.5px solid rgba(220,38,38,0.15)', fontWeight: 500, color: '#18181b' }}>
                      <span>Total mensal</span><span>R$ {fmtBRL(data.value)}</span>
                    </div>
                  </div>
                )}
                {data.nextChange && data.value != null && (
                  <div style={{ background: data.nextChange.delta > 0 ? 'rgba(59,130,246,0.06)' : 'rgba(16,185,129,0.06)', border: `0.5px solid ${data.nextChange.delta > 0 ? 'rgba(59,130,246,0.2)' : 'rgba(16,185,129,0.25)'}`, borderRadius: 10, padding: '10px 12px', marginTop: 12, fontSize: 12.5, color: data.nextChange.delta > 0 ? '#1d4ed8' : '#047857' }}>
                    <div style={{ fontWeight: 500, marginBottom: 2 }}>
                      {data.nextChange.delta > 0
                        ? 'Sua equipe cresceu — a proxima cobranca sobe.'
                        : 'Sua equipe diminuiu — a proxima cobranca cai.'}
                    </div>
                    <div style={{ opacity: 0.85 }}>
                      De R$ {fmtBRL(data.value)} para R$ {fmtBRL(data.nextChange.expectedValue)}/mes a partir do proximo ciclo.
                    </div>
                  </div>
                )}

                {data.plan && (
                  <button
                    onClick={() => doChangePlan(otherPlan)}
                    disabled={changingPlan}
                    style={{
                      width: '100%', padding: '11px', marginBottom: 12,
                      background: 'transparent', border: '1px solid #dc2626',
                      borderRadius: 10, fontSize: 13.5, fontWeight: 600, color: '#dc2626',
                      cursor: changingPlan ? 'not-allowed' : 'pointer',
                    }}
                  >
                    {changingPlan ? 'Mudando...' : `Mudar para ${PLAN_LABEL[otherPlan]}`}
                  </button>
                )}
                {seatProfs && (
                  <div style={{ position: 'fixed', inset: 0, zIndex: 1000000, background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(3px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
                    <div style={{ background: '#fff', borderRadius: 16, padding: '26px 24px', maxWidth: 420, width: '100%', boxShadow: '0 20px 60px rgba(0,0,0,0.25)' }}>
                      <p style={{ fontSize: 17, fontWeight: 600, margin: '0 0 6px', color: '#18181b' }}>Escolha quem continua</p>
                      <p style={{ fontSize: 13.5, color: '#71717a', margin: '0 0 16px', lineHeight: 1.5 }}>
                        O Autonomo cobre 1 profissional. Quem ficar de fora sera desativado (da pra reativar ao voltar pro Estabelecimento).
                      </p>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 18 }}>
                        {seatProfs.map((p) => (
                          <label key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', border: keepId === p.id ? '1px solid #dc2626' : '1px solid rgba(0,0,0,0.12)', borderRadius: 10, cursor: 'pointer' }}>
                            <input type="radio" name="keep-plan" checked={keepId === p.id} onChange={() => setKeepId(p.id)} />
                            <span style={{ fontSize: 14, color: '#18181b' }}>{p.name}{p.role ? <span style={{ color: '#71717a' }}> · {p.role}</span> : null}</span>
                          </label>
                        ))}
                      </div>
                      <button onClick={() => keepId && doChangePlan('AUTONOMO', [keepId])} disabled={changingPlan || !keepId} style={ctaStyle}>
                        {changingPlan ? 'Aguarde...' : 'Confirmar mudanca'}
                      </button>
                      <button onClick={() => setSeatProfs(null)} disabled={changingPlan} style={{ width: '100%', marginTop: 8, padding: '11px', background: 'transparent', border: '1px solid rgba(0,0,0,0.15)', borderRadius: 10, fontSize: 13, cursor: 'pointer', color: '#71717a' }}>
                        Voltar
                      </button>
                    </div>
                  </div>
                )}
                <div style={cancelArea}>
                  {!confirmCancel ? (
                    <button onClick={() => setConfirmCancel(true)} style={cancelLink}>Cancelar assinatura</button>
                  ) : (
                    <div style={confirmBox}>
                      <p style={confirmText}>
                        Tem certeza? Voce mantem o acesso ate {endLabel} e nao havera novas cobrancas.
                      </p>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button onClick={doCancel} disabled={canceling} style={btnDangerSm}>
                          {canceling ? 'Cancelando...' : 'Sim, cancelar'}
                        </button>
                        <button onClick={() => setConfirmCancel(false)} disabled={canceling} style={btnGhostSm}>
                          Voltar
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}

            {status === 'CANCELED_GRACE' && (
              <>
                <StateRow icon={<AlertTriangle size={18} color="#f59e0b" />} title="Assinatura cancelada"
                  desc={`Voce ainda tem acesso ate ${endLabel}. Depois disso o acesso sera bloqueado ate uma nova assinatura.`} />
                <button onClick={doResume} disabled={resuming} style={ctaStyle}>{resuming ? 'Reativando...' : 'Reativar assinatura'}</button>
              </>
            )}

            {status === 'BLOCKED_PAST_DUE' && (
              <StateRow icon={<AlertTriangle size={18} color="#dc2626" />} title="Pagamento atrasado"
                desc="Ha uma cobranca em aberto. Regularize para reativar o acesso." />
            )}
            {status === 'BLOCKED_CANCELED' && (
              <>
                <StateRow icon={<AlertTriangle size={18} color="#dc2626" />} title="Assinatura cancelada"
                  desc="Assine novamente para voltar a usar o Eligi." />
                <button onClick={openSubscribe} style={ctaStyle}>Assinar novamente</button>
              </>
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
const cancelArea: CSSProperties = {
  marginTop: 20, paddingTop: 16, borderTop: '1px solid rgba(0,0,0,0.06)',
}
const cancelLink: CSSProperties = {
  background: 'none', border: 'none', padding: 0,
  color: 'rgba(0,0,0,0.4)', fontSize: 13, cursor: 'pointer', textDecoration: 'underline',
}
const confirmBox: CSSProperties = { display: 'flex', flexDirection: 'column', gap: 12 }
const confirmText: CSSProperties = { margin: 0, fontSize: 13, color: 'rgba(0,0,0,0.6)', lineHeight: 1.5 }
const btnDangerSm: CSSProperties = {
  padding: '8px 16px', borderRadius: 8, border: 'none',
  background: '#dc2626', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer',
}
const btnGhostSm: CSSProperties = {
  padding: '8px 16px', borderRadius: 8, border: '1px solid rgba(0,0,0,0.15)',
  background: 'transparent', color: '#18181b', fontSize: 13, fontWeight: 600, cursor: 'pointer',
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
