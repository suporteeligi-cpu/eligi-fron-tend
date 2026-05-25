'use client'
// src/app/dashboard/estoque/components/StockSummaryCards.tsx

import { Package, AlertTriangle, XCircle, DollarSign } from 'lucide-react'
import { colors, typography } from '@/shared/theme'
import { StockSummary } from '@/features/stock/types'
import { formatBRL } from '@/features/stock/utils/format'

interface Props {
  summary:   StockSummary | null
  loading:   boolean
  isMobile:  boolean
}

export default function StockSummaryCards({ summary, loading, isMobile }: Props) {
  const cards = [
    {
      label: 'Produtos com estoque',
      value: summary ? `${summary.trackedProducts}` : '—',
      sub:   summary ? `de ${summary.totalProducts} total` : '',
      icon:  Package,
      color: '#1d4ed8',
      bg:    'rgba(59,130,246,0.10)',
    },
    {
      label: 'Estoque baixo',
      value: summary ? `${summary.lowStock}` : '—',
      sub:   'abaixo do alerta',
      icon:  AlertTriangle,
      color: '#b45309',
      bg:    'rgba(245,158,11,0.12)',
    },
    {
      label: 'Esgotados',
      value: summary ? `${summary.outOfStock}` : '—',
      sub:   'sem saldo',
      icon:  XCircle,
      color: '#991b1b',
      bg:    'rgba(220,38,38,0.10)',
    },
    {
      label: 'Valor em estoque',
      value: summary ? formatBRL(summary.totalValue) : '—',
      sub:   'baseado no custo',
      icon:  DollarSign,
      color: '#15803d',
      bg:    'rgba(22,163,74,0.10)',
    },
  ]

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)',
      gap: isMobile ? 8 : 12,
      marginBottom: isMobile ? 14 : 18,
      fontFamily: typography.fontFamily,
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
              fontSize: isMobile ? 20 : 24,
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
  )
}
