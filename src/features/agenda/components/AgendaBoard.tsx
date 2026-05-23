'use client'
// src/features/agenda/components/AgendaBoard.tsx
// Coordenador da agenda: detecta dispositivo, busca dados, gerencia painéis.

import { useEffect, useState, useCallback } from 'react'
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
}

export default function AgendaBoard({ professionals, businessId, externalDate, onDateChange }: Props) {
  // Selectors granulares no Zustand — evita re-render por mudança em campo não usado
  const selectedDate       = useAgendaStore(s => s.selectedDate)
  const setSelectedDate    = useAgendaStore(s => s.setSelectedDate)
  const getBookingsForDate = useAgendaStore(s => s.getBookingsForDate)
  const addBooking         = useAgendaStore(s => s.addBooking)
  const updateBooking      = useAgendaStore(s => s.updateBooking)
  const removeBooking      = useAgendaStore(s => s.removeBooking)
  const getBlocksForDate   = useAgendaStore(s => s.getBlocksForDate)
  const setBlocksForDate   = useAgendaStore(s => s.setBlocksForDate)
  const addBlock           = useAgendaStore(s => s.addBlock)
  const removeBlock        = useAgendaStore(s => s.removeBlock)
  const checkout           = useAgendaStore(s => s.checkout)
  const closeCheckout      = useAgendaStore(s => s.closeCheckout)

  const mode = useDeviceMode()

  const [allHours,      setAllHours]      = useState<HourSlot[]>([])
  const [blockModal,    setBlockModal]    = useState(false)
  const [blockInitTime, setBlockInitTime] = useState<string | undefined>()
  const [blockInitProf, setBlockInitProf] = useState<string | undefined>()

  const dateStr  = dayjs(selectedDate).format('YYYY-MM-DD')
  const bookings = getBookingsForDate(dateStr)
  const blocks   = getBlocksForDate(dateStr)

  // Working hours do dia selecionado (default 08:00-20:00 se não houver dado)
  const weekday   = dayjs(selectedDate).day()
  const todaySlot = allHours.find(s => s.weekday === weekday)
  const workingHours: WorkingHours = todaySlot
    ? { open: todaySlot.open, startTime: todaySlot.startTime, endTime: todaySlot.endTime }
    : { open: true, startTime: '08:00', endTime: '20:00' }

  // Sync com externalDate (vindo do pai, ex: query param ?date=)
  useEffect(() => {
    if (externalDate) setSelectedDate(externalDate)
  }, [externalDate, setSelectedDate])

  // Notifica pai quando a data interna muda
  useEffect(() => {
    onDateChange?.(selectedDate)
  }, [selectedDate, onDateChange])

  // ─── Busca dados ───────────────────────────────────────────────────────────
  // Working hours: fetch único no mount
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

  // Blocks: fetch por data — com cleanup pra evitar race ao trocar data rápido
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
  // Atualiza bloco existente (remove + add — mais simples que find/replace)
  const updateBlock = useCallback((ds: string, updated: AgendaBlock) => {
    removeBlock(ds, updated.id)
    addBlock(ds, updated)
  }, [addBlock, removeBlock])

  // Socket handlers — refs estáveis (passa direto p/ Socket.IO)
  useAgendaSocket({
    businessId,
    onCreate:      b  => addBooking(dateStr, b),
    onUpdate:      b  => updateBooking(dateStr, b),
    onCancel:      id => removeBooking(dateStr, id),
    onBlockCreate: b  => { if (b.date === dateStr) addBlock(dateStr, b) },
    onBlockDelete: id => removeBlock(dateStr, id),
    onBlockUpdate: b  => { if (b.date === dateStr) updateBlock(dateStr, b) },
  })

  // ─── Block handlers ────────────────────────────────────────────────────────
  // Abre modal de criar bloco
  const openBlockModal = useCallback((time?: string, profId?: string) => {
    const resolvedProfId = profId ?? professionals[0]?.id
    if (!resolvedProfId) return  // sem profissionais, não faz sentido
    setBlockInitTime(time)
    setBlockInitProf(resolvedProfId)
    setBlockModal(true)
  }, [professionals])

  const handleBlockCreated = useCallback((block: AgendaBlock) => {
    if (block.date === dateStr) addBlock(dateStr, block)
  }, [dateStr, addBlock])

  // Delete: AgendaBoard faz a chamada API + o store update — modal só notifica
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
  // Type narrowing pra SideCheckoutPanel sem cast forçado
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
              professionals={professionals} bookings={bookings} blocks={blocks}
              workingHours={workingHours}
              onOpenBlockModal={openBlockModal}
              onDeleteBlock={handleDeleteBlock}
              onUpdateBlock={handleUpdateBlock}
            />
          )}
          {mode === 'ipad' && (
            <AgendaIPadList
              professionals={professionals} bookings={bookings} blocks={blocks}
              workingHours={workingHours}
              onOpenBlockModal={openBlockModal}
              onDeleteBlock={handleDeleteBlock}
              onUpdateBlock={handleUpdateBlock}
            />
          )}
          {mode === 'mobile' && (
            <AgendaMobileList
              professionals={professionals} bookings={bookings} blocks={blocks}
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
