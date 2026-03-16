'use client'

import { useState } from 'react'
import { useBookings } from '@/hooks/useBookings'
import { useProfessionals } from '@/hooks/useProfessionals'
import AgendaGrid from '@/app/components/dashboard/AgendaGrid'
import AgendaToolbar from '@/app/components/dashboard/AgendaToolbar'

export default function AgendaPage() {
  const today = new Date()
    .toISOString()
    .slice(0, 10)

  const [date, setDate] = useState(today)

  const { bookings, loading } = useBookings(date)
  const professionals = useProfessionals()

  function openCreateBookingModal(time: string) {
    console.log('Novo agendamento:', time)
  }

  return (
    <div style={{ padding: 24 }}>
      <h1 style={{ marginBottom: 20 }}>
        Agenda
      </h1>

      <AgendaToolbar date={date} setDate={setDate} />

      {loading && <div>Carregando...</div>}

      {!loading && (
        <AgendaGrid
          bookings={bookings}
          professionals={professionals}
          openCreateBookingModal={
            openCreateBookingModal
          }
        />
      )}
    </div>
  )
}