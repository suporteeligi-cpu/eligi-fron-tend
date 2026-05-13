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

  useAgendaSocket({
    businessId,
    onCreate: (b) => addBooking(dateStr, b),
    onUpdate: (b) => updateBooking(dateStr, b),
    onCancel: (id) => removeBooking(dateStr, id),
  })

  return (
    <>
      {/*
        display:flex + flexDirection:column + height:100% garante que
        AgendaToolbar ocupa o que precisa e AgendaGrid pega o resto.
        overflow:hidden aqui seria fatal — removido.
      */}
      <div style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        background: colors.background.page,
        fontFamily: '-apple-system, "SF Pro Display", system-ui, sans-serif',
      }}>
        {/* Toolbar: altura natural (sticky internamente) */}
        <AgendaToolbar />

        {/*
          flex:1 + minHeight:0 é o par correto para scroll interno funcionar.
          minHeight:0 sobrescreve o default flex (auto) que impediria o encolhimento.
          overflow:hidden REMOVIDO — o scroll deve estar no AgendaGrid/AgendaMobileList.
        */}
        <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
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