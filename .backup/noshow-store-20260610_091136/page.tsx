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
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', flex: 1, gap:14 }}>
      <style>{`@keyframes eligi-spin { to { transform: rotate(360deg) } }`}</style>
      <div style={{ width:36, height:36, borderRadius:'50%', border:'3px solid rgba(220,38,38,0.15)', borderTopColor:'#dc2626', animation:'eligi-spin 0.8s linear infinite' }} />
      <span style={{ fontSize:13, color:'#6b7280' }}>Carregando agenda...</span>
    </div>
  )
}

export default function AgendaPage() {
  const { selectedDate, setSelectedDate, setBookingsForDate, getBookingsForDate } = useAgendaStore()
  const dateStr        = dayjs(selectedDate).format('YYYY-MM-DD')
  const cachedBookings = getBookingsForDate(dateStr)
  const { data, loading } = useAgenda(dateStr)

  useEffect(() => {
    if (!data?.bookings) return
    setBookingsForDate(dateStr, data.bookings)
  }, [data?.bookings, dateStr, setBookingsForDate])

  return (
    /*
     * position: fixed ancorado no viewport.
     * top/left compensam navbar (104px) e sidebar (64px colapso / 240px expandida).
     * Independe de zoom, padding do <main> ou herança de altura.
     */
    <div style={{
      position: 'fixed',
      top: 104,
      left: 'var(--sidebar-width, 64px)',
      right: 0,
      bottom: 0,
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
      zIndex: 1,
      backgroundColor: '#f5f5f7',
    }}>
      {loading && cachedBookings.length === 0 && !data
        ? <AgendaSpinner />
        : (
          <AgendaBoard
            professionals={data?.professionals ?? []}
            businessId={data?.businessId ?? ''}
            externalDate={selectedDate}
            onDateChange={setSelectedDate}
          />
        )
      }
    </div>
  )
}