'use client'
// src/app/dashboard/financeiro/comissoes/components/MarkAsPaidModal.tsx

import { useState, useEffect } from 'react'
import { X, Loader2, AlertTriangle, CheckCircle2 } from 'lucide-react'
import api from '@/shared/lib/apiClient'
import { colors, typography, radius, shadows, transitions } from '@/shared/theme'
import { PayoutListItem, PayoutMethod } from '@/features/payouts/types'
import { fmtBRL } from '@/features/payouts/utils/format'

interface Props {
  payout:   PayoutListItem
  isMobile: boolean
  onClose:  () => void
  onPaid:   () => void
}

const METHODS: Array<{ value: PayoutMethod; label: string; emoji: string }> = [
  { value: 'PIX',      label: 'PIX',           emoji: '💸' },
  { value: 'CASH',     label: 'Dinheiro',      emoji: '💵' },
  { value: 'TRANSFER', label: 'Transferência', emoji: '🏦' },
  { value: 'OTHER',    label: 'Outros',        emoji: '📝' },
]

export default function MarkAsPaidModal({ payout, isMobile, onClose, onPaid }: Props) {
  const [method, setMethod] = useState<PayoutMethod>('PIX')
  const [note, setNote]     = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError]   = useState<string | null>(null)

  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = prev }
  }, [])

  async function confirm() {
    setError(null)
    setSaving(true)
    try {
      await api.post(`/payouts/${payout.id}/pay`, {
        method,
        note: note.trim() || undefined,
      })
      onPaid()
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: string } } }
      setError(e.response?.data?.error ?? 'Erro ao confirmar pagamento')
      setSaving(false)
    }
  }

  const sheetStyle: React.CSSProperties = isMobile
    ? {
        position: 'fixed',
        bottom: 0, left: 0, right: 0,
        maxHeight: '92vh',
        borderTopLeftRadius: 18,
        borderTopRightRadius: 18,
        animation: 'slideUp 0.25s ease',
      }
    : {
        position: 'fixed',
        top: '50%', left: '50%',
        transform: 'translate(-50%, -50%)',
        width: '92%',
        maxWidth: 440,
        maxHeight: '90vh',
        borderRadius: radius.xl,
        animation: 'fadeScale 0.2s ease',
      }

  return (
    <>
      <style>{`
        @keyframes slideUp {
          from { transform: translateY(100%); }
          to   { transform: translateY(0); }
        }
        @keyframes fadeScale {
          from { opacity: 0; transform: translate(-50%, -50%) scale(0.95); }
          to   { opacity: 1; transform: translate(-50%, -50%) scale(1); }
        }
        @keyframes pos-spin { to { transform: rotate(360deg); } }
      `}</style>

      <div
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.45)',
          backdropFilter: 'blur(2px)',
          zIndex: 1000,
        }}
      />

      <div style={{
        ...sheetStyle,
        background: '#fff',
        boxShadow: shadows.lg,
        zIndex: 1001,
        fontFamily: typography.fontFamily,
        display: 'flex', flexDirection: 'column',
        overflow: 'hidden',
      }}>
        {/* Header */}
        <div style={{
          padding: '16px 18px',
          borderBottom: `1px solid ${colors.gray.border}`,
          display: 'flex', alignItems: 'center', gap: 10,
          flexShrink: 0,
        }}>
          <div style={{
            width: 32, height: 32, borderRadius: '50%',
            background: 'linear-gradient(135deg, #16a34a, #15803d)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <CheckCircle2 size={16} color="#fff" strokeWidth={2.4} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{
              fontSize: typography.scale.lg,
              fontWeight: typography.weight.bold,
              color: typography.color.primary,
            }}>
              Confirmar pagamento
            </div>
            <div style={{ fontSize: typography.scale.sm, color: typography.color.muted }}>
              Para {payout.professional.name}
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Fechar"
            style={{
              width: 30, height: 30, borderRadius: '50%',
              border: `1px solid ${colors.gray.border}`,
              background: '#fff',
              cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <X size={13} color={colors.gray.dimText} />
          </button>
        </div>

        {/* Body */}
        <div style={{
          flex: 1, overflowY: 'auto',
          padding: '18px',
          display: 'flex', flexDirection: 'column', gap: 18,
        }}>
          {/* Resumo do valor */}
          <div style={{
            padding: '14px 16px',
            background: 'linear-gradient(135deg, #1e293b, #0f172a)',
            borderRadius: radius.md,
            color: '#fff',
          }}>
            <div style={{
              fontSize: 10,
              fontWeight: typography.weight.bold,
              color: 'rgba(255,255,255,0.65)',
              textTransform: 'uppercase',
              letterSpacing: '.08em',
              marginBottom: 4,
            }}>
              VALOR A PAGAR
            </div>
            <div style={{
              color: '#fff',
              fontSize: 28,
              fontWeight: typography.weight.bold,
              fontVariantNumeric: 'tabular-nums',
              letterSpacing: '-0.02em',
              lineHeight: 1,
            }}>
              {fmtBRL(payout.totalAmount)}
            </div>
            <div style={{
              marginTop: 8,
              paddingTop: 8,
              borderTop: '1px solid rgba(255,255,255,0.15)',
              display: 'flex', gap: 16,
              fontSize: typography.scale.sm,
              color: 'rgba(255,255,255,0.7)',
            }}>
              {payout.serviceAmount > 0 && (
                <span>Serviços: <strong style={{ color: '#fff' }}>{fmtBRL(payout.serviceAmount)}</strong></span>
              )}
              {payout.productAmount > 0 && (
                <span>Produtos: <strong style={{ color: '#fff' }}>{fmtBRL(payout.productAmount)}</strong></span>
              )}
              <span style={{ marginLeft: 'auto' }}>
                {payout.itemsCount} {payout.itemsCount === 1 ? 'item' : 'itens'}
              </span>
            </div>
          </div>

          {/* Método de pagamento */}
          <div>
            <label style={labelStyle}>FORMA DE PAGAMENTO</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 6 }}>
              {METHODS.map(m => (
                <button
                  key={m.value}
                  onClick={() => setMethod(m.value)}
                  type="button"
                  style={{
                    padding: '11px 12px',
                    borderRadius: radius.sm,
                    border: `1px solid ${method === m.value ? colors.red.DEFAULT : colors.gray.borderMd}`,
                    background: method === m.value ? colors.red.subtle : '#fff',
                    color: method === m.value ? colors.red.DEFAULT : typography.color.primary,
                    fontSize: typography.scale.sm,
                    fontWeight: typography.weight.semibold,
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                    display: 'flex', alignItems: 'center', gap: 8,
                    transition: `all ${transitions.fast}`,
                    WebkitTapHighlightColor: 'transparent',
                  }}
                >
                  <span style={{ fontSize: 16 }}>{m.emoji}</span>
                  <span>{m.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Nota opcional */}
          <div>
            <label style={labelStyle}>OBSERVAÇÃO (OPCIONAL)</label>
            <textarea
              value={note}
              onChange={e => setNote(e.target.value)}
              placeholder="Ex: PIX via Banco Nubank, comprovante #1234..."
              rows={2}
              maxLength={280}
              style={{
                width: '100%', boxSizing: 'border-box',
                padding: '10px 12px',
                borderRadius: radius.sm,
                border: `1px solid ${colors.gray.borderMd}`,
                fontSize: typography.scale.sm,
                outline: 'none',
                resize: 'none',
                fontFamily: 'inherit',
                color: typography.color.primary,
                background: colors.background.page,
              }}
            />
            <div style={{
              fontSize: 10,
              color: typography.color.muted,
              marginTop: 4,
              textAlign: 'right',
            }}>
              {note.length} / 280
            </div>
          </div>

          {error && (
            <div style={{
              padding: '10px 12px',
              background: 'rgba(220,38,38,0.08)',
              border: `1px solid ${colors.red.border}`,
              borderRadius: radius.sm,
              fontSize: typography.scale.sm,
              color: colors.red.DEFAULT,
              display: 'flex', alignItems: 'center', gap: 8,
            }}>
              <AlertTriangle size={14} />
              {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{
          padding: '14px 18px',
          borderTop: `1px solid ${colors.gray.border}`,
          display: 'flex', gap: 8,
          flexShrink: 0,
        }}>
          <button
            onClick={onClose}
            disabled={saving}
            style={{
              padding: '11px 18px',
              borderRadius: radius.sm,
              border: `1px solid ${colors.gray.borderMd}`,
              background: '#fff',
              color: typography.color.primary,
              fontSize: typography.scale.sm,
              fontWeight: typography.weight.semibold,
              cursor: 'pointer',
              fontFamily: 'inherit',
              WebkitTapHighlightColor: 'transparent',
            }}
          >
            Cancelar
          </button>
          <button
            onClick={confirm}
            disabled={saving}
            style={{
              flex: 1,
              padding: '11px 18px',
              borderRadius: radius.sm,
              border: 'none',
              background: saving ? colors.gray.dimTextLight : 'linear-gradient(135deg, #16a34a, #15803d)',
              color: '#fff',
              fontSize: typography.scale.sm,
              fontWeight: typography.weight.bold,
              cursor: saving ? 'not-allowed' : 'pointer',
              fontFamily: 'inherit',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              boxShadow: saving ? 'none' : '0 6px 18px rgba(22,163,74,0.32)',
              WebkitTapHighlightColor: 'transparent',
            }}
          >
            {saving && <Loader2 size={14} style={{ animation: 'pos-spin 0.8s linear infinite' }} />}
            {saving ? 'Confirmando…' : `Confirmar · ${fmtBRL(payout.totalAmount)}`}
          </button>
        </div>
      </div>
    </>
  )
}

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: typography.scale.xs,
  fontWeight: typography.weight.bold,
  color: typography.color.muted,
  textTransform: 'uppercase',
  letterSpacing: '.07em',
  marginBottom: 8,
}
