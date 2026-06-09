'use client'
// src/app/dashboard/components/TodayScheduleCard.tsx

import { useRouter } from 'next/navigation'
import { Calendar, ChevronRight, Rocket } from 'lucide-react'
import { colors, typography, radius, shadows } from '@/shared/theme'
import { TodayScheduleItem } from '@/features/dashboard/types'

interface Props {
  items: TodayScheduleItem[]
}

export default function TodayScheduleCard({ items }: Props) {
  const router = useRouter()

  const upcoming = items.filter(i => !i.isPast).slice(0, 4)
  const display  = upcoming.length > 0 ? upcoming : items.slice(-4).reverse()

  return (
    <div style={{
      background:   '#fff',
      border:       `1px solid ${colors.gray.border}`,
      borderRadius: radius.lg,
      boxShadow:    shadows.sm,
      padding:      '14px 16px',
      fontFamily:   typography.fontFamily,
      display:      'flex',
      flexDirection: 'column',
      gap:          10,
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{
            width:          26,
            height:         26,
            borderRadius:   7,
            background:     'linear-gradient(135deg, #0891b2, #0e7490)',
            display:        'flex',
            alignItems:     'center',
            justifyContent: 'center',
          }}>
            <Calendar size={13} color="#fff" strokeWidth={2.4} />
          </div>
          <span style={{
            fontSize:      10,
            fontWeight:    typography.weight.bold,
            color:         typography.color.muted,
            textTransform: 'uppercase',
            letterSpacing: '.07em',
          }}>
            {upcoming.length > 0
              ? `Próximos hoje (${items.filter(i => !i.isPast).length})`
              : 'Hoje'}
          </span>
        </div>
        <button
          onClick={() => router.push('/dashboard/agenda')}
          style={{
            background:              'transparent',
            border:                  'none',
            color:                   colors.red.DEFAULT,
            fontSize:                10,
            fontWeight:              typography.weight.bold,
            cursor:                  'pointer',
            fontFamily:              'inherit',
            display:                 'flex',
            alignItems:              'center',
            gap:                     2,
            textTransform:           'uppercase',
            letterSpacing:           '.06em',
            WebkitTapHighlightColor: 'transparent',
          }}
        >
          Ver agenda
          <ChevronRight size={11} strokeWidth={2.4} />
        </button>
      </div>

      {display.length === 0 ? (
        <div style={{
          padding:   '20px 8px',
          textAlign: 'center',
          color:     typography.color.muted,
          fontSize:  typography.scale.sm,
        }}>
          Nenhum agendamento hoje
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {display.map(b => (
            <div key={b.id} style={{
              display:      'flex',
              alignItems:   'center',
              gap:          10,
              padding:      '7px 0',
              borderBottom: `1px solid ${colors.gray.border}`,
            }}>
              {/* Barra colorida do serviço */}
              <div style={{
                width:      3,
                alignSelf:  'stretch',
                minHeight:  28,
                borderRadius: 2,
                background: b.serviceColor || colors.red.DEFAULT,
                flexShrink: 0,
              }} />

              {/* Hora */}
              <div style={{
                fontSize:           typography.scale.sm,
                fontWeight:         typography.weight.bold,
                color:              b.isPast ? typography.color.muted : typography.color.primary,
                fontVariantNumeric: 'tabular-nums',
                flexShrink:         0,
                minWidth:           36,
                textDecoration:     b.status === 'COMPLETED' ? 'line-through' : 'none',
              }}>
                {b.time}
              </div>

              {/* Cliente + serviço */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontSize:   typography.scale.sm,
                  fontWeight: typography.weight.semibold,
                  color:      b.isPast ? typography.color.muted : typography.color.primary,
                  whiteSpace: 'nowrap',
                  overflow:   'hidden',
                  textOverflow: 'ellipsis',
                  display:    'flex',
                  alignItems: 'center',
                  gap:        5,
                }}>
                  <span style={{
                    overflow:     'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace:   'nowrap',
                    flexShrink:   1,
                    minWidth:     0,
                  }}>
                    {b.client}
                  </span>

                  {/* Tag online — só aparece se origin === ONLINE */}
                  {b.isOnline && (
                    <span style={{
                      display:       'inline-flex',
                      alignItems:    'center',
                      gap:           3,
                      fontSize:      9,
                      fontWeight:    typography.weight.bold,
                      background:    'rgba(99,102,241,0.10)',
                      color:         '#4f46e5',
                      padding:       '1px 6px',
                      borderRadius:  4,
                      letterSpacing: '.03em',
                      flexShrink:    0,
                      textTransform: 'uppercase',
                    }}>
                      <Rocket size={9} strokeWidth={2.2} />
                      online
                    </span>
                  )}
                </div>

                <div style={{
                  fontSize:     10,
                  color:        typography.color.muted,
                  whiteSpace:   'nowrap',
                  overflow:     'hidden',
                  textOverflow: 'ellipsis',
                }}>
                  {b.service}
                  {b.professional && ` · ${b.professional}`}
                </div>
              </div>

              {b.status === 'COMPLETED' && (
                <span style={{
                  fontSize:      9,
                  padding:       '2px 6px',
                  background:    'rgba(22,163,74,0.10)',
                  color:         '#16a34a',
                  fontWeight:    typography.weight.bold,
                  borderRadius:  4,
                  textTransform: 'uppercase',
                  letterSpacing: '.04em',
                  flexShrink:    0,
                }}>
                  Feito
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
