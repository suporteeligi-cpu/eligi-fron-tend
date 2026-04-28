'use client'

import { AgendaBooking } from '@/types/agenda'

const STATUS = {
  CONFIRMED: {
    gradient: 'linear-gradient(135deg, #2B7DFF, #5E5CE6)',
    bg: 'rgba(43,125,255,0.1)',
    border: 'rgba(43,125,255,0.2)',
    text: '#1a4bb5',
    glow: 'rgba(43,125,255,0.2)'
  },
  COMPLETED: {
    gradient: 'linear-gradient(135deg, #30D158, #34c759)',
    bg: 'rgba(48,209,88,0.1)',
    border: 'rgba(48,209,88,0.25)',
    text: '#1a6b30',
    glow: 'rgba(48,209,88,0.2)'
  },
  CANCELED: {
    gradient: 'linear-gradient(135deg, #FF375F, #ff6b6b)',
    bg: 'rgba(255,55,95,0.08)',
    border: 'rgba(255,55,95,0.2)',
    text: '#b01a35',
    glow: 'rgba(255,55,95,0.15)'
  },
}

export default function BookingCard({ booking }: { booking: AgendaBooking }) {
  const s = STATUS[booking.status] ?? STATUS.CONFIRMED
  const initials = booking.clientName
    .split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase()

  return (
    <div
      style={{
        height: '100%',
        borderRadius: 14,
        background: 'rgba(255,255,255,0.82)',
        border: `1px solid ${s.border}`,
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        padding: '7px 9px',
        display: 'flex', flexDirection: 'column',
        overflow: 'hidden', cursor: 'pointer',
        transition: 'transform 0.18s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.18s ease',
        boxSizing: 'border-box',
        boxShadow: `0 2px 10px ${s.glow}`
      }}
      onMouseEnter={e => {
        e.currentTarget.style.transform = 'scale(1.025) translateY(-1px)'
        e.currentTarget.style.boxShadow = `0 6px 20px ${s.glow}`
      }}
      onMouseLeave={e => {
        e.currentTarget.style.transform = 'scale(1)'
        e.currentTarget.style.boxShadow = `0 2px 10px ${s.glow}`
      }}
    >
      {/* gradient top bar */}
      <div style={{
        height: 3, borderRadius: 3,
        background: s.gradient,
        marginBottom: 6, flexShrink: 0
      }} />

      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <div style={{
          width: 22, height: 22, borderRadius: '50%',
          background: s.gradient, color: '#fff',
          fontSize: 9, fontWeight: 700,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0
        }}>
          {initials}
        </div>
        <strong style={{
          fontSize: 11, color: s.text,
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          fontFamily: '-apple-system, system-ui, sans-serif'
        }}>
          {booking.clientName}
        </strong>
      </div>

      <div style={{
        fontSize: 10, color: s.text, opacity: 0.75, marginTop: 3,
        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        fontFamily: '-apple-system, system-ui, sans-serif'
      }}>
        {booking.serviceName}
      </div>

      <div style={{
        fontSize: 9, color: s.text, opacity: 0.55, marginTop: 2,
        fontVariantNumeric: 'tabular-nums',
        fontFamily: '-apple-system, system-ui, sans-serif'
      }}>
        {booking.start} – {booking.end}
      </div>
    </div>
  )
}