'use client'

import { AgendaBooking } from '@/types/agenda'

interface Props {
  booking: AgendaBooking
}

/* =========================================
   HELPERS
========================================= */

function getColor(status: AgendaBooking['status']) {
  switch (status) {
    case 'CONFIRMED':
      return '#2563eb'
    case 'COMPLETED':
      return '#16a34a'
    case 'CANCELED':
      return '#dc2626'
    default:
      return '#6b7280'
  }
}

/* =========================================
   COMPONENT
========================================= */

export default function BookingCard({ booking }: Props) {
  const color = getColor(booking.status)

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        borderRadius: 12,
        padding: 10,
        background: color,
        color: '#fff',
        fontSize: 12,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        boxShadow: '0 6px 16px rgba(0,0,0,0.12)',
        cursor: 'pointer',
        transition: 'all 0.15s ease',
        overflow: 'hidden'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'scale(1.02)'
        e.currentTarget.style.boxShadow = '0 10px 24px rgba(0,0,0,0.18)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'scale(1)'
        e.currentTarget.style.boxShadow = '0 6px 16px rgba(0,0,0,0.12)'
      }}
    >
      {/* TOP */}
      <div>
        <div
          style={{
            fontWeight: 600,
            fontSize: 13,
            lineHeight: 1.2,
            marginBottom: 2,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis'
          }}
        >
          {booking.clientName}
        </div>

        <div
          style={{
            fontSize: 11,
            opacity: 0.9,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis'
          }}
        >
          {booking.serviceName}
        </div>
      </div>

      {/* BOTTOM */}
      <div
        style={{
          fontSize: 11,
          opacity: 0.85
        }}
      >
        {booking.start} - {booking.end}
      </div>
    </div>
  )
}