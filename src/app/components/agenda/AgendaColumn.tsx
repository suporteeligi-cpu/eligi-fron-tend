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
        {slots.map((time) => {
  const handleClick = () => onCreateBooking(time, professional.id)

  return (
    <div
      key={time}
      onClick={handleClick}
      style={{
        height: slotHeight,
        borderBottom: '1px solid #eee',
        cursor: 'pointer'
      }}
    />
  )
})}

        {bookings.map((b) => (
          <BookingCard key={b.id} booking={b} />
        ))}
      </div>
    </div>
  )
}