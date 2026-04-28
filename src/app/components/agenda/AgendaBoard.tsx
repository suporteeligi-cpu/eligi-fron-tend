'use client'

import { useMemo, useCallback, useState, useEffect } from 'react'
import AgendaToolbar from './AgendaToolbar'
import AgendaGrid from './AgendaGrid'
import AgendaMobileList from './AgendaMobileList'
import SideCheckoutPanel from './SideCheckoutPanel'
import { useAgendaSocket } from '@/hooks/useAgendaSocket'
import { useCheckoutPanel } from '@/hooks/useCheckoutPanel'
import { AgendaBooking, BookingStatus } from '@/types/agenda'

export interface Professional {
  id: string
  name: string
}

export interface Booking {
  id: string
  professionalId: string
  clientName: string
  start: string
  end: string
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

function normalizeStatus(status: BookingStatus): BookingStatus {
  return status
}

export default function AgendaBoard({
  professionals, bookings, selectedDate, onDateChange,
  businessId, addBooking, updateBooking, removeBooking
}: Props) {
  const checkout = useCheckoutPanel()
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  useAgendaSocket({
    businessId,
    onCreate: addBooking,
    onUpdate: updateBooking,
    onCancel: removeBooking
  })

  const formattedBookings: AgendaBooking[] = useMemo(() =>
    bookings.map(b => ({
      id: b.id,
      clientName: b.clientName,
      serviceName: b.serviceName,
      professionalId: b.professionalId,
      status: normalizeStatus(b.status),
      start: b.start,
      end: b.end
    })),
    [bookings]
  )

  const handleCreateBooking = useCallback(
    (time: string, professionalId: string) => checkout.openCreate(time, professionalId),
    [checkout]
  )

  return (
    <>
      <div style={{
        height: '100%', display: 'flex', flexDirection: 'column',
        background: 'linear-gradient(135deg, #e8f0ff 0%, #f0e8ff 50%, #e8fff4 100%)',
        fontFamily: '-apple-system, "SF Pro Display", system-ui, sans-serif'
      }}>
        <AgendaToolbar
          selectedDate={selectedDate}
          onDateChange={onDateChange}
        />

        <div style={{ flex: 1, overflow: 'hidden' }}>
          {isMobile ? (
            <AgendaMobileList
              professionals={professionals}
              bookings={formattedBookings}
              onCreateBooking={handleCreateBooking}
            />
          ) : (
            <AgendaGrid
              professionals={professionals}
              bookings={formattedBookings}
              onCreateBooking={handleCreateBooking}
            />
          )}
        </div>
      </div>

      <SideCheckoutPanel
        key={`${checkout.time}-${checkout.professionalId}`}
        open={checkout.open}
        mode={checkout.mode}
        time={checkout.time}
        professionalId={checkout.professionalId}
        professionals={professionals}
        selectedDate={selectedDate}
        onClose={checkout.close}
      />
    </>
  )
}