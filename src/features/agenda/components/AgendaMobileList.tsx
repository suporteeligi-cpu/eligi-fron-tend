'use client'

import { useState, useMemo } from 'react'
import { AgendaProfessional, AgendaBooking } from '../types'
import { colors, bookingStatus as STATUS_CONFIG, transitions } from '@/shared/theme'
import { useAgendaStore } from '../hooks/useAgendaStore'

function generateSlots(): string[] {
  const slots: string[] = []
  for (let h = 8; h < 20; h++) {
    slots.push(`${String(h).padStart(2,'0')}:00`)
    slots.push(`${String(h).padStart(2,'0')}:30`)
  }
  return slots
}

function toMinutes(t: string) {
  const [h, m] = t.split(':').map(Number)
  return h * 60 + m
}

interface Props {
  professionals: AgendaProfessional[]
  bookings: AgendaBooking[]
}

export default function AgendaMobileList({ professionals, bookings }: Props) {
  const { openCreate } = useAgendaStore()
  const slots = generateSlots()
  const [currentProf, setCurrentProf] = useState<string | null>(professionals[0]?.id ?? null)

  const profBookings = useMemo(
    () => bookings.filter(b => !currentProf || b.professionalId === currentProf),
    [bookings, currentProf]
  )

  const profForBooking = (id: string) => professionals.find(p => p.id === id)?.name ?? id

  const slotItems = useMemo(() => {
    return slots.reduce<{ time: string; booking?: AgendaBooking; free: boolean }[]>((acc, time) => {
      const timeMin = toMinutes(time)
      const booking = profBookings.find(b => timeMin >= toMinutes(b.start) && timeMin < toMinutes(b.end))
      const isStart = booking && toMinutes(booking.start) === timeMin
      if (booking && !isStart) return acc
      acc.push({ time, booking: isStart ? booking : undefined, free: !booking })
      return acc
    }, [])
  }, [slots, profBookings])

  return (
    <div style={{ height:'100%', overflowY:'auto', background:colors.background.page, fontFamily:'-apple-system, "SF Pro Display", system-ui, sans-serif' }}>
      <style>{`
        .prof-chip { flex-shrink:0; padding:6px 16px; border-radius:20px; font-size:13px; font-weight:500; cursor:pointer; border:1px solid ${colors.gray.borderMd}; background:rgba(255,255,255,0.8); color:${colors.gray['700']}; transition:${transitions.spring}; }
        .prof-chip:hover { transform:translateY(-1px); box-shadow:0 4px 12px ${colors.red.focusRing}; border-color:${colors.red.border}; }
        .prof-chip.active { background:${colors.red.gradient}; color:#fff; border-color:transparent; box-shadow:0 4px 14px ${colors.red.glow}; }
        .slot-booked { display:flex; align-items:center; gap:12px; padding:13px 14px; border-radius:16px; background:rgba(255,255,255,0.85); border:1px solid ${colors.gray.border}; box-shadow:0 1px 6px rgba(0,0,0,0.05); backdrop-filter:blur(16px); cursor:pointer; position:relative; overflow:hidden; transition:${transitions.base}; }
        .slot-booked:hover { transform:translateX(3px); box-shadow:0 4px 16px rgba(0,0,0,0.09); }
        .slot-free { display:flex; align-items:center; gap:12px; padding:13px 14px; border-radius:16px; background:rgba(255,255,255,0.5); border:1px dashed ${colors.gray.borderMd}; cursor:pointer; position:relative; overflow:hidden; transition:${transitions.base}; }
        .slot-free:hover { transform:translateX(3px); background:${colors.red.subtle}; border-color:${colors.red.border}; }
        .new-btn { padding:7px 16px; border-radius:12px; background:${colors.red.subtle}; border:1px solid ${colors.red.border}; font-size:13px; font-weight:600; cursor:pointer; color:${colors.red.DEFAULT}; transition:${transitions.fast}; }
        .new-btn:hover { background:rgba(220,38,38,0.12); }
      `}</style>

      {professionals.length > 1 && (
        <div style={{ display:'flex', gap:8, padding:'14px 16px', overflowX:'auto', scrollbarWidth:'none', borderBottom:`1px solid ${colors.gray.border}`, background:'rgba(255,255,255,0.72)', backdropFilter:'blur(20px)' }}>
          <button className={`prof-chip${!currentProf?' active':''}`} onClick={() => setCurrentProf(null)}>Todos</button>
          {professionals.map(p => (
            <button key={p.id} className={`prof-chip${currentProf===p.id?' active':''}`} onClick={() => setCurrentProf(p.id)}>{p.name}</button>
          ))}
        </div>
      )}

      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'18px 16px 10px' }}>
        <span style={{ fontSize:16, fontWeight:600, color:colors.gray['900'] }}>Horários do dia</span>
        <button className="new-btn" onClick={() => openCreate('09:00', currentProf ?? professionals[0]?.id ?? '')}>+ Novo horário</button>
      </div>

      <div style={{ padding:'4px 16px 32px', display:'flex', flexDirection:'column', gap:8 }}>
        {slotItems.map((item) => {
          if (item.booking) {
            const cfg = STATUS_CONFIG[item.booking.status] ?? STATUS_CONFIG.CONFIRMED
            const initials = item.booking.clientName.split(' ').slice(0,2).map(w=>w[0]).join('').toUpperCase()
            const dur = toMinutes(item.booking.end) - toMinutes(item.booking.start)
            return (
              <div key={item.time} className="slot-booked">
                <div style={{ position:'absolute', left:0, top:0, bottom:0, width:3, background:cfg.gradient }} />
                <span style={{ fontSize:12, fontWeight:500, color:colors.gray.dimText, minWidth:42, marginLeft:8, fontVariantNumeric:'tabular-nums' }}>{item.booking.start}</span>
                <div style={{ width:38, height:38, borderRadius:'50%', background:cfg.gradient, color:'#fff', fontSize:13, fontWeight:600, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, boxShadow:`0 3px 10px ${cfg.glow}` }}>{initials}</div>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontSize:14, fontWeight:600, color:colors.gray['900'], whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{item.booking.clientName}</div>
                  <div style={{ fontSize:12, color:colors.gray.dimText, marginTop:2 }}>
                    {item.booking.serviceName} · {dur}min
                    {!currentProf && <span style={{ marginLeft:6, color:cfg.text }}>· {profForBooking(item.booking.professionalId)}</span>}
                  </div>
                </div>
                <div style={{ padding:'4px 10px', borderRadius:20, background:cfg.labelBg, color:cfg.labelColor, fontSize:11, fontWeight:600, flexShrink:0 }}>{cfg.label}</div>
              </div>
            )
          }
          return (
            <div key={item.time} className="slot-free" onClick={() => openCreate(item.time, currentProf ?? professionals[0]?.id ?? '')}>
              <div style={{ position:'absolute', left:0, top:0, bottom:0, width:3, background:colors.gray.border }} />
              <span style={{ fontSize:12, fontWeight:500, color:colors.gray.dimTextLight, minWidth:42, marginLeft:8, fontVariantNumeric:'tabular-nums' }}>{item.time}</span>
              <div style={{ width:38, height:38, borderRadius:'50%', background:colors.gray.hover, color:colors.gray.dimText, fontSize:22, fontWeight:300, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>+</div>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:13, fontWeight:500, color:colors.gray['500'] }}>Horário livre</div>
                <div style={{ fontSize:11, color:colors.gray.dimTextLight, marginTop:2 }}>Disponível para agendamento</div>
              </div>
              <div style={{ padding:'3px 10px', borderRadius:20, background:colors.gray.hover, color:colors.gray.dimText, fontSize:11, fontWeight:500 }}>Livre</div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
