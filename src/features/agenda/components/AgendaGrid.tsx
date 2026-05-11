'use client'
// src/features/agenda/components/AgendaGrid.tsx

import { useRef, useEffect, useState } from 'react'
import BookingCard from './BookingCard'
import { AgendaProfessional, AgendaBooking } from '../types'
import { colors, agendaLayout } from '@/shared/theme'
import { useAgendaStore } from '../hooks/useAgendaStore'

// ─── Fonte da verdade única: vem de agendaLayout ────────────────────────────
const START_HOUR   = agendaLayout.startHour    // 8
const END_HOUR     = agendaLayout.endHour      // 20
const TIME_COL_W   = agendaLayout.timeColWidth // 64
const MIN_COL_W    = agendaLayout.minColWidth  // 140
const HEADER_H     = agendaLayout.headerHeight // 56

// Slots de 5 em 5 minutos
const SLOT_STEP    = 5                         // minutos
const SLOT_H       = 16                        // px por slot de 5min
const PX_PER_MIN   = SLOT_H / SLOT_STEP        // 3.2 px/min
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

const SLOTS = generateSlots()

// ─── Indicador de hora atual ─────────────────────────────────────────────────
function useCurrentTimeY() {
  const [y, setY] = useState(-1)

  useEffect(() => {
    function calc() {
      const now = new Date()
      const min = now.getHours() * 60 + now.getMinutes()
      if (min < START_MIN || min > END_HOUR * 60) { setY(-1); return }
      setY((min - START_MIN) * PX_PER_MIN)
    }
    calc()
    const id = setInterval(calc, 30_000)
    return () => clearInterval(id)
  }, [])

  return y
}

// ─── Componente ─────────────────────────────────────────────────────────────
interface Props {
  professionals: AgendaProfessional[]
  bookings:      AgendaBooking[]
}

export default function AgendaGrid({ professionals, bookings }: Props) {
  const { openCreate } = useAgendaStore()
  const scrollRef      = useRef<HTMLDivElement>(null)
  const currentY       = useCurrentTimeY()
  const totalH         = SLOTS.length * SLOT_H  // altura total da grade

  // Deduplicação defensiva
  const seen = new Set<string>()
  const unique = bookings.filter(b => {
    if (seen.has(b.id)) return false
    seen.add(b.id)
    return true
  })

  // Scroll para hora atual ao montar
  useEffect(() => {
    if (currentY > 0 && scrollRef.current) {
      scrollRef.current.scrollTop = Math.max(0, currentY - 120)
    }
  }, [currentY])

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
        .ag-slot {
          height: ${SLOT_H}px;
          cursor: pointer;
          box-sizing: border-box;
          transition: background 0.1s;
        }
        .ag-slot:hover { background: ${colors.red.subtle} !important; }
        .ag-hour  { border-top: 1px solid ${colors.gray.border}; }
        .ag-half  { border-top: 1px dashed rgba(0,0,0,0.06); }
        .ag-5     { border-top: 1px solid transparent; }
      `}</style>

      <div style={{
        display: 'grid',
        gridTemplateColumns: `${TIME_COL_W}px repeat(${professionals.length}, minmax(${MIN_COL_W}px, 1fr))`,
        minWidth: `${TIME_COL_W + professionals.length * MIN_COL_W}px`,
        position: 'relative',
      }}>

        {/* ── Header canto ── */}
        <div style={{
          height: HEADER_H, position: 'sticky', top: 0, zIndex: 20,
          background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(20px)',
          borderBottom: `1px solid ${colors.gray.border}`,
          borderRight:  `1px solid ${colors.gray.border}`,
        }} />

        {/* ── Header profissionais ── */}
        {professionals.map(p => {
          const initials = p.name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase()
          return (
            <div key={p.id} style={{
              height: HEADER_H, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              position: 'sticky', top: 0, zIndex: 20,
              background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(20px)',
              borderBottom: `1px solid ${colors.gray.border}`,
              borderLeft:   `1px solid ${colors.gray.border}`,
              fontWeight: 600, fontSize: 13, color: colors.gray['900'],
            }}>
              <div style={{
                width: 30, height: 30, borderRadius: '50%',
                background: colors.red.gradient, color: '#fff',
                fontSize: 11, fontWeight: 700,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0, boxShadow: `0 2px 8px ${colors.red.glow}`,
              }}>{initials}</div>
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 100 }}>
                {p.name}
              </span>
            </div>
          )
        })}

        {/* ── Coluna de horários ── */}
        <div style={{ position: 'relative', zIndex: 2, height: totalH }}>
          {SLOTS.map((time, i) => {
            const min    = i * SLOT_STEP
            const isHour = min % 60 === 0
            const isHalf = min % 30 === 0 && !isHour
            return (
              <div key={time} style={{
                height: SLOT_H,
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
        {professionals.map(p => {
          const profBookings = unique.filter(b => b.professionalId === p.id)
          return (
            <div key={p.id} style={{
              position: 'relative',
              borderLeft: `1px solid ${colors.gray.border}`,
              zIndex: 5,
              height: totalH,
            }}>
              {/* Slots clicáveis */}
              {SLOTS.map((time, i) => {
                const min    = i * SLOT_STEP
                const isHour = min % 60 === 0
                const isHalf = min % 30 === 0 && !isHour
                return (
                  <div
                    key={time}
                    className={`ag-slot ${isHour ? 'ag-hour' : isHalf ? 'ag-half' : 'ag-5'}`}
                    onClick={() => openCreate(time, p.id)}
                  />
                )
              })}

              {/* Bookings posicionados por pixel */}
              {profBookings.map(b => {
                const startMin = toMinutes(b.start)
                const endMin   = toMinutes(b.end)

                // Valida que o booking está dentro do range da grade
                if (startMin < START_MIN || startMin >= END_HOUR * 60) return null

                const duration = Math.max(endMin - startMin, SLOT_STEP) // mínimo 5min
                const top      = (startMin - START_MIN) * PX_PER_MIN
                const height   = Math.max(duration * PX_PER_MIN - 2, SLOT_H * 2) // mínimo 2 slots visíveis

                return (
                  <div
                    key={b.id}
                    style={{
                      position: 'absolute',
                      top,
                      left: 4,
                      right: 4,
                      height,
                      zIndex: 8,
                    }}
                  >
                    <BookingCard booking={b} totalHeight={height} />
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