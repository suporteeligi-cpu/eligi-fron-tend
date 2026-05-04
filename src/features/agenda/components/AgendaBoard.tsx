'use client'

import { useEffect, useState } from 'react'
import AgendaToolbar from './AgendaToolbar'
import AgendaGrid from './AgendaGrid'
import AgendaMobileList from './AgendaMobileList'
import SideCheckoutPanel from '@/features/booking/components/SideCheckoutPanel'
import { useAgendaStore } from '../hooks/useAgendaStore'
import { useAgendaSocket } from '../hooks/useAgendaSocket'
import { AgendaProfessional, AgendaBooking } from '../types'
import { colors } from '@/shared/theme'

interface Props {
  professionals: AgendaProfessional[]
  businessId: string
  externalDate?: Date
  onDateChange?: (date: Date) => void
  onExternalAdd?: (booking: AgendaBooking) => void
  onExternalUpdate?: (booking: AgendaBooking) => void
  onExternalRemove?: (id: string) => void
}

export default function AgendaBoard({
  professionals,
  businessId,
  externalDate,
  onDateChange,
  onExternalAdd,
  onExternalUpdate,
  onExternalRemove,
}: Props) {
  const {
    bookings,
    addBooking,
    updateBooking,
    removeBooking,
    checkout,
    closeCheckout,
    selectedDate,
    setSelectedDate,
  } = useAgendaStore()

  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    if (externalDate) setSelectedDate(externalDate)
  }, [externalDate, setSelectedDate])

  useEffect(() => {
    onDateChange?.(selectedDate)
  }, [selectedDate, onDateChange])

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  function handleAdd(booking: AgendaBooking) {
    addBooking(booking)
    onExternalAdd?.(booking)
  }
  function handleUpdate(booking: AgendaBooking) {
    updateBooking(booking)
    onExternalUpdate?.(booking)
  }
  function handleRemove(id: string) {
    removeBooking(id)
    onExternalRemove?.(id)
  }

  useAgendaSocket({
    businessId,
    onCreate: handleAdd,
    onUpdate: handleUpdate,
    onCancel: handleRemove,
  })

  return (
    <>
      <div style={{
        height: '100%', display: 'flex', flexDirection: 'column',
        background: colors.background.page,
        fontFamily: '-apple-system, "SF Pro Display", system-ui, sans-serif',
      }}>
        <AgendaToolbar />
        <div style={{ flex: 1, overflow: 'hidden' }}>
          {isMobile ? (
            <AgendaMobileList professionals={professionals} bookings={bookings} />
          ) : (
            <AgendaGrid professionals={professionals} bookings={bookings} />
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
        onClose={closeCheckout}
      />
    </>
  )
}
