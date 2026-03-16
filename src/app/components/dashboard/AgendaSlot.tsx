'use client'

import { Booking } from '@/types/booking'

interface Props {
  time: string
  booking?: Booking
  openCreateBookingModal: (time: string) => void
}

function durationToHeight(duration: number) {
  return duration * 2
}

export default function AgendaSlot({
  time,
  booking,
  openCreateBookingModal
}: Props) {
  const height = booking
    ? durationToHeight(
        booking.service?.duration || booking.duration
      )
    : 64

  if (!booking) {
    return (
      <div
        onClick={() => openCreateBookingModal(time)}
        style={{
          height,
          borderBottom: '1px solid #f1f5f9',
          cursor: 'pointer'
        }}
      />
    )
  }

  return (
    <div
      style={{
        height,
        padding: '6px',
        borderRadius: 8,
        background: booking.service.color || '#6366f1',
        color: '#fff',
        fontSize: 12,
        overflow: 'hidden'
      }}
    >
      <strong>{booking.clientName}</strong>

      <div>{booking.service.name}</div>

      <div>
        {booking.time} • {booking.professional.name}
      </div>
    </div>
  )
}