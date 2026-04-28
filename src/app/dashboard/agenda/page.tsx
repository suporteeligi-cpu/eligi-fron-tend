'use client'

import { useState, useCallback } from 'react'
import dayjs from 'dayjs'
import 'dayjs/locale/pt-br'
import AgendaBoard from '@/app/components/agenda/AgendaBoard'
import { useAgenda } from '@/hooks/useAgenda'
import { AgendaDay } from '@/types/agenda'
import { Booking } from '@/app/components/agenda/AgendaBoard'

dayjs.locale('pt-br')

type ApiBooking = AgendaDay['bookings'][number]

function adaptBooking(b: ApiBooking): Booking {
  const start = b.time || '08:00'
  const duration = b.service?.duration || b.duration || 30
  const startDayjs = dayjs(`2000-01-01 ${start}`)
  const end = startDayjs.add(duration, 'minute').format('HH:mm')

  const validStatuses = ['CONFIRMED', 'COMPLETED', 'CANCELED'] as const
  type BS = typeof validStatuses[number]
  const status: BS = validStatuses.includes(b.status as BS)
    ? (b.status as BS)
    : 'CONFIRMED'

  return {
    id: b.id,
    professionalId: b.professionalId,
    clientName: b.clientName,
    start,
    end,
    serviceName: b.service?.name || 'Serviço',
    status
  }
}

export default function AgendaPage() {
  const [date, setDate] = useState(new Date())

  const { data, loading, addBooking, updateBooking, removeBooking } =
    useAgenda(dayjs(date).format('YYYY-MM-DD'))

  const handleAddBooking = useCallback(
    (booking: Booking) => {
      const apiBooking: ApiBooking = {
        id: booking.id,
        professionalId: booking.professionalId,
        clientName: booking.clientName,
        date: dayjs(date).format('YYYY-MM-DD'),
        time: booking.start,
        duration: dayjs(`2000-01-01 ${booking.end}`).diff(
          dayjs(`2000-01-01 ${booking.start}`),
          'minute'
        ),
        status: booking.status,
        service: { name: booking.serviceName }
      } as ApiBooking
      addBooking(apiBooking)
    },
    [addBooking, date]
  )

  const handleUpdateBooking = useCallback(
    (booking: Booking) => {
      const apiBooking: ApiBooking = {
        id: booking.id,
        professionalId: booking.professionalId,
        clientName: booking.clientName,
        date: dayjs(date).format('YYYY-MM-DD'),
        time: booking.start,
        duration: dayjs(`2000-01-01 ${booking.end}`).diff(
          dayjs(`2000-01-01 ${booking.start}`),
          'minute'
        ),
        status: booking.status,
        service: { name: booking.serviceName }
      } as ApiBooking
      updateBooking(apiBooking)
    },
    [updateBooking, date]
  )

  if (loading || !data) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        height: '100vh', background: 'var(--bg)'
      }}>
        <div style={{
          width: 40, height: 40, borderRadius: '50%',
          border: '3px solid var(--border-soft)',
          borderTopColor: 'var(--brand)',
          animation: 'spin 0.8s linear infinite'
        }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      </div>
    )
  }

  return (
    <AgendaBoard
      professionals={data.professionals}
      bookings={data.bookings.map(adaptBooking)}
      selectedDate={date}
      onDateChange={setDate}
      businessId={data.businessId ?? ''}
      addBooking={handleAddBooking}
      updateBooking={handleUpdateBooking}
      removeBooking={removeBooking}
    />
  )
}