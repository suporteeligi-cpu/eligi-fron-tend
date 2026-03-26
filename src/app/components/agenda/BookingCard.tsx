'use client'

import { AgendaBooking } from '@/types/agenda'

interface Props {
  booking: AgendaBooking
}

export default function BookingCard({ booking }: Props) {
  const top = timeToY(booking.start)
  const height = durationToHeight(booking.start, booking.end)

  return (
    <div
      style={{
        position: 'absolute',
        top,
        left: 8,
        right: 8,
        height,
        background: getColor(booking.status),
        borderRadius: 10,
        padding: 8,
        color: '#fff',
        fontSize: 12
      }}
    >
      <div style={{ fontWeight: 600 }}>{booking.clientName}</div>
      <div>{booking.serviceName}</div>
      <div>{booking.start} - {booking.end}</div>
    </div>
  )
}

function timeToY(time: string) {
  const [h, m] = time.split(':').map(Number)
  return (h - 8) * 60 + m
}

function durationToHeight(start: string, end: string) {
  const [sh, sm] = start.split(':').map(Number)
  const [eh, em] = end.split(':').map(Number)
  return eh * 60 + em - (sh * 60 + sm)
}

function getColor(status: string) {
  switch (status) {
    case 'CONFIRMED':
      return '#2563eb'
    case 'COMPLETED':
      return '#16a34a'
    case 'CANCELED':
      return '#dc2626'
    default:
      return '#6b7280'
  }
}