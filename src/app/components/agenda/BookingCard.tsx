'use client'

import { AgendaBooking } from '@/types/agenda'

const STATUS = {
  CONFIRMED: { bg: 'rgba(37,99,235,0.12)', border: 'rgba(37,99,235,0.25)', text: '#1d4ed8', accent: '#2563eb' },
  COMPLETED: { bg: 'rgba(22,163,74,0.12)', border: 'rgba(22,163,74,0.25)', text: '#15803d', accent: '#16a34a' },
  CANCELED:  { bg: 'rgba(220,38,38,0.10)', border: 'rgba(220,38,38,0.20)', text: '#b91c1c', accent: '#dc2626' },
}

export default function BookingCard({ booking }: { booking: AgendaBooking }) {
  const s = STATUS[booking.status] ?? STATUS.CONFIRMED
  const initials = booking.clientName
    .split(' ')
    .slice(0, 2)
    .map(w => w[0])
    .join('')
    .toUpperCase()

  return (
    <div
      style={{
        height: '100%',
        borderRadius: 10,
        background: s.bg,
        border: `1px solid ${s.border}`,
        padding: '6px 8px',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        cursor: 'pointer',
        transition: 'transform 0.15s var(--ease), box-shadow 0.15s var(--ease)',
        boxSizing: 'border-box',
        backdropFilter: 'blur(8px)'
      }}
      onMouseEnter={e => {
        e.currentTarget.style.transform = 'scale(1.02)'
        e.currentTarget.style.boxShadow = 'var(--shadow-sm)'
      }}
      onMouseLeave={e => {
        e.currentTarget.style.transform = 'scale(1)'
        e.currentTarget.style.boxShadow = 'none'
      }}
    >
      {/* accent top bar */}
      <div style={{
        height: 2, borderRadius: 2,
        background: s.accent,
        marginBottom: 6, flexShrink: 0
      }} />

      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        {/* avatar */}
        <div style={{
          width: 22, height: 22, borderRadius: '50%',
          background: s.accent, color: '#fff',
          fontSize: 9, fontWeight: 700,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0
        }}>
          {initials}
        </div>
        <strong style={{
          fontSize: 11, color: s.text,
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
        }}>
          {booking.clientName}
        </strong>
      </div>

      <div style={{
        fontSize: 10, color: s.text, opacity: 0.8, marginTop: 3,
        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
      }}>
        {booking.serviceName}
      </div>

      <div style={{
        fontSize: 9, color: s.text, opacity: 0.6, marginTop: 2
      }}>
        {booking.start} – {booking.end}
      </div>
    </div>
  )
}