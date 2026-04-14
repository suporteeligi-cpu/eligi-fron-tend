'use client'

import BookingCard from './BookingCard'
import { AgendaProfessional, AgendaBooking } from '@/types/agenda'

/* =========================================
   TYPES
========================================= */

interface Props {
  professional: AgendaProfessional
  bookings: AgendaBooking[]
  slots: string[]
  slotHeight: number
  onCreateBooking: (time: string, professionalId: string) => void
}

/* =========================================
   HELPERS
========================================= */

function timeToMinutes(time: string) {
  const [h, m] = time.split(':').map(Number)
  return h * 60 + m
}

/* =========================================
   COMPONENT
========================================= */

export default function AgendaColumn({
  professional,
  bookings,
  slots,
  slotHeight,
  onCreateBooking
}: Props) {
  const START_MINUTES = 8 * 60

  return (
    <div
      style={{
        position: 'relative',
        borderLeft: '1px solid #eee',
        minHeight: slots.length * slotHeight,
        background: '#fff',
        zIndex: 1 // 🔥 garante camada base
      }}
    >
      {/* HEADER PROFISSIONAL */}
      <div
        style={{
          position: 'sticky',
          top: 0,
          height: 50,
          background: '#fff',
          borderBottom: '1px solid #eee',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontWeight: 600,
          zIndex: 20
        }}
      >
        {professional.name}
      </div>

      {/* GRID DE SLOTS */}
      <div
        style={{
          position: 'relative',
          zIndex: 1 // 🔥 importante
        }}
      >
        {slots.map((time) => (
          <div
            key={time}
            onClick={() => {
              console.log('CLICK SLOT', time, professional.id)
              onCreateBooking(time, professional.id)
            }}
            style={{
              height: slotHeight,
              borderBottom: '1px solid #f1f1f1',
              cursor: 'pointer',
              transition: 'background 0.15s ease',
              pointerEvents: 'auto' // 🔥 garante clique
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#f9fafb'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent'
            }}
          />
        ))}

        {/* BOOKINGS */}
        {bookings.map((b) => {
          const start = timeToMinutes(b.start)

          const top =
            ((start - START_MINUTES) / 30) * slotHeight

          const height =
            ((timeToMinutes(b.end) - timeToMinutes(b.start)) / 30) *
            slotHeight

          return (
            <div
              key={b.id}
              style={{
                position: 'absolute',
                top,
                left: 6,
                right: 6,
                height,
                zIndex: 5,
                pointerEvents: 'none' // 🔥 ESSENCIAL (não bloquear clique)
              }}
            >
              <div style={{ pointerEvents: 'auto' }}>
                <BookingCard booking={b} />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}