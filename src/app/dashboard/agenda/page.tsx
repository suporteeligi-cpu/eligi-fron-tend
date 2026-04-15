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
        const [professionalsRes, bookingsRes] = await Promise.all([
          api.get('/professionals'),
          api.get('/bookings')
        ])

        setProfessionals(professionalsRes.data)
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