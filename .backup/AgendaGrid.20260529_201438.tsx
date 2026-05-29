'use client'
// src/features/agenda/components/AgendaGrid.tsx
// Grade desktop — mouse + drag/resize, com click vs drag bem distinto.

import { useRef, useEffect, useState, useCallback, useMemo } from 'react'
import dayjs from 'dayjs'
import BookingCard      from './BookingCard'
import BlockCard        from './BlockCard'
import SlotContextMenu  from './SlotContextMenu'
import BlockEditModal   from './BlockEditModal'
import ConfirmModal     from './shared/ConfirmModal'
import ProfAvatar       from './shared/ProfAvatar'
import OffHoursOverlay  from './shared/OffHoursOverlay'
import CurrentTimeLine  from './shared/CurrentTimeLine'
import PreviewGhost, { PreviewItem } from './shared/PreviewGhost'
import { AgendaProfessional, AgendaBooking, AgendaBlock } from '../types'
import { colors, agendaLayout } from '@/shared/theme'
import { useAgendaStore }   from '../hooks/useAgendaStore'
import { useCurrentTimeY }  from '../hooks/useCurrentTimeY'
import { useBookingActions } from '../hooks/useBookingActions'
import { toMinutes, minutesToTime, snapToSlot, addMin, buildSlots, computeGridRange } from '../utils/time'
import { computeOverlapLayout, computeOffHoursOverlay, uniqueBookings } from '../utils/layout'
import {
  SLOT_STEP, SLOT_H, PX_PER_MIN, MIN_CARD_H_DESKTOP, MIN_DUR,
  DRAG_THRESHOLD_PX, DEFAULT_START_HOUR_DESKTOP, DEFAULT_END_HOUR_DESKTOP,
  EASE, Z,
} from '../constants'
import { WorkingHours } from './AgendaBoard'

// ─── Constantes de layout ─────────────────────────────────────────────────────
const TIME_COL_W = agendaLayout.timeColWidth
const MIN_COL_W  = agendaLayout.minColWidth
const HEADER_H   = agendaLayout.headerHeight

// ─── Tipos de drag ────────────────────────────────────────────────────────────
interface MoveDrag {
  type:           'move'
  bookingId:      string
  booking:        AgendaBooking
  fromProfId:     string
  fromTime:       string
  ghostHeight:    number
  ghostWidth:     number
  ghostLeft:      number  // posição X no viewport (px)
  offsetY:        number  // distância do mouse ao topo do card
  currentProfId:  string
  currentTime:    string
  mouseX:         number
  mouseY:         number
  /** True quando o mouse já se moveu além do threshold (passou de candidato a drag real) */
  isActive:       boolean
}
interface ResizeDrag {
  type:        'resize'
  bookingId:   string
  booking:     AgendaBooking
  profId:      string
  ghostHeight: number
  currentEnd:  string
}
type ActiveDrag = MoveDrag | ResizeDrag

interface ContextMenu { x: number; y: number; time: string; profId: string }

interface Props {
  professionals:    AgendaProfessional[]
  bookings:         AgendaBooking[]
  blocks:           AgendaBlock[]
  workingHours?:    WorkingHours
  onOpenBlockModal?:(time?: string, profId?: string) => void
  onDeleteBlock?:   (id: string) => void
  onUpdateBlock?:   (block: AgendaBlock) => void
}

export default function AgendaGrid({
  professionals, bookings, blocks, workingHours,
  onOpenBlockModal, onDeleteBlock, onUpdateBlock,
}: Props) {
  const openCreate    = useAgendaStore(s => s.openCreate)
  const openView      = useAgendaStore(s => s.openView)
  const selectedDate  = useAgendaStore(s => s.selectedDate)
  const preview       = useAgendaStore(s => s.preview)

  // Ações centralizadas (reschedule/resize/conflict)
  const { savingId, pendingAction, setPendingAction, doReschedule, doResize } = useBookingActions(selectedDate)

  // Refs DOM
  const scrollRef = useRef<HTMLDivElement>(null)
  const gridRef   = useRef<HTMLDivElement>(null)

  // ─── Range de horas ────────────────────────────────────────────────────────
  const { startHour: START_HOUR, endHour: END_HOUR, startMin: START_MIN } = useMemo(
    () => computeGridRange(workingHours, { startHour: DEFAULT_START_HOUR_DESKTOP, endHour: DEFAULT_END_HOUR_DESKTOP }),
    [workingHours],
  )
  const SLOTS    = useMemo(() => buildSlots(START_HOUR, END_HOUR), [START_HOUR, END_HOUR])
  const TOTAL_H  = SLOTS.length * SLOT_H
  const currentY = useCurrentTimeY(START_MIN, PX_PER_MIN, END_HOUR)

  // ─── Bookings deduplicados ─────────────────────────────────────────────────
  const unique = useMemo(() => uniqueBookings(bookings), [bookings])

  // ─── Estados de UI ─────────────────────────────────────────────────────────
  // dragRef é a fonte da verdade; setDrag só pra forçar re-render visual.
  const dragRef = useRef<ActiveDrag | null>(null)
  const [drag, setDragState] = useState<ActiveDrag | null>(null)
  function setDrag(next: ActiveDrag | null) {
    dragRef.current = next
    setDragState(next)
  }

  const [hoverSlot, setHoverSlot] = useState<string | null>(null)
  const [ctxMenu,   setCtxMenu]   = useState<ContextMenu | null>(null)
  const [editBlock, setEditBlock] = useState<AgendaBlock | null>(null)

  // ─── Scroll inicial / scroll para preview ──────────────────────────────────
  useEffect(() => {
    if (!preview?.active || !scrollRef.current) return
    const targetY = Math.max(0, (toMinutes(preview.time) - START_MIN - 60) * PX_PER_MIN)
    scrollRef.current.scrollTo({ top: targetY, behavior: 'smooth' })
  }, [preview?.time, preview?.active, START_MIN])

  // Scroll inicial: 1h antes da hora atual (ou expediente)
  const didInitialScroll = useRef(false)
  useEffect(() => {
    if (didInitialScroll.current) return
    if (!scrollRef.current) return
    if (currentY < 0 && !workingHours) return // espera dados

    didInitialScroll.current = true
    const target = currentY > 0
      ? Math.max(0, currentY - 60 * PX_PER_MIN)
      : workingHours?.open
        ? Math.max(0, (toMinutes(workingHours.startTime) - START_MIN - 60) * PX_PER_MIN)
        : 0
    scrollRef.current.scrollTop = target
  }, [currentY, workingHours, START_MIN])

  // ─── Handlers de drag (move) ───────────────────────────────────────────────
  const onCardMouseDown = useCallback((
    e: React.MouseEvent, booking: AgendaBooking, profId: string, cardTop: number, cardHeight: number,
  ) => {
    e.preventDefault()
    e.stopPropagation()

    const rect      = gridRef.current?.getBoundingClientRect()
    const scrollTop = scrollRef.current?.scrollTop ?? 0
    const colW      = rect ? (rect.width - TIME_COL_W) / professionals.length : 120
    const profIdx   = professionals.findIndex(p => p.id === profId)
    const ghostLeft = (rect?.left ?? 0) + TIME_COL_W + profIdx * colW + 4
    const cardTopScreen = (rect?.top ?? 0) + HEADER_H + cardTop - scrollTop
    const offsetY   = Math.max(0, e.clientY - cardTopScreen)

    setDrag({
      type:'move',
      bookingId: booking.id,
      booking,
      fromProfId: profId,
      fromTime:   booking.start,
      ghostHeight: cardHeight,
      ghostWidth:  colW - 8,
      ghostLeft,
      offsetY,
      currentProfId: profId,
      currentTime:   booking.start,
      mouseX: e.clientX,
      mouseY: e.clientY,
      isActive: false,  // ainda não é drag, só candidato
    })
  }, [professionals])

  // Click puro (sem drag) abre o painel de visualização.
  // Verifica o dragRef pra saber se foi click ou drag-cancelled.
  const onCardClick = useCallback((e: React.MouseEvent, booking: AgendaBooking) => {
    e.stopPropagation()
    // Se houve drag real (passou do threshold), não abre
    if (dragRef.current?.type === 'move' && dragRef.current.isActive) return
    openView(booking)
  }, [openView])

  const onResizeMouseDown = useCallback((
    e: React.MouseEvent, booking: AgendaBooking, profId: string,
    _cardTop: number, cardHeight: number,
  ) => {
    e.preventDefault()
    e.stopPropagation()
    setDrag({
      type:'resize',
      bookingId: booking.id,
      booking,
      profId,
      ghostHeight: cardHeight,
      currentEnd:  booking.end,
    })
  }, [])

  // ─── Listeners globais de mouse — refs estáveis, NÃO dependem de drag ──────
  // Esses listeners ficam sempre montados e lêem dragRef. Sem recriação a cada
  // setState. Isso elimina perda de eventos durante drag rápido.
  useEffect(() => {
    function onMouseMove(e: MouseEvent) {
      const d = dragRef.current
      if (!d || !gridRef.current || !scrollRef.current) return

      if (d.type === 'move') {
        // Detecta se cruzou o threshold (vira drag de fato)
        const dx = Math.abs(e.clientX - d.mouseX)
        const dy = Math.abs(e.clientY - d.mouseY)
        const isActive = d.isActive || dx > DRAG_THRESHOLD_PX || dy > DRAG_THRESHOLD_PX

        const rect    = scrollRef.current.getBoundingClientRect()
        const scrollT = scrollRef.current.scrollTop
        const scrollL = scrollRef.current.scrollLeft

        const relY    = e.clientY - rect.top + scrollT - HEADER_H
        const absMin  = START_MIN + relY / PX_PER_MIN
        const snapMin = Math.max(START_MIN, Math.min(snapToSlot(absMin), END_HOUR * 60 - SLOT_STEP))

        const relX    = e.clientX - rect.left + scrollL - TIME_COL_W
        const colW    = (rect.width - TIME_COL_W) / professionals.length
        const colIdx  = Math.max(0, Math.min(Math.floor(relX / colW), professionals.length - 1))
        const prof    = professionals[colIdx]

        const next: MoveDrag = {
          ...d,
          ghostLeft:     rect.left + TIME_COL_W + colIdx * colW + 4,
          ghostWidth:    colW - 8,
          currentProfId: prof?.id ?? d.currentProfId,
          currentTime:   minutesToTime(snapMin),
          mouseX: e.clientX,
          mouseY: e.clientY,
          isActive,
        }
        dragRef.current = next
        setDragState(next)
        setHoverSlot(isActive ? minutesToTime(snapMin) : null)
        return
      }

      if (d.type === 'resize') {
        const rect    = scrollRef.current.getBoundingClientRect()
        const scrollT = scrollRef.current.scrollTop
        const relY    = e.clientY - rect.top + scrollT - HEADER_H
        const endMin  = Math.max(
          toMinutes(d.booking.start) + MIN_DUR,
          Math.min(snapToSlot(START_MIN + relY / PX_PER_MIN), END_HOUR * 60),
        )
        const h = Math.max((endMin - toMinutes(d.booking.start)) * PX_PER_MIN - 2, MIN_CARD_H_DESKTOP)
        const next: ResizeDrag = { ...d, ghostHeight: h, currentEnd: minutesToTime(endMin) }
        dragRef.current = next
        setDragState(next)
      }
    }

    function onMouseUp() {
      const d = dragRef.current
      dragRef.current = null
      setDragState(null)
      setHoverSlot(null)
      if (!d) return

      if (d.type === 'move') {
        // Sem drag real → foi click (onClick cuida de abrir). Não pede confirmação.
        if (!d.isActive) return
        if (d.currentTime === d.fromTime && d.currentProfId === d.fromProfId) return

        setPendingAction({
          type:'move',
          title: `Confirmar alteração de\n${d.fromTime} para ${d.currentTime}?`,
          confirmLabel: 'Salvar alteração',
          onConfirm: () => {
            setPendingAction(null)
            doReschedule(d.bookingId, d.currentTime, d.currentProfId, false)
          },
        })
        return
      }

      if (d.type === 'resize' && d.currentEnd !== d.booking.end) {
        setPendingAction({
          type:'resize',
          title: `Confirmar alteração de\n${d.booking.start}–${d.booking.end} para ${d.booking.start}–${d.currentEnd}?`,
          confirmLabel: 'Salvar alteração',
          onConfirm: () => {
            setPendingAction(null)
            doResize(d.bookingId, d.booking, d.currentEnd)
          },
        })
      }
    }

    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup',   onMouseUp)
    return () => {
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseup',   onMouseUp)
    }
  }, [professionals, START_MIN, END_HOUR, doReschedule, doResize, setPendingAction])

  const isMove        = drag?.type === 'move'
  const isResize     = drag?.type === 'resize'
  const isMovingReal  = isMove && drag?.type === 'move' && drag.isActive    // só passa true após threshold
  const dateStr       = dayjs(selectedDate).format('YYYY-MM-DD')

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <>
      {pendingAction && (
        <ConfirmModal
          title={pendingAction.title}
          confirmLabel={pendingAction.confirmLabel}
          onConfirm={pendingAction.onConfirm}
          onCancel={() => setPendingAction(null)}
        />
      )}
      {ctxMenu && (
        <SlotContextMenu
          x={ctxMenu.x} y={ctxMenu.y} time={ctxMenu.time} profId={ctxMenu.profId}
          onClose={() => setCtxMenu(null)}
          onNewBooking={(t, p) => openCreate(t, p)}
          onNewBlock={(t, p) => onOpenBlockModal?.(t, p)}
        />
      )}
      {editBlock && (
        <BlockEditModal
          block={editBlock} professionals={professionals}
          onClose={() => setEditBlock(null)}
          onDeleted={id => { onDeleteBlock?.(id); setEditBlock(null) }}
          onUpdated={u  => { onUpdateBlock?.(u);  setEditBlock(null) }}
        />
      )}

      <div
        ref={scrollRef}
        style={{
          flex:1, minHeight:0, overflowY:'auto', overflowX:'auto',
          background: colors.background.page,
          fontFamily: '-apple-system,system-ui,sans-serif',
          // Cursor só muda durante drag real, não em hover
          cursor: isMovingReal ? 'grabbing' : isResize ? 'ns-resize' : 'default',
          userSelect: drag ? 'none' : 'auto',
        }}
      >
        <style>{`
          .ag-slot{height:${SLOT_H}px;cursor:pointer;box-sizing:border-box;transition:background 0.1s ${EASE.smooth}}
          .ag-slot:hover{background:${colors.red.subtle}}
          .ag-slot-hover{background:rgba(220,38,38,0.12)!important;border-top:2px solid ${colors.red.DEFAULT}!important;z-index:6;position:relative}
          .ag-hour{border-top:1px solid ${colors.gray.border}}
          .ag-half{border-top:1px dashed rgba(0,0,0,0.06)}
          .ag-5{border-top:1px solid transparent}
          .ag-rh{position:absolute;bottom:0;left:50%;transform:translateX(-50%);width:28px;height:8px;display:flex;align-items:center;justify-content:center;cursor:ns-resize;z-index:20;border-radius:0 0 7px 7px}
          .ag-rh::after{content:'';width:20px;height:4px;background:rgba(255,255,255,0.50);border-radius:2px;transition:all 0.15s ${EASE.smooth}}
          .ag-rh:hover::after{background:rgba(255,255,255,0.95);width:24px;height:5px;box-shadow:0 0 4px rgba(0,0,0,0.2)}
          .ag-card-hover{cursor:grab}
          .ag-card-hover:active{cursor:grabbing}
        `}</style>

        <div
          ref={gridRef}
          style={{
            display:'grid',
            gridTemplateColumns:`${TIME_COL_W}px repeat(${professionals.length}, minmax(${MIN_COL_W}px, 1fr))`,
            minWidth:`${TIME_COL_W + professionals.length * MIN_COL_W}px`,
          }}
        >
          {/* Header canto */}
          <div style={{
            height: HEADER_H, position:'sticky', top:0, zIndex: Z.headerSticky,
            background:'rgba(255,255,255,0.95)', backdropFilter:'blur(20px)',
            borderBottom:`1px solid ${colors.gray.border}`, borderRight:`1px solid ${colors.gray.border}`,
          }} />

          {/* Header profissionais */}
          {professionals.map(p => (
            <div key={p.id} style={{
              height: HEADER_H, display:'flex', alignItems:'center', justifyContent:'center', gap:8,
              position:'sticky', top:0, zIndex: Z.headerSticky,
              background:'rgba(255,255,255,0.95)', backdropFilter:'blur(20px)',
              borderBottom:`1px solid ${colors.gray.border}`, borderLeft:`1px solid ${colors.gray.border}`,
              fontWeight:600, fontSize:13, color:colors.gray['900'],
            }}>
              <ProfAvatar name={p.name} avatarUrl={p.avatarUrl} size={30} />
              <span style={{ overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', maxWidth:100 }}>
                {p.name}
              </span>
            </div>
          ))}

          {/* Coluna horários */}
          <div style={{ position:'relative', zIndex:2, height: TOTAL_H }}>
            {SLOTS.map((time, i) => {
              const min = i * SLOT_STEP
              const isHour = min % 60 === 0
              const isHalf = min % 30 === 0 && !isHour
              return (
                <div key={time} style={{
                  height: SLOT_H, display:'flex', alignItems:'flex-start', justifyContent:'flex-end',
                  paddingRight:8, paddingTop:2, boxSizing:'border-box',
                  borderTop: isHour ? `1px solid ${colors.gray.border}` : isHalf ? '1px dashed rgba(0,0,0,0.07)' : '1px solid transparent',
                }}>
                  {isHour && (
                    <span style={{ fontSize:10, fontWeight:600, color:colors.gray.dimText, fontVariantNumeric:'tabular-nums', lineHeight:1 }}>
                      {time}
                    </span>
                  )}
                  {isHalf && (
                    <span style={{ fontSize:9, fontWeight:400, color:colors.gray.dimTextLight, fontVariantNumeric:'tabular-nums', lineHeight:1 }}>
                      {time}
                    </span>
                  )}
                </div>
              )
            })}
          </div>

          {/* Colunas profissionais */}
          {professionals.map(p => {
            const profBookings = unique.filter(b => b.professionalId === p.id)
            const profBlocks   = blocks.filter(bl => bl.professionalId === p.id)
            const layout       = computeOverlapLayout(profBookings)
            const offHours     = computeOffHoursOverlay({ workingHours, startMin: START_MIN, endHour: END_HOUR, totalH: TOTAL_H, pxPerMin: PX_PER_MIN })

            // Preview items deste profissional (mesma data)
            const previewItems: PreviewItem[] = preview?.active && preview.date === dateStr
              ? (preview.allItems?.length
                ? preview.allItems.filter(it => it.profId === p.id)
                : preview.professionalId === p.id
                  ? [{ startTime: preview.time, endTime: addMin(preview.time, preview.duration), duration: preview.duration, serviceName: preview.serviceName ?? '', profId: p.id, clientName: preview.clientName }]
                  : [])
              : []

            return (
              <div key={p.id} style={{
                position:'relative',
                borderLeft:`1px solid ${colors.gray.border}`,
                zIndex: Z.gridBase, height: TOTAL_H,
              }}>
                {/* Slots de fundo */}
                {SLOTS.map((time, i) => {
                  const min = i * SLOT_STEP
                  const isHour = min % 60 === 0
                  const isHalf = min % 30 === 0 && !isHour
                  const isHover = isMovingReal && hoverSlot === time
                  return (
                    <div
                      key={time}
                      className={`ag-slot${isHover ? ' ag-slot-hover' : ''} ${isHour ? 'ag-hour' : isHalf ? 'ag-half' : 'ag-5'}`}
                      onClick={e => {
                        if (drag) return
                        e.preventDefault()
                        setCtxMenu({ x: e.clientX, y: e.clientY, time, profId: p.id })
                      }}
                    />
                  )
                })}

                {/* Zonas fora do expediente */}
                <OffHoursOverlay
                  preH={offHours.preH}
                  postTop={offHours.postTop}
                  postH={offHours.postH}
                  closed={offHours.closed}
                  totalH={TOTAL_H}
                />

                {/* Bloqueios */}
                {profBlocks.map(bl => {
                  const sMin = toMinutes(bl.startTime)
                  const eMin = toMinutes(bl.endTime)
                  if (sMin < START_MIN || sMin >= END_HOUR * 60) return null
                  const top    = (sMin - START_MIN) * PX_PER_MIN
                  const height = Math.max((eMin - sMin) * PX_PER_MIN - 2, MIN_CARD_H_DESKTOP)
                  return (
                    <div
                      key={bl.id}
                      style={{ position:'absolute', top, left:3, right:3, height, zIndex: Z.block, cursor:'pointer' }}
                      onClick={e => { e.stopPropagation(); setEditBlock(bl) }}
                    >
                      <BlockCard block={bl} totalHeight={height} />
                    </div>
                  )
                })}

                {/* Agendamentos */}
                {profBookings.map(b => {
                  const sMin = toMinutes(b.start)
                  const eMin = toMinutes(b.end)
                  if (sMin < START_MIN || sMin >= END_HOUR * 60) return null
                  const dur   = Math.max(eMin - sMin, SLOT_STEP)
                  const top   = (sMin - START_MIN) * PX_PER_MIN
                  const baseH = Math.max(dur * PX_PER_MIN - 2, MIN_CARD_H_DESKTOP)
                  const { col, totalCols } = layout.get(b.id) ?? { col: 0, totalCols: 1 }
                  const frac  = 1 / totalCols
                  const left  = `calc(${col * frac * 100}% + 3px)`
                  const width = `calc(${frac * 100}% - ${col === totalCols - 1 ? 6 : 3}px)`
                  const isThisMove   = drag?.type === 'move'   && drag.bookingId === b.id
                  const isThisResize = drag?.type === 'resize' && drag.bookingId === b.id
                  const isSaving     = savingId === b.id
                  const height = isThisResize && drag.type === 'resize' ? drag.ghostHeight : baseH

                  return (
                    <div
                      key={b.id}
                      className="ag-card-hover"
                      style={{
                        position:'absolute', top, left, width, height,
                        zIndex: isThisMove && isMovingReal ? 0 : Z.booking,
                        opacity: isThisMove && isMovingReal ? 0.22 : isSaving ? 0.6 : 1,
                        transition: isThisResize ? 'height 0s' : `opacity 0.2s ${EASE.smooth}`,
                      }}
                      onMouseDown={e => {
                        if ((e.target as HTMLElement).closest('.ag-rh')) return
                        onCardMouseDown(e, b, p.id, top, baseH)
                      }}
                      onClick={e => onCardClick(e, b)}
                    >
                      <BookingCard booking={b} totalHeight={height} />

                      {height > 18 && (
                        <div
                          className="ag-rh"
                          onMouseDown={e => onResizeMouseDown(e, b, p.id, top, baseH)}
                        />
                      )}

                      {isThisResize && drag.type === 'resize' && (
                        <div style={{
                          position:'absolute', bottom:-18, left:0, right:0, textAlign:'center',
                          fontSize:10, fontWeight:700, color: colors.red.DEFAULT,
                          pointerEvents:'none', fontVariantNumeric:'tabular-nums',
                          textShadow:'0 1px 3px rgba(255,255,255,0.9)', zIndex:50,
                        }}>
                          {drag.currentEnd}
                        </div>
                      )}
                    </div>
                  )
                })}

                {/* Preview ghost (do checkout) */}
                {previewItems.map((it, gi) => {
                  const sMin = toMinutes(it.startTime)
                  if (sMin < START_MIN || sMin >= END_HOUR * 60) return null
                  const top  = (sMin - START_MIN) * PX_PER_MIN
                  const h    = Math.max(it.duration * PX_PER_MIN - 2, MIN_CARD_H_DESKTOP)
                  return <PreviewGhost key={`pv-${gi}`} item={it} top={top} height={h} inset={3} radius={7} />
                })}

                {/* Linha de hora atual */}
                <CurrentTimeLine y={currentY} />
              </div>
            )
          })}
        </div>

        {/* Ghost flutuante durante move — só aparece após threshold */}
        {isMovingReal && drag.type === 'move' && drag.ghostWidth > 0 && (
          <div style={{
            position:'fixed',
            top:    drag.mouseY - drag.offsetY,
            left:   drag.ghostLeft,
            width:  drag.ghostWidth,
            height: drag.ghostHeight,
            zIndex: Z.ghostFixed, pointerEvents:'none',
            opacity:0.92,
            filter:'drop-shadow(0 12px 30px rgba(0,0,0,0.30))',
            transform:'scale(1.025)',
            transition:'none',
          }}>
            <BookingCard booking={drag.booking} totalHeight={drag.ghostHeight} />
            <div style={{
              position:'absolute', bottom:-22, left:0, right:0, textAlign:'center',
              fontSize:11, fontWeight:700, color: colors.red.DEFAULT,
              fontVariantNumeric:'tabular-nums',
              textShadow:'0 1px 4px rgba(255,255,255,0.95)',
            }}>
              {drag.currentTime}
            </div>
          </div>
        )}
      </div>
    </>
  )
}
