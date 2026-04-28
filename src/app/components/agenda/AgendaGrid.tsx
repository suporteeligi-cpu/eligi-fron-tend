'use client'

import { useRef } from 'react'
import BookingCard from './BookingCard'
import { AgendaProfessional, AgendaBooking } from '@/types/agenda'

const START_HOUR = 8
const END_HOUR = 20
const SLOT_HEIGHT = 64   // px por 30min
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
    <div style={{ flex: 1, overflowY: 'auto', overflowX: 'auto' }} ref={scrollRef}>
      <div style={{
        display: 'grid',
        gridTemplateColumns: `${TIME_COL_WIDTH}px repeat(${professionals.length}, minmax(140px, 1fr))`,
        minWidth: `${TIME_COL_WIDTH + professionals.length * 140}px`,
        position: 'relative'
      }}>

        {/* ── STICKY HEADER ── */}
        {/* empty corner */}
        <div style={{
          height: 52, position: 'sticky', top: 0, zIndex: 20,
          background: 'var(--bg-elevated)',
          borderBottom: '1px solid var(--border-soft)',
          borderRight: '1px solid var(--border-soft)'
        }} />

        {professionals.map((p) => (
          <div key={p.id} style={{
            height: 52,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            position: 'sticky', top: 0, zIndex: 20,
            background: 'var(--bg-elevated)',
            borderBottom: '1px solid var(--border-soft)',
            borderLeft: '1px solid var(--border-soft)',
            fontWeight: 600, fontSize: 13,
            color: 'var(--text)',
            letterSpacing: '-0.2px'
          }}>
            {/* Avatar inicial */}
            <div style={{
              width: 28, height: 28, borderRadius: '50%',
              background: 'var(--brand)',
              color: '#fff', fontSize: 11, fontWeight: 700,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              marginRight: 8, flexShrink: 0
            }}>
              {p.name.slice(0, 2).toUpperCase()}
            </div>
            <span style={{
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              maxWidth: 100
            }}>
              {p.name}
            </span>
          </div>
        ))}

        {/* ── TIME COLUMN ── */}
        <div style={{ position: 'relative', zIndex: 2 }}>
          {slots.map((time, i) => (
            <div key={time} style={{
              height: SLOT_HEIGHT,
              display: 'flex', alignItems: 'flex-start',
              justifyContent: 'flex-end',
              paddingRight: 10, paddingTop: 4,
              borderBottom: i % 2 === 1 ? '1px solid var(--border-soft)' : 'none'
            }}>
              {i % 2 === 0 && (
                <span style={{
                  fontSize: 11, fontWeight: 500,
                  color: 'var(--text-muted)', letterSpacing: '-0.2px'
                }}>
                  {time}
                </span>
              )}
            </div>
          ))}
        </div>

        {/* ── PROFESSIONAL COLUMNS ── */}
        {professionals.map((p) => {
          const profBookings = bookings.filter(b => b.professionalId === p.id)
          const START_MIN = START_HOUR * 60

          return (
            <div key={p.id} style={{
              position: 'relative',
              borderLeft: '1px solid var(--border-soft)',
              zIndex: 5
            }}>
              {/* slots clicáveis */}
              {slots.map((time, i) => (
                <div
                  key={time}
                  onClick={() => onCreateBooking(time, p.id)}
                  style={{
                    height: SLOT_HEIGHT,
                    borderBottom: i % 2 === 1
                      ? '1px solid var(--border-soft)'
                      : '1px dashed rgba(0,0,0,0.04)',
                    cursor: 'pointer',
                    transition: 'background 0.12s ease'
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.background = 'rgba(225,6,0,0.04)'
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.background = 'transparent'
                  }}
                />
              ))}

              {/* bookings posicionados */}
              {profBookings.map((b) => {
                const startMin = toMinutes(b.start)
                const endMin = toMinutes(b.end)
                const top = ((startMin - START_MIN) / 30) * SLOT_HEIGHT
                const height = Math.max(((endMin - startMin) / 30) * SLOT_HEIGHT, SLOT_HEIGHT * 0.8)

                return (
                  <div
                    key={b.id}
                    style={{
                      position: 'absolute',
                      top, left: 6, right: 6,
                      height: height - 4,
                      zIndex: 8
                    }}
                  >
                    <BookingCard booking={b} />
                  </div>
                )
              })}

              {/* linha de agora */}
              {currentY >= 0 && (
                <div style={{
                  position: 'absolute',
                  top: currentY + 52, // offset do header
                  left: 0, right: 0,
                  height: 2,
                  background: 'var(--brand)',
                  zIndex: 15,
                  pointerEvents: 'none'
                }}>
                  <div style={{
                    width: 8, height: 8, borderRadius: '50%',
                    background: 'var(--brand)',
                    position: 'absolute', left: -4, top: -3
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