'use client'

import { AgendaBooking, BookingStatus } from '../types'
import { bookingStatus } from '@/shared/theme'

interface Props {
  booking:     AgendaBooking
  totalHeight: number
}

function formatTime(t: string) {
  return t.slice(0, 5)
}

const STATUS_LABEL: Record<BookingStatus, string> = {
  CONFIRMED: 'Confirmado',
  COMPLETED: 'Concluído',
  CANCELED:  'Cancelado',
}

export default function BookingCard({ booking, totalHeight }: Props) {
  const theme   = bookingStatus[booking.status] ?? bookingStatus.CONFIRMED
  const compact = totalHeight < 52
  const medium  = totalHeight >= 52 && totalHeight < 90

  return (
    <div
      style={{
        position:'relative', width:'100%', height:'100%',
        borderRadius:10,
        padding: compact ? '4px 8px' : '8px 10px',
        background: theme.gradient,
        color:'#fff', fontSize:12,
        display:'flex', flexDirection:'column',
        justifyContent: compact ? 'center' : 'space-between',
        overflow:'hidden',
        boxShadow:`0 4px 14px ${theme.glow}, 0 1px 4px rgba(0,0,0,0.10)`,
        border:'1px solid rgba(255,255,255,0.15)',
        cursor:'pointer',
        transition:'transform 0.15s ease, box-shadow 0.15s ease',
        userSelect:'none',
        pointerEvents:'auto',
        boxSizing:'border-box',
      }}
      onMouseEnter={e => {
        const el = e.currentTarget as HTMLDivElement
        el.style.transform = 'scale(1.012)'
        el.style.boxShadow = `0 8px 24px ${theme.glow}, 0 2px 6px rgba(0,0,0,0.14)`
      }}
      onMouseLeave={e => {
        const el = e.currentTarget as HTMLDivElement
        el.style.transform = 'scale(1)'
        el.style.boxShadow = `0 4px 14px ${theme.glow}, 0 1px 4px rgba(0,0,0,0.10)`
      }}
    >
      <div aria-hidden style={{
        position:'absolute', top:0, left:0, right:0, height:'40%',
        background:'linear-gradient(180deg, rgba(255,255,255,0.16) 0%, transparent 100%)',
        borderRadius:'10px 10px 0 0', pointerEvents:'none',
      }} />

      <div aria-hidden style={{
        position:'absolute', left:0, top:0, bottom:0, width:3,
        background:'rgba(255,255,255,0.35)',
        borderRadius:'10px 0 0 10px',
      }} />

      <div style={{ paddingLeft:6, position:'relative', display:'flex', flexDirection:'column', gap: compact ? 0 : 3, minWidth:0 }}>
        <div style={{
          fontWeight:700, fontSize: compact ? 11 : 13, lineHeight:1.2,
          whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis',
        }}>
          {booking.clientName}
        </div>
        {!compact && (
          <div style={{
            fontSize:11, fontWeight:500, opacity:0.85,
            whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis',
          }}>
            {booking.serviceName}
          </div>
        )}
      </div>

      {!compact && (
        <div style={{
          paddingLeft:6, position:'relative',
          display:'flex', alignItems:'center', justifyContent:'space-between', gap:4,
        }}>
          <span style={{ fontSize:10, fontWeight:600, opacity:0.80, fontVariantNumeric:'tabular-nums' }}>
            {formatTime(booking.start)} – {formatTime(booking.end)}
          </span>
          {!medium && (
            <span style={{
              fontSize:9, fontWeight:700,
              background:'rgba(255,255,255,0.22)',
              borderRadius:6, padding:'1px 6px',
              letterSpacing:'0.03em', textTransform:'uppercase', whiteSpace:'nowrap',
            }}>
              {STATUS_LABEL[booking.status]}
            </span>
          )}
        </div>
      )}
    </div>
  )
}