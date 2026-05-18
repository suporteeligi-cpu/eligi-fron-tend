'use client'
// src/features/agenda/components/AgendaBoard.tsx

import { useEffect, useState, useCallback } from 'react'
import dayjs from 'dayjs'
import AgendaToolbar     from './AgendaToolbar'
import AgendaGrid        from './AgendaGrid'
import AgendaMobileList  from './AgendaMobileList'
import SideCheckoutPanel from '@/features/booking/components/SideCheckoutPanel'
import BlockModal        from './BlockModal'
import { useAgendaStore }  from '../hooks/useAgendaStore'
import { useAgendaSocket } from '../hooks/useAgendaSocket'
import { AgendaProfessional, AgendaBlock } from '../types'
import { colors } from '@/shared/theme'
import api from '@/shared/lib/apiClient'

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

  // Detecta touch puro — cobre iPhone, Android, iPad mini, iPad, iPad Pro
  const [isTouchDevice, setIsTouchDevice] = useState(() => {
    if (typeof window === 'undefined') return false
    return 'ontouchstart' in window || navigator.maxTouchPoints > 0
  })

  const [blockModal,    setBlockModal]    = useState(false)
  const [blockInitTime, setBlockInitTime] = useState<string | undefined>()
  const [blockInitProf, setBlockInitProf] = useState<string | undefined>()

  const dateStr  = dayjs(selectedDate).format('YYYY-MM-DD')
  const bookings = getBookingsForDate(dateStr)
  const blocks   = getBlocksForDate(dateStr)

  useEffect(() => { if (externalDate) setSelectedDate(externalDate) }, [externalDate, setSelectedDate])
  useEffect(() => { onDateChange?.(selectedDate) }, [selectedDate, onDateChange])

  useEffect(() => {
    function onResize() {
      setIsTouchDevice('ontouchstart' in window || navigator.maxTouchPoints > 0)
    }
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
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
    setBlockInitTime(time)
    setBlockInitProf(resolvedProfId)
    setBlockModal(true)
  }

  function handleBlockCreated(block: AgendaBlock) {
    if (block.date === dateStr) addBlock(dateStr, block)
  }

  async function handleDeleteBlock(blockId: string) {
    try { await api.delete(`/blocks/${blockId}`); removeBlock(dateStr, blockId) } catch { /* silencioso */ }
  }

  function handleUpdateBlock(updated: AgendaBlock) {
    updateBlock(dateStr, updated)
  }

  return (
    <>
      <div style={{ width:'100%', height:'100%', display:'flex', flexDirection:'column', background:colors.background.page, fontFamily:'-apple-system,"SF Pro Display",system-ui,sans-serif' }}>
        <AgendaToolbar onBlockClick={() => openBlockModal()} />

        <div style={{ flex:1, minHeight:0, display:'flex', flexDirection:'column' }}>
          {isTouchDevice ? (
            <AgendaMobileList
              professionals={professionals}
              bookings={bookings}
              blocks={blocks}
              onDeleteBlock={handleDeleteBlock}
              onUpdateBlock={handleUpdateBlock}
              onOpenBlockModal={openBlockModal}
            />
          ) : (
            <AgendaGrid
              professionals={professionals}
              bookings={bookings}
              blocks={blocks}
              onOpenBlockModal={openBlockModal}
              onDeleteBlock={handleDeleteBlock}
              onUpdateBlock={handleUpdateBlock}
            />
          )}
        </div>
      </div>

      <SideCheckoutPanel
        open={checkout.open} mode={checkout.mode}
        time={checkout.time} professionalId={checkout.professionalId}
        booking={checkout.booking} professionals={professionals}
        selectedDate={selectedDate} onClose={closeCheckout}
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