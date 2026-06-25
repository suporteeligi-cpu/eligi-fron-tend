'use client'
// src/features/agenda/components/BookingCard.tsx
// Card de agendamento desktop. Ordem FIXA em qualquer tamanho: horário (faixa) · nome · serviço.
// Curto → uma linha inline; alto (≥56px) → empilhado, mesma ordem.
// O horário (faixa início–fim) nunca encolhe; nome e serviço truncam (serviço cede primeiro).
// Cor do texto adapta ao fundo do serviço via inkFor().

import { memo } from 'react'
import { AgendaBooking } from '../types'
import { bookingStatus } from '@/shared/theme'
import { colorToGradient, colorToGlow } from '@/features/agenda/constants/serviceColors'
import { inkFor } from '../utils/contrast'
import BookingSeals from './shared/BookingSeals'

interface Props {
  booking:     AgendaBooking
  totalHeight: number
}

// Desktop: PX_PER_MIN = 2 → altura(px) = duração(min) * 2
const H_STACK = 56 // ≥ 56px (≥28min) empilha em 3 linhas; abaixo é inline numa linha

function BookingCard({ booking, totalHeight }: Props) {
  const stacked      = totalHeight >= H_STACK
  const sealsHidden  = totalHeight < 22
  const nameFsInline = totalHeight < 22 ? 11 : totalHeight < 38 ? 12 : 13

  const isNoShow    = booking.status === 'NO_SHOW'
  const statusTheme = bookingStatus[booking.status] ?? bookingStatus.CONFIRMED
  // NO_SHOW: mantém cor do serviço mas dessatura/escurece via overlay
  const gradient    = booking.serviceColor && !isNoShow ? colorToGradient(booking.serviceColor) : statusTheme.gradient
  const glow        = booking.serviceColor && !isNoShow ? colorToGlow(booking.serviceColor)     : statusTheme.glow

  // Tinta adaptativa: NO_SHOW (fundo escuro do tema) e sem cor → branco.
  const ink   = isNoShow ? inkFor(null) : inkFor(booking.serviceColor)
  const range = `${booking.start}–${booking.end}`

  return (
    <div
      role="button"
      aria-label={`Agendamento ${booking.clientName} ${booking.start} às ${booking.end}`}
      className="eligi-booking-card"
      style={{
        position: 'relative',
        width: '100%', height: '100%',
        borderRadius: 7,
        background: gradient,
        color: ink.primary,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
        justifyContent: stacked ? 'flex-start' : 'center',
        overflow: 'hidden',
        boxShadow: `0 2px 8px ${glow}, 0 1px 3px rgba(0,0,0,0.08)`,
        border: '1px solid rgba(255,255,255,0.15)',
        cursor: 'pointer',
        opacity: isNoShow ? 0.55 : 1,
        userSelect: 'none',
        pointerEvents: 'auto',
        boxSizing: 'border-box',
        padding: stacked ? '4px 7px 4px 9px' : '0 6px 0 9px',
        gap: 1,
        // CSS vars pro hover (mais performante que JS handlers)
        ['--bc-glow' as string]: glow,
      }}
    >
      <style>{`
        .eligi-booking-card {
          transition: transform 0.15s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.15s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .eligi-booking-card:hover {
          transform: scale(1.01);
          box-shadow: 0 5px 16px var(--bc-glow), 0 2px 5px rgba(0,0,0,0.12);
        }
        .eligi-booking-card:active {
          transform: scale(0.99);
        }
      `}</style>

      {/* Brilho topo */}
      <div aria-hidden style={{
        position:'absolute', top:0, left:0, right:0, height:'50%',
        background:'linear-gradient(180deg,rgba(255,255,255,0.18) 0%, transparent 100%)',
        borderRadius:'7px 7px 0 0',
        pointerEvents:'none',
      }} />

      {/* Selos: Pago 💲 · Online 🚀 · Preferência ❤️ (empilhados, leve sobreposição) */}
      <BookingSeals
        isPaid={booking.isPaid}
        fromOnline={booking.fromOnline}
        professionalPreference={booking.professionalPreference}
        hasClub={booking.hasClub}
        isNoShow={isNoShow}
        hidden={sealsHidden}
        cardHeight={totalHeight}
      />

      {/* Overlay ghost NO_SHOW — listras diagonais sutis */}
      {isNoShow && (
        <div aria-hidden style={{
          position: 'absolute', inset: 0, borderRadius: 7,
          background: 'repeating-linear-gradient(135deg, transparent, transparent 4px, rgba(0,0,0,0.08) 4px, rgba(0,0,0,0.08) 6px)',
          pointerEvents: 'none', zIndex: 2,
        }} />
      )}

      {/* Barra lateral esquerda — adapta ao fundo */}
      <div aria-hidden style={{
        position:'absolute', left:0, top:0, bottom:0, width:3,
        background: ink.isDark ? 'rgba(0,0,0,0.20)' : 'rgba(255,255,255,0.38)',
        borderRadius:'7px 0 0 7px',
      }} />

      {/* EMPILHADO (alto) — horário / nome / serviço */}
      {stacked ? (
        <>
          <div style={{
            fontSize:10, fontWeight:600, color: ink.secondary, fontVariantNumeric:'tabular-nums',
            letterSpacing:'-0.1px', lineHeight:1,
            whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis', width:'100%',
          }}>
            {range}
          </div>
          <div style={{
            fontSize:14, fontWeight:700, color: ink.primary, lineHeight:1.2,
            whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis',
            width:'100%', letterSpacing:'-0.2px',
          }}>
            {booking.clientName}
          </div>
          {booking.serviceName && (
            <div style={{
              fontSize:11, fontWeight:600, color: ink.secondary,
              whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis', width:'100%',
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

export default memo(BookingCard)
