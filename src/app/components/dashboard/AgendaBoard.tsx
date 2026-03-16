'use client'

import { Booking } from '@/types/booking'
import { generateTimeSlots, SLOT_HEIGHT } from '@/lib/timeSlots'
import AgendaColumn from './AgendaColumn'

interface Professional {
  id: string
  name: string
}

interface Props {
  bookings: Booking[]
  professionals: Professional[]
}

export default function AgendaBoard({
  bookings,
  professionals
}: Props) {
  const slots = generateTimeSlots()

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: `80px repeat(${professionals.length},1fr)`,
        height: '80vh',
        overflowY: 'auto'
      }}
    >
      <div />

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

      {slots.map((slot) => (
        <>
          <div
            key={slot}
            style={{
              height: SLOT_HEIGHT,
              fontSize: 12,
              color: '#666',
              paddingTop: 6
            }}
          >
            {slot}
          </div>

          {professionals.map((p) => (
            <AgendaColumn
              key={p.id + slot}
              professionalId={p.id}
              bookings={bookings}
            />
          ))}
        </>
      ))}
    </div>
  )
}
