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

// Desktop: PX_PER_MIN = 2
// 5min  = 10px  → só horário início
// 10min = 20px  → horário + nome inline
// 20min = 40px  → horário + nome · serviço inline  ← limite pedido
// 30min = 60px  → layout normal (horário / nome / serviço separados)
// 50min = 100px → + badge status

const H_MICRO  = 14   // ≤ 14px : só início compacto
const H_SMALL  = 40   // ≤ 40px : horário + "Nome · Serviço" na mesma linha (≤ 20min)
const H_MEDIUM = 72   // ≥ 72px : horário, nome, serviço separados
const H_FULL   = 100  // ≥ 100px: + badge

export default function BookingCard({ booking, totalHeight }: Props) {
  const isMicro     = totalHeight <= H_MICRO
  const isCompact   = totalHeight > H_MICRO && totalHeight <= H_SMALL  // ≤ 20min
  const isNormal    = totalHeight > H_SMALL && totalHeight < H_MEDIUM   // 20-36min
  const showService = totalHeight >= H_MEDIUM
  const showBadge   = totalHeight >= H_FULL

  const statusTheme = bookingStatus[booking.status] ?? bookingStatus.CONFIRMED
  const gradient    = booking.serviceColor ? colorToGradient(booking.serviceColor) : statusTheme.gradient
  const glow        = booking.serviceColor ? colorToGlow(booking.serviceColor)     : statusTheme.glow

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
        alignItems: 'flex-start',
        justifyContent: isMicro || isCompact ? 'center' : 'flex-start',
        overflow: 'hidden',
        boxShadow: `0 2px 8px ${glow}, 0 1px 3px rgba(0,0,0,0.08)`,
        border: '1px solid rgba(255,255,255,0.15)',
        cursor: 'pointer',
        userSelect: 'none',
        pointerEvents: 'auto',
        boxSizing: 'border-box',
        padding: isMicro ? '0 5px' : isCompact ? '0 6px 0 9px' : '4px 7px 4px 9px',
        gap: 1,
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
      <div aria-hidden style={{ position:'absolute', top:0, left:0, right:0, height:'50%', background:'linear-gradient(180deg,rgba(255,255,255,0.18) 0%,transparent 100%)', borderRadius:'7px 7px 0 0', pointerEvents:'none' }} />
      {/* Barra lateral */}
      {!isMicro && <div aria-hidden style={{ position:'absolute', left:0, top:0, bottom:0, width:3, background:'rgba(255,255,255,0.38)', borderRadius:'7px 0 0 7px' }} />}

      {/* MICRO: ≤ 7min — só horário de início compacto */}
      {isMicro && (
        <span style={{ fontSize:9, fontWeight:800, color:'#fff', opacity:0.95, fontVariantNumeric:'tabular-nums', whiteSpace:'nowrap', overflow:'hidden', letterSpacing:'-0.3px', lineHeight:1 }}>
          {booking.start}
        </span>
      )}

      {/* COMPACT: ≤ 20min — horário - fim · Nome · Serviço tudo inline */}
      {isCompact && (
        <div style={{ display:'flex', alignItems:'center', gap:4, overflow:'hidden', width:'100%', lineHeight:1 }}>
          <span style={{ fontSize:10, fontWeight:800, opacity:0.92, fontVariantNumeric:'tabular-nums', whiteSpace:'nowrap', flexShrink:0, letterSpacing:'-0.2px', color:'#fff' }}>
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

      {/* NORMAL: 20-36min — horário + nome, sem serviço ainda */}
      {isNormal && (
        <>
          <div style={{ fontSize:10, fontWeight:800, opacity:0.95, fontVariantNumeric:'tabular-nums', letterSpacing:'-0.1px', lineHeight:1, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis', width:'100%' }}>
            {booking.start}–{booking.end}
          </div>
          <div style={{ fontSize:11, fontWeight:800, lineHeight:1.2, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis', letterSpacing:'-0.15px', width:'100%' }}>
            {booking.clientName}
            {booking.serviceName && (
              <span style={{ fontWeight:600, opacity:0.82, fontSize:10 }}> · {booking.serviceName}</span>
            )}
          </div>
        </>
      )}

      {/* FULL: ≥ 36min — layout completo */}
      {!isMicro && !isCompact && !isNormal && (
        <>
          <div style={{ fontSize:10, fontWeight:800, opacity:0.95, fontVariantNumeric:'tabular-nums', letterSpacing:'-0.1px', lineHeight:1, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis', width:'100%' }}>
            {booking.start}–{booking.end}
          </div>
          <div style={{ fontSize:11, fontWeight:800, lineHeight:1.2, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis', letterSpacing:'-0.15px', width:'100%' }}>
            {booking.clientName}
          </div>
          {showService && (
            <div style={{ fontSize:10, fontWeight:600, opacity:0.88, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis', width:'100%' }}>
              {booking.serviceName}
            </div>
          )}
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