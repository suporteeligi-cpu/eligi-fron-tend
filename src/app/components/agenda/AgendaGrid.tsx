'use client'

import AgendaColumn from './AgendaColumn'
import { AgendaProfessional, AgendaBooking } from '@/types/agenda'

const START = 8
const END = 20
const SLOT_HEIGHT = 64

function generateSlots() {
  const slots: string[] = []

  for (let h = START; h < END; h++) {
    slots.push(`${String(h).padStart(2, '0')}:00`)
    slots.push(`${String(h).padStart(2, '0')}:30`)
  }

  return slots
}

export default function AgendaGrid({
  professionals,
  bookings,
  onCreateBooking
}: {
  professionals: AgendaProfessional[]
  bookings: AgendaBooking[]
  onCreateBooking: (time: string, professionalId: string) => void
}) {
  const slots = generateSlots()

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: `80px repeat(${professionals.length}, 1fr)`,
        background: '#fff',
        position: 'relative', // 🔥 IMPORTANTE
        zIndex: 1
      }}
    >
      {/* HORÁRIOS */}
      <div style={{ position: 'relative', zIndex: 2 }}>
        {slots.map((time, i) => (
          <div
            key={time}
            style={{
              height: SLOT_HEIGHT,
              fontSize: 12,
              padding: 4
            }}
          >
            {i % 2 === 0 ? time : ''}
          </div>
        ))}
      </div>

      {professionals.map((p) => (
        <AgendaColumn
          key={p.id}
          professional={p}
          bookings={bookings.filter((b) => b.professionalId === p.id)}
          slots={slots}
          slotHeight={SLOT_HEIGHT}
          onCreateBooking={onCreateBooking}
        />
      ))}
    </div>
  )
}