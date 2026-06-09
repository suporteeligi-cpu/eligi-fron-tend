'use client'
// src/app/dashboard/components/RevenueSparkline.tsx

import { TrendingUp } from 'lucide-react'
import { colors, typography, radius, shadows } from '@/shared/theme'
import { RevenueChartPoint } from '@/features/dashboard/types'
import { fmtBRL } from '@/features/dashboard/utils/format'

interface Props {
  data:     RevenueChartPoint[]
  isMobile: boolean
}

export default function RevenueSparkline({ data, isMobile }: Props) {
  // Dimensões do SVG
  const w = isMobile ? 320 : 460
  const h = 100
  const padX = 10
  const padY = 14

  const max = Math.max(1, ...data.map(d => d.value))
  const min = 0

  const innerW = w - padX * 2
  const innerH = h - padY * 2

  const step = data.length > 1 ? innerW / (data.length - 1) : 0

  function pointX(i: number) { return padX + i * step }
  function pointY(v: number) {
    const ratio = (v - min) / (max - min || 1)
    return padY + innerH - ratio * innerH
  }

  const linePath = data
    .map((d, i) => `${i === 0 ? 'M' : 'L'} ${pointX(i)} ${pointY(d.value)}`)
    .join(' ')

  const areaPath = data.length
    ? `${linePath} L ${pointX(data.length - 1)} ${padY + innerH} L ${pointX(0)} ${padY + innerH} Z`
    : ''

  const total = data.reduce((s, d) => s + d.value, 0)

  return (
    <div style={{
      background: '#fff',
      border: `1px solid ${colors.gray.border}`,
      borderRadius: radius.lg,
      boxShadow: shadows.sm,
      padding: '14px 16px',
      fontFamily: typography.fontFamily,
      display: 'flex', flexDirection: 'column', gap: 10,
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{
            width: 26, height: 26, borderRadius: 7,
            background: 'linear-gradient(135deg, #dc2626, #b91c1c)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <TrendingUp size={13} color="#fff" strokeWidth={2.4} />
          </div>
          <div>
            <div style={{
              fontSize: 10,
              fontWeight: typography.weight.bold,
              color: typography.color.muted,
              textTransform: 'uppercase',
              letterSpacing: '.07em',
            }}>
              RECEITA · ÚLTIMOS 7 DIAS
            </div>
            <div style={{
              fontSize: typography.scale.base,
              fontWeight: typography.weight.bold,
              color: typography.color.primary,
              fontVariantNumeric: 'tabular-nums',
            }}>
              {fmtBRL(total)}
            </div>
          </div>
        </div>
      </div>

      {/* Chart SVG */}
      <div style={{ width: '100%', overflow: 'hidden' }}>
        <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" style={{ width: '100%', height: h, display: 'block' }}>
          <defs>
            <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%"   stopColor="#dc2626" stopOpacity="0.22" />
              <stop offset="100%" stopColor="#dc2626" stopOpacity="0.00" />
            </linearGradient>
          </defs>

          {/* Linha base sutil */}
          <line x1={padX} y1={padY + innerH} x2={w - padX} y2={padY + innerH} stroke={colors.gray.border} strokeWidth="1" />

          {/* Área */}
          <path d={areaPath} fill="url(#revenueGrad)" />

          {/* Linha */}
          <path d={linePath} fill="none" stroke="#dc2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />

          {/* Pontos */}
          {data.map((d, i) => (
            <circle
              key={i}
              cx={pointX(i)} cy={pointY(d.value)} r={3}
              fill="#fff"
              stroke="#dc2626"
              strokeWidth="2"
            />
          ))}

          {/* Labels (dias) */}
          {data.map((d, i) => (
            <text
              key={`label-${i}`}
              x={pointX(i)} y={h - 1}
              textAnchor="middle"
              fill={colors.gray.dimText}
              fontSize="9"
              fontFamily={typography.fontFamily}
              fontWeight="600"
            >
              {d.label}
            </text>
          ))}
        </svg>
      </div>
    </div>
  )
}
