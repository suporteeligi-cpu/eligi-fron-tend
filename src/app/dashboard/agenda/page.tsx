'use client'

import { useEffect, useRef, useCallback } from 'react'
import dayjs from 'dayjs'
import 'dayjs/locale/pt-br'
import { useAgenda }      from '@/hooks/useAgenda'
import { AgendaDay }      from '@/types/agenda'
import { useAgendaStore } from '@/features/agenda/hooks/useAgendaStore'
import AgendaBoard        from '@/features/agenda/components/AgendaBoard'
import { AgendaBooking }  from '@/features/agenda/types'

dayjs.locale('pt-br')

type ApiBooking = AgendaDay['bookings'][number]

function adaptBooking(b: ApiBooking): AgendaBooking {
  const start    = b.time || '08:00'
  const duration = b.service?.duration ?? b.duration ?? 30
  const end      = dayjs(`2000-01-01 ${start}`).add(duration, 'minute').format('HH:mm')
  const validStatuses = ['CONFIRMED', 'COMPLETED', 'CANCELED'] as const
  type BS = typeof validStatuses[number]
  const status: BS = validStatuses.includes(b.status as BS) ? (b.status as BS) : 'CONFIRMED'
  return { id: b.id, professionalId: b.professionalId, clientName: b.clientName, serviceName: b.service?.name || 'Serviço', start, end, status }
}

function AgendaSpinner() {
  return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', minHeight:'calc(100dvh - 160px)', gap:14 }}>
      <style>{`@keyframes eligi-spin { to { transform: rotate(360deg) } }`}</style>
      <div style={{ width:36, height:36, borderRadius:'50%', border:'3px solid rgba(220,38,38,0.15)', borderTopColor:'#dc2626', animation:'eligi-spin 0.8s linear infinite' }} />
      <span style={{ fontSize:13, color:'#6b7280' }}>Carregando agenda...</span>
    </div>
  )
}

export default function AgendaPage() {
  const { selectedDate, setSelectedDate, addBooking, updateBooking, removeBooking, setBookings } = useAgendaStore()
  const dateStr = dayjs(selectedDate).format('YYYY-MM-DD')
  const { data, loading } = useAgenda(dateStr)
  const lastSyncedDate = useRef<string>('')

  useEffect(() => {
    if (!data?.bookings) return
    const adapted = data.bookings.map(adaptBooking)
    if (lastSyncedDate.current !== dateStr) {
      lastSyncedDate.current = dateStr
      setBookings(adapted)
      return
    }
    adapted.forEach(b => updateBooking(b))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data?.bookings, dateStr])

  const handleAdd    = useCallback((b: AgendaBooking) => addBooking(b),    [addBooking])
  const handleUpdate = useCallback((b: AgendaBooking) => updateBooking(b), [updateBooking])
  const handleRemove = useCallback((id: string)       => removeBooking(id), [removeBooking])

  if (loading || !data) return <AgendaSpinner />

  return (
    <AgendaBoard
      professionals={data.professionals}
      businessId={data.businessId ?? ''}
      externalDate={selectedDate}
      onDateChange={setSelectedDate}
      onExternalAdd={handleAdd}
      onExternalUpdate={handleUpdate}
      onExternalRemove={handleRemove}
    />
  )
}