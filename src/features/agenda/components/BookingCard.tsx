'use client'
// src/features/agenda/components/BookingCard.tsx

import { AgendaBooking, BookingStatus } from '../types'
import { bookingStatus } from '@/shared/theme'
import { colorToGradient, colorToGlow } from '@/features/agenda/constants/serviceColors'

interface Props {
  booking:     AgendaBooking
  totalHeight: number
}

const STATUS_LABEL: Record<BookingStatus, string> = {
  CONFIRMED: 'Confirmado',
  COMPLETED: 'Concluído',
  CANCELED:  'Cancelado',
}

// Thresholds em px
const H_TINY    = 28   // <= 28px: horário + nome na mesma linha
const H_MEDIUM  = 40   // >= 40px: horário e nome separados + serviço
const H_FULL    = 68   // >= 68px: + badge de status

export default function BookingCard({ booking, totalHeight }: Props) {
  const isTiny      = totalHeight <= H_TINY
  const showService = totalHeight >= H_MEDIUM
  const showBadge   = totalHeight >= H_FULL

  const statusTheme = bookingStatus[booking.status] ?? bookingStatus.CONFIRMED
  const gradient    = booking.serviceColor
    ? colorToGradient(booking.serviceColor)
    : statusTheme.gradient
  const glow        = booking.serviceColor
    ? colorToGlow(booking.serviceColor)
    : statusTheme.glow

  return (
    <div
      style={{
        position: 'relative',
        width: '100%', height: '100%',
        borderRadius: 7,
        background: gradient,
        color: '#fff',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: isTiny ? 'center' : 'flex-start',
        overflow: 'hidden',
        boxShadow: `0 2px 8px ${glow}, 0 1px 3px rgba(0,0,0,0.08)`,
        border: '1px solid rgba(255,255,255,0.15)',
        cursor: 'pointer',
        userSelect: 'none',
        pointerEvents: 'auto',
        boxSizing: 'border-box',
        padding: isTiny ? '0 6px 0 9px' : '4px 7px 4px 9px',
        gap: 2,
        transition: 'transform 0.12s ease, box-shadow 0.12s ease',
      }}
      onMouseEnter={e => {
        const el = e.currentTarget as HTMLDivElement
        el.style.transform = 'scale(1.01)'
        el.style.boxShadow = `0 5px 16px ${glow}, 0 2px 5px rgba(0,0,0,0.12)`
      }}
      onMouseLeave={e => {
        const el = e.currentTarget as HTMLDivElement
        el.style.transform = 'scale(1)'
        el.style.boxShadow = `0 2px 8px ${glow}, 0 1px 3px rgba(0,0,0,0.08)`
      }}
    >
      {/* Brilho topo */}
      <div aria-hidden style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: '50%',
        background: 'linear-gradient(180deg,rgba(255,255,255,0.18) 0%,transparent 100%)',
        borderRadius: '7px 7px 0 0', pointerEvents: 'none',
      }} />

      {/* Barra lateral esquerda */}
      <div aria-hidden style={{
        position: 'absolute', left: 0, top: 0, bottom: 0, width: 3,
        background: 'rgba(255,255,255,0.40)',
        borderRadius: '7px 0 0 7px',
      }} />

      {/* TINY: horário + nome · serviço na mesma linha */}
      {isTiny ? (
        <div style={{ display:'flex', alignItems:'center', gap:4, overflow:'hidden', lineHeight:1 }}>
          <span style={{ fontSize:10, fontWeight:700, opacity:0.9, fontVariantNumeric:'tabular-nums', whiteSpace:'nowrap', flexShrink:0 }}>
            {booking.start}–{booking.end}
          </span>
          <span style={{ fontSize:10, fontWeight:600, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>
            {booking.clientName}
            {booking.serviceName ? <span style={{ fontWeight:400, opacity:0.85 }}> · {booking.serviceName}</span> : null}
          </span>
        </div>
      ) : (
        <>
          {/* Horário */}
          <div style={{ fontSize:10, fontWeight:700, opacity:0.92, fontVariantNumeric:'tabular-nums', letterSpacing:'0.01em', lineHeight:1, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>
            {booking.start}–{booking.end}
          </div>

          {/* Nome */}
          <div style={{ fontSize:11, fontWeight:700, lineHeight:1.15, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>
            {booking.clientName}
          </div>

          {/* Serviço */}
          {showService && (
            <div style={{ fontSize:10, fontWeight:500, opacity:0.85, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>
              {booking.serviceName}
            </div>
          )}

          {/* Badge status */}
          {showBadge && (
            <div style={{ alignSelf:'flex-start', marginTop:'auto', fontSize:9, fontWeight:700, background:'rgba(255,255,255,0.22)', borderRadius:5, padding:'1px 6px', letterSpacing:'0.04em', textTransform:'uppercase', whiteSpace:'nowrap' }}>
              {STATUS_LABEL[booking.status]}
            </div>
          )}
        </>
      )}
    </div>
  )
}