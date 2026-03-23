'use client'

import { Booking } from '@/types/booking'
import { generateTimeSlots, SLOT_HEIGHT } from '@/lib/timeSlots'
import BookingCard from './BookingCard'

interface Professional {
  id: string
  name: string
}

interface Props {
  bookings: Booking[]
  professionals: Professional[]
}

function timeToMinutes(time: string) {
  const [h, m] = time.split(':').map(Number)
  return h * 60 + m
}

export default function AgendaBoard({
  bookings,
  professionals
}: Props) {
  const slots = generateTimeSlots()

  function openCreateBookingModal(time: string, professionalId: string) {
    console.log('Novo booking:', { time, professionalId })
  }

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: `80px repeat(${professionals.length},1fr)`,
        height: '80vh',
        overflowY: 'auto',
        position: 'relative'
      }}
    >
      {/* canto vazio */}
      <div />

      {/* header profissionais */}
      {professionals.map((p) => (
        <div
          key={p.id}
          style={{
            padding: 12,
            fontWeight: 600,
            borderLeft: '1px solid #eee'
          }}
        >
          {p.name}
        </div>
      ))}

      {/* grade base */}
      {slots.map((slot) => (
        <div key={slot} style={{ display: 'contents' }}>
          {/* horário */}
          <div
            style={{
              height: SLOT_HEIGHT,
              fontSize: 12,
              color: '#666',
              paddingTop: 6
            }}
          >
            {slot}
          </div>

          {/* colunas */}
          {professionals.map((p) => (
            <div
              key={p.id + slot}
              onClick={() =>
                openCreateBookingModal(slot, p.id)
              }
              style={{
                height: SLOT_HEIGHT,
                borderLeft: '1px solid #eee',
                borderBottom: '1px dashed #eee',
                cursor: 'pointer',
                position: 'relative'
              }}
            />
          ))}
        </div>
      ))}

      {/* BOOKINGS (camada acima da grid) */}
      {bookings.map((booking) => {
        const startMinutes = timeToMinutes(booking.time)
        const top =
          ((startMinutes - 8 * 60) / 30) * SLOT_HEIGHT

        const height =
          (booking.duration / 30) * SLOT_HEIGHT

        const colIndex = professionals.findIndex(
          (p) => p.id === booking.professional?.id
        )

        if (colIndex === -1) return null

        return (
          <div
            key={booking.id}
            style={{
              position: 'absolute',
              top,
              left: `calc(80px + ${
                (100 / professionals.length) * colIndex
              }%)`,
              width: `calc(${100 / professionals.length}% - 12px)`,
              padding: '6px',
              zIndex: 5
            }}
          >
            <BookingCard booking={booking} />
          </div>
        )
      })}
    </div>
  )
}