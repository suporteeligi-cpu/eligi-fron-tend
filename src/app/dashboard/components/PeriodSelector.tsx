'use client'
// src/app/dashboard/components/PeriodSelector.tsx

import { useState, useEffect, useRef } from 'react'
import { ChevronDown, Calendar } from 'lucide-react'
import { colors, typography, radius } from '@/shared/theme'
import { DashboardPeriod } from '@/features/dashboard/types'
import { periodLabel } from '@/features/dashboard/utils/format'

interface Props {
  value:    DashboardPeriod
  onChange: (v: DashboardPeriod) => void
}

const OPTIONS: DashboardPeriod[] = ['today', '7d', '30d']

export default function PeriodSelector({ value, onChange }: Props) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  return (
    <div ref={ref} style={{ position: 'relative', fontFamily: typography.fontFamily }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          display: 'flex', alignItems: 'center', gap: 6,
          padding: '8px 12px',
          background: '#fff',
          border: `1px solid ${colors.gray.borderMd}`,
          borderRadius: radius.sm,
          cursor: 'pointer',
          fontSize: typography.scale.sm,
          fontWeight: typography.weight.semibold,
          color: typography.color.primary,
          fontFamily: 'inherit',
          WebkitTapHighlightColor: 'transparent',
        }}
      >
        <Calendar size={12} color={colors.gray.dimText} strokeWidth={2.2} />
        {periodLabel(value)}
        <ChevronDown size={12} color={colors.gray.dimText} strokeWidth={2.2} />
      </button>

      {open && (
        <div style={{
          position: 'absolute',
          top: 'calc(100% + 4px)',
          right: 0,
          minWidth: 160,
          background: '#fff',
          border: `1px solid ${colors.gray.border}`,
          borderRadius: radius.sm,
          boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
          zIndex: 100,
          overflow: 'hidden',
        }}>
          {OPTIONS.map(p => (
            <button
              key={p}
              onClick={() => { onChange(p); setOpen(false) }}
              style={{
                display: 'block',
                width: '100%',
                padding: '9px 14px',
                background: value === p ? colors.red.subtle : 'transparent',
                color: value === p ? colors.red.DEFAULT : typography.color.primary,
                border: 'none',
                textAlign: 'left',
                cursor: 'pointer',
                fontFamily: 'inherit',
                fontSize: typography.scale.sm,
                fontWeight: typography.weight.semibold,
                WebkitTapHighlightColor: 'transparent',
              }}
            >
              {periodLabel(p)}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
