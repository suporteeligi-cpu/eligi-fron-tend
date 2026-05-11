'use client'
// src/features/agenda/components/AgendaBoard.tsx

import { useEffect, useState } from 'react'
import AgendaToolbar      from './AgendaToolbar'
import AgendaGrid         from './AgendaGrid'
import AgendaMobileList   from './AgendaMobileList'
import SideCheckoutPanel  from '@/features/booking/components/SideCheckoutPanel'
import { useAgendaStore } from '../hooks/useAgendaStore'
import { useAgendaSocket } from '../hooks/useAgendaSocket'
import { AgendaProfessional, AgendaBooking } from '../types'
import { colors } from '@/shared/theme'

interface Props {
  professionals: AgendaProfessional[]
  businessId:    string
  externalDate?: Date
  onDateChange?: (date: Date) => void
  // Callbacks removidos — o store é a única fonte da verdade
}

export default function AgendaBoard({ professionals, businessId, externalDate, onDateChange }: Props) {
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

  // Sincroniza data externa → store
  useEffect(() => {
    if (externalDate) setSelectedDate(externalDate)
  }, [externalDate, setSelectedDate])

  // Notifica parent quando a data muda internamente
  useEffect(() => {
    onDateChange?.(selectedDate)
  }, [selectedDate, onDateChange])

  // Detecta mobile
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  // Socket: store como fonte da verdade — sem callbacks externos para evitar double-insert
  useAgendaSocket({
    businessId,
    onCreate: addBooking,
    onUpdate: updateBooking,
    onCancel: removeBooking,
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

      {/*
        Key removido do SideCheckoutPanel para evitar re-mount desnecessário.
        O estado interno do panel é controlado por `checkout.open`.
      */}
      <SideCheckoutPanel
        open={checkout.open}
        mode={checkout.mode}
        time={checkout.time}
        professionalId={checkout.professionalId}
        booking={checkout.booking}
        professionals={professionals}
        selectedDate={selectedDate}
        onClose={closeCheckout}
      />
    </>
  )
}