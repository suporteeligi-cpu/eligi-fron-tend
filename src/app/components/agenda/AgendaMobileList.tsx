'use client'

import { useState, useMemo } from 'react'
import { AgendaProfessional, AgendaBooking } from '@/types/agenda'

const START_HOUR = 8
const END_HOUR = 20

function generateHourSlots(): string[] {
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

interface SlotItem {
  time: string
  booking?: AgendaBooking
  free: boolean
}

const STATUS_COLORS = {
  CONFIRMED: { bg: 'rgba(37,99,235,0.08)', accent: '#2563eb', label: 'Confirmado' },
  COMPLETED: { bg: 'rgba(22,163,74,0.08)', accent: '#16a34a', label: 'Concluído' },
  CANCELED:  { bg: 'rgba(220,38,38,0.08)', accent: '#dc2626', label: 'Cancelado' },
}

interface Props {
  professionals: AgendaProfessional[]
  bookings: AgendaBooking[]
  onCreateBooking: (time: string, professionalId: string) => void
}

export default function AgendaMobileList({ professionals, bookings, onCreateBooking }: Props) {
  const slots = generateHourSlots()

  const [currentProf, setCurrentProf] = useState<string | null>(
    professionals[0]?.id ?? null
  )

  const profBookings = useMemo(
    () => bookings.filter(b => !currentProf || b.professionalId === currentProf),
    [bookings, currentProf]
  )

  const profForBooking = (id: string) =>
    professionals.find(p => p.id === id)?.name ?? id

  const slotItems: SlotItem[] = useMemo(() => {
    return slots.reduce<SlotItem[]>((acc, time) => {
      const timeMin = toMinutes(time)
      const booking = profBookings.find(b => {
        const start = toMinutes(b.start)
        const end = toMinutes(b.end)
        return timeMin >= start && timeMin < end
      })

      const isBookingStart = booking && toMinutes(booking.start) === timeMin
      if (booking && !isBookingStart) return acc

      acc.push({
        time,
        booking: isBookingStart ? booking : undefined,
        free: !booking
      })
      return acc
    }, [])
  }, [slots, profBookings])

  return (
    <div style={{ height: '100%', overflowY: 'auto', background: 'var(--bg)' }}>

      {professionals.length > 1 && (
        <div style={{
          display: 'flex', gap: 8, padding: '12px 16px',
          overflowX: 'auto', scrollbarWidth: 'none',
          borderBottom: '1px solid var(--border-soft)'
        }}>
          <button
            onClick={() => setCurrentProf(null)}
            style={{
              flexShrink: 0, padding: '6px 14px',
              borderRadius: 20, border: '1px solid var(--border-soft)',
              fontSize: 13, fontWeight: 500, cursor: 'pointer',
              background: !currentProf ? 'var(--brand)' : 'var(--bg-glass)',
              color: !currentProf ? '#fff' : 'var(--text)',
              transition: 'all 0.15s'
            }}
          >
            Todos
          </button>
          {professionals.map(p => (
            <button
              key={p.id}
              onClick={() => setCurrentProf(p.id)}
              style={{
                flexShrink: 0, padding: '6px 14px',
                borderRadius: 20, border: '1px solid var(--border-soft)',
                fontSize: 13, fontWeight: 500, cursor: 'pointer',
                background: currentProf === p.id ? 'var(--brand)' : 'var(--bg-glass)',
                color: currentProf === p.id ? '#fff' : 'var(--text)',
                transition: 'all 0.15s'
              }}
            >
              {p.name}
            </button>
          ))}
        </div>
      )}

      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '16px 16px 8px'
      }}>
        <span style={{ fontSize: 15, fontWeight: 600, color: 'var(--text)' }}>
          Horários do dia
        </span>
        <button
          onClick={() => onCreateBooking('09:00', currentProf ?? professionals[0]?.id ?? '')}
          style={{
            padding: '6px 14px', borderRadius: 10,
            background: 'var(--bg-glass)', border: '1px solid var(--border-soft)',
            fontSize: 13, fontWeight: 500, cursor: 'pointer',
            color: 'var(--text-muted)', backdropFilter: 'blur(10px)'
          }}
        >
          + Novo horário
        </button>
      </div>

      <div style={{ padding: '4px 16px 24px', display: 'flex', flexDirection: 'column', gap: 8 }}>
        {slotItems.map((item) => {
          if (item.booking) {
            const colors = STATUS_COLORS[item.booking.status] ?? STATUS_COLORS.CONFIRMED
            const initials = item.booking.clientName
              .split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase()

            return (
              <div key={item.time} style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '12px 14px', borderRadius: 'var(--radius-md)',
                background: 'var(--bg-elevated)', border: '1px solid var(--border-soft)',
                boxShadow: 'var(--shadow-sm)', backdropFilter: 'blur(10px)',
                cursor: 'pointer', position: 'relative', overflow: 'hidden'
              }}>
                <div style={{
                  position: 'absolute', left: 0, top: 0, bottom: 0, width: 3,
                  background: colors.accent, borderRadius: '4px 0 0 4px'
                }} />
                <span style={{
                  fontSize: 13, fontWeight: 600, color: 'var(--text-muted)',
                  minWidth: 40, marginLeft: 6
                }}>
                  {item.booking.start}
                </span>
                <div style={{
                  width: 38, height: 38, borderRadius: '50%',
                  background: colors.accent, color: '#fff',
                  fontSize: 13, fontWeight: 700,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0
                }}>
                  {initials}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontSize: 15, fontWeight: 600, color: 'var(--text)',
                    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'
                  }}>
                    {item.booking.clientName}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 1 }}>
                    {item.booking.serviceName} · {toMinutes(item.booking.end) - toMinutes(item.booking.start)}min
                    {!currentProf && item.booking.professionalId && (
                      <span style={{ marginLeft: 6, color: colors.accent }}>
                        · {profForBooking(item.booking.professionalId)}
                      </span>
                    )}
                  </div>
                </div>
                <div style={{
                  padding: '3px 10px', borderRadius: 20,
                  background: colors.bg, color: colors.accent,
                  fontSize: 11, fontWeight: 600, flexShrink: 0
                }}>
                  {colors.label}
                </div>
              </div>
            )
          }

          return (
            <div
              key={item.time}
              onClick={() => onCreateBooking(item.time, currentProf ?? professionals[0]?.id ?? '')}
              style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '12px 14px', borderRadius: 'var(--radius-md)',
                background: 'var(--bg-glass)', border: '1px dashed var(--border-soft)',
                cursor: 'pointer', transition: 'background 0.15s',
                position: 'relative', overflow: 'hidden'
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(225,6,0,0.04)' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'var(--bg-glass)' }}
            >
              <div style={{
                position: 'absolute', left: 0, top: 0, bottom: 0, width: 3,
                background: '#22c55e', borderRadius: '4px 0 0 4px'
              }} />
              <span style={{
                fontSize: 13, fontWeight: 600, color: 'var(--text-muted)',
                minWidth: 40, marginLeft: 6
              }}>
                {item.time}
              </span>
              <div style={{
                width: 38, height: 38, borderRadius: '50%',
                background: 'rgba(34,197,94,0.15)', color: '#22c55e',
                fontSize: 20, fontWeight: 300,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0
              }}>
                +
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--text)' }}>
                  Horário livre
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 1 }}>
                  Disponível para agendamento
                </div>
              </div>
              <div style={{
                padding: '3px 10px', borderRadius: 20,
                background: 'rgba(34,197,94,0.1)', color: '#22c55e',
                fontSize: 11, fontWeight: 600
              }}>
                Livre
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}