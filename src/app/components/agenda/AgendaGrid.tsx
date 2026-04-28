'use client'

import { useRef } from 'react'
import BookingCard from './BookingCard'
import { AgendaProfessional, AgendaBooking } from '@/types/agenda'

const START_HOUR = 8
const END_HOUR = 20
const SLOT_HEIGHT = 64
const TIME_COL_WIDTH = 64

function generateSlots() {
  const slots: string[] = []
  for (let h = START_HOUR; h < END_HOUR; h++) {
    slots.push(`${String(h).padStart(2, '0')}:00`)
    slots.push(`${String(h).padStart(2, '0')}:30`)
  }
  return slots
}

function toMinutes(t: string) {
  const [h, m] = t.split(':').map(Number)
  return h * 60 + m
}

function getCurrentTimeY(): number {
  const now = new Date()
  const minutes = now.getHours() * 60 + now.getMinutes()
  const start = START_HOUR * 60
  if (minutes < start || minutes > END_HOUR * 60) return -1
  return ((minutes - start) / 30) * SLOT_HEIGHT
}

interface Props {
  professionals: AgendaProfessional[]
  bookings: AgendaBooking[]
  onCreateBooking: (time: string, professionalId: string) => void
}

export default function AgendaGrid({ professionals, bookings, onCreateBooking }: Props) {
  const slots = generateSlots()
  const scrollRef = useRef<HTMLDivElement>(null)
  const currentY = getCurrentTimeY()

  return (
    <div style={{
      flex: 1, overflowY: 'auto', overflowX: 'auto',
      background: 'linear-gradient(135deg, #e8f0ff 0%, #f0e8ff 50%, #e8fff4 100%)',
      fontFamily: '-apple-system, "SF Pro Display", system-ui, sans-serif'
    }} ref={scrollRef}>
      <style>{`
        .grid-slot {
          height: ${SLOT_HEIGHT}px;
          cursor: pointer;
          transition: background 0.14s ease;
        }
        .grid-slot:hover {
          background: rgba(43,125,255,0.05) !important;
        }
      `}</style>

      <div style={{
        display: 'grid',
        gridTemplateColumns: `${TIME_COL_WIDTH}px repeat(${professionals.length}, minmax(140px, 1fr))`,
        minWidth: `${TIME_COL_WIDTH + professionals.length * 140}px`,
        position: 'relative'
      }}>

        {/* sticky corner */}
        <div style={{
          height: 56, position: 'sticky', top: 0, zIndex: 20,
          background: 'rgba(255,255,255,0.72)',
          backdropFilter: 'blur(20px)',
          borderBottom: '1px solid rgba(255,255,255,0.4)',
          borderRight: '1px solid rgba(255,255,255,0.3)'
        }} />

        {/* prof headers */}
        {professionals.map((p) => {
          const initials = p.name.split(' ').slice(0,2).map(w=>w[0]).join('').toUpperCase()
          return (
            <div key={p.id} style={{
              height: 56,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              position: 'sticky', top: 0, zIndex: 20,
              background: 'rgba(255,255,255,0.72)',
              backdropFilter: 'blur(20px)',
              borderBottom: '1px solid rgba(255,255,255,0.4)',
              borderLeft: '1px solid rgba(255,255,255,0.3)',
              fontWeight: 600, fontSize: 13, color: '#1a1a2e',
              letterSpacing: '-0.2px', gap: 8
            }}>
              <div style={{
                width: 30, height: 30, borderRadius: '50%',
                background: 'linear-gradient(135deg, #2B7DFF, #5E5CE6)',
                color: '#fff', fontSize: 11, fontWeight: 700,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0, boxShadow: '0 2px 8px rgba(43,125,255,0.3)'
              }}>
                {initials}
              </div>
              <span style={{
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                maxWidth: 100
              }}>
                {p.name}
              </span>
            </div>
          )
        })}

        {/* time column */}
        <div style={{ position: 'relative', zIndex: 2 }}>
          {slots.map((time, i) => (
            <div key={time} style={{
              height: SLOT_HEIGHT,
              display: 'flex', alignItems: 'flex-start',
              justifyContent: 'flex-end',
              paddingRight: 10, paddingTop: 5,
              borderBottom: i % 2 === 1
                ? '1px solid rgba(255,255,255,0.5)'
                : '1px solid transparent'
            }}>
              {i % 2 === 0 && (
                <span style={{
                  fontSize: 11, fontWeight: 500,
                  color: 'rgba(26,26,46,0.4)',
                  letterSpacing: '-0.2px', fontVariantNumeric: 'tabular-nums'
                }}>
                  {time}
                </span>
              )}
            </div>
          ))}
        </div>

        {/* prof columns */}
        {professionals.map((p) => {
          const profBookings = bookings.filter(b => b.professionalId === p.id)
          const START_MIN = START_HOUR * 60

          return (
            <div key={p.id} style={{
              position: 'relative',
              borderLeft: '1px solid rgba(255,255,255,0.4)',
              zIndex: 5
            }}>
              {slots.map((time, i) => (
                <div
                  key={time}
                  className="grid-slot"
                  onClick={() => onCreateBooking(time, p.id)}
                  style={{
                    borderBottom: i % 2 === 1
                      ? '1px solid rgba(255,255,255,0.5)'
                      : '1px dashed rgba(255,255,255,0.3)'
                  }}
                />
              ))}

              {profBookings.map((b) => {
                const startMin = toMinutes(b.start)
                const endMin = toMinutes(b.end)
                const top = ((startMin - START_MIN) / 30) * SLOT_HEIGHT
                const height = Math.max(((endMin - startMin) / 30) * SLOT_HEIGHT, SLOT_HEIGHT * 0.8)

                return (
                  <div key={b.id} style={{
                    position: 'absolute',
                    top, left: 6, right: 6,
                    height: height - 4, zIndex: 8
                  }}>
                    <BookingCard booking={b} />
                  </div>
                )
              })}

              {/* current time line */}
              {currentY >= 0 && (
                <div style={{
                  position: 'absolute',
                  top: currentY + 56,
                  left: 0, right: 0,
                  height: 2,
                  background: 'linear-gradient(90deg, #FF375F, #ff6b6b)',
                  zIndex: 15, pointerEvents: 'none',
                  boxShadow: '0 0 6px rgba(255,55,95,0.4)'
                }}>
                  <div style={{
                    width: 8, height: 8, borderRadius: '50%',
                    background: '#FF375F',
                    position: 'absolute', left: -4, top: -3,
                    boxShadow: '0 0 6px rgba(255,55,95,0.5)'
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