'use client'
// src/features/agenda/components/AgendaBoard.tsx
// Coordenador da agenda: detecta dispositivo, busca dados, gerencia painéis.

import { useEffect, useState, useCallback, useRef, useMemo } from 'react'
import dayjs from 'dayjs'

import AgendaToolbar     from './AgendaToolbar'
import AgendaGrid        from './AgendaGrid'
import AgendaIPadList    from './AgendaIPadList'
import AgendaMobileList  from './AgendaMobileList'
import SideCheckoutPanel from '@/features/booking/components/SideCheckoutPanel'
import BookingViewPanel  from '@/features/booking/components/BookingViewPanel'
import BlockModal        from './BlockModal'

import { useAgendaStore }  from '../hooks/useAgendaStore'
import { useAgendaSocket } from '../hooks/useAgendaSocket'
import { useDeviceMode }   from '../hooks/useDeviceMode'
import { AgendaProfessional, AgendaBlock } from '../types'
import { colors } from '@/shared/theme'
import api from '@/shared/lib/apiClient'
import { AGENDA_PXMIN_LEVELS, AGENDA_PXMIN_DEFAULT_INDEX } from '../constants'

export interface WorkingHours {
  open:      boolean
  startTime: string
  endTime:   string
}

interface HourSlot {
  weekday:   number
  open:      boolean
  startTime: string
  endTime:   string
}

interface Props {
  professionals: AgendaProfessional[]
  businessId:    string
  externalDate?: Date
  onDateChange?: (date: Date) => void
  onRefreshBookings?: () => void
}

export default function AgendaBoard({ professionals, businessId, externalDate, onDateChange, onRefreshBookings }: Props) {
  const selectedDate       = useAgendaStore(s => s.selectedDate)
  const setSelectedDate    = useAgendaStore(s => s.setSelectedDate)
  const getBookingsForDate = useAgendaStore(s => s.getBookingsForDate)
  const addBooking         = useAgendaStore(s => s.addBooking)
  const removeBooking      = useAgendaStore(s => s.removeBooking)
  const getBlocksForDate   = useAgendaStore(s => s.getBlocksForDate)
  const setBlocksForDate   = useAgendaStore(s => s.setBlocksForDate)
  const addBlock           = useAgendaStore(s => s.addBlock)
  const removeBlock        = useAgendaStore(s => s.removeBlock)
  const checkout           = useAgendaStore(s => s.checkout)
  const closeCheckout      = useAgendaStore(s => s.closeCheckout)

  const mode = useDeviceMode()

  // ── Zoom da grade (densidade desktop/iPad), persistido em localStorage ──
  const [zoomIndex, setZoomIndex] = useState(AGENDA_PXMIN_DEFAULT_INDEX)
  const zoomHydrated = useRef(false)
  // Hidrata do localStorage após o mount (setTimeout evita setState síncrono no effect)
  useEffect(() => {
    const id = setTimeout(() => {
      try {
        const raw = localStorage.getItem('eligi-agenda-zoom')
        const n = raw == null ? NaN : parseInt(raw, 10)
        if (Number.isFinite(n)) {
          const clamped = Math.max(0, Math.min(AGENDA_PXMIN_LEVELS.length - 1, n))
          setZoomIndex(prev => (prev === clamped ? prev : clamped))
        }
      } catch { /* noop */ }
      zoomHydrated.current = true
    }, 0)
    return () => clearTimeout(id)
  }, [])
  useEffect(() => {
    // Só persiste após hidratar — senão o valor inicial sobrescreve o salvo no reload.
    if (!zoomHydrated.current) return
    try { localStorage.setItem('eligi-agenda-zoom', String(zoomIndex)) } catch { /* noop */ }
  }, [zoomIndex])
  const pxPerMin   = AGENDA_PXMIN_LEVELS[zoomIndex]
  const canZoomIn  = zoomIndex < AGENDA_PXMIN_LEVELS.length - 1
  const canZoomOut = zoomIndex > 0
  const zoomIn     = useCallback(() => setZoomIndex(i => Math.min(AGENDA_PXMIN_LEVELS.length - 1, i + 1)), [])
  const zoomOut    = useCallback(() => setZoomIndex(i => Math.max(0, i - 1)), [])

  // ── Colunas recolhidas (decisão C), persistido em localStorage ──
  const [collapsed, setCollapsed] = useState<string[]>([])
  const collapsedHydrated = useRef(false)
  useEffect(() => {
    const id = setTimeout(() => {
      try {
        const raw = localStorage.getItem('eligi-agenda-collapsed')
        const arr = raw ? JSON.parse(raw) : null
        if (Array.isArray(arr)) setCollapsed(arr.filter((x): x is string => typeof x === 'string'))
      } catch { /* noop */ }
      collapsedHydrated.current = true
    }, 0)
    return () => clearTimeout(id)
  }, [])
  useEffect(() => {
    // Só persiste após hidratar — senão o [] inicial sobrescreve o salvo no reload.
    if (!collapsedHydrated.current) return
    try { localStorage.setItem('eligi-agenda-collapsed', JSON.stringify(collapsed)) } catch { /* noop */ }
  }, [collapsed])
  const toggleCollapse = useCallback((id: string) => {
    setCollapsed(prev => (prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]))
  }, [])

  // ── Ordem das colunas (reorder), persistida em localStorage ──
  const [colOrder, setColOrder] = useState<string[]>([])
  useEffect(() => {
    const id = setTimeout(() => {
      try {
        const raw = localStorage.getItem('eligi-agenda-col-order')
        const arr = raw ? JSON.parse(raw) : null
        if (Array.isArray(arr)) setColOrder(arr.filter((x): x is string => typeof x === 'string'))
      } catch { /* noop */ }
    }, 0)
    return () => clearTimeout(id)
  }, [])
  const reorderColumns = useCallback((ids: string[]) => {
    setColOrder(ids)
    try { localStorage.setItem('eligi-agenda-col-order', JSON.stringify(ids)) } catch { /* noop */ }
  }, [])
  const orderedProfs = useMemo(() => {
    if (colOrder.length === 0) return professionals
    const pos = new Map(colOrder.map((id, i) => [id, i] as const))
    return [...professionals].sort((a, b) => {
      const ia = pos.has(a.id) ? pos.get(a.id)! : Infinity
      const ib = pos.has(b.id) ? pos.get(b.id)! : Infinity
      return ia - ib
    })
  }, [professionals, colOrder])

  const [allHours,      setAllHours]      = useState<HourSlot[]>([])
  const [blockModal,    setBlockModal]    = useState(false)
  const [blockInitTime, setBlockInitTime] = useState<string | undefined>()
  const [blockInitProf, setBlockInitProf] = useState<string | undefined>()

  const dateStr  = dayjs(selectedDate).format('YYYY-MM-DD')
  const bookings = getBookingsForDate(dateStr)
  const blocks   = getBlocksForDate(dateStr)

  const weekday   = dayjs(selectedDate).day()
  const todaySlot = allHours.find(s => s.weekday === weekday)
  const workingHours: WorkingHours = todaySlot
    ? { open: todaySlot.open, startTime: todaySlot.startTime, endTime: todaySlot.endTime }
    : { open: true, startTime: '08:00', endTime: '20:00' }

  useEffect(() => {
    if (externalDate) setSelectedDate(externalDate)
  }, [externalDate, setSelectedDate])

  useEffect(() => {
    onDateChange?.(selectedDate)
  }, [selectedDate, onDateChange])

  // ─── Working hours: fetch único no mount ───────────────────────────────────
  useEffect(() => {
    let cancelled = false
    api.get('/business-hours')
      .then(res => {
        if (cancelled) return
        const data = res.data?.data ?? res.data
        if (Array.isArray(data)) setAllHours(data)
      })
      .catch(() => { /* silencioso — usa default */ })
    return () => { cancelled = true }
  }, [])

  // ─── Blocks: fetch por data ────────────────────────────────────────────────
  const fetchBlocks = useCallback(async (date: string, signal: AbortSignal) => {
    try {
      const res  = await api.get('/blocks', { params: { date }, signal })
      if (signal.aborted) return
      const data = res.data?.data ?? res.data
      setBlocksForDate(date, Array.isArray(data) ? data : [])
    } catch {
      /* silencioso */
    }
  }, [setBlocksForDate])

  useEffect(() => {
    const ctrl = new AbortController()
    fetchBlocks(dateStr, ctrl.signal)
    return () => ctrl.abort()
  }, [dateStr, fetchBlocks])

  // ─── Helpers ───────────────────────────────────────────────────────────────
  const updateBlock = useCallback((ds: string, updated: AgendaBlock) => {
    removeBlock(ds, updated.id)
    addBlock(ds, updated)
  }, [addBlock, removeBlock])

  // Socket = sinal de refresh. Eventos de booking (criado/alterado/cancelado em
  // outro dispositivo, cliente online, ou venda confirmada) disparam um refetch
  // debounced do dia — o /agenda/day recalcula selo/flags/grupo, sempre correto.
  // created/canceled também aplicam otimista (snap); o refetch reconcilia.
  const refreshTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const scheduleRefresh = useCallback(() => {
    if (refreshTimer.current) clearTimeout(refreshTimer.current)
    refreshTimer.current = setTimeout(() => { onRefreshBookings?.() }, 250)
  }, [onRefreshBookings])
  useEffect(() => () => { if (refreshTimer.current) clearTimeout(refreshTimer.current) }, [])

  useAgendaSocket({
    businessId,
    onCreate:      b  => { console.log('[AG onCreate]', { bDate: b.date, dateStr, willAdd: b.date === dateStr }); if (b.date === dateStr) addBooking(dateStr, b); scheduleRefresh() },
    onUpdate:      () => scheduleRefresh(),
    onCancel:      id => { removeBooking(dateStr, id); scheduleRefresh() },
    onReconnect:   () => scheduleRefresh(),
    onBlockCreate: b  => { if (b.date === dateStr) addBlock(dateStr, b) },
    onBlockDelete: id => removeBlock(dateStr, id),
    onBlockUpdate: b  => { if (b.date === dateStr) updateBlock(dateStr, b) },
  })

  // ─── Block handlers ────────────────────────────────────────────────────────
  const openBlockModal = useCallback((time?: string, profId?: string) => {
    const resolvedProfId = profId ?? professionals[0]?.id
    if (!resolvedProfId) return
    setBlockInitTime(time)
    setBlockInitProf(resolvedProfId)
    setBlockModal(true)
  }, [professionals])

  const handleBlockCreated = useCallback((block: AgendaBlock) => {
    if (block.date === dateStr) addBlock(dateStr, block)
  }, [dateStr, addBlock])

  const handleDeleteBlock = useCallback(async (blockId: string) => {
    try {
      await api.delete(`/blocks/${blockId}`)
      removeBlock(dateStr, blockId)
    } catch {
      /* silencioso */
    }
  }, [dateStr, removeBlock])

  const handleUpdateBlock = useCallback((updated: AgendaBlock) => {
    updateBlock(dateStr, updated)
  }, [dateStr, updateBlock])

  // ─── Painéis (view vs create/edit) ─────────────────────────────────────────
  const isView   = checkout.open && checkout.mode === 'view'
  const isCreate = checkout.open && (checkout.mode === 'create' || checkout.mode === 'edit')
  const editMode: 'create' | 'edit' | null =
    checkout.mode === 'create' ? 'create'
    : checkout.mode === 'edit' ? 'edit'
    : null

  return (
    <>
      <div style={{
        width:'100%', height:'100%', display:'flex', flexDirection:'column',
        background: colors.background.page,
        fontFamily:'-apple-system,"SF Pro Display",system-ui,sans-serif',
      }}>
        <AgendaToolbar
          onBlockClick={() => openBlockModal()}
          professionals={professionals}
        />

        <div style={{ flex:1, minHeight:0, display:'flex', flexDirection:'column' }}>
          {mode === 'desktop' && (
            <AgendaGrid
              pxPerMin={pxPerMin} onZoomIn={zoomIn} onZoomOut={zoomOut} canZoomIn={canZoomIn} canZoomOut={canZoomOut}
              collapsed={collapsed} onToggleCollapse={toggleCollapse} onReorderColumns={reorderColumns}
              professionals={orderedProfs} bookings={bookings} blocks={blocks}
              workingHours={workingHours}
              onOpenBlockModal={openBlockModal}
              onDeleteBlock={handleDeleteBlock}
              onUpdateBlock={handleUpdateBlock}
            />
          )}
          {mode === 'ipad' && (
            <AgendaIPadList
              pxPerMin={pxPerMin} onZoomIn={zoomIn} onZoomOut={zoomOut} canZoomIn={canZoomIn} canZoomOut={canZoomOut}
              collapsed={collapsed} onToggleCollapse={toggleCollapse} onReorderColumns={reorderColumns}
              professionals={orderedProfs} bookings={bookings} blocks={blocks}
              workingHours={workingHours}
              onOpenBlockModal={openBlockModal}
              onDeleteBlock={handleDeleteBlock}
              onUpdateBlock={handleUpdateBlock}
            />
          )}
          {mode === 'mobile' && (
            <AgendaMobileList
              professionals={orderedProfs} bookings={bookings} blocks={blocks}
              workingHours={workingHours}
              onDeleteBlock={handleDeleteBlock}
              onUpdateBlock={handleUpdateBlock}
              onOpenBlockModal={openBlockModal}
            />
          )}
        </div>
      </div>

      {/* Visualização de agendamento existente */}
      {isView && checkout.booking && (
        <BookingViewPanel
          booking={checkout.booking}
          date={selectedDate}
          open={isView}
          onClose={closeCheckout}
        />
      )}

      {/* Criação/edição de agendamento */}
      {isCreate && editMode && (
        <SideCheckoutPanel
          open={isCreate}
          mode={editMode}
          time={checkout.time}
          professionalId={checkout.professionalId}
          professionals={professionals}
          selectedDate={selectedDate}
          existingBooking={checkout.booking}
          prefillClient={checkout.prefillClient}
          addToGroupRefId={checkout.addToGroupRefId}
          prefillItems={checkout.prefillItems}
          onClose={closeCheckout}
          onDateChange={date => setSelectedDate(date)}
        />
      )}

      {blockModal && (
        <BlockModal
          professionals={professionals}
          selectedDate={selectedDate}
          initialTime={blockInitTime}
          initialProfId={blockInitProf}
          onClose={() => setBlockModal(false)}
          onCreated={handleBlockCreated}
        />
      )}
    </>
  )
}
