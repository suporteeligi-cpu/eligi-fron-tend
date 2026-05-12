'use client'
// src/features/agenda/components/AgendaMobileList.tsx

import { useState, useMemo, useRef, useCallback } from 'react'
import { AgendaProfessional, AgendaBooking } from '../types'
import { colors, transitions } from '@/shared/theme'
import { useAgendaStore } from '../hooks/useAgendaStore'
import BookingCard from './BookingCard'
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
const ROW_H      = 52    // altura de cada slot na timeline (px)
const PX_PER_MIN = ROW_H / 30  // 30min = ROW_H px → cada minuto = ROW_H/30 px
const START_MIN  = START_HOUR * 60
const TIME_COL_W = 44   // largura da coluna de horários (px)

function generateSlots(): string[] {
  const slots: string[] = []
  for (let h = START_HOUR; h < END_HOUR; h++)
    for (let m = 0; m < 60; m += 30)   // labels só em hora e meia-hora
      slots.push(`${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`)
  return slots
}

function toMinutes(t: string): number {
  const [h, m] = t.split(':').map(Number)
  return h * 60 + m
}

function snapToSlot(min: number): number {
  return Math.round(min / SLOT_STEP) * SLOT_STEP
}

function minutesToTime(min: number): string {
  return `${String(Math.floor(min/60)).padStart(2,'0')}:${String(min%60).padStart(2,'0')}`
}

const SLOTS = generateSlots()
const TOTAL_H = SLOTS.length * ROW_H

// ─── Modal de conflito ───────────────────────────────────────────────────────
function ConflictModal({ onConfirm, onCancel }: { onConfirm: () => void; onCancel: () => void }) {
  return (
    <>
      <div onClick={onCancel} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.35)', backdropFilter:'blur(6px)', zIndex:9998 }} />
      <div style={{
        position:'fixed', top:'50%', left:'50%', transform:'translate(-50%,-50%)',
        width:300, maxWidth:'88vw', background:'#fff', borderRadius:20,
        boxShadow:'0 24px 64px rgba(0,0,0,0.18)', zIndex:9999,
        padding:'24px 20px 18px', textAlign:'center',
        fontFamily:'-apple-system,"SF Pro Display",system-ui,sans-serif',
      }}>
        <div style={{ fontSize:32, marginBottom:10 }}>⚠️</div>
        <h3 style={{ margin:'0 0 8px', fontSize:16, fontWeight:700, color:'#111827' }}>Horário conflitante</h3>
        <p style={{ margin:'0 0 18px', fontSize:13, color:'#6b7280', lineHeight:1.5 }}>
          Já existe um agendamento nesse horário.<br/>Deseja agendar mesmo assim?
        </p>
        <button onClick={onConfirm} style={{
          width:'100%', padding:'12px', marginBottom:8,
          background:'linear-gradient(135deg,#dc2626,#b91c1c)',
          color:'#fff', border:'none', borderRadius:12,
          fontWeight:600, fontSize:14, cursor:'pointer',
        }}>Confirmar sobreposição</button>
        <button onClick={onCancel} style={{
          width:'100%', padding:'10px',
          background:'rgba(0,0,0,0.04)', border:'1px solid rgba(0,0,0,0.08)',
          borderRadius:12, fontSize:14, cursor:'pointer', color:'rgba(0,0,0,0.5)',
        }}>Voltar</button>
      </div>
    </>
  )
}

// ─── Props ───────────────────────────────────────────────────────────────────
interface Props {
  professionals: AgendaProfessional[]
  bookings:      AgendaBooking[]
}

export default function AgendaMobileList({ professionals, bookings }: Props) {
  const { openCreate, selectedDate, updateBooking } = useAgendaStore()
  const [currentProf, setCurrentProf] = useState<string | null>(professionals[0]?.id ?? null)
  const [conflict, setConflict]       = useState<{ bookingId: string; startAt: string; professionalId: string } | null>(null)
  const [savingId, setSavingId]       = useState<string | null>(null)
  const [dragId, setDragId]           = useState<string | null>(null)
  const [ghostTop, setGhostTop]       = useState(0)
  const [ghostTime, setGhostTime]     = useState('')

  const scrollRef   = useRef<HTMLDivElement>(null)
  const timelineRef = useRef<HTMLDivElement>(null)
  const dragMeta    = useRef<{ booking: AgendaBooking; offsetY: number } | null>(null)

  const dateStr     = dayjs(selectedDate).format('YYYY-MM-DD')

  const profBookings = useMemo(
    () => bookings.filter(b => !currentProf || b.professionalId === currentProf),
    [bookings, currentProf]
  )

  // ─── API reschedule ────────────────────────────────────────────────────────
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
          serviceName:    b.service?.name ?? '',
          start:          dayjs(b.startAt).tz('America/Sao_Paulo').format('HH:mm'),
          end:            dayjs(b.endAt).tz('America/Sao_Paulo').format('HH:mm'),
          status:         b.status,
        })
      }
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number } })?.response?.status
      const code   = (err as { response?: { data?: { code?: string } } })?.response?.data?.code
      if (status === 409 || code === 'BOOKING_CONFLICT') {
        const startAt = dayjs.tz(`${dateStr} ${time}`, 'America/Sao_Paulo').toISOString()
        setConflict({ bookingId, startAt, professionalId })
      }
    } finally {
      setSavingId(null)
    }
  }, [dateStr, updateBooking])

  // ─── Touch drag ───────────────────────────────────────────────────────────
  function onTouchStart(e: React.TouchEvent, booking: AgendaBooking, cardTop: number) {
    e.stopPropagation()
    const touch   = e.touches[0]
    const tlRect  = timelineRef.current?.getBoundingClientRect()
    if (!tlRect) return
    const relY    = touch.clientY - tlRect.top + (scrollRef.current?.scrollTop ?? 0)
    const offsetY = relY - cardTop
    dragMeta.current = { booking, offsetY: Math.max(0, offsetY) }
    setDragId(booking.id)
    setGhostTop(cardTop)
    setGhostTime(booking.start)
  }

  function onTouchMove(e: React.TouchEvent) {
    if (!dragMeta.current || !timelineRef.current) return
    e.preventDefault()
    const touch   = e.touches[0]
    const tlRect  = timelineRef.current.getBoundingClientRect()
    const relY    = touch.clientY - tlRect.top + (scrollRef.current?.scrollTop ?? 0) - dragMeta.current.offsetY
    const rawMin  = relY / PX_PER_MIN + START_MIN
    const snapMin = Math.max(START_MIN, Math.min(snapToSlot(rawMin), END_HOUR * 60 - SLOT_STEP))
    setGhostTop((snapMin - START_MIN) * PX_PER_MIN)
    setGhostTime(minutesToTime(snapMin))
  }

  function onTouchEnd() {
    if (!dragMeta.current) return
    const { booking } = dragMeta.current
    const profId = currentProf ?? booking.professionalId
    const changed = ghostTime !== booking.start
    dragMeta.current = null
    setDragId(null)
    if (changed) doReschedule(booking.id, ghostTime, profId, false)
  }

  // ─── Conflict modal ────────────────────────────────────────────────────────
  function handleConflictConfirm() {
    if (!conflict) return
    const time = dayjs(conflict.startAt).tz('America/Sao_Paulo').format('HH:mm')
    const { bookingId, professionalId } = conflict
    setConflict(null)
    doReschedule(bookingId, time, professionalId, true)
  }

  return (
    <div style={{ height:'100%', display:'flex', flexDirection:'column', background:colors.background.page, fontFamily:'-apple-system,"SF Pro Display",system-ui,sans-serif' }}>
      {conflict && <ConflictModal onConfirm={handleConflictConfirm} onCancel={() => setConflict(null)} />}

      <style>{`
        .m-prof-chip { flex-shrink:0; padding:5px 14px; border-radius:20px; font-size:12px; font-weight:500; cursor:pointer; border:1px solid ${colors.gray.borderMd}; background:rgba(255,255,255,0.8); color:${colors.gray['700']}; transition:${transitions.spring}; white-space:nowrap; }
        .m-prof-chip.active { background:${colors.red.gradient}; color:#fff; border-color:transparent; box-shadow:0 3px 10px ${colors.red.glow}; }
        .m-slot-free { display:flex; align-items:center; height:100%; cursor:pointer; }
        .m-slot-free:active { background:${colors.red.subtle}; }
      `}</style>

      {/* Filtro profissional */}
      {professionals.length > 1 && (
        <div style={{ display:'flex', gap:6, padding:'10px 14px', overflowX:'auto', scrollbarWidth:'none', borderBottom:`1px solid ${colors.gray.border}`, background:'rgba(255,255,255,0.88)', backdropFilter:'blur(20px)', flexShrink:0 }}>
          <button className={`m-prof-chip${!currentProf?' active':''}`} onClick={() => setCurrentProf(null)}>Todos</button>
          {professionals.map(p => (
            <button key={p.id} className={`m-prof-chip${currentProf===p.id?' active':''}`} onClick={() => setCurrentProf(p.id)}>{p.name}</button>
          ))}
        </div>
      )}

      {/* Header: título + botão novo */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'12px 16px 8px', flexShrink:0 }}>
        <span style={{ fontSize:14, fontWeight:600, color:colors.gray['900'] }}>Horários do dia</span>
        <button
          onClick={() => openCreate('09:00', currentProf ?? professionals[0]?.id ?? '')}
          style={{ padding:'6px 14px', borderRadius:10, background:colors.red.gradient, border:'none', fontSize:12, fontWeight:600, cursor:'pointer', color:'#fff', boxShadow:`0 3px 10px ${colors.red.glow}` }}
        >
          + Novo
        </button>
      </div>

      {/* Timeline */}
      <div
        ref={scrollRef}
        style={{ flex:1, overflowY:'auto', overflowX:'hidden', WebkitOverflowScrolling:'touch' }}
        onTouchMove={dragId ? onTouchMove : undefined}
        onTouchEnd={dragId ? onTouchEnd : undefined}
      >
        <div
          ref={timelineRef}
          style={{ display:'flex', position:'relative', height:TOTAL_H }}
        >
          {/* Coluna de horários */}
          <div style={{ width:TIME_COL_W, flexShrink:0, position:'relative', borderRight:`1px solid ${colors.gray.border}` }}>
            {SLOTS.map((time, i) => {
              const isHour = i % 2 === 0
              return (
                <div key={time} style={{
                  position:'absolute', top: i * ROW_H, left:0, right:0, height:ROW_H,
                  display:'flex', alignItems:'flex-start', justifyContent:'flex-end',
                  paddingRight:8, paddingTop:3, boxSizing:'border-box',
                  borderTop: isHour ? `1px solid ${colors.gray.border}` : `1px dashed rgba(0,0,0,0.06)`,
                }}>
                  <span style={{ fontSize: isHour ? 10 : 9, fontWeight: isHour ? 600 : 400, color: isHour ? colors.gray.dimText : colors.gray.dimTextLight, fontVariantNumeric:'tabular-nums', lineHeight:1 }}>
                    {time}
                  </span>
                </div>
              )
            })}
          </div>

          {/* Área de bookings + slots clicáveis */}
          <div style={{ flex:1, position:'relative' }}>

            {/* Grade de fundo clicável */}
            {SLOTS.map((time, i) => {
              const isHour = i % 2 === 0
              return (
                <div
                  key={time}
                  className="m-slot-free"
                  style={{
                    position:'absolute', top: i * ROW_H, left:0, right:0, height:ROW_H,
                    borderTop: isHour ? `1px solid ${colors.gray.border}` : `1px dashed rgba(0,0,0,0.06)`,
                  }}
                  onClick={() => !dragId && openCreate(time, currentProf ?? professionals[0]?.id ?? '')}
                />
              )
            })}

            {/* Bookings */}
            {profBookings.map(b => {
              const startMin = toMinutes(b.start)
              const endMin   = toMinutes(b.end)
              if (startMin < START_MIN || startMin >= END_HOUR * 60) return null

              const duration = Math.max(endMin - startMin, 15)
              const top      = (startMin - START_MIN) * PX_PER_MIN
              const height   = Math.max(duration * PX_PER_MIN - 2, ROW_H * 0.75)

              const isDragging = dragId === b.id
              const isSaving   = savingId === b.id

              return (
                <div
                  key={b.id}
                  style={{
                    position:'absolute',
                    top:     isDragging ? ghostTop : top,
                    left:    6,
                    right:   6,
                    height,
                    zIndex:  isDragging ? 50 : 8,
                    opacity: isSaving ? 0.6 : 1,
                    transition: isDragging ? 'none' : 'top 0.15s ease, opacity 0.2s',
                    touchAction:'none',
                  }}
                  onTouchStart={(e) => onTouchStart(e, b, top)}
                >
                  <BookingCard booking={b} totalHeight={height} />
                </div>
              )
            })}

            {/* Ghost label de horário durante drag */}
            {dragId && ghostTime && (
              <div style={{
                position:'absolute',
                top: ghostTop - 18,
                left: 0, right: 0,
                textAlign:'center',
                fontSize:11, fontWeight:700,
                color: colors.red.DEFAULT,
                pointerEvents:'none',
                zIndex:51,
                textShadow:'0 1px 4px rgba(255,255,255,0.9)',
                fontVariantNumeric:'tabular-nums',
              }}>
                {ghostTime}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}