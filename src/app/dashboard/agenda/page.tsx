'use client'
// src/app/(dashboard)/agenda/page.tsx

import { useEffect, useRef } from 'react'
import dayjs from 'dayjs'
import 'dayjs/locale/pt-br'
import { useAgenda }      from '@/hooks/useAgenda'
import { useAgendaStore } from '@/features/agenda/hooks/useAgendaStore'
import AgendaBoard        from '@/features/agenda/components/AgendaBoard'
import { AgendaBooking }  from '@/features/agenda/types'

dayjs.locale('pt-br')

// ─── Spinner ────────────────────────────────────────────────────────────────
function AgendaSpinner() {
  return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', minHeight:'calc(100dvh - 160px)', gap:14 }}>
      <style>{`@keyframes eligi-spin { to { transform: rotate(360deg) } }`}</style>
      <div style={{ width:36, height:36, borderRadius:'50%', border:'3px solid rgba(220,38,38,0.15)', borderTopColor:'#dc2626', animation:'eligi-spin 0.8s linear infinite' }} />
      <span style={{ fontSize:13, color:'#6b7280' }}>Carregando agenda...</span>
    </div>
  )
}

// ─── Page ───────────────────────────────────────────────────────────────────
export default function AgendaPage() {
  const { selectedDate, setSelectedDate, setBookings } = useAgendaStore()
  const dateStr = dayjs(selectedDate).format('YYYY-MM-DD')
  const { data, loading } = useAgenda(dateStr)

  // Ref para evitar re-sync quando o mesmo dateStr já foi carregado
  const lastSyncedDate = useRef<string>('')

  useEffect(() => {
    if (!data?.bookings) return
    // Só substitui a lista quando a data realmente mudou
    // O socket cuida das atualizações em tempo real
    if (lastSyncedDate.current === dateStr) return
    lastSyncedDate.current = dateStr
    setBookings(data.bookings as AgendaBooking[])
  }, [data?.bookings, dateStr, setBookings])

  if (loading || !data) return <AgendaSpinner />

  return (
    <AgendaBoard
      professionals={data.professionals}
      businessId={data.businessId ?? ''}
      externalDate={selectedDate}
      onDateChange={setSelectedDate}
    />
  )
}