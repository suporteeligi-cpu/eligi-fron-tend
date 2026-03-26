'use client'

import AgendaColumn from './AgendaColumn'
import { AgendaProfessional, AgendaBooking } from '@/types/agenda'

interface Props {
  professionals: AgendaProfessional[]
  bookings: AgendaBooking[]
}

export default function AgendaGrid({ professionals, bookings }: Props) {
  const START = 8
  const END = 20

  const hours = []
  for (let i = START; i <= END; i++) {
    hours.push(`${String(i).padStart(2, '0')}:00`)
  }

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: `80px repeat(${professionals.length}, 1fr)`,
        border: '1px solid #e5e7eb',
        borderRadius: 16,
        overflow: 'hidden',
        background: '#fff'
      }}
    >
      <div style={{ background: '#fafafa' }}>
        {hours.map(h => (
          <div key={h} style={{ height: 60, borderBottom: '1px solid #eee', fontSize: 12, padding: 6 }}>
            {h}
          </div>
        ))}
      </div>

      {professionals.map(p => (
        <AgendaColumn
          key={p.id}
          professional={p}
          bookings={bookings.filter(b => b.professionalId === p.id)}
        />
      ))}
    </div>
  )
}