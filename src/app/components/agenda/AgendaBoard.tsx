'use client'

import { useMemo, useCallback } from 'react'
import dayjs from 'dayjs'

import AgendaToolbar from './AgendaToolbar'
import AgendaGrid from './AgendaGrid'
import SideCheckoutPanel from './SideCheckoutPanel'

import { useAgendaSocket } from '@/hooks/useAgendaSocket'
import { useCheckoutPanel } from '@/hooks/useCheckoutPanel'

import { AgendaBooking, BookingStatus } from '@/types/agenda'

/* =========================================
   TYPES
========================================= */

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

interface Props {
  professionals: Professional[]
  bookings: Booking[]
  selectedDate: Date
  onDateChange: (date: Date) => void

  businessId: string

  addBooking: (booking: Booking) => void
  updateBooking: (booking: Booking) => void
  removeBooking: (booking: Booking) => void
}

/* =========================================
   HELPERS
========================================= */

function normalizeStatus(status?: string): BookingStatus {
  if (status === 'COMPLETED') return 'COMPLETED'
  if (status === 'CANCELED') return 'CANCELED'
  return 'CONFIRMED'
}

/* =========================================
   COMPONENT
========================================= */

export default function AgendaBoard({
  professionals,
  bookings,
  selectedDate,
  onDateChange,
  businessId,
  addBooking,
  updateBooking,
  removeBooking
}: Props) {
  const checkout = useCheckoutPanel()

  /* =========================================
     SOCKET
  ========================================= */

  useAgendaSocket({
    businessId,
    onCreate: addBooking,
    onUpdate: updateBooking,
    onCancel: removeBooking
  })

  /* =========================================
     FILTER
  ========================================= */

  const dayBookings = useMemo(() => {
    const selected = dayjs(selectedDate).format('YYYY-MM-DD')
    return bookings.filter((b) => b.date === selected)
  }, [bookings, selectedDate])

  /* =========================================
     FORMAT
  ========================================= */

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

  /* =========================================
     HANDLER (🔥 ESTÁVEL)
  ========================================= */

  const handleCreateBooking = useCallback(
    (time: string, professionalId: string) => {
      checkout.openCreate(time, professionalId)
    },
    [checkout]
  )

  /* =========================================
     RENDER
  ========================================= */

  return (
    <>
      <div
        style={{
          height: '100%',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        <AgendaToolbar
          selectedDate={selectedDate}
          onDateChange={onDateChange}
        />

        <AgendaGrid
          professionals={professionals}
          bookings={formattedBookings}
          onCreateBooking={handleCreateBooking}
        />
      </div>

      <SideCheckoutPanel
        key={`${checkout.time}-${checkout.professionalId}`} // 🔥 RESET LIMPO
        open={checkout.open}
        mode={checkout.mode}
        time={checkout.time}
        professionalId={checkout.professionalId}
        onClose={checkout.close}
      />
    </>
  )
}