'use client'

import BookingCard from './BookingCard'
import { AgendaProfessional, AgendaBooking } from '@/types/agenda'

interface Props {
  professional: AgendaProfessional
  bookings: AgendaBooking[]
}

export default function AgendaColumn({ professional, bookings }: Props) {
  const TOTAL_MINUTES = (20 - 8) * 60

  return (
    <div style={{ position: 'relative', borderLeft: '1px solid #eee', height: TOTAL_MINUTES }}>
      <div
        style={{
          position: 'sticky',
          top: 0,
          height: 50,
          background: '#fff',
          borderBottom: '1px solid #eee',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontWeight: 600,
          zIndex: 10
        }}
      >
        {professional.name}
      </div>

      {bookings.map(b => (
        <BookingCard key={b.id} booking={b} />
      ))}
    </div>
  )
}