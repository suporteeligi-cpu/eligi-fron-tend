'use client'
// src/features/agenda/components/AgendaToolbar.tsx
// Toolbar compacta — UMA linha: ‹ roleta-de-dias › + ações (Bloquear/Hoje/Novo à direita).
// Clicar no dia JÁ selecionado (vermelho) abre o CalendarPicker compartilhado.

import { useState, useRef, useEffect, useCallback } from 'react'
import dayjs from 'dayjs'
import 'dayjs/locale/pt-br'
import { ChevronLeft, ChevronRight, Plus, Ban } from 'lucide-react'

import { colors, transitions, typography, glass } from '@/shared/theme'
import { useAgendaStore } from '../hooks/useAgendaStore'
import { useDeviceMode }  from '../hooks/useDeviceMode'
import { AgendaProfessional } from '../types'
import CalendarPicker from '@/shared/components/CalendarPicker'

dayjs.locale('pt-br')

const DAYS_PT = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

interface Props {
  onBlockClick?: () => void
  professionals: AgendaProfessional[]
}

export default function AgendaToolbar({ onBlockClick, professionals }: Props) {
  const selectedDate    = useAgendaStore(s => s.selectedDate)
  const setSelectedDate = useAgendaStore(s => s.setSelectedDate)
  const openCreate      = useAgendaStore(s => s.openCreate)

  const mode     = useDeviceMode()
  const isMobile = mode === 'mobile'

  const selected = dayjs(selectedDate)
  const today    = dayjs()
  const isToday  = selected.isSame(today, 'day')

  const [showCal, setShowCal] = useState(false)
  const stripRef = useRef<HTMLDivElement>(null)
  const userInteractedRef = useRef(false)

  const startDay  = selected.subtract(3, 'day')
  const stripDays = Array.from({ length: 7 }, (_, i) => startDay.add(i, 'day'))

  useEffect(() => {
    if (!userInteractedRef.current) return
    const el = stripRef.current?.querySelector('.day-active') as HTMLElement | null
    el?.scrollIntoView({ inline: 'center', behavior: 'smooth', block: 'nearest' })
  }, [selectedDate])

  // Clica num dia: se já é o selecionado → abre calendário; senão → seleciona.
  // Usa selectedDate (Date primitivo) na dep, não o dayjs derivado (React Compiler).
  const pickDay = useCallback((d: dayjs.Dayjs) => {
    userInteractedRef.current = true
    if (d.isSame(dayjs(selectedDate), 'day')) {
      setShowCal(true)
    } else {
      setSelectedDate(d.toDate())
    }
  }, [selectedDate, setSelectedDate, setShowCal])

  const goDay = useCallback((delta: number) => {
    userInteractedRef.current = true
    setSelectedDate(dayjs(selectedDate).add(delta, 'day').toDate())
  }, [selectedDate, setSelectedDate])

  const openNew = useCallback(() => {
    const defaultProfId = professionals[0]?.id ?? ''
    openCreate('09:00', defaultProfId)
  }, [professionals, openCreate])

  // ── Roleta de dias (compacta) ──
  const strip = (
    <div style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', gap: 4 }}>
      <button className="nav-btn" onClick={() => goDay(-1)}>
        <ChevronLeft size={15} strokeWidth={2.5} />
      </button>
      <div ref={stripRef} className="strip-scroll" style={{
        flex: 1, display: 'flex', gap: 3, overflowX: 'auto', scrollbarWidth: 'none',
        justifyContent: isMobile ? 'flex-start' : 'space-between',
      }}>
        {stripDays.map(day => {
          const isSel    = day.isSame(selected, 'day')
          const isTodayD = day.isSame(today, 'day')
          return (
            <button
              key={day.format('YYYY-MM-DD')}
              className={`day-chip${isSel ? ' day-active' : ''}`}
              onClick={() => pickDay(day)}
              title={isSel ? 'Abrir calendário' : undefined}
            >
              <span style={{
                fontSize: 8, fontWeight: 700, letterSpacing: '.05em',
                color: isSel ? 'rgba(255,255,255,0.72)' : colors.gray.dimText, marginBottom: 1,
              }}>
                {DAYS_PT[day.day()].toUpperCase()}
              </span>
              <span style={{
                fontSize: 15, fontWeight: 700, lineHeight: 1,
                color: isSel ? '#fff' : isTodayD ? colors.red.DEFAULT : colors.gray[900],
              }}>
                {day.date()}
              </span>
              <div style={{
                width: 3, height: 3, borderRadius: '50%', marginTop: 1,
                background: isTodayD ? (isSel ? 'rgba(255,255,255,0.7)' : colors.red.DEFAULT) : 'transparent',
              }} />
            </button>
          )
        })}
      </div>
      <button className="nav-btn" onClick={() => goDay(1)}>
        <ChevronRight size={15} strokeWidth={2.5} />
      </button>
    </div>
  )

  // ── Ações ──
  const actions = (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
      {!isMobile && onBlockClick && (
        <button className="tb-block-btn" onClick={onBlockClick}>
          <Ban size={11} strokeWidth={2.5} /> Bloquear
        </button>
      )}
      <button
        className={`tb-today-btn${isToday ? ' is-today' : ''}`}
        onClick={() => { userInteractedRef.current = true; setSelectedDate(today.toDate()) }}
      >Hoje</button>
      <button className="tb-new-btn" onClick={openNew}>
        <Plus size={13} strokeWidth={2.5} /> {isMobile ? '' : 'Novo'}
      </button>
    </div>
  )

  return (
    <div style={{
      background: glass.surface.toolbar.background,
      backdropFilter: glass.surface.toolbar.backdropFilter,
      WebkitBackdropFilter: glass.surface.toolbar.backdropFilter,
      borderBottom: glass.surface.toolbar.borderBottom,
      position: 'sticky', top: 0, zIndex: 100, flexShrink: 0,
      fontFamily: typography.fontFamily,
    }}>
      <style>{`
        .day-chip{display:flex; flex-direction:column; align-items:center; justify-content:center; border-radius:10px; border:1px solid transparent; cursor:pointer; transition:${transitions.spring}; background:transparent; flex:1; min-width:38px; padding:4px 3px; -webkit-tap-highlight-color:transparent}
        .day-chip:active{transform:scale(0.90)}
        .day-chip.day-active{background:${colors.red.gradient}; border-color:transparent; box-shadow:0 2px 8px ${colors.red.glow}}
        .day-chip:not(.day-active):active{background:${colors.red.subtle}}
        .nav-btn{width:28px; height:28px; border-radius:50%; border:1px solid ${colors.gray.borderMd}; background:${colors.background.surface}; cursor:pointer; display:flex; align-items:center; justify-content:center; transition:${transitions.fast}; color:${colors.gray[700]}; flex-shrink:0; -webkit-tap-highlight-color:transparent}
        .nav-btn:hover{background:${colors.red.subtle}; border-color:${colors.red.border}; color:${colors.red.DEFAULT}}
        .nav-btn:active{transform:scale(0.90)}
        .strip-scroll::-webkit-scrollbar{display:none}
        .tb-new-btn{display:flex; align-items:center; gap:4px; padding:7px 13px; border-radius:18px; font-size:12px; font-weight:700; cursor:pointer; border:none; background:${colors.red.gradient}; color:#fff; transition:${transitions.spring}; box-shadow:0 3px 10px ${colors.red.glow}; -webkit-tap-highlight-color:transparent; white-space:nowrap}
        .tb-new-btn:active{transform:scale(0.94)}
        .tb-block-btn{display:flex; align-items:center; gap:4px; padding:6px 11px; border-radius:18px; font-size:12px; font-weight:600; cursor:pointer; border:1px solid rgba(71,85,105,0.20); background:rgba(71,85,105,0.06); color:#475569; transition:${transitions.fast}; white-space:nowrap}
        .tb-block-btn:hover{background:rgba(71,85,105,0.12)}
        .tb-block-btn:active{transform:scale(0.94)}
        .tb-today-btn{padding:6px 12px; border-radius:18px; font-size:12px; font-weight:600; cursor:pointer; border:1px solid ${colors.red.border}; background:${colors.red.subtle}; color:${colors.red.DEFAULT}; transition:${transitions.spring}; white-space:nowrap}
        .tb-today-btn:hover{background:${colors.red.gradient}; color:#fff; border-color:transparent}
        .tb-today-btn.is-today{background:rgba(0,0,0,0.04); border-color:${colors.gray.borderMd}; color:${colors.gray[500]}; pointer-events:none}
      `}</style>

      {showCal && (
        <CalendarPicker
          date={selected}
          isMobile={isMobile}
          onSelect={d => { userInteractedRef.current = true; setSelectedDate(d.toDate()) }}
          onClose={() => setShowCal(false)}
        />
      )}

      {/* UMA linha: roleta + ações */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: isMobile ? 6 : 10,
        padding: isMobile ? '6px 10px' : '8px 20px',
      }}>
        {strip}
        {actions}
      </div>
    </div>
  )
}
