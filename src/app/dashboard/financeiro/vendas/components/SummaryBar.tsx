'use client'
// src/app/dashboard/financeiro/vendas/components/SummaryBar.tsx

import { TrendingUp, Receipt, RotateCcw, CheckCircle2 } from 'lucide-react'
import { colors, typography, radius, shadows } from '@/shared/theme'
import { SalesReportSummary } from '@/features/sales-report/types'
import { fmtBRL } from '@/features/sales-report/utils'

interface Props {
  summary:  SalesReportSummary
  isMobile: boolean
}

export default function SummaryBar({ summary, isMobile }: Props) {
  const cards = [
    {
      label: 'BRUTO',
      value: fmtBRL(summary.grossTotal),
      sub:   `${summary.canceledCount} cancelada${summary.canceledCount !== 1 ? 's' : ''}`,
      Icon:  CheckCircle2,
      color: '#475569',
      gradient: 'linear-gradient(135deg, #475569, #334155)',
    },
    {
      label: 'LÍQUIDO',
      value: fmtBRL(summary.netTotal),
      sub:   '− notas − comissões',
      Icon:  TrendingUp,
      color: '#16a34a',
      gradient: 'linear-gradient(135deg, #16a34a, #15803d)',
    },
    {
      label: 'TICKET MÉDIO',
      value: fmtBRL(summary.ticketAverage),
      sub:   'por venda',
      Icon:  Receipt,
      color: colors.red.DEFAULT,
      gradient: 'linear-gradient(135deg, #dc2626, #b91c1c)',
    },
    {
      label: 'NOTAS DE CRÉDITO',
      value: fmtBRL(summary.creditsTotal),
      sub:   'devoluções',
      Icon:  RotateCcw,
      color: '#d97706',
      gradient: 'linear-gradient(135deg, #d97706, #b45309)',
    },
  ]

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(4, 1fr)',
      gap: 10,
      marginBottom: 16,
    }}>
      {cards.map(c => (
        <div key={c.label} style={{
          background: '#fff',
          border: `1px solid ${colors.gray.border}`,
          borderRadius: radius.lg,
          boxShadow: shadows.sm,
          padding: '12px 14px',
          fontFamily: typography.fontFamily,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 7 }}>
            <div style={{
              width: 24, height: 24, borderRadius: 7,
              background: c.gradient,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}>
              <c.Icon size={12} color="#fff" strokeWidth={2.3} />
            </div>
            <span style={{
              fontSize: 9,
              fontWeight: typography.weight.bold,
              color: typography.color.muted,
              textTransform: 'uppercase',
              letterSpacing: '.06em',
            }}>
              {c.label}
            </span>
          </div>
          <div style={{
            fontSize: 17,
            fontWeight: typography.weight.bold,
            color: c.color,
            fontVariantNumeric: 'tabular-nums',
            letterSpacing: '-0.01em',
            lineHeight: 1.1,
          }}>
            {c.value}
          </div>
          <div style={{
            fontSize: 10,
            color: typography.color.muted,
            marginTop: 1,
          }}>
            {c.sub}
          </div>
        </div>
      ))}
    </div>
  )
}
