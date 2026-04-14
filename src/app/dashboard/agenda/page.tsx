'use client'

import AgendaBoard from '@/app/components/agenda/AgendaBoard'

export default function AgendaPage() {
  return (
    <div style={{ padding: 20 }}>
      <AgendaBoard
        professionals={[]}
        bookings={[]}
        selectedDate={new Date()}
        onDateChange={() => {}}
      />
    </div>
  )
} 