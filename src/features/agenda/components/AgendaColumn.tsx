// ─── AgendaColumn.tsx ─────────────────────────────────────────────────────────
// (keep in a separate file in your project — placed here for reference)

import BookingCard from './BookingCard'
import { AgendaProfessional, AgendaBooking } from '@/features/agenda/types'

function toMinutes(t: string) {
  const [h, m] = t.split(':').map(Number)
  return h * 60 + m
}

export function AgendaColumn({
  professional,
  bookings: colBookings,
  slots,
  slotHeight,
  onCreateBooking,
}: {
  professional: AgendaProfessional
  bookings: AgendaBooking[]
  slots: string[]
  slotHeight: number
  onCreateBooking: (time: string, professionalId: string) => void
}) {
  const START = 8 * 60

  return (
    <div
      style={{
        position: 'relative',
        borderLeft: '1px solid rgba(0,0,0,0.06)',
        zIndex: 5,
        pointerEvents: 'auto',
      }}
    >
      {/* HEADER */}
      <div
        style={{
          height: 50,
          textAlign: 'center',
          fontWeight: 600,
          fontSize: 13,
          color: '#111827',
          background: 'rgba(255,255,255,0.88)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          position: 'sticky',
          top: 0,
          zIndex: 10,
          borderBottom: '1px solid rgba(0,0,0,0.07)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {professional.name}
      </div>

      {/* GRID */}
      <div style={{ position: 'relative' }}>
        {slots.map((time) => (
          <div
            key={time}
            onClick={() => onCreateBooking(time, professional.id)}
            style={{
              height: slotHeight,
              borderBottom: '1px solid rgba(0,0,0,0.05)',
              cursor: 'pointer',
              transition: 'background 0.15s ease',
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.background = 'rgba(220,38,38,0.04)')
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.background = 'transparent')
            }
          />
        ))}

        {/* BOOKINGS */}
        {colBookings.map((b) => {
          const start = toMinutes(b.start)
          const end = toMinutes(b.end)

          return (
            <div
              key={b.id}
              style={{
                position: 'absolute',
                top: ((start - START) / 30) * slotHeight,
                left: 6,
                right: 6,
                height: ((end - start) / 30) * slotHeight,
                zIndex: 8,
                pointerEvents: 'none',
              }}
            >
              <div style={{ pointerEvents: 'auto' }}>
                <BookingCard booking={b} />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}