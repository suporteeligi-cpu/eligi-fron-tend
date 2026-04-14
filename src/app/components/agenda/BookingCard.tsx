'use client'

import { AgendaBooking } from '@/types/agenda'

function getColor(status: AgendaBooking['status']) {
  if (status === 'COMPLETED') return '#16a34a'
  if (status === 'CANCELED') return '#dc2626'
  return '#2563eb'
}

export default function BookingCard({ booking }: { booking: AgendaBooking }) {
  return (
    <div
      style={{
        height: '100%',
        borderRadius: 10,
        background: getColor(booking.status),
        color: '#fff',
        padding: 8,
        fontSize: 12
      }}
    >
      <strong>{booking.clientName}</strong>
      <div>{booking.serviceName}</div>
      <div>{booking.start} - {booking.end}</div>
    </div>
  )
}