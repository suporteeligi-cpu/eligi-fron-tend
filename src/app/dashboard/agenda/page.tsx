'use client'

import { useState } from 'react'
import dayjs from 'dayjs'

import AgendaBoard from '@/app/components/agenda/AgendaBoard'
import { useAgenda } from '@/hooks/useAgenda'

export default function AgendaPage() {
  /* =========================================
     STATE
  ========================================= */

  const [date, setDate] = useState<Date>(new Date())

  /* =========================================
     HOOK
  ========================================= */

  const {
    data,
    loading,
    refetch
  } = useAgenda(dayjs(date).format('YYYY-MM-DD'))

  /* =========================================
     SAFE RENDER
  ========================================= */

  if (loading || !data) {
    return (
      <div
        style={{
          padding: 40,
          textAlign: 'center',
          opacity: 0.6
        }}
      >
        Carregando agenda...
      </div>
    )
  }

  /* =========================================
     RENDER
  ========================================= */

  return (
    <div style={{ padding: 20 }}>
      <AgendaBoard
        professionals={data.professionals}
        bookings={data.bookings}
        selectedDate={date}
        onDateChange={setDate}
        businessId={data.businessId} // 🔥 OBRIGATÓRIO
        refetch={refetch} // 🔥 OBRIGATÓRIO
      />
    </div>
  )
}