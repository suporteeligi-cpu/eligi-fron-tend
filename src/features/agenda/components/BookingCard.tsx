'use client'

import { AgendaBooking } from '@/features/agenda/types'

const STATUS = {
  CONFIRMED: {
    gradient: 'linear-gradient(135deg, #dc2626, #b91c1c)',
    bg: 'rgba(220,38,38,0.05)',
    border: 'rgba(220,38,38,0.18)',
    text: '#991b1b',
    glow: 'rgba(220,38,38,0.15)',
  },
  COMPLETED: {
    gradient: 'linear-gradient(135deg, #475569, #334155)',
    bg: 'rgba(71,85,105,0.05)',
    border: 'rgba(71,85,105,0.15)',
    text: '#334155',
    glow: 'rgba(71,85,105,0.12)',
  },
  CANCELED: {
    gradient: 'linear-gradient(135deg, #94a3b8, #cbd5e1)',
    bg: 'rgba(148,163,184,0.06)',
    border: 'rgba(148,163,184,0.2)',
    text: '#64748b',
    glow: 'rgba(148,163,184,0.1)',
  },
}

export default function BookingCard({ booking }: { booking: AgendaBooking }) {
  const s = STATUS[booking.status] ?? STATUS.CONFIRMED
  const initials = booking.clientName
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase()

  return (
    <div
      style={{
        height: '100%',
        borderRadius: 12,
        background: 'rgba(255,255,255,0.88)',
        border: `1px solid ${s.border}`,
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        padding: '7px 9px',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        cursor: 'pointer',
        transition:
          'transform 0.18s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.18s ease',
        boxSizing: 'border-box',
        boxShadow: `0 2px 8px ${s.glow}`,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'scale(1.025) translateY(-1px)'
        e.currentTarget.style.boxShadow = `0 6px 18px ${s.glow}`
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'scale(1)'
        e.currentTarget.style.boxShadow = `0 2px 8px ${s.glow}`
      }}
    >
      {/* gradient top bar */}
      <div
        style={{
          height: 3,
          borderRadius: 3,
          background: s.gradient,
          marginBottom: 6,
          flexShrink: 0,
        }}
      />

      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <div
          style={{
            width: 22,
            height: 22,
            borderRadius: '50%',
            background: s.gradient,
            color: '#fff',
            fontSize: 9,
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          {initials}
        </div>
        <strong
          style={{
            fontSize: 11,
            color: s.text,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            fontFamily: '-apple-system, system-ui, sans-serif',
          }}
        >
          {booking.clientName}
        </strong>
      </div>

      <div
        style={{
          fontSize: 10,
          color: s.text,
          opacity: 0.72,
          marginTop: 3,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          fontFamily: '-apple-system, system-ui, sans-serif',
        }}
      >
        {booking.serviceName}
      </div>

      <div
        style={{
          fontSize: 9,
          color: s.text,
          opacity: 0.5,
          marginTop: 2,
          fontVariantNumeric: 'tabular-nums',
          fontFamily: '-apple-system, system-ui, sans-serif',
        }}
      >
        {booking.start} – {booking.end}
      </div>
    </div>
  )
}