'use client'

import AgendaGrid from './AgendaGrid'
import AgendaToolbar from './AgendaToolbar'
import { useState } from 'react'
import { useAgenda } from '@/hooks/useAgenda'

export default function AgendaBoard() {
  const [date, setDate] = useState(
    new Date().toISOString().split('T')[0]
  )

  const { data, loading } = useAgenda(date)

  if (loading) {
    return <div style={{ padding: 20 }}>Carregando agenda...</div>
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <AgendaToolbar date={date} setDate={setDate} />

      {data && (
        <AgendaGrid
          professionals={data.professionals}
          bookings={data.bookings}
        />
      )}
    </div>
  )
}