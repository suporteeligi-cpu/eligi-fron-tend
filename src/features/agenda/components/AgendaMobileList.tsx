'use client'
// src/features/agenda/components/AgendaMobileList.tsx

import { useState, useRef, useCallback, useEffect } from 'react'
import { AgendaProfessional, AgendaBooking, AgendaBlock } from '../types'
import { colors } from '@/shared/theme'
import { useAgendaStore } from '../hooks/useAgendaStore'
import { colorToGradient, colorToGlow } from '@/features/agenda/constants/serviceColors'
import { bookingStatus as STATUS_CFG } from '@/shared/theme'
import BlockCard from './BlockCard'
import api from '@/shared/lib/apiClient'
import dayjs from 'dayjs'
import timezone from 'dayjs/plugin/timezone'
import utc from 'dayjs/plugin/utc'

dayjs.extend(utc)
dayjs.extend(timezone)

// ─── Constantes ──────────────────────────────────────────────────────────────
const SLOT_STEP  = 5
const START_HOUR = 8
const END_HOUR   = 20
const ROW_H      = 64
const PX_PER_MIN = ROW_H / 30
const START_MIN  = START_HOUR * 60
const TIME_COL_W = 42
const COL_W      = 200
const MIN_CARD_H = 28

function toMinutes(t: string): number {
  const [h, m] = t.split(':').map(Number)
  return h * 60 + m
}
function minutesToTime(min: number): string {
  return `${String(Math.floor(min/60)).padStart(2,'0')}:${String(min%60).padStart(2,'0')}`
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
const COL_HEADER = 36

// ─── Overlap layout ───────────────────────────────────────────────────────────
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
  for (const group of groups)
    group.forEach((b, col) => result.set(b.id, { col, totalCols: group.length }))
  return result
}

// ─── Hora atual ───────────────────────────────────────────────────────────────
function useCurrentTimeY() {
  const [y, setY] = useState(-1)
  useEffect(() => {
    const calc = () => {
      const now = new Date()
      const min = now.getHours() * 60 + now.getMinutes()
      setY(min < START_MIN || min > END_HOUR * 60 ? -1 : (min - START_MIN) * PX_PER_MIN)
    }
    calc()
    const id = setInterval(calc, 30_000)
    return () => clearInterval(id)
  }, [])
  return y
}

// ─── Modal de conflito ────────────────────────────────────────────────────────
function ConflictModal({ onConfirm, onCancel }: { onConfirm: () => void; onCancel: () => void }) {
  return (
    <>
      <div onClick={onCancel} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.4)', backdropFilter:'blur(6px)', zIndex:9998 }} />
      <div style={{ position:'fixed', top:'50%', left:'50%', transform:'translate(-50%,-50%)', width:300, maxWidth:'88vw', background:'#fff', borderRadius:20, boxShadow:'0 24px 64px rgba(0,0,0,0.18)', zIndex:9999, padding:'24px 20px 18px', textAlign:'center', fontFamily:'-apple-system,"SF Pro Display",system-ui,sans-serif' }}>
        <div style={{ fontSize:32, marginBottom:10 }}>⚠️</div>
        <h3 style={{ margin:'0 0 8px', fontSize:16, fontWeight:700, color:'#111827' }}>Horário conflitante</h3>
        <p style={{ margin:'0 0 18px', fontSize:13, color:'#6b7280', lineHeight:1.5 }}>Já existe um agendamento nesse horário.<br/>Deseja agendar mesmo assim?</p>
        <button onClick={onConfirm} style={{ width:'100%', padding:'12px', marginBottom:8, background:'linear-gradient(135deg,#dc2626,#b91c1c)', color:'#fff', border:'none', borderRadius:12, fontWeight:600, fontSize:14, cursor:'pointer', boxShadow:'0 4px 16px rgba(220,38,38,0.28)' }}>Confirmar sobreposição</button>
        <button onClick={onCancel} style={{ width:'100%', padding:'10px', background:'rgba(0,0,0,0.04)', border:'1px solid rgba(0,0,0,0.08)', borderRadius:12, fontSize:14, cursor:'pointer', color:'rgba(0,0,0,0.5)' }}>Voltar</button>
      </div>
    </>
  )
}

// ─── MobileBookingCard ────────────────────────────────────────────────────────
function MobileBookingCard({ booking, height }: { booking: AgendaBooking; height: number }) {
  const statusTheme = STATUS_CFG[booking.status] ?? STATUS_CFG.CONFIRMED
  const gradient    = booking.serviceColor ? colorToGradient(booking.serviceColor) : statusTheme.gradient
  const glow        = booking.serviceColor ? colorToGlow(booking.serviceColor)     : statusTheme.glow

  const isTiny      = height <= 28
  const showService = height >= 44
  const showTime    = height >= 56
  const dur         = toMinutes(booking.end) - toMinutes(booking.start)

  return (
    <div style={{
      width:'100%', height:'100%', borderRadius:8,
      background:gradient,
      padding: isTiny ? '0 7px 0 9px' : '5px 7px 5px 9px',
      display:'flex', flexDirection:'column',
      justifyContent: isTiny ? 'center' : 'flex-start',
      gap:2, overflow:'hidden', boxSizing:'border-box',
      boxShadow:`0 3px 10px ${glow}`,
      border:'1px solid rgba(255,255,255,0.15)',
      position:'relative', userSelect:'none',
      transition:'transform 0.12s ease, box-shadow 0.12s ease',
    }}>
      <div style={{ position:'absolute', top:0, left:0, right:0, height:'45%', background:'linear-gradient(180deg,rgba(255,255,255,0.18) 0%,transparent 100%)', borderRadius:'8px 8px 0 0', pointerEvents:'none' }} />
      <div style={{ position:'absolute', left:0, top:0, bottom:0, width:3, background:'rgba(255,255,255,0.40)', borderRadius:'8px 0 0 8px' }} />

      {isTiny ? (
        <div style={{ display:'flex', alignItems:'center', gap:4, overflow:'hidden', lineHeight:1 }}>
          <span style={{ fontSize:10, fontWeight:700, opacity:0.9, fontVariantNumeric:'tabular-nums', whiteSpace:'nowrap', flexShrink:0, color:'#fff' }}>
            {booking.start}–{booking.end}
          </span>
          <span style={{ fontSize:10, fontWeight:600, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis', color:'#fff' }}>
            {booking.clientName}
            {booking.serviceName ? <span style={{ fontWeight:400, opacity:0.85 }}> · {booking.serviceName}</span> : null}
          </span>
        </div>
      ) : (
        <>
          <div style={{ color:'#fff', fontWeight:700, fontSize:12, lineHeight:1.2, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>
            {booking.clientName}
          </div>
          {showService && (
            <div style={{ color:'rgba(255,255,255,0.88)', fontWeight:500, fontSize:10, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>
              {booking.serviceName}
            </div>
          )}
          {showTime && (
            <div style={{ marginTop:'auto', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
              <span style={{ color:'rgba(255,255,255,0.82)', fontSize:10, fontWeight:600, fontVariantNumeric:'tabular-nums' }}>{booking.start}–{booking.end}</span>
              <span style={{ color:'rgba(255,255,255,0.65)', fontSize:9 }}>{dur}min</span>
            </div>
          )}
        </>
      )}
    </div>
  )
}

// ─── Drag state ───────────────────────────────────────────────────────────────
interface DragState {
  booking: AgendaBooking; profId: string
  offsetY: number; ghostTop: number; ghostTime: string
}

// ─── Main ─────────────────────────────────────────────────────────────────────
interface Props {
  professionals: AgendaProfessional[]
  bookings:      AgendaBooking[]
  blocks:        AgendaBlock[]
  onDeleteBlock: (id: string) => void
}

export default function AgendaMobileList({ professionals, bookings, blocks, onDeleteBlock }: Props) {
  const { openCreate, selectedDate, updateBooking } = useAgendaStore()
  const currentY = useCurrentTimeY()
  const dateStr  = dayjs(selectedDate).format('YYYY-MM-DD')

  const vScrollRef = useRef<HTMLDivElement>(null)
  const colRefs    = useRef<(HTMLDivElement | null)[]>([])
  const dragRef    = useRef<DragState | null>(null)

  const [drag,     setDrag]     = useState<DragState | null>(null)
  const [conflict, setConflict] = useState<{ bookingId: string; startAt: string; professionalId: string } | null>(null)
  const [savingId, setSavingId] = useState<string | null>(null)

  const seen = new Set<string>()
  const unique = bookings.filter(b => { if (seen.has(b.id)) return false; seen.add(b.id); return true })

  useEffect(() => {
    if (currentY > 0 && vScrollRef.current)
      vScrollRef.current.scrollTop = Math.max(0, currentY - 80)
  }, [currentY])

  const doReschedule = useCallback(async (
    bookingId: string, time: string, professionalId: string, allowOverlap: boolean
  ) => {
    const startAt = dayjs.tz(`${dateStr} ${time}`, 'America/Sao_Paulo').toISOString()
    try {
      setSavingId(bookingId)
      const res = await api.patch(`/bookings/${bookingId}/reschedule`, { startAt, professionalId, allowOverlap })
      const b   = res.data?.data ?? res.data
      if (b) {
        updateBooking(dateStr, {
          id:             bookingId,
          professionalId: b.professionalId ?? professionalId,
          clientName:     b.clientName,
          serviceName:    b.service?.name  ?? '',
          serviceColor:   b.service?.color ?? undefined,
          start:          dayjs(b.startAt).tz('America/Sao_Paulo').format('HH:mm'),
          end:            dayjs(b.endAt).tz('America/Sao_Paulo').format('HH:mm'),
          status:         b.status,
        })
      }
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number } })?.response?.status
      const code   = (err as { response?: { data?: { code?: string } } })?.response?.data?.code
      if (status === 409 || code === 'BOOKING_CONFLICT') {
        setConflict({ bookingId, startAt, professionalId })
      }
    } finally { setSavingId(null) }
  }, [dateStr, updateBooking])

  function onCardTouchStart(e: React.TouchEvent, booking: AgendaBooking, profId: string, cardTop: number) {
    e.stopPropagation()
    const touch  = e.touches[0]
    const colEl  = colRefs.current[professionals.findIndex(p => p.id === profId)]
    if (!colEl) return
    const rect   = colEl.getBoundingClientRect()
    const relY   = touch.clientY - rect.top + (vScrollRef.current?.scrollTop ?? 0) - COL_HEADER
    const offset = Math.max(0, relY - cardTop)
    const state: DragState = { booking, profId, offsetY: offset, ghostTop: cardTop, ghostTime: booking.start }
    dragRef.current = state
    setDrag(state)
  }

  function onColTouchMove(e: React.TouchEvent, profId: string, colIdx: number) {
    if (!dragRef.current) return
    e.preventDefault()
    const touch  = e.touches[0]
    const colEl  = colRefs.current[colIdx]
    if (!colEl) return
    const rect   = colEl.getBoundingClientRect()
    const relY   = touch.clientY - rect.top + (vScrollRef.current?.scrollTop ?? 0) - COL_HEADER - dragRef.current.offsetY
    const rawMin = relY / PX_PER_MIN + START_MIN
    const snap   = Math.max(START_MIN, Math.min(snapToSlot(rawMin), END_HOUR * 60 - SLOT_STEP))
    const next: DragState = { ...dragRef.current, ghostTop: (snap - START_MIN) * PX_PER_MIN, ghostTime: minutesToTime(snap), profId }
    dragRef.current = next
    setDrag(next)
  }

  function onColTouchEnd() {
    if (!dragRef.current) return
    const { booking, ghostTime, profId } = dragRef.current
    const changed = ghostTime !== booking.start || profId !== booking.professionalId
    dragRef.current = null
    setDrag(null)
    if (changed) doReschedule(booking.id, ghostTime, profId, false)
  }

  function handleConflictConfirm() {
    if (!conflict) return
    const time = dayjs(conflict.startAt).tz('America/Sao_Paulo').format('HH:mm')
    const { bookingId, professionalId } = conflict
    setConflict(null)
    doReschedule(bookingId, time, professionalId, true)
  }

  return (
    <div style={{ height:'100%', display:'flex', flexDirection:'column', background:colors.background.page, fontFamily:'-apple-system,"SF Pro Display",system-ui,sans-serif', overflow:'hidden' }}>

      {conflict && <ConflictModal onConfirm={handleConflictConfirm} onCancel={() => setConflict(null)} />}

      <style>{`
        .m-vscroll::-webkit-scrollbar { display:none; }
        .m-slot { cursor:pointer; }
        .m-slot:active { background:rgba(220,38,38,0.05) !important; }
      `}</style>

      <div ref={vScrollRef} className="m-vscroll" style={{ flex:1, overflowY:'auto', overflowX:'auto', WebkitOverflowScrolling:'touch', position:'relative' }}>
        <div style={{ display:'flex', minHeight:TOTAL_H+COL_HEADER, width:`${TIME_COL_W + professionals.length * (COL_W + 1)}px` }}>

          {/* Coluna horários — sticky left */}
          <div style={{ width:TIME_COL_W, flexShrink:0, position:'sticky', left:0, zIndex:12, background:'rgba(245,245,247,0.98)', backdropFilter:'blur(8px)', borderRight:`1px solid ${colors.gray.border}` }}>
            <div style={{ height:COL_HEADER, borderBottom:`1px solid ${colors.gray.border}` }} />
            {HALF_SLOTS.map((time, i) => {
              const isHour = i % 2 === 0
              return (
                <div key={time} style={{ height:ROW_H, display:'flex', alignItems:'flex-start', justifyContent:'flex-end', paddingRight:6, paddingTop:3, boxSizing:'border-box', borderTop:isHour?`1px solid ${colors.gray.border}`:`1px dashed rgba(0,0,0,0.06)` }}>
                  <span style={{ fontSize:isHour?10:9, fontWeight:isHour?600:400, color:isHour?colors.gray.dimText:colors.gray.dimTextLight, fontVariantNumeric:'tabular-nums', lineHeight:1 }}>{time}</span>
                </div>
              )
            })}
          </div>

          {/* Colunas profissionais */}
          {professionals.map((p, colIdx) => {
            const profBookings = unique.filter(b => b.professionalId === p.id)
            const profBlocks   = blocks.filter(bl => bl.professionalId === p.id)
            const layout       = computeOverlapLayout(profBookings)
            const isDragCol    = drag?.profId === p.id
            const initials     = p.name.split(' ').slice(0,2).map(w=>w[0]).join('').toUpperCase()

            return (
              <div
                key={p.id}
                ref={el => { colRefs.current[colIdx] = el }}
                style={{ width:COL_W, flexShrink:0, position:'relative', borderRight:`1px solid ${colors.gray.border}` }}
                onTouchMove={e => onColTouchMove(e, p.id, colIdx)}
                onTouchEnd={onColTouchEnd}
              >
                {/* Header sticky */}
                <div style={{ position:'sticky', top:0, zIndex:10, height:COL_HEADER, background:'rgba(255,255,255,0.97)', backdropFilter:'blur(16px)', borderBottom:`1px solid ${colors.gray.border}`, display:'flex', alignItems:'center', justifyContent:'center', gap:6 }}>
                  <div style={{ width:22, height:22, borderRadius:'50%', background:colors.red.gradient, color:'#fff', fontSize:9, fontWeight:700, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, boxShadow:`0 2px 6px ${colors.red.glow}` }}>{initials}</div>
                  <span style={{ fontSize:11, fontWeight:600, color:colors.gray['900'], whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis', maxWidth:110 }}>{p.name}</span>
                </div>

                {/* Área de bookings + bloqueios */}
                <div style={{ position:'relative', height:TOTAL_H }}>

                  {/* Slots clicáveis */}
                  {HALF_SLOTS.map((time, i) => {
                    const isHour = i % 2 === 0
                    return (
                      <div key={time} className="m-slot" style={{ position:'absolute', top:i*ROW_H, left:0, right:0, height:ROW_H, borderTop:isHour?`1px solid ${colors.gray.border}`:`1px dashed rgba(0,0,0,0.05)` }} onClick={() => !drag && openCreate(time, p.id)} />
                    )
                  })}

                  {/* Indicador hora atual */}
                  {currentY >= 0 && (
                    <div style={{ position:'absolute', top:currentY, left:0, right:0, height:2, background:`linear-gradient(90deg,${colors.red.DEFAULT},${colors.red.light})`, zIndex:15, pointerEvents:'none', boxShadow:`0 0 5px ${colors.red.glow}` }}>
                      <div style={{ width:6, height:6, borderRadius:'50%', background:colors.red.DEFAULT, position:'absolute', left:-3, top:-2 }} />
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
                      <div key={bl.id} style={{ position:'absolute', top, left:3, right:3, height, zIndex:7 }}>
                        <BlockCard block={bl} totalHeight={height} onDelete={onDeleteBlock} />
                      </div>
                    )
                  })}

                  {/* Bookings */}
                  {profBookings.map(b => {
                    const startMin = toMinutes(b.start)
                    const endMin   = toMinutes(b.end)
                    if (startMin < START_MIN || startMin >= END_HOUR * 60) return null

                    const duration  = Math.max(endMin - startMin, SLOT_STEP)
                    const top       = (startMin - START_MIN) * PX_PER_MIN
                    const height    = Math.max(duration * PX_PER_MIN - 2, MIN_CARD_H)

                    const { col, totalCols } = layout.get(b.id) ?? { col:0, totalCols:1 }
                    const colFrac   = 1 / totalCols
                    const cardLeft  = `calc(${col * colFrac * 100}% + 3px)`
                    const cardWidth = `calc(${colFrac * 100}% - ${col === totalCols - 1 ? 6 : 3}px)`

                    const isThisDrag = isDragCol && drag?.booking.id === b.id
                    const isSaving   = savingId === b.id

                    return (
                      <div
                        key={b.id}
                        style={{
                          position:'absolute',
                          top:    isThisDrag ? drag!.ghostTop : top,
                          left:   cardLeft, width:cardWidth, height,
                          zIndex: isThisDrag ? 40 : 8,
                          opacity: isSaving ? 0.5 : 1,
                          transition: isThisDrag ? 'none' : 'top 0.12s ease, opacity 0.2s',
                          touchAction:'none',
                          filter: isThisDrag ? 'drop-shadow(0 6px 18px rgba(0,0,0,0.3))' : 'none',
                          transform: isThisDrag ? 'scale(1.02)' : 'scale(1)',
                        }}
                        onTouchStart={e => onCardTouchStart(e, b, p.id, top)}
                      >
                        <MobileBookingCard booking={b} height={height} />
                      </div>
                    )
                  })}

                  {/* Ghost time label */}
                  {isDragCol && drag && (
                    <div style={{ position:'absolute', top:drag.ghostTop-14, left:0, right:0, textAlign:'center', fontSize:10, fontWeight:700, color:colors.red.DEFAULT, pointerEvents:'none', zIndex:41, fontVariantNumeric:'tabular-nums', textShadow:'0 1px 3px rgba(255,255,255,0.9)' }}>
                      {drag.ghostTime}
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}