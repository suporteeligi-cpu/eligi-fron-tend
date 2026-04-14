'use client'

import AgendaColumn from './AgendaColumn'
import { AgendaProfessional, AgendaBooking } from '@/types/agenda'

/* =========================================
   CONFIG
========================================= */

const START = 8
const END = 20
const SLOT_HEIGHT = 64
const SLOT_INTERVAL = 30 // minutos

/* =========================================
   TYPES
========================================= */

interface Props {
  professionals: AgendaProfessional[]
  bookings: AgendaBooking[]
  onCreateBooking: (time: string, professionalId: string) => void
}

/* =========================================
   HELPERS
========================================= */

function generateTimeSlots() {
  const slots: string[] = []

  for (let h = START; h < END; h++) {
    for (let m = 0; m < 60; m += SLOT_INTERVAL) {
      const hour = String(h).padStart(2, '0')
      const min = String(m).padStart(2, '0')
      slots.push(`${hour}:${min}`)
    }
  }

  return slots
}

/* =========================================
   COMPONENT
========================================= */

export default function AgendaGrid({
  professionals,
  bookings,
  onCreateBooking
}: Props) {
  const slots = generateTimeSlots()

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: `80px repeat(${professionals.length}, 1fr)`,
        border: '1px solid #e5e7eb',
        borderRadius: 16,
        overflow: 'hidden',
        background: '#fff',
        position: 'relative'
      }}
    >
      {/* COLUNA HORÁRIOS */}
      <div
        style={{
          background: '#fafafa',
          borderRight: '1px solid #eee'
        }}
      >
        {slots.map((time, index) => (
          <div
            key={time}
            style={{
              height: SLOT_HEIGHT,
              borderBottom: '1px solid #f1f1f1',
              fontSize: 11,
              padding: '6px 8px',
              color: '#6b7280',
              display: 'flex',
              alignItems: 'flex-start'
            }}
          >
            {index % 2 === 0 ? time : ''}
          </div>
        ))}
      </div>

      {/* COLUNAS DOS PROFISSIONAIS */}
      {professionals.map((p) => (
        <AgendaColumn
          key={p.id}
          professional={p}
          bookings={bookings.filter((b) => b.professionalId === p.id)}
          slots={slots}
          slotHeight={SLOT_HEIGHT}
          onCreateBooking={onCreateBooking}
        />
      ))}
    </div>
  )
}