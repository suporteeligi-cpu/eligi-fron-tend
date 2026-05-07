'use client'

import { Booking } from '@/types/booking'
import { SLOT_HEIGHT } from '@/lib/timeSlots'

interface Props {
  booking: Booking
}

export default function BookingCard({ booking }: Props) {
  const height   = (booking.duration / 30) * SLOT_HEIGHT
  const color    = booking.service.color || '#dc2626'

  // Derive a lighter tint for the background
  const isRed    = !booking.service.color

  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: 6,
        right: 6,
        height,
        borderRadius: 12,
        padding: '8px 10px',
        background: isRed
          ? 'linear-gradient(145deg, #ef4444 0%, #dc2626 60%, #b91c1c 100%)'
          : color,
        color: '#fff',
        fontSize: 13,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        gap: 2,
        overflow: 'hidden',
        boxShadow: `0 6px 20px ${color}55, 0 2px 6px rgba(0,0,0,0.12)`,
        border: '1px solid rgba(255,255,255,0.18)',
        cursor: 'pointer',
        transition: 'transform 150ms ease, box-shadow 150ms ease',
        userSelect: 'none',
      }}
      onMouseEnter={e => {
        const el = e.currentTarget as HTMLDivElement
        el.style.transform = 'scale(1.015)'
        el.style.boxShadow = `0 10px 28px ${color}66, 0 3px 8px rgba(0,0,0,0.15)`
      }}
      onMouseLeave={e => {
        const el = e.currentTarget as HTMLDivElement
        el.style.transform = 'scale(1)'
        el.style.boxShadow = `0 6px 20px ${color}55, 0 2px 6px rgba(0,0,0,0.12)`
      }}
    >
      {/* Specular shine */}
      <div
        aria-hidden
        style={{
          position: 'absolute',
          top: 0, left: 0, right: 0,
          height: '45%',
          background: 'linear-gradient(180deg, rgba(255,255,255,0.18) 0%, transparent 100%)',
          borderRadius: '12px 12px 0 0',
          pointerEvents: 'none',
        }}
      />

      <div style={{ fontWeight: 700, fontSize: 13, lineHeight: 1.2, position: 'relative' }}>
        {booking.clientName}
      </div>

      {height > 40 && (
        <div style={{ fontSize: 11, opacity: 0.82, fontWeight: 500, position: 'relative' }}>
          {booking.service.name}
        </div>
      )}
    </div>
  )
}