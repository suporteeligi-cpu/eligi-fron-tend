'use client'

import { useState, useMemo } from 'react'
import dayjs from 'dayjs'
import AgendaToolbar from './AgendaToolbar'
import AgendaGrid from './AgendaGrid'
import CreateBookingModal from './CreateBookingModal'
import { AgendaBooking, BookingStatus } from '@/types/agenda'

export interface Professional {
  id: string
  name: string
}

export interface Booking {
  id: string
  date: string
  time: string
  duration: number
  clientName: string
  professionalId: string
  service?: {
    name: string
    duration?: number
  }
  status?: string
}

function normalizeStatus(status?: string): BookingStatus {
  if (status === 'COMPLETED') return 'COMPLETED'
  if (status === 'CANCELED') return 'CANCELED'
  return 'CONFIRMED'
}

export default function AgendaBoard({
  professionals,
  bookings,
  selectedDate,
  onDateChange
}: {
  professionals: Professional[]
  bookings: Booking[]
  selectedDate: Date
  onDateChange: (date: Date) => void
}) {
  const [modalOpen, setModalOpen] = useState(false)
  const [selectedTime, setSelectedTime] = useState<string | null>(null)
  const [selectedProfessional, setSelectedProfessional] = useState<string | null>(null)

  const dayBookings = useMemo(() => {
    const selected = dayjs(selectedDate).format('YYYY-MM-DD')
    return bookings.filter((b) => b.date === selected)
  }, [bookings, selectedDate])

  const formattedBookings: AgendaBooking[] = useMemo(() => {
    return dayBookings.map((b) => {
      const startDate = new Date(`${b.date}T${b.time}`)
      const duration = b.service?.duration || b.duration || 30
      const endDate = new Date(startDate.getTime() + duration * 60000)

      return {
        id: b.id,
        clientName: b.clientName,
        serviceName: b.service?.name || 'Serviço',
        professionalId: b.professionalId,
        status: normalizeStatus(b.status),
        start: dayjs(startDate).format('HH:mm'),
        end: dayjs(endDate).format('HH:mm')
      }
    })
  }, [dayBookings])

  function handleCreateBooking(time: string, professionalId: string) {
    setSelectedTime(time)
    setSelectedProfessional(professionalId)
    setModalOpen(true)
  }

  return (
    <>
      <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        <AgendaToolbar selectedDate={selectedDate} onDateChange={onDateChange} />

        <AgendaGrid
          professionals={professionals}
          bookings={formattedBookings}
          onCreateBooking={handleCreateBooking}
        />
      </div>

      <CreateBookingModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        time={selectedTime}
        professionalId={selectedProfessional}
      />
    </>
  )
}