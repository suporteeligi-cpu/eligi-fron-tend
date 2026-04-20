'use client'

import { useMemo } from 'react'
import dayjs from 'dayjs'

import AgendaToolbar from './AgendaToolbar'
import AgendaGrid from './AgendaGrid'
import SideCheckoutPanel from './SideCheckoutPanel'

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
  onDateChange
}: {
  professionals: Professional[]
  bookings: Booking[]
  selectedDate: Date
  onDateChange: (date: Date) => void
}) {
  /* =========================================
     CHECKOUT PANEL (🔥 NOVO CONTROLE GLOBAL)
  ========================================= */

  const checkout = useCheckoutPanel()

  /* =========================================
     FILTER BOOKINGS BY DAY
  ========================================= */

  const dayBookings = useMemo(() => {
    const selected = dayjs(selectedDate).format('YYYY-MM-DD')
    return bookings.filter((b) => b.date === selected)
  }, [bookings, selectedDate])

  /* =========================================
     FORMAT BOOKINGS (AGENDA GRID)
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

        // 🔥 PADRÃO AGENDA (STRING HH:mm)
        start: dayjs(startDate).format('HH:mm'),
        end: dayjs(endDate).format('HH:mm')
      }
    })
  }, [dayBookings])

  /* =========================================
     HANDLERS
  ========================================= */

  function handleCreateBooking(time: string, professionalId: string) {
    checkout.openCreate(time, professionalId)
  }

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

      {/* =========================================
         SIDE CHECKOUT PANEL (🔥 CORE UX)
      ========================================= */}

      <SideCheckoutPanel
        open={checkout.open}
        mode={checkout.mode}
        time={checkout.time}
        professionalId={checkout.professionalId}
        onClose={checkout.close}
      />
    </>
  )
}