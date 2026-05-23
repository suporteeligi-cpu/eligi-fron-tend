'use client'
// src/features/agenda/components/shared/MobileBookingCard.tsx

import { AgendaBooking } from '../../types'
import { bookingStatus } from '@/shared/theme'
import { colorToGradient, colorToGlow } from '@/features/agenda/constants/serviceColors'

interface Props {
  booking:     AgendaBooking
  height:      number
  isDragging?: boolean
}

/**
 * Card de agendamento adaptado para mobile/iPad (PX_PER_MIN ≈ 1.87).
 * Layout adaptativo por altura:
 * - micro   (≤ 13px) : só horário início
 * - compact (≤ 37px ≈ ≤ 20min) : horário · Nome · Serviço numa linha
 * - normal  (37–56px) : horário no topo + nome/serviço empilhado
 * - full    (≥ 56px)  : layout completo com rodapé duração
 */
export default function MobileBookingCard({ booking, height, isDragging = false }: Props) {
  const statusTheme = bookingStatus[booking.status] ?? bookingStatus.CONFIRMED
  const gradient    = booking.serviceColor ? colorToGradient(booking.serviceColor) : statusTheme.gradient
  const glow        = booking.serviceColor ? colorToGlow(booking.serviceColor)     : statusTheme.glow

  const isMicro   = height <= 13
  const isCompact = height > 13 && height <= 37
  const isNormal  = height > 37 && height < 56
  const showTime  = height >= 68
  const dur       = toMinutesSafe(booking.end) - toMinutesSafe(booking.start)

  return (
    <div style={{
      width: '100%', height: '100%', borderRadius: 10,
      background: gradient,
      padding: isMicro ? '0 6px' : isCompact ? '0 8px 0 10px' : '5px 8px 5px 10px',
      display: 'flex', flexDirection: 'column',
      justifyContent: (isMicro || isCompact) ? 'center' : 'flex-start',
      gap: 1, overflow: 'hidden', boxSizing: 'border-box',
      boxShadow: isDragging ? `0 14px 36px ${glow}, 0 4px 12px rgba(0,0,0,0.18)` : `0 3px 12px ${glow}`,
      border: '1px solid rgba(255,255,255,0.18)',
      position: 'relative',
      userSelect: 'none',
      WebkitUserSelect: 'none',
      transform: isDragging ? 'scale(1.04)' : 'scale(1)',
      transition: isDragging ? 'none' : 'box-shadow 0.15s ease, transform 0.12s ease',
    }}>
      {/* Brilho topo */}
      <div aria-hidden style={{
        position:'absolute', top:0, left:0, right:0, height:'40%',
        background:'linear-gradient(180deg,rgba(255,255,255,0.16) 0%,transparent 100%)',
        borderRadius:'10px 10px 0 0', pointerEvents:'none',
      }} />
      {/* Barra lateral */}
      {!isMicro && (
        <div aria-hidden style={{
          position:'absolute', left:0, top:0, bottom:0, width:3,
          background:'rgba(255,255,255,0.42)',
          borderRadius:'10px 0 0 10px',
        }} />
      )}

      {/* MICRO */}
      {isMicro && (
        <span style={{
          fontSize:9, fontWeight:800, color:'#fff', opacity:0.95,
          fontVariantNumeric:'tabular-nums', whiteSpace:'nowrap',
          letterSpacing:'-0.3px', lineHeight:1,
        }}>
          {booking.start}
        </span>
      )}

      {/* COMPACT — ≤ 20min */}
      {isCompact && (
        <div style={{ display:'flex', alignItems:'center', gap:4, overflow:'hidden', width:'100%', lineHeight:1 }}>
          <span style={{ fontSize:10, fontWeight:800, color:'#fff', opacity:0.92, fontVariantNumeric:'tabular-nums', whiteSpace:'nowrap', flexShrink:0, letterSpacing:'-0.2px' }}>
            {booking.start} - {booking.end}
          </span>
          <span style={{ color:'rgba(255,255,255,0.50)', fontSize:9, flexShrink:0 }}>·</span>
          <span style={{ fontSize:11, fontWeight:800, color:'#fff', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis', letterSpacing:'-0.15px', flexShrink:1, minWidth:0 }}>
            {booking.clientName}
          </span>
          {booking.serviceName && (
            <>
              <span style={{ color:'rgba(255,255,255,0.50)', fontSize:9, flexShrink:0 }}>·</span>
              <span style={{ fontSize:10, fontWeight:600, color:'rgba(255,255,255,0.90)', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis', flexShrink:2, minWidth:0 }}>
                {booking.serviceName}
              </span>
            </>
          )}
        </div>
      )}

      {/* NORMAL — 20-30min */}
      {isNormal && (
        <>
          <div style={{ color:'#fff', fontWeight:800, fontSize:10, lineHeight:1, fontVariantNumeric:'tabular-nums', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>
            {booking.start}–{booking.end}
          </div>
          <div style={{ color:'#fff', fontWeight:800, fontSize:12, lineHeight:1.2, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis', letterSpacing:'-0.15px' }}>
            {booking.clientName}
            {booking.serviceName && <span style={{ fontWeight:600, opacity:0.82, fontSize:10 }}> · {booking.serviceName}</span>}
          </div>
        </>
      )}

      {/* FULL — ≥ 30min */}
      {!isMicro && !isCompact && !isNormal && (
        <>
          <div style={{ color:'#fff', fontWeight:800, fontSize:13, lineHeight:1.2, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis', letterSpacing:'-0.2px' }}>
            {booking.clientName}
          </div>
          <div style={{ color:'rgba(255,255,255,0.88)', fontWeight:600, fontSize:11, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>
            {booking.serviceName}
          </div>
          {showTime && (
            <div style={{ marginTop:'auto', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
              <span style={{ color:'rgba(255,255,255,0.80)', fontSize:11, fontWeight:700, fontVariantNumeric:'tabular-nums' }}>
                {booking.start}–{booking.end}
              </span>
              <span style={{ color:'rgba(255,255,255,0.55)', fontSize:10, fontWeight:600 }}>{dur}min</span>
            </div>
          )}
        </>
      )}
    </div>
  )
}

// Helper local — evita import circular
function toMinutesSafe(t: string): number {
  const [h, m] = t.split(':').map(Number)
  return h * 60 + m
}
