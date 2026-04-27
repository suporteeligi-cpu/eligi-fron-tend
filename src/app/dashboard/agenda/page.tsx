'use client'

import { useState, useCallback } from 'react'
import dayjs from 'dayjs'

import AgendaBoard, { Booking } from '@/app/components/agenda/AgendaBoard'
import { useAgenda } from '@/hooks/useAgenda'
import { AgendaDay } from '@/types/agenda'

type BookingStatus = 'CONFIRMED' | 'COMPLETED' | 'CANCELED'

interface RawBooking {
  id: string
  date: string
  time: string
  professionalId: string
  clientName: string
  status?: BookingStatus | string
  duration?: number
  service?: {
    name?: string
    duration?: number
  }
}

type ApiBooking = AgendaDay['bookings'][number]

export default function AgendaPage() {
  const [date, setDate] = useState(new Date())

  const {
    data,
    loading,
    addBooking,
    updateBooking,
    removeBooking
  } = useAgenda(dayjs(date).format('YYYY-MM-DD'))

  /* =========================================
     ADAPTER: API → Board (legado → novo)
  ========================================= */

  function adaptBooking(b: RawBooking): Booking {
    const start = dayjs(`${b.date} ${b.time}`)
    const duration = b.service?.duration || b.duration || 30
    const end = start.add(duration, 'minute')

    const validStatuses: BookingStatus[] = ['CONFIRMED', 'COMPLETED', 'CANCELED']
    const status: BookingStatus = validStatuses.includes(b.status as BookingStatus)
      ? (b.status as BookingStatus)
      : 'CONFIRMED'

    return {
      id: b.id,
      professionalId: b.professionalId,
      clientName: b.clientName,
      start: start.format('HH:mm'),
      end: end.format('HH:mm'),
      serviceName: b.service?.name || 'Serviço',
      status
    }
  }

  /* =========================================
     ADAPTER: Board → API (novo → legado)
  ========================================= */

  const handleAddBooking = useCallback((booking: Booking) => {
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
  }, [addBooking, date])

  const handleUpdateBooking = useCallback((booking: Booking) => {
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
  }, [updateBooking, date])

  if (loading || !data) return null

  return (
    <div style={{ padding: 20 }}>
      <AgendaBoard
        professionals={data.professionals}
        bookings={data.bookings.map(b => adaptBooking(b as RawBooking))}
        selectedDate={date}
        onDateChange={setDate}
        businessId={data.businessId}
        addBooking={handleAddBooking}
        updateBooking={handleUpdateBooking}
        removeBooking={removeBooking}
      />
    </div>
  )
}