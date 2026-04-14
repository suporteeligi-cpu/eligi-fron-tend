'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import AgendaToolbar from './AgendaToolbar'
import AgendaGrid from './AgendaGrid'
import dayjs from 'dayjs'
import { AgendaBooking, BookingStatus } from '@/types/agenda'
import CreateBookingModal from './CreateBookingModal'

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
    id: string
    name: string
    color?: string
    duration?: number
  }
  status?: string
}

interface AgendaBoardProps {
  professionals: Professional[]
  bookings: Booking[]
  selectedDate: Date
  onDateChange: (date: Date) => void
  onCreateBooking: (params: {
    time: string
    professionalId: string
  }) => void
}

function normalizeStatus(status?: string): BookingStatus {
  if (status === 'CONFIRMED') return 'CONFIRMED'
  if (status === 'COMPLETED') return 'COMPLETED'
  if (status === 'CANCELED') return 'CANCELED'
  return 'CONFIRMED'
}

export default function AgendaBoard({
  professionals,
  bookings,
  selectedDate,
  onDateChange,
  onCreateBooking
}: AgendaBoardProps) {
  const nowLineRef = useRef<HTMLDivElement | null>(null)

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

  useEffect(() => {
    const el = document.getElementById('agenda-scroll')
    if (!el) return

    const hour = dayjs().hour()
    el.scrollTo({
      top: hour * 64,
      behavior: 'smooth'
    })
  }, [])

  function handleCreateBooking(time: string, professionalId: string) {
    console.log('HANDLE', time, professionalId)

    setSelectedTime(time)
    setSelectedProfessional(professionalId)
    setModalOpen(true)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <AgendaToolbar
        selectedDate={selectedDate}
        onDateChange={onDateChange}
      />

      <div
        id="agenda-scroll"
        style={{
          flex: 1,
          overflow: 'auto',
          position: 'relative'
        }}
      >
        <AgendaGrid
          professionals={professionals}
          bookings={formattedBookings}
          onCreateBooking={handleCreateBooking}
        />

        {/* 🔥 LINHA DO AGORA (CORRIGIDA) */}
        <div
          ref={nowLineRef}
          style={{
            position: 'absolute',
            top: `${dayjs().hour() * 64}px`,
            left: 0,
            right: 0,
            height: '2px',
            background: '#dc2626',
            opacity: 0.6,
            pointerEvents: 'none',
            zIndex: 0
          }}
        />
      </div>

      <CreateBookingModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        time={selectedTime}
        professionalId={selectedProfessional}
      />
    </div>
  )
}