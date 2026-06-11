'use client'
// src/features/agenda/components/AgendaIPadList.tsx
// Grade iPad — multi-coluna (como desktop) com touch events (como mobile).

import { useRef, useEffect, useLayoutEffect, useState, useCallback, useMemo } from 'react'
import { createPortal } from 'react-dom'
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
import { useAgendaStore }    from '../hooks/useAgendaStore'
import { useCurrentTimeY }   from '../hooks/useCurrentTimeY'
import { useBookingActions } from '../hooks/useBookingActions'
import { toMinutes, minutesToTime, snapToSlot, addMin, buildSlots, computeGridRange } from '../utils/time'
import { computeOverlapLayout, computeOffHoursOverlay, uniqueBookings } from '../utils/layout'
import {
  SLOT_STEP, SLOT_H, PX_PER_MIN, MIN_CARD_H_DESKTOP, MIN_DUR,
  TOUCH_CANCEL_PX, LONG_PRESS_MS, VIBRATE_DRAG_MS, VIBRATE_RESIZE_MS,
  DEFAULT_START_HOUR_DESKTOP, DEFAULT_END_HOUR_DESKTOP,
  EASE, Z,
} from '../constants'
import { WorkingHours } from './AgendaBoard'

// ─── Constantes locais ────────────────────────────────────────────────────────
const TIME_COL_W = agendaLayout.timeColWidth
const MIN_COL_W  = agendaLayout.minColWidth
const HEADER_H   = agendaLayout.headerHeight

// ─── Tipos de drag ────────────────────────────────────────────────────────────
interface MoveDrag {
  type:          'move'
  booking:       AgendaBooking
  fromProfId:    string
  fromTime:      string
  ghostHeight:   number
  /** Coluna alvo atual */
  currentProfId: string
  currentTime:   string
  /** Posição/largura da coluna atual no viewport (medido no touchStart e atualizado no touchmove) */
  colLeft:       number
  colWidth:      number
  /** ghostTop em px na grade (snapped) */
  ghostTop:      number
}
interface ResizeDrag {
  type:        'resize'
  booking:     AgendaBooking
  profId:      string
  ghostHeight: number
  currentEnd:  string
}
type ActiveDrag = MoveDrag | ResizeDrag

interface Props {
  professionals:    AgendaProfessional[]
  bookings:         AgendaBooking[]
  blocks:           AgendaBlock[]
  workingHours?:    WorkingHours
  onOpenBlockModal?:(time?: string, profId?: string) => void
  onDeleteBlock?:   (id: string) => void
  onUpdateBlock?:   (block: AgendaBlock) => void
  focusedProfId?:   string | null
  onFocusProf?:     (id: string | null) => void
}

export default function AgendaIPadList({
  professionals, bookings, blocks, workingHours,
  onOpenBlockModal, onDeleteBlock, onUpdateBlock,
}: Props) {
  const openCreate    = useAgendaStore(s => s.openCreate)
  const openView      = useAgendaStore(s => s.openView)
  const selectedDate  = useAgendaStore(s => s.selectedDate)
  const preview       = useAgendaStore(s => s.preview)

  const { savingId, pendingAction, setPendingAction, doReschedule, doResize } = useBookingActions(selectedDate)

  // ─── Range ─────────────────────────────────────────────────────────────────
  const { startHour: START_HOUR, endHour: END_HOUR, startMin: START_MIN } = useMemo(
    () => computeGridRange(workingHours, { startHour: DEFAULT_START_HOUR_DESKTOP, endHour: DEFAULT_END_HOUR_DESKTOP }),
    [workingHours],
  )
  const SLOTS    = useMemo(() => buildSlots(START_HOUR, END_HOUR), [START_HOUR, END_HOUR])
  const TOTAL_H  = SLOTS.length * SLOT_H
  const currentY = useCurrentTimeY(START_MIN, PX_PER_MIN, END_HOUR)

  const unique = useMemo(() => uniqueBookings(bookings), [bookings])

  // ─── Refs DOM e estado de drag ─────────────────────────────────────────────
  const scrollRef     = useRef<HTMLDivElement>(null)
  const gridRef       = useRef<HTMLDivElement>(null)
  const dragRef       = useRef<ActiveDrag | null>(null)
  const longPressRef  = useRef<ReturnType<typeof setTimeout> | null>(null)
  const touchStartRef = useRef<{ y: number; x: number; time: number } | null>(null)
  const tapBookingRef = useRef<AgendaBooking | null>(null)

  const [drag,        setDragState]  = useState<ActiveDrag | null>(null)
  const [hoverSlot,   setHoverSlot]  = useState<string | null>(null)
  const [ctxMenu,     setCtxMenu]    = useState<{ x: number; y: number; time: string; profId: string } | null>(null)
  const [editBlock,   setEditBlock]  = useState<AgendaBlock | null>(null)
  const [longPressId, setLongPressId] = useState<string | null>(null)

  function setDrag(next: ActiveDrag | null) {
    dragRef.current = next
    setDragState(next)
  }

  const dateStr = dayjs(selectedDate).format('YYYY-MM-DD')

  // ─── Scroll inicial + scroll p/ preview ────────────────────────────────────
  const didInitialScroll = useRef(false)
  useEffect(() => {
    if (didInitialScroll.current) return
    if (!scrollRef.current) return
    if (currentY < 0 && !workingHours) return
    didInitialScroll.current = true

    const target = currentY > 0
      ? Math.max(0, currentY - 60 * PX_PER_MIN)
      : workingHours?.open
        ? Math.max(0, (toMinutes(workingHours.startTime) - START_MIN - 60) * PX_PER_MIN)
        : 0
    scrollRef.current.scrollTop = target
  }, [currentY, workingHours, START_MIN])

  useEffect(() => {
    if (!preview?.active || !scrollRef.current) return
    const targetY = Math.max(0, (toMinutes(preview.time) - START_MIN - 60) * PX_PER_MIN)
    scrollRef.current.scrollTo({ top: targetY, behavior: 'smooth' })
  }, [preview?.time, preview?.active, START_MIN])

  // ─── Helpers (refs lidos só em event handlers) ─────────────────────────────
  const snapFromTouch = useCallback((clientY: number): number => {
    if (!scrollRef.current) return START_MIN
    const rect = scrollRef.current.getBoundingClientRect()
    const relY = clientY - rect.top + scrollRef.current.scrollTop - HEADER_H
    const absMin = START_MIN + relY / PX_PER_MIN
    return Math.max(START_MIN, Math.min(snapToSlot(absMin), END_HOUR * 60 - SLOT_STEP))
  }, [START_MIN, END_HOUR])

  const colInfoFromTouch = useCallback((clientX: number): { colIdx: number; colW: number; colLeft: number } => {
    if (!scrollRef.current) return { colIdx: 0, colW: 0, colLeft: 0 }
    const rect    = scrollRef.current.getBoundingClientRect()
    const scrollL = scrollRef.current.scrollLeft
    const relX    = clientX - rect.left + scrollL - TIME_COL_W
    const colW    = (rect.width - TIME_COL_W) / Math.max(1, professionals.length)
    const colIdx  = Math.max(0, Math.min(Math.floor(relX / colW), professionals.length - 1))
    return { colIdx, colW, colLeft: rect.left + TIME_COL_W + colIdx * colW }
  }, [professionals.length])

  // ─── Touch handlers ────────────────────────────────────────────────────────
  const onCardTouchStart = useCallback((
    e: React.TouchEvent, booking: AgendaBooking, profId: string, _cardTop: number, cardHeight: number,
  ) => {
    const touch = e.touches[0]
    touchStartRef.current = { y: touch.clientY, x: touch.clientX, time: Date.now() }
    tapBookingRef.current = booking
    setLongPressId(booking.id)

    longPressRef.current = setTimeout(() => {
      if (navigator.vibrate) navigator.vibrate(VIBRATE_DRAG_MS)
      setLongPressId(null)
      tapBookingRef.current = null

      const snapMin = snapFromTouch(touch.clientY)
      const { colIdx, colW, colLeft } = colInfoFromTouch(touch.clientX)
      const prof = professionals[colIdx]

      setDrag({
        type:'move', booking,
        fromProfId: profId,
        fromTime:   booking.start,
        ghostHeight: cardHeight,
        currentProfId: prof?.id ?? profId,
        currentTime:   minutesToTime(snapMin),
        colLeft:  colLeft + 4,
        colWidth: colW - 8,
        ghostTop: (snapMin - START_MIN) * PX_PER_MIN,
      })
    }, LONG_PRESS_MS)
  }, [professionals, snapFromTouch, colInfoFromTouch, START_MIN])

  const onCardTouchEnd = useCallback(() => {
    if (longPressRef.current) {
      clearTimeout(longPressRef.current)
      longPressRef.current = null
    }
    setLongPressId(null)
    // Tap rápido (sem drag, sem cancelamento) → abre painel
    if (!dragRef.current && tapBookingRef.current) {
      openView(tapBookingRef.current)
    }
    tapBookingRef.current = null
  }, [openView])

  const onResizeTouchStart = useCallback((e: React.TouchEvent, booking: AgendaBooking, cardHeight: number) => {
    e.stopPropagation()
    // Cancela qualquer long-press pendente do card pai
    if (longPressRef.current) {
      clearTimeout(longPressRef.current)
      longPressRef.current = null
    }
    setLongPressId(null)
    tapBookingRef.current = null

    if (navigator.vibrate) navigator.vibrate(VIBRATE_RESIZE_MS)
    setDrag({
      type:'resize', booking,
      profId: booking.professionalId,
      ghostHeight: cardHeight,
      currentEnd:  booking.end,
    })
  }, [])

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0]

    // Cancela long-press + tap se moveu (= scroll)
    if (longPressRef.current && touchStartRef.current) {
      const dx = Math.abs(touch.clientX - touchStartRef.current.x)
      const dy = Math.abs(touch.clientY - touchStartRef.current.y)
      if (dx > TOUCH_CANCEL_PX || dy > TOUCH_CANCEL_PX) {
        clearTimeout(longPressRef.current)
        longPressRef.current = null
        setLongPressId(null)
        tapBookingRef.current = null // FIX #7: não abre painel se foi scroll
      }
    }

    const d = dragRef.current
    if (!d) return
    e.preventDefault()

    if (d.type === 'move') {
      const snapMin = snapFromTouch(touch.clientY)
      const { colIdx, colW, colLeft } = colInfoFromTouch(touch.clientX)
      const prof = professionals[colIdx]
      setDrag({
        ...d,
        colLeft:  colLeft + 4,
        colWidth: colW - 8,
        currentProfId: prof?.id ?? d.currentProfId,
        currentTime:   minutesToTime(snapMin),
        ghostTop: (snapMin - START_MIN) * PX_PER_MIN,
      })
      setHoverSlot(minutesToTime(snapMin))
      return
    }

    if (d.type === 'resize') {
      if (!scrollRef.current) return
      const rect    = scrollRef.current.getBoundingClientRect()
      const scrollT = scrollRef.current.scrollTop
      const relY    = touch.clientY - rect.top + scrollT - HEADER_H
      const endMin  = Math.max(
        toMinutes(d.booking.start) + MIN_DUR,
        Math.min(snapToSlot(START_MIN + relY / PX_PER_MIN), END_HOUR * 60),
      )
      const h = Math.max((endMin - toMinutes(d.booking.start)) * PX_PER_MIN - 2, MIN_CARD_H_DESKTOP)
      setDrag({ ...d, ghostHeight: h, currentEnd: minutesToTime(endMin) })
    }
  }, [professionals, snapFromTouch, colInfoFromTouch, START_MIN, END_HOUR])

  const onTouchEnd = useCallback(() => {
    if (longPressRef.current) {
      clearTimeout(longPressRef.current)
      longPressRef.current = null
    }
    setLongPressId(null)
    setHoverSlot(null)

    const d = dragRef.current
    dragRef.current = null
    setDragState(null)
    if (!d) return

    if (d.type === 'move' && (d.currentTime !== d.fromTime || d.currentProfId !== d.fromProfId)) {
      setPendingAction({
        type:'move',
        title: `Confirmar alteração de\n${d.fromTime} para ${d.currentTime}?`,
        confirmLabel: 'Salvar alteração',
        onConfirm: () => {
          setPendingAction(null)
          doReschedule(d.booking.id, d.currentTime, d.currentProfId, false)
        },
      })
    }
    if (d.type === 'resize' && d.currentEnd !== d.booking.end) {
      setPendingAction({
        type:'resize',
        title: `Confirmar alteração de\n${d.booking.start}–${d.booking.end} para ${d.booking.start}–${d.currentEnd}?`,
        confirmLabel: 'Salvar alteração',
        onConfirm: () => {
          setPendingAction(null)
          doResize(d.booking.id, d.booking, d.currentEnd)
        },
      })
    }
  }, [doReschedule, doResize, setPendingAction])

  const isMove   = drag?.type === 'move'
  const isResize = drag?.type === 'resize'

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <>
      {pendingAction && (
        <ConfirmModal
          variant="centered"
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

      {/* Ghost flutuante durante move */}
      {isMove && drag.type === 'move' && createPortal(
        <IpadGhostFloater drag={drag} scrollRef={scrollRef} />,
        document.body,
      )}

      <div
        ref={scrollRef}
        style={{
          flex:1, minHeight:0, overflowY:'auto', overflowX:'auto',
          background: colors.background.page,
          fontFamily: '-apple-system,system-ui,sans-serif',
          cursor: isMove ? 'grabbing' : isResize ? 'ns-resize' : 'default',
          userSelect: 'none', WebkitUserSelect: 'none',
          touchAction: drag ? 'none' : 'pan-y pan-x',
        }}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        onTouchCancel={onTouchEnd}
      >
        <style>{`
          .ip-slot{height:${SLOT_H}px; cursor:pointer; box-sizing:border-box; transition:background 0.1s ${EASE.smooth}}
          .ip-slot:active{background:${colors.red.subtle}!important}
          .ip-slot-hover{background:rgba(220,38,38,0.12)!important; border-top:2px solid ${colors.red.DEFAULT}!important; z-index:6; position:relative}
          .ip-hour{border-top:1px solid ${colors.gray.border}}
          .ip-half{border-top:1px dashed rgba(0,0,0,0.06)}
          .ip-5{border-top:1px solid transparent}
          .ip-rh{position:absolute; bottom:0; left:50%; transform:translateX(-50%); width:48px; height:18px; display:flex; align-items:flex-end; justify-content:center; padding-bottom:4px; cursor:ns-resize; z-index:20; touch-action:none}
          .ip-rh::after{content:''; width:28px; height:5px; background:rgba(255,255,255,0.60); border-radius:3px; transition:all 0.15s ${EASE.smooth}}
          .ip-rh:active::after{background:rgba(255,255,255,0.98); width:34px; height:6px}
          @keyframes ip-ring{from{outline-width:0px; outline-offset:0px; opacity:0} to{outline-width:3px; outline-offset:2px; opacity:1}}
          .ip-waiting{outline:3px solid ${colors.red.DEFAULT}; outline-offset:2px; border-radius:7px; animation:ip-ring ${LONG_PRESS_MS}ms ${EASE.smooth} forwards}
          @keyframes ip-pulse{0%{opacity:1} 50%{opacity:0.55} 100%{opacity:1}}
          .ip-waiting > div{animation:ip-pulse ${LONG_PRESS_MS}ms ${EASE.smooth} infinite}
        `}</style>

        <div
          ref={gridRef}
          style={{
            display:'grid',
            gridTemplateColumns: `${TIME_COL_W}px repeat(${professionals.length}, minmax(${MIN_COL_W}px, 1fr))`,
            minWidth: `${TIME_COL_W + professionals.length * MIN_COL_W}px`,
          }}
        >
          {/* Header canto */}
          <div style={{
            height: HEADER_H, position:'sticky', top:0, zIndex: Z.headerSticky,
            background:'rgba(255,255,255,0.95)', backdropFilter:'blur(20px)',
            borderBottom:`1px solid ${colors.gray.border}`,
            borderRight:`1px solid ${colors.gray.border}`,
          }} />

          {/* Header profissionais */}
          {professionals.map(p => (
            <div key={p.id} style={{
              height: HEADER_H, display:'flex', alignItems:'center', justifyContent:'center', gap:8,
              position:'sticky', top:0, zIndex: Z.headerSticky,
              background:'rgba(255,255,255,0.95)', backdropFilter:'blur(20px)',
              borderBottom:`1px solid ${colors.gray.border}`,
              borderLeft:`1px solid ${colors.gray.border}`,
              fontWeight:600, fontSize:13, color:colors.gray['900'],
            }}>
              <ProfAvatar name={p.name} avatarUrl={p.avatarUrl} size={30} />
              <span style={{ overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', maxWidth:120 }}>
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

            // FIX BUG #9: filtra preview corretamente
            // Se allItems existe (mesmo vazio), respeita o filtro por profId.
            // Senão (legacy single-item), usa preview.professionalId.
            const previewItems: PreviewItem[] = preview?.active && preview.date === dateStr
              ? (preview.allItems !== undefined
                ? preview.allItems.filter(it => it.profId === p.id)
                : preview.professionalId === p.id
                  ? [{
                      startTime: preview.time,
                      endTime:   addMin(preview.time, preview.duration),
                      duration:  preview.duration,
                      serviceName: preview.serviceName ?? '',
                      profId:    p.id,
                      clientName: preview.clientName,
                    }]
                  : [])
              : []

            return (
              <div key={p.id} style={{
                position:'relative',
                borderLeft:`1px solid ${colors.gray.border}`,
                zIndex: Z.gridBase, height: TOTAL_H,
              }}>
                {/* Slots */}
                {SLOTS.map((time, i) => {
                  const min = i * SLOT_STEP
                  const isHour = min % 60 === 0
                  const isHalf = min % 30 === 0 && !isHour
                  const isHover = isMove && hoverSlot === time
                  return (
                    <div
                      key={time}
                      className={`ip-slot${isHover ? ' ip-slot-hover' : ''} ${isHour ? 'ip-hour' : isHalf ? 'ip-half' : 'ip-5'}`}
                      onClick={e => {
                        if (drag || longPressId) return
                        setCtxMenu({ x: e.clientX, y: e.clientY, time, profId: p.id })
                      }}
                    />
                  )
                })}

                <OffHoursOverlay
                  preH={offHours.preH} postTop={offHours.postTop}
                  postH={offHours.postH} closed={offHours.closed} totalH={TOTAL_H}
                />

                {/* Bloqueios */}
                {profBlocks.map(bl => {
                  const sMin = toMinutes(bl.startTime)
                  const eMin = toMinutes(bl.endTime)
                  if (sMin < START_MIN || sMin >= END_HOUR * 60) return null
                  const top    = (sMin - START_MIN) * PX_PER_MIN
                  const height = Math.max((eMin - sMin) * PX_PER_MIN - 2, MIN_CARD_H_DESKTOP)
                  return (
                    <div key={bl.id} style={{
                      position:'absolute', top, left:3, right:3, height,
                      zIndex: Z.block, cursor:'pointer',
                    }}
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

                  const isThisMove   = drag?.type === 'move'   && drag.booking.id === b.id
                  const isThisResize = drag?.type === 'resize' && drag.booking.id === b.id
                  const isSaving     = savingId === b.id
                  const isWaiting    = longPressId === b.id
                  const height = isThisResize && drag.type === 'resize' ? drag.ghostHeight : baseH

                  return (
                    <div key={b.id} style={{
                      position:'absolute', top, left, width, height,
                      zIndex: isThisMove ? 0 : Z.booking,
                      opacity: isThisMove ? 0.2 : isSaving ? 0.55 : 1,
                      transition: isThisResize ? 'height 0s' : `opacity 0.2s ${EASE.smooth}`,
                      touchAction:'none',
                    }}
                      onTouchStart={e => onCardTouchStart(e, b, p.id, top, baseH)}
                      onTouchEnd={onCardTouchEnd}
                    >
                      {isThisMove ? (
                        <div style={{
                          width:'100%', height:'100%', borderRadius:7,
                          background:'rgba(220,38,38,0.10)',
                          border:`2px dashed ${colors.red.border}`,
                        }} />
                      ) : (
                        <div className={isWaiting ? 'ip-waiting' : ''} style={{ width:'100%', height:'100%' }}>
                          <BookingCard booking={b} totalHeight={height} />
                        </div>
                      )}

                      {!isThisMove && height > 18 && (
                        <div className="ip-rh" onTouchStart={e => onResizeTouchStart(e, b, baseH)} />
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

                {/* Preview ghost */}
                {previewItems.map((it, gi) => {
                  const sMin = toMinutes(it.startTime)
                  if (sMin < START_MIN || sMin >= END_HOUR * 60) return null
                  const top  = (sMin - START_MIN) * PX_PER_MIN
                  const h    = Math.max(it.duration * PX_PER_MIN - 2, MIN_CARD_H_DESKTOP)
                  return <PreviewGhost key={`pv-${gi}`} item={it} top={top} height={h} inset={3} radius={7} />
                })}

                <CurrentTimeLine y={currentY} />
              </div>
            )
          })}
        </div>
      </div>
    </>
  )
}

// ─── IpadGhostFloater ─────────────────────────────────────────────────────────
// Mesma estratégia do mobile: useLayoutEffect + DOM mutation direta.
// Atualiza top via scroll listener — sem ref-access em render.
function IpadGhostFloater({ drag, scrollRef }: {
  drag:      MoveDrag
  scrollRef: React.RefObject<HTMLDivElement | null>
}) {
  const elRef = useRef<HTMLDivElement>(null)

  useLayoutEffect(() => {
    const node = elRef.current
    const container = scrollRef.current
    if (!node || !container) return

    function syncTop() {
      if (!node || !container) return
      const rect = container.getBoundingClientRect()
      // top = topo do scroll + headerH (sticky) + ghostTop (em coordenadas de grade) - scrollTop
      node.style.top = `${rect.top + HEADER_H + drag.ghostTop - container.scrollTop}px`
    }

    syncTop()
    container.addEventListener('scroll', syncTop, { passive: true })
    window.addEventListener('resize', syncTop)
    return () => {
      container.removeEventListener('scroll', syncTop)
      window.removeEventListener('resize', syncTop)
    }
  }, [drag.ghostTop, scrollRef])

  return (
    <div
      ref={elRef}
      style={{
        position:'fixed',
        left: drag.colLeft,
        top:  0,  // sobrescrito pelo useLayoutEffect
        width:  drag.colWidth,
        height: drag.ghostHeight,
        zIndex: Z.ghostTouch,
        pointerEvents:'none',
        filter:'drop-shadow(0 14px 36px rgba(0,0,0,0.32))',
        willChange:'transform',
        transform:'translate3d(0,0,0) scale(1.03)',
        transition:'top 0.06s ease, left 0.06s ease, width 0.06s ease',
        opacity:0.92,
      }}
    >
      <BookingCard booking={drag.booking} totalHeight={drag.ghostHeight} />
      <div style={{
        position:'absolute', bottom:-26, left:'50%',
        transform:'translateX(-50%)',
        background:'rgba(220,38,38,0.94)', color:'#fff',
        fontSize:12, fontWeight:800, fontVariantNumeric:'tabular-nums',
        padding:'4px 12px', borderRadius:8, whiteSpace:'nowrap',
        boxShadow:'0 4px 12px rgba(220,38,38,0.42)',
      }}>
        {drag.currentTime}
      </div>
    </div>
  )
}
