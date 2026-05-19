'use client'
// src/features/agenda/components/AgendaGrid.tsx

import { useRef, useEffect, useState, useCallback } from 'react'
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
const MIN_DUR    = 5

function generateSlots(): string[] {
  const s: string[] = []
  for (let h = START_HOUR; h < END_HOUR; h++)
    for (let m = 0; m < 60; m += SLOT_STEP)
      s.push(`${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`)
  return s
}
function toMinutes(t: string) { const [h, m] = t.split(':').map(Number); return h*60+m }
function minutesToTime(min: number) { return `${String(Math.floor(min/60)).padStart(2,'0')}:${String(min%60).padStart(2,'00')}` }
function snapToSlot(min: number) { return Math.round(min/SLOT_STEP)*SLOT_STEP }

const SLOTS   = generateSlots()
const TOTAL_H = SLOTS.length * SLOT_H

function computeOverlapLayout(bookings: AgendaBooking[]) {
  const result = new Map<string, { col: number; totalCols: number }>()
  const sorted = [...bookings].sort((a,b) => toMinutes(a.start)-toMinutes(b.start))
  const groups: AgendaBooking[][] = []
  for (const b of sorted) {
    let placed = false
    for (const g of groups) {
      if (g.some(x => toMinutes(b.start)<toMinutes(x.end) && toMinutes(b.end)>toMinutes(x.start))) { g.push(b); placed=true; break }
    }
    if (!placed) groups.push([b])
  }
  for (const g of groups) g.forEach((b,col) => result.set(b.id,{col,totalCols:g.length}))
  return result
}

function useCurrentTimeY() {
  const [y, setY] = useState(-1)
  useEffect(() => {
    const calc = () => { const n=new Date(),min=n.getHours()*60+n.getMinutes(); setY(min<START_MIN||min>END_HOUR*60?-1:(min-START_MIN)*PX_PER_MIN) }
    calc(); const id=setInterval(calc,30_000); return ()=>clearInterval(id)
  },[])
  return y
}

function ConflictModal({ onConfirm, onCancel }: { onConfirm:()=>void; onCancel:()=>void }) {
  return (
    <>
      <div onClick={onCancel} style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.3)',backdropFilter:'blur(6px)',zIndex:9998}}/>
      <div style={{position:'fixed',top:'50%',left:'50%',transform:'translate(-50%,-50%)',width:320,maxWidth:'90vw',background:'#fff',borderRadius:20,boxShadow:'0 24px 64px rgba(0,0,0,0.18)',zIndex:9999,padding:'28px 24px 20px',fontFamily:'-apple-system,system-ui,sans-serif',textAlign:'center'}}>
        <div style={{fontSize:36,marginBottom:12}}>⚠️</div>
        <h3 style={{margin:'0 0 8px',fontSize:17,fontWeight:700,color:'#111827'}}>Horário conflitante</h3>
        <p style={{margin:'0 0 20px',fontSize:13,color:'#6b7280',lineHeight:1.5}}>Já existe um agendamento nesse horário.<br/>Deseja agendar mesmo assim?</p>
        <button onClick={onConfirm} style={{width:'100%',padding:'13px',marginBottom:8,background:'linear-gradient(135deg,#dc2626,#b91c1c)',color:'#fff',border:'none',borderRadius:12,fontWeight:600,fontSize:14,cursor:'pointer'}}>Confirmar sobreposição</button>
        <button onClick={onCancel} style={{width:'100%',padding:'11px',background:'rgba(0,0,0,0.04)',border:'1px solid rgba(0,0,0,0.08)',borderRadius:12,fontSize:14,cursor:'pointer',color:'rgba(0,0,0,0.5)'}}>Voltar</button>
      </div>
    </>
  )
}

interface MoveDrag {
  type:'move'; bookingId:string; booking:AgendaBooking; fromProfId:string
  ghostTop:number; ghostLeft:number; ghostWidth:number; ghostHeight:number
  offsetY:number; currentProfId:string; currentTime:string
  mouseX:number; mouseY:number  // posição atual do mouse para o ghost fixed
}
interface ResizeDrag {
  type:'resize'; bookingId:string; booking:AgendaBooking; profId:string
  startTop:number; ghostHeight:number; currentEnd:string
}
type ActiveDrag = MoveDrag | ResizeDrag
import { WorkingHours } from './AgendaBoard'

interface ContextMenu { x:number; y:number; time:string; profId:string }
interface Props {
  professionals:AgendaProfessional[]; bookings:AgendaBooking[]; blocks:AgendaBlock[]
  workingHours?: WorkingHours
  onOpenBlockModal?:(time?:string,profId?:string)=>void
  onDeleteBlock?:(id:string)=>void; onUpdateBlock?:(block:AgendaBlock)=>void
}

export default function AgendaGrid({ professionals, bookings, blocks, workingHours, onOpenBlockModal, onDeleteBlock, onUpdateBlock }: Props) {
  const { openCreate, selectedDate, updateBooking } = useAgendaStore()
  const scrollRef = useRef<HTMLDivElement>(null)
  const gridRef   = useRef<HTMLDivElement>(null)
  const currentY  = useCurrentTimeY()

  const [drag,      setDrag]      = useState<ActiveDrag|null>(null)
  const [hoverSlot, setHoverSlot] = useState<string|null>(null)
  const [conflict,  setConflict]  = useState<{bookingId:string;startAt:string;professionalId:string}|null>(null)
  const [savingId,  setSavingId]  = useState<string|null>(null)
  const [ctxMenu,   setCtxMenu]   = useState<ContextMenu|null>(null)
  const [editBlock, setEditBlock] = useState<AgendaBlock|null>(null)

  const seen   = new Set<string>()
  const unique = bookings.filter(b => { if(seen.has(b.id)) return false; seen.add(b.id); return true })

  useEffect(() => {
    if (currentY>0 && scrollRef.current) scrollRef.current.scrollTop = Math.max(0,currentY-120)
  },[currentY])

  const doReschedule = useCallback(async (bookingId:string, time:string, professionalId:string, allowOverlap:boolean) => {
    const dateStr = dayjs(selectedDate).format('YYYY-MM-DD')
    const startAt = dayjs.tz(`${dateStr} ${time}`,'America/Sao_Paulo').toISOString()
    try {
      setSavingId(bookingId)
      const res = await api.patch(`/bookings/${bookingId}/reschedule`,{startAt,professionalId,allowOverlap})
      const b   = res.data?.data ?? res.data
      if (b) updateBooking(dateStr,{id:bookingId,professionalId:b.professionalId??professionalId,clientName:b.clientName,serviceName:b.service?.name??'',serviceColor:b.service?.color??undefined,start:dayjs(b.startAt).tz('America/Sao_Paulo').format('HH:mm'),end:dayjs(b.endAt).tz('America/Sao_Paulo').format('HH:mm'),status:b.status})
    } catch (err:unknown) {
      const status = (err as {response?:{status?:number}})?.response?.status
      const code   = (err as {response?:{data?:{code?:string}}})?.response?.data?.code
      if (status===409||code==='BOOKING_CONFLICT') setConflict({bookingId,startAt,professionalId})
    } finally { setSavingId(null) }
  },[selectedDate,updateBooking])

  const doResize = useCallback(async (bookingId:string, booking:AgendaBooking, newEnd:string) => {
    const dateStr = dayjs(selectedDate).format('YYYY-MM-DD')
    const startAt = dayjs.tz(`${dateStr} ${booking.start}`,'America/Sao_Paulo').toISOString()
    const endAt   = dayjs.tz(`${dateStr} ${newEnd}`,'America/Sao_Paulo').toISOString()
    try {
      setSavingId(bookingId)
      const res = await api.patch(`/bookings/${bookingId}/resize`,{startAt,endAt})
      const b   = res.data?.data ?? res.data
      if (b) updateBooking(dateStr,{id:bookingId,professionalId:b.professionalId??booking.professionalId,clientName:b.clientName,serviceName:b.service?.name??'',serviceColor:b.service?.color??undefined,start:dayjs(b.startAt).tz('America/Sao_Paulo').format('HH:mm'),end:dayjs(b.endAt).tz('America/Sao_Paulo').format('HH:mm'),status:b.status})
    } catch (err) { console.error('[resize]',err) }
    finally { setSavingId(null) }
  },[selectedDate,updateBooking])

  function onCardMouseDown(e:React.MouseEvent, booking:AgendaBooking, profId:string, cardTop:number, cardHeight:number) {
    e.preventDefault(); e.stopPropagation()
    const rect       = gridRef.current?.getBoundingClientRect()
    const scrollTop  = scrollRef.current?.scrollTop ?? 0
    const colW       = rect ? (rect.width - TIME_COL_W) / professionals.length : 120
    const profIdx    = professionals.findIndex(p => p.id === profId)
    const ghostLeft  = (rect?.left ?? 0) + TIME_COL_W + profIdx * colW + 4
    const ghostWidth = colW - 8
    // offsetY = distância do clique ao topo do card, em coordenadas de tela
    const cardTopScreen = (rect?.top ?? 0) + HEADER_H + cardTop - scrollTop
    const offsetY    = Math.max(0, e.clientY - cardTopScreen)
    setDrag({type:'move',bookingId:booking.id,booking,fromProfId:profId,ghostTop:cardTop,ghostLeft,ghostWidth,ghostHeight:cardHeight,offsetY,currentProfId:profId,currentTime:booking.start,mouseX:e.clientX,mouseY:e.clientY})
  }

  function onResizeMouseDown(e:React.MouseEvent, booking:AgendaBooking, profId:string, cardTop:number, cardHeight:number) {
    e.preventDefault(); e.stopPropagation()
    setDrag({type:'resize',bookingId:booking.id,booking,profId,startTop:cardTop,ghostHeight:cardHeight,currentEnd:booking.end})
  }

  useEffect(() => {
    if (!drag) return
    function onMouseMove(e:MouseEvent) {
      if (!drag||!gridRef.current||!scrollRef.current) return
      if (drag.type==='move') {
        const rect   = scrollRef.current.getBoundingClientRect()
        const relY   = e.clientY - rect.top + scrollRef.current.scrollTop - HEADER_H
        const absMin = START_MIN + relY / PX_PER_MIN
        const snap   = Math.max(START_MIN,Math.min(snapToSlot(absMin),END_HOUR*60-SLOT_STEP))
        const relX   = e.clientX-rect.left+scrollRef.current.scrollLeft-TIME_COL_W
        const colW   = (rect.width-TIME_COL_W)/professionals.length
        const colIdx = Math.max(0,Math.min(Math.floor(relX/colW),professionals.length-1))
        const prof   = professionals[colIdx]
        setDrag(prev=>prev?.type==='move'?{...prev,ghostTop:(snap-START_MIN)*PX_PER_MIN,ghostLeft:(rect.left)+TIME_COL_W+colIdx*colW+4,ghostWidth:colW-8,currentProfId:prof?.id??prev.currentProfId,currentTime:minutesToTime(snap),mouseX:e.clientX,mouseY:e.clientY}:prev)
        setHoverSlot(minutesToTime(snap))
      }
      if (drag.type==='resize') {
        const rect   = scrollRef.current.getBoundingClientRect()
        const relY   = e.clientY - rect.top + scrollRef.current.scrollTop - HEADER_H
        const endMin = Math.max(toMinutes(drag.booking.start)+MIN_DUR,Math.min(snapToSlot(START_MIN+relY/PX_PER_MIN),END_HOUR*60))
        const h      = Math.max((endMin-toMinutes(drag.booking.start))*PX_PER_MIN-2,MIN_CARD_H)
        setDrag(prev=>prev?.type==='resize'?{...prev,ghostHeight:h,currentEnd:minutesToTime(endMin)}:prev)
      }
    }
    function onMouseUp() {
      if (!drag) return
      if (drag.type==='move') {
        const {bookingId,currentTime,currentProfId,fromProfId,booking}=drag
        setDrag(null); setHoverSlot(null)
        if (currentTime!==booking.start||currentProfId!==fromProfId) doReschedule(bookingId,currentTime,currentProfId,false)
      }
      if (drag.type==='resize') {
        const {bookingId,booking,currentEnd}=drag
        setDrag(null); setHoverSlot(null)
        if (currentEnd!==booking.end) doResize(bookingId,booking,currentEnd)
      }
    }
    window.addEventListener('mousemove',onMouseMove)
    window.addEventListener('mouseup',onMouseUp)
    return ()=>{window.removeEventListener('mousemove',onMouseMove);window.removeEventListener('mouseup',onMouseUp)}
  },[drag,professionals,doReschedule,doResize])

  function handleConflictConfirm() {
    if (!conflict) return
    const time=dayjs(conflict.startAt).tz('America/Sao_Paulo').format('HH:mm')
    const {bookingId,professionalId}=conflict
    setConflict(null); doReschedule(bookingId,time,professionalId,true)
  }

  const isMoving   = drag?.type==='move'
  const isResizing = drag?.type==='resize'

  return (
    <>
      {conflict && <ConflictModal onConfirm={handleConflictConfirm} onCancel={()=>setConflict(null)}/>}
      {ctxMenu && <SlotContextMenu x={ctxMenu.x} y={ctxMenu.y} time={ctxMenu.time} profId={ctxMenu.profId} onClose={()=>setCtxMenu(null)} onNewBooking={(t,p)=>openCreate(t,p)} onNewBlock={(t,p)=>onOpenBlockModal?.(t,p)}/>}
      {editBlock && <BlockEditModal block={editBlock} professionals={professionals} onClose={()=>setEditBlock(null)} onDeleted={id=>{onDeleteBlock?.(id);setEditBlock(null)}} onUpdated={u=>{onUpdateBlock?.(u);setEditBlock(null)}}/>}

      <div ref={scrollRef} style={{flex:1,minHeight:0,overflowY:'auto',overflowX:'auto',background:colors.background.page,fontFamily:'-apple-system,system-ui,sans-serif',cursor:isMoving?'grabbing':isResizing?'ns-resize':'default',userSelect:drag?'none':'auto'}}>
        <style>{`
          .ag-slot{height:${SLOT_H}px;cursor:pointer;box-sizing:border-box;transition:background 0.1s}
          .ag-slot:hover{background:${colors.red.subtle}!important}
          .ag-slot-hover{background:rgba(220,38,38,0.12)!important;border-top:2px solid ${colors.red.DEFAULT}!important;z-index:6;position:relative}
          .ag-hour{border-top:1px solid ${colors.gray.border}}
          .ag-half{border-top:1px dashed rgba(0,0,0,0.06)}
          .ag-5{border-top:1px solid transparent}
          .rh{position:absolute;bottom:0;left:50%;transform:translateX(-50%);width:28px;height:8px;display:flex;align-items:center;justify-content:center;cursor:ns-resize;z-index:20;border-radius:0 0 7px 7px}
          .rh::after{content:'';width:20px;height:4px;background:rgba(255,255,255,0.50);border-radius:2px;transition:all 0.15s}
          .rh:hover::after{background:rgba(255,255,255,0.95);width:24px;height:5px;box-shadow:0 0 4px rgba(0,0,0,0.2)}
        `}</style>

        <div ref={gridRef} style={{display:'grid',gridTemplateColumns:`${TIME_COL_W}px repeat(${professionals.length},minmax(${MIN_COL_W}px,1fr))`,minWidth:`${TIME_COL_W+professionals.length*MIN_COL_W}px`}}>

          {/* Header canto */}
          <div style={{height:HEADER_H,position:'sticky',top:0,zIndex:20,background:'rgba(255,255,255,0.95)',backdropFilter:'blur(20px)',borderBottom:`1px solid ${colors.gray.border}`,borderRight:`1px solid ${colors.gray.border}`}}/>

          {/* Header profissionais */}
          {professionals.map(p => {
            const initials=p.name.split(' ').slice(0,2).map(w=>w[0]).join('').toUpperCase()
            return (
              <div key={p.id} style={{height:HEADER_H,display:'flex',alignItems:'center',justifyContent:'center',gap:8,position:'sticky',top:0,zIndex:20,background:'rgba(255,255,255,0.95)',backdropFilter:'blur(20px)',borderBottom:`1px solid ${colors.gray.border}`,borderLeft:`1px solid ${colors.gray.border}`,fontWeight:600,fontSize:13,color:colors.gray['900']}}>
                <div style={{width:30,height:30,borderRadius:'50%',background:colors.red.gradient,color:'#fff',fontSize:11,fontWeight:700,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,boxShadow:`0 2px 8px ${colors.red.glow}`}}>{initials}</div>
                <span style={{overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',maxWidth:100}}>{p.name}</span>
              </div>
            )
          })}

          {/* Coluna horários */}
          <div style={{position:'relative',zIndex:2,height:TOTAL_H}}>
            {SLOTS.map((time,i) => {
              const min=i*SLOT_STEP,isHour=min%60===0,isHalf=min%30===0&&!isHour
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

            // Zonas fora do expediente
            const wStart = workingHours?.open ? toMinutes(workingHours.startTime) : START_MIN
            const wEnd   = workingHours?.open ? toMinutes(workingHours.endTime)   : END_HOUR*60
            const preH   = Math.max(0, (wStart - START_MIN) * PX_PER_MIN)
            const postTop= Math.max(0, (wEnd   - START_MIN) * PX_PER_MIN)
            const postH  = Math.max(0, TOTAL_H - postTop)
            const closed = workingHours && !workingHours.open

            return (
              <div key={p.id} style={{position:'relative',borderLeft:`1px solid ${colors.gray.border}`,zIndex:5,height:TOTAL_H}}>
                {SLOTS.map((time,i) => {
                  const min=i*SLOT_STEP,isHour=min%60===0,isHalf=min%30===0&&!isHour
                  const isHover = isMoving && hoverSlot===time
                  return <div key={time} className={`ag-slot${isHover?' ag-slot-hover':''} ${isHour?'ag-hour':isHalf?'ag-half':'ag-5'}`} onClick={e=>{ if(drag) return; e.preventDefault(); setCtxMenu({x:e.clientX,y:e.clientY,time,profId:p.id}) }}/>
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

                {profBlocks.map(bl => {
                  const sMin=toMinutes(bl.startTime),eMin=toMinutes(bl.endTime)
                  if (sMin<START_MIN||sMin>=END_HOUR*60) return null
                  const top=((sMin-START_MIN)*PX_PER_MIN), height=Math.max((eMin-sMin)*PX_PER_MIN-2,MIN_CARD_H)
                  return (
                    <div key={bl.id} style={{position:'absolute',top,left:3,right:3,height,zIndex:7,cursor:'pointer'}} onClick={e=>{e.stopPropagation();setEditBlock(bl)}}>
                      <BlockCard block={bl} totalHeight={height}/>
                    </div>
                  )
                })}

                {profBookings.map(b => {
                  const sMin=toMinutes(b.start),eMin=toMinutes(b.end)
                  if (sMin<START_MIN||sMin>=END_HOUR*60) return null
                  const dur=Math.max(eMin-sMin,SLOT_STEP)
                  const top=(sMin-START_MIN)*PX_PER_MIN
                  const baseH=Math.max(dur*PX_PER_MIN-2,MIN_CARD_H)
                  const {col,totalCols}=layout.get(b.id)??{col:0,totalCols:1}
                  const frac=1/totalCols
                  const left=`calc(${col*frac*100}% + 3px)`
                  const width=`calc(${frac*100}% - ${col===totalCols-1?6:3}px)`
                  const isThisMove   = isMoving   && drag?.bookingId===b.id
                  const isThisResize = isResizing && drag?.bookingId===b.id
                  const isSaving     = savingId===b.id
                  const height = isThisResize && drag?.type==='resize' ? drag.ghostHeight : baseH

                  return (
                    <div key={b.id} style={{position:'absolute',top,left,width,height,zIndex:isThisMove?0:8,opacity:isThisMove?0.22:isSaving?0.6:1,transition:isThisResize?'height 0s':'opacity 0.2s',cursor:isThisResize?'ns-resize':'grab'}}
                      onMouseDown={e=>{
                        if ((e.target as HTMLElement).closest('.rh')) return
                        onCardMouseDown(e,b,p.id,top,baseH)
                      }}>
                      <BookingCard booking={b} totalHeight={height}/>

                      {/* Resize handle */}
                      {height>18 && (
                        <div className="rh" onMouseDown={e=>onResizeMouseDown(e,b,p.id,top,baseH)}/>
                      )}

                      {/* Label horário durante resize */}
                      {isThisResize && drag?.type==='resize' && (
                        <div style={{position:'absolute',bottom:-18,left:0,right:0,textAlign:'center',fontSize:10,fontWeight:700,color:colors.red.DEFAULT,pointerEvents:'none',fontVariantNumeric:'tabular-nums',textShadow:'0 1px 3px rgba(255,255,255,0.9)',zIndex:50}}>
                          {drag.currentEnd}
                        </div>
                      )}
                    </div>
                  )
                })}

                {currentY>=0 && (
                  <div style={{position:'absolute',top:currentY,left:0,right:0,height:2,background:`linear-gradient(90deg,${colors.red.DEFAULT},${colors.red.light})`,zIndex:15,pointerEvents:'none',boxShadow:`0 0 6px ${colors.red.glow}`}}>
                    <div style={{width:8,height:8,borderRadius:'50%',background:colors.red.DEFAULT,position:'absolute',left:-4,top:-3,boxShadow:`0 0 6px ${colors.red.glow}`}}/>
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Ghost mover — coluna correta + mouse Y */}
        {isMoving && drag?.type==='move' && drag.ghostWidth > 0 && (
          <div style={{
            position:'fixed',
            top:    drag.mouseY - drag.offsetY,
            left:   drag.ghostLeft,
            width:  drag.ghostWidth,
            height: drag.ghostHeight,
            zIndex:9997, pointerEvents:'none',
            opacity:0.90,
            filter:'drop-shadow(0 10px 28px rgba(0,0,0,0.28))',
            transform:'scale(1.025)',
            transition:'none',
          }}>
            <BookingCard booking={drag.booking} totalHeight={drag.ghostHeight}/>
            <div style={{position:'absolute',bottom:-20,left:0,right:0,textAlign:'center',fontSize:11,fontWeight:700,color:colors.red.DEFAULT,fontVariantNumeric:'tabular-nums',textShadow:'0 1px 4px rgba(255,255,255,0.9)'}}>{drag.currentTime}</div>
          </div>
        )}
      </div>
    </>
  )
}