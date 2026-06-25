'use client'
// src/features/agenda/components/shared/MobileBookingCard.tsx
// Card mobile/iPad (PX_PER_MIN ≈ 1.87). Ordem FIXA em qualquer tamanho: horário (faixa) · nome · serviço.
// Curto → uma linha inline; alto (≥56px) → empilhado, mesma ordem.
// Cor do texto adapta ao fundo do serviço via inkFor().

import { memo } from 'react'
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

const H_STACK = 56 // ≥ 56px empilha em 3 linhas; abaixo é inline numa linha

function MobileBookingCard({ booking, height, isDragging = false }: Props) {
  const stacked      = height >= H_STACK
  const sealsHidden  = height < 20
  const nameFsInline = height < 20 ? 11 : height < 36 ? 12 : 13

  const isNoShow    = booking.status === 'NO_SHOW'
  const statusTheme = bookingStatus[booking.status] ?? bookingStatus.CONFIRMED
  const gradient    = booking.serviceColor && !isNoShow ? colorToGradient(booking.serviceColor) : statusTheme.gradient
  const glow        = booking.serviceColor && !isNoShow ? colorToGlow(booking.serviceColor)     : statusTheme.glow

  const ink   = isNoShow ? inkFor(null) : inkFor(booking.serviceColor)
  const range = `${booking.start}–${booking.end}`

  return (
    <div style={{
      width: '100%', height: '100%', borderRadius: 10,
      background: gradient,
      color: ink.primary,
      opacity: isNoShow ? 0.55 : 1,
      padding: stacked ? '5px 8px 5px 10px' : '0 8px 0 10px',
      display: 'flex', flexDirection: 'column',
      justifyContent: stacked ? 'flex-start' : 'center',
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
        hasClub={booking.hasClub}
        isNoShow={isNoShow}
        hidden={sealsHidden}
        cardHeight={height}
      />

      {/* Barra lateral — adapta ao fundo */}
      <div aria-hidden style={{
        position:'absolute', left:0, top:0, bottom:0, width:3,
        background: ink.isDark ? 'rgba(0,0,0,0.22)' : 'rgba(255,255,255,0.42)',
        borderRadius:'10px 0 0 10px',
      }} />

      {/* EMPILHADO (alto) — horário / nome / serviço */}
      {stacked ? (
        <>
          <div style={{
            color: ink.secondary, fontWeight:600, fontSize:10, lineHeight:1,
            fontVariantNumeric:'tabular-nums', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis',
          }}>
            {range}
          </div>
          <div style={{
            color: ink.primary, fontWeight:700, fontSize:14, lineHeight:1.2,
            whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis', letterSpacing:'-0.2px',
          }}>
            {booking.clientName}
          </div>
          {booking.serviceName && (
            <div style={{
              color: ink.secondary, fontWeight:600, fontSize:11,
              whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis',
            }}>
              {booking.serviceName}
            </div>
          )}
        </>
      ) : (
        /* INLINE (curto) — horário · nome · serviço numa linha */
        <div style={{ display:'flex', alignItems:'baseline', gap:5, width:'100%', overflow:'hidden', lineHeight:1.1 }}>
          <span style={{
            fontSize:9, fontWeight:700, color: ink.secondary, flexShrink:0,
            fontVariantNumeric:'tabular-nums', letterSpacing:'-0.3px',
          }}>
            {range}
          </span>
          <span style={{ fontSize:9, color: ink.faint, flexShrink:0 }}>·</span>
          <span style={{
            fontSize:nameFsInline, fontWeight:700, color: ink.primary,
            flex:'1 1 0', minWidth:0, letterSpacing:'-0.15px',
            whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis',
          }}>
            {booking.clientName}
          </span>
          {booking.serviceName && (
            <>
              <span style={{ fontSize:9, color: ink.faint, flexShrink:0 }}>·</span>
              <span style={{
                fontSize:10, fontWeight:600, color: ink.secondary,
                flex:'1 2 0', minWidth:0,
                whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis',
              }}>
                {booking.serviceName}
              </span>
            </>
          )}
        </div>
      )}
    </div>
  )
}

export default memo(MobileBookingCard)
