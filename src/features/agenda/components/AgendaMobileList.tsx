'use client'
// src/features/agenda/components/AgendaMobileList.tsx
// Lista mobile — 1 profissional por vez (via tabs) + touch nativo.

import { useState, useRef, useEffect, useLayoutEffect, useMemo, useCallback } from 'react'
import { createPortal } from 'react-dom'
import dayjs from 'dayjs'

import MobileBookingCard from './shared/MobileBookingCard'
import BlockCard         from './BlockCard'
import BlockEditModal    from './BlockEditModal'
import SlotContextMenu   from './SlotContextMenu'
import ConfirmModal      from './shared/ConfirmModal'
import OffHoursOverlay   from './shared/OffHoursOverlay'
import CurrentTimeLine   from './shared/CurrentTimeLine'
import PreviewGhost, { PreviewItem } from './shared/PreviewGhost'

import { AgendaProfessional, AgendaBooking, AgendaBlock } from '../types'
import { colors, typography, radius, transitions } from '@/shared/theme'
import { useAgendaStore }    from '../hooks/useAgendaStore'
import { useAuth }            from '@/hooks/useAuth'
import { useCurrentTimeY }   from '../hooks/useCurrentTimeY'
import { useBookingActions } from '../hooks/useBookingActions'
import { toMinutes, minutesToTime, snapToSlot, addMin, buildHalfSlots, computeGridRange } from '../utils/time'
import { computeOverlapLayout, computeOffHoursOverlay, uniqueBookings } from '../utils/layout'
import {
  SLOT_STEP, MIN_CARD_H_MOBILE, MIN_DUR,
  TOUCH_CANCEL_PX, LONG_PRESS_MS, VIBRATE_DRAG_MS, VIBRATE_RESIZE_MS,
  MOBILE_ROW_H, MOBILE_PX_PER_MIN,
  DEFAULT_START_HOUR_MOBILE, DEFAULT_END_HOUR_MOBILE,
  EASE, Z,
} from '../constants'
import { WorkingHours } from './AgendaBoard'

// ─── Constantes locais ────────────────────────────────────────────────────────
const TIME_COL_W = 48
const ROW_H      = MOBILE_ROW_H
const PX_PER_MIN = MOBILE_PX_PER_MIN

// ─── Tabs de profissionais ────────────────────────────────────────────────────
function ProfTabs({ professionals, selected, bookings, onChange }: {
  professionals: AgendaProfessional[]
  selected:      string
  bookings:      AgendaBooking[]
  onChange:      (id: string) => void
}) {
  const ref = useRef<HTMLDivElement>(null)
  const userInteractedRef = useRef(false)

  useEffect(() => {
    if (!userInteractedRef.current) return
    const el = ref.current?.querySelector('.ptab-active') as HTMLElement | null
    el?.scrollIntoView({ inline:'center', behavior:'smooth', block:'nearest' })
  }, [selected])

  if (professionals.length <= 1) return null

  function Avatar({ p, isActive }: { p: AgendaProfessional; isActive: boolean }) {
    const isColor  = p.avatarUrl?.startsWith('color:')
    const colorBg  = isColor ? p.avatarUrl!.replace('color:','') : null
    const isPhoto  = p.avatarUrl != null && !isColor
    const initials = p.name.split(' ').slice(0,2).map(w=>w[0]).join('').toUpperCase()
    return (
      <div style={{
        width:22, height:22, borderRadius:radius.full,
        background: colorBg ?? (isPhoto ? 'transparent' : isActive ? 'rgba(255,255,255,0.25)' : colors.red.subtle),
        display:'flex', alignItems:'center', justifyContent:'center',
        fontSize:9, fontWeight:700,
        color: isActive ? '#fff' : colors.red.DEFAULT,
        flexShrink:0, overflow:'hidden',
      }}>
        {isPhoto ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={p.avatarUrl} alt={p.name} style={{ width:'100%', height:'100%', objectFit:'cover' }} />
        ) : initials}
      </div>
    )
  }

  return (
    <div ref={ref} style={{
      display:'flex', gap:6, padding:'8px 14px', overflowX:'auto', scrollbarWidth:'none',
      borderBottom:`1px solid ${colors.gray.border}`,
      background:'rgba(245,245,247,0.98)', backdropFilter:'blur(12px)', flexShrink:0,
    }}>
      {professionals.map(p => {
        const isActive = p.id === selected
        const count    = bookings.filter(b => b.professionalId === p.id).length
        return (
          <button
            key={p.id}
            className={isActive ? 'ptab-active' : ''}
            onClick={() => { userInteractedRef.current = true; onChange(p.id) }}
            style={{
              display:'flex', alignItems:'center', gap:7,
              padding:'7px 13px', borderRadius:radius.full,
              border: `1px solid ${isActive ? 'transparent' : colors.gray.borderMd}`,
              background: isActive ? colors.red.gradient : colors.background.surface,
              cursor:'pointer', flexShrink:0, whiteSpace:'nowrap',
              boxShadow: isActive ? `0 3px 10px ${colors.red.glow}` : 'none',
              transition: `all ${transitions.spring}`,
              WebkitTapHighlightColor: 'transparent',
            }}
          >
            <Avatar p={p} isActive={isActive} />
            <span style={{ fontSize:12, fontWeight:600, color: isActive ? '#fff' : colors.gray[700] }}>
              {p.name.split(' ')[0]}
            </span>
            {count > 0 && (
              <span style={{
                fontSize:10, fontWeight:700, padding:'1px 6px', borderRadius:radius.full,
                background: isActive ? 'rgba(255,255,255,0.25)' : colors.red.subtle,
                color: isActive ? '#fff' : colors.red.DEFAULT,
              }}>{count}</span>
            )}
          </button>
        )
      })}
    </div>
  )
}

// ─── Tipos de drag ────────────────────────────────────────────────────────────
interface MoveDrag {
  type:        'move'
  booking:     AgendaBooking
  profId:      string
  ghostTop:    number   // top em px na grade (snapped)
  ghostTime:   string
  cardLeft:    number   // medido no touchStart
  cardWidth:   number   // medido no touchStart
  cardHeight:  number   // medido no touchStart
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
  onDeleteBlock:    (id: string) => void
  onUpdateBlock:    (block: AgendaBlock) => void
  onOpenBlockModal?:(time?: string, profId?: string) => void
  focusedProfId?:   string | null
  onFocusProf?:     (id: string | null) => void
}

// ─── Componente principal ─────────────────────────────────────────────────────
export default function AgendaMobileList({
  professionals, bookings, blocks, workingHours,
  onDeleteBlock, onUpdateBlock, onOpenBlockModal, focusedProfId,
}: Props) {
  const openCreate    = useAgendaStore(s => s.openCreate)
  const openView      = useAgendaStore(s => s.openView)
  const selectedDate  = useAgendaStore(s => s.selectedDate)
  const preview       = useAgendaStore(s => s.preview)

  const { savingId, pendingAction, setPendingAction, doReschedule, doResize } = useBookingActions(selectedDate)

  // ─── Range ─────────────────────────────────────────────────────────────────
  // Minutos (start/end) de bookings + ghost — esticam a janela pra fora do
  // expediente quando há agendamento manual fora de hora (senão o card some).
  const extraMinutes = useMemo(() => {
    const arr: number[] = []
    for (const b of bookings) arr.push(toMinutes(b.start), toMinutes(b.end))
    const ds = dayjs(selectedDate).format('YYYY-MM-DD')
    if (preview?.active && preview.date === ds) {
      if (preview.allItems?.length) {
        for (const it of preview.allItems) arr.push(toMinutes(it.startTime), toMinutes(it.endTime))
      } else {
        arr.push(toMinutes(preview.time), toMinutes(preview.time) + preview.duration)
      }
    }
    return arr
  }, [bookings, preview, selectedDate])

  const { startHour: START_HOUR, endHour: END_HOUR, startMin: START_MIN } = useMemo(
    () => computeGridRange(workingHours, { startHour: DEFAULT_START_HOUR_MOBILE, endHour: DEFAULT_END_HOUR_MOBILE }, extraMinutes),
    [workingHours, extraMinutes],
  )
  const HALF_SLOTS = useMemo(() => buildHalfSlots(START_HOUR, END_HOUR), [START_HOUR, END_HOUR])
  const TOTAL_H    = HALF_SLOTS.length * ROW_H
  const currentY   = useCurrentTimeY(START_MIN, PX_PER_MIN, END_HOUR)

  const unique = useMemo(() => uniqueBookings(bookings), [bookings])

  // ─── Refs DOM + estado de drag ─────────────────────────────────────────────
  const vScrollRef    = useRef<HTMLDivElement>(null)
  const gridColRef    = useRef<HTMLDivElement>(null)
  const dragRef       = useRef<ActiveDrag | null>(null)
  const longPressRef  = useRef<ReturnType<typeof setTimeout> | null>(null)
  const touchStartRef = useRef<{ y: number; x: number; time: number } | null>(null)
  const tapBookingRef = useRef<AgendaBooking | null>(null)

  const [drag,          setDragState]   = useState<ActiveDrag | null>(null)
  const [hoverSlot,     setHoverSlot]   = useState<string | null>(null)
  const [editBlock,     setEditBlock]   = useState<AgendaBlock | null>(null)
  const [ctxMenu,       setCtxMenu]     = useState<{ x: number; y: number; time: string; profId: string } | null>(null)
  const [longPressId,   setLongPressId] = useState<string | null>(null)
  // Estado interno: prof selecionado pelo usuário (pode ser '' se ainda não escolheu)
  const [userPickedProfId, setUserPickedProfId] = useState<string>('')

  // activeProfId derivado — usa pick do usuário se válido, senão primeiro disponível.
  // Evita useEffect com setState (regra react-hooks/set-state-in-effect).
  const activeProfId = useMemo(() => {
    if (userPickedProfId && professionals.find(p => p.id === userPickedProfId)) return userPickedProfId
    return professionals[0]?.id ?? ''
  }, [userPickedProfId, professionals])

  const setActiveProfId = setUserPickedProfId

  function setDrag(next: ActiveDrag | null) {
    dragRef.current = next
    setDragState(next)
  }

  // ─── Dados do prof ativo ───────────────────────────────────────────────────
  const profBookings = useMemo(() => unique.filter(b => b.professionalId === activeProfId), [unique, activeProfId])
  const profBlocks   = useMemo(() => blocks.filter(bl => bl.professionalId === activeProfId), [blocks, activeProfId])
  const layout       = useMemo(() => computeOverlapLayout(profBookings), [profBookings])
  const offHours     = useMemo(() => computeOffHoursOverlay({
    workingHours, startMin: START_MIN, endHour: END_HOUR, totalH: TOTAL_H, pxPerMin: PX_PER_MIN,
  }), [workingHours, START_MIN, END_HOUR, TOTAL_H])

  const dateStr = dayjs(selectedDate).format('YYYY-MM-DD')

  const previewItems: PreviewItem[] = useMemo(() => {
    if (!preview?.active || preview.date !== dateStr) return []
    if (preview.allItems?.length) return preview.allItems.filter(it => it.profId === activeProfId)
    if (preview.professionalId === activeProfId) {
      return [{
        startTime: preview.time, endTime: addMin(preview.time, preview.duration),
        duration: preview.duration, serviceName: preview.serviceName ?? '',
        profId: activeProfId, clientName: preview.clientName,
      }]
    }
    return []
  }, [preview, dateStr, activeProfId])

  // ─── Scroll inicial + scroll para preview ──────────────────────────────────
  const didInitialScroll = useRef(false)
  useEffect(() => {
    if (didInitialScroll.current) return
    if (!vScrollRef.current) return
    if (currentY < 0 && !workingHours) return
    didInitialScroll.current = true

    const target = currentY > 0
      ? Math.max(0, currentY - 60 * PX_PER_MIN)
      : workingHours?.open
        ? Math.max(0, (toMinutes(workingHours.startTime) - START_MIN - 60) * PX_PER_MIN)
        : 0
    vScrollRef.current.scrollTop = target
  }, [currentY, workingHours, START_MIN])

  useEffect(() => {
    if (!preview?.active || !vScrollRef.current) return
    const targetY = Math.max(0, (toMinutes(preview.time) - START_MIN - 60) * PX_PER_MIN)
    vScrollRef.current.scrollTo({ top: targetY, behavior: 'smooth' })
  }, [preview?.time, preview?.active, START_MIN])

  // Reposiciona scroll ao trocar prof (sem setTimeout quirks)
  const prevProfRef = useRef(activeProfId)
  useEffect(() => {
    if (prevProfRef.current === activeProfId) return
    prevProfRef.current = activeProfId
    if (!vScrollRef.current) return
    const target = currentY > 0 ? Math.max(0, currentY - 120) : 0
    requestAnimationFrame(() => {
      if (vScrollRef.current) vScrollRef.current.scrollTop = target
    })
  }, [activeProfId, currentY])

  // ─── Helpers ───────────────────────────────────────────────────────────────
  const snapFromClientY = useCallback((clientY: number): number => {
    if (!vScrollRef.current) return START_MIN
    const rect = vScrollRef.current.getBoundingClientRect()
    const relY = clientY - rect.top + vScrollRef.current.scrollTop
    const absMin = START_MIN + relY / PX_PER_MIN
    return Math.max(START_MIN, Math.min(snapToSlot(absMin), END_HOUR * 60 - SLOT_STEP))
  }, [START_MIN, END_HOUR])

  // ─── Touch handlers (long press → move) ────────────────────────────────────
  const onCardTouchStart = useCallback((
    e: React.TouchEvent, booking: AgendaBooking, _cardTop: number, cardHeight: number,
  ) => {
    const touch = e.touches[0]
    touchStartRef.current = { y: touch.clientY, x: touch.clientX, time: Date.now() }
    tapBookingRef.current = booking
    setLongPressId(booking.id)

    // Mede coluna principal UMA VEZ — evita race em hidratação
    const colRect    = gridColRef.current?.getBoundingClientRect()
    const cardLeft   = colRect?.left  ?? 0
    const cardWidth  = colRect?.width ?? 300

    longPressRef.current = setTimeout(() => {
      if (navigator.vibrate) navigator.vibrate(VIBRATE_DRAG_MS)
      setLongPressId(null)
      tapBookingRef.current = null

      const snapMin = snapFromClientY(touch.clientY)
      setDrag({
        type:'move', booking, profId: activeProfId,
        ghostTop: (snapMin - START_MIN) * PX_PER_MIN,
        ghostTime: minutesToTime(snapMin),
        cardLeft, cardWidth, cardHeight,
      })
    }, LONG_PRESS_MS)
  }, [activeProfId, START_MIN, snapFromClientY])

  const onCardTouchEnd = useCallback(() => {
    if (longPressRef.current) {
      clearTimeout(longPressRef.current)
      longPressRef.current = null
    }
    setLongPressId(null)
    // Tap rápido (sem drag e sem cancelamento por movimento) → abre painel
    if (!dragRef.current && tapBookingRef.current) {
      openView(tapBookingRef.current)
    }
    tapBookingRef.current = null
  }, [openView])

  // ─── Resize ────────────────────────────────────────────────────────────────
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
      type:'resize', booking, profId: activeProfId,
      ghostHeight: cardHeight, currentEnd: booking.end,
    })
  }, [activeProfId])

  // ─── Touch move global ─────────────────────────────────────────────────────
  const onTouchMove = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0]

    // Cancela long-press + tap se moveu (provavelmente é scroll)
    if (longPressRef.current && touchStartRef.current) {
      const dx = Math.abs(touch.clientX - touchStartRef.current.x)
      const dy = Math.abs(touch.clientY - touchStartRef.current.y)
      if (dx > TOUCH_CANCEL_PX || dy > TOUCH_CANCEL_PX) {
        clearTimeout(longPressRef.current)
        longPressRef.current = null
        setLongPressId(null)
        // FIX BUG #7: se mexeu sem ativar drag, NÃO abre painel no touchEnd
        tapBookingRef.current = null
      }
    }

    const d = dragRef.current
    if (!d) return
    e.preventDefault()

    if (d.type === 'move') {
      const snapMin  = snapFromClientY(touch.clientY)
      const ghostTop = (snapMin - START_MIN) * PX_PER_MIN
      const hSlot    = minutesToTime(snapMin)
      setDrag({ ...d, ghostTop, ghostTime: hSlot })
      setHoverSlot(hSlot)
      return
    }

    if (d.type === 'resize') {
      if (!vScrollRef.current) return
      const rect    = vScrollRef.current.getBoundingClientRect()
      const scrollT = vScrollRef.current.scrollTop
      const relY    = touch.clientY - rect.top + scrollT
      const endMin  = Math.max(
        toMinutes(d.booking.start) + MIN_DUR,
        Math.min(snapToSlot(START_MIN + relY / PX_PER_MIN), END_HOUR * 60),
      )
      const h = Math.max((endMin - toMinutes(d.booking.start)) * PX_PER_MIN - 2, MIN_CARD_H_MOBILE)
      setDrag({ ...d, ghostHeight: h, currentEnd: minutesToTime(endMin) })
    }
  }, [START_MIN, END_HOUR, snapFromClientY])

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

    if (d.type === 'move' && d.ghostTime !== d.booking.start) {
      setPendingAction({
        type:'move',
        title: `Confirmar alteração de\n${d.booking.start} para ${d.ghostTime}?`,
        confirmLabel: 'Salvar alteração',
        onConfirm: () => {
          setPendingAction(null)
          doReschedule(d.booking.id, d.ghostTime, d.profId, false)
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

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <div style={{
      height:'100%', display:'flex', flexDirection:'column',
      background: colors.background.page, fontFamily: typography.fontFamily,
      overflow:'hidden',
    }}>
      <style>{`
        .m-vscroll::-webkit-scrollbar{display:none}
        .m-grid-wrap{
          -webkit-user-select:none; user-select:none;
          -webkit-touch-callout:none;
        }
        .m-slot{cursor:pointer; transition:background 0.1s ${EASE.smooth}}
        .m-slot:active{background:rgba(220,38,38,0.06)!important}
        .m-slot-hover{background:rgba(220,38,38,0.10)!important; border-top:2px solid ${colors.red.DEFAULT}!important}
        .m-rh{
          position:absolute; bottom:0; left:0; right:0; height:20px;
          display:flex; align-items:flex-end; justify-content:center;
          padding-bottom:4px;
          z-index:25; touch-action:none;
          border-radius:0 0 10px 10px;
        }
        .m-rh::after{
          content:''; width:28px; height:5px;
          background:rgba(255,255,255,0.60);
          border-radius:3px; transition:all 0.15s ${EASE.smooth};
        }
        .m-rh:active::after{background:rgba(255,255,255,0.98); width:32px; height:6px}
        @keyframes lp-ring{from{outline-width:0px; outline-offset:0px; opacity:0} to{outline-width:3px; outline-offset:2px; opacity:1}}
        .lp-waiting{
          outline:3px solid ${colors.red.DEFAULT};
          outline-offset:2px;
          border-radius:10px;
          animation:lp-ring ${LONG_PRESS_MS}ms ${EASE.smooth} forwards;
        }
        @keyframes lp-pulse{0%{opacity:1} 50%{opacity:0.6} 100%{opacity:1}}
        .lp-waiting > div{animation:lp-pulse ${LONG_PRESS_MS}ms ${EASE.smooth} infinite}
      `}</style>

      {pendingAction && (
        <ConfirmModal
          variant="sheet"
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
          onNewBooking={(t, p) => { openCreate(t, p); setCtxMenu(null) }}
          onNewBlock={(t, p) => { onOpenBlockModal?.(t, p); setCtxMenu(null) }}
        />
      )}

      {editBlock && (
        <BlockEditModal
          block={editBlock} professionals={professionals}
          onClose={() => setEditBlock(null)}
          onDeleted={id => { onDeleteBlock(id); setEditBlock(null) }}
          onUpdated={u  => { onUpdateBlock(u);  setEditBlock(null) }}
        />
      )}

      {/* GHOST flutuante durante move */}
      {isMove && drag.type === 'move' && createPortal(
        <GhostFloater drag={drag} scrollRef={vScrollRef} />,
        document.body,
      )}

      <ProfTabs
        professionals={professionals} selected={activeProfId}
        bookings={unique} onChange={setActiveProfId}
      />

      {/* Resumo */}
      {profBookings.length > 0 && (
        <div style={{
          display:'flex', alignItems:'center', gap:10,
          padding:'7px 14px', flexShrink:0,
          background:'rgba(245,245,247,0.6)',
          borderBottom:`1px solid ${colors.gray.border}`,
        }}>
          <div style={{ display:'flex', alignItems:'center', gap:5, flexShrink:0 }}>
            <div style={{
              width:6, height:6, borderRadius:'50%',
              background: colors.red.DEFAULT,
              boxShadow: `0 0 5px ${colors.red.glow}`,
            }} />
            <span style={{ fontSize:12, fontWeight:600, color: colors.gray[700] }}>
              {profBookings.length} agend.
            </span>
          </div>
          <div style={{ display:'flex', gap:4, overflowX:'auto', scrollbarWidth:'none', flex:1 }}>
            {profBookings.slice(0, 5).map(b => (
              <span key={b.id} style={{
                padding:'2px 8px', borderRadius:radius.full,
                background: colors.red.subtle, border:`1px solid ${colors.red.border}`,
                fontSize:11, fontWeight:600, color: colors.red.dark,
                whiteSpace:'nowrap', flexShrink:0,
              }}>{b.start}</span>
            ))}
            {profBookings.length > 5 && (
              <span style={{
                padding:'2px 8px', borderRadius:radius.full,
                background:'rgba(0,0,0,0.05)', fontSize:11,
                color: colors.gray.dimText, flexShrink:0,
              }}>+{profBookings.length - 5}</span>
            )}
          </div>
        </div>
      )}

      {/* Grade */}
      <div
        ref={vScrollRef}
        className="m-vscroll m-grid-wrap"
        style={{
          flex:1, overflowY:'auto', overflowX:'hidden',
          WebkitOverflowScrolling:'touch',
          position:'relative',
          touchAction: drag ? 'none' : 'pan-y',
          paddingBottom: 'calc(var(--bottom-nav-h, 64px) + env(safe-area-inset-bottom, 0px))',
        }}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        onTouchCancel={onTouchEnd}
      >
        <div style={{ display:'flex', minHeight: TOTAL_H }}>

          {/* Coluna de horários */}
          <div style={{
            width: TIME_COL_W, flexShrink:0,
            position:'sticky', left:0, zIndex:12,
            background:'rgba(245,245,247,0.98)', backdropFilter:'blur(8px)',
            borderRight:`1px solid ${colors.gray.border}`,
          }}>
            {HALF_SLOTS.map((time, i) => {
              const isHour = i % 2 === 0
              return (
                <div key={time} style={{
                  height: ROW_H, display:'flex', alignItems:'flex-start', justifyContent:'flex-end',
                  paddingRight:8, paddingTop:4, boxSizing:'border-box',
                  borderTop: isHour ? `1px solid ${colors.gray.border}` : '1px dashed rgba(0,0,0,0.06)',
                }}>
                  <span style={{
                    fontSize: isHour ? 11 : 10,
                    fontWeight: isHour ? 600 : 400,
                    color: isHour ? colors.gray.dimText : colors.gray.dimTextLight,
                    fontVariantNumeric:'tabular-nums', lineHeight:1,
                  }}>
                    {time}
                  </span>
                </div>
              )
            })}
          </div>

          {/* Coluna principal */}
          <div ref={gridColRef} style={{ flex:1, position:'relative' }}>

            {/* Slots */}
            {HALF_SLOTS.map((time, i) => (
              <div
                key={time}
                className={`m-slot${isMove && hoverSlot === time ? ' m-slot-hover' : ''}`}
                style={{
                  position:'absolute', top: i * ROW_H, left:0, right:0,
                  height: ROW_H,
                  borderTop: i % 2 === 0 ? `1px solid ${colors.gray.border}` : '1px dashed rgba(0,0,0,0.05)',
                }}
                onClick={e => {
                  if (drag || longPressId) return
                  setCtxMenu({ x: e.clientX, y: e.clientY, time, profId: activeProfId })
                }}
              />
            ))}

            <OffHoursOverlay
              preH={offHours.preH} postTop={offHours.postTop}
              postH={offHours.postH} closed={offHours.closed} totalH={TOTAL_H}
            />

            {/* Preview ghost */}
            {previewItems.map((it, gi) => {
              const sMin = toMinutes(it.startTime)
              if (sMin < START_MIN || sMin >= END_HOUR * 60) return null
              const top = (sMin - START_MIN) * PX_PER_MIN
              const h   = Math.max(it.duration * PX_PER_MIN - 2, MIN_CARD_H_MOBILE)
              return <PreviewGhost key={`pv-${gi}`} item={it} top={top} height={h} inset={4} radius={10} />
            })}

            <CurrentTimeLine y={currentY} />

            {/* Bloqueios */}
            {profBlocks.map(bl => {
              const sMin = toMinutes(bl.startTime)
              const eMin = toMinutes(bl.endTime)
              if (sMin < START_MIN || sMin >= END_HOUR * 60) return null
              const top    = (sMin - START_MIN) * PX_PER_MIN
              const height = Math.max((eMin - sMin) * PX_PER_MIN - 2, MIN_CARD_H_MOBILE)
              return (
                <div key={bl.id} style={{
                  position:'absolute', top, left:4, right:4, height,
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
              const baseH = Math.max(dur * PX_PER_MIN - 2, MIN_CARD_H_MOBILE)
              const { col, totalCols } = layout.get(b.id) ?? { col: 0, totalCols: 1 }
              const frac      = 1 / totalCols
              const leftStr   = `calc(${col * frac * 100}% + 4px)`
              const widthStr  = `calc(${frac * 100}% - ${col === totalCols - 1 ? 8 : 4}px)`

              const isThisMove   = drag?.type === 'move'   && drag.booking.id === b.id
              const isThisResize = drag?.type === 'resize' && drag.booking.id === b.id
              const isSaving     = savingId === b.id
              const isWaiting    = longPressId === b.id
              const height = isThisResize && drag.type === 'resize' ? drag.ghostHeight : baseH

              return (
                <div key={b.id} style={{
                  position:'absolute',
                  top: isThisMove && drag.type === 'move' ? drag.ghostTop : top,
                  left: leftStr, width: widthStr, height,
                  zIndex: isThisMove ? 2 : Z.booking,
                  opacity: isThisMove ? 0.22 : isSaving ? 0.55 : 1,
                  transition: isThisResize ? 'height 0s' : isThisMove ? 'none' : `opacity 0.2s ${EASE.smooth}`,
                  touchAction:'none',
                }}
                  onTouchStart={e => onCardTouchStart(e, b, top, baseH)}
                  onTouchEnd={onCardTouchEnd}
                >
                  {isThisMove ? (
                    <div style={{
                      width:'100%', height:'100%', borderRadius:10,
                      background:'rgba(220,38,38,0.10)',
                      border:`2px dashed ${colors.red.border}`,
                    }} />
                  ) : (
                    <div className={isWaiting ? 'lp-waiting' : ''} style={{ width:'100%', height:'100%' }}>
                      <MobileBookingCard booking={b} height={height} />
                    </div>
                  )}

                  {!isThisMove && height > 24 && (
                    <div className="m-rh" onTouchStart={e => onResizeTouchStart(e, b, baseH)} />
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

            {/* Label de horário in-place durante move */}
            {isMove && drag.type === 'move' && (
              <div style={{
                position:'absolute', top: drag.ghostTop - 22, left:0, right:0,
                textAlign:'center', pointerEvents:'none', zIndex:41,
              }}>
                <span style={{
                  fontSize:11, fontWeight:700, color: colors.red.DEFAULT,
                  fontVariantNumeric:'tabular-nums',
                  textShadow:'0 1px 4px rgba(255,255,255,0.95)',
                  background:'rgba(255,255,255,0.92)',
                  borderRadius:6, padding:'2px 8px',
                  boxShadow:'0 2px 8px rgba(0,0,0,0.08)',
                }}>
                  {drag.ghostTime}
                </span>
              </div>
            )}

            {/* Estado vazio */}
            {profBookings.length === 0 && profBlocks.length === 0 && (
              <div style={{
                position:'absolute', top:'28%', left:0, right:0,
                display:'flex', flexDirection:'column', alignItems:'center', gap:10,
                pointerEvents:'none',
              }}>
                <div style={{ fontSize:44, opacity:0.2 }}>📅</div>
                <span style={{ fontSize:14, color: colors.gray.dimText, fontWeight:500, opacity:0.5 }}>
                  Sem agendamentos hoje
                </span>
                <span style={{ fontSize:12, color: colors.gray.dimText, opacity:0.4 }}>
                  Toque em qualquer horário para agendar
                </span>
              </div>
            )}

            <div style={{ height: TOTAL_H }} />
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── GhostFloater ─────────────────────────────────────────────────────────────
// Card-fantasma flutuante.
// Estratégia: `useLayoutEffect` (permitido ler refs lá dentro) registra um
// listener de scroll no container e atualiza o `top` do ghost via DOM mutation
// direta (sem setState e sem ref-access no render).
function GhostFloater({ drag, scrollRef }: {
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
      node.style.top = `${rect.top + drag.ghostTop - container.scrollTop}px`
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
        left: drag.cardLeft,
        top:  0,  // será sobrescrito pelo useLayoutEffect
        width:  drag.cardWidth,
        height: drag.cardHeight,
        zIndex: Z.ghostTouch,
        pointerEvents:'none',
        filter:'drop-shadow(0 14px 36px rgba(0,0,0,0.38))',
        willChange:'transform',
        transform:'translate3d(0,0,0) scale(1.04)',
        transition:'top 0.06s ease',
      }}
    >
      <MobileBookingCard booking={drag.booking} height={drag.cardHeight} isDragging />
      <div style={{
        position:'absolute', bottom:-26, left:'50%',
        transform:'translateX(-50%)',
        background:'rgba(220,38,38,0.94)', color:'#fff',
        fontSize:12, fontWeight:800, fontVariantNumeric:'tabular-nums',
        padding:'4px 12px', borderRadius:8, whiteSpace:'nowrap',
        boxShadow:'0 4px 12px rgba(220,38,38,0.42)',
      }}>
        {drag.ghostTime}
      </div>
    </div>
  )
}
