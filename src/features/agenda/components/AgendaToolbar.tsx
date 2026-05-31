'use client'
// src/features/agenda/components/AgendaToolbar.tsx
// Toolbar: data central clicável (abre CalendarPicker compartilhado) + setas + ações.
// Faixa de chips de dia removida — navegação por setas e calendário.

import { useState, useCallback } from 'react'
import dayjs from 'dayjs'
import 'dayjs/locale/pt-br'
import { ChevronLeft, ChevronRight, Plus, Ban, ChevronDown } from 'lucide-react'

import { colors, transitions, typography, glass } from '@/shared/theme'
import { useAgendaStore } from '../hooks/useAgendaStore'
import { useDeviceMode }  from '../hooks/useDeviceMode'
import { AgendaProfessional } from '../types'
import CalendarPicker from '@/shared/components/CalendarPicker'

dayjs.locale('pt-br')

const DAYS_PT = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado']
const MONTHS_SHORT = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']

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

  const goDay = useCallback((delta: number) => {
    setSelectedDate(dayjs(selectedDate).add(delta, 'day').toDate())
  }, [selectedDate, setSelectedDate])

  const openNew = useCallback(() => {
    const defaultProfId = professionals[0]?.id ?? ''
    openCreate('09:00', defaultProfId)
  }, [professionals, openCreate])

  // Rótulo da data: "Hoje · Sex, 31 mai" / "Sex, 31 mai 2026"
  const dateLabel = (() => {
    const dia = DAYS_PT[selected.day()].slice(0, 3)
    const base = `${dia}, ${selected.date()} ${MONTHS_SHORT[selected.month()]}`
    if (isToday) return `Hoje · ${base}`
    if (selected.year() !== today.year()) return `${base} ${selected.year()}`
    return base
  })()

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
        .nav-btn{width:32px; height:32px; border-radius:50%; border:1px solid ${colors.gray.borderMd}; background:${colors.background.surface}; cursor:pointer; display:flex; align-items:center; justify-content:center; transition:${transitions.fast}; color:${colors.gray[700]}; flex-shrink:0; -webkit-tap-highlight-color:transparent}
        .nav-btn:hover{background:${colors.red.subtle}; border-color:${colors.red.border}; color:${colors.red.DEFAULT}}
        .nav-btn:active{transform:scale(0.90)}
        .tb-new-btn{display:flex; align-items:center; gap:4px; padding:8px 16px; border-radius:20px; font-size:13px; font-weight:700; cursor:pointer; border:none; background:${colors.red.gradient}; color:#fff; transition:${transitions.spring}; box-shadow:0 3px 10px ${colors.red.glow}; -webkit-tap-highlight-color:transparent; white-space:nowrap}
        .tb-new-btn:active{transform:scale(0.94)}
        .tb-block-btn{display:flex; align-items:center; gap:4px; padding:7px 12px; border-radius:20px; font-size:12px; font-weight:600; cursor:pointer; border:1px solid rgba(71,85,105,0.20); background:rgba(71,85,105,0.06); color:#475569; transition:${transitions.fast}; white-space:nowrap}
        .tb-block-btn:hover{background:rgba(71,85,105,0.12)}
        .tb-block-btn:active{transform:scale(0.94)}
        .tb-today-btn{padding:7px 13px; border-radius:20px; font-size:12px; font-weight:600; cursor:pointer; border:1px solid ${colors.red.border}; background:${colors.red.subtle}; color:${colors.red.DEFAULT}; transition:${transitions.spring}; white-space:nowrap}
        .tb-today-btn:hover{background:${colors.red.gradient}; color:#fff; border-color:transparent}
        .tb-today-btn.is-today{background:rgba(0,0,0,0.04); border-color:${colors.gray.borderMd}; color:${colors.gray[500]}; pointer-events:none}
        .tb-date-btn{display:flex; align-items:center; justify-content:center; gap:6px; padding:8px 18px; border-radius:22px; border:1px solid ${colors.gray.borderMd}; background:${colors.background.surface}; cursor:pointer; font-weight:700; color:${colors.gray[900]}; transition:${transitions.spring}; white-space:nowrap; -webkit-tap-highlight-color:transparent; font-family:${typography.fontFamily}}
        .tb-date-btn:hover{border-color:${colors.red.borderHover}; color:${colors.red.DEFAULT}; background:${colors.red.subtle}}
        .tb-date-btn:active{transform:scale(0.97)}
      `}</style>

      {showCal && (
        <CalendarPicker
          date={selected}
          isMobile={isMobile}
          onSelect={d => setSelectedDate(d.toDate())}
          onClose={() => setShowCal(false)}
        />
      )}

      {isMobile ? (
        /* ══ MOBILE ══ */
        <>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px 6px', gap: 8 }}>
            {!isToday ? (
              <button
                className="tb-today-btn"
                onClick={() => setSelectedDate(today.toDate())}
              >Hoje</button>
            ) : <div style={{ width: 1 }} />}
            <button className="tb-new-btn" onClick={openNew}>
              <Plus size={14} strokeWidth={2.5} /> Novo
            </button>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '0 12px 8px' }}>
            <button className="nav-btn" onClick={() => goDay(-1)}>
              <ChevronLeft size={16} strokeWidth={2.5} />
            </button>
            <button className="tb-date-btn" onClick={() => setShowCal(true)} style={{ flex: 1, fontSize: 14 }}>
              {dateLabel}
              <ChevronDown size={13} strokeWidth={2.5} style={{ opacity: 0.5 }} />
            </button>
            <button className="nav-btn" onClick={() => goDay(1)}>
              <ChevronRight size={16} strokeWidth={2.5} />
            </button>
          </div>
        </>
      ) : (
        /* ══ DESKTOP / iPad ══ */
        <>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', padding: '10px 20px 8px', gap: 6 }}>
            {onBlockClick && (
              <button className="tb-block-btn" onClick={onBlockClick}>
                <Ban size={11} strokeWidth={2.5} /> Bloquear
              </button>
            )}
            <button
              className={`tb-today-btn${isToday ? ' is-today' : ''}`}
              onClick={() => setSelectedDate(today.toDate())}
            >Hoje</button>
            <button className="tb-new-btn" onClick={openNew}>
              <Plus size={13} strokeWidth={2.5} /> Novo
            </button>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, padding: '0 20px 12px' }}>
            <button className="nav-btn" onClick={() => goDay(-1)}>
              <ChevronLeft size={16} strokeWidth={2.5} />
            </button>
            <button className="tb-date-btn" onClick={() => setShowCal(true)} style={{ fontSize: 14, minWidth: 220 }}>
              {dateLabel}
              <ChevronDown size={14} strokeWidth={2.5} style={{ opacity: 0.5 }} />
            </button>
            <button className="nav-btn" onClick={() => goDay(1)}>
              <ChevronRight size={16} strokeWidth={2.5} />
            </button>
          </div>
        </>
      )}
    </div>
  )
}
