'use client'

import { useState } from 'react'
import dayjs from 'dayjs'

import AgendaBoard from '@/app/components/agenda/AgendaBoard'
import { useAgenda } from '@/hooks/useAgenda'

export default function AgendaPage() {
  const [date, setDate] = useState(new Date())

  const {
    data,
    loading,
    addBooking,
    updateBooking,
    removeBooking: removeBookingFromHook
  } = useAgenda(dayjs(date).format('YYYY-MM-DD'))

  // 🔥 ADAPTADOR CORRETO
  function removeBooking(id: string) {
    const booking = data?.bookings.find(b => b.id === id)

    if (!booking) return

    removeBookingFromHook(booking)
  }

  if (loading || !data) return null

  return (
    <div style={{ padding: 20 }}>
      <AgendaBoard
        professionals={data.professionals}
        bookings={data.bookings}
        selectedDate={date}
        onDateChange={setDate}
        businessId={data.businessId}
        addBooking={addBooking}
        updateBooking={updateBooking}
        removeBooking={removeBooking}
      />
    </div>
  )
}