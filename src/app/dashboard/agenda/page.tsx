'use client'

import { useState } from 'react'
import AgendaBoard from '@/app/components/dashboard/AgendaBoard'
import AgendaToolbar from '@/app/components/dashboard/AgendaToolbar'
import { useBookings } from '@/hooks/useBookings'
import { useProfessionals } from '@/hooks/useProfessionals'

export default function AgendaPage() {
  const today = new Date().toISOString().slice(0, 10)

  const [date, setDate] = useState(today)

  const { bookings, loading: bookingsLoading } =
    useBookings(date)

  const {
    professionals,
    loading: professionalsLoading
  } = useProfessionals()

  if (bookingsLoading || professionalsLoading) {
    return (
      <div style={{ padding: 24 }}>
        Carregando agenda...
      </div>
    )
  }

  return (
    <div style={{ padding: 24 }}>
      <AgendaToolbar
        date={date}
        setDate={setDate}
      />

      <AgendaBoard
        bookings={bookings}
        professionals={professionals}
      />
    </div>
  )
}