'use client'

import { Booking } from '@/types/booking'
import { generateTimeSlots, SLOT_HEIGHT } from '@/lib/timeSlots'
import BookingCard from './BookingCard'

interface Props {
  professionalId: string
  bookings: Booking[]
}

export default function AgendaColumn({
  professionalId,
  bookings
}: Props) {
  const slots = generateTimeSlots()

  return (
    <div
      style={{
        position: 'relative',
        borderLeft: '1px solid #eee'
      }}
    >
      {slots.map((slot) => (
        <div
          key={slot}
          style={{
            height: SLOT_HEIGHT,
            borderBottom: '1px dashed #eee'
          }}
        />
      ))}

      {bookings
        .filter(
          (b) =>
            b.professional.id === professionalId
        )
        .map((booking) => (
          <BookingCard
            key={booking.id}
            booking={booking}
          />
        ))}
    </div>
  )
}
