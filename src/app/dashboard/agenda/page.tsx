'use client'

import { useBookings } from '@/hooks/useBookings'

export default function AgendaPage() {
  const today = new Date().toISOString().slice(0, 10)

  const { bookings, loading } = useBookings(today)

  if (loading) return <div>Carregando agenda...</div>

  return (
    <div style={{ padding: 24 }}>
      <h1>Agenda</h1>

      {bookings.map((booking) => (
        <div
          key={booking.id}
          style={{
            padding: 12,
            border: '1px solid #eee',
            borderRadius: 8,
            marginBottom: 10
          }}
        >
          <strong>{booking.time}</strong> — {booking.clientName}

          <div style={{ fontSize: 13 }}>
            {booking.service.name}
          </div>

          <div style={{ fontSize: 12, color: '#666' }}>
            {booking.professional?.name}
          </div>
        </div>
      ))}
    </div>
  )
}