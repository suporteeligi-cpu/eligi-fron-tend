'use client'
// src/app/dashboard/components/TodayScheduleCard.tsx
// @eligi:today-timeline
// "Seu dia" — agenda de hoje em formato de linha do tempo.
//
// v2 (fatia 3):
//   - trilho vertical com marcador por horario, em vez de linhas empilhadas
//   - o proximo atendimento ganha destaque (marcador verde + fundo suave)
//   - vazio deixa de ser "Nenhum agendamento hoje" seco: informa quantos ha
//     para amanha, que e a unica informacao real que a API entrega hoje.
//
// Degradacao consciente (decisao 2a): a API devolve so a CONTAGEM de amanha
// (kpis.tomorrowBookings), nao o horario nem o cliente. O card diz exatamente
// isso e nada alem — nada de inventar "09:30 · Rodrigo" que o payload nao tem.

import { useRouter } from 'next/navigation'
import { CalendarCheck, ChevronRight, Rocket, Sun } from 'lucide-react'
import { colors, typography, radius, shadows, glassCard, inkLight } from '@/shared/theme'
import { TodayScheduleItem } from '@/features/dashboard/types'

const DISPLAY_FONT = `'Space Grotesk', ${typography.fontFamily}`

const MAX_ROWS = 5

interface Props {
  items:         TodayScheduleItem[]
  tomorrowCount: number
}

export default function TodayScheduleCard({ items, tomorrowCount }: Props) {
  const router = useRouter()

  const pending  = items.filter(i => !i.isPast)
  const upcoming = pending.slice(0, MAX_ROWS)
  // Sem nada pela frente, mostra o que ja passou (mais recente primeiro).
  const display  = upcoming.length > 0 ? upcoming : items.slice(-MAX_ROWS).reverse()
  const isFuture = upcoming.length > 0
  const hidden   = isFuture ? Math.max(0, pending.length - upcoming.length) : 0

  const plural = (n: number, s: string, p: string) => (n === 1 ? s : p)

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
          background:   inkLight.info.bg,
        }}>
          <CalendarCheck size={15} color={inkLight.info.text} strokeWidth={2.2} />
        </span>

        <span style={{
          flex:          1,
          minWidth:      0,
          fontSize:      10.5,
          fontWeight:    typography.weight.bold,
          color:         inkLight.label,
          textTransform: 'uppercase',
          letterSpacing: '.12em',
        }}>
          {isFuture ? `Seu dia · ${pending.length} pela frente` : 'Seu dia'}
        </span>

        <button
          type="button"
          onClick={() => router.push('/dashboard/agenda')}
          style={{
            flexShrink:              0,
            background:              'transparent',
            border:                  'none',
            padding:                 '4px 2px',
            color:                   colors.red.DEFAULT,
            fontSize:                12.5,
            fontWeight:              typography.weight.bold,
            fontFamily:              'inherit',
            cursor:                  'pointer',
            display:                 'flex',
            alignItems:              'center',
            gap:                     2,
            whiteSpace:              'nowrap',
            WebkitTapHighlightColor: 'transparent',
          }}
        >
          Ver agenda
          <ChevronRight size={14} strokeWidth={2.4} />
        </button>
      </div>

      {display.length === 0 ? (
        <div style={{
          display:        'flex',
          alignItems:     'center',
          gap:            12,
          padding:        '10px 2px 14px',
        }}>
          <span style={{
            display:      'grid',
            placeItems:   'center',
            width:        44,
            height:       44,
            flexShrink:   0,
            borderRadius: radius.md,
            background:   'rgba(0,0,0,0.04)',
          }}>
            <Sun size={20} color={colors.gray.dimText} strokeWidth={2} />
          </span>
          <span style={{ minWidth: 0 }}>
            <span style={{
              display:    'block',
              fontSize:   14,
              fontWeight: typography.weight.bold,
              color:      inkLight.strong,
            }}>
              Agenda livre hoje
            </span>
            <span style={{
              display:    'block',
              fontSize:   12.5,
              color:      inkLight.label,
              marginTop:  2,
              lineHeight: 1.4,
            }}>
              {tomorrowCount > 0
                ? `${tomorrowCount} ${plural(tomorrowCount, 'cliente confirmado', 'clientes confirmados')} para amanhã.`
                : 'Nada marcado para amanhã ainda — vale divulgar o link.'}
            </span>
          </span>
        </div>
      ) : (
        <div style={{ position: 'relative', paddingLeft: 22 }}>
          {/* trilho vertical */}
          <span
            aria-hidden
            style={{
              position:     'absolute',
              left:         6,
              top:          10,
              bottom:       10,
              width:        2,
              background:   'rgba(0,0,0,0.08)',
              borderRadius: 2,
            }}
          />

          {display.map((b, idx) => {
            const isNext = isFuture && idx === 0
            const dim    = b.isPast

            return (
              <div
                key={b.id}
                style={{
                  position:     'relative',
                  display:      'flex',
                  alignItems:   'center',
                  gap:          10,
                  padding:      '9px 8px 9px 10px',
                  marginLeft:   -4,
                  borderRadius: radius.sm,
                  background:   isNext ? inkLight.ok.bg : 'transparent',
                }}
              >
                {/* marcador */}
                <span
                  aria-hidden
                  style={{
                    position:     'absolute',
                    left:         -20,
                    width:        10,
                    height:       10,
                    borderRadius: '50%',
                    background:   isNext ? inkLight.ok.text : '#fff',
                    border:       `2px solid ${
                      isNext
                        ? inkLight.ok.text
                        : (b.serviceColor ?? 'rgba(0,0,0,0.28)')
                    }`,
                    boxShadow:    '0 0 0 3px rgba(255,255,255,0.9)',
                  }}
                />

                <span style={{
                  flexShrink:         0,
                  minWidth:           40,
                  fontFamily:         DISPLAY_FONT,
                  fontSize:           14,
                  fontWeight:         typography.weight.bold,
                  color:              dim ? inkLight.label : inkLight.strong,
                  fontVariantNumeric: 'tabular-nums',
                  textDecoration:     b.status === 'COMPLETED' ? 'line-through' : 'none',
                }}>
                  {b.time}
                </span>

                <span style={{ flex: 1, minWidth: 0 }}>
                  <span style={{
                    display:    'flex',
                    alignItems: 'center',
                    gap:        5,
                    minWidth:   0,
                  }}>
                    <span style={{
                      fontSize:     13.5,
                      fontWeight:   typography.weight.semibold,
                      color:        dim ? inkLight.label : inkLight.strong,
                      overflow:     'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace:   'nowrap',
                      minWidth:     0,
                    }}>
                      {b.client}
                    </span>

                    {b.isOnline && (
                      <span style={{
                        display:       'inline-flex',
                        alignItems:    'center',
                        gap:           3,
                        flexShrink:    0,
                        fontSize:      9.5,
                        fontWeight:    typography.weight.bold,
                        background:    'rgba(124,58,237,0.10)',
                        color:         '#6D28D9',
                        padding:       '2px 6px',
                        borderRadius:  5,
                        letterSpacing: '.03em',
                        textTransform: 'uppercase',
                      }}>
                        <Rocket size={9} strokeWidth={2.2} />
                        online
                      </span>
                    )}
                  </span>

                  <span style={{
                    display:      'block',
                    fontSize:     11.5,
                    color:        inkLight.label,
                    overflow:     'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace:   'nowrap',
                    marginTop:    1,
                  }}>
                    {b.service}
                    {b.professional ? ` · ${b.professional}` : ''}
                  </span>
                </span>

                {b.status === 'COMPLETED' && (
                  <span style={{
                    flexShrink:    0,
                    fontSize:      9.5,
                    fontWeight:    typography.weight.bold,
                    padding:       '2px 6px',
                    borderRadius:  5,
                    background:    inkLight.ok.bg,
                    color:         inkLight.ok.text,
                    textTransform: 'uppercase',
                    letterSpacing: '.04em',
                  }}>
                    Feito
                  </span>
                )}
              </div>
            )
          })}

          {hidden > 0 && (
            <div style={{
              paddingLeft: 6,
              paddingTop:  6,
              fontSize:    12,
              color:       inkLight.label,
            }}>
              + {hidden} {plural(hidden, 'atendimento', 'atendimentos')} depois
            </div>
          )}
        </div>
      )}
    </div>
  )
}
