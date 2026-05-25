'use client'
// src/app/dashboard/estoque/components/StockStatusBadge.tsx

import { StockStatus } from '@/features/stock/types'
import { STATUS_COLOR_MAP } from '@/features/stock/utils/format'

interface Props {
  status:  StockStatus
  compact?: boolean
}

export default function StockStatusBadge({ status, compact }: Props) {
  if (status === 'untracked') return null  // não mostra badge pra produto sem controle

  const c = STATUS_COLOR_MAP[status]

  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: 5,
      padding: compact ? '2px 7px' : '3px 9px',
      borderRadius: 999,
      background: c.bg,
      border: `1px solid ${c.border}`,
      color: c.fg,
      fontSize: compact ? 10 : 11,
      fontWeight: 700,
      letterSpacing: '.02em',
      whiteSpace: 'nowrap',
    }}>
      <span style={{
        width: 5, height: 5, borderRadius: '50%',
        background: c.fg,
        opacity: 0.85,
      }} />
      {c.label}
    </span>
  )
}
