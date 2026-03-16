'use client'

import { generateTimeSlots } from '@/lib/timeSlots'
import { Booking } from '@/types/booking'
import AgendaProfessionalColumn from './AgendaProfessionalColumn'

interface Props {
  bookings: Booking[]
}

export default function AgendaGrid({ bookings }: Props) {
  const slots = generateTimeSlots()

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '80px 1fr',
        gap: 12
      }}
    >
      {slots.map((slot) => (
        <>
          <div
            key={slot}
            style={{
              fontSize: 12,
              color: '#666',
              paddingTop: 8
            }}
          >
            {slot}
          </div>

          <AgendaProfessionalColumn
            bookings={bookings}
            slots={[slot]}
          />
        </>
      ))}
    </div>
  )
}