'use client'
// src/app/dashboard/caixa/components/PaymentModal.tsx
// @eligi:caixa-payment-v2
//
// Pagamento da venda - direcao A "Balcao limpo" (nov/2026).
//
// SEM campo de desconto: o desconto e dado no carrinho e ja esta gravado na venda
// quando este modal abre. Antes havia um segundo desconto aqui; mexer nele nao
// ajustava o valor recebido (nascia com o total antigo) e o confirmar travava em
// "Sobra". O confirm agora manda so os pagamentos; o back usa o desconto da venda.
//
// Forma em cartoes editando a LINHA ATIVA. "Dividir" cria linhas (pagamento
// misto). Dinheiro com valor acima do total mostra o TROCO e grava o total.
// NFS-e: aviso no rodape quando o modulo esta ligado (decisao do DONO); a emissao
// roda depois do confirm, isolada, e nunca trava o caixa.

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { X, Plus, Check, Loader2, Receipt } from 'lucide-react'

import api from '@/shared/lib/apiClient'
import { useNfseEnabled } from '@/features/fiscal/hooks/useNfseEnabled' // @eligi:nfse-switch
import { Sale, PaymentMethod, PaymentLineInput } from '@/features/sales/types'
import {
  formatBRL, PAYMENT_METHOD_LABEL, PAYMENT_METHOD_ICON, PAYMENT_METHOD_ORDER,
} from '@/features/sales/utils/format'
import { parseMoneyInput, round2, discountPercentLabel } from '@/features/sales/utils/discount'
import { C } from '../ui'

const NUM_KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', ',', '0', '⌫'] as const

interface Props {
  sale:     Sale
  isMobile: boolean
  onClose:  () => void
  onPaid:   (saleConfirmed: Sale) => void
}

interface PaymentRow {
  method:    PaymentMethod
  amount:    string   // texto digitado ("60,00")
  reference: string
  touched:   boolean  // 1a tecla do numpad substitui o valor sugerido
}

function toInput(v: number): string {
  return v > 0 ? v.toFixed(2).replace('.', ',') : ''
}

export default function PaymentModal({ sale, isMobile, onClose, onPaid }: Props) {
  const total = round2(sale.total)
  const [payments,   setPayments]   = useState<PaymentRow[]>(() => [
    { method: 'CASH', amount: toInput(total), reference: '', touched: false },
  ])
  const [active,     setActive]     = useState(0)
  const [confirming, setConfirming] = useState(false)
  const [error,      setError]      = useState<string | null>(null)
  const [success,    setSuccess]    = useState(false)

  // @eligi:nfse-switch - quem decide emitir e o DONO (master switch).
  const nfseState  = useNfseEnabled()
  // @eligi:nfse-tributaveis - servico, pacote e assinatura geram nota; item R$ 0 e consumo.
  const hasService = sale.items.some(
    i => (i.type === 'SERVICE' || i.type === 'PACKAGE' || i.type === 'MEMBERSHIP') && i.total > 0,
  )
  const emitNfse = (nfseState?.ativa ?? false) && hasService

  const amounts   = payments.map(p => parseMoneyInput(p.amount))
  const paidSum   = round2(amounts.reduce((s, v) => s + (Number.isFinite(v) ? v : 0), 0))
  const remaining = round2(total - paidSum)
  const isSplit   = payments.length > 1
  const change    = !isSplit && payments[0]?.method === 'CASH' && paidSum > total ? round2(paidSum - total) : 0
  const settled   = Math.abs(remaining) < 0.01 || change > 0
  const current   = payments[active] ?? payments[0]
  const discountPct = discountPercentLabel(sale.discount, sale.subtotal)

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape' && !confirming && !success) onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [confirming, success, onClose])

  function updatePayment(i: number, patch: Partial<PaymentRow>) {
    setPayments(prev => prev.map((p, idx) => idx === i ? { ...p, ...patch } : p))
    setError(null)
  }

  function removePayment(i: number) {
    setPayments(prev => prev.filter((_, idx) => idx !== i))
    setActive(a => (i <= a && a > 0) ? a - 1 : a)
  }

  function addPayment() {
    const fill = remaining > 0 ? toInput(remaining) : ''
    setPayments(prev => [...prev, { method: 'PIX', amount: fill, reference: '', touched: false }])
    setActive(payments.length)
  }

  function fillRemaining() {
    if (remaining <= 0) return
    const i = active
    const cur = parseMoneyInput(payments[i]?.amount ?? '')
    updatePayment(i, { amount: toInput(round2((Number.isFinite(cur) ? cur : 0) + remaining)), touched: true })
  }

  function pressKey(k: string) {
    setError(null)
    setPayments(prev => prev.map((p, idx) => {
      if (idx !== active) return p
      let cur = p.touched ? p.amount : ''
      if (k === '⌫') cur = (p.touched ? p.amount : '').slice(0, -1)
      else if (k === ',') { if (!cur.includes(',')) cur = (cur || '0') + ',' }
      else {
        const dec = cur.split(',')[1]
        if (dec !== undefined && dec.length >= 2) return { ...p, touched: true }
        cur = cur + k
      }
      return { ...p, amount: cur, touched: true }
    }))
  }

  async function handleConfirm() {
    setError(null)
    if (!settled) {
      setError(remaining > 0
        ? `Falta ${formatBRL(remaining)}. Ajuste o valor ou divida o pagamento.`
        : `Passou ${formatBRL(-remaining)} do total. Ajuste os valores.`)
      return
    }
    const lines: PaymentLineInput[] = []
    if (change > 0) {
      lines.push({ method: 'CASH', amount: total, reference: payments[0].reference.trim() || undefined })
    } else {
      for (const [i, p] of payments.entries()) {
        const amount = round2(amounts[i])
        if (!Number.isFinite(amount) || amount <= 0) {
          setError(`Valor inválido em ${PAYMENT_METHOD_LABEL[p.method]}`)
          return
        }
        lines.push({ method: p.method, amount, reference: p.reference.trim() || undefined })
      }
    }
    try {
      setConfirming(true)
      const res = await api.post(`/sales/${sale.id}/confirm`, { payments: lines })
      const confirmed: Sale = res.data?.data ?? res.data
      // @eligi:nfse-switch - nota depois do confirm, isolada: falha nao trava o caixa.
      if (emitNfse) {
        void api.post(`/fiscal/sales/${sale.id}/emit?auto=1`).catch(() => {
          /* venda ja fechada; a nota fica pendente na central para reemitir */
        })
      }
      setSuccess(true)
      setTimeout(() => { onPaid(confirmed) }, 900)
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: string; message?: string } } }
      setError(e.response?.data?.error ?? e.response?.data?.message ?? 'Erro ao confirmar venda')
      setConfirming(false)
    }
  }

  if (typeof document === 'undefined') return null

  // ── blocos ──────────────────────────────────────────────────────────────
  const methodGrid = (
    <div role="radiogroup" aria-label="Forma de pagamento" style={{
      display: 'grid', gridTemplateColumns: isMobile ? 'repeat(3, minmax(0, 1fr))' : 'repeat(2, minmax(0, 1fr))', gap: 8,
    }}>
      {PAYMENT_METHOD_ORDER.map(m => {
        const Icon = PAYMENT_METHOD_ICON[m]
        const sel = m === current.method
        return (
          <button
            key={m}
            type="button"
            role="radio"
            aria-checked={sel}
            onClick={() => updatePayment(active, { method: m })}
            disabled={confirming}
            style={{
              display: 'flex', flexDirection: isMobile ? 'column' : 'row', alignItems: 'center',
              gap: isMobile ? 6 : 10, padding: isMobile ? '10px 6px' : '12px', minHeight: 48,
              borderRadius: 12, background: C.card, cursor: confirming ? 'not-allowed' : 'pointer',
              border: sel ? `1.5px solid ${C.ink}` : `1px solid ${C.line2}`,
              boxShadow: sel ? `inset 0 0 0 0.5px ${C.ink}` : 'none',
              color: C.ink, fontSize: isMobile ? 12 : 14, fontWeight: 600, fontFamily: 'inherit',
              textAlign: 'left',
            }}
          >
            <span style={{
              width: 30, height: 30, borderRadius: 8, flexShrink: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: sel ? C.ink : C.sunken, border: `1px solid ${sel ? C.ink : C.line}`,
            }}>
              <Icon size={16} strokeWidth={2} color={sel ? C.onInk : C.ink2} />
            </span>
            {PAYMENT_METHOD_LABEL[m]}
          </button>
        )
      })}
    </div>
  )

  const splitBar = isSplit ? (
    <div style={{ display: 'flex', gap: 6, overflowX: 'auto', scrollbarWidth: 'none' }}>
      {payments.map((p, i) => {
        const Icon = PAYMENT_METHOD_ICON[p.method]
        const sel = i === active
        return (
          <span key={i} style={{
            flex: '0 0 auto', display: 'inline-flex', alignItems: 'center', gap: 6,
            borderRadius: 10, padding: '0 4px 0 10px', minHeight: 36,
            border: sel ? `1.5px solid ${C.ink}` : `1px solid ${C.line2}`, background: C.card,
          }}>
            <button type="button" onClick={() => setActive(i)} style={{
              display: 'inline-flex', alignItems: 'center', gap: 6, border: 'none', background: 'transparent',
              cursor: 'pointer', fontSize: 12, fontWeight: 700, color: C.ink, fontFamily: 'inherit', padding: 0,
            }}>
              <Icon size={13} color={C.ink2} />
              <span style={{ color: C.ink, fontVariantNumeric: 'tabular-nums' }}>R$ {p.amount || '0'}</span>
            </button>
            <button type="button" onClick={() => removePayment(i)} aria-label={`Remover pagamento ${i + 1}`} style={{
              width: 28, height: 28, border: 'none', background: 'transparent', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <X size={12} color={C.ink3} />
            </button>
          </span>
        )
      })}
    </div>
  ) : null

  const valueField = (
    <div style={{ border: `1px solid ${C.line2}`, borderRadius: 12, padding: '8px 12px', background: C.card }}>
      <label htmlFor="cx-pay-amount" style={{
        display: 'block', fontSize: 10.5, fontWeight: 700, letterSpacing: '.06em',
        textTransform: 'uppercase', color: C.ink3,
      }}>
        {isSplit ? `Valor em ${PAYMENT_METHOD_LABEL[current.method]}` : current.method === 'CASH' ? 'Valor recebido' : 'Valor'}
      </label>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
        <span style={{ fontSize: 13, color: C.ink3, fontWeight: 600 }}>R$</span>
        <input
          id="cx-pay-amount"
          type="text"
          inputMode="decimal"
          value={current.amount}
          onChange={e => updatePayment(active, { amount: e.target.value.replace(/[^\d,.]/g, ''), touched: true })}
          placeholder="0,00"
          disabled={confirming}
          readOnly={isMobile}
          style={{
            flex: 1, minWidth: 0, border: 'none', outline: 'none', background: 'transparent',
            fontFamily: C.display, fontSize: 26, fontWeight: 700, color: C.ink,
            fontVariantNumeric: 'tabular-nums', padding: '2px 0',
          }}
        />
      </div>
    </div>
  )

  const refInput = (
    <input
      id="cx-pay-ref"
      value={current.reference}
      onChange={e => updatePayment(active, { reference: e.target.value })}
      placeholder="Ref / NSU (opcional)"
      aria-label="Referência ou NSU"
      disabled={confirming}
      style={{
        width: '100%', boxSizing: 'border-box', padding: '0 12px', minHeight: 42,
        borderRadius: 10, border: `1px solid ${C.line2}`, background: C.sunken,
        fontSize: 16, color: C.ink, fontFamily: 'inherit',
      }}
    />
  )

  const numpad = (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 6 }}>
      {NUM_KEYS.map(k => (
        <button
          key={k}
          type="button"
          onClick={() => pressKey(k)}
          disabled={confirming}
          aria-label={k === '⌫' ? 'Apagar' : k}
          style={{
            minHeight: 46, borderRadius: 10, border: `1px solid ${C.line}`, background: C.sunken,
            color: C.ink, fontSize: 18, fontWeight: 600, fontFamily: C.display,
            cursor: confirming ? 'not-allowed' : 'pointer', fontVariantNumeric: 'tabular-nums',
            WebkitTapHighlightColor: 'transparent',
          }}
        >{k}</button>
      ))}
    </div>
  )

  const statusBlock = (
    <div role="status" style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8,
      padding: '10px 12px', borderRadius: 10, fontSize: 13, fontWeight: 700,
      background: settled ? C.okBg : C.warn.bg,
      border: `1px solid ${settled ? 'rgba(22,163,74,0.25)' : C.warn.border}`,
      color: settled ? C.okInk : C.warn.text,
    }}>
      <span style={{ color: 'inherit' }}>
        {change > 0 ? 'Troco' : settled ? '✓ Total batido' : remaining > 0 ? 'Falta' : 'Passou do total'}
      </span>
      {change > 0 && <span style={{ color: 'inherit', fontFamily: C.display, fontSize: 18, fontVariantNumeric: 'tabular-nums' }}>{formatBRL(change)}</span>}
      {!settled && (
        <span style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'inherit' }}>
          <span style={{ color: 'inherit', fontVariantNumeric: 'tabular-nums' }}>{formatBRL(Math.abs(remaining))}</span>
          {remaining > 0 && (
            <button type="button" onClick={fillRemaining} disabled={confirming} style={{
              minHeight: 30, padding: '0 10px', borderRadius: 8, border: 'none', cursor: 'pointer',
              background: C.warn.text, color: '#fff', fontSize: 11, fontWeight: 700, fontFamily: 'inherit',
            }}>Completar</button>
          )}
        </span>
      )}
    </div>
  )

  const divideBtn = (
    <button type="button" onClick={addPayment} disabled={confirming} style={{
      width: '100%', minHeight: 42, borderRadius: 10, border: `1.5px dashed ${C.line2}`,
      background: 'transparent', color: C.ink2, fontSize: 13, fontWeight: 700, fontFamily: 'inherit',
      cursor: confirming ? 'not-allowed' : 'pointer',
      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
    }}>
      <Plus size={14} strokeWidth={2.4} /> Dividir pagamento
    </button>
  )

  const errorBlock = error ? (
    <div role="alert" style={{
      padding: '9px 12px', borderRadius: 10, fontSize: 12.5, fontWeight: 600,
      background: C.bad.bg, border: `1px solid ${C.bad.border}`, color: C.bad.text,
    }}>{error}</div>
  ) : null

  return createPortal(
    <div className="cx-pay">
      <div
        onClick={confirming ? undefined : onClose}
        style={{
          position: 'fixed', inset: 0, background: 'rgba(17,17,20,0.45)',
          backdropFilter: 'blur(4px)', WebkitBackdropFilter: 'blur(4px)',
          zIndex: 11998, animation: 'cx-fade .18s ease',
        }}
      />
      <div role="dialog" aria-modal="true" aria-labelledby="cx-pay-title" style={{
        position: 'fixed', zIndex: 11999, background: C.card, color: C.ink, fontFamily: C.body,
        display: 'flex', flexDirection: 'column', overflow: 'hidden',
        boxShadow: '0 24px 60px rgba(17,17,20,0.22)',
        ...(isMobile ? {
          left: 0, right: 0,
          top: 'var(--navbar-h, 104px)',
          bottom: 'calc(var(--bottom-nav-h, 64px) + env(safe-area-inset-bottom))',
          borderRadius: '22px 22px 0 0',
          animation: 'cx-up .28s cubic-bezier(.22,1,.36,1)',
        } : {
          // @eligi:pay-safari-center - centro por translate, sem height: fit-content.
          // No Safari, fit-content numa coluna flex com filho flex: 1 (base 0) mede o
          // miolo como 0: o modal abria so com cabecalho e rodape (MacBook, nov/2026).
          top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
          width: 'min(780px, 94vw)', maxHeight: '92vh',
          borderRadius: 20, animation: 'cx-in-c .2s cubic-bezier(.22,1,.36,1)',
        }),
      }}>
        {/* Cabecalho: quanto cobrar */}
        <div style={{
          padding: isMobile ? '16px 18px 12px' : '20px 24px 16px', borderBottom: `1px solid ${C.line}`,
          display: 'flex', alignItems: 'flex-start', gap: 12, flexShrink: 0,
        }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div id="cx-pay-title" style={{
              fontSize: 11, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: C.ink3,
            }}>
              Cobrar{sale.clientName ? ` · ${sale.clientName}` : ''}
            </div>
            <div style={{
              fontFamily: C.display, fontSize: isMobile ? 34 : 40, fontWeight: 700, letterSpacing: '-0.035em',
              lineHeight: 1.05, marginTop: 4, fontVariantNumeric: 'tabular-nums', color: C.ink,
            }}>{formatBRL(total)}</div>
            {sale.discount > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 12, color: C.ink3, textDecoration: 'line-through', fontVariantNumeric: 'tabular-nums' }}>
                  {formatBRL(sale.subtotal)}
                </span>
                <span style={{
                  fontSize: 12, fontWeight: 700, padding: '2px 8px', borderRadius: 6,
                  background: C.warn.bg, border: `1px solid ${C.warn.border}`, color: C.warn.text,
                }}>
                  Desconto −{formatBRL(Math.min(sale.discount, sale.subtotal))}{discountPct && ` · ${discountPct}`}
                </span>
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={confirming}
            aria-label="Fechar"
            style={{
              width: 40, height: 40, borderRadius: '50%', border: `1px solid ${C.line2}`, background: C.card,
              cursor: confirming ? 'not-allowed' : 'pointer', flexShrink: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <X size={16} color={C.ink2} />
          </button>
        </div>

        {success ? (
          <div style={{ flex: '1 1 auto', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '44px 20px', gap: 12 /* @eligi:pay-safari-ok */ }}>
            <span style={{
              width: 68, height: 68, borderRadius: '50%', background: C.ok,
              display: 'flex', alignItems: 'center', justifyContent: 'center', animation: 'cx-pop .35s cubic-bezier(.34,1.56,.64,1)',
            }}>
              <Check size={34} color="#fff" strokeWidth={3} />
            </span>
            <div style={{ fontSize: 19, fontWeight: 700, color: C.ink }}>Venda confirmada</div>
            <div style={{ fontSize: 14, color: C.ink3, fontVariantNumeric: 'tabular-nums' }}>{formatBRL(total)} registrado</div>
          </div>
        ) : (
          <div style={{
            // @eligi:pay-safari-body - base auto: o miolo conta a propria altura e so encolhe (com rolagem) acima de 92vh.
            flex: '1 1 auto', minHeight: 0, overflowY: 'auto', WebkitOverflowScrolling: 'touch',
            padding: isMobile ? '14px 16px' : '18px 24px',
            display: 'grid', gap: 16,
            gridTemplateColumns: isMobile ? 'minmax(0, 1fr)' : 'minmax(0, 1fr) minmax(0, 1fr)',
          }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, minWidth: 0 }}>
              <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: '.07em', textTransform: 'uppercase', color: C.ink3 }}>
                Forma de pagamento
              </div>
              {methodGrid}
              {!isMobile && divideBtn}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, minWidth: 0 }}>
              {splitBar}
              {valueField}
              {refInput}
              {numpad}
              {statusBlock}
              {isMobile && divideBtn}
              {errorBlock}
            </div>
          </div>
        )}

        {!success && (
          <div style={{
            padding: isMobile ? '12px 16px' : '14px 24px', borderTop: `1px solid ${C.line}`,
            background: C.card, display: 'flex', flexDirection: 'column', gap: 10, flexShrink: 0,
          }}>
            {/* @eligi:nfse-switch - aviso fiscal no ultimo momento antes de confirmar */}
            {emitNfse && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', borderRadius: 10,
                background: C.sunken, border: `1px solid ${C.line}`,
              }}>
                <Receipt size={16} color={C.ink2} />
                <span style={{ minWidth: 0 }}>
                  <span style={{ display: 'block', fontSize: 12.5, fontWeight: 700, color: C.ink }}>Nota fiscal será emitida</span>
                  <span style={{ display: 'block', fontSize: 11.5, color: C.ink3, marginTop: 1 }}>
                    {nfseState?.ambienteProducao
                      ? 'A NFS-e dos serviços sai automaticamente após o pagamento'
                      : 'Modo de teste: a nota gerada não tem validade fiscal'}
                  </span>
                </span>
              </div>
            )}
            <div style={{ display: 'flex', gap: 8 }}>
              <button type="button" onClick={onClose} disabled={confirming} style={{
                flex: 1, minHeight: 50, borderRadius: 12, border: `1px solid ${C.line2}`, background: C.card,
                color: C.ink, fontSize: 14, fontWeight: 700, fontFamily: 'inherit',
                cursor: confirming ? 'not-allowed' : 'pointer',
              }}>Voltar</button>
              <button type="button" onClick={handleConfirm} disabled={confirming || !settled} style={{
                flex: 2, minHeight: 50, borderRadius: 12, border: 'none',
                background: (confirming || !settled) ? 'rgba(17,17,20,0.08)' : C.ok,
                color: (confirming || !settled) ? C.ink3 : '#fff',
                fontSize: 15, fontWeight: 700, fontFamily: 'inherit',
                cursor: (confirming || !settled) ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              }}>
                {confirming
                  ? <><Loader2 size={16} className="cx-pay-spin" /> Confirmando…</>
                  : <><Check size={16} strokeWidth={2.6} /> Confirmar {formatBRL(total)}</>}
              </button>
            </div>
          </div>
        )}
      </div>
      <style>{`
        @keyframes cx-fade { from { opacity: 0 } to { opacity: 1 } }
        @keyframes cx-up   { from { transform: translateY(100%) } to { transform: translateY(0) } }
        @keyframes cx-in   { from { opacity: 0; transform: scale(.96) } to { opacity: 1; transform: scale(1) } }
        @keyframes cx-in-c { from { opacity: 0; transform: translate(-50%, -50%) scale(.96) } to { opacity: 1; transform: translate(-50%, -50%) scale(1) } } /* @eligi:pay-safari-kf */
        @keyframes cx-pop  { from { transform: scale(.6); opacity: 0 } to { transform: scale(1); opacity: 1 } }
        @keyframes cx-pay-spin-k { to { transform: rotate(360deg) } }
        .cx-pay-spin { animation: cx-pay-spin-k .8s linear infinite }
        .cx-pay button:focus-visible, .cx-pay input:focus-visible { outline: 2px solid ${C.ink}; outline-offset: 2px }
        @media (prefers-reduced-motion: reduce) {
          .cx-pay * { animation: none !important }
        }
      `}</style>
    </div>,
    document.body,
  )
}
