'use client'

import BookingCard from './BookingCard'
import { AgendaProfessional, AgendaBooking } from '@/types/agenda'

function toMinutes(t: string) {
  const [h, m] = t.split(':').map(Number)
  return h * 60 + m
}

export default function AgendaColumn({
  professional,
  bookings,
  slots,
  slotHeight,
  onCreateBooking
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
        borderLeft: '1px solid #eee',
        zIndex: 2 // 🔥 IMPORTANTE
      }}
    >
      {/* HEADER */}
      <div
        style={{
          height: 50,
          textAlign: 'center',
          fontWeight: 600,
          background: '#fff',
          position: 'sticky',
          top: 0,
          zIndex: 3
        }}
      >
        {professional.name}
      </div>

      {/* SLOTS */}
      <div style={{ position: 'relative', zIndex: 1 }}>
        {slots.map((time) => (
          <div
            key={time}
            onClick={() => {
              console.log('CLICK SLOT', time)
              onCreateBooking(time, professional.id)
            }}
            style={{
              height: slotHeight,
              borderBottom: '1px solid #eee',
              cursor: 'pointer'
            }}
          />
        ))}

        {/* BOOKINGS */}
        {bookings.map((b) => {
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
                zIndex: 2,
                pointerEvents: 'none' // 🔥 NÃO BLOQUEIA CLIQUE
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