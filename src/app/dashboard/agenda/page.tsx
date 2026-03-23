'use client'

import { useState } from 'react'
import AgendaBoard from '@/app/components/dashboard/AgendaBoard'
import { useBookings } from '@/hooks/useBookings'
import { useProfessionals } from '@/hooks/useProfessionals'

export default function AgendaPage() {
  const [date, setDate] = useState(
    new Date().toISOString().split('T')[0]
  )

  const { bookings, loading } = useBookings(date)
  const { professionals } = useProfessionals()

  if (loading) {
    return <div style={{ padding: 24 }}>Carregando...</div>
  }

  return (
    <div style={{ padding: 24 }}>
      <AgendaBoard
        bookings={bookings}
        professionals={professionals}
      />
    </div>
  )
}