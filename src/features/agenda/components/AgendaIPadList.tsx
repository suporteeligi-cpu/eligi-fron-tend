'use client'
// src/features/agenda/components/AgendaIPadList.tsx
// Grade multi-coluna com touch events — exclusivo para iPad/tablet

import { useRef, useEffect, useState, useCallback } from 'react'
import { createPortal } from 'react-dom'
import BookingCard      from './BookingCard'
import BlockCard        from './BlockCard'
import SlotContextMenu  from './SlotContextMenu'
import BlockEditModal   from './BlockEditModal'
import { AgendaProfessional, AgendaBooking, AgendaBlock } from '../types'
import { colors, agendaLayout } from '@/shared/theme'
import { useAgendaStore } from '../hooks/useAgendaStore'
import api from '@/shared/lib/apiClient'
import dayjs from 'dayjs'
import timezone from 'dayjs/plugin/timezone'
import utc from 'dayjs/plugin/utc'

dayjs.extend(utc)
dayjs.extend(timezone)

import { WorkingHours } from './AgendaBoard'

function ProfAvatar({ name, avatarUrl, size = 30 }: { name: string; avatarUrl?: string; size?: number }) {
  const isColor  = avatarUrl?.startsWith('color:')
  const colorBg  = isColor ? avatarUrl!.replace('color:','') : null
  const isPhoto  = avatarUrl && !isColor
  const initials = name.split(' ').slice(0,2).map(w=>w[0]).join('').toUpperCase()
  return (
    <div style={{width:size,height:size,borderRadius:'50%',flexShrink:0,background:colorBg??(isPhoto?'transparent':colors.red.gradient),display:'flex',alignItems:'center',justifyContent:'center',fontSize:size*0.36,fontWeight:700,color:'#fff',boxShadow:`0 2px 8px ${colors.red.glow}`,overflow:'hidden'}}>
      {isPhoto
        // eslint-disable-next-line @next/next/no-img-element
        ? <img src={avatarUrl} alt={name} style={{width:'100%',height:'100%',objectFit:'cover'}}/>
        : initials
      }
    </div>
  )
}

const TIME_COL_W = agendaLayout.timeColWidth
const MIN_COL_W  = agendaLayout.minColWidth
const HEADER_H   = agendaLayout.headerHeight
const SLOT_STEP  = 5
const SLOT_H     = 10
const PX_PER_MIN = SLOT_H / SLOT_STEP
const MIN_CARD_H = 24
const MIN_DUR    = 5
const LONG_PRESS_MS = 400
const DEFAULT_START = 8
const DEFAULT_END   = 20

function buildSlots(startHour: number, endHour: number): string[] {
  const s: string[] = []
  for (let h = startHour; h < endHour; h++)
    for (let m = 0; m < 60; m += SLOT_STEP)
      s.push(`${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`)
  return s
}
function toMinutes(t: string) { const [h,m]=t.split(':').map(Number); return h*60+m }
function minutesToTime(min: number) { return `${String(Math.floor(min/60)).padStart(2,'0')}:${String(min%60).padStart(2,'00')}` }
function snapToSlot(min: number) { return Math.round(min/SLOT_STEP)*SLOT_STEP }
function addMin(t: string, min: number): string { const [h,m]=t.split(':').map(Number); const tot=h*60+m+min; return `${String(Math.floor(tot/60)).padStart(2,'0')}:${String(tot%60).padStart(2,'00')}` }

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

// ─── Modal de confirmação padrão eligi ────────────────────────────────────────
function ConfirmModal({ title, confirmLabel, onConfirm, onCancel }: {
  title:string; confirmLabel:string; onConfirm:()=>void; onCancel:()=>void
}) {
  return createPortal(
    <>
      <div onClick={onCancel} style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.28)',backdropFilter:'blur(8px)',zIndex:9998}}/>
      <div style={{position:'fixed',top:'50%',left:'50%',transform:'translate(-50%,-50%)',width:340,maxWidth:'88vw',background:'rgba(255,255,255,0.98)',borderRadius:22,boxShadow:'0 32px 72px rgba(0,0,0,0.18)',zIndex:9999,padding:'32px 24px 22px',fontFamily:'-apple-system,"SF Pro Display",system-ui,sans-serif',textAlign:'center',animation:'cmIn 0.22s cubic-bezier(0.34,1.56,0.64,1)'}}>
        <style>{`@keyframes cmIn{from{opacity:0;transform:translate(-50%,-50%) scale(0.93)}to{opacity:1;transform:translate(-50%,-50%) scale(1)}}`}</style>
        <div style={{width:44,height:44,borderRadius:13,background:'linear-gradient(145deg,#ef4444,#dc2626,#b91c1c)',display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 18px',boxShadow:'0 6px 18px rgba(220,38,38,0.30)'}}>
          <span style={{color:'#fff',fontWeight:800,fontSize:20,letterSpacing:'-0.04em'}}>e</span>
        </div>
        <h3 style={{margin:'0 0 24px',fontSize:18,fontWeight:700,color:'#0f0f14',lineHeight:1.3,letterSpacing:'-0.02em',whiteSpace:'pre-line'}}>{title}</h3>
        <button onClick={onConfirm} style={{width:'100%',padding:'14px',marginBottom:10,background:'linear-gradient(135deg,#dc2626,#b91c1c)',color:'#fff',border:'none',borderRadius:13,fontWeight:700,fontSize:14,cursor:'pointer',letterSpacing:'0.04em',textTransform:'uppercase',boxShadow:'0 4px 16px rgba(220,38,38,0.28)'}}>
          {confirmLabel}
        </button>
        <button onClick={onCancel} style={{width:'100%',padding:'13px',background:'transparent',border:'1px solid rgba(0,0,0,0.08)',borderRadius:13,fontSize:14,cursor:'pointer',color:'rgba(0,0,0,0.45)',fontWeight:500}}>
          Voltar
        </button>
      </div>
    </>,
    document.body
  )
}

interface MoveDrag {
  type:'move'; bookingId:string; booking:AgendaBooking; fromProfId:string
  ghostTop:number; ghostLeft:number; ghostWidth:number; ghostHeight:number
  currentProfId:string; currentTime:string
  touchX:number; touchY:number
}
interface ResizeDrag {
  type:'resize'; bookingId:string; booking:AgendaBooking; profId:string
  ghostHeight:number; currentEnd:string
}
type ActiveDrag = MoveDrag | ResizeDrag

interface ContextMenu { x:number; y:number; time:string; profId:string }

interface Props {
  professionals:AgendaProfessional[]; bookings:AgendaBooking[]; blocks:AgendaBlock[]
  workingHours?: WorkingHours
  onOpenBlockModal?:(time?:string,profId?:string)=>void
  onDeleteBlock?:(id:string)=>void; onUpdateBlock?:(block:AgendaBlock)=>void
}

export default function AgendaIPadList({ professionals, bookings, blocks, workingHours, onOpenBlockModal, onDeleteBlock, onUpdateBlock }: Props) {
  const { openCreate, openView, selectedDate, updateBooking, preview } = useAgendaStore()
  const scrollRef  = useRef<HTMLDivElement>(null)
  const gridRef    = useRef<HTMLDivElement>(null)

  const START_HOUR = workingHours?.open ? Math.max(0,  Math.floor(toMinutes(workingHours.startTime)/60) - 1) : DEFAULT_START
  const END_HOUR   = workingHours?.open ? Math.min(24, Math.floor(toMinutes(workingHours.endTime)  /60) + 1) : DEFAULT_END
  const START_MIN  = START_HOUR * 60
  const SLOTS      = buildSlots(START_HOUR, END_HOUR)
  const TOTAL_H    = SLOTS.length * SLOT_H

  const currentY   = useCurrentTimeY(START_MIN)
  const dragRef    = useRef<ActiveDrag|null>(null)
  const longPressRef = useRef<ReturnType<typeof setTimeout>|null>(null)
  const touchStartRef= useRef<{x:number;y:number}|null>(null)
  const tapBookingRef= useRef<AgendaBooking|null>(null) // booking do toque atual

  const [drag,         setDrag]         = useState<ActiveDrag|null>(null)
  const [hoverSlot,    setHoverSlot]    = useState<string|null>(null)
  const [longPressId,  setLongPressId]  = useState<string|null>(null)
  const [pendingAction,setPendingAction]= useState<{title:string;confirmLabel:string;onConfirm:()=>void}|null>(null)
  const [savingId,     setSavingId]     = useState<string|null>(null)
  const [ctxMenu,      setCtxMenu]      = useState<ContextMenu|null>(null)
  const [editBlock,    setEditBlock]    = useState<AgendaBlock|null>(null)

  const seen   = new Set<string>()
  const unique = bookings.filter(b=>{ if(seen.has(b.id)) return false; seen.add(b.id); return true })

  // Scroll para o preview
  useEffect(() => {
    if (!preview?.active || !scrollRef.current) return
    const targetY = Math.max(0, (toMinutes(preview.time) - START_MIN - 60) * PX_PER_MIN)
    scrollRef.current.scrollTo({ top: targetY, behavior: 'smooth' })
  }, [preview?.time, preview?.active, START_MIN])

  // Scroll inicial
  useEffect(() => {
    if (!scrollRef.current) return
    const target = currentY > 0
      ? Math.max(0, currentY - 60 * PX_PER_MIN)
      : workingHours?.open
        ? Math.max(0, (toMinutes(workingHours.startTime) - START_MIN - 60) * PX_PER_MIN)
        : 0
    scrollRef.current.scrollTop = target
  }, [workingHours?.open, workingHours?.startTime, currentY, START_MIN])

  // ─── helpers ───────────────────────────────────────────────────────────────
  function getScrollRect() {
    return scrollRef.current?.getBoundingClientRect() ?? {top:0,left:0,width:0}
  }

  function snapFromTouch(clientY: number) {
    const rect    = getScrollRect()
    const scrollT = scrollRef.current?.scrollTop ?? 0
    const relY    = clientY - rect.top + scrollT - HEADER_H
    const absMin  = START_MIN + relY / PX_PER_MIN
    return Math.max(START_MIN, Math.min(snapToSlot(absMin), END_HOUR*60-SLOT_STEP))
  }

  function colInfoFromTouch(clientX: number) {
    const rect   = getScrollRect()
    const scrollL= scrollRef.current?.scrollLeft ?? 0
    const relX   = clientX - rect.left + scrollL - TIME_COL_W
    const colW   = (rect.width - TIME_COL_W) / professionals.length
    const colIdx = Math.max(0, Math.min(Math.floor(relX/colW), professionals.length-1))
    return { colIdx, colW, colLeft: rect.left + TIME_COL_W + colIdx*colW }
  }

  // ─── Reschedule ────────────────────────────────────────────────────────────
  const doReschedule = useCallback(async (bookingId:string, time:string, professionalId:string, allowOverlap:boolean) => {
    const dateStr = dayjs(selectedDate).format('YYYY-MM-DD')
    const startAt = dayjs.tz(`${dateStr} ${time}`,'America/Sao_Paulo').toISOString()
    try {
      setSavingId(bookingId)
      const res = await api.patch(`/bookings/${bookingId}/reschedule`,{startAt,professionalId,allowOverlap})
      const b   = res.data?.data??res.data
      if (b) updateBooking(dateStr,{id:bookingId,professionalId:b.professionalId??professionalId,clientName:b.clientName,serviceName:b.service?.name??'',serviceColor:b.service?.color??undefined,start:dayjs(b.startAt).tz('America/Sao_Paulo').format('HH:mm'),end:dayjs(b.endAt).tz('America/Sao_Paulo').format('HH:mm'),status:b.status})
    } catch (err:unknown) {
      const status=(err as {response?:{status?:number}})?.response?.status
      const code  =(err as {response?:{data?:{code?:string}}})?.response?.data?.code
      if (status===409||code==='BOOKING_CONFLICT') {
        setPendingAction({title:'Já existe um agendamento\nnesse horário. Confirma mesmo assim?',confirmLabel:'Confirmar sobreposição',onConfirm:()=>{setPendingAction(null);doReschedule(bookingId,time,professionalId,true)}})
      }
    } finally { setSavingId(null) }
  },[selectedDate,updateBooking])

  const doResize = useCallback(async (bookingId:string, booking:AgendaBooking, newEnd:string) => {
    const dateStr = dayjs(selectedDate).format('YYYY-MM-DD')
    const startAt = dayjs.tz(`${dateStr} ${booking.start}`,'America/Sao_Paulo').toISOString()
    const endAt   = dayjs.tz(`${dateStr} ${newEnd}`,'America/Sao_Paulo').toISOString()
    try {
      setSavingId(bookingId)
      const res = await api.patch(`/bookings/${bookingId}/resize`,{startAt,endAt})
      const b   = res.data?.data??res.data
      if (b) updateBooking(dateStr,{id:bookingId,professionalId:b.professionalId??booking.professionalId,clientName:b.clientName,serviceName:b.service?.name??'',serviceColor:b.service?.color??undefined,start:dayjs(b.startAt).tz('America/Sao_Paulo').format('HH:mm'),end:dayjs(b.endAt).tz('America/Sao_Paulo').format('HH:mm'),status:b.status})
    } catch(err:unknown) {
      const status=(err as {response?:{status?:number}})?.response?.status
      const code  =(err as {response?:{data?:{code?:string}}})?.response?.data?.code
      if (status===409||code==='BOOKING_CONFLICT') {
        setPendingAction({title:'Existe um conflito nesse horário.\nDeseja confirmar mesmo assim?',confirmLabel:'Confirmar sobreposição',onConfirm:()=>{setPendingAction(null);doResize(bookingId,booking,newEnd)}})
      }
    } finally { setSavingId(null) }
  },[selectedDate,updateBooking])

  // ─── Long press → Move ─────────────────────────────────────────────────────
  function onCardTouchStart(e:React.TouchEvent, booking:AgendaBooking, profId:string, cardTop:number, cardHeight:number) {
    const touch = e.touches[0]
    touchStartRef.current = {x:touch.clientX, y:touch.clientY}
    tapBookingRef.current = booking
    setLongPressId(booking.id)

    longPressRef.current = setTimeout(() => {
      if (navigator.vibrate) navigator.vibrate(40)
      setLongPressId(null)
      tapBookingRef.current = null // não abre painel após drag

      const snapMin = snapFromTouch(touch.clientY)
      const { colIdx, colW, colLeft } = colInfoFromTouch(touch.clientX)
      const prof = professionals[colIdx]

      const state: MoveDrag = {
        type:'move', bookingId:booking.id, booking,
        fromProfId:profId,
        ghostTop:    (snapMin-START_MIN)*PX_PER_MIN,
        ghostLeft:   colLeft + 4,
        ghostWidth:  colW - 8,
        ghostHeight: cardHeight,
        currentProfId: prof?.id ?? profId,
        currentTime:   minutesToTime(snapMin),
        touchX: touch.clientX,
        touchY: touch.clientY,
      }
      dragRef.current = state
      setDrag(state)
    }, LONG_PRESS_MS)
  }

  function onCardTouchEnd() {
    if (longPressRef.current) { clearTimeout(longPressRef.current); longPressRef.current=null }
    setLongPressId(null)
    // Se não iniciou drag — foi tap rápido → abre painel
    if (!dragRef.current && tapBookingRef.current) {
      openView(tapBookingRef.current)
    }
    tapBookingRef.current = null
  }

  // ─── Resize touch ──────────────────────────────────────────────────────────
  function onResizeTouchStart(e:React.TouchEvent, booking:AgendaBooking, cardTop:number, cardHeight:number) {
    e.stopPropagation()
    if (navigator.vibrate) navigator.vibrate(30)
    const state: ResizeDrag = {
      type:'resize', bookingId:booking.id, booking,
      profId: booking.professionalId,
      ghostHeight: cardHeight,
      currentEnd:  booking.end,
    }
    dragRef.current = state
    setDrag(state)
  }

  // ─── Touch move global ─────────────────────────────────────────────────────
  function onTouchMove(e:React.TouchEvent) {
    const touch = e.touches[0]

    // Cancela long press se moveu
    if (longPressRef.current && touchStartRef.current) {
      const dx=Math.abs(touch.clientX-touchStartRef.current.x)
      const dy=Math.abs(touch.clientY-touchStartRef.current.y)
      if (dx>8||dy>8) {
        clearTimeout(longPressRef.current); longPressRef.current=null; setLongPressId(null)
      }
    }

    const d = dragRef.current
    if (!d) return
    e.preventDefault()

    if (d.type==='move') {
      const snapMin = snapFromTouch(touch.clientY)
      const { colIdx, colW, colLeft } = colInfoFromTouch(touch.clientX)
      const prof = professionals[colIdx]
      const next: MoveDrag = {
        ...d,
        ghostTop:  (snapMin-START_MIN)*PX_PER_MIN,
        ghostLeft: colLeft + 4,
        ghostWidth:colW - 8,
        currentProfId: prof?.id ?? d.currentProfId,
        currentTime:   minutesToTime(snapMin),
        touchX: touch.clientX,
        touchY: touch.clientY,
      }
      dragRef.current = next; setDrag(next)
      setHoverSlot(minutesToTime(snapMin))
    }

    if (d.type==='resize') {
      const rect    = getScrollRect()
      const scrollT = scrollRef.current?.scrollTop ?? 0
      const relY    = touch.clientY - rect.top + scrollT - HEADER_H
      const endMin  = Math.max(toMinutes(d.booking.start)+MIN_DUR, Math.min(snapToSlot(START_MIN+relY/PX_PER_MIN), END_HOUR*60))
      const h       = Math.max((endMin-toMinutes(d.booking.start))*PX_PER_MIN-2, MIN_CARD_H)
      const next: ResizeDrag = { ...d, ghostHeight:h, currentEnd:minutesToTime(endMin) }
      dragRef.current = next; setDrag(next)
    }
  }

  function onTouchEnd() {
    if (longPressRef.current) { clearTimeout(longPressRef.current); longPressRef.current=null }
    setLongPressId(null); setHoverSlot(null)

    const d = dragRef.current; dragRef.current=null; setDrag(null)
    if (!d) return

    if (d.type==='move' && (d.currentTime!==d.booking.start||d.currentProfId!==d.fromProfId)) {
      setPendingAction({
        title:`Confirmar alteração de\n${d.booking.start} para ${d.currentTime}?`,
        confirmLabel:'Salvar alteração',
        onConfirm:()=>{setPendingAction(null);doReschedule(d.bookingId,d.currentTime,d.currentProfId,false)},
      })
    }
    if (d.type==='resize' && d.currentEnd!==d.booking.end) {
      setPendingAction({
        title:`Confirmar alteração de\n${d.booking.start}–${d.booking.end} para ${d.booking.start}–${d.currentEnd}?`,
        confirmLabel:'Salvar alteração',
        onConfirm:()=>{setPendingAction(null);doResize(d.bookingId,d.booking,d.currentEnd)},
      })
    }
  }

  const isMoving   = drag?.type==='move'
  const isResizing = drag?.type==='resize'

  return (
    <>
      {pendingAction && <ConfirmModal title={pendingAction.title} confirmLabel={pendingAction.confirmLabel} onConfirm={pendingAction.onConfirm} onCancel={()=>setPendingAction(null)}/>}
      {ctxMenu && <SlotContextMenu x={ctxMenu.x} y={ctxMenu.y} time={ctxMenu.time} profId={ctxMenu.profId} onClose={()=>setCtxMenu(null)} onNewBooking={(t,p)=>openCreate(t,p)} onNewBlock={(t,p)=>onOpenBlockModal?.(t,p)}/>}
      {editBlock && <BlockEditModal block={editBlock} professionals={professionals} onClose={()=>setEditBlock(null)} onDeleted={id=>{onDeleteBlock?.(id);setEditBlock(null)}} onUpdated={u=>{onUpdateBlock?.(u);setEditBlock(null)}}/>}

      {/* Ghost durante move */}
      {isMoving && drag?.type==='move' && createPortal(
        <div style={{
          position:'fixed',
          top:  drag.touchY - (drag.ghostHeight/2),
          left: drag.ghostLeft,
          width: drag.ghostWidth,
          height:drag.ghostHeight,
          zIndex:99997, pointerEvents:'none',
          opacity:0.90, filter:'drop-shadow(0 10px 28px rgba(0,0,0,0.30))',
          transform:'scale(1.03)', transition:'top 0.05s ease, left 0.05s ease',
        }}>
          <BookingCard booking={drag.booking} totalHeight={drag.ghostHeight}/>
          <div style={{position:'absolute',bottom:-26,left:'50%',transform:'translateX(-50%)',background:'rgba(220,38,38,0.92)',color:'#fff',fontSize:12,fontWeight:800,fontVariantNumeric:'tabular-nums',padding:'3px 10px',borderRadius:8,whiteSpace:'nowrap',boxShadow:'0 2px 8px rgba(220,38,38,0.35)',pointerEvents:'none'}}>
            {drag.currentTime}
          </div>
        </div>,
        document.body
      )}

      <div
        ref={scrollRef}
        style={{
          flex:1, minHeight:0, overflowY:'auto', overflowX:'auto',
          background:colors.background.page,
          fontFamily:'-apple-system,system-ui,sans-serif',
          cursor: isMoving?'grabbing':isResizing?'ns-resize':'default',
          userSelect:'none', WebkitUserSelect:'none',
          touchAction: drag ? 'none' : 'pan-y pan-x',
        }}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        onTouchCancel={onTouchEnd}
      >
        <style>{`
          .ip-slot{height:${SLOT_H}px;cursor:pointer;box-sizing:border-box;transition:background 0.1s}
          .ip-slot:active{background:${colors.red.subtle}!important}
          .ip-slot-hover{background:rgba(220,38,38,0.12)!important;border-top:2px solid ${colors.red.DEFAULT}!important}
          .ip-hour{border-top:1px solid ${colors.gray.border}}
          .ip-half{border-top:1px dashed rgba(0,0,0,0.06)}
          .ip-5{border-top:1px solid transparent}
          /* Handle resize maior para toque fácil */
          .ip-rh{position:absolute;bottom:0;left:50%;transform:translateX(-50%);width:48px;height:18px;display:flex;align-items:flex-end;justify-content:center;padding-bottom:4px;cursor:ns-resize;z-index:20;touch-action:none}
          .ip-rh::after{content:'';width:28px;height:5px;background:rgba(255,255,255,0.60);border-radius:3px;transition:all 0.15s}
          .ip-rh:active::after{background:rgba(255,255,255,0.98);width:34px;height:6px}
          /* Long press: anel de progresso */
          @keyframes ip-ring{from{outline-width:0px;outline-offset:0px;opacity:0}to{outline-width:3px;outline-offset:2px;opacity:1}}
          .ip-waiting{outline:3px solid ${colors.red.DEFAULT};outline-offset:2px;border-radius:7px;animation:ip-ring 0.4s ease forwards}
          @keyframes ip-pulse{0%{opacity:1}50%{opacity:0.55}100%{opacity:1}}
          .ip-waiting > div{animation:ip-pulse 0.4s ease infinite}
        `}</style>

        <div ref={gridRef} style={{display:'grid',gridTemplateColumns:`${TIME_COL_W}px repeat(${professionals.length},minmax(${MIN_COL_W}px,1fr))`,minWidth:`${TIME_COL_W+professionals.length*MIN_COL_W}px`}}>

          {/* Header canto */}
          <div style={{height:HEADER_H,position:'sticky',top:0,zIndex:20,background:'rgba(255,255,255,0.95)',backdropFilter:'blur(20px)',borderBottom:`1px solid ${colors.gray.border}`,borderRight:`1px solid ${colors.gray.border}`}}/>

          {/* Header profissionais */}
          {professionals.map(p => (
            <div key={p.id} style={{height:HEADER_H,display:'flex',alignItems:'center',justifyContent:'center',gap:8,position:'sticky',top:0,zIndex:20,background:'rgba(255,255,255,0.95)',backdropFilter:'blur(20px)',borderBottom:`1px solid ${colors.gray.border}`,borderLeft:`1px solid ${colors.gray.border}`,fontWeight:600,fontSize:13,color:colors.gray['900']}}>
              <ProfAvatar name={p.name} avatarUrl={p.avatarUrl} size={30}/>
              <span style={{overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',maxWidth:120}}>{p.name}</span>
            </div>
          ))}

          {/* Coluna horários */}
          <div style={{position:'relative',zIndex:2,height:TOTAL_H}}>
            {SLOTS.map((time,i) => {
              const min=i*SLOT_STEP, isHour=min%60===0, isHalf=min%30===0&&!isHour
              return (
                <div key={time} style={{height:SLOT_H,display:'flex',alignItems:'flex-start',justifyContent:'flex-end',paddingRight:8,paddingTop:2,boxSizing:'border-box',borderTop:isHour?`1px solid ${colors.gray.border}`:isHalf?`1px dashed rgba(0,0,0,0.07)`:'1px solid transparent'}}>
                  {isHour && <span style={{fontSize:10,fontWeight:600,color:colors.gray.dimText,fontVariantNumeric:'tabular-nums',lineHeight:1}}>{time}</span>}
                  {isHalf && <span style={{fontSize:9,fontWeight:400,color:colors.gray.dimTextLight,fontVariantNumeric:'tabular-nums',lineHeight:1}}>{time}</span>}
                </div>
              )
            })}
          </div>

          {/* Colunas profissionais */}
          {professionals.map(p => {
            const profBookings = unique.filter(b=>b.professionalId===p.id)
            const profBlocks   = blocks.filter(bl=>bl.professionalId===p.id)
            const layout       = computeOverlapLayout(profBookings)

            const wStart = workingHours?.open ? toMinutes(workingHours.startTime) : START_MIN
            const wEnd   = workingHours?.open ? toMinutes(workingHours.endTime)   : END_HOUR*60
            const preH   = Math.max(0, (wStart - START_MIN) * PX_PER_MIN)
            const postTop= Math.max(0, (wEnd   - START_MIN) * PX_PER_MIN)
            const postH  = Math.max(0, TOTAL_H - postTop)
            const closed = workingHours && !workingHours.open

            return (
              <div key={p.id} style={{position:'relative',borderLeft:`1px solid ${colors.gray.border}`,zIndex:5,height:TOTAL_H}}>

                {/* Slots */}
                {SLOTS.map((time,i) => {
                  const min=i*SLOT_STEP, isHour=min%60===0, isHalf=min%30===0&&!isHour
                  const isHover = isMoving && hoverSlot===time
                  return (
                    <div key={time}
                      className={`ip-slot${isHover?' ip-slot-hover':''} ${isHour?'ip-hour':isHalf?'ip-half':'ip-5'}`}
                      onClick={e=>{ if(drag||longPressId) return; setCtxMenu({x:e.clientX,y:e.clientY,time,profId:p.id}) }}
                    />
                  )
                })}

                {/* Zona antes do expediente */}
                {(preH > 0 || closed) && (
                  <div style={{
                    position:'absolute', top:0, left:0, right:0,
                    height: closed ? TOTAL_H : preH,
                    zIndex:6, pointerEvents:'none',
                    background:'repeating-linear-gradient(-45deg,rgba(0,0,0,0.03) 0px,rgba(0,0,0,0.03) 4px,transparent 4px,transparent 10px)',
                    borderBottom: closed ? 'none' : `1px solid rgba(0,0,0,0.06)`,
                  }}/>
                )}

                {/* Zona após o expediente */}
                {!closed && postH > 0 && (
                  <div style={{
                    position:'absolute', top:postTop, left:0, right:0, height:postH,
                    zIndex:6, pointerEvents:'none',
                    background:'repeating-linear-gradient(-45deg,rgba(0,0,0,0.03) 0px,rgba(0,0,0,0.03) 4px,transparent 4px,transparent 10px)',
                    borderTop:`1px solid rgba(0,0,0,0.06)`,
                  }}/>
                )}

                {/* Bloqueios */}
                {profBlocks.map(bl => {
                  const sMin=toMinutes(bl.startTime), eMin=toMinutes(bl.endTime)
                  if (sMin<START_MIN||sMin>=END_HOUR*60) return null
                  const top=(sMin-START_MIN)*PX_PER_MIN
                  const height=Math.max((eMin-sMin)*PX_PER_MIN-2,MIN_CARD_H)
                  return (
                    <div key={bl.id} style={{position:'absolute',top,left:3,right:3,height,zIndex:7,cursor:'pointer'}} onClick={e=>{e.stopPropagation();setEditBlock(bl)}}>
                      <BlockCard block={bl} totalHeight={height}/>
                    </div>
                  )
                })}

                {/* Bookings */}
                {profBookings.map(b => {
                  const sMin=toMinutes(b.start), eMin=toMinutes(b.end)
                  if (sMin<START_MIN||sMin>=END_HOUR*60) return null
                  const dur=Math.max(eMin-sMin,SLOT_STEP)
                  const top=(sMin-START_MIN)*PX_PER_MIN
                  const baseH=Math.max(dur*PX_PER_MIN-2,MIN_CARD_H)
                  const {col,totalCols}=layout.get(b.id)??{col:0,totalCols:1}
                  const frac=1/totalCols
                  const left=`calc(${col*frac*100}% + 3px)`
                  const width=`calc(${frac*100}% - ${col===totalCols-1?6:3}px)`
                  const isThisMove  = isMoving  && drag?.bookingId===b.id
                  const isThisResize= isResizing && drag?.bookingId===b.id
                  const isSaving    = savingId===b.id
                  const isWaiting   = longPressId===b.id
                  const height = isThisResize && drag?.type==='resize' ? drag.ghostHeight : baseH

                  return (
                    <div key={b.id} style={{
                      position:'absolute', top, left, width, height,
                      zIndex: isThisMove?0:8,
                      opacity: isThisMove?0.2:isSaving?0.55:1,
                      transition: isThisResize?'height 0s':'opacity 0.2s',
                      touchAction:'none',
                    }}
                      onTouchStart={e=>onCardTouchStart(e,b,p.id,top,baseH)}
                      onTouchEnd={onCardTouchEnd}
                    >
                      {isThisMove ? (
                        <div style={{width:'100%',height:'100%',borderRadius:7,background:'rgba(220,38,38,0.10)',border:`2px dashed ${colors.red.border}`}}/>
                      ) : (
                        <div className={isWaiting?'ip-waiting':''} style={{width:'100%',height:'100%'}}>
                          <BookingCard booking={b} totalHeight={height}/>
                        </div>
                      )}

                      {/* Resize handle */}
                      {!isThisMove && height>18 && (
                        <div className="ip-rh" onTouchStart={e=>onResizeTouchStart(e,b,top,baseH)}/>
                      )}

                      {/* Label resize */}
                      {isThisResize && drag?.type==='resize' && (
                        <div style={{position:'absolute',bottom:-18,left:0,right:0,textAlign:'center',fontSize:10,fontWeight:700,color:colors.red.DEFAULT,pointerEvents:'none',fontVariantNumeric:'tabular-nums',textShadow:'0 1px 3px rgba(255,255,255,0.9)',zIndex:50}}>
                          {drag.currentEnd}
                        </div>
                      )}
                    </div>
                  )
                })}

                {/* Ghost preview */}
                {preview?.active && (() => {
                  const dateStr = dayjs(selectedDate).format('YYYY-MM-DD')
                  if (preview.date !== dateStr) return null
                  const previewItems = preview.allItems?.length
                    ? preview.allItems.filter(it => it.profId === p.id)
                    : preview.professionalId === p.id
                      ? [{ startTime: preview.time, endTime: addMin(preview.time, preview.duration), duration: preview.duration, serviceName: preview.serviceName ?? '', profId: p.id }]
                      : []
                  return previewItems.map((it, gi) => {
                    const sMin = toMinutes(it.startTime)
                    if (sMin < START_MIN || sMin >= END_HOUR*60) return null
                    const top = (sMin - START_MIN) * PX_PER_MIN
                    const h   = Math.max(it.duration * PX_PER_MIN - 2, MIN_CARD_H)
                    const isInline = h < 48
                    const clientName = (it as {clientName?:string}).clientName ?? 'Avulso'
                    return (
                      <div key={`preview-${gi}`} style={{position:'absolute',top,left:3,right:3,height:h,zIndex:9,pointerEvents:'none',opacity:0.82,filter:'drop-shadow(0 4px 12px rgba(220,38,38,0.28))'}}>
                        <div style={{width:'100%',height:'100%',borderRadius:7,background:colors.red.gradient,border:'2px dashed rgba(255,255,255,0.55)',boxSizing:'border-box',position:'relative',overflow:'hidden',display:'flex',flexDirection:'column',justifyContent:'center',padding:isInline?'0 8px 0 11px':'4px 8px 4px 11px'}}>
                          <div aria-hidden style={{position:'absolute',left:0,top:0,bottom:0,width:4,background:'rgba(255,255,255,0.42)',borderRadius:'7px 0 0 7px'}}/>
                          {isInline ? (
                            <div style={{display:'flex',alignItems:'center',gap:4,overflow:'hidden',width:'100%',lineHeight:1}}>
                              <span style={{fontSize:10,fontWeight:800,color:'#fff',opacity:0.90,fontVariantNumeric:'tabular-nums',whiteSpace:'nowrap',flexShrink:0}}>{it.startTime}–{it.endTime}</span>
                              <span style={{color:'rgba(255,255,255,0.45)',fontSize:8,flexShrink:0}}>·</span>
                              <span style={{fontSize:11,fontWeight:800,color:'#fff',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis',flexShrink:1,minWidth:0}}>{clientName}</span>
                              {it.serviceName&&<><span style={{color:'rgba(255,255,255,0.45)',fontSize:8,flexShrink:0}}>·</span><span style={{fontSize:10,fontWeight:600,color:'rgba(255,255,255,0.88)',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis',flexShrink:2,minWidth:0}}>{it.serviceName}</span></>}
                            </div>
                          ) : (
                            <>
                              <div style={{color:'rgba(255,255,255,0.78)',fontSize:9,fontWeight:700,fontVariantNumeric:'tabular-nums',lineHeight:1,marginBottom:2}}>{it.startTime}–{it.endTime}</div>
                              <div style={{color:'#fff',fontSize:12,fontWeight:800,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis',lineHeight:1.2}}>{clientName}</div>
                              {it.serviceName&&<div style={{color:'rgba(255,255,255,0.82)',fontSize:10,fontWeight:600,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis',marginTop:1}}>{it.serviceName}</div>}
                            </>
                          )}
                        </div>
                      </div>
                    )
                  })
                })()}

                {/* Hora atual */}
                {currentY>=0 && (
                  <div style={{position:'absolute',top:currentY,left:0,right:0,height:2,background:`linear-gradient(90deg,${colors.red.DEFAULT},${colors.red.light})`,zIndex:15,pointerEvents:'none',boxShadow:`0 0 6px ${colors.red.glow}`}}>
                    <div style={{width:8,height:8,borderRadius:'50%',background:colors.red.DEFAULT,position:'absolute',left:-4,top:-3,boxShadow:`0 0 6px ${colors.red.glow}`}}/>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </>
  )
}