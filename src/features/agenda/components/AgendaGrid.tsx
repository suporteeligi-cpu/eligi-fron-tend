'use client'

import { useRef } from 'react'
import BookingCard from './BookingCard'
import { AgendaProfessional, AgendaBooking } from '../types'
import { colors, agendaLayout } from '@/shared/theme'
import { useAgendaStore } from '../hooks/useAgendaStore'

const { startHour: START_HOUR, endHour: END_HOUR, slotHeight: SLOT_HEIGHT, timeColWidth: TIME_COL_WIDTH, minColWidth: MIN_COL_WIDTH, headerHeight: HEADER_HEIGHT } = agendaLayout

function generateSlots() {
  const slots: string[] = []
  for (let h = START_HOUR; h < END_HOUR; h++) {
    slots.push(`${String(h).padStart(2,'0')}:00`)
    slots.push(`${String(h).padStart(2,'0')}:30`)
  }
  return slots
}

function toMinutes(t: string) {
  const [h, m] = t.split(':').map(Number)
  return h * 60 + m
}

function getCurrentTimeY(): number {
  const now = new Date()
  const minutes = now.getHours() * 60 + now.getMinutes()
  const start = START_HOUR * 60
  if (minutes < start || minutes > END_HOUR * 60) return -1
  return ((minutes - start) / 30) * SLOT_HEIGHT
}

interface Props {
  professionals: AgendaProfessional[]
  bookings: AgendaBooking[]
}

export default function AgendaGrid({ professionals, bookings }: Props) {
  const { openCreate } = useAgendaStore()
  const slots = generateSlots()
  const scrollRef = useRef<HTMLDivElement>(null)
  const currentY = getCurrentTimeY()
  const START_MIN = START_HOUR * 60

  return (
    <div style={{ flex:1, overflowY:'auto', overflowX:'auto', background: colors.background.page, fontFamily:'-apple-system, "SF Pro Display", system-ui, sans-serif' }} ref={scrollRef}>
      <style>{`.grid-slot { height:${SLOT_HEIGHT}px; cursor:pointer; transition:background 0.14s ease; } .grid-slot:hover { background:${colors.red.subtle} !important; }`}</style>
      <div style={{ display:'grid', gridTemplateColumns:`${TIME_COL_WIDTH}px repeat(${professionals.length}, minmax(${MIN_COL_WIDTH}px, 1fr))`, minWidth:`${TIME_COL_WIDTH + professionals.length * MIN_COL_WIDTH}px`, position:'relative' }}>

        <div style={{ height:HEADER_HEIGHT, position:'sticky', top:0, zIndex:20, background:'rgba(255,255,255,0.88)', backdropFilter:'blur(20px)', borderBottom:`1px solid ${colors.gray.border}`, borderRight:`1px solid ${colors.gray.border}` }} />

        {professionals.map((p) => {
          const initials = p.name.split(' ').slice(0,2).map(w=>w[0]).join('').toUpperCase()
          return (
            <div key={p.id} style={{ height:HEADER_HEIGHT, display:'flex', alignItems:'center', justifyContent:'center', position:'sticky', top:0, zIndex:20, background:'rgba(255,255,255,0.88)', backdropFilter:'blur(20px)', borderBottom:`1px solid ${colors.gray.border}`, borderLeft:`1px solid ${colors.gray.border}`, fontWeight:600, fontSize:13, color:colors.gray['900'], gap:8 }}>
              <div style={{ width:30, height:30, borderRadius:'50%', background:colors.red.gradient, color:'#fff', fontSize:11, fontWeight:700, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, boxShadow:`0 2px 8px ${colors.red.glow}` }}>{initials}</div>
              <span style={{ overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', maxWidth:100 }}>{p.name}</span>
            </div>
          )
        })}

        <div style={{ position:'relative', zIndex:2 }}>
          {slots.map((time, i) => (
            <div key={time} style={{ height:SLOT_HEIGHT, display:'flex', alignItems:'flex-start', justifyContent:'flex-end', paddingRight:10, paddingTop:5, borderBottom: i%2===1 ? `1px solid ${colors.gray.border}` : '1px solid transparent' }}>
              {i%2===0 && <span style={{ fontSize:11, fontWeight:500, color:colors.gray.dimText, fontVariantNumeric:'tabular-nums' }}>{time}</span>}
            </div>
          ))}
        </div>

        {professionals.map((p) => {
          const profBookings = bookings.filter(b => b.professionalId === p.id)
          return (
            <div key={p.id} style={{ position:'relative', borderLeft:`1px solid ${colors.gray.border}`, zIndex:5 }}>
              {slots.map((time, i) => (
                <div key={time} className="grid-slot" onClick={() => openCreate(time, p.id)} style={{ borderBottom: i%2===1 ? `1px solid ${colors.gray.border}` : `1px dashed rgba(0,0,0,0.04)` }} />
              ))}
              {profBookings.map((b) => {
                const top    = ((toMinutes(b.start) - START_MIN) / 30) * SLOT_HEIGHT
                const height = Math.max(((toMinutes(b.end) - toMinutes(b.start)) / 30) * SLOT_HEIGHT, SLOT_HEIGHT * 0.8)
                return (
                  <div key={b.id} style={{ position:'absolute', top, left:6, right:6, height:height-4, zIndex:8 }}>
                    <BookingCard booking={b} />
                  </div>
                )
              })}
              {currentY >= 0 && (
                <div style={{ position:'absolute', top:currentY+HEADER_HEIGHT, left:0, right:0, height:2, background:`linear-gradient(90deg,${colors.red.DEFAULT},${colors.red.light})`, zIndex:15, pointerEvents:'none', boxShadow:`0 0 6px ${colors.red.glow}` }}>
                  <div style={{ width:8, height:8, borderRadius:'50%', background:colors.red.DEFAULT, position:'absolute', left:-4, top:-3, boxShadow:`0 0 6px ${colors.red.glow}` }} />
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
