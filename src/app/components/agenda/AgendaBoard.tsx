'use client'

import { useMemo, useCallback } from 'react'

import AgendaToolbar from './AgendaToolbar'
import AgendaGrid from './AgendaGrid'
import SideCheckoutPanel from './SideCheckoutPanel'

import { useAgendaSocket } from '@/hooks/useAgendaSocket'
import { useCheckoutPanel } from '@/hooks/useCheckoutPanel'

import { AgendaBooking, BookingStatus } from '@/types/agenda'

/* =========================================
   TYPES (🔥 NOVO PADRÃO)
========================================= */

export interface Professional {
  id: string
  name: string
}

export interface Booking {
  id: string
  professionalId: string
  clientName: string

  start: string // "HH:mm"
  end: string   // "HH:mm"

  serviceName: string

  status: 'CONFIRMED' | 'COMPLETED' | 'CANCELED'
}

interface Props {
  professionals: Professional[]
  bookings: Booking[]
  selectedDate: Date
  onDateChange: (date: Date) => void

  businessId: string

  addBooking: (booking: Booking) => void
  updateBooking: (booking: Booking) => void
  removeBooking: (id: string) => void
}

/* =========================================
   HELPERS
========================================= */

function normalizeStatus(status: BookingStatus): BookingStatus {
  return status
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
     SOCKET (🔥 SEM ADAPTER AGORA)
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
    // 🔥 agora não precisa mais de date — backend já controla o dia
    return bookings
  }, [bookings])

  /* =========================================
     FORMAT (🔥 MUITO MAIS SIMPLES)
  ========================================= */

  const formattedBookings: AgendaBooking[] = useMemo(() => {
    return dayBookings.map((b) => ({
      id: b.id,
      clientName: b.clientName,
      serviceName: b.serviceName,
      professionalId: b.professionalId,
      status: normalizeStatus(b.status),
      start: b.start,
      end: b.end
    }))
  }, [dayBookings])

  /* =========================================
     HANDLER
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
        key={`${checkout.time}-${checkout.professionalId}`}
        open={checkout.open}
        mode={checkout.mode}
        time={checkout.time}
        professionalId={checkout.professionalId}
        onClose={checkout.close}
      />
    </>
  )
}