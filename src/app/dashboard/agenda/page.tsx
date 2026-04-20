'use client'

import { useEffect, useState } from 'react'
import AgendaBoard from '@/app/components/agenda/AgendaBoard'
import api from '@/lib/apiClient'

export default function AgendaPage() {
  const [professionals, setProfessionals] = useState([])
  const [bookings, setBookings] = useState([])
  const [date, setDate] = useState(new Date())

  useEffect(() => {
    async function load() {
      try {
        const [professionalRes, bookingsRes] = await Promise.all([
          api.get('/equipe'),
          api.get('/bookings')
        ])

        setProfessionals(professionalRes.data)
        setBookings(bookingsRes.data)
      } catch (error) {
        console.error('Erro ao carregar agenda', error)
      }
    }

    load()
  }, [])

  return (
    <div style={{ padding: 20 }}>
      <AgendaBoard
        professionals={professionals}
        bookings={bookings}
        selectedDate={date}
        onDateChange={setDate}
      />
    </div>
  )
}