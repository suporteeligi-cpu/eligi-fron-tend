'use client'

import { Booking } from '@/types/booking'
import { SLOT_HEIGHT } from '@/lib/timeSlots'

interface Props {
  booking: Booking
}

export default function BookingCard({ booking }: Props) {
  const height =
    (booking.duration / 30) * SLOT_HEIGHT

  const color =
    booking.service.color || '#ef4444'

  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: 6,
        right: 6,
        height,
        borderRadius: 12,
        padding: 10,
        background: color,
        color: '#fff',
        fontSize: 13,
        boxShadow:
          '0 10px 25px rgba(0,0,0,0.15)'
      }}
    >
      <div style={{ fontWeight: 600 }}>
        {booking.clientName}
      </div>

      <div style={{ fontSize: 12 }}>
        {booking.service.name}
      </div>
    </div>
  )
}
