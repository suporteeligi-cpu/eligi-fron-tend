'use client'
// src/app/dashboard/caixa/components/SalesSummaryCards.tsx

import { ShoppingBag, TrendingUp, Percent, Scissors, Package } from 'lucide-react'
import { colors, typography } from '@/shared/theme'
import { SalesSummary } from '@/features/sales/types'
import { formatBRL, PAYMENT_METHOD_LABEL, PAYMENT_METHOD_ORDER } from '@/features/sales/utils/format'

interface Props {
  summary:   SalesSummary | null
  loading:   boolean
  isMobile:  boolean
}

export default function SalesSummaryCards({ summary, loading, isMobile }: Props) {
  const cards = [
    {
      label: 'Vendas',
      value: summary ? String(summary.salesCount) : '—',
      sub:   'confirmadas hoje',
      icon:  ShoppingBag,
      color: '#1d4ed8',
      bg:    'rgba(59,130,246,0.10)',
    },
    {
      label: 'Bruto',
      value: summary ? formatBRL(summary.grossTotal) : '—',
      sub:   summary && summary.creditTotal > 0
        ? `- ${formatBRL(summary.creditTotal)} NC`
        : 'antes de notas',
      icon:  TrendingUp,
      color: '#15803d',
      bg:    'rgba(22,163,74,0.10)',
    },
    {
      label: 'Líquido',
      value: summary ? formatBRL(summary.netTotal) : '—',
      sub:   'bruto - notas crédito',
      icon:  TrendingUp,
      color: colors.red.DEFAULT,
      bg:    colors.red.subtle,
    },
    {
      label: 'Comissões',
      value: summary ? formatBRL(summary.commissionTotal) : '—',
      sub:   'a pagar aos profs',
      icon:  Percent,
      color: '#b45309',
      bg:    'rgba(245,158,11,0.12)',
    },
  ]

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', gap: isMobile ? 10 : 14,
      fontFamily: typography.fontFamily,
    }}>
      {/* KPIs principais */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)',
        gap: isMobile ? 8 : 12,
      }}>
        {cards.map((card, i) => {
          const Icon = card.icon
          return (
            <div
              key={i}
              style={{
                background: 'rgba(255,255,255,0.85)',
                backdropFilter: 'blur(20px) saturate(160%)',
                WebkitBackdropFilter: 'blur(20px) saturate(160%)',
                border: '1px solid rgba(255,255,255,0.6)',
                borderRadius: 14,
                padding: isMobile ? '12px 14px' : '14px 16px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                opacity: loading ? 0.5 : 1,
                transition: 'opacity 0.3s ease',
              }}
            >
              <div style={{
                display: 'flex', alignItems: 'center', gap: 8,
                marginBottom: isMobile ? 6 : 8,
              }}>
                <div style={{
                  width: isMobile ? 26 : 30,
                  height: isMobile ? 26 : 30,
                  borderRadius: 8,
                  background: card.bg,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: card.color,
                  flexShrink: 0,
                }}>
                  <Icon size={isMobile ? 14 : 16} strokeWidth={2} />
                </div>
                <span style={{
                  fontSize: 10, fontWeight: 700,
                  color: colors.gray.dimText,
                  textTransform: 'uppercase',
                  letterSpacing: '.06em',
                  whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                }}>
                  {card.label}
                </span>
              </div>
              <div style={{
                fontSize: isMobile ? 17 : 22,
                fontWeight: 700,
                color: colors.gray[900],
                letterSpacing: '-0.02em',
                fontVariantNumeric: 'tabular-nums',
                lineHeight: 1,
                marginBottom: 2,
              }}>
                {card.value}
              </div>
              {card.sub && (
                <div style={{
                  fontSize: 10,
                  color: colors.gray.dimText,
                  fontWeight: 500,
                }}>
                  {card.sub}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Por método de pagamento */}
      {summary && Object.keys(summary.byMethod).length > 0 && (
        <div style={{
          background: 'rgba(255,255,255,0.85)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255,255,255,0.6)',
          borderRadius: 14,
          padding: '14px 16px',
        }}>
          <div style={{
            fontSize: 10, fontWeight: 700,
            color: colors.gray.dimText,
            textTransform: 'uppercase',
            letterSpacing: '.06em',
            marginBottom: 10,
          }}>Por método de pagamento</div>
          <div style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(3, 1fr)',
            gap: 10,
          }}>
            {PAYMENT_METHOD_ORDER
              .filter(m => (summary.byMethod[m] ?? 0) > 0)
              .map(method => (
                <div key={method} style={{
                  padding: '8px 10px',
                  background: colors.background.page,
                  borderRadius: 9,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 2,
                }}>
                  <span style={{
                    fontSize: 10,
                    color: colors.gray.dimText,
                    fontWeight: 600,
                  }}>
                    {PAYMENT_METHOD_LABEL[method]}
                  </span>
                  <span style={{
                    fontSize: 14,
                    fontWeight: 700,
                    color: colors.gray[900],
                    fontVariantNumeric: 'tabular-nums',
                  }}>
                    {formatBRL(summary.byMethod[method])}
                  </span>
                </div>
              ))}
          </div>

          {/* Total serviços vs produtos */}
          {(summary.serviceTotal > 0 || summary.productTotal > 0) && (
            <div style={{
              marginTop: 12,
              paddingTop: 12,
              borderTop: `1px dashed ${colors.gray.border}`,
              display: 'flex',
              gap: 14,
              flexWrap: 'wrap',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Scissors size={12} color={colors.gray.dimText} />
                <span style={{ fontSize: 11, color: colors.gray.dimText }}>Serviços:</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: colors.gray[900], fontVariantNumeric: 'tabular-nums' }}>
                  {formatBRL(summary.serviceTotal)}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Package size={12} color={colors.gray.dimText} />
                <span style={{ fontSize: 11, color: colors.gray.dimText }}>Produtos:</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: colors.gray[900], fontVariantNumeric: 'tabular-nums' }}>
                  {formatBRL(summary.productTotal)}
                </span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
