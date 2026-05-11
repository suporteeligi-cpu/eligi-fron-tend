'use client'
// src/features/agenda/components/AgendaBoard.tsx

import { useEffect, useState } from 'react'
import dayjs from 'dayjs'
import AgendaToolbar     from './AgendaToolbar'
import AgendaGrid        from './AgendaGrid'
import AgendaMobileList  from './AgendaMobileList'
import SideCheckoutPanel from '@/features/booking/components/SideCheckoutPanel'
import { useAgendaStore }  from '../hooks/useAgendaStore'
import { useAgendaSocket } from '../hooks/useAgendaSocket'
import { AgendaProfessional } from '../types'
import { colors } from '@/shared/theme'

interface Props {
  professionals: AgendaProfessional[]
  businessId:    string
  externalDate?: Date
  onDateChange?: (date: Date) => void
}

export default function AgendaBoard({ professionals, businessId, externalDate, onDateChange }: Props) {
  const {
    selectedDate,
    setSelectedDate,
    getBookingsForDate,
    addBooking,
    updateBooking,
    removeBooking,
    checkout,
    closeCheckout,
  } = useAgendaStore()

  const [isMobile, setIsMobile] = useState(false)

  const dateStr  = dayjs(selectedDate).format('YYYY-MM-DD')
  const bookings = getBookingsForDate(dateStr)

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

  // Socket — filtra bookings pelo dateStr do booking
  // O socket não garante que o evento é do dia exibido,
  // então usamos o campo `start` (que é HH:mm) — não tem data.
  // A solução: o backend deve emitir `date` junto com o booking.
  // Enquanto isso, inserimos apenas no dia selecionado (comportamento conservador).
  useAgendaSocket({
    businessId,
    onCreate:  (b) => addBooking(dateStr, b),
    onUpdate:  (b) => updateBooking(dateStr, b),
    onCancel:  (id) => removeBooking(dateStr, id),
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