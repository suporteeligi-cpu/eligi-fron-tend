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

const STATUS_CONFIG = {
  CONFIRMED: {
    bg: 'rgba(220,38,38,0.06)',
    accent: '#dc2626',
    gradient: 'linear-gradient(135deg,#dc2626,#b91c1c)',
    label: 'Confirmado',
    labelBg: 'rgba(220,38,38,0.08)',
    labelColor: '#b91c1c',
  },
  COMPLETED: {
    bg: 'rgba(100,116,139,0.06)',
    accent: '#64748b',
    gradient: 'linear-gradient(135deg,#475569,#64748b)',
    label: 'Concluído',
    labelBg: 'rgba(100,116,139,0.1)',
    labelColor: '#334155',
  },
  CANCELED: {
    bg: 'rgba(148,163,184,0.06)',
    accent: '#94a3b8',
    gradient: 'linear-gradient(135deg,#94a3b8,#cbd5e1)',
    label: 'Cancelado',
    labelBg: 'rgba(148,163,184,0.1)',
    labelColor: '#64748b',
  },
}

interface Props {
  professionals: AgendaProfessional[]
  bookings: AgendaBooking[]
  onCreateBooking: (time: string, professionalId: string) => void
}

export default function AgendaMobileList({
  professionals,
  bookings,
  onCreateBooking,
}: Props) {
  const slots = generateHourSlots()
  const [currentProf, setCurrentProf] = useState<string | null>(
    professionals[0]?.id ?? null
  )

  const profBookings = useMemo(
    () =>
      bookings.filter((b) => !currentProf || b.professionalId === currentProf),
    [bookings, currentProf]
  )

  const profForBooking = (id: string) =>
    professionals.find((p) => p.id === id)?.name ?? id

  const slotItems: SlotItem[] = useMemo(() => {
    return slots.reduce<SlotItem[]>((acc, time) => {
      const timeMin = toMinutes(time)
      const booking = profBookings.find((b) => {
        const start = toMinutes(b.start)
        const end = toMinutes(b.end)
        return timeMin >= start && timeMin < end
      })
      const isBookingStart = booking && toMinutes(booking.start) === timeMin
      if (booking && !isBookingStart) return acc
      acc.push({
        time,
        booking: isBookingStart ? booking : undefined,
        free: !booking,
      })
      return acc
    }, [])
  }, [slots, profBookings])

  return (
    <div
      style={{
        height: '100%',
        overflowY: 'auto',
        background: '#f5f5f7',
        fontFamily: '-apple-system, "SF Pro Display", system-ui, sans-serif',
      }}
    >
      <style>{`
        .prof-chip {
          flex-shrink: 0;
          padding: 6px 16px;
          border-radius: 20px;
          font-size: 13px;
          font-weight: 500;
          cursor: pointer;
          border: 1px solid rgba(0,0,0,0.09);
          background: rgba(255,255,255,0.8);
          backdrop-filter: blur(10px);
          color: #374151;
          transition: all 0.18s cubic-bezier(0.34,1.56,0.64,1);
          font-family: -apple-system, system-ui, sans-serif;
        }
        .prof-chip:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(220,38,38,0.12);
          border-color: rgba(220,38,38,0.25);
        }
        .prof-chip.active {
          background: linear-gradient(135deg, #dc2626, #b91c1c);
          color: #fff;
          border-color: transparent;
          box-shadow: 0 4px 14px rgba(220,38,38,0.28);
        }
        .slot-booked {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 13px 14px;
          border-radius: 16px;
          background: rgba(255,255,255,0.85);
          border: 1px solid rgba(0,0,0,0.07);
          box-shadow: 0 1px 6px rgba(0,0,0,0.05);
          backdrop-filter: blur(16px);
          cursor: pointer;
          position: relative;
          overflow: hidden;
          transition: transform 0.18s ease, box-shadow 0.18s ease;
        }
        .slot-booked:hover {
          transform: translateX(3px);
          box-shadow: 0 4px 16px rgba(0,0,0,0.09);
        }
        .slot-free {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 13px 14px;
          border-radius: 16px;
          background: rgba(255,255,255,0.5);
          border: 1px dashed rgba(0,0,0,0.1);
          cursor: pointer;
          position: relative;
          overflow: hidden;
          transition: transform 0.18s ease, background 0.15s, box-shadow 0.18s ease;
        }
        .slot-free:hover {
          transform: translateX(3px);
          background: rgba(220,38,38,0.03);
          box-shadow: 0 4px 14px rgba(220,38,38,0.07);
          border-color: rgba(220,38,38,0.2);
        }
        .new-btn {
          padding: 7px 16px;
          border-radius: 12px;
          background: rgba(220,38,38,0.08);
          border: 1px solid rgba(220,38,38,0.18);
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          color: #dc2626;
          transition: all 0.15s;
          font-family: -apple-system, system-ui, sans-serif;
        }
        .new-btn:hover {
          background: rgba(220,38,38,0.14);
          box-shadow: 0 3px 10px rgba(220,38,38,0.15);
        }
      `}</style>

      {/* Prof selector */}
      {professionals.length > 1 && (
        <div
          style={{
            display: 'flex',
            gap: 8,
            padding: '14px 16px',
            overflowX: 'auto',
            scrollbarWidth: 'none',
            borderBottom: '1px solid rgba(0,0,0,0.07)',
            background: 'rgba(255,255,255,0.72)',
            backdropFilter: 'blur(20px)',
          }}
        >
          <button
            className={`prof-chip${!currentProf ? ' active' : ''}`}
            onClick={() => setCurrentProf(null)}
          >
            Todos
          </button>
          {professionals.map((p) => (
            <button
              key={p.id}
              className={`prof-chip${currentProf === p.id ? ' active' : ''}`}
              onClick={() => setCurrentProf(p.id)}
            >
              {p.name}
            </button>
          ))}
        </div>
      )}

      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '18px 16px 10px',
        }}
      >
        <span
          style={{ fontSize: 16, fontWeight: 600, color: '#111827' }}
        >
          Horários do dia
        </span>
        <button
          className="new-btn"
          onClick={() =>
            onCreateBooking(
              '09:00',
              currentProf ?? professionals[0]?.id ?? ''
            )
          }
        >
          + Novo horário
        </button>
      </div>

      {/* Slot list */}
      <div
        style={{
          padding: '4px 16px 32px',
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
        }}
      >
        {slotItems.map((item) => {
          if (item.booking) {
            const cfg =
              STATUS_CONFIG[item.booking.status] ?? STATUS_CONFIG.CONFIRMED
            const initials = item.booking.clientName
              .split(' ')
              .slice(0, 2)
              .map((w) => w[0])
              .join('')
              .toUpperCase()
            const dur =
              toMinutes(item.booking.end) - toMinutes(item.booking.start)

            return (
              <div key={item.time} className="slot-booked">
                {/* accent bar */}
                <div
                  style={{
                    position: 'absolute',
                    left: 0,
                    top: 0,
                    bottom: 0,
                    width: 3,
                    background: cfg.gradient,
                    borderRadius: '0',
                  }}
                />

                <span
                  style={{
                    fontSize: 12,
                    fontWeight: 500,
                    color: 'rgba(0,0,0,0.35)',
                    minWidth: 42,
                    marginLeft: 8,
                    fontVariantNumeric: 'tabular-nums',
                  }}
                >
                  {item.booking.start}
                </span>

                <div
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: '50%',
                    background: cfg.gradient,
                    color: '#fff',
                    fontSize: 13,
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    boxShadow: `0 3px 10px ${cfg.accent}44`,
                  }}
                >
                  {initials}
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: 14,
                      fontWeight: 600,
                      color: '#111827',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {item.booking.clientName}
                  </div>
                  <div
                    style={{
                      fontSize: 12,
                      color: 'rgba(0,0,0,0.42)',
                      marginTop: 2,
                    }}
                  >
                    {item.booking.serviceName} · {dur}min
                    {!currentProf && item.booking.professionalId && (
                      <span
                        style={{ marginLeft: 6, color: cfg.accent }}
                      >
                        · {profForBooking(item.booking.professionalId)}
                      </span>
                    )}
                  </div>
                </div>

                <div
                  style={{
                    padding: '4px 10px',
                    borderRadius: 20,
                    background: cfg.labelBg,
                    color: cfg.labelColor,
                    fontSize: 11,
                    fontWeight: 600,
                    flexShrink: 0,
                  }}
                >
                  {cfg.label}
                </div>
              </div>
            )
          }

          return (
            <div
              key={item.time}
              className="slot-free"
              onClick={() =>
                onCreateBooking(
                  item.time,
                  currentProf ?? professionals[0]?.id ?? ''
                )
              }
            >
              <div
                style={{
                  position: 'absolute',
                  left: 0,
                  top: 0,
                  bottom: 0,
                  width: 3,
                  background: 'rgba(0,0,0,0.07)',
                  borderRadius: 0,
                }}
              />

              <span
                style={{
                  fontSize: 12,
                  fontWeight: 500,
                  color: 'rgba(0,0,0,0.32)',
                  minWidth: 42,
                  marginLeft: 8,
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                {item.time}
              </span>

              <div
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: '50%',
                  background: 'rgba(0,0,0,0.04)',
                  color: 'rgba(0,0,0,0.22)',
                  fontSize: 22,
                  fontWeight: 300,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                +
              </div>

              <div style={{ flex: 1 }}>
                <div
                  style={{
                    fontSize: 13,
                    fontWeight: 500,
                    color: 'rgba(0,0,0,0.38)',
                  }}
                >
                  Horário livre
                </div>
                <div
                  style={{
                    fontSize: 11,
                    color: 'rgba(0,0,0,0.28)',
                    marginTop: 2,
                  }}
                >
                  Disponível para agendamento
                </div>
              </div>

              <div
                style={{
                  padding: '3px 10px',
                  borderRadius: 20,
                  background: 'rgba(0,0,0,0.04)',
                  color: 'rgba(0,0,0,0.3)',
                  fontSize: 11,
                  fontWeight: 500,
                }}
              >
                Livre
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}