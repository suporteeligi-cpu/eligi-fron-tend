'use client'
// src/app/dashboard/caixa/components/CreditNoteModal.tsx

import { useState } from 'react'
import { createPortal } from 'react-dom'
import { X, AlertTriangle, FileX, Loader2 } from 'lucide-react'
import api from '@/shared/lib/apiClient'
import { colors, typography, radius, shadows } from '@/shared/theme'
import { Sale } from '@/features/sales/types'
import { formatBRL } from '@/features/sales/utils/format'

interface Props {
  sale:     Sale
  isMobile: boolean
  onClose:  () => void
  onIssued: () => void
}

export default function CreditNoteModal({ sale, isMobile, onClose, onIssued }: Props) {
  const [reason,      setReason]      = useState('')
  const [refundStock, setRefundStock] = useState(true)
  const [submitting,  setSubmitting]  = useState(false)
  const [error,       setError]       = useState<string | null>(null)

  // Calcula quanto já foi anulado anteriormente
  const previouslyCredited = sale.creditNotes.reduce((s, n) => s + n.amount, 0)
  const remaining = sale.total - previouslyCredited
  const hasTrackedProducts = sale.items.some(i =>
    i.type === 'PRODUCT' && i.product?.trackStock,
  )

  async function handleSubmit() {
    if (!reason.trim()) {
      setError('Motivo é obrigatório')
      return
    }
    try {
      setSubmitting(true)
      setError(null)
      await api.post(`/sales/${sale.id}/credit-notes`, {
        reason:      reason.trim(),
        refundStock: hasTrackedProducts && refundStock,
      })
      onIssued()
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: string } } }
      setError(e.response?.data?.error ?? 'Erro ao emitir nota de crédito')
      setSubmitting(false)
    }
  }

  if (typeof document === 'undefined') return null

  return createPortal(
    <>
      <div
        onClick={submitting ? undefined : onClose}
        style={{
          position: 'fixed', inset: 0,
          background: 'rgba(0,0,0,0.40)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          zIndex: 11998,
          animation: 'cn-fade 0.18s ease',
        }}
      />

      <div style={isMobile ? {
        position: 'fixed', bottom: 0, left: 0, right: 0,
        top: 'var(--navbar-h, 60px)',
        background: '#fff',
        borderRadius: '24px 24px 0 0',
        boxShadow: '0 -8px 40px rgba(0,0,0,0.18)',
        zIndex: 11999,
        display: 'flex', flexDirection: 'column',
        fontFamily: typography.fontFamily,
        animation: 'cn-up 0.30s cubic-bezier(0.34, 1.2, 0.64, 1)',
      } : {
        position: 'fixed', top: '50%', left: '50%',
        transform: 'translate(-50%, -50%)',
        width: 480, maxWidth: '94vw',
        background: '#fff',
        borderRadius: radius['2xl'],
        boxShadow: shadows.lg,
        zIndex: 11999,
        display: 'flex', flexDirection: 'column',
        fontFamily: typography.fontFamily,
        animation: 'cn-in 0.22s cubic-bezier(0.34, 1.56, 0.64, 1)',
        overflow: 'hidden',
      }}>
        <style>{`
          @keyframes cn-fade { from { opacity:0 } to { opacity:1 } }
          @keyframes cn-in   { from { opacity:0; transform: translate(-50%,-50%) scale(0.93) } to { opacity:1; transform: translate(-50%,-50%) scale(1) } }
          @keyframes cn-up   { from { transform: translateY(100%) } to { transform: translateY(0) } }
          @keyframes cn-spin { to { transform: rotate(360deg) } }
        `}</style>

        {isMobile && (
          <div aria-hidden style={{
            width: 40, height: 4, borderRadius: 2,
            background: 'rgba(0,0,0,0.12)',
            margin: '12px auto 0',
            flexShrink: 0,
          }} />
        )}

        {/* Header */}
        <div style={{
          padding: '16px 20px',
          borderBottom: `1px solid ${colors.gray.border}`,
          flexShrink: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 10,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 9,
              background: 'rgba(245,158,11,0.12)',
              color: '#b45309',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}>
              <FileX size={16} strokeWidth={2} />
            </div>
            <div>
              <h3 style={{
                margin: 0,
                fontSize: 16, fontWeight: 700,
                color: colors.gray[900],
                letterSpacing: '-0.02em',
              }}>
                Emitir nota de crédito
              </h3>
              <p style={{
                margin: '2px 0 0',
                fontSize: 11,
                color: colors.gray.dimText,
              }}>
                Anula a venda confirmada com auditoria preservada
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={submitting}
            aria-label="Fechar"
            style={{
              width: 30, height: 30, borderRadius: '50%',
              border: `1px solid ${colors.gray.borderMd}`,
              background: 'transparent',
              cursor: submitting ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <X size={14} color={colors.gray.dimText} />
          </button>
        </div>

        {/* Body */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: '16px 20px',
          display: 'flex', flexDirection: 'column', gap: 14,
          WebkitOverflowScrolling: 'touch',
        }}>
          {/* Aviso */}
          <div style={{
            display: 'flex', gap: 10,
            padding: '10px 12px',
            background: 'rgba(245,158,11,0.06)',
            border: '1px solid rgba(245,158,11,0.25)',
            borderRadius: 9,
            fontSize: 12,
            color: '#92400e',
          }}>
            <AlertTriangle size={14} strokeWidth={2} style={{ flexShrink: 0, marginTop: 1 }} />
            <span>
              A venda <strong>permanece registrada</strong> e os pagamentos não são estornados.
              A nota de crédito documenta a anulação financeira pra auditoria.
            </span>
          </div>

          {/* Valor */}
          <div style={{
            padding: '12px 14px',
            background: colors.background.page,
            borderRadius: 10,
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          }}>
            <div>
              <div style={{
                fontSize: 10, fontWeight: 700,
                color: colors.gray.dimText,
                textTransform: 'uppercase',
                letterSpacing: '.06em',
              }}>
                Valor da NC
              </div>
              {previouslyCredited > 0 && (
                <div style={{ fontSize: 10, color: colors.gray.dimText, marginTop: 2 }}>
                  Anulação anterior: {formatBRL(previouslyCredited)}
                </div>
              )}
            </div>
            <div style={{
              fontSize: 22, fontWeight: 700,
              color: colors.red.DEFAULT,
              fontVariantNumeric: 'tabular-nums',
              letterSpacing: '-0.02em',
            }}>
              {formatBRL(remaining)}
            </div>
          </div>

          {/* Motivo */}
          <div>
            <label style={{
              display: 'block',
              fontSize: 11, fontWeight: 700,
              color: colors.gray.dimText,
              textTransform: 'uppercase',
              letterSpacing: '.07em',
              marginBottom: 6,
            }}>
              Motivo *
            </label>
            <textarea
              value={reason}
              onChange={e => setReason(e.target.value)}
              placeholder="Ex: Cliente alérgico, devolveu lacrado"
              disabled={submitting}
              rows={3}
              style={{
                width: '100%', boxSizing: 'border-box',
                padding: '10px 12px',
                borderRadius: 9,
                border: `1px solid ${colors.gray.borderMd}`,
                fontSize: 13,
                outline: 'none',
                resize: 'none',
                fontFamily: 'inherit',
                color: colors.gray[900],
                minHeight: 70,
              }}
            />
          </div>

          {/* Devolver estoque */}
          {hasTrackedProducts && (
            <button
              onClick={() => setRefundStock(!refundStock)}
              type="button"
              disabled={submitting}
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '12px',
                background: refundStock ? 'rgba(22,163,74,0.06)' : colors.background.page,
                border: `1px solid ${refundStock ? 'rgba(22,163,74,0.25)' : colors.gray.border}`,
                borderRadius: 9,
                cursor: submitting ? 'not-allowed' : 'pointer',
                textAlign: 'left',
                fontFamily: 'inherit',
                WebkitTapHighlightColor: 'transparent',
              }}
            >
              <div style={{
                width: 22, height: 22, borderRadius: 5,
                border: `2px solid ${refundStock ? '#15803d' : colors.gray.borderMd}`,
                background: refundStock ? '#15803d' : 'transparent',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
              }}>
                {refundStock && (
                  <span style={{ color: '#fff', fontSize: 14, fontWeight: 800, lineHeight: 1 }}>✓</span>
                )}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{
                  fontSize: 13, fontWeight: 700,
                  color: colors.gray[900],
                }}>
                  Devolver produtos ao estoque
                </div>
                <div style={{
                  fontSize: 11,
                  color: colors.gray.dimText,
                  marginTop: 2,
                }}>
                  Registra movimentações de entrada (IN) pros produtos rastreados
                </div>
              </div>
            </button>
          )}

          {error && (
            <div style={{
              padding: '10px 12px',
              background: 'rgba(220,38,38,0.06)',
              border: `1px solid ${colors.red.border}`,
              borderRadius: 9,
              fontSize: 12,
              color: colors.red.DEFAULT,
            }}>
              {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{
          padding: isMobile
            ? '12px 20px max(20px, env(safe-area-inset-bottom))'
            : '14px 20px',
          display: 'flex', gap: 8,
          borderTop: `1px solid ${colors.gray.border}`,
          flexShrink: 0,
        }}>
          <button
            onClick={onClose}
            disabled={submitting}
            style={{
              flex: 1, padding: '12px',
              borderRadius: 10,
              border: `1px solid ${colors.gray.borderMd}`,
              background: 'transparent',
              fontSize: 13, cursor: submitting ? 'not-allowed' : 'pointer',
              color: colors.gray[700], fontWeight: 600,
              fontFamily: 'inherit',
            }}
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting || !reason.trim()}
            style={{
              flex: 2, padding: '12px',
              borderRadius: 10,
              border: 'none',
              background: (submitting || !reason.trim())
                ? colors.gray.borderMd
                : 'linear-gradient(135deg, #b45309, #92400e)',
              color: (submitting || !reason.trim()) ? colors.gray.dimText : '#fff',
              fontSize: 13,
              cursor: (submitting || !reason.trim()) ? 'not-allowed' : 'pointer',
              fontWeight: 700,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              fontFamily: 'inherit',
              letterSpacing: '.04em',
              textTransform: 'uppercase',
            }}
          >
            {submitting
              ? <><Loader2 size={13} style={{ animation: 'cn-spin 0.8s linear infinite' }} />Emitindo...</>
              : <><FileX size={13} strokeWidth={2.5} />Emitir NC</>}
          </button>
        </div>
      </div>
    </>,
    document.body,
  )
}
