'use client'
// src/features/agenda/components/AgendaMobileList.tsx

import { useState, useRef, useCallback, useEffect } from 'react'
import { AgendaProfessional, AgendaBooking, AgendaBlock } from '../types'
import { colors, typography, radius, transitions } from '@/shared/theme'
import { useAgendaStore } from '../hooks/useAgendaStore'
import { colorToGradient, colorToGlow } from '@/features/agenda/constants/serviceColors'
import { bookingStatus as STATUS_CFG } from '@/shared/theme'
import BlockCard       from './BlockCard'
import BlockEditModal  from './BlockEditModal'
import SlotContextMenu from './SlotContextMenu'
import api from '@/shared/lib/apiClient'
import dayjs from 'dayjs'
import timezone from 'dayjs/plugin/timezone'
import utc from 'dayjs/plugin/utc'

dayjs.extend(utc)
dayjs.extend(timezone)

// ─── Constantes ───────────────────────────────────────────────────────────────
const SLOT_STEP  = 5
const START_HOUR = 7
const END_HOUR   = 21
const ROW_H      = 56
const PX_PER_MIN = ROW_H / 30
const START_MIN  = START_HOUR * 60
const TIME_COL_W = 48
const MIN_CARD_H = 28

function toMinutes(t: string): number {
  const [h, m] = t.split(':').map(Number); return h * 60 + m
}
function minutesToTime(min: number): string {
  return `${String(Math.floor(min/60)).padStart(2,'0')}:${String(min%60).padStart(2,'00')}`
}
function snapToSlot(min: number): number {
  return Math.round(min / SLOT_STEP) * SLOT_STEP
}
function generateHalfSlots(): string[] {
  const s: string[] = []
  for (let h = START_HOUR; h < END_HOUR; h++) {
    s.push(`${String(h).padStart(2,'0')}:00`)
    s.push(`${String(h).padStart(2,'0')}:30`)
  }
  return s
}

const HALF_SLOTS = generateHalfSlots()
const TOTAL_H    = HALF_SLOTS.length * ROW_H

function useCurrentTimeY() {
  const [y, setY] = useState(-1)
  useEffect(() => {
    const calc = () => {
      const now = new Date()
      const min = now.getHours() * 60 + now.getMinutes()
      setY(min < START_MIN || min > END_HOUR * 60 ? -1 : (min - START_MIN) * PX_PER_MIN)
    }
    calc(); const id = setInterval(calc, 30_000); return () => clearInterval(id)
  }, [])
  return y
}

function computeOverlapLayout(bookings: AgendaBooking[]) {
  const result = new Map<string, { col: number; totalCols: number }>()
  const sorted = [...bookings].sort((a, b) => toMinutes(a.start) - toMinutes(b.start))
  const groups: AgendaBooking[][] = []
  for (const b of sorted) {
    let placed = false
    for (const group of groups) {
      if (group.some(g => toMinutes(b.start) < toMinutes(g.end) && toMinutes(b.end) > toMinutes(g.start))) {
        group.push(b); placed = true; break
      }
    }
    if (!placed) groups.push([b])
  }
  for (const group of groups) group.forEach((b, col) => result.set(b.id, { col, totalCols: group.length }))
  return result
}

// ─── ConflictModal ────────────────────────────────────────────────────────────
function ConflictModal({ onConfirm, onCancel }: { onConfirm: () => void; onCancel: () => void }) {
  return (
    <>
      <div onClick={onCancel} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.4)', backdropFilter:'blur(8px)', zIndex:9998 }} />
      <div style={{ position:'fixed', bottom:0, left:0, right:0, background:'#fff', borderRadius:'24px 24px 0 0', boxShadow:'0 -8px 40px rgba(0,0,0,0.18)', zIndex:9999, padding:'20px 24px max(36px,env(safe-area-inset-bottom))', textAlign:'center', fontFamily:typography.fontFamily }}>
        <div style={{ width:40, height:4, borderRadius:2, background:'rgba(0,0,0,0.12)', margin:'0 auto 20px' }} />
        <div style={{ fontSize:36, marginBottom:12 }}>⚠️</div>
        <h3 style={{ margin:'0 0 8px', fontSize:17, fontWeight:700, color:colors.gray[900] }}>Horário conflitante</h3>
        <p style={{ margin:'0 0 22px', fontSize:14, color:colors.gray.dimText, lineHeight:1.5 }}>
          Já existe um agendamento nesse horário.<br/>Deseja agendar mesmo assim?
        </p>
        <button onClick={onConfirm} style={{ width:'100%', padding:'14px', marginBottom:10, background:colors.red.gradient, color:'#fff', border:'none', borderRadius:radius.sm, fontWeight:700, fontSize:15, cursor:'pointer' }}>
          Confirmar sobreposição
        </button>
        <button onClick={onCancel} style={{ width:'100%', padding:'13px', background:'rgba(0,0,0,0.04)', border:`1px solid ${colors.gray.borderMd}`, borderRadius:radius.sm, fontSize:14, cursor:'pointer', color:colors.gray.dimText }}>
          Voltar
        </button>
      </div>
    </>
  )
}

// ─── Booking Card ─────────────────────────────────────────────────────────────
function MobileBookingCard({ booking, height }: { booking: AgendaBooking; height: number }) {
  const statusTheme = STATUS_CFG[booking.status] ?? STATUS_CFG.CONFIRMED
  const gradient    = booking.serviceColor ? colorToGradient(booking.serviceColor) : statusTheme.gradient
  const glow        = booking.serviceColor ? colorToGlow(booking.serviceColor)     : statusTheme.glow
  const isTiny      = height <= 32
  const showService = height >= 48
  const showTime    = height >= 64
  const dur         = toMinutes(booking.end) - toMinutes(booking.start)

  return (
    <div style={{ width:'100%', height:'100%', borderRadius:10, background:gradient, padding:isTiny?'0 8px 0 10px':'6px 8px 6px 10px', display:'flex', flexDirection:'column', justifyContent:isTiny?'center':'flex-start', gap:2, overflow:'hidden', boxSizing:'border-box', boxShadow:`0 3px 12px ${glow}`, border:'1px solid rgba(255,255,255,0.18)', position:'relative', userSelect:'none' }}>
      <div style={{ position:'absolute', top:0, left:0, right:0, height:'40%', background:'linear-gradient(180deg,rgba(255,255,255,0.16) 0%,transparent 100%)', borderRadius:'10px 10px 0 0', pointerEvents:'none' }} />
      <div style={{ position:'absolute', left:0, top:0, bottom:0, width:3, background:'rgba(255,255,255,0.45)', borderRadius:'10px 0 0 10px' }} />
      {isTiny ? (
        <div style={{ display:'flex', alignItems:'center', gap:5, overflow:'hidden' }}>
          <span style={{ fontSize:10, fontWeight:700, color:'#fff', opacity:0.9, fontVariantNumeric:'tabular-nums', whiteSpace:'nowrap', flexShrink:0 }}>{booking.start}–{booking.end}</span>
          <span style={{ fontSize:10, fontWeight:600, color:'#fff', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{booking.clientName}</span>
        </div>
      ) : (
        <>
          <div style={{ color:'#fff', fontWeight:700, fontSize:13, lineHeight:1.2, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{booking.clientName}</div>
          {showService && <div style={{ color:'rgba(255,255,255,0.85)', fontWeight:500, fontSize:11, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{booking.serviceName}</div>}
          {showTime && (
            <div style={{ marginTop:'auto', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
              <span style={{ color:'rgba(255,255,255,0.80)', fontSize:11, fontWeight:600, fontVariantNumeric:'tabular-nums' }}>{booking.start}–{booking.end}</span>
              <span style={{ color:'rgba(255,255,255,0.60)', fontSize:10 }}>{dur}min</span>
            </div>
          )}
        </>
      )}
    </div>
  )
}

// ─── ProfTabs ─────────────────────────────────────────────────────────────────
function ProfTabs({ professionals, selected, bookings, onChange }: {
  professionals: AgendaProfessional[]
  selected: string
  bookings: AgendaBooking[]
  onChange: (id: string) => void
}) {
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!scrollRef.current) return
    const el = scrollRef.current.querySelector('.ptab-active') as HTMLElement | null
    el?.scrollIntoView({ inline:'center', behavior:'smooth', block:'nearest' })
  }, [selected])

  if (professionals.length <= 1) return null

  return (
    <div ref={scrollRef} style={{ display:'flex', gap:6, padding:'8px 14px', overflowX:'auto', scrollbarWidth:'none', borderBottom:`1px solid ${colors.gray.border}`, background:'rgba(245,245,247,0.98)', backdropFilter:'blur(12px)', flexShrink:0 }}>
      {professionals.map(p => {
        const isActive  = p.id === selected
        const initials  = p.name.split(' ').slice(0,2).map(w=>w[0]).join('').toUpperCase()
        const count     = bookings.filter(b => b.professionalId === p.id).length
        return (
          <button key={p.id} className={isActive ? 'ptab-active' : ''} onClick={() => onChange(p.id)} style={{ display:'flex', alignItems:'center', gap:7, padding:'7px 13px', borderRadius:radius.full, border:`1px solid ${isActive ? 'transparent' : colors.gray.borderMd}`, background: isActive ? colors.red.gradient : colors.background.surface, cursor:'pointer', flexShrink:0, whiteSpace:'nowrap', boxShadow: isActive ? `0 3px 10px ${colors.red.glow}` : 'none', transition:`all ${transitions.spring}` }}>
            <div style={{ width:22, height:22, borderRadius:radius.full, background: isActive ? 'rgba(255,255,255,0.25)' : colors.red.subtle, display:'flex', alignItems:'center', justifyContent:'center', fontSize:9, fontWeight:700, color: isActive ? '#fff' : colors.red.DEFAULT, flexShrink:0 }}>
              {initials}
            </div>
            <span style={{ fontSize:12, fontWeight:600, color: isActive ? '#fff' : colors.gray[700] }}>
              {p.name.split(' ')[0]}
            </span>
            {count > 0 && (
              <span style={{ fontSize:10, fontWeight:700, padding:'1px 6px', borderRadius:radius.full, background: isActive ? 'rgba(255,255,255,0.25)' : colors.red.subtle, color: isActive ? '#fff' : colors.red.DEFAULT }}>
                {count}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}

// ─── Types ────────────────────────────────────────────────────────────────────
interface DragState { booking: AgendaBooking; profId: string; offsetY: number; ghostTop: number; ghostTime: string }

interface Props {
  professionals:     AgendaProfessional[]
  bookings:          AgendaBooking[]
  blocks:            AgendaBlock[]
  onDeleteBlock:     (id: string) => void
  onUpdateBlock:     (block: AgendaBlock) => void
  onOpenBlockModal?: (time?: string, profId?: string) => void
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function AgendaMobileList({ professionals, bookings, blocks, onDeleteBlock, onUpdateBlock, onOpenBlockModal }: Props) {
  const { openCreate, selectedDate, updateBooking } = useAgendaStore()
  const currentY = useCurrentTimeY()
  const dateStr  = dayjs(selectedDate).format('YYYY-MM-DD')

  const [activeProfId, setActiveProfId] = useState<string>(professionals[0]?.id ?? '')
  const vScrollRef = useRef<HTMLDivElement>(null)
  const colRef     = useRef<HTMLDivElement>(null)
  const dragRef    = useRef<DragState | null>(null)

  const [drag,      setDrag]      = useState<DragState | null>(null)
  const [conflict,  setConflict]  = useState<{ bookingId: string; startAt: string; professionalId: string } | null>(null)
  const [savingId,  setSavingId]  = useState<string | null>(null)
  const [editBlock, setEditBlock] = useState<AgendaBlock | null>(null)
  const [ctxMenu,   setCtxMenu]   = useState<{ x: number; y: number; time: string; profId: string } | null>(null)

  useEffect(() => {
    if (professionals.length > 0 && !professionals.find(p => p.id === activeProfId)) {
      setActiveProfId(professionals[0].id)
    }
  }, [professionals, activeProfId])

  const seen   = new Set<string>()
  const unique = bookings.filter(b => { if (seen.has(b.id)) return false; seen.add(b.id); return true })

  const profBookings = unique.filter(b => b.professionalId === activeProfId)
  const profBlocks   = blocks.filter(bl => bl.professionalId === activeProfId)
  const layout       = computeOverlapLayout(profBookings)

  useEffect(() => {
    if (currentY > 0 && vScrollRef.current) vScrollRef.current.scrollTop = Math.max(0, currentY - 120)
  }, [currentY, activeProfId])

  const doReschedule = useCallback(async (bookingId: string, time: string, professionalId: string, allowOverlap: boolean) => {
    const startAt = dayjs.tz(`${dateStr} ${time}`, 'America/Sao_Paulo').toISOString()
    try {
      setSavingId(bookingId)
      const res = await api.patch(`/bookings/${bookingId}/reschedule`, { startAt, professionalId, allowOverlap })
      const b   = res.data?.data ?? res.data
      if (b) updateBooking(dateStr, { id: bookingId, professionalId: b.professionalId ?? professionalId, clientName: b.clientName, serviceName: b.service?.name ?? '', serviceColor: b.service?.color ?? undefined, start: dayjs(b.startAt).tz('America/Sao_Paulo').format('HH:mm'), end: dayjs(b.endAt).tz('America/Sao_Paulo').format('HH:mm'), status: b.status })
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number } })?.response?.status
      const code   = (err as { response?: { data?: { code?: string } } })?.response?.data?.code
      if (status === 409 || code === 'BOOKING_CONFLICT') setConflict({ bookingId, startAt, professionalId })
    } finally { setSavingId(null) }
  }, [dateStr, updateBooking])

  function onCardTouchStart(e: React.TouchEvent, booking: AgendaBooking, cardTop: number) {
    e.stopPropagation()
    if (!colRef.current) return
    const touch  = e.touches[0]
    const rect   = colRef.current.getBoundingClientRect()
    const relY   = touch.clientY - rect.top + (vScrollRef.current?.scrollTop ?? 0)
    const offset = Math.max(0, relY - cardTop)
    const state: DragState = { booking, profId: activeProfId, offsetY: offset, ghostTop: cardTop, ghostTime: booking.start }
    dragRef.current = state; setDrag(state)
  }

  function onColTouchMove(e: React.TouchEvent) {
    if (!dragRef.current || !colRef.current) return
    e.preventDefault()
    const touch = e.touches[0]
    const rect  = colRef.current.getBoundingClientRect()
    const relY  = touch.clientY - rect.top + (vScrollRef.current?.scrollTop ?? 0) - dragRef.current.offsetY
    const snap  = Math.max(START_MIN, Math.min(snapToSlot(relY / PX_PER_MIN + START_MIN), END_HOUR * 60 - SLOT_STEP))
    const next: DragState = { ...dragRef.current, ghostTop: (snap - START_MIN) * PX_PER_MIN, ghostTime: minutesToTime(snap) }
    dragRef.current = next; setDrag(next)
  }

  function onColTouchEnd() {
    if (!dragRef.current) return
    const { booking, ghostTime, profId } = dragRef.current
    const changed = ghostTime !== booking.start
    dragRef.current = null; setDrag(null)
    if (changed) doReschedule(booking.id, ghostTime, profId, false)
  }

  function handleConflictConfirm() {
    if (!conflict) return
    const time = dayjs(conflict.startAt).tz('America/Sao_Paulo').format('HH:mm')
    const { bookingId, professionalId } = conflict
    setConflict(null); doReschedule(bookingId, time, professionalId, true)
  }

  return (
    <div style={{ height:'100%', display:'flex', flexDirection:'column', background:colors.background.page, fontFamily:typography.fontFamily, overflow:'hidden' }}>
      <style>{`
        .m-vscroll::-webkit-scrollbar{display:none}
        .m-slot{cursor:pointer;transition:background 0.1s}
        .m-slot:active{background:rgba(220,38,38,0.06)!important}
      `}</style>

      {conflict && <ConflictModal onConfirm={handleConflictConfirm} onCancel={() => setConflict(null)} />}

      {ctxMenu && (
        <SlotContextMenu
          x={ctxMenu.x} y={ctxMenu.y} time={ctxMenu.time} profId={ctxMenu.profId}
          onClose={() => setCtxMenu(null)}
          onNewBooking={(time, profId) => { openCreate(time, profId); setCtxMenu(null) }}
          onNewBlock={(time, profId)   => { onOpenBlockModal?.(time, profId); setCtxMenu(null) }}
        />
      )}

      {editBlock && (
        <BlockEditModal
          block={editBlock} professionals={professionals}
          onClose={() => setEditBlock(null)}
          onDeleted={(id) => { onDeleteBlock(id); setEditBlock(null) }}
          onUpdated={(updated) => { onUpdateBlock(updated); setEditBlock(null) }}
        />
      )}

      {/* Tabs de profissionais */}
      <ProfTabs
        professionals={professionals}
        selected={activeProfId}
        bookings={unique}
        onChange={id => {
          setActiveProfId(id)
          setTimeout(() => { if (currentY > 0 && vScrollRef.current) vScrollRef.current.scrollTop = Math.max(0, currentY - 120) }, 50)
        }}
      />

      {/* Resumo do dia */}
      {profBookings.length > 0 && (
        <div style={{ display:'flex', alignItems:'center', gap:10, padding:'7px 14px', flexShrink:0, background:'rgba(245,245,247,0.6)', borderBottom:`1px solid ${colors.gray.border}` }}>
          <div style={{ display:'flex', alignItems:'center', gap:5, flexShrink:0 }}>
            <div style={{ width:6, height:6, borderRadius:'50%', background:colors.red.DEFAULT, boxShadow:`0 0 5px ${colors.red.glow}` }} />
            <span style={{ fontSize:12, fontWeight:600, color:colors.gray[700] }}>
              {profBookings.length} agend.
            </span>
          </div>
          <div style={{ display:'flex', gap:4, overflowX:'auto', scrollbarWidth:'none', flex:1 }}>
            {profBookings.slice(0,5).map(b => (
              <span key={b.id} style={{ padding:'2px 8px', borderRadius:radius.full, background:colors.red.subtle, border:`1px solid ${colors.red.border}`, fontSize:11, fontWeight:600, color:colors.red.dark, whiteSpace:'nowrap', flexShrink:0 }}>
                {b.start}
              </span>
            ))}
            {profBookings.length > 5 && (
              <span style={{ padding:'2px 8px', borderRadius:radius.full, background:'rgba(0,0,0,0.05)', fontSize:11, color:colors.gray.dimText, flexShrink:0 }}>
                +{profBookings.length - 5}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Grade vertical */}
      <div ref={vScrollRef} className="m-vscroll" style={{ flex:1, overflowY:'auto', overflowX:'hidden', WebkitOverflowScrolling:'touch', position:'relative' }} onTouchMove={onColTouchMove} onTouchEnd={onColTouchEnd}>
        <div style={{ display:'flex', minHeight:TOTAL_H }}>

          {/* Coluna de horários */}
          <div style={{ width:TIME_COL_W, flexShrink:0, position:'sticky', left:0, zIndex:12, background:'rgba(245,245,247,0.98)', backdropFilter:'blur(8px)', borderRight:`1px solid ${colors.gray.border}` }}>
            {HALF_SLOTS.map((time, i) => {
              const isHour = i % 2 === 0
              return (
                <div key={time} style={{ height:ROW_H, display:'flex', alignItems:'flex-start', justifyContent:'flex-end', paddingRight:8, paddingTop:4, boxSizing:'border-box', borderTop:isHour?`1px solid ${colors.gray.border}`:`1px dashed rgba(0,0,0,0.06)` }}>
                  <span style={{ fontSize:isHour?11:10, fontWeight:isHour?600:400, color:isHour?colors.gray.dimText:colors.gray.dimTextLight, fontVariantNumeric:'tabular-nums', lineHeight:1 }}>{time}</span>
                </div>
              )
            })}
          </div>

          {/* Coluna principal */}
          <div ref={colRef} style={{ flex:1, position:'relative' }}>

            {/* Slots */}
            {HALF_SLOTS.map((time, i) => (
              <div key={time} className="m-slot" style={{ position:'absolute', top:i*ROW_H, left:0, right:0, height:ROW_H, borderTop:i%2===0?`1px solid ${colors.gray.border}`:`1px dashed rgba(0,0,0,0.05)` }}
                onClick={e => { if (drag) return; setCtxMenu({ x: e.clientX, y: e.clientY, time, profId: activeProfId }) }}
              />
            ))}

            {/* Hora atual */}
            {currentY >= 0 && (
              <div style={{ position:'absolute', top:currentY, left:0, right:0, height:2, background:`linear-gradient(90deg,${colors.red.DEFAULT},${colors.red.light})`, zIndex:15, pointerEvents:'none', boxShadow:`0 0 6px ${colors.red.glow}` }}>
                <div style={{ width:8, height:8, borderRadius:'50%', background:colors.red.DEFAULT, position:'absolute', left:-4, top:-3, boxShadow:`0 0 8px ${colors.red.glow}` }} />
              </div>
            )}

            {/* Bloqueios */}
            {profBlocks.map(bl => {
              const startMin = toMinutes(bl.startTime)
              const endMin   = toMinutes(bl.endTime)
              if (startMin < START_MIN || startMin >= END_HOUR * 60) return null
              const top    = (startMin - START_MIN) * PX_PER_MIN
              const height = Math.max((endMin - startMin) * PX_PER_MIN - 2, MIN_CARD_H)
              return (
                <div key={bl.id} style={{ position:'absolute', top, left:4, right:4, height, zIndex:7, cursor:'pointer' }} onClick={e => { e.stopPropagation(); setEditBlock(bl) }}>
                  <BlockCard block={bl} totalHeight={height} />
                </div>
              )
            })}

            {/* Agendamentos */}
            {profBookings.map(b => {
              const startMin = toMinutes(b.start)
              const endMin   = toMinutes(b.end)
              if (startMin < START_MIN || startMin >= END_HOUR * 60) return null
              const duration = Math.max(endMin - startMin, SLOT_STEP)
              const top      = (startMin - START_MIN) * PX_PER_MIN
              const height   = Math.max(duration * PX_PER_MIN - 2, MIN_CARD_H)
              const { col, totalCols } = layout.get(b.id) ?? { col:0, totalCols:1 }
              const colFrac  = 1 / totalCols
              const cardLeft = `calc(${col * colFrac * 100}% + 4px)`
              const cardWidth= `calc(${colFrac * 100}% - ${col === totalCols - 1 ? 8 : 4}px)`
              const isThisDrag = drag?.booking.id === b.id
              const isSaving   = savingId === b.id
              return (
                <div key={b.id} style={{ position:'absolute', top:isThisDrag?drag!.ghostTop:top, left:cardLeft, width:cardWidth, height, zIndex:isThisDrag?40:8, opacity:isSaving?0.5:1, transition:isThisDrag?'none':`top 0.12s ease, opacity 0.2s`, touchAction:'none', filter:isThisDrag?'drop-shadow(0 8px 24px rgba(0,0,0,0.32))':'none', transform:isThisDrag?'scale(1.025)':'scale(1)' }}
                  onTouchStart={e => onCardTouchStart(e, b, top)}>
                  <MobileBookingCard booking={b} height={height} />
                </div>
              )
            })}

            {/* Ghost label */}
            {drag && (
              <div style={{ position:'absolute', top:drag.ghostTop-18, left:0, right:0, textAlign:'center', fontSize:11, fontWeight:700, color:colors.red.DEFAULT, pointerEvents:'none', zIndex:41, fontVariantNumeric:'tabular-nums', textShadow:'0 1px 4px rgba(255,255,255,0.95)' }}>
                {drag.ghostTime}
              </div>
            )}

            {/* Estado vazio */}
            {profBookings.length === 0 && profBlocks.length === 0 && (
              <div style={{ position:'absolute', top:'28%', left:0, right:0, display:'flex', flexDirection:'column', alignItems:'center', gap:10, pointerEvents:'none' }}>
                <div style={{ fontSize:44, opacity:0.2 }}>📅</div>
                <span style={{ fontSize:14, color:colors.gray.dimText, fontWeight:500, opacity:0.5 }}>
                  Sem agendamentos hoje
                </span>
                <span style={{ fontSize:12, color:colors.gray.dimText, opacity:0.4 }}>
                  Toque em qualquer horário para agendar
                </span>
              </div>
            )}

            <div style={{ height:TOTAL_H }} />
          </div>
        </div>
      </div>
    </div>
  )
}