'use client'
// src/features/agenda/components/AgendaMobileList.tsx

import { useState, useRef, useCallback, useEffect } from 'react'
import { createPortal } from 'react-dom'
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
const SLOT_STEP     = 5
const ROW_H         = 56
const PX_PER_MIN    = ROW_H / 30
const TIME_COL_W    = 48
const MIN_CARD_H    = 28
const MIN_DUR       = 5
const LONG_PRESS_MS = 450
const DEFAULT_START = 7
const DEFAULT_END   = 21

function toMinutes(t: string) { const [h,m]=t.split(':').map(Number); return h*60+m }
function minutesToTime(min: number) { return `${String(Math.floor(min/60)).padStart(2,'0')}:${String(min%60).padStart(2,'00')}` }
function snapToSlot(min: number) { return Math.round(min/SLOT_STEP)*SLOT_STEP }

function buildHalfSlots(startHour: number, endHour: number): string[] {
  const s: string[] = []
  for (let h = startHour; h < endHour; h++) {
    s.push(`${String(h).padStart(2,'0')}:00`)
    s.push(`${String(h).padStart(2,'0')}:30`)
  }
  return s
}

function useCurrentTimeY(startMin: number) {
  const [y, setY] = useState(-1)
  useEffect(() => {
    const calc = () => {
      const n=new Date(), min=n.getHours()*60+n.getMinutes()
      setY(min < startMin ? -1 : (min - startMin) * PX_PER_MIN)
    }
    calc(); const id=setInterval(calc,30_000); return ()=>clearInterval(id)
  },[startMin])
  return y
}

function computeOverlapLayout(bookings: AgendaBooking[]) {
  const result = new Map<string,{col:number;totalCols:number}>()
  const sorted = [...bookings].sort((a,b)=>toMinutes(a.start)-toMinutes(b.start))
  const groups: AgendaBooking[][] = []
  for (const b of sorted) {
    let placed=false
    for (const g of groups) {
      if (g.some(x=>toMinutes(b.start)<toMinutes(x.end)&&toMinutes(b.end)>toMinutes(x.start))) { g.push(b); placed=true; break }
    }
    if (!placed) groups.push([b])
  }
  for (const g of groups) g.forEach((b,col)=>result.set(b.id,{col,totalCols:g.length}))
  return result
}

// ─── Modal de confirmação padrão eligi (bottom sheet no mobile) ───────────────
function ConfirmModal({ title, confirmLabel, onConfirm, onCancel }: {
  title:string; confirmLabel:string; onConfirm:()=>void; onCancel:()=>void
}) {
  return createPortal(
    <>
      <div onClick={onCancel} style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.32)',backdropFilter:'blur(8px)',zIndex:9998}}/>
      <div style={{position:'fixed',bottom:0,left:0,right:0,background:'rgba(255,255,255,0.99)',borderRadius:'24px 24px 0 0',boxShadow:'0 -8px 40px rgba(0,0,0,0.15)',zIndex:9999,padding:`28px 24px max(36px,env(safe-area-inset-bottom))`,textAlign:'center',fontFamily:typography.fontFamily,animation:'cmUp 0.28s cubic-bezier(0.34,1.2,0.64,1)'}}>
        <style>{`@keyframes cmUp{from{transform:translateY(100%)}to{transform:translateY(0)}}`}</style>
        <div style={{width:40,height:4,borderRadius:2,background:'rgba(0,0,0,0.12)',margin:'0 auto 24px'}}/>
        <div style={{width:44,height:44,borderRadius:13,background:'linear-gradient(145deg,#ef4444,#dc2626,#b91c1c)',display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 18px',boxShadow:'0 6px 18px rgba(220,38,38,0.30)'}}>
          <span style={{color:'#fff',fontWeight:800,fontSize:20,letterSpacing:'-0.04em'}}>e</span>
        </div>
        <h3 style={{margin:'0 0 24px',fontSize:18,fontWeight:700,color:'#0f0f14',lineHeight:1.3,letterSpacing:'-0.02em',whiteSpace:'pre-line'}}>{title}</h3>
        <button onClick={onConfirm} style={{width:'100%',padding:'15px',marginBottom:10,background:colors.red.gradient,color:'#fff',border:'none',borderRadius:radius.sm,fontWeight:700,fontSize:14,cursor:'pointer',letterSpacing:'0.04em',textTransform:'uppercase',boxShadow:`0 4px 16px ${colors.red.glow}`}}>
          {confirmLabel}
        </button>
        <button onClick={onCancel} style={{width:'100%',padding:'14px',background:'transparent',border:`1px solid ${colors.gray.borderMd}`,borderRadius:radius.sm,fontSize:14,cursor:'pointer',color:colors.gray.dimText,fontWeight:500}}>
          Voltar
        </button>
      </div>
    </>,
    document.body
  )
}

// ─── Booking Card ─────────────────────────────────────────────────────────────
// Mobile: PX_PER_MIN = ROW_H/30 = 56/30 ≈ 1.87px/min
// 5min ≈ 9px, 10min ≈ 19px, 15min ≈ 28px, 30min ≈ 56px
function MobileBookingCard({ booking, height, isDragging }: { booking:AgendaBooking; height:number; isDragging?:boolean }) {
  const statusTheme = STATUS_CFG[booking.status] ?? STATUS_CFG.CONFIRMED
  const gradient    = booking.serviceColor ? colorToGradient(booking.serviceColor) : statusTheme.gradient
  const glow        = booking.serviceColor ? colorToGlow(booking.serviceColor)     : statusTheme.glow

  const isMicro     = height <= 16   // só horário início
  const isTiny      = height <= 30 && height > 16  // horário + nome linha única
  const showService = height >= 52
  const showTime    = height >= 68
  const dur         = toMinutes(booking.end) - toMinutes(booking.start)

  return (
    <div style={{
      width:'100%', height:'100%', borderRadius:10,
      background:gradient,
      padding: isMicro ? '0 6px 0 8px' : isTiny ? '0 8px 0 10px' : '6px 8px 6px 10px',
      display:'flex', flexDirection:'column',
      justifyContent:(isMicro||isTiny)?'center':'flex-start',
      gap:2, overflow:'hidden', boxSizing:'border-box',
      boxShadow:isDragging?`0 12px 32px ${glow}`:`0 3px 12px ${glow}`,
      border:'1px solid rgba(255,255,255,0.18)',
      position:'relative', userSelect:'none',
      transform:isDragging?'scale(1.04)':'scale(1)',
    }}>
      <div style={{position:'absolute',top:0,left:0,right:0,height:'40%',background:'linear-gradient(180deg,rgba(255,255,255,0.16) 0%,transparent 100%)',borderRadius:'10px 10px 0 0',pointerEvents:'none'}}/>
      <div style={{position:'absolute',left:0,top:0,bottom:0,width:3,background:'rgba(255,255,255,0.45)',borderRadius:'10px 0 0 10px'}}/>

      {/* MICRO: só hora início */}
      {isMicro && (
        <span style={{fontSize:9,fontWeight:800,color:'#fff',opacity:0.95,fontVariantNumeric:'tabular-nums',whiteSpace:'nowrap',letterSpacing:'-0.2px'}}>
          {booking.start}
        </span>
      )}

      {/* TINY: hora + nome */}
      {isTiny && (
        <div style={{display:'flex',alignItems:'center',gap:5,overflow:'hidden'}}>
          <span style={{fontSize:10,fontWeight:800,color:'#fff',opacity:0.95,fontVariantNumeric:'tabular-nums',whiteSpace:'nowrap',flexShrink:0,letterSpacing:'-0.2px'}}>{booking.start}</span>
          <span style={{fontSize:10,fontWeight:700,color:'#fff',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{booking.clientName}</span>
        </div>
      )}

      {/* NORMAL */}
      {!isMicro && !isTiny && (
        <>
          <div style={{color:'#fff',fontWeight:800,fontSize:13,lineHeight:1.2,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis',letterSpacing:'-0.2px'}}>{booking.clientName}</div>
          {showService && <div style={{color:'rgba(255,255,255,0.88)',fontWeight:600,fontSize:11,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{booking.serviceName}</div>}
          {showTime && (
            <div style={{marginTop:'auto',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
              <span style={{color:'rgba(255,255,255,0.82)',fontSize:11,fontWeight:700,fontVariantNumeric:'tabular-nums'}}>{booking.start}–{booking.end}</span>
              <span style={{color:'rgba(255,255,255,0.62)',fontSize:10,fontWeight:600}}>{dur}min</span>
            </div>
          )}
        </>
      )}
    </div>
  )
}

// ─── ProfTabs ─────────────────────────────────────────────────────────────────
function ProfTabs({ professionals, selected, bookings, onChange }: {
  professionals:AgendaProfessional[]; selected:string; bookings:AgendaBooking[]; onChange:(id:string)=>void
}) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const el = ref.current?.querySelector('.ptab-active') as HTMLElement|null
    el?.scrollIntoView({inline:'center',behavior:'smooth',block:'nearest'})
  },[selected])
  if (professionals.length <= 1) return null
  return (
    <div ref={ref} style={{display:'flex',gap:6,padding:'8px 14px',overflowX:'auto',scrollbarWidth:'none',borderBottom:`1px solid ${colors.gray.border}`,background:'rgba(245,245,247,0.98)',backdropFilter:'blur(12px)',flexShrink:0}}>
      {professionals.map(p => {
        const isActive=p.id===selected
        const initials=p.name.split(' ').slice(0,2).map(w=>w[0]).join('').toUpperCase()
        const count=bookings.filter(b=>b.professionalId===p.id).length
        return (
          <button key={p.id} className={isActive?'ptab-active':''} onClick={()=>onChange(p.id)} style={{display:'flex',alignItems:'center',gap:7,padding:'7px 13px',borderRadius:radius.full,border:`1px solid ${isActive?'transparent':colors.gray.borderMd}`,background:isActive?colors.red.gradient:colors.background.surface,cursor:'pointer',flexShrink:0,whiteSpace:'nowrap',boxShadow:isActive?`0 3px 10px ${colors.red.glow}`:'none',transition:`all ${transitions.spring}`}}>
            <div style={{width:22,height:22,borderRadius:radius.full,background:isActive?'rgba(255,255,255,0.25)':colors.red.subtle,display:'flex',alignItems:'center',justifyContent:'center',fontSize:9,fontWeight:700,color:isActive?'#fff':colors.red.DEFAULT,flexShrink:0}}>{initials}</div>
            <span style={{fontSize:12,fontWeight:600,color:isActive?'#fff':colors.gray[700]}}>{p.name.split(' ')[0]}</span>
            {count>0 && <span style={{fontSize:10,fontWeight:700,padding:'1px 6px',borderRadius:radius.full,background:isActive?'rgba(255,255,255,0.25)':colors.red.subtle,color:isActive?'#fff':colors.red.DEFAULT}}>{count}</span>}
          </button>
        )
      })}
    </div>
  )
}

import { WorkingHours } from './AgendaBoard'

// ─── Tipos ────────────────────────────────────────────────────────────────────
interface MoveDrag {
  type:'move'; booking:AgendaBooking; profId:string
  ghostTop:number; ghostTime:string
  touchY:number; touchX:number
  cardWidth:number; cardLeft:number; cardHeight:number
}
interface ResizeDrag {
  type:'resize'; booking:AgendaBooking; profId:string
  baseTop:number; ghostHeight:number; currentEnd:string
}
type ActiveDrag = MoveDrag | ResizeDrag

interface Props {
  professionals:AgendaProfessional[]; bookings:AgendaBooking[]; blocks:AgendaBlock[]
  workingHours?: WorkingHours
  onDeleteBlock:(id:string)=>void; onUpdateBlock:(block:AgendaBlock)=>void
  onOpenBlockModal?:(time?:string,profId?:string)=>void
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function AgendaMobileList({ professionals, bookings, blocks, workingHours, onDeleteBlock, onUpdateBlock, onOpenBlockModal }: Props) {
  const { openCreate, selectedDate, updateBooking } = useAgendaStore()

  const START_HOUR = workingHours?.open ? Math.max(0,  Math.floor(toMinutes(workingHours.startTime)/60) - 1) : DEFAULT_START
  const END_HOUR   = workingHours?.open ? Math.min(24, Math.floor(toMinutes(workingHours.endTime)  /60) + 1) : DEFAULT_END
  const START_MIN  = START_HOUR * 60
  const HALF_SLOTS = buildHalfSlots(START_HOUR, END_HOUR)
  const TOTAL_H    = HALF_SLOTS.length * ROW_H

  const currentY = useCurrentTimeY(START_MIN)
  const dateStr  = dayjs(selectedDate).format('YYYY-MM-DD')

  const [activeProfId, setActiveProfId] = useState(professionals[0]?.id ?? '')
  const vScrollRef  = useRef<HTMLDivElement>(null)
  const dragRef     = useRef<ActiveDrag|null>(null)
  const longPressRef= useRef<ReturnType<typeof setTimeout>|null>(null)
  const touchStartRef = useRef<{y:number;x:number;time:number}|null>(null)
  const [hoverSlot, setHoverSlot] = useState<string|null>(null) // slot destacado

  const [drag,           setDrag]           = useState<ActiveDrag|null>(null)
  const [pendingAction,  setPendingAction]  = useState<{title:string;confirmLabel:string;onConfirm:()=>void}|null>(null)
  const [savingId,       setSavingId]       = useState<string|null>(null)
  const [editBlock,      setEditBlock]      = useState<AgendaBlock|null>(null)
  const [ctxMenu,        setCtxMenu]        = useState<{x:number;y:number;time:string;profId:string}|null>(null)
  const [longPressId,    setLongPressId]    = useState<string|null>(null) // card em vibração esperando

  useEffect(() => {
    if (professionals.length>0 && !professionals.find(p=>p.id===activeProfId))
      setActiveProfId(professionals[0].id)
  },[professionals,activeProfId])

  const seen   = new Set<string>()
  const unique = bookings.filter(b=>{ if(seen.has(b.id)) return false; seen.add(b.id); return true })
  const profBookings = unique.filter(b=>b.professionalId===activeProfId)
  const profBlocks   = blocks.filter(bl=>bl.professionalId===activeProfId)
  const layout       = computeOverlapLayout(profBookings)

  useEffect(() => {
    if (!vScrollRef.current) return
    const target = currentY > 0
      ? Math.max(0, currentY - 60 * PX_PER_MIN)
      : workingHours?.open
        ? Math.max(0, (toMinutes(workingHours.startTime) - START_MIN - 60) * PX_PER_MIN)
        : 0
    vScrollRef.current.scrollTop = target
  }, [workingHours?.open, workingHours?.startTime, currentY, START_MIN, activeProfId])

  // Converte clientY → px desde o topo da grade
  function getGridY(clientY: number) {
    if (!vScrollRef.current) return 0
    const rect = vScrollRef.current.getBoundingClientRect()
    return clientY - rect.top + vScrollRef.current.scrollTop
  }

  // Snap de clientY → minutos
  function snapFromClientY(clientY: number) {
    const relY   = getGridY(clientY)
    const absMin = START_MIN + relY / PX_PER_MIN
    return Math.max(START_MIN, Math.min(snapToSlot(absMin), END_HOUR*60-SLOT_STEP))
  }

  // ─── Reschedule ─────────────────────────────────────────────────────────────
  const doReschedule = useCallback(async (bookingId:string, time:string, professionalId:string, allowOverlap:boolean) => {
    const startAt=dayjs.tz(`${dateStr} ${time}`,'America/Sao_Paulo').toISOString()
    try {
      setSavingId(bookingId)
      const res=await api.patch(`/bookings/${bookingId}/reschedule`,{startAt,professionalId,allowOverlap})
      const b=res.data?.data??res.data
      if (b) updateBooking(dateStr,{id:bookingId,professionalId:b.professionalId??professionalId,clientName:b.clientName,serviceName:b.service?.name??'',serviceColor:b.service?.color??undefined,start:dayjs(b.startAt).tz('America/Sao_Paulo').format('HH:mm'),end:dayjs(b.endAt).tz('America/Sao_Paulo').format('HH:mm'),status:b.status})
    } catch (err:unknown) {
      const status=(err as {response?:{status?:number}})?.response?.status
      const code=(err as {response?:{data?:{code?:string}}})?.response?.data?.code
      if (status===409||code==='BOOKING_CONFLICT') {
        setPendingAction({title:'Já existe um agendamento\nnesse horário. Confirma mesmo assim?',confirmLabel:'Confirmar sobreposição',onConfirm:()=>{setPendingAction(null);doReschedule(bookingId,time,professionalId,true)}})
      }
    } finally { setSavingId(null) }
  },[dateStr,updateBooking])

  // ─── Resize ─────────────────────────────────────────────────────────────────
  const doResize = useCallback(async (bookingId:string, booking:AgendaBooking, newEnd:string) => {
    const startAt=dayjs.tz(`${dateStr} ${booking.start}`,'America/Sao_Paulo').toISOString()
    const endAt=dayjs.tz(`${dateStr} ${newEnd}`,'America/Sao_Paulo').toISOString()
    try {
      setSavingId(bookingId)
      const res=await api.patch(`/bookings/${bookingId}/resize`,{startAt,endAt})
      const b=res.data?.data??res.data
      if (b) updateBooking(dateStr,{id:bookingId,professionalId:b.professionalId??booking.professionalId,clientName:b.clientName,serviceName:b.service?.name??'',serviceColor:b.service?.color??undefined,start:dayjs(b.startAt).tz('America/Sao_Paulo').format('HH:mm'),end:dayjs(b.endAt).tz('America/Sao_Paulo').format('HH:mm'),status:b.status})
    } catch (err:unknown) {
      const status=(err as {response?:{status?:number}})?.response?.status
      const code=(err as {response?:{data?:{code?:string}}})?.response?.data?.code
      if (status===409||code==='BOOKING_CONFLICT') {
        setPendingAction({title:'Existe um conflito nesse horário.\nDeseja confirmar mesmo assim?',confirmLabel:'Confirmar sobreposição',onConfirm:()=>{setPendingAction(null);doResize(bookingId,booking,newEnd)}})
      }
    } finally { setSavingId(null) }
  },[dateStr,updateBooking])

  // ─── Long press handlers para MOVE ───────────────────────────────────────────
  function onCardTouchStart(e: React.TouchEvent, booking: AgendaBooking, cardTop: number, cardWidth: number, cardLeft: number, cardHeight: number) {
    const touch = e.touches[0]
    touchStartRef.current = { y: touch.clientY, x: touch.clientX, time: Date.now() }
    setLongPressId(booking.id)

    longPressRef.current = setTimeout(() => {
      // Vibração haptica (se disponível)
      if (navigator.vibrate) navigator.vibrate(40)
      setLongPressId(null)

      const snapMin  = snapFromClientY(touch.clientY)
      const ghostTop = (snapMin - START_MIN) * PX_PER_MIN
      const state: MoveDrag = {
        type:'move', booking, profId:activeProfId,
        ghostTop, ghostTime:minutesToTime(snapMin),
        touchY:touch.clientY, touchX:touch.clientX,
        cardWidth, cardLeft, cardHeight,
      }
      dragRef.current = state
      setDrag(state)
    }, LONG_PRESS_MS)
  }

  function onCardTouchEnd() {
    if (longPressRef.current) { clearTimeout(longPressRef.current); longPressRef.current = null }
    setLongPressId(null)
    if (dragRef.current) return
  }

  // ─── Long press handlers para RESIZE ─────────────────────────────────────────
  function onResizeTouchStart(e: React.TouchEvent, booking: AgendaBooking, cardTop: number, cardHeight: number) {
    e.stopPropagation()
    if (navigator.vibrate) navigator.vibrate(30)
    const state: ResizeDrag = {
      type:'resize', booking, profId:activeProfId,
      baseTop:cardTop, ghostHeight:cardHeight, currentEnd:booking.end,
    }
    dragRef.current = state
    setDrag(state)
  }

  // ─── Touch move global ────────────────────────────────────────────────────────
  function onTouchMove(e: React.TouchEvent) {
    const touch = e.touches[0]

    // Cancela long press se moveu muito
    if (longPressRef.current && touchStartRef.current) {
      const dx = Math.abs(touch.clientX - touchStartRef.current.x)
      const dy = Math.abs(touch.clientY - touchStartRef.current.y)
      if (dx > 8 || dy > 8) {
        clearTimeout(longPressRef.current)
        longPressRef.current = null
        setLongPressId(null)
      }
    }

    const d = dragRef.current
    if (!d) return
    e.preventDefault()

    if (d.type === 'move') {
      const snapMin  = snapFromClientY(touch.clientY)
      const ghostTop = (snapMin - START_MIN) * PX_PER_MIN
      const hSlot    = minutesToTime(snapMin)
      const next: MoveDrag = { ...d, ghostTop, ghostTime:minutesToTime(snapMin), touchY:touch.clientY, touchX:touch.clientX }
      dragRef.current = next
      setDrag(next)
      setHoverSlot(hSlot)
    }

    if (d.type === 'resize') {
      const relY   = getGridY(touch.clientY)
      const absMin = START_MIN + relY / PX_PER_MIN
      const endMin = Math.max(toMinutes(d.booking.start)+MIN_DUR, Math.min(snapToSlot(absMin), END_HOUR*60))
      const h      = Math.max((endMin - toMinutes(d.booking.start)) * PX_PER_MIN - 2, MIN_CARD_H)
      const next: ResizeDrag = { ...d, ghostHeight:h, currentEnd:minutesToTime(endMin) }
      dragRef.current = next
      setDrag(next)
    }
  }

  function onTouchEnd() {
    if (longPressRef.current) { clearTimeout(longPressRef.current); longPressRef.current = null }
    setLongPressId(null)
    setHoverSlot(null)

    const d = dragRef.current
    dragRef.current = null
    setDrag(null)
    if (!d) return

    if (d.type === 'move' && d.ghostTime !== d.booking.start) {
      setPendingAction({
        title:`Confirmar alteração de\n${d.booking.start} para ${d.ghostTime}?`,
        confirmLabel:'Salvar alteração',
        onConfirm:()=>{setPendingAction(null);doReschedule(d.booking.id,d.ghostTime,d.profId,false)},
      })
    }
    if (d.type === 'resize' && d.currentEnd !== d.booking.end) {
      setPendingAction({
        title:`Confirmar alteração de\n${d.booking.start}–${d.booking.end} para ${d.booking.start}–${d.currentEnd}?`,
        confirmLabel:'Salvar alteração',
        onConfirm:()=>{setPendingAction(null);doResize(d.booking.id,d.booking,d.currentEnd)},
      })
    }
  }

  const isMoving   = drag?.type === 'move'
  const isResizing = drag?.type === 'resize'

  return (
    <div style={{height:'100%',display:'flex',flexDirection:'column',background:colors.background.page,fontFamily:typography.fontFamily,overflow:'hidden'}}>
      <style>{`
        .m-vscroll::-webkit-scrollbar{display:none}
        .m-grid-wrap{
          -webkit-user-select:none;
          -moz-user-select:none;
          user-select:none;
          -webkit-touch-callout:none;
        }
        .m-slot{cursor:pointer;transition:background 0.1s}
        .m-slot:active{background:rgba(220,38,38,0.06)!important}
        .m-slot-hover{background:rgba(220,38,38,0.10)!important;border-top:2px solid ${colors.red.DEFAULT}!important}
        /* Handle resize — faixa generosa para toque fácil */
        .m-rh{
          position:absolute;bottom:0;left:0;right:0;height:20px;
          display:flex;align-items:flex-end;justify-content:center;
          padding-bottom:4px;
          z-index:25;touch-action:none;
          border-radius:0 0 10px 10px;
        }
        .m-rh::after{
          content:'';width:28px;height:5px;
          background:rgba(255,255,255,0.60);
          border-radius:3px;transition:all 0.15s;
        }
        .m-rh:active::after{background:rgba(255,255,255,0.98);width:32px;height:6px}
        /* Long press: anel de progresso via outline animado */
        @keyframes lp-ring{from{outline-width:0px;outline-offset:0px;opacity:0}to{outline-width:3px;outline-offset:2px;opacity:1}}
        .lp-waiting{
          outline:3px solid ${colors.red.DEFAULT};
          outline-offset:2px;
          border-radius:10px;
          animation:lp-ring 0.45s ease forwards;
        }
        @keyframes lp-pulse{0%{opacity:1}50%{opacity:0.55}100%{opacity:1}}
        .lp-waiting > div{animation:lp-pulse 0.45s ease infinite}
      `}</style>

      {/* Modal de confirmação */}
      {pendingAction && (
        <ConfirmModal
          title={pendingAction.title}
          confirmLabel={pendingAction.confirmLabel}
          onConfirm={pendingAction.onConfirm}
          onCancel={()=>setPendingAction(null)}
        />
      )}
      {ctxMenu && (
        <SlotContextMenu x={ctxMenu.x} y={ctxMenu.y} time={ctxMenu.time} profId={ctxMenu.profId}
          onClose={()=>setCtxMenu(null)}
          onNewBooking={(t,p)=>{openCreate(t,p);setCtxMenu(null)}}
          onNewBlock={(t,p)=>{onOpenBlockModal?.(t,p);setCtxMenu(null)}}
        />
      )}
      {editBlock && (
        <BlockEditModal block={editBlock} professionals={professionals}
          onClose={()=>setEditBlock(null)}
          onDeleted={id=>{onDeleteBlock(id);setEditBlock(null)}}
          onUpdated={u=>{onUpdateBlock(u);setEditBlock(null)}}
        />
      )}

      {/* Ghost FIXO que segue o slot snapped */}
      {isMoving && drag?.type==='move' && createPortal(
        <div style={{
          position:'fixed',
          left: drag.cardLeft,
          top: (() => {
            const rect = vScrollRef.current?.getBoundingClientRect()
            const scrollTop = vScrollRef.current?.scrollTop ?? 0
            return (rect?.top ?? 0) + drag.ghostTop - scrollTop
          })(),
          width: drag.cardWidth,
          height: drag.cardHeight,
          zIndex:99999, pointerEvents:'none',
          filter:'drop-shadow(0 14px 36px rgba(0,0,0,0.38))',
          transform:'scale(1.04)',
          transition:'top 0.06s ease',
        }}>
          <MobileBookingCard booking={drag.booking} height={drag.cardHeight} isDragging/>
          <div style={{position:'absolute',bottom:-26,left:'50%',transform:'translateX(-50%)',background:'rgba(220,38,38,0.92)',color:'#fff',fontSize:12,fontWeight:800,fontVariantNumeric:'tabular-nums',padding:'3px 10px',borderRadius:8,whiteSpace:'nowrap',boxShadow:'0 2px 8px rgba(220,38,38,0.35)',pointerEvents:'none'}}>
            {drag.ghostTime}
          </div>
        </div>,
        document.body
      )}

      {/* Tabs */}
      <ProfTabs professionals={professionals} selected={activeProfId} bookings={unique}
        onChange={id=>{setActiveProfId(id); setTimeout(()=>{if(currentY>0&&vScrollRef.current)vScrollRef.current.scrollTop=Math.max(0,currentY-120)},50)}}
      />

      {/* Resumo */}
      {profBookings.length > 0 && (
        <div style={{display:'flex',alignItems:'center',gap:10,padding:'7px 14px',flexShrink:0,background:'rgba(245,245,247,0.6)',borderBottom:`1px solid ${colors.gray.border}`}}>
          <div style={{display:'flex',alignItems:'center',gap:5,flexShrink:0}}>
            <div style={{width:6,height:6,borderRadius:'50%',background:colors.red.DEFAULT,boxShadow:`0 0 5px ${colors.red.glow}`}}/>
            <span style={{fontSize:12,fontWeight:600,color:colors.gray[700]}}>{profBookings.length} agend.</span>
          </div>
          <div style={{display:'flex',gap:4,overflowX:'auto',scrollbarWidth:'none',flex:1}}>
            {profBookings.slice(0,5).map(b=>(
              <span key={b.id} style={{padding:'2px 8px',borderRadius:radius.full,background:colors.red.subtle,border:`1px solid ${colors.red.border}`,fontSize:11,fontWeight:600,color:colors.red.dark,whiteSpace:'nowrap',flexShrink:0}}>{b.start}</span>
            ))}
            {profBookings.length>5 && <span style={{padding:'2px 8px',borderRadius:radius.full,background:'rgba(0,0,0,0.05)',fontSize:11,color:colors.gray.dimText,flexShrink:0}}>+{profBookings.length-5}</span>}
          </div>
        </div>
      )}

      {/* Grade */}
      <div
        ref={vScrollRef}
        className="m-vscroll m-grid-wrap"
        style={{
          flex:1, overflowY:'auto', overflowX:'hidden',
          WebkitOverflowScrolling:'touch', position:'relative',
          touchAction:drag?'none':'pan-y',
          // Compensa a bottom nav (64px) + safe area do iPhone
          paddingBottom:'calc(var(--bottom-nav-h, 64px) + env(safe-area-inset-bottom, 0px))',
        }}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        onTouchCancel={onTouchEnd}
      >
        <div style={{display:'flex',minHeight:TOTAL_H}}>

          {/* Coluna horários */}
          <div style={{width:TIME_COL_W,flexShrink:0,position:'sticky',left:0,zIndex:12,background:'rgba(245,245,247,0.98)',backdropFilter:'blur(8px)',borderRight:`1px solid ${colors.gray.border}`}}>
            {HALF_SLOTS.map((time,i)=>{
              const isHour=i%2===0
              return (
                <div key={time} style={{height:ROW_H,display:'flex',alignItems:'flex-start',justifyContent:'flex-end',paddingRight:8,paddingTop:4,boxSizing:'border-box',borderTop:isHour?`1px solid ${colors.gray.border}`:`1px dashed rgba(0,0,0,0.06)`}}>
                  <span style={{fontSize:isHour?11:10,fontWeight:isHour?600:400,color:isHour?colors.gray.dimText:colors.gray.dimTextLight,fontVariantNumeric:'tabular-nums',lineHeight:1}}>{time}</span>
                </div>
              )
            })}
          </div>

          {/* Coluna principal */}
          <div style={{flex:1,position:'relative'}}>

            {/* Slots */}
            {HALF_SLOTS.map((time,i)=>(
              <div key={time}
                className={`m-slot${isMoving && hoverSlot===time ? ' m-slot-hover' : ''}`}
                style={{position:'absolute',top:i*ROW_H,left:0,right:0,height:ROW_H,borderTop:i%2===0?`1px solid ${colors.gray.border}`:`1px dashed rgba(0,0,0,0.05)`}}
                onClick={e=>{if(drag||longPressId) return; setCtxMenu({x:e.clientX,y:e.clientY,time,profId:activeProfId})}}
              />
            ))}

            {/* Zona antes do expediente */}
            {(() => {
              const wStart = workingHours?.open ? toMinutes(workingHours.startTime) : START_MIN
              const preH   = Math.max(0, (wStart - START_MIN) * PX_PER_MIN)
              const closed = workingHours && !workingHours.open
              if (!preH && !closed) return null
              return (
                <div style={{
                  position:'absolute', top:0, left:0, right:0,
                  height: closed ? TOTAL_H : preH,
                  zIndex:6, pointerEvents:'none',
                  background:'repeating-linear-gradient(-45deg,rgba(0,0,0,0.03) 0px,rgba(0,0,0,0.03) 4px,transparent 4px,transparent 10px)',
                  borderBottom: closed ? 'none' : `1px solid rgba(0,0,0,0.06)`,
                }}/>
              )
            })()}

            {/* Zona após o expediente */}
            {(() => {
              if (workingHours && !workingHours.open) return null
              const wEnd   = workingHours?.open ? toMinutes(workingHours.endTime) : END_HOUR*60
              const postTop= Math.max(0, (wEnd - START_MIN) * PX_PER_MIN)
              const postH  = Math.max(0, TOTAL_H - postTop)
              if (!postH) return null
              return (
                <div style={{
                  position:'absolute', top:postTop, left:0, right:0, height:postH,
                  zIndex:6, pointerEvents:'none',
                  background:'repeating-linear-gradient(-45deg,rgba(0,0,0,0.03) 0px,rgba(0,0,0,0.03) 4px,transparent 4px,transparent 10px)',
                  borderTop:`1px solid rgba(0,0,0,0.06)`,
                }}/>
              )
            })()}

            {/* Hora atual */}
            {currentY>=0 && (
              <div style={{position:'absolute',top:currentY,left:0,right:0,height:2,background:`linear-gradient(90deg,${colors.red.DEFAULT},${colors.red.light})`,zIndex:15,pointerEvents:'none',boxShadow:`0 0 6px ${colors.red.glow}`}}>
                <div style={{width:8,height:8,borderRadius:'50%',background:colors.red.DEFAULT,position:'absolute',left:-4,top:-3,boxShadow:`0 0 8px ${colors.red.glow}`}}/>
              </div>
            )}

            {/* Bloqueios */}
            {profBlocks.map(bl=>{
              const sMin=toMinutes(bl.startTime),eMin=toMinutes(bl.endTime)
              if (sMin<START_MIN||sMin>=END_HOUR*60) return null
              const top=(sMin-START_MIN)*PX_PER_MIN
              const height=Math.max((eMin-sMin)*PX_PER_MIN-2,MIN_CARD_H)
              return (
                <div key={bl.id} style={{position:'absolute',top,left:4,right:4,height,zIndex:7,cursor:'pointer'}} onClick={e=>{e.stopPropagation();setEditBlock(bl)}}>
                  <BlockCard block={bl} totalHeight={height}/>
                </div>
              )
            })}

            {/* Agendamentos */}
            {profBookings.map(b=>{
              const sMin=toMinutes(b.start),eMin=toMinutes(b.end)
              if (sMin<START_MIN||sMin>=END_HOUR*60) return null
              const dur=Math.max(eMin-sMin,SLOT_STEP)
              const top=(sMin-START_MIN)*PX_PER_MIN
              const baseH=Math.max(dur*PX_PER_MIN-2,MIN_CARD_H)
              const {col,totalCols}=layout.get(b.id)??{col:0,totalCols:1}
              const frac=1/totalCols
              const cardLeftStr=`calc(${col*frac*100}% + 4px)`
              const cardWidthStr=`calc(${frac*100}% - ${col===totalCols-1?8:4}px)`

              // largura/left em px para o ghost
              const containerW = (vScrollRef.current?.getBoundingClientRect().width ?? 300) - TIME_COL_W
              const cardWidthPx = frac * containerW - (col===totalCols-1?8:4)
              const cardLeftPx  = TIME_COL_W + (vScrollRef.current?.getBoundingClientRect().left ?? 0) + col*frac*containerW + 4

              const isThisMove   = isMoving   && drag?.booking.id===b.id
              const isThisResize = isResizing && drag?.booking.id===b.id
              const isSaving     = savingId===b.id
              const isWaiting    = longPressId===b.id
              const height = isThisResize && drag?.type==='resize' ? drag.ghostHeight : baseH

              return (
                <div key={b.id} style={{
                  position:'absolute',
                  top: isThisMove ? drag!.ghostTop : top,
                  left:cardLeftStr, width:cardWidthStr, height,
                  zIndex: isThisMove?2:8,
                  opacity: isThisMove?0.2:isSaving?0.5:1,
                  transition: isThisResize?'height 0s':isThisMove?'none':'opacity 0.2s',
                  touchAction:'none',
                }}
                  onTouchStart={e=>onCardTouchStart(e, b, top, cardWidthPx, cardLeftPx, baseH)}
                  onTouchEnd={onCardTouchEnd}
                >
                  {/* Placeholder in-place durante move */}
                  {isThisMove ? (
                    <div style={{width:'100%',height:'100%',borderRadius:10,background:'rgba(220,38,38,0.10)',border:`2px dashed ${colors.red.border}`}}/>
                  ) : (
                    <div className={isWaiting?'lp-waiting':''} style={{width:'100%',height:'100%'}}>
                      <MobileBookingCard booking={b} height={height}/>
                    </div>
                  )}

                  {/* Handle de resize na parte inferior */}
                  {!isThisMove && height > 24 && (
                    <div className="m-rh" onTouchStart={e=>onResizeTouchStart(e,b,top,baseH)}/>
                  )}

                  {/* Label durante resize */}
                  {isThisResize && drag?.type==='resize' && (
                    <div style={{position:'absolute',bottom:-18,left:0,right:0,textAlign:'center',fontSize:10,fontWeight:700,color:colors.red.DEFAULT,pointerEvents:'none',fontVariantNumeric:'tabular-nums',textShadow:'0 1px 3px rgba(255,255,255,0.9)',zIndex:50}}>
                      {drag.currentEnd}
                    </div>
                  )}
                </div>
              )
            })}

            {/* Label de horário in-place durante move */}
            {isMoving && drag?.type==='move' && (
              <div style={{position:'absolute',top:drag.ghostTop-22,left:0,right:0,textAlign:'center',pointerEvents:'none',zIndex:41}}>
                <span style={{fontSize:11,fontWeight:700,color:colors.red.DEFAULT,fontVariantNumeric:'tabular-nums',textShadow:'0 1px 4px rgba(255,255,255,0.95)',background:'rgba(255,255,255,0.85)',borderRadius:6,padding:'2px 8px'}}>
                  {drag.ghostTime}
                </span>
              </div>
            )}

            {/* Estado vazio */}
            {profBookings.length===0 && profBlocks.length===0 && (
              <div style={{position:'absolute',top:'28%',left:0,right:0,display:'flex',flexDirection:'column',alignItems:'center',gap:10,pointerEvents:'none'}}>
                <div style={{fontSize:44,opacity:0.2}}>📅</div>
                <span style={{fontSize:14,color:colors.gray.dimText,fontWeight:500,opacity:0.5}}>Sem agendamentos hoje</span>
                <span style={{fontSize:12,color:colors.gray.dimText,opacity:0.4}}>Toque em qualquer horário para agendar</span>
              </div>
            )}
            <div style={{height:TOTAL_H}}/>
          </div>
        </div>
      </div>
    </div>
  )
}