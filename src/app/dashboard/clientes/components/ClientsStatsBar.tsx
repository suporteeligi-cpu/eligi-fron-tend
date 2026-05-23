'use client'
// src/app/dashboard/clientes/components/ClientsStatsBar.tsx

import { Users, TrendingUp, CheckCircle, XCircle } from 'lucide-react'
import { colors, typography, radius, shadows, glass } from '@/shared/theme'
import { fmtRevenue } from '@/features/clients/utils/format'

interface Props {
  totalClients:    number
  completedPage:   number
  canceledPage:    number
  revenuePage:     number
  isMobile:        boolean
}

/**
 * Stats da página. Visual:
 * - Mobile: linha única com bullet separators (compacta)
 * - Desktop: grid 4-up de cards
 */
export default function ClientsStatsBar({
  totalClients, completedPage, canceledPage, revenuePage, isMobile,
}: Props) {
  if (totalClients === 0) return null

  if (isMobile) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', flexWrap: 'wrap',
        gap: '4px 10px',
        marginBottom: 12,
        padding: '8px 12px',
        background: 'rgba(245,245,247,0.6)',
        borderRadius: radius.sm,
        border: `1px solid ${colors.gray.border}`,
        fontSize: typography.scale.sm,
      }}>
        <span style={{ display:'flex', alignItems:'center', gap:5 }}>
          <Users size={12} color={typography.color.primary} strokeWidth={2.2} />
          <strong style={{ color: typography.color.primary, fontWeight: typography.weight.bold, fontVariantNumeric: 'tabular-nums' }}>
            {totalClients}
          </strong>
          <span style={{ color: typography.color.muted }}>
            cliente{totalClients !== 1 ? 's' : ''}
          </span>
        </span>

        {completedPage > 0 && (
          <>
            <span style={{ color: colors.gray.dimTextLight }}>·</span>
            <span style={{ display:'flex', alignItems:'center', gap:4 }}>
              <CheckCircle size={11} color="#16a34a" strokeWidth={2.2} />
              <strong style={{ color: '#16a34a', fontWeight: typography.weight.bold, fontVariantNumeric: 'tabular-nums' }}>
                {completedPage}
              </strong>
              <span style={{ color: typography.color.muted }}>concl.</span>
            </span>
          </>
        )}

        {canceledPage > 0 && (
          <>
            <span style={{ color: colors.gray.dimTextLight }}>·</span>
            <span style={{ display:'flex', alignItems:'center', gap:4 }}>
              <XCircle size={11} color={colors.gray.dimText} strokeWidth={2.2} />
              <strong style={{ color: colors.gray.dimText, fontWeight: typography.weight.bold, fontVariantNumeric: 'tabular-nums' }}>
                {canceledPage}
              </strong>
              <span style={{ color: typography.color.muted }}>canc.</span>
            </span>
          </>
        )}

        {revenuePage > 0 && (
          <>
            <span style={{ color: colors.gray.dimTextLight }}>·</span>
            <span style={{ display:'flex', alignItems:'center', gap:4 }}>
              <TrendingUp size={11} color={colors.red.DEFAULT} strokeWidth={2.2} />
              <strong style={{ color: colors.red.DEFAULT, fontWeight: typography.weight.bold, fontVariantNumeric: 'tabular-nums' }}>
                {fmtRevenue(revenuePage)}
              </strong>
            </span>
          </>
        )}
      </div>
    )
  }

  // Desktop — cards 4-up
  const cards = [
    { label: 'Total de clientes', value: String(totalClients),       sub: 'cadastrados',  Icon: Users,       color: typography.color.primary },
    { label: 'Concluídos',        value: String(completedPage),      sub: 'nesta página', Icon: CheckCircle, color: '#16a34a' },
    { label: 'Cancelados',        value: String(canceledPage),       sub: 'nesta página', Icon: XCircle,     color: colors.gray.dimText },
    { label: 'Receita',           value: fmtRevenue(revenuePage),    sub: 'nesta página', Icon: TrendingUp,  color: colors.red.DEFAULT },
  ]

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 20 }}>
      {cards.map(s => (
        <div key={s.label} style={{
          padding: '13px 16px',
          borderRadius: radius.lg,
          background: glass.surface.default.background,
          backdropFilter: glass.surface.default.backdropFilter,
          border: `1px solid ${colors.gray.border}`,
          boxShadow: shadows.sm,
        }}>
          <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:6 }}>
            <s.Icon size={13} color={s.color} strokeWidth={2} />
            <span style={{
              fontSize: typography.scale.xs,
              fontWeight: typography.weight.bold,
              color: typography.color.muted,
              textTransform: 'uppercase',
              letterSpacing: '.07em',
            }}>{s.label}</span>
          </div>
          <div style={{
            fontSize: 20,
            fontWeight: typography.weight.bold,
            color: s.color,
            fontVariantNumeric: 'tabular-nums',
          }}>{s.value}</div>
          <div style={{ fontSize: typography.scale.xs, color: typography.color.muted, marginTop: 2 }}>
            {s.sub}
          </div>
        </div>
      ))}
    </div>
  )
}
