#!/usr/bin/env python3
# -*- coding: utf-8 -*-
# eligi-codeflow / Fatia 2 — CalendarPicker mode='range' + FiltersBar gatilho.
# Rode na raiz do front-end: python3 patch_calendar_fatia2.py
# Backup automatico em .backup/<ts>/. Idempotente por marker. Nunca heredoc.

import os, sys, shutil, datetime

FILES = {
    'src/shared/components/CalendarPicker.tsx': ('[fatia2-range]', """'use client'
// src/shared/components/CalendarPicker.tsx
// Calendário eligi COMPARTILHADO — modo dia (Agenda/Caixa/Pacotes) + modo range (Financeiro/Vendas).
// [fatia1-grid7-alinhado] header e grade dividem o MESMO grid repeat(7,1fr).
// [fatia2-range] mode='range': 2 cliques pintam de–até, atalhos, Aplicar commita e fecha.
// Retrocompatível: mode default 'day' — callers antigos (onSelect/onClose) intactos.

import { useState } from 'react'
import { createPortal } from 'react-dom'
import dayjs from 'dayjs'
import 'dayjs/locale/pt-br'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { colors, transitions, radius, typography, shadows } from '@/shared/theme'

dayjs.locale('pt-br')

const DAYS_HEADER = ['SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB', 'DOM']
const MONTHS_PT   = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro']

const EASE_SPRING = 'cubic-bezier(0.34,1.56,0.64,1)'
const EASE_SHEET  = 'cubic-bezier(0.34,1.2,0.64,1)'

interface Props {
  date:      dayjs.Dayjs
  onSelect:  (d: dayjs.Dayjs) => void
  onClose:   () => void
  isMobile:  boolean
  maxDate?:  dayjs.Dayjs   // bloqueia dias após esta data
  minDate?:  dayjs.Dayjs   // bloqueia dias antes desta data
  showWeekJump?: boolean   // (modo dia) mostra "pular por semana" (default: true)
  mode?:         'day' | 'range'          // default 'day'
  rangeStart?:   dayjs.Dayjs | null        // (modo range) valor inicial
  rangeEnd?:     dayjs.Dayjs | null
  onApplyRange?: (start: dayjs.Dayjs, end: dayjs.Dayjs) => void  // (modo range) commit
}

export default function CalendarPicker({
  date, onSelect, onClose, isMobile, maxDate, minDate, showWeekJump = true,
  mode = 'day', rangeStart = null, rangeEnd = null, onApplyRange,
}: Props) {
  const isRange = mode === 'range'
  const today = dayjs()
  const [viewMonth, setViewMonth] = useState(() => ((isRange ? (rangeStart ?? date) : date)).startOf('month'))
  const [draftStart, setDraftStart] = useState<dayjs.Dayjs | null>(() => rangeStart)
  const [draftEnd,   setDraftEnd]   = useState<dayjs.Dayjs | null>(() => rangeEnd)
  const [hover,      setHover]      = useState<dayjs.Dayjs | null>(null)

  function buildGrid(month: dayjs.Dayjs): (dayjs.Dayjs | null)[] {
    const firstDay = month.startOf('month')
    const startOffset = (firstDay.day() + 6) % 7 // 0 = segunda
    const daysInMonth = month.daysInMonth()
    const cells: (dayjs.Dayjs | null)[] = []
    for (let i = 0; i < startOffset; i++) cells.push(null)
    for (let d = 1; d <= daysInMonth; d++) cells.push(month.date(d))
    while (cells.length % 7 !== 0) cells.push(null)
    return cells
  }
  const grid = buildGrid(viewMonth)

  // ─── modo dia: faixa da semana selecionada ───────────────────────────────
  const selWeekStart = date.startOf('week').add(1, 'day') // segunda
  const isInSelWeek = (d: dayjs.Dayjs) => {
    const start = selWeekStart
    const end   = start.add(6, 'day')
    return !d.isBefore(start, 'day') && !d.isAfter(end, 'day')
  }
  const isWeekStart = (d: dayjs.Dayjs) => d.day() === 1
  const isWeekEnd   = (d: dayjs.Dayjs) => d.day() === 0

  function isDisabled(d: dayjs.Dayjs): boolean {
    if (maxDate && d.isAfter(maxDate, 'day')) return true
    if (minDate && d.isBefore(minDate, 'day')) return true
    return false
  }

  // ─── modo range ──────────────────────────────────────────────────────────
  function orderedDraft(): [dayjs.Dayjs, dayjs.Dayjs] | null {
    if (!draftStart) return null
    const e = draftEnd ?? draftStart
    return draftStart.isAfter(e, 'day') ? [e, draftStart] : [draftStart, e]
  }
  function paintBounds(): [dayjs.Dayjs, dayjs.Dayjs] | null {
    if (draftStart && !draftEnd && hover) {
      return hover.isBefore(draftStart, 'day') ? [hover, draftStart] : [draftStart, hover]
    }
    return orderedDraft()
  }
  function clickRange(day: dayjs.Dayjs) {
    if (isDisabled(day)) return
    if (!draftStart || (draftStart && draftEnd)) { setDraftStart(day); setDraftEnd(null); setHover(null) }
    else if (!day.isBefore(draftStart, 'day')) { setDraftEnd(day); setHover(null) }
    else { setDraftStart(day) } // clicou antes do início → reinicia início
  }
  function fillDraft(s: dayjs.Dayjs, e: dayjs.Dayjs) {
    setDraftStart(s); setDraftEnd(e); setHover(null); setViewMonth(s.startOf('month'))
  }
  function commitRange() {
    const b = orderedDraft()
    if (!b) return
    onApplyRange?.(b[0], b[1]); onClose()
  }
  const rangeShortcuts: Array<[string, () => void]> = [
    ['Hoje',     () => fillDraft(today, today)],
    ['7 dias',   () => fillDraft(today.subtract(6, 'day'), today)],
    ['30 dias',  () => fillDraft(today.subtract(29, 'day'), today)],
    ['Este mês', () => fillDraft(today.startOf('month'), today.endOf('month'))],
  ]
  const pb = isRange ? paintBounds() : null

  const calW = isMobile
    ? Math.min(340, (typeof window !== 'undefined' ? window.innerWidth - 32 : 320))
    : 320

  if (typeof document === 'undefined') return null

  const glass = {
    background: 'rgba(255,255,255,0.82)',
    backdropFilter: 'blur(24px) saturate(160%)',
    WebkitBackdropFilter: 'blur(24px) saturate(160%)',
    border: '1px solid rgba(255,255,255,0.9)',
  } as const

  const content = (
    <>
      <div onClick={onClose} style={{
        position: 'fixed', inset: 0,
        background: 'rgba(0,0,0,0.22)', backdropFilter: 'blur(6px)', zIndex: 10998,
      }} />

      <div style={isMobile ? {
        ...glass,
        position: 'fixed', bottom: 0, left: 0, right: 0,
        borderRadius: '24px 24px 0 0',
        boxShadow: '0 -8px 40px rgba(0,0,0,0.18)',
        zIndex: 10999, fontFamily: typography.fontFamily,
        animation: `calUp 0.28s ${EASE_SHEET}`,
        paddingBottom: 'max(20px, env(safe-area-inset-bottom))',
      } : {
        ...glass,
        position: 'fixed', top: '50%', left: '50%',
        transform: 'translate(-50%,-50%)',
        width: calW,
        borderRadius: radius['2xl'],
        boxShadow: shadows.lg,
        zIndex: 10999, fontFamily: typography.fontFamily,
        animation: `calIn 0.22s ${EASE_SPRING}`,
        overflow: 'hidden',
      }}>
        <style>{`
          @keyframes calIn{from{opacity:0; transform:translate(-50%,-50%) scale(0.93)} to{opacity:1; transform:translate(-50%,-50%) scale(1)}}
          @keyframes calUp{from{transform:translateY(100%)} to{transform:translateY(0)}}
          .calp-day{display:flex; align-items:center; justify-content:center; width:34px; height:34px; border-radius:10px; cursor:pointer; font-size:13px; font-weight:500; font-variant-numeric:tabular-nums; transition:all 0.14s ${EASE_SPRING}; border:none; background:transparent; -webkit-tap-highlight-color:transparent}
          .calp-day:active{transform:scale(0.9)}
          .calp-jump-btn{flex:1; box-sizing:border-box; padding:9px 0; border:1px solid ${colors.gray.borderMd}; border-radius:10px; background:${colors.background.surface}; font-size:12px; font-weight:600; cursor:pointer; color:${colors.gray[700]}; transition:all 0.14s ${EASE_SPRING}; -webkit-tap-highlight-color:transparent}
          .calp-jump-btn:hover{border-color:${colors.red.borderHover}; color:${colors.red.DEFAULT}; background:${colors.red.subtle}; transform:translateY(-1px)}
          .calp-jump-btn:active{transform:scale(0.94)}
        `}</style>

        {isMobile && (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0 2px' }}>
            <div style={{ width: 40, height: 4, borderRadius: 2, background: 'rgba(0,0,0,0.12)' }} />
          </div>
        )}

        {/* Header navegação de mês */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px 10px' }}>
          <button
            onClick={() => setViewMonth(v => v.subtract(1, 'month'))}
            style={{ width: 34, height: 34, borderRadius: '50%', border: `1px solid ${colors.gray.borderMd}`, background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: transitions.fast }}
            onMouseEnter={e => { e.currentTarget.style.background = colors.red.subtle; e.currentTarget.style.borderColor = colors.red.border }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = colors.gray.borderMd }}
            aria-label="Mês anterior"
          >
            <ChevronLeft size={16} color={colors.gray[700]} strokeWidth={2.5} />
          </button>

          {isRange ? (
            <div style={{ fontSize: 16, fontWeight: 700, color: colors.gray[900], letterSpacing: '-0.3px', padding: '4px 8px' }}>
              {MONTHS_PT[viewMonth.month()]} {viewMonth.year()}
            </div>
          ) : (
            <button
              onClick={() => {
                if (isDisabled(today)) return
                setViewMonth(today.startOf('month')); onSelect(today); onClose()
              }}
              style={{ fontSize: 16, fontWeight: 700, color: colors.gray[900], background: 'none', border: 'none', cursor: 'pointer', letterSpacing: '-0.3px', padding: '4px 8px', borderRadius: 8, transition: transitions.fast }}
              onMouseEnter={e => { e.currentTarget.style.color = colors.red.DEFAULT }}
              onMouseLeave={e => { e.currentTarget.style.color = colors.gray[900] }}
            >
              {MONTHS_PT[viewMonth.month()]} {viewMonth.year()}
            </button>
          )}

          <button
            onClick={() => setViewMonth(v => v.add(1, 'month'))}
            style={{ width: 34, height: 34, borderRadius: '50%', border: `1px solid ${colors.gray.borderMd}`, background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: transitions.fast }}
            onMouseEnter={e => { e.currentTarget.style.background = colors.red.subtle; e.currentTarget.style.borderColor = colors.red.border }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = colors.gray.borderMd }}
            aria-label="Próximo mês"
          >
            <ChevronRight size={16} color={colors.gray[700]} strokeWidth={2.5} />
          </button>
        </div>

        {/* Cabeçalho dias da semana — MESMO grid da grade */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', padding: '0 14px', marginBottom: 6 }}>
          {DAYS_HEADER.map(d => (
            <div key={d} style={{ textAlign: 'center', fontSize: 10, fontWeight: 700, color: colors.gray.dimText, letterSpacing: '.06em', padding: '4px 0' }}>{d}</div>
          ))}
        </div>

        {/* Grade */}
        <div style={{ padding: '0 14px 12px' }} onMouseLeave={() => { if (isRange) setHover(null) }}>
          {Array.from({ length: grid.length / 7 }, (_, row) => {
            const week = grid.slice(row * 7, row * 7 + 7)
            return (
              <div key={row} style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', marginBottom: 2 }}>
                {week.map((day, ci) => {
                  if (!day) return <div key={ci} />
                  const isTodayD     = day.isSame(today, 'day')
                  const isOtherMonth = day.month() !== viewMonth.month()
                  const disabled     = isDisabled(day)

                  // ── modo range ──
                  if (isRange) {
                    const inR    = !!pb && !day.isBefore(pb[0], 'day') && !day.isAfter(pb[1], 'day')
                    const isLo   = !!pb && day.isSame(pb[0], 'day')
                    const isHi   = !!pb && day.isSame(pb[1], 'day')
                    const single = !!pb && pb[0].isSame(pb[1], 'day')
                    const edge   = (isLo || isHi)

                    return (
                      <div key={ci} style={{ position: 'relative', display: 'flex', justifyContent: 'center', alignItems: 'center', height: 38 }}>
                        {inR && !single && (
                          <div style={{
                            position: 'absolute', left: 0, right: 0, top: '50%', height: 34,
                            transform: 'translateY(-50%)',
                            background: colors.red.subtle,
                            borderRadius: isLo ? '10px 0 0 10px' : isHi ? '0 10px 10px 0' : 0,
                            zIndex: 0,
                          }} />
                        )}
                        <button
                          className="calp-day"
                          onClick={() => clickRange(day)}
                          onMouseEnter={() => { if (draftStart && !draftEnd) setHover(day) }}
                          disabled={disabled}
                          style={{
                            position: 'relative', zIndex: 1,
                            background: edge ? colors.red.gradient : 'transparent',
                            color: edge ? '#fff'
                              : disabled ? 'rgba(0,0,0,0.18)'
                              : isOtherMonth ? 'rgba(0,0,0,0.2)'
                              : colors.gray[900],
                            fontWeight: edge ? 700 : 500,
                            boxShadow: edge ? `0 4px 12px ${colors.red.glow}` : 'none',
                            cursor: disabled ? 'not-allowed' : 'pointer',
                          }}
                        >
                          {day.date()}
                          {isTodayD && !edge && (
                            <div style={{ position: 'absolute', inset: 0, borderRadius: 10, boxShadow: `inset 0 0 0 1.5px ${colors.red.DEFAULT}`, pointerEvents: 'none' }} />
                          )}
                        </button>
                      </div>
                    )
                  }

                  // ── modo dia (Fatia 1) ──
                  const isSel     = day.isSame(date, 'day')
                  const inSelWeek = isInSelWeek(day)
                  const isStart   = inSelWeek && (isWeekStart(day) || day.isSame(selWeekStart, 'day'))
                  const isEnd     = inSelWeek && (isWeekEnd(day) || day.isSame(selWeekStart.add(6, 'day'), 'day'))

                  return (
                    <div key={ci} style={{ position: 'relative', display: 'flex', justifyContent: 'center', alignItems: 'center', height: 38 }}>
                      {inSelWeek && !isSel && (
                        <div style={{
                          position: 'absolute', left: 0, right: 0, top: '50%', height: 34,
                          transform: 'translateY(-50%)',
                          background: colors.red.subtle,
                          borderRadius: isStart ? '10px 0 0 10px' : isEnd ? '0 10px 10px 0' : 0,
                          zIndex: 0,
                        }} />
                      )}
                      <button
                        className="calp-day"
                        onClick={() => { if (!disabled) { onSelect(day); onClose() } }}
                        disabled={disabled}
                        style={{
                          position: 'relative', zIndex: 1,
                          background: isSel ? colors.red.gradient : 'transparent',
                          color: isSel ? '#fff'
                            : disabled ? 'rgba(0,0,0,0.18)'
                            : isTodayD ? colors.red.DEFAULT
                            : isOtherMonth ? 'rgba(0,0,0,0.2)'
                            : colors.gray[900],
                          fontWeight: isSel || isTodayD ? 700 : 500,
                          boxShadow: isSel ? `0 4px 12px ${colors.red.glow}` : 'none',
                          cursor: disabled ? 'not-allowed' : 'pointer',
                        }}
                      >
                        {day.date()}
                        {isTodayD && !isSel && (
                          <div style={{ position: 'absolute', bottom: 4, left: '50%', transform: 'translateX(-50%)', width: 4, height: 4, borderRadius: '50%', background: colors.red.DEFAULT }} />
                        )}
                      </button>
                    </div>
                  )
                })}
              </div>
            )
          })}
        </div>

        {/* Rodapé de opções: range = atalhos; dia = pular por semana */}
        {isRange ? (
          <>
            <div style={{ height: 1, background: colors.gray.border, margin: '0 14px 12px' }} />
            <div style={{ padding: '0 14px 4px' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: colors.gray.dimText, textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: 8 }}>Atalhos</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 6 }}>
                {rangeShortcuts.map(([label, fn]) => (
                  <button key={label} className="calp-jump-btn" onClick={fn}>{label}</button>
                ))}
              </div>
            </div>
          </>
        ) : showWeekJump ? (
          <>
            <div style={{ height: 1, background: colors.gray.border, margin: '0 14px 12px' }} />
            <div style={{ padding: '0 14px 4px' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: colors.gray.dimText, textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: 8 }}>Pular por semana</div>
              <div style={{ display: 'flex', gap: 6, marginBottom: 6 }}>
                {[1, 2, 3, 4, 5, 6].map(n => {
                  const target = date.add(n, 'week')
                  const dis = isDisabled(target)
                  return (
                    <button key={n} className="calp-jump-btn" disabled={dis}
                      onClick={() => { if (!dis) { onSelect(target); onClose() } }}
                      style={{ opacity: dis ? 0.35 : 1, cursor: dis ? 'not-allowed' : 'pointer' }}
                    >+{n}</button>
                  )
                })}
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                {[1, 2, 3, 4, 5, 6].map(n => {
                  const target = date.subtract(n, 'week')
                  const dis = isDisabled(target)
                  return (
                    <button key={-n} className="calp-jump-btn" disabled={dis}
                      onClick={() => { if (!dis) { onSelect(target); onClose() } }}
                      style={{ color: colors.gray.dimText, opacity: dis ? 0.35 : 1, cursor: dis ? 'not-allowed' : 'pointer' }}
                    >{'\\u2212'}{n}</button>
                  )
                })}
              </div>
            </div>
          </>
        ) : null}

        {/* Rodapé de ação */}
        {isRange ? (
          <div style={{ padding: '10px 14px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <button
              onClick={() => { setDraftStart(null); setDraftEnd(null); setHover(null) }}
              style={{ border: 'none', background: 'transparent', color: colors.gray.dimText, fontSize: 12, fontWeight: 600, cursor: 'pointer', padding: '6px 2px' }}
            >
              Limpar
            </button>
            <button
              onClick={commitRange}
              disabled={!draftStart}
              style={{
                padding: '9px 22px', borderRadius: 11, border: 'none',
                background: draftStart ? colors.red.gradient : colors.gray.borderMd,
                color: '#fff', fontSize: 13, fontWeight: 600,
                cursor: draftStart ? 'pointer' : 'not-allowed',
                boxShadow: draftStart ? `0 4px 14px ${colors.red.glow}` : 'none',
              }}
            >
              Aplicar
            </button>
          </div>
        ) : (
          <div style={{ padding: '10px 14px 14px', display: 'flex', justifyContent: 'flex-end' }}>
            <button onClick={onClose} style={{ padding: '9px 20px', borderRadius: radius.sm, border: `1px solid ${colors.gray.borderMd}`, background: 'transparent', fontSize: 13, fontWeight: 600, cursor: 'pointer', color: colors.gray[700] }}>
              Fechar
            </button>
          </div>
        )}
      </div>
    </>
  )

  return createPortal(content, document.body)
}
"""),

    'src/app/dashboard/financeiro/vendas/components/FiltersBar.tsx': ('[fatia2-range-trigger]', """'use client'
// src/app/dashboard/financeiro/vendas/components/FiltersBar.tsx
// [fatia2-range-trigger] os dois <input type="date"> viraram UM gatilho que abre
// o CalendarPicker em mode='range'. Converte dayjs -> 'YYYY-MM-DD' na borda.

import { useState, useEffect } from 'react'
import { Search, X, Calendar } from 'lucide-react'
import dayjs from 'dayjs'
import api from '@/shared/lib/apiClient'
import CalendarPicker from '@/shared/components/CalendarPicker'
import { colors, typography, radius } from '@/shared/theme'
import { SalesReportFilters, SaleReportStatus, PaymentMethod, SaleItemType } from '@/features/sales-report/types'

interface ProfLite { id: string; name: string }

interface Props {
  filters:   SalesReportFilters
  onChange:  (f: Partial<SalesReportFilters>) => void
  isMobile:  boolean
}

const STATUS_OPTS: Array<{ value: SaleReportStatus | ''; label: string }> = [
  { value: '',          label: 'Todas' },
  { value: 'CONFIRMED', label: 'Confirmadas' },
  { value: 'CANCELED',  label: 'Canceladas' },
]

const METHOD_OPTS: Array<{ value: PaymentMethod | ''; label: string }> = [
  { value: '',         label: 'Todos métodos' },
  { value: 'CASH',     label: 'Dinheiro' },
  { value: 'PIX',      label: 'PIX' },
  { value: 'CREDIT',   label: 'Crédito' },
  { value: 'DEBIT',    label: 'Débito' },
  { value: 'TRANSFER', label: 'Transferência' },
  { value: 'OTHER',    label: 'Outros' },
]
const ITEM_TYPE_OPTS: Array<{ value: SaleItemType | ''; label: string }> = [
  { value: '',        label: 'Todas categorias' },
  { value: 'SERVICE', label: 'Serviços' },
  { value: 'PRODUCT', label: 'Produtos' },
  { value: 'PACKAGE', label: 'Pacotes' },
]

export default function FiltersBar({ filters, onChange, isMobile }: Props) {
  const [professionals, setProfessionals] = useState<ProfLite[]>([])
  const [clientInput, setClientInput] = useState(filters.clientSearch ?? '')
  const [calOpen, setCalOpen] = useState(false)

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const res = await api.get('/equipe')
        const data = res.data?.data ?? res.data ?? []
        const list = Array.isArray(data) ? data : (data.professionals ?? [])
        if (!cancelled) {
          setProfessionals(list.map((p: { id: string; name: string }) => ({ id: p.id, name: p.name })))
        }
      } catch {
        if (!cancelled) setProfessionals([])
      }
    }
    load()
    return () => { cancelled = true }
  }, [])

  // Debounce client search
  useEffect(() => {
    const t = setTimeout(() => {
      if (clientInput !== (filters.clientSearch ?? '')) {
        onChange({ clientSearch: clientInput || undefined, page: 1 })
      }
    }, 400)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clientInput])

  const rangeStart = filters.dateFrom ? dayjs(filters.dateFrom) : null
  const rangeEnd   = filters.dateTo   ? dayjs(filters.dateTo)   : null
  const hasRange   = !!(filters.dateFrom || filters.dateTo)
  const rangeLabel = hasRange
    ? `${filters.dateFrom ? dayjs(filters.dateFrom).format('DD/MM/YY') : '…'} – ${filters.dateTo ? dayjs(filters.dateTo).format('DD/MM/YY') : '…'}`
    : 'Período'

  const selectStyle: React.CSSProperties = {
    padding: '8px 10px',
    borderRadius: radius.sm,
    border: `1px solid ${colors.gray.borderMd}`,
    fontSize: typography.scale.sm,
    fontFamily: typography.fontFamily,
    color: typography.color.primary,
    background: '#fff',
    outline: 'none',
    cursor: 'pointer',
    minWidth: 0,
  }

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: 8,
      marginBottom: 16,
      fontFamily: typography.fontFamily,
    }}>
      {/* Linha 1: período (range) */}
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'auto 1fr', gap: 8, alignItems: 'center' }}>
        <div style={{ position: 'relative', display: 'inline-flex' }}>
          <button
            onClick={() => setCalOpen(true)}
            style={{
              ...selectStyle,
              display: 'flex', alignItems: 'center', gap: 8,
              width: isMobile ? '100%' : 'auto',
              paddingRight: hasRange ? 30 : 12,
              color: hasRange ? typography.color.primary : colors.gray.dimText,
              fontWeight: hasRange ? 600 : 400,
              justifyContent: 'flex-start',
            }}
          >
            <Calendar size={14} color={colors.red.DEFAULT} />
            {rangeLabel}
          </button>
          {hasRange && (
            <button
              onClick={e => { e.stopPropagation(); onChange({ dateFrom: undefined, dateTo: undefined, page: 1 }) }}
              style={{
                position: 'absolute', right: 6, top: '50%', transform: 'translateY(-50%)',
                background: 'transparent', border: 'none', cursor: 'pointer', padding: 2, display: 'flex',
              }}
              aria-label="Limpar período"
            >
              <X size={13} color={colors.gray.dimText} />
            </button>
          )}
        </div>
        {!isMobile && <div />}
      </div>

      {/* Linha 2: selects + busca cliente */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? '1fr 1fr' : 'auto auto auto auto 1fr',
        gap: 8,
        alignItems: 'center',
      }}>
        <select
          value={filters.status ?? ''}
          onChange={e => onChange({ status: (e.target.value || undefined) as SaleReportStatus | undefined, page: 1 })}
          style={selectStyle}
        >
          {STATUS_OPTS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>

        <select
          value={filters.method ?? ''}
          onChange={e => onChange({ method: (e.target.value || undefined) as PaymentMethod | undefined, page: 1 })}
          style={selectStyle}
        >
          {METHOD_OPTS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <select
          value={filters.itemType ?? ''}
          onChange={e => onChange({ itemType: (e.target.value || undefined) as SaleItemType | undefined, page: 1 })}
          style={selectStyle}
        >
          {ITEM_TYPE_OPTS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>

        <select
          value={filters.professionalId ?? ''}
          onChange={e => onChange({ professionalId: e.target.value || undefined, page: 1 })}
          style={selectStyle}
        >
          <option value="">Todos profissionais</option>
          {professionals.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>

        {/* Busca cliente */}
        <div style={{
          position: 'relative',
          gridColumn: isMobile ? '1 / -1' : 'auto',
        }}>
          <Search
            size={13}
            color={colors.gray.dimText}
            style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)' }}
          />
          <input
            type="text"
            value={clientInput}
            onChange={e => setClientInput(e.target.value)}
            placeholder="Buscar cliente..."
            style={{
              ...selectStyle,
              width: '100%',
              boxSizing: 'border-box',
              paddingLeft: 28,
              paddingRight: clientInput ? 28 : 10,
              cursor: 'text',
            }}
          />
          {clientInput && (
            <button
              onClick={() => setClientInput('')}
              style={{
                position: 'absolute', right: 6, top: '50%', transform: 'translateY(-50%)',
                background: 'transparent', border: 'none', cursor: 'pointer',
                padding: 2, display: 'flex',
              }}
            >
              <X size={13} color={colors.gray.dimText} />
            </button>
          )}
        </div>
      </div>

      {calOpen && (
        <CalendarPicker
          mode="range"
          date={rangeStart ?? dayjs()}
          rangeStart={rangeStart}
          rangeEnd={rangeEnd}
          isMobile={isMobile}
          onSelect={() => {}}
          onClose={() => setCalOpen(false)}
          onApplyRange={(start, end) => {
            onChange({ dateFrom: start.format('YYYY-MM-DD'), dateTo: end.format('YYYY-MM-DD'), page: 1 })
            setCalOpen(false)
          }}
        />
      )}
    </div>
  )
}
"""),
}

def main():
    ts = datetime.datetime.now().strftime('%Y%m%d-%H%M%S')
    bdir = os.path.join('.backup', ts)
    for target, (marker, new) in FILES.items():
        if not os.path.isfile(target):
            print(f'False  arquivo nao encontrado: {target}')
            continue
        cur = open(target, encoding='utf-8').read()
        if marker in cur:
            print(f'True   ja aplicado (idempotente): {target}')
            continue
        os.makedirs(bdir, exist_ok=True)
        bpath = os.path.join(bdir, os.path.basename(target))
        shutil.copy2(target, bpath)
        print(f'backup -> {bpath}')
        with open(target, 'w', encoding='utf-8') as f:
            f.write(new)
        ok = (open(target, encoding='utf-8').read() == new) and (marker in new)
        print(f'{ok}   escrito: {target}')

main()
