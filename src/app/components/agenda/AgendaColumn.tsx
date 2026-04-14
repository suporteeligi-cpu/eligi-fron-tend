'use client'

import BookingCard from './BookingCard'
import { AgendaProfessional, AgendaBooking } from '@/types/agenda'

interface Props {
  professional: AgendaProfessional
  bookings: AgendaBooking[]
  slots: string[]
  slotHeight: number
  onCreateBooking: (time: string, professionalId: string) => void
}

export default function AgendaColumn({
  professional,
  bookings,
  slots,
  slotHeight,
  onCreateBooking
}: Props) {
  return (
    <div
      style={{
        position: 'relative',
        zIndex: 10,
        pointerEvents: 'auto',
        borderLeft: '1px solid #eee',
        background: '#fff'
      }}
    >
      {/* HEADER */}
      <div style={{ height: 50, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {professional.name}
      </div>

      <div>
        {slots.map((time) => (
          <div
            key={time}
            onClick={() => alert('CLIQUE FUNCIONOU')}
            style={{
              height: slotHeight,
              background: 'rgba(255,0,0,0.1)',
              borderBottom: '1px solid #f1f1f1'
            }}
          />
        ))}

        {bookings.map((b) => (
          <BookingCard key={b.id} booking={b} />
        ))}
      </div>
    </div>
  )
}