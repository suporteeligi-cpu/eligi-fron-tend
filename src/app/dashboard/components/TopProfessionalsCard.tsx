'use client'
// src/app/dashboard/components/TopProfessionalsCard.tsx

import { Trophy } from 'lucide-react'
import { colors, typography, radius, shadows } from '@/shared/theme'
import { TopProfessional } from '@/features/dashboard/types'
import { fmtBRL } from '@/features/dashboard/utils/format'

interface Props {
  professionals: TopProfessional[]
}

export default function TopProfessionalsCard({ professionals }: Props) {
  const maxRevenue = Math.max(1, ...professionals.map(p => p.revenue))

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
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{
          width: 26, height: 26, borderRadius: 7,
          background: 'linear-gradient(135deg, #f59e0b, #d97706)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Trophy size={13} color="#fff" strokeWidth={2.4} />
        </div>
        <span style={{
          fontSize: 10,
          fontWeight: typography.weight.bold,
          color: typography.color.muted,
          textTransform: 'uppercase',
          letterSpacing: '.07em',
        }}>
          TOP PROFISSIONAIS · RECEITA
        </span>
      </div>

      {professionals.length === 0 ? (
        <div style={{
          padding: '20px 8px',
          textAlign: 'center',
          color: typography.color.muted,
          fontSize: typography.scale.sm,
        }}>
          Nenhum atendimento no período
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {professionals.map((p, idx) => {
            const initials = p.name.split(' ').slice(0,2).map(w => w[0] ?? '').join('').toUpperCase() || '?'
            const pct = (p.revenue / maxRevenue) * 100

            return (
              <div key={p.professionalId} style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
              }}>
                {/* Rank */}
                <div style={{
                  width: 18, height: 18,
                  borderRadius: '50%',
                  background: idx === 0 ? '#f59e0b' : idx === 1 ? '#94a3b8' : idx === 2 ? '#ea7c25' : colors.gray.borderMd,
                  color: '#fff',
                  fontSize: 9,
                  fontWeight: typography.weight.bold,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0,
                }}>
                  {idx + 1}
                </div>

                {/* Avatar */}
                <div style={{
                  width: 28, height: 28, borderRadius: '50%',
                  background: colors.red.gradient,
                  color: '#fff',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 10,
                  fontWeight: typography.weight.bold,
                  flexShrink: 0,
                }}>
                  {initials}
                </div>

                {/* Nome + barra */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontSize: typography.scale.sm,
                    fontWeight: typography.weight.semibold,
                    color: typography.color.primary,
                    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                    marginBottom: 3,
                  }}>
                    {p.name}
                  </div>
                  <div style={{
                    height: 4,
                    background: colors.gray.border,
                    borderRadius: 2,
                    overflow: 'hidden',
                  }}>
                    <div style={{
                      width: `${pct}%`,
                      height: '100%',
                      background: idx === 0
                        ? 'linear-gradient(90deg, #f59e0b, #d97706)'
                        : colors.red.gradient,
                      transition: 'width 0.6s ease',
                    }} />
                  </div>
                </div>

                {/* Valor */}
                <div style={{
                  fontSize: typography.scale.sm,
                  fontWeight: typography.weight.bold,
                  color: typography.color.primary,
                  fontVariantNumeric: 'tabular-nums',
                  flexShrink: 0,
                }}>
                  {fmtBRL(p.revenue)}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
