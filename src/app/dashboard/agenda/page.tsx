'use client'
// src/app/(dashboard)/agenda/page.tsx

import { useEffect } from 'react'
import dayjs from 'dayjs'
import 'dayjs/locale/pt-br'
import { useAgenda }      from '@/hooks/useAgenda'
import { useAgendaStore } from '@/features/agenda/hooks/useAgendaStore'
import AgendaBoard        from '@/features/agenda/components/AgendaBoard'

dayjs.locale('pt-br')

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
  const { selectedDate, setSelectedDate, setBookingsForDate, getBookingsForDate } = useAgendaStore()
  const dateStr = dayjs(selectedDate).format('YYYY-MM-DD')

  // Bookings em cache para esta data (evita flash vazio enquanto fetch carrega)
  const cachedBookings = getBookingsForDate(dateStr)

  const { data, loading } = useAgenda(dateStr)

  useEffect(() => {
    if (!data?.bookings) return
    // Só substitui se o fetch trouxe dados diferentes dos que já estão em cache
    // (evita sobrescrever atualizações do socket)
    setBookingsForDate(dateStr, data.bookings)
  }, [data?.bookings, dateStr, setBookingsForDate])

  // Mostra spinner apenas no primeiro load (sem cache)
  if (loading && cachedBookings.length === 0 && !data) return <AgendaSpinner />

  return (
    <AgendaBoard
      professionals={data?.professionals ?? []}
      businessId={data?.businessId ?? ''}
      externalDate={selectedDate}
      onDateChange={setSelectedDate}
    />
  )
}