'use client'
// src/features/agenda/components/AgendaBoard.tsx

import { useEffect, useState, useCallback } from 'react'
import dayjs from 'dayjs'
import AgendaToolbar    from './AgendaToolbar'
import AgendaGrid       from './AgendaGrid'
import AgendaIPadList   from './AgendaIPadList'
import AgendaMobileList from './AgendaMobileList'
import SideCheckoutPanel from '@/features/booking/components/SideCheckoutPanel'
import BlockModal        from './BlockModal'
import { useAgendaStore }  from '../hooks/useAgendaStore'
import { useAgendaSocket } from '../hooks/useAgendaSocket'
import { AgendaProfessional, AgendaBlock } from '../types'
import { colors } from '@/shared/theme'
import api from '@/shared/lib/apiClient'

type DeviceMode = 'desktop' | 'ipad' | 'mobile'

function detectMode(): DeviceMode {
  if (typeof window === 'undefined') return 'desktop'
  const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0
  if (!hasTouch) return 'desktop'
  if (window.innerWidth >= 768) return 'ipad'
  return 'mobile'
}

// Horário de expediente do dia selecionado
export interface WorkingHours {
  open:      boolean
  startTime: string   // ex: "10:00"
  endTime:   string   // ex: "20:00"
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
  const {
    selectedDate, setSelectedDate,
    getBookingsForDate, addBooking, updateBooking, removeBooking,
    getBlocksForDate, setBlocksForDate, addBlock, removeBlock,
    checkout, closeCheckout,
  } = useAgendaStore()

  const [mode,         setMode]         = useState<DeviceMode>(() => detectMode())
  const [allHours,     setAllHours]     = useState<HourSlot[]>([])
  const [blockModal,   setBlockModal]   = useState(false)
  const [blockInitTime,setBlockInitTime]= useState<string | undefined>()
  const [blockInitProf,setBlockInitProf]= useState<string | undefined>()

  const dateStr  = dayjs(selectedDate).format('YYYY-MM-DD')
  const bookings = getBookingsForDate(dateStr)
  const blocks   = getBlocksForDate(dateStr)

  // Dia da semana do dia selecionado (0=Dom, 1=Seg, ...)
  const weekday     = dayjs(selectedDate).day()
  const todaySlot   = allHours.find(s => s.weekday === weekday)
  const workingHours: WorkingHours = todaySlot
    ? { open: todaySlot.open, startTime: todaySlot.startTime, endTime: todaySlot.endTime }
    : { open: true, startTime: '08:00', endTime: '20:00' } // fallback

  useEffect(() => { if (externalDate) setSelectedDate(externalDate) }, [externalDate, setSelectedDate])
  useEffect(() => { onDateChange?.(selectedDate) }, [selectedDate, onDateChange])

  useEffect(() => {
    function onResize() { setMode(detectMode()) }
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  // Busca horários de funcionamento (uma vez, não muda por data)
  useEffect(() => {
    api.get('/business-hours')
      .then(res => {
        const data = res.data?.data ?? res.data
        if (Array.isArray(data)) setAllHours(data)
      })
      .catch(() => { /* silencioso — usa fallback */ })
  }, [])

  const fetchBlocks = useCallback(async () => {
    try {
      const res  = await api.get('/blocks', { params: { date: dateStr } })
      const data = res.data?.data ?? res.data
      setBlocksForDate(dateStr, Array.isArray(data) ? data : [])
    } catch { /* silencioso */ }
  }, [dateStr, setBlocksForDate])

  useEffect(() => { fetchBlocks() }, [fetchBlocks])

  function updateBlock(ds: string, updated: AgendaBlock) {
    removeBlock(ds, updated.id)
    addBlock(ds, updated)
  }

  useAgendaSocket({
    businessId,
    onCreate:      b  => addBooking(dateStr, b),
    onUpdate:      b  => updateBooking(dateStr, b),
    onCancel:      id => removeBooking(dateStr, id),
    onBlockCreate: b  => { if (b.date === dateStr) addBlock(dateStr, b) },
    onBlockDelete: id => removeBlock(dateStr, id),
    onBlockUpdate: b  => { if (b.date === dateStr) updateBlock(dateStr, b) },
  })

  function openBlockModal(time?: string, profId?: string) {
    const resolvedProfId = profId ?? professionals[0]?.id
    if (!resolvedProfId) return
    setBlockInitTime(time); setBlockInitProf(resolvedProfId); setBlockModal(true)
  }

  function handleBlockCreated(block: AgendaBlock) {
    if (block.date === dateStr) addBlock(dateStr, block)
  }

  async function handleDeleteBlock(blockId: string) {
    try { await api.delete(`/blocks/${blockId}`); removeBlock(dateStr, blockId) } catch { /**/ }
  }

  function handleUpdateBlock(updated: AgendaBlock) { updateBlock(dateStr, updated) }

  return (
    <>
      <div style={{ width:'100%', height:'100%', display:'flex', flexDirection:'column', background:colors.background.page, fontFamily:'-apple-system,"SF Pro Display",system-ui,sans-serif' }}>
        <AgendaToolbar onBlockClick={() => openBlockModal()} />

        <div style={{ flex:1, minHeight:0, display:'flex', flexDirection:'column' }}>
          {mode === 'desktop' && (
            <AgendaGrid
              professionals={professionals} bookings={bookings} blocks={blocks}
              workingHours={workingHours}
              onOpenBlockModal={openBlockModal}
              onDeleteBlock={handleDeleteBlock} onUpdateBlock={handleUpdateBlock}
            />
          )}
          {mode === 'ipad' && (
            <AgendaIPadList
              professionals={professionals} bookings={bookings} blocks={blocks}
              workingHours={workingHours}
              onOpenBlockModal={openBlockModal}
              onDeleteBlock={handleDeleteBlock} onUpdateBlock={handleUpdateBlock}
            />
          )}
          {mode === 'mobile' && (
            <AgendaMobileList
              professionals={professionals} bookings={bookings} blocks={blocks}
              workingHours={workingHours}
              onDeleteBlock={handleDeleteBlock} onUpdateBlock={handleUpdateBlock}
              onOpenBlockModal={openBlockModal}
            />
          )}
        </div>
      </div>

      <SideCheckoutPanel
        open={checkout.open} mode={checkout.mode}
        time={checkout.time} professionalId={checkout.professionalId}
        professionals={professionals}
        selectedDate={selectedDate} onClose={closeCheckout}
        onDateChange={date => setSelectedDate(date)}
      />

      {blockModal && (
        <BlockModal
          professionals={professionals} selectedDate={selectedDate}
          initialTime={blockInitTime} initialProfId={blockInitProf}
          onClose={() => setBlockModal(false)} onCreated={handleBlockCreated}
        />
      )}
    </>
  )
}