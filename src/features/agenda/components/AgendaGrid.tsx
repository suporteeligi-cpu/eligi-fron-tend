'use client'
// src/features/agenda/components/AgendaGrid.tsx

import { useRef, useEffect, useState, useCallback } from 'react'
import BookingCard from './BookingCard'
import BlockCard   from './BlockCard'
import { AgendaProfessional, AgendaBooking, AgendaBlock } from '../types'
import { colors, agendaLayout } from '@/shared/theme'
import { useAgendaStore } from '../hooks/useAgendaStore'
import api from '@/shared/lib/apiClient'
import dayjs from 'dayjs'
import timezone from 'dayjs/plugin/timezone'
import utc from 'dayjs/plugin/utc'

dayjs.extend(utc)
dayjs.extend(timezone)

// ─── Constantes ───────────────────────────────────────────────────────────────
const START_HOUR = agendaLayout.startHour
const END_HOUR   = agendaLayout.endHour
const TIME_COL_W = agendaLayout.timeColWidth
const MIN_COL_W  = agendaLayout.minColWidth
const HEADER_H   = agendaLayout.headerHeight

const SLOT_STEP  = 5
const SLOT_H     = 10
const PX_PER_MIN = SLOT_H / SLOT_STEP
const START_MIN  = START_HOUR * 60
const MIN_CARD_H = 24

// ─── Utilitários ──────────────────────────────────────────────────────────────
function generateSlots(): string[] {
  const slots: string[] = []
  for (let h = START_HOUR; h < END_HOUR; h++)
    for (let m = 0; m < 60; m += SLOT_STEP)
      slots.push(`${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`)
  return slots
}

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

const SLOTS   = generateSlots()
const TOTAL_H = SLOTS.length * SLOT_H

// ─── Overlap layout ───────────────────────────────────────────────────────────
function computeOverlapLayout(bookings: AgendaBooking[]): Map<string, { col: number; totalCols: number }> {
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
      <div onClick={onCancel} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.3)', backdropFilter:'blur(6px)', zIndex:9998 }} />
      <div style={{ position:'fixed', top:'50%', left:'50%', transform:'translate(-50%,-50%)', width:320, maxWidth:'90vw', background:'#fff', borderRadius:20, boxShadow:'0 24px 64px rgba(0,0,0,0.18)', zIndex:9999, padding:'28px 24px 20px', fontFamily:'-apple-system,"SF Pro Display",system-ui,sans-serif', textAlign:'center' }}>
        <div style={{ fontSize:36, marginBottom:12 }}>⚠️</div>
        <h3 style={{ margin:'0 0 8px', fontSize:17, fontWeight:700, color:'#111827' }}>Horário conflitante</h3>
        <p style={{ margin:'0 0 20px', fontSize:13, color:'#6b7280', lineHeight:1.5 }}>Já existe um agendamento nesse horário.<br/>Deseja agendar mesmo assim e exibir os dois lado a lado?</p>
        <button onClick={onConfirm} style={{ width:'100%', padding:'13px', marginBottom:8, background:'linear-gradient(135deg,#dc2626,#b91c1c)', color:'#fff', border:'none', borderRadius:12, fontWeight:600, fontSize:14, cursor:'pointer', boxShadow:'0 4px 16px rgba(220,38,38,0.28)' }}>Confirmar sobreposição</button>
        <button onClick={onCancel} style={{ width:'100%', padding:'11px', background:'rgba(0,0,0,0.04)', border:'1px solid rgba(0,0,0,0.08)', borderRadius:12, fontSize:14, cursor:'pointer', color:'rgba(0,0,0,0.5)' }}>Voltar</button>
      </div>
    </>
  )
}

// ─── Drag state ───────────────────────────────────────────────────────────────
interface DragState {
  bookingId: string; booking: AgendaBooking; fromProfId: string
  ghostTop: number; ghostLeft: number; ghostWidth: number; ghostHeight: number
  offsetY: number; currentProfId: string; currentTime: string
}

// ─── Props ────────────────────────────────────────────────────────────────────
interface Props {
  professionals:    AgendaProfessional[]
  bookings:         AgendaBooking[]
  blocks:           AgendaBlock[]
  onOpenBlockModal?:(time?: string, profId?: string) => void
  onDeleteBlock?:   (id: string) => void
}

export default function AgendaGrid({ professionals, bookings, blocks, onOpenBlockModal, onDeleteBlock }: Props) {
  const { openCreate, selectedDate, updateBooking } = useAgendaStore()
  const scrollRef = useRef<HTMLDivElement>(null)
  const gridRef   = useRef<HTMLDivElement>(null)
  const currentY  = useCurrentTimeY()

  const [drag,     setDrag]     = useState<DragState | null>(null)
  const [conflict, setConflict] = useState<{ bookingId: string; startAt: string; professionalId: string } | null>(null)
  const [savingId, setSavingId] = useState<string | null>(null)

  // Deduplicação
  const seen   = new Set<string>()
  const unique = bookings.filter(b => { if (seen.has(b.id)) return false; seen.add(b.id); return true })

  // Scroll para hora atual
  useEffect(() => {
    if (currentY > 0 && scrollRef.current)
      scrollRef.current.scrollTop = Math.max(0, currentY - 120)
  }, [currentY])

  // ── Reschedule ────────────────────────────────────────────────────────────────
  const doReschedule = useCallback(async (
    bookingId: string, time: string, professionalId: string, allowOverlap: boolean
  ) => {
    const dateStr = dayjs(selectedDate).format('YYYY-MM-DD')
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
      } else {
        console.error('[AgendaGrid] reschedule error:', err)
      }
    } finally { setSavingId(null) }
  }, [selectedDate, updateBooking])

  // ── Drag ──────────────────────────────────────────────────────────────────────
  function onCardMouseDown(e: React.MouseEvent, booking: AgendaBooking, profId: string, cardTop: number, cardHeight: number) {
    e.preventDefault(); e.stopPropagation()
    const scrollTop = scrollRef.current?.scrollTop ?? 0
    const offsetY   = Math.max(0, e.clientY - (HEADER_H - scrollTop + cardTop))
    setDrag({ bookingId: booking.id, booking, fromProfId: profId, ghostTop: cardTop, ghostLeft: 0, ghostWidth: 0, ghostHeight: cardHeight, offsetY, currentProfId: profId, currentTime: booking.start })
  }

  useEffect(() => {
    if (!drag) return
    function onMouseMove(e: MouseEvent) {
      if (!drag || !gridRef.current || !scrollRef.current) return
      const gridRect   = gridRef.current.getBoundingClientRect()
      const scrollTop  = scrollRef.current.scrollTop
      const scrollLeft = scrollRef.current.scrollLeft
      const relY    = e.clientY - gridRect.top + scrollTop - HEADER_H - drag.offsetY
      const rawMin  = relY / PX_PER_MIN + START_MIN
      const snapMin = Math.max(START_MIN, Math.min(snapToSlot(rawMin), END_HOUR * 60 - SLOT_STEP))
      const relX   = e.clientX - gridRect.left + scrollLeft - TIME_COL_W
      const colW   = (gridRect.width - TIME_COL_W) / professionals.length
      const colIdx = Math.max(0, Math.min(Math.floor(relX / colW), professionals.length - 1))
      const prof   = professionals[colIdx]
      setDrag(prev => prev ? { ...prev, ghostTop: (snapMin - START_MIN) * PX_PER_MIN, ghostLeft: TIME_COL_W + colIdx * colW + 4, ghostWidth: colW - 8, currentProfId: prof?.id ?? prev.currentProfId, currentTime: minutesToTime(snapMin) } : null)
    }
    function onMouseUp() {
      if (!drag) return
      const { bookingId, currentTime, currentProfId, fromProfId, booking } = drag
      const changed = currentTime !== booking.start || currentProfId !== fromProfId
      setDrag(null)
      if (changed) doReschedule(bookingId, currentTime, currentProfId, false)
    }
    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup',   onMouseUp)
    return () => { window.removeEventListener('mousemove', onMouseMove); window.removeEventListener('mouseup', onMouseUp) }
  }, [drag, professionals, doReschedule])

  function handleConflictConfirm() {
    if (!conflict) return
    const time = dayjs(conflict.startAt).tz('America/Sao_Paulo').format('HH:mm')
    const { bookingId, professionalId } = conflict
    setConflict(null)
    doReschedule(bookingId, time, professionalId, true)
  }

  return (
    <>
      {conflict && <ConflictModal onConfirm={handleConflictConfirm} onCancel={() => setConflict(null)} />}

      <div ref={scrollRef} style={{ flex:1, minHeight:0, overflowY:'auto', overflowX:'auto', background:colors.background.page, fontFamily:'-apple-system,"SF Pro Display",system-ui,sans-serif', cursor:drag?'grabbing':'default', userSelect:drag?'none':'auto' }}>
        <style>{`
          .ag-slot{height:${SLOT_H}px;cursor:pointer;box-sizing:border-box;transition:background 0.1s}
          .ag-slot:hover{background:${colors.red.subtle}!important}
          .ag-hour{border-top:1px solid ${colors.gray.border}}
          .ag-half{border-top:1px dashed rgba(0,0,0,0.06)}
          .ag-5{border-top:1px solid transparent}
        `}</style>

        <div ref={gridRef} style={{ display:'grid', gridTemplateColumns:`${TIME_COL_W}px repeat(${professionals.length},minmax(${MIN_COL_W}px,1fr))`, minWidth:`${TIME_COL_W + professionals.length * MIN_COL_W}px` }}>

          {/* Header canto */}
          <div style={{ height:HEADER_H, position:'sticky', top:0, zIndex:20, background:'rgba(255,255,255,0.95)', backdropFilter:'blur(20px)', borderBottom:`1px solid ${colors.gray.border}`, borderRight:`1px solid ${colors.gray.border}` }} />

          {/* Header profissionais */}
          {professionals.map(p => {
            const initials = p.name.split(' ').slice(0,2).map(w=>w[0]).join('').toUpperCase()
            return (
              <div key={p.id} style={{ height:HEADER_H, display:'flex', alignItems:'center', justifyContent:'center', gap:8, position:'sticky', top:0, zIndex:20, background:'rgba(255,255,255,0.95)', backdropFilter:'blur(20px)', borderBottom:`1px solid ${colors.gray.border}`, borderLeft:`1px solid ${colors.gray.border}`, fontWeight:600, fontSize:13, color:colors.gray['900'] }}>
                <div style={{ width:30, height:30, borderRadius:'50%', background:colors.red.gradient, color:'#fff', fontSize:11, fontWeight:700, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, boxShadow:`0 2px 8px ${colors.red.glow}` }}>{initials}</div>
                <span style={{ overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', maxWidth:100 }}>{p.name}</span>
              </div>
            )
          })}

          {/* Coluna horários */}
          <div style={{ position:'relative', zIndex:2, height:TOTAL_H }}>
            {SLOTS.map((time, i) => {
              const min = i * SLOT_STEP, isHour = min % 60 === 0, isHalf = min % 30 === 0 && !isHour
              return (
                <div key={time} style={{ height:SLOT_H, display:'flex', alignItems:'flex-start', justifyContent:'flex-end', paddingRight:8, paddingTop:2, boxSizing:'border-box', borderTop:isHour?`1px solid ${colors.gray.border}`:isHalf?`1px dashed rgba(0,0,0,0.07)`:'1px solid transparent' }}>
                  {isHour && <span style={{ fontSize:10, fontWeight:600, color:colors.gray.dimText, fontVariantNumeric:'tabular-nums', lineHeight:1 }}>{time}</span>}
                  {isHalf && <span style={{ fontSize:9, fontWeight:400, color:colors.gray.dimTextLight, fontVariantNumeric:'tabular-nums', lineHeight:1 }}>{time}</span>}
                </div>
              )
            })}
          </div>

          {/* Colunas profissionais */}
          {professionals.map(p => {
            const profBookings = unique.filter(b => b.professionalId === p.id)
            const profBlocks   = blocks.filter(bl => bl.professionalId === p.id)
            const layout       = computeOverlapLayout(profBookings)

            return (
              <div key={p.id} style={{ position:'relative', borderLeft:`1px solid ${colors.gray.border}`, zIndex:5, height:TOTAL_H }}>

                {/* Slots clicáveis */}
                {SLOTS.map((time, i) => {
                  const min = i * SLOT_STEP, isHour = min % 60 === 0, isHalf = min % 30 === 0 && !isHour
                  return (
                    <div
                      key={time}
                      className={`ag-slot ${isHour?'ag-hour':isHalf?'ag-half':'ag-5'}`}
                      onClick={() => !drag && openCreate(time, p.id)}
                      onContextMenu={e => { e.preventDefault(); onOpenBlockModal?.(time, p.id) }}
                    />
                  )
                })}

                {/* Bloqueios — zIndex 7, abaixo dos bookings (8) */}
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

                  const durationMin = Math.max(endMin - startMin, SLOT_STEP)
                  const top         = (startMin - START_MIN) * PX_PER_MIN
                  const height      = Math.max(durationMin * PX_PER_MIN - 2, MIN_CARD_H)

                  const { col, totalCols } = layout.get(b.id) ?? { col:0, totalCols:1 }
                  const colFrac = 1 / totalCols
                  const left    = `calc(${col * colFrac * 100}% + 3px)`
                  const width   = `calc(${colFrac * 100}% - ${col === totalCols - 1 ? 6 : 3}px)`

                  const isDragging = drag?.bookingId === b.id
                  const isSaving   = savingId === b.id

                  return (
                    <div key={b.id} style={{ position:'absolute', top, left, width, height, zIndex:isDragging?0:8, opacity:isDragging?0.3:isSaving?0.6:1, transition:isDragging?'none':'opacity 0.2s', cursor:'grab' }}
                      onMouseDown={e => onCardMouseDown(e, b, p.id, top, height)}>
                      <BookingCard booking={b} totalHeight={height} />
                    </div>
                  )
                })}

                {/* Hora atual */}
                {currentY >= 0 && (
                  <div style={{ position:'absolute', top:currentY, left:0, right:0, height:2, background:`linear-gradient(90deg,${colors.red.DEFAULT},${colors.red.light})`, zIndex:15, pointerEvents:'none', boxShadow:`0 0 6px ${colors.red.glow}` }}>
                    <div style={{ width:8, height:8, borderRadius:'50%', background:colors.red.DEFAULT, position:'absolute', left:-4, top:-3, boxShadow:`0 0 6px ${colors.red.glow}` }} />
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Ghost drag */}
        {drag && (
          <div style={{ position:'fixed', top:drag.ghostTop+HEADER_H-(scrollRef.current?.scrollTop??0)+(scrollRef.current?.getBoundingClientRect().top??0), left:drag.ghostLeft+(scrollRef.current?.getBoundingClientRect().left??0)-(scrollRef.current?.scrollLeft??0), width:drag.ghostWidth, height:drag.ghostHeight, zIndex:9997, pointerEvents:'none', opacity:0.88, filter:'drop-shadow(0 8px 24px rgba(0,0,0,0.25))', transform:'scale(1.02)' }}>
            <BookingCard booking={drag.booking} totalHeight={drag.ghostHeight} />
            <div style={{ position:'absolute', bottom:-20, left:0, right:0, textAlign:'center', fontSize:11, fontWeight:700, color:colors.red.DEFAULT, fontVariantNumeric:'tabular-nums', textShadow:'0 1px 4px rgba(255,255,255,0.9)' }}>{drag.currentTime}</div>
          </div>
        )}
      </div>
    </>
  )
}