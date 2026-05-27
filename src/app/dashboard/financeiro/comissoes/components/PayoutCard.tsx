'use client'
// src/app/dashboard/financeiro/comissoes/components/PayoutCard.tsx

import { ChevronRight, CheckCircle2, Clock, XCircle, Briefcase, Package } from 'lucide-react'
import { colors, typography, radius, shadows } from '@/shared/theme'
import { PayoutListItem } from '@/features/payouts/types'
import { fmtBRL, fmtPayoutPeriod, fmtDateBR, methodLabel, statusLabel } from '@/features/payouts/utils/format'

interface Props {
  payout:   PayoutListItem
  onClick:  () => void
  onPay?:   () => void  // só pra status PENDING
}

const STATUS_CFG = {
  PENDING:  { bg: 'rgba(220,38,38,0.06)',   color: colors.red.DEFAULT,    border: colors.red.border,        Icon: Clock        },
  PAID:     { bg: 'rgba(22,163,74,0.06)',   color: '#16a34a',             border: 'rgba(22,163,74,0.25)',   Icon: CheckCircle2 },
  CANCELED: { bg: 'rgba(0,0,0,0.04)',       color: colors.gray.dimText,   border: colors.gray.border,       Icon: XCircle      },
} as const

export default function PayoutCard({ payout, onClick, onPay }: Props) {
  const cfg = STATUS_CFG[payout.status]
  const initials = payout.professional.name
    .split(' ').slice(0,2).map(w => w[0] ?? '').join('').toUpperCase() || '?'

  return (
    <div
      onClick={onClick}
      style={{
        background: '#fff',
        border: `1px solid ${colors.gray.border}`,
        borderRadius: radius.lg,
        boxShadow: shadows.sm,
        cursor: 'pointer',
        fontFamily: typography.fontFamily,
        transition: 'all 0.15s ease',
        overflow: 'hidden',
      }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = colors.red.borderHover }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = colors.gray.border }}
    >
      {/* Header com prof + status */}
      <div style={{
        padding: '14px 16px',
        display: 'flex', alignItems: 'center', gap: 12,
        borderBottom: `1px solid ${colors.gray.border}`,
      }}>
        <div style={{
          width: 38, height: 38, borderRadius: '50%',
          background: colors.red.gradient,
          color: '#fff',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: typography.scale.sm,
          fontWeight: typography.weight.bold,
          flexShrink: 0,
        }}>
          {initials}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontSize: typography.scale.base,
            fontWeight: typography.weight.semibold,
            color: typography.color.primary,
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          }}>{payout.professional.name}</div>
          <div style={{
            fontSize: typography.scale.xs,
            color: typography.color.muted,
            marginTop: 1,
          }}>
            Período: {fmtPayoutPeriod(payout.periodStart, payout.periodEnd)}
          </div>
        </div>
        <div style={{
          padding: '4px 10px',
          borderRadius: radius.full,
          background: cfg.bg,
          border: `1px solid ${cfg.border}`,
          fontSize: 10,
          fontWeight: typography.weight.bold,
          color: cfg.color,
          letterSpacing: '.04em',
          textTransform: 'uppercase',
          display: 'flex', alignItems: 'center', gap: 5,
          flexShrink: 0,
        }}>
          <cfg.Icon size={11} strokeWidth={2.4} />
          {statusLabel(payout.status)}
        </div>
      </div>

      {/* Valores */}
      <div style={{
        padding: '14px 16px',
        display: 'flex', alignItems: 'center', gap: 12,
      }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontSize: 10,
            fontWeight: typography.weight.bold,
            color: typography.color.muted,
            textTransform: 'uppercase',
            letterSpacing: '.07em',
            marginBottom: 3,
          }}>
            {payout.status === 'PAID' ? 'Pago em' : 'Total'}
          </div>
          {payout.status === 'PAID' ? (
            <>
              <div style={{
                fontSize: typography.scale.base,
                fontWeight: typography.weight.semibold,
                color: typography.color.primary,
              }}>
                {fmtDateBR(payout.paidAt)}
              </div>
              <div style={{ fontSize: typography.scale.xs, color: typography.color.muted }}>
                via {methodLabel(payout.paidVia)}
              </div>
            </>
          ) : (
            <div style={{
              fontSize: 20,
              fontWeight: typography.weight.bold,
              color: typography.color.primary,
              fontVariantNumeric: 'tabular-nums',
              letterSpacing: '-0.01em',
              lineHeight: 1.05,
            }}>
              {fmtBRL(payout.totalAmount)}
            </div>
          )}
        </div>

        {/* Composição (serv / prod) */}
        <div style={{
          display: 'flex', flexDirection: 'column', gap: 4,
          alignItems: 'flex-end',
          fontSize: typography.scale.xs,
          color: typography.color.muted,
        }}>
          {payout.serviceAmount > 0 && (
            <span style={{ display:'flex', alignItems:'center', gap:4 }}>
              <Briefcase size={10} />
              {fmtBRL(payout.serviceAmount)}
            </span>
          )}
          {payout.productAmount > 0 && (
            <span style={{ display:'flex', alignItems:'center', gap:4 }}>
              <Package size={10} />
              {fmtBRL(payout.productAmount)}
            </span>
          )}
        </div>

        {payout.status === 'PAID' && (
          <div style={{
            fontSize: 20,
            fontWeight: typography.weight.bold,
            color: '#16a34a',
            fontVariantNumeric: 'tabular-nums',
            letterSpacing: '-0.01em',
            flexShrink: 0,
          }}>
            {fmtBRL(payout.totalAmount)}
          </div>
        )}

        <ChevronRight size={16} color={colors.gray.dimTextLight} style={{ flexShrink: 0 }} />
      </div>

      {/* Footer com ação pra PENDING */}
      {payout.status === 'PENDING' && onPay && (
        <div style={{
          padding: '10px 16px 14px',
          borderTop: `1px solid ${colors.gray.border}`,
        }}>
          <button
            onClick={(e) => { e.stopPropagation(); onPay() }}
            style={{
              width: '100%',
              padding: '10px 12px',
              borderRadius: radius.sm,
              border: 'none',
              background: 'linear-gradient(135deg, #16a34a, #15803d)',
              color: '#fff',
              fontSize: typography.scale.sm,
              fontWeight: typography.weight.bold,
              cursor: 'pointer',
              fontFamily: 'inherit',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              boxShadow: '0 4px 12px rgba(22,163,74,0.22)',
              transition: 'all 0.15s ease',
              WebkitTapHighlightColor: 'transparent',
            }}
          >
            <CheckCircle2 size={13} strokeWidth={2.4} />
            Marcar como pago
          </button>
        </div>
      )}
    </div>
  )
}
