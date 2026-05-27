'use client'
// src/app/dashboard/caixa/components/PaymentModal.tsx
//
// Modal full-screen pra confirmar venda com pagamento misto.
// Lista os métodos disponíveis, permite adicionar quantos pagamentos quiser,
// valida soma == total da venda, e dispara POST /sales/:id/confirm.

import { useState } from 'react'
import { createPortal } from 'react-dom'
import { X, Plus, Check, Loader2, Trash2, AlertCircle } from 'lucide-react'

import api from '@/shared/lib/apiClient'
import { colors, typography, transitions, radius } from '@/shared/theme'
import { Sale, PaymentMethod, PaymentLineInput } from '@/features/sales/types'
import {
  formatBRL, PAYMENT_METHOD_LABEL, PAYMENT_METHOD_ICON, PAYMENT_METHOD_ORDER,
} from '@/features/sales/utils/format'

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
  const [discount,  setDiscount]  = useState(sale.discount.toString())
  const [confirming, setConfirming] = useState(false)
  const [error,      setError]      = useState<string | null>(null)
  const [success,    setSuccess]    = useState(false)

  // Cálculo do total considerando desconto aplicado no modal
  const parsedDiscount = parseFloat(discount.replace(',', '.')) || 0
  const subtotal = sale.subtotal
  const effectiveDiscount = Math.max(0, Math.min(subtotal, parsedDiscount))
  const effectiveTotal = subtotal - effectiveDiscount

  // Soma dos pagamentos
  const paidSum = payments.reduce((s, p) => {
    const v = parseFloat(p.amount.replace(',', '.')) || 0
    return s + v
  }, 0)
  const remaining = effectiveTotal - paidSum

  function updatePayment(i: number, patch: Partial<PaymentRow>) {
    setPayments(prev => prev.map((p, idx) => idx === i ? { ...p, ...patch } : p))
  }

  function removePayment(i: number) {
    setPayments(prev => prev.filter((_, idx) => idx !== i))
  }

  function addPayment(method: PaymentMethod = 'CASH') {
    // Pré-preenche com valor restante (se houver)
    const fill = remaining > 0 ? remaining.toFixed(2) : '0.00'
    setPayments(prev => [...prev, { method, amount: fill, reference: '' }])
  }

  function fillRemainingOnLast() {
    if (payments.length === 0 || remaining <= 0) return
    const lastIdx = payments.length - 1
    const last = payments[lastIdx]
    const currentLast = parseFloat(last.amount.replace(',', '.')) || 0
    updatePayment(lastIdx, {
      amount: (currentLast + remaining).toFixed(2),
    })
  }

  async function handleConfirm() {
    setError(null)

    if (payments.length === 0) {
      setError('Adicione ao menos um pagamento')
      return
    }
    if (Math.abs(remaining) > 0.01) {
      setError(
        remaining > 0
          ? `Falta ${formatBRL(remaining)} — adicione mais pagamento`
          : `Excedeu em ${formatBRL(-remaining)} — ajuste valores`,
      )
      return
    }

    const validPayments: PaymentLineInput[] = []
    for (const p of payments) {
      const amount = parseFloat(p.amount.replace(',', '.'))
      if (isNaN(amount) || amount <= 0) {
        setError(`Valor inválido em ${PAYMENT_METHOD_LABEL[p.method]}`)
        return
      }
      validPayments.push({
        method: p.method,
        amount,
        reference: p.reference.trim() || undefined,
      })
    }

    try {
      setConfirming(true)
      const res = await api.post(`/sales/${sale.id}/confirm`, {
        discount: effectiveDiscount,
        payments: validPayments,
      })
      const confirmed = res.data?.data ?? res.data
      setSuccess(true)
      setTimeout(() => {
        onPaid(confirmed)
      }, 900)
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: string } } }
      setError(e.response?.data?.error ?? 'Erro ao confirmar venda')
      setConfirming(false)
    }
  }

  if (typeof document === 'undefined') return null

  return createPortal(
    <>
      <div
        onClick={confirming ? undefined : onClose}
        style={{
          position: 'fixed', inset: 0,
          background: 'rgba(0,0,0,0.55)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          zIndex: 11998,
          animation: 'pay-fade 0.20s ease',
        }}
      />

      <div style={{
        position: 'fixed',
        inset: 0,
        top: isMobile ? 'var(--navbar-h, 60px)' : 0,
        bottom: isMobile ? 'var(--bottom-nav-h, 0px)' : 0,
        margin: isMobile ? 0 : 'auto',
        width: isMobile ? '100%' : 720,
        maxWidth: isMobile ? '100%' : '94vw',
        maxHeight: isMobile ? 'auto' : '92vh',
        background: '#f8f8fa',
        borderRadius: isMobile ? '24px 24px 0 0' : radius['2xl'],
        boxShadow: '0 30px 60px rgba(0,0,0,0.30)',
        zIndex: 11999,
        display: 'flex',
        flexDirection: 'column',
        fontFamily: typography.fontFamily,
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
        <div style={{
          background: 'linear-gradient(135deg, #1e293b, #0f172a)',
          padding: isMobile ? '18px 20px' : '22px 26px',
          color: '#fff',
          flexShrink: 0,
        }}>
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            marginBottom: 10,
          }}>
            <span style={{
              fontSize: 11, fontWeight: 700,
              color: 'rgba(255,255,255,0.55)',
              textTransform: 'uppercase',
              letterSpacing: '.08em',
            }}>
              Confirmar pagamento
            </span>
            <button
              onClick={onClose}
              disabled={confirming}
              aria-label="Fechar"
              style={{
                width: 32, height: 32, borderRadius: '50%',
                border: '1px solid rgba(255,255,255,0.15)',
                background: 'rgba(255,255,255,0.08)',
                cursor: confirming ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                opacity: confirming ? 0.5 : 1,
              }}
            >
              <X size={14} color="#fff" strokeWidth={2.5} />
            </button>
          </div>

          <div style={{
            fontSize: 11, fontWeight: 600,
            color: 'rgba(255,255,255,0.5)',
            marginBottom: 3,
          }}>
            Total da venda
          </div>
          <div style={{
            fontSize: 32, fontWeight: 800,
            letterSpacing: '-0.03em',
            fontVariantNumeric: 'tabular-nums',
            lineHeight: 1.1,
          }}>
            {formatBRL(effectiveTotal)}
          </div>
          {effectiveDiscount > 0 && (
            <div style={{
              fontSize: 11,
              color: 'rgba(255,255,255,0.55)',
              marginTop: 4,
            }}>
              Subtotal {formatBRL(subtotal)} − desconto {formatBRL(effectiveDiscount)}
            </div>
          )}
        </div>

        {/* Body */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: isMobile ? '14px 18px' : '18px 26px',
          WebkitOverflowScrolling: 'touch',
        }}>
          {success ? (
            <div style={{
              display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center',
              padding: '40px 20px',
              gap: 14,
            }}>
              <div style={{
                width: 72, height: 72, borderRadius: '50%',
                background: 'linear-gradient(135deg, #22c55e, #16a34a)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 12px 32px rgba(22,163,74,0.35)',
                animation: 'pay-pop 0.4s cubic-bezier(0.34,1.56,0.64,1)',
              }}>
                <Check size={36} color="#fff" strokeWidth={3} />
              </div>
              <div style={{
                fontSize: 19, fontWeight: 800,
                color: colors.gray[900],
              }}>
                Venda confirmada!
              </div>
              <div style={{
                fontSize: 14,
                color: colors.gray.dimText,
              }}>
                {formatBRL(effectiveTotal)} registrado
              </div>
            </div>
          ) : (
            <>
              {/* Desconto */}
              <div style={{
                background: '#fff',
                borderRadius: 12,
                padding: '12px 14px',
                marginBottom: 14,
                border: `1px solid ${colors.gray.border}`,
              }}>
                <label style={{
                  display: 'block',
                  fontSize: 10, fontWeight: 700,
                  color: colors.gray.dimText,
                  textTransform: 'uppercase',
                  letterSpacing: '.07em',
                  marginBottom: 6,
                }}>
                  Desconto adicional (opcional)
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{
                    fontSize: 12,
                    color: colors.gray.dimText,
                    fontWeight: 600,
                  }}>R$</span>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={discount}
                    onChange={e => setDiscount(e.target.value.replace(/[^\d,.]/g, ''))}
                    placeholder="0,00"
                    disabled={confirming}
                    style={{
                      flex: 1, border: 'none', outline: 'none',
                      fontSize: 16, fontWeight: 700,
                      textAlign: 'right',
                      background: 'transparent',
                      color: colors.gray[900],
                      fontFamily: 'inherit',
                      fontVariantNumeric: 'tabular-nums',
                    }}
                  />
                </div>
              </div>

              {/* Lista de pagamentos */}
              <div style={{
                fontSize: 11, fontWeight: 700,
                color: colors.gray.dimText,
                textTransform: 'uppercase',
                letterSpacing: '.07em',
                marginBottom: 10,
              }}>
                Pagamentos ({payments.length})
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {payments.map((p, i) => {
                  const Icon = PAYMENT_METHOD_ICON[p.method]
                  return (
                    <div key={i} style={{
                      background: '#fff',
                      borderRadius: 12,
                      padding: '12px 14px',
                      border: `1px solid ${colors.gray.border}`,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 10,
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{
                          width: 36, height: 36, borderRadius: 9,
                          background: colors.gray.hover,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          flexShrink: 0,
                        }}>
                          <Icon size={16} color={colors.gray[700]} strokeWidth={2} />
                        </div>
                        <select
                          value={p.method}
                          onChange={e => updatePayment(i, { method: e.target.value as PaymentMethod })}
                          disabled={confirming}
                          style={{
                            flex: 1,
                            padding: '7px 10px',
                            borderRadius: 8,
                            border: `1px solid ${colors.gray.borderMd}`,
                            fontSize: 13,
                            fontWeight: 600,
                            background: '#fff',
                            color: colors.gray[900],
                            fontFamily: 'inherit',
                            cursor: 'pointer',
                            appearance: 'none',
                          }}
                        >
                          {PAYMENT_METHOD_ORDER.map(m => (
                            <option key={m} value={m}>{PAYMENT_METHOD_LABEL[m]}</option>
                          ))}
                        </select>
                        {payments.length > 1 && (
                          <button
                            onClick={() => removePayment(i)}
                            disabled={confirming}
                            aria-label="Remover"
                            style={{
                              width: 30, height: 30, borderRadius: 7,
                              border: `1px solid ${colors.gray.borderMd}`,
                              background: 'transparent',
                              cursor: confirming ? 'not-allowed' : 'pointer',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              color: colors.gray.dimText,
                              flexShrink: 0,
                            }}
                          >
                            <Trash2 size={12} strokeWidth={2} />
                          </button>
                        )}
                      </div>

                      <div style={{ display: 'flex', gap: 8 }}>
                        <div style={{ flex: 1.4, position: 'relative' }}>
                          <span style={{
                            position: 'absolute', left: 10, top: '50%',
                            transform: 'translateY(-50%)',
                            fontSize: 11, color: colors.gray.dimText, fontWeight: 600,
                            pointerEvents: 'none',
                          }}>R$</span>
                          <input
                            type="text"
                            inputMode="decimal"
                            value={p.amount}
                            onChange={e => updatePayment(i, { amount: e.target.value.replace(/[^\d,.]/g, '') })}
                            placeholder="0,00"
                            disabled={confirming}
                            style={{
                              width: '100%',
                              padding: '10px 12px 10px 30px',
                              borderRadius: 9,
                              border: `1px solid ${colors.gray.borderMd}`,
                              fontSize: 15,
                              fontWeight: 700,
                              textAlign: 'right',
                              outline: 'none',
                              fontVariantNumeric: 'tabular-nums',
                              fontFamily: 'inherit',
                              color: colors.gray[900],
                              boxSizing: 'border-box',
                            }}
                          />
                        </div>
                        <input
                          value={p.reference}
                          onChange={e => updatePayment(i, { reference: e.target.value })}
                          placeholder="Ref / NSU"
                          disabled={confirming}
                          style={{
                            flex: 1,
                            padding: '10px 12px',
                            borderRadius: 9,
                            border: `1px solid ${colors.gray.borderMd}`,
                            fontSize: 12,
                            outline: 'none',
                            fontFamily: 'inherit',
                            color: colors.gray[700],
                            boxSizing: 'border-box',
                          }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Add pagamento */}
              <button
                onClick={() => addPayment()}
                disabled={confirming}
                style={{
                  width: '100%',
                  marginTop: 10,
                  padding: '10px',
                  borderRadius: 10,
                  border: `1.5px dashed ${colors.gray.borderMd}`,
                  background: 'transparent',
                  cursor: confirming ? 'not-allowed' : 'pointer',
                  fontSize: 12, fontWeight: 700,
                  color: colors.gray[700],
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
                  fontFamily: 'inherit',
                  letterSpacing: '.04em',
                  textTransform: 'uppercase',
                  WebkitTapHighlightColor: 'transparent',
                }}
              >
                <Plus size={12} strokeWidth={2.5} />
                Adicionar pagamento
              </button>

              {/* Sumário do que falta/sobra */}
              <div style={{
                marginTop: 14,
                padding: '12px 14px',
                background: Math.abs(remaining) < 0.01
                  ? 'rgba(22,163,74,0.08)'
                  : remaining > 0
                    ? 'rgba(245,158,11,0.10)'
                    : 'rgba(220,38,38,0.08)',
                border: `1px solid ${
                  Math.abs(remaining) < 0.01
                    ? 'rgba(22,163,74,0.25)'
                    : remaining > 0
                      ? 'rgba(245,158,11,0.30)'
                      : colors.red.border
                }`,
                borderRadius: 10,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                fontSize: 13,
              }}>
                <span style={{
                  fontWeight: 700,
                  color: Math.abs(remaining) < 0.01
                    ? '#15803d'
                    : remaining > 0
                      ? '#b45309'
                      : colors.red.DEFAULT,
                }}>
                  {Math.abs(remaining) < 0.01
                    ? '✓ Total batido'
                    : remaining > 0
                      ? `Falta ${formatBRL(remaining)}`
                      : `Sobra ${formatBRL(-remaining)}`}
                </span>
                {remaining > 0.01 && payments.length > 0 && (
                  <button
                    onClick={fillRemainingOnLast}
                    disabled={confirming}
                    style={{
                      padding: '5px 10px',
                      borderRadius: 6,
                      border: 'none',
                      background: '#b45309',
                      color: '#fff',
                      fontSize: 11,
                      fontWeight: 700,
                      cursor: 'pointer',
                      fontFamily: 'inherit',
                    }}
                  >
                    Preencher
                  </button>
                )}
              </div>

              {error && (
                <div style={{
                  marginTop: 12,
                  padding: '10px 12px',
                  background: 'rgba(220,38,38,0.08)',
                  border: `1px solid ${colors.red.border}`,
                  borderRadius: 9,
                  fontSize: 12,
                  color: colors.red.DEFAULT,
                  display: 'flex', alignItems: 'center', gap: 7,
                }}>
                  <AlertCircle size={13} strokeWidth={2.5} />
                  {error}
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        {!success && (
          <div style={{
            padding: isMobile
              ? '12px 18px max(16px, env(safe-area-inset-bottom))'
              : '14px 26px',
            background: '#fff',
            borderTop: `1px solid ${colors.gray.border}`,
            display: 'flex', gap: 10,
            flexShrink: 0,
          }}>
            <button
              onClick={onClose}
              disabled={confirming}
              style={{
                flex: 1,
                padding: '13px',
                borderRadius: 11,
                border: `1px solid ${colors.gray.borderMd}`,
                background: 'transparent',
                fontSize: 13,
                fontWeight: 700,
                cursor: confirming ? 'not-allowed' : 'pointer',
                color: colors.gray[700],
                fontFamily: 'inherit',
                letterSpacing: '.04em',
                textTransform: 'uppercase',
                WebkitTapHighlightColor: 'transparent',
              }}
            >
              Cancelar
            </button>
            <button
              onClick={handleConfirm}
              disabled={confirming || Math.abs(remaining) > 0.01}
              style={{
                flex: 2,
                padding: '13px',
                borderRadius: 11,
                border: 'none',
                background: (confirming || Math.abs(remaining) > 0.01)
                  ? 'rgba(0,0,0,0.07)'
                  : 'linear-gradient(135deg, #1e293b, #0f172a)',
                color: (confirming || Math.abs(remaining) > 0.01)
                  ? colors.gray.dimText
                  : '#fff',
                fontSize: 13,
                fontWeight: 800,
                cursor: (confirming || Math.abs(remaining) > 0.01) ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
                fontFamily: 'inherit',
                letterSpacing: '.05em',
                textTransform: 'uppercase',
                boxShadow: (confirming || Math.abs(remaining) > 0.01)
                  ? 'none'
                  : '0 6px 20px rgba(15,23,42,0.30)',
                transition: `all ${transitions.spring}`,
                WebkitTapHighlightColor: 'transparent',
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
