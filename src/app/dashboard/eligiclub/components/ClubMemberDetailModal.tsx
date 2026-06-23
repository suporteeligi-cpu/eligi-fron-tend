'use client'
// src/app/dashboard/eligiclub/components/ClubMemberDetailModal.tsx
//
// Detalhe de um membro do EligiClub: resumo (plano, valor, vencimento, fichas),
// histórico de pagamentos e ações — registrar pagamento (renova +1 mês via
// POST /:id/payments) e cancelar (POST /:id/cancel). Espelha a cromática dos
// outros modais do módulo. Lote 4.

import { useState, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import {
  X, Loader2, AlertCircle, Banknote, Smartphone, CreditCard, Hash, CalendarClock, Ban, Check,
} from 'lucide-react'

import api from '@/shared/lib/apiClient'
import { colors, typography, transitions, radius } from '@/shared/theme'

// ── tipos (espelham o back / page.tsx) ──────────────────────────────────────
type SubStatus = 'PENDING' | 'ACTIVE' | 'PAST_DUE' | 'CANCELED'
interface ClubPayment { id: string; amount: number; periodKey: string; method: string | null; paidAt: string | null }
interface ClubSubscription {
  id: string
  status: SubStatus
  value: number | null
  billingType: string | null
  startedAt: string | null
  currentPeriodEnd: string | null
  canceledAt: string | null
  plan: { id: string; name: string; price: number; staffSharePct: number; color: string | null }
  client: { id: string; name: string; phone: string | null }
  payments?: ClubPayment[]
  _count?: { payments: number; fichas: number }
}

type Method = 'DINHEIRO' | 'PIX' | 'CARTAO'
const METHODS: { key: Method; label: string; Icon: typeof Banknote }[] = [
  { key: 'DINHEIRO', label: 'Dinheiro', Icon: Banknote },
  { key: 'PIX',      label: 'PIX',      Icon: Smartphone },
  { key: 'CARTAO',   label: 'Cartão',   Icon: CreditCard },
]
const STATUS: Record<SubStatus, { label: string; color: string; bg: string }> = {
  ACTIVE:   { label: 'Ativo',     color: '#059669', bg: 'rgba(16,185,129,0.12)' },
  PENDING:  { label: 'Pendente',  color: '#D97706', bg: 'rgba(245,158,11,0.12)' },
  PAST_DUE: { label: 'Atrasado',  color: '#DC2626', bg: 'rgba(220,38,38,0.10)' },
  CANCELED: { label: 'Cancelado', color: '#6B7280', bg: 'rgba(107,114,128,0.14)' },
}
const fmtBRL = (n: number) => n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
const fmtDate = (iso: string | null) =>
  iso ? new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'

interface Props {
  initialSub: ClubSubscription
  isMobile:   boolean
  onUpdated:  (sub: ClubSubscription) => void
  onClose:    () => void
}

export default function ClubMemberDetailModal({ initialSub, isMobile, onUpdated, onClose }: Props) {
  const [sub, setSub] = useState<ClubSubscription>(initialSub)
  const [mounted, setMounted] = useState(false)

  const [payAmountStr, setPayAmountStr] = useState(String(initialSub.value ?? initialSub.plan.price))
  const [payMethod, setPayMethod] = useState<Method>('DINHEIRO')
  const [paying, setPaying] = useState(false)
  const [payError, setPayError] = useState<string | null>(null)

  const [confirmCancel, setConfirmCancel] = useState(false)
  const [canceling, setCanceling] = useState(false)
  const [cancelError, setCancelError] = useState<string | null>(null)

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 10)
    return () => clearTimeout(t)
  }, [])

  // enriquece com o detalhe (payments[12])
  useEffect(() => {
    let cancelled = false
    api.get(`/club-subscriptions/${initialSub.id}`).then(res => {
      if (cancelled) return
      const data = res.data?.data ?? res.data
      if (data && data.id) setSub(data)
    }).catch(() => {})
    return () => { cancelled = true }
  }, [initialSub.id])

  function handleClose() {
    setMounted(false)
    setTimeout(onClose, 200)
  }

  const payAmount = parseFloat(payAmountStr.replace(',', '.')) || 0
  const isCanceled = sub.status === 'CANCELED'
  const st = STATUS[sub.status]

  const registerPayment = useCallback(async () => {
    setPayError(null)
    if (payAmount < 0) { setPayError('Valor inválido'); return }
    setPaying(true)
    try {
      const res = await api.post(`/club-subscriptions/${sub.id}/payments`, { amount: payAmount, method: payMethod })
      const data = res.data?.data ?? res.data
      setSub(data)
      onUpdated(data)
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: string } } }
      setPayError(e.response?.data?.error ?? 'Erro ao registrar pagamento')
    } finally {
      setPaying(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sub.id, payAmount, payMethod])

  const cancelSub = useCallback(async () => {
    setCancelError(null)
    setCanceling(true)
    try {
      const res = await api.post(`/club-subscriptions/${sub.id}/cancel`, {})
      const data = res.data?.data ?? res.data
      setSub(data)
      onUpdated(data)
      setConfirmCancel(false)
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: string } } }
      setCancelError(e.response?.data?.error ?? 'Erro ao cancelar')
    } finally {
      setCanceling(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sub.id])

  const labelStyle: React.CSSProperties = {
    display: 'block', fontSize: 11, fontWeight: 700, color: colors.gray.dimText,
    textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: 6,
  }
  const inputStyle: React.CSSProperties = {
    width: '100%', boxSizing: 'border-box', padding: isMobile ? '11px 13px' : '10px 13px',
    borderRadius: 9, fontSize: 13, border: `1px solid ${colors.gray.borderMd}`, outline: 'none',
    fontFamily: typography.fontFamily, color: colors.gray[900], background: '#fff',
  }
  const initials = (name: string) => name.trim().split(/\s+/).slice(0, 2).map(w => w[0]?.toUpperCase() ?? '').join('')

  const payments = sub.payments ?? []

  const content = (
    <div
      onClick={handleClose}
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(3px)',
        zIndex: 9998, display: 'flex', alignItems: isMobile ? 'flex-end' : 'center', justifyContent: 'center',
        opacity: mounted ? 1 : 0, transition: 'opacity 0.2s ease', fontFamily: typography.fontFamily,
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: '#fff', width: isMobile ? '100%' : 500, maxWidth: '100%',
          maxHeight: isMobile ? '94vh' : '90vh', borderRadius: isMobile ? '20px 20px 0 0' : radius.lg,
          overflow: 'hidden', display: 'flex', flexDirection: 'column',
          transform: mounted ? 'translateY(0)' : isMobile ? 'translateY(100%)' : 'scale(0.97)',
          transition: `transform 0.25s ${transitions.spring ?? 'cubic-bezier(0.34,1.56,0.64,1)'}`,
          boxShadow: '0 -8px 40px rgba(0,0,0,0.20)',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '16px 20px', borderBottom: `1px solid ${colors.gray.border}`, flexShrink: 0 }}>
          <button onClick={handleClose} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 6, display: 'flex', WebkitTapHighlightColor: 'transparent' }}>
            <X size={20} color={colors.gray[700]} strokeWidth={2} />
          </button>
          <span style={{ width: 38, height: 38, borderRadius: '50%', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 760, color: '#fff', background: colors.red.gradient }}>
            {initials(sub.client.name)}
          </span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: colors.gray[900], letterSpacing: '-0.01em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{sub.client.name}</h2>
            {sub.client.phone && <div style={{ fontSize: 11.5, color: colors.gray.dimText }}>{sub.client.phone}</div>}
          </div>
          <span style={{ flexShrink: 0, fontSize: 10.5, fontWeight: 800, letterSpacing: '.04em', textTransform: 'uppercase', color: st.color, background: st.bg, borderRadius: 7, padding: '4px 9px' }}>{st.label}</span>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch', padding: isMobile ? 16 : 22, display: 'flex', flexDirection: 'column', gap: 18 }}>
          {/* Resumo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', borderRadius: 12, border: `1px solid ${colors.gray.border}`, position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: 0, left: 0, bottom: 0, width: 3, background: sub.plan.color ?? colors.red.DEFAULT }} />
            <div style={{ flex: 1, minWidth: 0, paddingLeft: 6 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: colors.gray[900] }}>{sub.plan.name}</div>
              <div style={{ fontSize: 11.5, color: colors.gray.dimText }}>{fmtBRL(sub.value ?? sub.plan.price)}/mês</div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10 }}>
            <Stat icon={<CalendarClock size={14} />} label="Vence em" value={fmtDate(sub.currentPeriodEnd)} />
            <Stat icon={<Hash size={14} />} label="Fichas" value={String(sub._count?.fichas ?? 0)} />
            <Stat icon={<Check size={14} />} label="Pagamentos" value={String(sub._count?.payments ?? payments.length)} />
          </div>

          {/* Registrar pagamento */}
          {!isCanceled && (
            <div style={{ padding: 14, borderRadius: 12, background: colors.background.page, border: `1px solid ${colors.gray.border}` }}>
              <label style={labelStyle}>Registrar pagamento (renova +1 mês)</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', fontSize: 12, color: colors.gray.dimText, fontWeight: 600 }}>R$</span>
                  <input value={payAmountStr} onChange={e => setPayAmountStr(e.target.value.replace(/[^\d,.]/g, ''))} inputMode="decimal" style={{ ...inputStyle, paddingLeft: 34, textAlign: 'right', fontVariantNumeric: 'tabular-nums', fontWeight: 700 }} />
                </div>
                <div style={{ display: 'flex', gap: 5 }}>
                  {METHODS.map(({ key, label, Icon }) => {
                    const sel = payMethod === key
                    return (
                      <button key={key} onClick={() => setPayMethod(key)} title={label} style={{
                        flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 9, cursor: 'pointer',
                        border: `1px solid ${sel ? colors.red.border : colors.gray.borderMd}`,
                        background: sel ? 'rgba(220,38,38,0.06)' : '#fff', color: sel ? colors.red.DEFAULT : colors.gray[700],
                        WebkitTapHighlightColor: 'transparent',
                      }}>
                        <Icon size={16} strokeWidth={2} />
                      </button>
                    )
                  })}
                </div>
              </div>
              {payError && (
                <div style={{ fontSize: 11.5, color: colors.red.DEFAULT, display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                  <AlertCircle size={13} strokeWidth={2.4} />{payError}
                </div>
              )}
              <button onClick={registerPayment} disabled={paying} style={{
                width: '100%', padding: '11px', borderRadius: 10, border: 'none',
                background: paying ? colors.gray.borderMd : colors.red.gradient, color: '#fff',
                fontSize: 12.5, fontWeight: 800, letterSpacing: '.03em', textTransform: 'uppercase',
                cursor: paying ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
                fontFamily: 'inherit', boxShadow: paying ? 'none' : `0 4px 14px ${colors.red.glow}`, WebkitTapHighlightColor: 'transparent',
              }}>
                {paying ? <><Loader2 size={14} style={{ animation: 'club-spin 0.8s linear infinite' }} />Registrando</> : 'Registrar pagamento'}
              </button>
            </div>
          )}

          {/* Histórico */}
          <div>
            <label style={labelStyle}>Histórico de pagamentos ({sub._count?.payments ?? payments.length})</label>
            {payments.length === 0 ? (
              <div style={{ padding: '20px 14px', textAlign: 'center', background: colors.background.page, borderRadius: 11, border: `1px dashed ${colors.gray.borderMd}`, color: colors.gray.dimText, fontSize: 12 }}>
                Nenhum pagamento registrado.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {payments.map(p => (
                  <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', borderRadius: 9, border: `1px solid ${colors.gray.border}` }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 12.5, fontWeight: 700, color: colors.gray[900], fontVariantNumeric: 'tabular-nums' }}>{fmtBRL(p.amount)}</div>
                      <div style={{ fontSize: 10.5, color: colors.gray.dimText }}>{fmtDate(p.paidAt)} · {p.periodKey}{p.method ? ` · ${p.method}` : ''}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {isCanceled && sub.canceledAt && (
            <div style={{ fontSize: 11.5, color: colors.gray.dimText, textAlign: 'center' }}>
              Cancelada em {fmtDate(sub.canceledAt)}
            </div>
          )}
        </div>

        {/* Footer — cancelar */}
        {!isCanceled && (
          <div style={{ flexShrink: 0, padding: '14px 20px', paddingBottom: isMobile ? 'calc(14px + env(safe-area-inset-bottom))' : 14, borderTop: `1px solid ${colors.gray.border}`, background: '#fff' }}>
            {cancelError && (
              <div style={{ fontSize: 11.5, color: colors.red.DEFAULT, display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                <AlertCircle size={13} strokeWidth={2.4} />{cancelError}
              </div>
            )}
            {confirmCancel ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ fontSize: 12.5, color: colors.gray[700], textAlign: 'center' }}>
                  Cancelar a assinatura de <b>{sub.client.name}</b>? O membro perde o acesso ao clube.
                </div>
                <div style={{ display: 'flex', gap: 10 }}>
                  <button onClick={() => setConfirmCancel(false)} disabled={canceling} style={{ flex: 1, padding: '11px', borderRadius: 10, border: `1px solid ${colors.gray.borderMd}`, background: '#fff', fontSize: 12.5, fontWeight: 700, color: colors.gray[700], cursor: 'pointer', fontFamily: 'inherit', WebkitTapHighlightColor: 'transparent' }}>
                    Voltar
                  </button>
                  <button onClick={cancelSub} disabled={canceling} style={{ flex: 1, padding: '11px', borderRadius: 10, border: 'none', background: '#DC2626', color: '#fff', fontSize: 12.5, fontWeight: 800, cursor: canceling ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, fontFamily: 'inherit', WebkitTapHighlightColor: 'transparent' }}>
                    {canceling ? <><Loader2 size={14} style={{ animation: 'club-spin 0.8s linear infinite' }} />Cancelando</> : 'Sim, cancelar'}
                  </button>
                </div>
              </div>
            ) : (
              <button onClick={() => setConfirmCancel(true)} style={{ width: '100%', padding: '11px', borderRadius: 10, border: `1px solid ${colors.gray.borderMd}`, background: '#fff', fontSize: 12.5, fontWeight: 700, color: '#DC2626', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, fontFamily: 'inherit', WebkitTapHighlightColor: 'transparent' }}>
                <Ban size={14} strokeWidth={2.2} />Cancelar assinatura
              </button>
            )}
          </div>
        )}
      </div>

      <style>{`@keyframes club-spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )

  if (typeof document === 'undefined') return null
  return createPortal(content, document.body)
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div style={{ padding: '11px 10px', borderRadius: 11, border: `1px solid ${colors.gray.border}`, textAlign: 'center' }}>
      <div style={{ color: colors.gray.dimText, display: 'flex', justifyContent: 'center', marginBottom: 4 }}>{icon}</div>
      <div style={{ fontSize: 14, fontWeight: 800, color: colors.gray[900], fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}>{value}</div>
      <div style={{ fontSize: 9.5, fontWeight: 700, color: colors.gray.dimText, textTransform: 'uppercase', letterSpacing: '.05em', marginTop: 2 }}>{label}</div>
    </div>
  )
}
