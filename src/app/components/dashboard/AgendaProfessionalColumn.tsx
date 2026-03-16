'use client'

import { Booking } from '@/types/booking'
import AgendaSlot from './AgendaSlot'

interface Props {
  bookings: Booking[]
  slots: string[]
}

export default function AgendaProfessionalColumn({
  bookings,
  slots
}: Props) {
  return (
    <>
      {slots.map((slot) => {
        const booking = bookings.find(
          (b) => b.time === slot
        )

        return (
          <AgendaSlot
            key={slot}
            time={slot}
            booking={booking}
          />
        )
      })}
    </>
  )
}