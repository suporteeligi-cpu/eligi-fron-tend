'use client'
// src/app/dashboard/caixa/components/PaymentModal.tsx
//
// Modal full-screen pra confirmar venda com pagamento misto (split).
// Forma em CARDS (desktop: lista vertical · mobile: roleta) editando a LINHA ATIVA.
// 1 pagamento = visual simples. "Dividir" adiciona linhas (split). Numpad edita a linha ativa.
// Valida soma == total da venda e dispara POST /sales/:id/confirm.
//
// Redesign white glass: cor 100% via bloco T (fonte única).
// DARK: quando o tema dark entrar, basta trocar/derivar este bloco — o resto lê de T.

import { useState } from 'react'
import { createPortal } from 'react-dom'
import { X, Plus, Check, Loader2, AlertCircle } from 'lucide-react'

import api from '@/shared/lib/apiClient'
import { typography, transitions, radius } from '@/shared/theme'
import { Sale, PaymentMethod, PaymentLineInput } from '@/features/sales/types'
import {
  formatBRL, PAYMENT_METHOD_LABEL, PAYMENT_METHOD_ICON, PAYMENT_METHOD_ORDER,
} from '@/features/sales/utils/format'

// ===== TOKENS DO MODAL — fonte única de cor (DARK: trocar este bloco) =====
const T = {
  surface:   'rgba(255,255,255,0.74)',
  blur:      'saturate(180%) blur(30px)',
  header:    'linear-gradient(135deg, #1e293b, #0f172a)',
  card:      '#ffffff',
  field:     'rgba(17,17,22,0.02)',
  stroke:    'rgba(0,0,0,0.11)',
  stroke2:   'rgba(0,0,0,0.14)',
  text:      '#111827',
  muted:     'rgba(17,24,39,0.55)',
  faint:     'rgba(17,24,39,0.38)',
  pay:       '#10b981',
  pay2:      '#059669',
  payGlow:   'rgba(16,185,129,0.40)',
  okText:    '#15803d', okBg: 'rgba(22,163,74,0.08)',  okStroke: 'rgba(22,163,74,0.25)',
  warnText:  '#b45309', warnBg: 'rgba(245,158,11,0.10)', warnStroke: 'rgba(245,158,11,0.30)',
  badText:   '#dc2626', badBg: 'rgba(220,38,38,0.08)',  badStroke: 'rgba(220,38,38,0.18)',
  brand:     '#dc2626',
  brandRing: 'rgba(220,38,38,0.28)',
  shadow:    '0 32px 80px rgba(24,24,48,0.20)',
} as const

// cor de destaque por método
const METHOD_COLOR: Record<PaymentMethod, string> = {
  CASH:     '#10b981',
  PIX:      '#16b8a8',
  CREDIT:   '#6366f1',
  DEBIT:    '#3b82f6',
  TRANSFER: '#f59e0b',
  OTHER:    '#64748b',
}

// fundo translúcido a partir da cor sólida (#rrggbb -> #rrggbb22)
const tint = (hex: string) => hex + '22'

const NUM_KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', ',', '0', '⌫'] as const

interface Props {
  sale:     Sale
  isMobile: boolean
  onClose:  () => void
  onPaid:   (saleConfirmed: Sale) => void
}

interface PaymentRow {
  method:    PaymentMethod
  amount:    string  // string pra digitação
  reference: string
}

export default function PaymentModal({ sale, isMobile, onClose, onPaid }: Props) {
  const [payments,  setPayments]  = useState<PaymentRow[]>([
    { method: 'CASH', amount: sale.total.toFixed(2), reference: '' },
  ])
  const [active,     setActive]     = useState(0)  // linha que cards + numpad editam
  const [discount,   setDiscount]   = useState(sale.discount.toString())
  const [confirming, setConfirming] = useState(false)
  const [error,      setError]      = useState<string | null>(null)
  const [success,    setSuccess]    = useState(false)

  const parsedDiscount = parseFloat(discount.replace(',', '.')) || 0
  const subtotal = sale.subtotal
  const effectiveDiscount = Math.max(0, Math.min(subtotal, parsedDiscount))
  const effectiveTotal = subtotal - effectiveDiscount

  const paidSum = payments.reduce((s, p) => {
    const v = parseFloat(p.amount.replace(',', '.')) || 0
    return s + v
  }, 0)
  const remaining = effectiveTotal - paidSum
  const settled = Math.abs(remaining) < 0.01

  const current = payments[active] ?? payments[0]
  const isSplit = payments.length > 1

  function updatePayment(i: number, patch: Partial<PaymentRow>) {
    setPayments(prev => prev.map((p, idx) => idx === i ? { ...p, ...patch } : p))
  }

  function removePayment(i: number) {
    setPayments(prev => prev.filter((_, idx) => idx !== i))
    setActive(a => (i <= a && a > 0) ? a - 1 : a)
  }

  function addPayment(method: PaymentMethod = 'CASH') {
    const fill = remaining > 0 ? remaining.toFixed(2) : '0.00'
    setPayments(prev => [...prev, { method, amount: fill, reference: '' }])
    setActive(payments.length) // ativa a nova linha
  }

  function fillRemainingOnLast() {
    if (payments.length === 0 || remaining <= 0) return
    const lastIdx = payments.length - 1
    const last = payments[lastIdx]
    const currentLast = parseFloat(last.amount.replace(',', '.')) || 0
    updatePayment(lastIdx, { amount: (currentLast + remaining).toFixed(2) })
  }

  // Numpad → edita o amount da linha ativa
  function pressKey(k: string) {
    setPayments(prev => prev.map((p, idx) => {
      if (idx !== active) return p
      let cur = p.amount
      if (k === '⌫') cur = cur.slice(0, -1)
      else if (k === ',') { if (!cur.includes(',')) cur = (cur || '0') + ',' }
      else cur = cur + k
      return { ...p, amount: cur }
    }))
  }

  async function handleConfirm() {
    setError(null)
    if (payments.length === 0) { setError('Adicione ao menos um pagamento'); return }
    if (Math.abs(remaining) > 0.01) {
      setError(remaining > 0
        ? `Falta ${formatBRL(remaining)} — adicione mais pagamento`
        : `Excedeu em ${formatBRL(-remaining)} — ajuste valores`)
      return
    }
    const validPayments: PaymentLineInput[] = []
    for (const p of payments) {
      const amount = parseFloat(p.amount.replace(',', '.'))
      if (isNaN(amount) || amount <= 0) {
        setError(`Valor inválido em ${PAYMENT_METHOD_LABEL[p.method]}`)
        return
      }
      validPayments.push({ method: p.method, amount, reference: p.reference.trim() || undefined })
    }
    try {
      setConfirming(true)
      const res = await api.post(`/sales/${sale.id}/confirm`, {
        discount: effectiveDiscount,
        payments: validPayments,
      })
      const confirmed = res.data?.data ?? res.data
      setSuccess(true)
      setTimeout(() => { onPaid(confirmed) }, 900)
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: string } } }
      setError(e.response?.data?.error ?? 'Erro ao confirmar venda')
      setConfirming(false)
    }
  }

  if (typeof document === 'undefined') return null

  // ---- blocos ----

  // Cards de forma — editam a forma da linha ativa
  const formCards = isMobile ? (
    <div style={{
      display: 'flex', gap: 9, overflowX: 'auto', paddingBottom: 4,
      scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch',
    }}>
      {PAYMENT_METHOD_ORDER.map(m => {
        const Icon = PAYMENT_METHOD_ICON[m]
        const mc = METHOD_COLOR[m]
        const sel = m === current.method
        return (
          <button
            key={m}
            onClick={() => updatePayment(active, { method: m })}
            disabled={confirming}
            style={{
              flex: '0 0 auto', minWidth: 74,
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
              background: T.card,
              border: `1.5px solid ${sel ? mc : T.stroke}`,
              boxShadow: sel ? `0 0 0 1px ${mc} inset` : 'none',
              borderRadius: 16, padding: '11px 11px',
              color: T.text, fontWeight: 600, fontSize: 11.5,
              fontFamily: 'inherit', cursor: confirming ? 'not-allowed' : 'pointer',
            }}
          >
            <span style={{
              width: 38, height: 38, borderRadius: 11,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: mc, background: tint(mc),
            }}>
              <Icon size={19} strokeWidth={2} />
            </span>
            {PAYMENT_METHOD_LABEL[m]}
          </button>
        )
      })}
    </div>
  ) : (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {PAYMENT_METHOD_ORDER.map((m, idx) => {
        const Icon = PAYMENT_METHOD_ICON[m]
        const mc = METHOD_COLOR[m]
        const sel = m === current.method
        return (
          <button
            key={m}
            onClick={() => updatePayment(active, { method: m })}
            disabled={confirming}
            style={{
              display: 'flex', alignItems: 'center', gap: 12,
              background: T.card,
              border: `1.5px solid ${sel ? mc : T.stroke}`,
              boxShadow: sel ? `0 0 0 1px ${mc} inset` : 'none',
              borderRadius: 13, padding: '11px 13px',
              color: T.text, fontWeight: 600, fontSize: 14,
              fontFamily: 'inherit', textAlign: 'left',
              cursor: confirming ? 'not-allowed' : 'pointer',
            }}
          >
            <span style={{
              width: 38, height: 38, borderRadius: 11,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: mc, background: tint(mc),
            }}>
              <Icon size={20} strokeWidth={2} />
            </span>
            {PAYMENT_METHOD_LABEL[m]}
            <span style={{
              marginLeft: 'auto', fontSize: 11, fontWeight: 700, color: T.muted,
              background: T.field, border: `1px solid ${T.stroke2}`,
              borderRadius: 7, padding: '3px 8px',
            }}>{idx + 1}</span>
          </button>
        )
      })}
    </div>
  )

  // Faixa de split (só com 2+ pagamentos)
  const splitBar = isSplit ? (
    <>
      <div style={{
        fontSize: 10, fontWeight: 700, letterSpacing: '.07em',
        textTransform: 'uppercase', color: T.faint, margin: '0 0 8px',
      }}>
        Pagamentos ({payments.length})
      </div>
      <div style={{
        display: 'flex', gap: 7, overflowX: 'auto', marginBottom: 12, scrollbarWidth: 'none',
      }}>
        {payments.map((p, i) => {
          const Icon = PAYMENT_METHOD_ICON[p.method]
          const mc = METHOD_COLOR[p.method]
          const sel = i === active
          return (
            <div
              key={i}
              onClick={() => setActive(i)}
              style={{
                flex: '0 0 auto', display: 'flex', alignItems: 'center', gap: 7,
                background: T.field,
                border: `1.5px solid ${sel ? T.brand : T.stroke}`,
                boxShadow: sel ? `0 0 0 2px ${T.brandRing}` : 'none',
                borderRadius: 11, padding: '7px 9px',
                fontSize: 12, fontWeight: 600, color: T.text, cursor: 'pointer',
              }}
            >
              <span style={{
                width: 22, height: 22, borderRadius: 6,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: mc, background: tint(mc),
              }}>
                <Icon size={13} strokeWidth={2} />
              </span>
              R$ {p.amount}
              <span
                onClick={e => { e.stopPropagation(); removePayment(i) }}
                style={{ marginLeft: 2, color: T.muted, display: 'flex', cursor: 'pointer' }}
              >
                <X size={12} strokeWidth={2.5} />
              </span>
            </div>
          )
        })}
      </div>
    </>
  ) : null

  // Desconto + Valor (linha ativa)
  const valueRow = (
    <div style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
      <div style={{ flex: 1, minWidth: 0, background: T.card, border: `1px solid ${T.stroke}`, borderRadius: 13, padding: '10px 14px' }}>
        <small style={{ display: 'block', fontSize: 9.5, letterSpacing: '.05em', textTransform: 'uppercase', color: T.faint, fontWeight: 700 }}>
          Desconto
        </small>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
          <span style={{ fontSize: 12, color: T.muted, fontWeight: 600 }}>R$</span>
          <input
            type="text"
            inputMode="decimal"
            value={discount}
            onChange={e => setDiscount(e.target.value.replace(/[^\d,.]/g, ''))}
            placeholder="0,00"
            disabled={confirming}
            style={{
              flex: 1, border: 'none', outline: 'none', background: 'transparent',
              fontSize: 18, fontWeight: 800, color: T.text,
              fontFamily: 'inherit', fontVariantNumeric: 'tabular-nums',
            }}
          />
        </div>
      </div>
      <div style={{ flex: 1, minWidth: 0, background: T.card, border: `1px solid ${T.brandRing}`, borderRadius: 13, padding: '10px 14px' }}>
        <small style={{ display: 'block', fontSize: 9.5, letterSpacing: '.05em', textTransform: 'uppercase', color: T.faint, fontWeight: 700 }}>
          {isSplit ? 'Valor (pagamento ativo)' : 'Valor recebido'}
        </small>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
          <span style={{ fontSize: 12, color: T.muted, fontWeight: 600 }}>R$</span>
          {isMobile ? (
            <div style={{ flex: 1, fontSize: 18, fontWeight: 800, color: T.text, fontVariantNumeric: 'tabular-nums' }}>
              {current.amount || '0,00'}
            </div>
          ) : (
            <input
              type="text"
              inputMode="decimal"
              value={current.amount}
              onChange={e => updatePayment(active, { amount: e.target.value.replace(/[^\d,.]/g, '') })}
              placeholder="0,00"
              disabled={confirming}
              style={{
                flex: 1, border: 'none', outline: 'none', background: 'transparent',
                fontSize: 18, fontWeight: 800, color: T.text,
                fontFamily: 'inherit', fontVariantNumeric: 'tabular-nums',
              }}
            />
          )}
        </div>
      </div>
    </div>
  )

  const refInput = (
    <input
      value={current.reference}
      onChange={e => updatePayment(active, { reference: e.target.value })}
      placeholder="Ref / NSU (opcional)"
      disabled={confirming}
      style={{
        width: '100%', marginBottom: 12, padding: '10px 13px', borderRadius: 11,
        border: `1px solid ${T.stroke2}`, background: T.field,
        fontSize: 12, color: T.text, outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box',
      }}
    />
  )

  const numpad = (caption: string | null) => (
    <div>
      {caption && (
        <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase', color: T.faint, margin: '0 0 7px', textAlign: 'center' }}>
          {caption}
        </div>
      )}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 7 }}>
        {NUM_KEYS.map(k => (
          <button
            key={k}
            onClick={() => pressKey(k)}
            disabled={confirming}
            style={{
              border: `1px solid ${T.stroke}`, background: T.field, color: T.text,
              fontFamily: 'inherit', fontSize: 18, fontWeight: 600, borderRadius: 11,
              padding: '11px 0', cursor: confirming ? 'not-allowed' : 'pointer',
              fontVariantNumeric: 'tabular-nums', WebkitTapHighlightColor: 'transparent',
            }}
          >
            {k}
          </button>
        ))}
      </div>
    </div>
  )

  const divideBtn = (
    <button
      onClick={() => addPayment()}
      disabled={confirming}
      style={{
        width: '100%', marginTop: 11, padding: '11px', borderRadius: 11,
        border: `1.5px dashed ${T.stroke2}`, background: 'transparent',
        color: T.muted, fontFamily: 'inherit', fontSize: 11, fontWeight: 700,
        letterSpacing: '.04em', textTransform: 'uppercase', cursor: confirming ? 'not-allowed' : 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
        WebkitTapHighlightColor: 'transparent',
      }}
    >
      <Plus size={12} strokeWidth={2.5} />
      Dividir pagamento
    </button>
  )

  const statusBlock = (
    <div style={{
      marginTop: 12, padding: '11px 14px', borderRadius: 12,
      background: settled ? T.okBg : remaining > 0 ? T.warnBg : T.badBg,
      border: `1px solid ${settled ? T.okStroke : remaining > 0 ? T.warnStroke : T.badStroke}`,
      display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 13,
    }}>
      <span style={{ fontWeight: 700, color: settled ? T.okText : remaining > 0 ? T.warnText : T.badText }}>
        {settled ? '✓ Total batido' : remaining > 0 ? `Falta ${formatBRL(remaining)}` : `Sobra ${formatBRL(-remaining)}`}
      </span>
      {remaining > 0.01 && payments.length > 0 && (
        <button
          onClick={fillRemainingOnLast}
          disabled={confirming}
          style={{
            padding: '5px 11px', borderRadius: 7, border: 'none', background: T.warnText,
            color: '#fff', fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
          }}
        >
          Preencher
        </button>
      )}
    </div>
  )

  const errorBlock = error ? (
    <div style={{
      marginTop: 12, padding: '10px 12px', background: T.badBg, border: `1px solid ${T.badStroke}`,
      borderRadius: 9, fontSize: 12, color: T.badText, display: 'flex', alignItems: 'center', gap: 7,
    }}>
      <AlertCircle size={13} strokeWidth={2.5} />
      {error}
    </div>
  ) : null

  return createPortal(
    <>
      <div
        onClick={confirming ? undefined : onClose}
        style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)',
          backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)',
          zIndex: 11998, animation: 'pay-fade 0.20s ease',
        }}
      />

      <div style={{
        position: 'fixed', inset: 0,
        top: isMobile ? 'var(--navbar-h, 60px)' : 0,
        bottom: isMobile ? 'var(--bottom-nav-h, 0px)' : 0,
        margin: isMobile ? 0 : 'auto',
        width: isMobile ? '100%' : 780,
        maxWidth: isMobile ? '100%' : '94vw',
        maxHeight: isMobile ? 'auto' : '92vh',
        background: T.surface, backdropFilter: T.blur, WebkitBackdropFilter: T.blur,
        border: `1px solid ${T.stroke}`,
        borderRadius: isMobile ? '24px 24px 0 0' : radius['2xl'],
        boxShadow: T.shadow, zIndex: 11999,
        display: 'flex', flexDirection: 'column', fontFamily: typography.fontFamily,
        animation: isMobile ? 'pay-up 0.32s cubic-bezier(0.34, 1.2, 0.64, 1)' : 'pay-in 0.24s cubic-bezier(0.34, 1.56, 0.64, 1)',
        overflow: 'hidden',
      }}>
        <style>{`
          @keyframes pay-fade { from { opacity:0 } to { opacity:1 } }
          @keyframes pay-up   { from { transform: translateY(100%) } to { transform: translateY(0) } }
          @keyframes pay-in   { from { opacity:0; transform: scale(0.93) } to { opacity:1; transform: scale(1) } }
          @keyframes pay-pop  { from { transform: scale(0.6); opacity: 0 } to { transform: scale(1); opacity: 1 } }
          @keyframes pay-spin { to { transform: rotate(360deg) } }
        `}</style>

        {/* Header escuro */}
        <div style={{ background: T.header, padding: isMobile ? '18px 20px' : '22px 26px', color: '#fff', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.55)', textTransform: 'uppercase', letterSpacing: '.08em' }}>
              Confirmar pagamento
            </span>
            <button
              onClick={onClose}
              disabled={confirming}
              aria-label="Fechar"
              style={{
                width: 32, height: 32, borderRadius: '50%', border: '1px solid rgba(255,255,255,0.15)',
                background: 'rgba(255,255,255,0.08)', cursor: confirming ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: confirming ? 0.5 : 1,
              }}
            >
              <X size={14} color="#fff" strokeWidth={2.5} />
            </button>
          </div>
          <div style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.5)', marginBottom: 3 }}>Total da venda</div>
          <div style={{ fontSize: 32, fontWeight: 800, letterSpacing: '-0.03em', fontVariantNumeric: 'tabular-nums', lineHeight: 1.1 }}>
            {formatBRL(effectiveTotal)}
          </div>
          {effectiveDiscount > 0 && (
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.55)', marginTop: 4 }}>
              Subtotal {formatBRL(subtotal)} − desconto {formatBRL(effectiveDiscount)}
            </div>
          )}
        </div>

        {/* Body */}
        {success ? (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 20px', gap: 14 }}>
            <div style={{
              width: 72, height: 72, borderRadius: '50%',
              background: `linear-gradient(135deg, ${T.pay}, ${T.pay2})`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: `0 12px 32px ${T.payGlow}`, animation: 'pay-pop 0.4s cubic-bezier(0.34,1.56,0.64,1)',
            }}>
              <Check size={36} color="#fff" strokeWidth={3} />
            </div>
            <div style={{ fontSize: 19, fontWeight: 800, color: T.text }}>Venda confirmada!</div>
            <div style={{ fontSize: 14, color: T.muted }}>{formatBRL(effectiveTotal)} registrado</div>
          </div>
        ) : isMobile ? (
          <div style={{ flex: 1, overflowY: 'auto', padding: '12px 16px', WebkitOverflowScrolling: 'touch' }}>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.07em', textTransform: 'uppercase', color: T.faint, margin: '0 0 8px' }}>
              Forma de pagamento
            </div>
            {formCards}
            <div style={{ height: 12 }} />
            {splitBar}
            {valueRow}
            {refInput}
            {numpad(null)}
            {divideBtn}
            {statusBlock}
            {errorBlock}
          </div>
        ) : (
          <div style={{ flex: 1, display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: 16, padding: '16px 22px', overflowY: 'auto', overflowX: 'hidden' }}>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.07em', textTransform: 'uppercase', color: T.faint, margin: '0 0 8px' }}>
                Forma de pagamento
              </div>
              {formCards}
              {divideBtn}
            </div>
            <div style={{ minWidth: 0 }}>
              {splitBar}
              {valueRow}
              {refInput}
              {numpad('Linha ativa')}
              {statusBlock}
              {errorBlock}
            </div>
          </div>
        )}

        {/* Footer */}
        {!success && (
          <div style={{
            padding: isMobile ? '12px 18px max(16px, env(safe-area-inset-bottom))' : '14px 26px',
            background: T.surface, borderTop: `1px solid ${T.stroke}`,
            display: 'flex', gap: 10, flexShrink: 0,
          }}>
            <button
              onClick={onClose}
              disabled={confirming}
              style={{
                flex: 1, padding: '13px', borderRadius: 11, border: `1px solid ${T.stroke2}`,
                background: 'transparent', fontSize: 13, fontWeight: 700,
                cursor: confirming ? 'not-allowed' : 'pointer', color: T.text, fontFamily: 'inherit',
                letterSpacing: '.04em', textTransform: 'uppercase', WebkitTapHighlightColor: 'transparent',
              }}
            >
              Cancelar
            </button>
            <button
              onClick={handleConfirm}
              disabled={confirming || !settled}
              style={{
                flex: 2, padding: '13px', borderRadius: 11, border: 'none',
                background: (confirming || !settled) ? 'rgba(0,0,0,0.07)' : `linear-gradient(135deg, ${T.pay}, ${T.pay2})`,
                color: (confirming || !settled) ? T.faint : '#fff',
                fontSize: 13, fontWeight: 800, cursor: (confirming || !settled) ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
                fontFamily: 'inherit', letterSpacing: '.05em', textTransform: 'uppercase',
                boxShadow: (confirming || !settled) ? 'none' : `0 6px 20px ${T.payGlow}`,
                transition: `all ${transitions.spring}`, WebkitTapHighlightColor: 'transparent',
              }}
            >
              {confirming ? (
                <>
                  <Loader2 size={14} style={{ animation: 'pay-spin 0.8s linear infinite' }} />
                  Processando...
                </>
              ) : (
                <>
                  <Check size={14} strokeWidth={2.5} />
                  Confirmar · {formatBRL(effectiveTotal)}
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </>,
    document.body,
  )
}
