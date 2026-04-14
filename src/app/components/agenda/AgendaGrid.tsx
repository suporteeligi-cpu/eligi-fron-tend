'use client'

import AgendaColumn from './AgendaColumn'
import { AgendaBooking, AgendaProfessional } from '@/types/agenda'

interface Props {
  professionals: AgendaProfessional[]
  bookings: AgendaBooking[]
  onCreateBooking: (time: string, professionalId: string) => void
}

export default function AgendaGrid({
  professionals,
  bookings,
  onCreateBooking
}: Props) {
  const slots = Array.from({ length: 24 }, (_, i) => `${i}:00`)

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${professionals.length}, 1fr)`,
        position: 'relative',
        zIndex: 1,
        pointerEvents: 'auto'
      }}
    >
      {professionals.map((p) => (
        <AgendaColumn
          key={p.id}
          professional={p}
          bookings={bookings.filter(b => b.professionalId === p.id)}
          slots={slots}
          slotHeight={64}
          onCreateBooking={onCreateBooking}
        />
      ))}
    </div>
  )
}