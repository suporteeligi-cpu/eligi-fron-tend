'use client'
// src/app/dashboard/components/TopProfessionalsCard.tsx
// @eligi:top-pros-glass
// Ranking de receita por profissional.
//
// v2 (fatia 4): sai do card branco com borda propria e passa a usar glassCard
// + inkLight, como o resto da Visao geral. Era o ultimo componente do painel
// ainda no token antigo — a borda vermelha a esquerda aparecia em alguns cards
// e nao em outros, sem criterio.
//
// Nao usa TopProfessional.avatarUrl ainda: o back entrega, mas exibir imagem
// remota exige decidir entre <img> (warning de lint) e next/image (precisa de
// remotePatterns no next.config). Fica para uma fatia com essa decisao tomada.

import { Trophy } from 'lucide-react'
import { colors, typography, radius, shadows, glassCard, inkLight } from '@/shared/theme'
import { TopProfessional } from '@/features/dashboard/types'
import { fmtBRL } from '@/features/dashboard/utils/format'

const DISPLAY_FONT = `'Space Grotesk', ${typography.fontFamily}`

/** Ouro, prata, bronze — depois disso, neutro. */
const PODIUM = ['#f59e0b', '#94a3b8', '#c2703a'] as const
const BAR    = [
  'linear-gradient(90deg,#f59e0b,#d97706)',
  'linear-gradient(90deg,#94a3b8,#64748b)',
  'linear-gradient(90deg,#c2703a,#9a5528)',
] as const

interface Props {
  professionals: TopProfessional[]
}

function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).slice(0, 2)
  const letters = parts.map(w => w.charAt(0)).join('')
  return letters.toUpperCase() || '?'
}

export default function TopProfessionalsCard({ professionals }: Props) {
  const maxRevenue = Math.max(1, ...professionals.map(p => p.revenue))

  return (
    <div style={{
      ...glassCard,
      borderRadius:  radius['2xl'],
      boxShadow:     shadows.sm,
      padding:       '16px 18px',
      fontFamily:    typography.fontFamily,
      display:       'flex',
      flexDirection: 'column',
      gap:           12,
    }}>
      {/* cabecalho */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{
          display:      'grid',
          placeItems:   'center',
          width:        32,
          height:       32,
          flexShrink:   0,
          borderRadius: radius.sm,
          background:   inkLight.warn.bg,
        }}>
          <Trophy size={15} color={inkLight.warn.text} strokeWidth={2.2} />
        </span>

        <span style={{
          fontSize:      10.5,
          fontWeight:    typography.weight.bold,
          color:         inkLight.label,
          textTransform: 'uppercase',
          letterSpacing: '.12em',
        }}>
          Top profissionais · receita
        </span>
      </div>

      {professionals.length === 0 ? (
        <div style={{
          padding:   '24px 8px',
          textAlign: 'center',
          color:     inkLight.label,
          fontSize:  typography.scale.sm,
        }}>
          Nenhum atendimento no período
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {professionals.map((p, idx) => {
            const pct     = (p.revenue / maxRevenue) * 100
            const podium  = idx < PODIUM.length ? PODIUM[idx] : colors.gray.borderMd
            const barFill = idx < BAR.length ? BAR[idx] : colors.red.gradient

            return (
              <div
                key={p.professionalId}
                style={{ display: 'flex', alignItems: 'center', gap: 11 }}
              >
                {/* avatar com anel de podio */}
                <span style={{
                  position:     'relative',
                  flexShrink:   0,
                  width:        36,
                  height:       36,
                  borderRadius: '50%',
                  display:      'grid',
                  placeItems:   'center',
                  background:   colors.red.gradient,
                  color:        '#fff',
                  fontFamily:   DISPLAY_FONT,
                  fontSize:     12,
                  fontWeight:   typography.weight.bold,
                  boxShadow:    idx < PODIUM.length ? `0 0 0 2px ${podium}` : 'none',
                }}>
                  {initialsOf(p.name)}

                  <span style={{
                    position:      'absolute',
                    bottom:        -3,
                    right:         -3,
                    width:         16,
                    height:        16,
                    borderRadius:  '50%',
                    background:    podium,
                    color:         '#fff',
                    fontSize:      9,
                    fontWeight:    typography.weight.bold,
                    display:       'grid',
                    placeItems:    'center',
                    border:        '1.5px solid #fff',
                  }}>
                    {idx + 1}
                  </span>
                </span>

                {/* nome + barra */}
                <span style={{ flex: 1, minWidth: 0 }}>
                  <span style={{
                    display:        'flex',
                    alignItems:     'baseline',
                    justifyContent: 'space-between',
                    gap:            8,
                    marginBottom:   5,
                  }}>
                    <span style={{
                      fontSize:     13.5,
                      fontWeight:   typography.weight.semibold,
                      color:        inkLight.strong,
                      overflow:     'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace:   'nowrap',
                      minWidth:     0,
                    }}>
                      {p.name}
                    </span>

                    <span style={{
                      flexShrink:         0,
                      fontFamily:         DISPLAY_FONT,
                      fontSize:           13.5,
                      fontWeight:         typography.weight.bold,
                      color:              inkLight.strong,
                      fontVariantNumeric: 'tabular-nums',
                      letterSpacing:      '-.01em',
                    }}>
                      {fmtBRL(p.revenue)}
                    </span>
                  </span>

                  <span style={{
                    display:      'block',
                    height:       6,
                    background:   'rgba(0,0,0,0.06)',
                    borderRadius: radius.full,
                    overflow:     'hidden',
                  }}>
                    <span style={{
                      display:      'block',
                      width:        `${pct}%`,
                      height:       '100%',
                      background:   barFill,
                      borderRadius: radius.full,
                      transition:   'width 0.6s cubic-bezier(0.22,1,0.36,1)',
                    }} />
                  </span>

                  <span style={{
                    display:   'block',
                    marginTop: 4,
                    fontSize:  11,
                    color:     inkLight.label,
                  }}>
                    {p.itemsCount} {p.itemsCount === 1 ? 'atendimento' : 'atendimentos'}
                  </span>
                </span>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
