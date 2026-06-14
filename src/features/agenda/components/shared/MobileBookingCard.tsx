'use client'
// src/features/agenda/components/shared/MobileBookingCard.tsx
// Card mobile/iPad (PX_PER_MIN ≈ 1.87). Layout adaptativo — prioridade NOME (estratégia C).
// Cor do texto adapta ao fundo do serviço (claro vs escuro) via inkFor().

import { AgendaBooking } from '../../types'
import { bookingStatus } from '@/shared/theme'
import { colorToGradient, colorToGlow } from '@/features/agenda/constants/serviceColors'
import { inkFor } from '../../utils/contrast'
import BookingSeals from './BookingSeals'

interface Props {
  booking:     AgendaBooking
  height:      number
  isDragging?: boolean
}

/**
 * Layout adaptativo por altura (prioridade nome):
 * - nano   (< 20px)        : só primeiro nome (centralizado)
 * - tight  (20–36px)       : nome + horário inline
 * - mid    (36–56px)       : nome + serviço
 * - full   (≥ 56px)        : nome + serviço (+ rodapé horário/duração ≥ 64px)
 */
const H_NANO   = 20
const H_MID    = 36
const H_FULL   = 56
const H_FOOTER = 64

export default function MobileBookingCard({ booking, height, isDragging = false }: Props) {
  const isNoShow    = booking.status === 'NO_SHOW'
  const statusTheme = bookingStatus[booking.status] ?? bookingStatus.CONFIRMED
  const gradient    = booking.serviceColor && !isNoShow ? colorToGradient(booking.serviceColor) : statusTheme.gradient
  const glow        = booking.serviceColor && !isNoShow ? colorToGlow(booking.serviceColor)     : statusTheme.glow

  const isNano     = height < H_NANO
  const isTight    = height >= H_NANO && height < H_MID
  const isMid      = height >= H_MID && height < H_FULL
  const isFull     = height >= H_FULL
  const showFooter = height >= H_FOOTER

  const ink       = isNoShow ? inkFor(null) : inkFor(booking.serviceColor)
  const firstName = booking.clientName.split(' ')[0] || booking.clientName
  const dur       = toMinutesSafe(booking.end) - toMinutesSafe(booking.start)

  return (
    <div style={{
      width: '100%', height: '100%', borderRadius: 10,
      background: gradient,
      color: ink.primary,
      opacity: isNoShow ? 0.55 : 1,
      padding: isNano ? '0 8px' : isTight ? '0 8px 0 10px' : '5px 8px 5px 10px',
      display: 'flex', flexDirection: 'column',
      justifyContent: (isNano || isTight) ? 'center' : 'flex-start',
      gap: 1, overflow: 'hidden', boxSizing: 'border-box',
      boxShadow: isDragging ? `0 14px 36px ${glow}, 0 4px 12px rgba(0,0,0,0.18)` : `0 3px 12px ${glow}`,
      border: '1px solid rgba(255,255,255,0.18)',
      position: 'relative',
      userSelect: 'none',
      WebkitUserSelect: 'none',
      transform: isDragging ? 'scale(1.04)' : 'scale(1)',
      transition: isDragging ? 'none' : 'box-shadow 0.15s ease, transform 0.12s ease',
    }}>
      {/* Overlay ghost NO_SHOW */}
      {isNoShow && (
        <div aria-hidden style={{
          position: 'absolute', inset: 0, borderRadius: 10,
          background: 'repeating-linear-gradient(135deg, transparent, transparent 4px, rgba(0,0,0,0.08) 4px, rgba(0,0,0,0.08) 6px)',
          pointerEvents: 'none', zIndex: 2,
        }} />
      )}

      {/* Brilho topo */}
      <div aria-hidden style={{
        position:'absolute', top:0, left:0, right:0, height:'40%',
        background:'linear-gradient(180deg,rgba(255,255,255,0.16) 0%,transparent 100%)',
        borderRadius:'10px 10px 0 0', pointerEvents:'none',
      }} />

      {/* Selos: Pago 💲 · Online 🚀 · Preferência ❤️ (empilhados, leve sobreposição) */}
      <BookingSeals
        isPaid={booking.isPaid}
        fromOnline={booking.fromOnline}
        professionalPreference={booking.professionalPreference}
        isNoShow={isNoShow}
        hidden={isNano}
        cardHeight={height}
      />

      {/* Barra lateral — adapta ao fundo */}
      {!isNano && (
        <div aria-hidden style={{
          position:'absolute', left:0, top:0, bottom:0, width:3,
          background: ink.isDark ? 'rgba(0,0,0,0.22)' : 'rgba(255,255,255,0.42)',
          borderRadius:'10px 0 0 10px',
        }} />
      )}

      {/* NANO — só primeiro nome */}
      {isNano && (
        <span style={{
          fontSize:11, fontWeight:700, color: ink.primary,
          whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis',
          width:'100%', textAlign:'center', letterSpacing:'-0.2px', lineHeight:1,
        }}>
          {firstName}
        </span>
      )}

      {/* TIGHT — nome + horário inline */}
      {isTight && (
        <div style={{ display:'flex', alignItems:'baseline', gap:6, width:'100%', overflow:'hidden', lineHeight:1.1 }}>
          <span style={{
            fontSize:12, fontWeight:700, color: ink.primary,
            whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis',
            minWidth:0, letterSpacing:'-0.15px',
          }}>
            {booking.clientName}
          </span>
          <span style={{
            fontSize:9, fontWeight:600, color: ink.secondary, flexShrink:0,
            fontVariantNumeric:'tabular-nums',
          }}>
            {booking.start}
          </span>
        </div>
      )}

      {/* MID — nome + serviço */}
      {isMid && (
        <>
          <div style={{
            fontSize:13, fontWeight:700, color: ink.primary, lineHeight:1.2,
            whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis', letterSpacing:'-0.15px',
          }}>
            {booking.clientName}
          </div>
          {booking.serviceName && (
            <div style={{
              fontSize:11, fontWeight:600, color: ink.secondary,
              whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis',
            }}>
              {booking.serviceName}
            </div>
          )}
        </>
      )}

      {/* FULL — nome + serviço (+ rodapé) */}
      {isFull && (
        <>
          <div style={{
            fontSize:14, fontWeight:700, color: ink.primary, lineHeight:1.2,
            whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis', letterSpacing:'-0.2px',
          }}>
            {booking.clientName}
          </div>
          {booking.serviceName && (
            <div style={{
              fontSize:11, fontWeight:600, color: ink.secondary,
              whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis',
            }}>
              {booking.serviceName}
            </div>
          )}
          {showFooter && (
            <div style={{ marginTop:'auto', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
              <span style={{ color: ink.secondary, fontSize:11, fontWeight:600, fontVariantNumeric:'tabular-nums' }}>
                {booking.start}–{booking.end}
              </span>
              <span style={{ color: ink.faint, fontSize:10, fontWeight:600 }}>{dur}min</span>
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