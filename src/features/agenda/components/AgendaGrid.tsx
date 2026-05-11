'use client'
// src/features/agenda/components/AgendaGrid.tsx

import { useRef } from 'react'
import BookingCard from './BookingCard'
import { AgendaProfessional, AgendaBooking } from '../types'
import { colors, agendaLayout } from '@/shared/theme'
import { useAgendaStore } from '../hooks/useAgendaStore'

const {
  startHour:    START_HOUR,
  endHour:      END_HOUR,
  timeColWidth: TIME_COL_WIDTH,
  minColWidth:  MIN_COL_WIDTH,
  headerHeight: HEADER_HEIGHT,
} = agendaLayout

// ─── Constantes de layout ───────────────────────────────────────────────────
const SLOT_STEP    = 5                         // minutos por slot
const SLOT_HEIGHT  = 16                        // px por slot de 5min → 16px * 12 slots/hora = 192px/hora
const PX_PER_MIN   = SLOT_HEIGHT / SLOT_STEP   // 16 / 5 = 3.2px por minuto
const START_MIN    = START_HOUR * 60

// ─── Utilitários ────────────────────────────────────────────────────────────
function generateSlots(): string[] {
  const slots: string[] = []
  for (let h = START_HOUR; h < END_HOUR; h++) {
    for (let m = 0; m < 60; m += SLOT_STEP) {
      slots.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`)
    }
  }
  return slots
}

function toMinutes(t: string): number {
  const [h, m] = t.split(':').map(Number)
  return h * 60 + m
}

function getCurrentTimeY(): number {
  const now     = new Date()
  const minutes = now.getHours() * 60 + now.getMinutes()
  if (minutes < START_HOUR * 60 || minutes > END_HOUR * 60) return -1
  return (minutes - START_MIN) * PX_PER_MIN
}

// ─── Componente ─────────────────────────────────────────────────────────────
interface Props {
  professionals: AgendaProfessional[]
  bookings:      AgendaBooking[]
}

export default function AgendaGrid({ professionals, bookings }: Props) {
  const { openCreate } = useAgendaStore()
  const slots          = generateSlots()
  const scrollRef      = useRef<HTMLDivElement>(null)
  const currentY       = getCurrentTimeY()

  // Deduplicação defensiva
  const seen = new Set<string>()
  const uniqueBookings = bookings.filter(b => {
    if (seen.has(b.id)) return false
    seen.add(b.id)
    return true
  })

  const totalHeight = slots.length * SLOT_HEIGHT

  return (
    <div
      ref={scrollRef}
      style={{
        flex: 1, overflowY: 'auto', overflowX: 'auto',
        background: colors.background.page,
        fontFamily: '-apple-system, "SF Pro Display", system-ui, sans-serif',
      }}
    >
      <style>{`
        .grid-slot {
          height: ${SLOT_HEIGHT}px;
          cursor: pointer;
          box-sizing: border-box;
          transition: background 0.1s ease;
        }
        .grid-slot:hover { background: ${colors.red.subtle} !important; }
        .grid-slot-hour  { border-top: 1px solid ${colors.gray.border}; }
        .grid-slot-half  { border-top: 1px dashed rgba(0,0,0,0.06); }
        .grid-slot-5     { border-top: 1px solid transparent; }
      `}</style>

      <div style={{
        display: 'grid',
        gridTemplateColumns: `${TIME_COL_WIDTH}px repeat(${professionals.length}, minmax(${MIN_COL_WIDTH}px, 1fr))`,
        minWidth: `${TIME_COL_WIDTH + professionals.length * MIN_COL_WIDTH}px`,
        position: 'relative',
      }}>

        {/* ── Header: canto vazio ── */}
        <div style={{
          height: HEADER_HEIGHT, position: 'sticky', top: 0, zIndex: 20,
          background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(20px)',
          borderBottom: `1px solid ${colors.gray.border}`,
          borderRight: `1px solid ${colors.gray.border}`,
        }} />

        {/* ── Header: profissionais ── */}
        {professionals.map((p) => {
          const initials = p.name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase()
          return (
            <div key={p.id} style={{
              height: HEADER_HEIGHT, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              position: 'sticky', top: 0, zIndex: 20,
              background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(20px)',
              borderBottom: `1px solid ${colors.gray.border}`,
              borderLeft: `1px solid ${colors.gray.border}`,
              fontWeight: 600, fontSize: 13, color: colors.gray['900'],
            }}>
              <div style={{
                width: 30, height: 30, borderRadius: '50%',
                background: colors.red.gradient, color: '#fff',
                fontSize: 11, fontWeight: 700,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0, boxShadow: `0 2px 8px ${colors.red.glow}`,
              }}>{initials}</div>
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 100 }}>{p.name}</span>
            </div>
          )
        })}

        {/* ── Coluna de horários ── */}
        <div style={{ position: 'relative', zIndex: 2, height: totalHeight }}>
          {slots.map((time, i) => {
            const minutes = i * SLOT_STEP
            const isHour  = minutes % 60 === 0
            const isHalf  = minutes % 30 === 0 && !isHour
            return (
              <div key={time} style={{
                height: SLOT_HEIGHT,
                display: 'flex', alignItems: 'flex-start', justifyContent: 'flex-end',
                paddingRight: 8, paddingTop: 2, boxSizing: 'border-box',
                borderTop: isHour
                  ? `1px solid ${colors.gray.border}`
                  : isHalf
                    ? `1px dashed rgba(0,0,0,0.07)`
                    : '1px solid transparent',
              }}>
                {isHour && (
                  <span style={{ fontSize: 10, fontWeight: 600, color: colors.gray.dimText, fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}>
                    {time}
                  </span>
                )}
                {isHalf && (
                  <span style={{ fontSize: 9, fontWeight: 400, color: colors.gray.dimTextLight, fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}>
                    {time}
                  </span>
                )}
              </div>
            )
          })}
        </div>

        {/* ── Colunas de profissionais ── */}
        {professionals.map((p) => {
          const profBookings = uniqueBookings.filter(b => b.professionalId === p.id)
          return (
            <div key={p.id} style={{ position: 'relative', borderLeft: `1px solid ${colors.gray.border}`, zIndex: 5, height: totalHeight }}>

              {/* Slots clicáveis */}
              {slots.map((time, i) => {
                const minutes = i * SLOT_STEP
                const isHour  = minutes % 60 === 0
                const isHalf  = minutes % 30 === 0 && !isHour
                return (
                  <div
                    key={time}
                    className={`grid-slot ${isHour ? 'grid-slot-hour' : isHalf ? 'grid-slot-half' : 'grid-slot-5'}`}
                    onClick={() => openCreate(time, p.id)}
                  />
                )
              })}

              {/* Bookings: posicionamento pixel-preciso */}
              {profBookings.map((b) => {
                const startMin = toMinutes(b.start)
                const endMin   = toMinutes(b.end)
                const duration = endMin - startMin
                const top      = (startMin - START_MIN) * PX_PER_MIN
                // mínimo de 15min visível (3 slots de 5min)
                const height   = Math.max(duration * PX_PER_MIN - 2, 15 * PX_PER_MIN)

                return (
                  <div
                    key={b.id}
                    style={{
                      position: 'absolute', top, left: 4, right: 4, height,
                      zIndex: 8, pointerEvents: 'none',
                    }}
                  >
                    <div style={{ width: '100%', height: '100%', pointerEvents: 'auto' }}>
                      <BookingCard booking={b} totalHeight={height} />
                    </div>
                  </div>
                )
              })}

              {/* Indicador de hora atual */}
              {currentY >= 0 && (
                <div style={{
                  position: 'absolute', top: currentY, left: 0, right: 0,
                  height: 2,
                  background: `linear-gradient(90deg, ${colors.red.DEFAULT}, ${colors.red.light})`,
                  zIndex: 15, pointerEvents: 'none',
                  boxShadow: `0 0 6px ${colors.red.glow}`,
                }}>
                  <div style={{
                    width: 8, height: 8, borderRadius: '50%',
                    background: colors.red.DEFAULT,
                    position: 'absolute', left: -4, top: -3,
                    boxShadow: `0 0 6px ${colors.red.glow}`,
                  }} />
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}