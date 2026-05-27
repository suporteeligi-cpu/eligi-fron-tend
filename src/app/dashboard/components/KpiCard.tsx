'use client'
// src/app/dashboard/components/KpiCard.tsx

import { ArrowUp, ArrowDown, Minus } from 'lucide-react'
import { colors, typography, radius, shadows } from '@/shared/theme'

interface Props {
  label:     string
  value:     string         // já formatado
  subtitle?: string
  growth?:   { text: string; positive: boolean | null } | null
  Icon:      React.ComponentType<{ size?: number; color?: string; strokeWidth?: number }>
  gradient:  string
}

export default function KpiCard({ label, value, subtitle, growth, Icon, gradient }: Props) {
  return (
    <div style={{
      background: '#fff',
      border: `1px solid ${colors.gray.border}`,
      borderRadius: radius.lg,
      boxShadow: shadows.sm,
      padding: '14px 14px 12px',
      display: 'flex', flexDirection: 'column', gap: 8,
      fontFamily: typography.fontFamily,
      minHeight: 110,
    }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
      }}>
        <div style={{
          width: 28, height: 28, borderRadius: 8,
          background: gradient,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
        }}>
          <Icon size={14} color="#fff" strokeWidth={2.2} />
        </div>
        <span style={{
          fontSize: 10,
          fontWeight: typography.weight.bold,
          color: typography.color.muted,
          textTransform: 'uppercase',
          letterSpacing: '.07em',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}>
          {label}
        </span>
      </div>

      <div style={{
        fontSize: 22,
        fontWeight: typography.weight.bold,
        color: typography.color.primary,
        fontVariantNumeric: 'tabular-nums',
        letterSpacing: '-0.02em',
        lineHeight: 1.1,
      }}>
        {value}
      </div>

      <div style={{
        display: 'flex', alignItems: 'center', gap: 4,
        fontSize: typography.scale.xs,
        marginTop: 'auto',
      }}>
        {growth && (
          <GrowthBadge growth={growth} />
        )}
        {subtitle && (
          <span style={{ color: typography.color.muted }}>
            {subtitle}
          </span>
        )}
      </div>
    </div>
  )
}

function GrowthBadge({ growth }: { growth: { text: string; positive: boolean | null } }) {
  const isUp   = growth.positive === true
  const isDown = growth.positive === false
  const isNew  = growth.positive === null && growth.text === 'novo'

  const color =
    isUp ? '#16a34a' :
    isDown ? colors.red.DEFAULT :
    typography.color.muted

  const bg =
    isUp ? 'rgba(22,163,74,0.10)' :
    isDown ? 'rgba(220,38,38,0.08)' :
    'rgba(0,0,0,0.04)'

  const Icon = isUp ? ArrowUp : isDown ? ArrowDown : Minus

  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 2,
      padding: '2px 6px',
      borderRadius: 5,
      background: bg,
      color,
      fontSize: 10,
      fontWeight: typography.weight.bold,
      fontVariantNumeric: 'tabular-nums',
    }}>
      {!isNew && <Icon size={9} strokeWidth={2.5} />}
      {growth.text}
    </span>
  )
}
