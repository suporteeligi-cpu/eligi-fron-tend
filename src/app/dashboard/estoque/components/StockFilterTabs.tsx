'use client'
// src/app/dashboard/estoque/components/StockFilterTabs.tsx

import { colors, typography, transitions } from '@/shared/theme'

export type StockFilter = 'all' | 'inStock' | 'low' | 'out' | 'untracked'

interface Props {
  current: StockFilter
  onChange: (f: StockFilter) => void
  counts: {
    all:        number
    inStock:    number
    low:        number
    out:        number
    untracked:  number
  }
}

export default function StockFilterTabs({ current, onChange, counts }: Props) {
  const tabs: Array<{ id: StockFilter; label: string; count: number; color?: string }> = [
    { id: 'all',       label: 'Todos',       count: counts.all },
    { id: 'inStock',   label: 'Em estoque',  count: counts.inStock,   color: '#15803d' },
    { id: 'low',       label: 'Baixo',       count: counts.low,       color: '#b45309' },
    { id: 'out',       label: 'Esgotado',    count: counts.out,       color: '#991b1b' },
    { id: 'untracked', label: 'Sem controle', count: counts.untracked },
  ]

  return (
    <div style={{
      display: 'flex',
      gap: 4,
      padding: 4,
      background: 'rgba(255,255,255,0.65)',
      backdropFilter: 'blur(12px)',
      borderRadius: 12,
      border: `1px solid ${colors.gray.border}`,
      marginBottom: 12,
      overflowX: 'auto',
      WebkitOverflowScrolling: 'touch',
      fontFamily: typography.fontFamily,
    }}>
      {tabs.map(t => {
        const isActive = current === t.id
        return (
          <button
            key={t.id}
            onClick={() => onChange(t.id)}
            style={{
              flex: '1 0 auto',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              padding: '8px 12px',
              borderRadius: 9,
              border: 'none',
              background: isActive ? '#fff' : 'transparent',
              color: isActive
                ? (t.color ?? colors.gray[900])
                : colors.gray.dimText,
              fontWeight: isActive ? 700 : 600,
              fontSize: 12,
              cursor: 'pointer',
              transition: `all ${transitions.fast}`,
              boxShadow: isActive ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
              fontFamily: 'inherit',
              whiteSpace: 'nowrap',
              WebkitTapHighlightColor: 'transparent',
            }}
          >
            {t.label}
            <span style={{
              fontSize: 10,
              fontWeight: 700,
              padding: '1px 6px',
              borderRadius: 5,
              background: isActive
                ? (t.color ? `${t.color}22` : colors.gray.hover)
                : colors.gray.hover,
              color: isActive
                ? (t.color ?? colors.gray[700])
                : colors.gray.dimText,
              fontVariantNumeric: 'tabular-nums',
            }}>
              {t.count}
            </span>
          </button>
        )
      })}
    </div>
  )
}
