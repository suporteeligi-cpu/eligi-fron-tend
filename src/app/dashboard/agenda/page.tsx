'use client'

import { useEffect, useCallback } from 'react'
import dayjs from 'dayjs'
import 'dayjs/locale/pt-br'
import { useAgenda } from '@/hooks/useAgenda'
import { AgendaDay } from '@/types/agenda'
import { useAgendaStore } from '@/features/agenda/hooks/useAgendaStore'
import AgendaBoard from '@/features/agenda/components/AgendaBoard'
import { AgendaBooking } from '@/features/agenda/types'

dayjs.locale('pt-br')

type ApiBooking = AgendaDay['bookings'][number]

function adaptBooking(b: ApiBooking): AgendaBooking {
  const start    = b.time || '08:00'
  const duration = b.service?.duration || b.duration || 30
  const end      = dayjs(`2000-01-01 ${start}`).add(duration, 'minute').format('HH:mm')

  const validStatuses = ['CONFIRMED', 'COMPLETED', 'CANCELED'] as const
  type BS = typeof validStatuses[number]
  const status: BS = validStatuses.includes(b.status as BS)
    ? (b.status as BS)
    : 'CONFIRMED'

  return {
    id:             b.id,
    professionalId: b.professionalId,
    clientName:     b.clientName,
    serviceName:    b.service?.name || 'Serviço',
    start,
    end,
    status,
  }
}

export default function AgendaPage() {
  const {
    selectedDate,
    setSelectedDate,
    addBooking,
    updateBooking,
    removeBooking,
    bookings,
  } = useAgendaStore()

  const dateStr = dayjs(selectedDate).format('YYYY-MM-DD')
  const { data, loading } = useAgenda(dateStr)

  // Sincroniza bookings da API → store quando data muda ou dados chegam
  useEffect(() => {
    if (!data?.bookings) return
    data.bookings.forEach((b) => {
      const adapted = adaptBooking(b)
      const exists  = bookings.find((existing) => existing.id === adapted.id)
      if (exists) {
        updateBooking(adapted)
      } else {
        addBooking(adapted)
      }
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data?.bookings, dateStr])

  const handleAddBooking = useCallback(
    (b: AgendaBooking) => addBooking(b),
    [addBooking]
  )

  const handleUpdateBooking = useCallback(
    (b: AgendaBooking) => updateBooking(b),
    [updateBooking]
  )

  const handleRemoveBooking = useCallback(
    (id: string) => removeBooking(id),
    [removeBooking]
  )

  if (loading || !data) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        height: '100vh', background: '#f5f5f7',
      }}>
        <div style={{
          width: 40, height: 40, borderRadius: '50%',
          border: '3px solid rgba(0,0,0,0.08)',
          borderTopColor: '#dc2626',
          animation: 'spin 0.8s linear infinite',
        }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      </div>
    )
  }

  return (
    <AgendaBoard
      professionals={data.professionals}
      businessId={data.businessId ?? ''}
      externalDate={selectedDate}
      onDateChange={setSelectedDate}
      onExternalAdd={handleAddBooking}
      onExternalUpdate={handleUpdateBooking}
      onExternalRemove={handleRemoveBooking}
    />
  )
}
