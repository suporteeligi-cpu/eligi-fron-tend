#!/usr/bin/env python3
# -*- coding: utf-8 -*-
# eligi-codeflow / Fatia 3 — modo 'month' no CalendarPicker + gatilhos em Relatorios e Despesas.
# Rode na raiz do front-end: python3 patch_calendar_fatia3.py
# CalendarPicker: reescrita completa (day/range intactos + novo early-return month).
# ReportsModule e despesas: patch por ancora (str.replace, 1 match), backup + True/False.

import os, sys, shutil, datetime

# ─────────────────────────────────────────────────────────────────────────────
# 1) CalendarPicker.tsx — arquivo completo (marker [fatia3-month])
# ─────────────────────────────────────────────────────────────────────────────
CAL_MARKER = '[fatia3-month]'
CAL_TARGET = 'src/shared/components/CalendarPicker.tsx'
CAL_NEW = """'use client'
// src/shared/components/CalendarPicker.tsx
// Calendário eligi COMPARTILHADO — dia (Agenda/Caixa/Pacotes) + range (Financeiro/Vendas) + month (Relatorios/Despesas).
// [fatia1-grid7-alinhado] header e grade dividem o MESMO grid repeat(7,1fr).
// [fatia2-range] mode='range': 2 cliques pintam de–até, atalhos, Aplicar commita.
// [fatia3-month] mode='month': grade 3x4 de meses + navegacao de ano; seleção única (clica = aplica e fecha).
// Retrocompatível: mode default 'day'.

import { useState } from 'react'
import { createPortal } from 'react-dom'
import dayjs from 'dayjs'
import 'dayjs/locale/pt-br'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { colors, transitions, radius, typography, shadows } from '@/shared/theme'

dayjs.locale('pt-br')

const DAYS_HEADER  = ['SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB', 'DOM']
const MONTHS_PT    = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro']
const MONTHS_SHORT = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']

const EASE_SPRING = 'cubic-bezier(0.34,1.56,0.64,1)'
const EASE_SHEET  = 'cubic-bezier(0.34,1.2,0.64,1)'

interface Props {
  date:      dayjs.Dayjs
  onSelect:  (d: dayjs.Dayjs) => void
  onClose:   () => void
  isMobile:  boolean
  maxDate?:  dayjs.Dayjs   // (dia/range) bloqueia dias após esta data
  minDate?:  dayjs.Dayjs   // (dia/range) bloqueia dias antes desta data
  showWeekJump?: boolean   // (dia) mostra "pular por semana" (default: true)
  mode?:         'day' | 'range' | 'month'   // default 'day'
  rangeStart?:   dayjs.Dayjs | null           // (range) valor inicial
  rangeEnd?:     dayjs.Dayjs | null
  onApplyRange?: (start: dayjs.Dayjs, end: dayjs.Dayjs) => void  // (range) commit
  monthValue?:   string                        // (month) 'YYYY-MM'
  onSelectMonth?: (m: string) => void          // (month) commit — clica = aplica e fecha
  maxMonth?:     string                        // (month) 'YYYY-MM' — bloqueia meses depois deste
}

export default function CalendarPicker({
  date, onSelect, onClose, isMobile, maxDate, minDate, showWeekJump = true,
  mode = 'day', rangeStart = null, rangeEnd = null, onApplyRange,
  monthValue, onSelectMonth, maxMonth,
}: Props) {
  const isRange = mode === 'range'
  const isMonth = mode === 'month'
  const today = dayjs()

  const [viewMonth, setViewMonth] = useState(() => ((isRange ? (rangeStart ?? date) : date)).startOf('month'))
  const [draftStart, setDraftStart] = useState<dayjs.Dayjs | null>(() => rangeStart)
  const [draftEnd,   setDraftEnd]   = useState<dayjs.Dayjs | null>(() => rangeEnd)
  const [hover,      setHover]      = useState<dayjs.Dayjs | null>(null)
  const [viewYear,   setViewYear]   = useState<number>(() =>
    isMonth && monthValue ? Number(monthValue.slice(0, 4)) : today.year())

  const glass = {
    background: 'rgba(255,255,255,0.82)',
    backdropFilter: 'blur(24px) saturate(160%)',
    WebkitBackdropFilter: 'blur(24px) saturate(160%)',
    border: '1px solid rgba(255,255,255,0.9)',
  } as const

  const calW = isMobile
    ? Math.min(340, (typeof window !== 'undefined' ? window.innerWidth - 32 : 320))
    : 320

  if (typeof document === 'undefined') return null

  function shellStyle(): React.CSSProperties {
    return isMobile ? {
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
    }
  }

  const styleBlock = (
    <style>{`
      @keyframes calIn{from{opacity:0; transform:translate(-50%,-50%) scale(0.93)} to{opacity:1; transform:translate(-50%,-50%) scale(1)}}
      @keyframes calUp{from{transform:translateY(100%)} to{transform:translateY(0)}}
      .calp-day{display:flex; align-items:center; justify-content:center; width:34px; height:34px; border-radius:10px; cursor:pointer; font-size:13px; font-weight:500; font-variant-numeric:tabular-nums; transition:all 0.14s ${EASE_SPRING}; border:none; background:transparent; -webkit-tap-highlight-color:transparent}
      .calp-day:active{transform:scale(0.9)}
      .calp-jump-btn{flex:1; box-sizing:border-box; padding:9px 0; border:1px solid ${colors.gray.borderMd}; border-radius:10px; background:${colors.background.surface}; font-size:12px; font-weight:600; cursor:pointer; color:${colors.gray[700]}; transition:all 0.14s ${EASE_SPRING}; -webkit-tap-highlight-color:transparent}
      .calp-jump-btn:hover{border-color:${colors.red.borderHover}; color:${colors.red.DEFAULT}; background:${colors.red.subtle}; transform:translateY(-1px)}
      .calp-jump-btn:active{transform:scale(0.94)}
      .calp-mo{height:52px; display:flex; align-items:center; justify-content:center; border-radius:12px; font-size:14px; font-weight:600; cursor:pointer; border:1px solid transparent; background:transparent; color:${colors.gray[900]}; transition:all 0.14s ${EASE_SPRING}; -webkit-tap-highlight-color:transparent}
      .calp-mo:active:not(:disabled){transform:scale(0.94)}
      .calp-mo:disabled{color:rgba(0,0,0,0.20); cursor:not-allowed}
    `}</style>
  )

  const grabber = isMobile ? (
    <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0 2px' }}>
      <div style={{ width: 40, height: 4, borderRadius: 2, background: 'rgba(0,0,0,0.12)' }} />
    </div>
  ) : null

  const navBtnStyle: React.CSSProperties = {
    width: 34, height: 34, borderRadius: '50%', border: `1px solid ${colors.gray.borderMd}`,
    background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: transitions.fast,
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // [fatia3-month] MODO MÊS — early return isolado (não toca day/range)
  // ═══════════════════════════════════════════════════════════════════════════
  if (isMonth) {
    const selYear  = monthValue ? Number(monthValue.slice(0, 4)) : null
    const selMonth = monthValue ? Number(monthValue.slice(5, 7)) - 1 : null
    const nowY = today.year()
    const nowM = today.month()
    const maxY = maxMonth ? Number(maxMonth.slice(0, 4)) : null
    const maxM = maxMonth ? Number(maxMonth.slice(5, 7)) - 1 : null
    const nextYearBlocked = maxY !== null && viewYear >= maxY

    const monthContent = (
      <>
        <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.22)', backdropFilter: 'blur(6px)', zIndex: 10998 }} />
        <div style={shellStyle()}>
          {styleBlock}
          {grabber}

          {/* Header navegação de ano */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px 12px' }}>
            <button onClick={() => setViewYear(y => y - 1)} style={navBtnStyle} aria-label="Ano anterior"
              onMouseEnter={e => { e.currentTarget.style.background = colors.red.subtle; e.currentTarget.style.borderColor = colors.red.border }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = colors.gray.borderMd }}
            >
              <ChevronLeft size={16} color={colors.gray[700]} strokeWidth={2.5} />
            </button>
            <div style={{ fontSize: 17, fontWeight: 700, color: colors.gray[900], letterSpacing: '0.3px' }}>{viewYear}</div>
            <button onClick={() => { if (!nextYearBlocked) setViewYear(y => y + 1) }} disabled={nextYearBlocked}
              style={{ ...navBtnStyle, opacity: nextYearBlocked ? 0.3 : 1, cursor: nextYearBlocked ? 'not-allowed' : 'pointer' }} aria-label="Próximo ano"
              onMouseEnter={e => { if (!nextYearBlocked) { e.currentTarget.style.background = colors.red.subtle; e.currentTarget.style.borderColor = colors.red.border } }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = colors.gray.borderMd }}
            >
              <ChevronRight size={16} color={colors.gray[700]} strokeWidth={2.5} />
            </button>
          </div>

          {/* Grade 3x4 de meses */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8, padding: '0 16px 8px' }}>
            {MONTHS_SHORT.map((name, i) => {
              const isSel = selYear === viewYear && selMonth === i
              const isNow = nowY === viewYear && nowM === i
              const blocked = maxY !== null && maxM !== null && (viewYear > maxY || (viewYear === maxY && i > maxM))
              return (
                <button
                  key={name}
                  className="calp-mo"
                  disabled={blocked}
                  onClick={() => { if (!blocked) { onSelectMonth?.(`${viewYear}-${String(i + 1).padStart(2, '0')}`); onClose() } }}
                  style={{
                    background: isSel ? colors.red.gradient : 'transparent',
                    color: isSel ? '#fff' : isNow ? colors.red.DEFAULT : undefined,
                    fontWeight: isSel || isNow ? 700 : 600,
                    boxShadow: isSel ? `0 5px 14px ${colors.red.glow}`
                      : isNow ? `inset 0 0 0 1.5px ${colors.red.DEFAULT}`
                      : 'none',
                  }}
                >
                  {name}
                </button>
              )
            })}
          </div>

          {/* Fechar */}
          <div style={{ padding: '12px 16px 14px', display: 'flex', justifyContent: 'flex-end' }}>
            <button onClick={onClose} style={{ padding: '9px 20px', borderRadius: radius.sm, border: `1px solid ${colors.gray.borderMd}`, background: 'transparent', fontSize: 13, fontWeight: 600, cursor: 'pointer', color: colors.gray[700] }}>
              Fechar
            </button>
          </div>
        </div>
      </>
    )
    return createPortal(monthContent, document.body)
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // MODO DIA / RANGE
  // ═══════════════════════════════════════════════════════════════════════════
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
    else { setDraftStart(day) }
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

  const content = (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.22)', backdropFilter: 'blur(6px)', zIndex: 10998 }} />

      <div style={shellStyle()}>
        {styleBlock}
        {grabber}

        {/* Header navegação de mês */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px 10px' }}>
          <button onClick={() => setViewMonth(v => v.subtract(1, 'month'))} style={navBtnStyle} aria-label="Mês anterior"
            onMouseEnter={e => { e.currentTarget.style.background = colors.red.subtle; e.currentTarget.style.borderColor = colors.red.border }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = colors.gray.borderMd }}
          >
            <ChevronLeft size={16} color={colors.gray[700]} strokeWidth={2.5} />
          </button>

          {isRange ? (
            <div style={{ fontSize: 16, fontWeight: 700, color: colors.gray[900], letterSpacing: '-0.3px', padding: '4px 8px' }}>
              {MONTHS_PT[viewMonth.month()]} {viewMonth.year()}
            </div>
          ) : (
            <button
              onClick={() => { if (isDisabled(today)) return; setViewMonth(today.startOf('month')); onSelect(today); onClose() }}
              style={{ fontSize: 16, fontWeight: 700, color: colors.gray[900], background: 'none', border: 'none', cursor: 'pointer', letterSpacing: '-0.3px', padding: '4px 8px', borderRadius: 8, transition: transitions.fast }}
              onMouseEnter={e => { e.currentTarget.style.color = colors.red.DEFAULT }}
              onMouseLeave={e => { e.currentTarget.style.color = colors.gray[900] }}
            >
              {MONTHS_PT[viewMonth.month()]} {viewMonth.year()}
            </button>
          )}

          <button onClick={() => setViewMonth(v => v.add(1, 'month'))} style={navBtnStyle} aria-label="Próximo mês"
            onMouseEnter={e => { e.currentTarget.style.background = colors.red.subtle; e.currentTarget.style.borderColor = colors.red.border }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = colors.gray.borderMd }}
          >
            <ChevronRight size={16} color={colors.gray[700]} strokeWidth={2.5} />
          </button>
        </div>

        {/* Cabeçalho dias da semana */}
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

                  if (isRange) {
                    const inR    = !!pb && !day.isBefore(pb[0], 'day') && !day.isAfter(pb[1], 'day')
                    const isLo   = !!pb && day.isSame(pb[0], 'day')
                    const isHi   = !!pb && day.isSame(pb[1], 'day')
                    const single = !!pb && pb[0].isSame(pb[1], 'day')
                    const edge   = (isLo || isHi)

                    return (
                      <div key={ci} style={{ position: 'relative', display: 'flex', justifyContent: 'center', alignItems: 'center', height: 38 }}>
                        {inR && !single && (
                          <div style={{ position: 'absolute', left: 0, right: 0, top: '50%', height: 34, transform: 'translateY(-50%)', background: colors.red.subtle, borderRadius: isLo ? '10px 0 0 10px' : isHi ? '0 10px 10px 0' : 0, zIndex: 0 }} />
                        )}
                        <button className="calp-day" onClick={() => clickRange(day)} onMouseEnter={() => { if (draftStart && !draftEnd) setHover(day) }} disabled={disabled}
                          style={{ position: 'relative', zIndex: 1, background: edge ? colors.red.gradient : 'transparent', color: edge ? '#fff' : disabled ? 'rgba(0,0,0,0.18)' : isOtherMonth ? 'rgba(0,0,0,0.2)' : colors.gray[900], fontWeight: edge ? 700 : 500, boxShadow: edge ? `0 4px 12px ${colors.red.glow}` : 'none', cursor: disabled ? 'not-allowed' : 'pointer' }}
                        >
                          {day.date()}
                          {isTodayD && !edge && (
                            <div style={{ position: 'absolute', inset: 0, borderRadius: 10, boxShadow: `inset 0 0 0 1.5px ${colors.red.DEFAULT}`, pointerEvents: 'none' }} />
                          )}
                        </button>
                      </div>
                    )
                  }

                  const isSel     = day.isSame(date, 'day')
                  const inSelWeek = isInSelWeek(day)
                  const isStart   = inSelWeek && (isWeekStart(day) || day.isSame(selWeekStart, 'day'))
                  const isEnd     = inSelWeek && (isWeekEnd(day) || day.isSame(selWeekStart.add(6, 'day'), 'day'))

                  return (
                    <div key={ci} style={{ position: 'relative', display: 'flex', justifyContent: 'center', alignItems: 'center', height: 38 }}>
                      {inSelWeek && !isSel && (
                        <div style={{ position: 'absolute', left: 0, right: 0, top: '50%', height: 34, transform: 'translateY(-50%)', background: colors.red.subtle, borderRadius: isStart ? '10px 0 0 10px' : isEnd ? '0 10px 10px 0' : 0, zIndex: 0 }} />
                      )}
                      <button className="calp-day" onClick={() => { if (!disabled) { onSelect(day); onClose() } }} disabled={disabled}
                        style={{ position: 'relative', zIndex: 1, background: isSel ? colors.red.gradient : 'transparent', color: isSel ? '#fff' : disabled ? 'rgba(0,0,0,0.18)' : isTodayD ? colors.red.DEFAULT : isOtherMonth ? 'rgba(0,0,0,0.2)' : colors.gray[900], fontWeight: isSel || isTodayD ? 700 : 500, boxShadow: isSel ? `0 4px 12px ${colors.red.glow}` : 'none', cursor: disabled ? 'not-allowed' : 'pointer' }}
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

        {/* Rodapé de opções */}
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
                    <button key={n} className="calp-jump-btn" disabled={dis} onClick={() => { if (!dis) { onSelect(target); onClose() } }} style={{ opacity: dis ? 0.35 : 1, cursor: dis ? 'not-allowed' : 'pointer' }}>+{n}</button>
                  )
                })}
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                {[1, 2, 3, 4, 5, 6].map(n => {
                  const target = date.subtract(n, 'week')
                  const dis = isDisabled(target)
                  return (
                    <button key={-n} className="calp-jump-btn" disabled={dis} onClick={() => { if (!dis) { onSelect(target); onClose() } }} style={{ color: colors.gray.dimText, opacity: dis ? 0.35 : 1, cursor: dis ? 'not-allowed' : 'pointer' }}>{'\\u2212'}{n}</button>
                  )
                })}
              </div>
            </div>
          </>
        ) : null}

        {/* Rodapé de ação */}
        {isRange ? (
          <div style={{ padding: '10px 14px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <button onClick={() => { setDraftStart(null); setDraftEnd(null); setHover(null) }} style={{ border: 'none', background: 'transparent', color: colors.gray.dimText, fontSize: 12, fontWeight: 600, cursor: 'pointer', padding: '6px 2px' }}>Limpar</button>
            <button onClick={commitRange} disabled={!draftStart} style={{ padding: '9px 22px', borderRadius: 11, border: 'none', background: draftStart ? colors.red.gradient : colors.gray.borderMd, color: '#fff', fontSize: 13, fontWeight: 600, cursor: draftStart ? 'pointer' : 'not-allowed', boxShadow: draftStart ? `0 4px 14px ${colors.red.glow}` : 'none' }}>Aplicar</button>
          </div>
        ) : (
          <div style={{ padding: '10px 14px 14px', display: 'flex', justifyContent: 'flex-end' }}>
            <button onClick={onClose} style={{ padding: '9px 20px', borderRadius: radius.sm, border: `1px solid ${colors.gray.borderMd}`, background: 'transparent', fontSize: 13, fontWeight: 600, cursor: 'pointer', color: colors.gray[700] }}>Fechar</button>
          </div>
        )}
      </div>
    </>
  )

  return createPortal(content, document.body)
}
"""

# ─────────────────────────────────────────────────────────────────────────────
# 2) ReportsModule.tsx — liga o gatilho no label (ancoras)
# ─────────────────────────────────────────────────────────────────────────────
RM_TARGET = 'src/features/reports/components/ReportsModule.tsx'
RM_MARKER = '[fatia3-month-trigger]'

RM_IMPORT_ANCHOR = "import { ChevronLeft, ChevronRight } from 'lucide-react'\n"
RM_IMPORT_NEW = ("import { ChevronLeft, ChevronRight } from 'lucide-react'\n"
                 "import CalendarPicker from '@/shared/components/CalendarPicker'  // [fatia3-month-trigger]\n")

RM_STATE_ANCHOR = "  const [period, setPeriod] = useState<string>(CURRENT)\n"
RM_STATE_NEW = ("  const [period, setPeriod] = useState<string>(CURRENT)\n"
                "  const [monthOpen, setMonthOpen] = useState(false)\n")

RM_LABEL_ANCHOR = """          <div
            style={{
              minWidth: 116, textAlign: 'center', fontSize: 14, fontWeight: 600,
              color: '#0c0c12', border: '0.5px solid rgba(0,0,0,0.12)',
              borderRadius: 10, padding: '8px 14px', background: 'rgba(255,255,255,0.7)',
            }}
          >
            {label}
          </div>"""
RM_LABEL_NEW = """          <button
            type="button"
            onClick={() => setMonthOpen(true)}
            style={{
              minWidth: 116, textAlign: 'center', fontSize: 14, fontWeight: 600,
              color: '#0c0c12', border: '0.5px solid rgba(0,0,0,0.12)',
              borderRadius: 10, padding: '8px 14px', background: 'rgba(255,255,255,0.7)',
              cursor: 'pointer',
            }}
          >
            {label}
          </button>
          {monthOpen && (
            <CalendarPicker
              mode="month"
              date={dayjs(`${period}-01`)}
              isMobile={false}
              monthValue={period}
              maxMonth={CURRENT}
              onSelect={() => {}}
              onClose={() => setMonthOpen(false)}
              onSelectMonth={(m) => { setPeriod(m); setMonthOpen(false) }}
            />
          )}"""

# ─────────────────────────────────────────────────────────────────────────────
# 3) despesas/page.tsx — liga o gatilho no span do monthLabel (ancoras)
# ─────────────────────────────────────────────────────────────────────────────
DP_TARGET = 'src/app/dashboard/financeiro/despesas/page.tsx'
DP_MARKER = '[fatia3-month-trigger]'

DP_IMPORT_ANCHOR = "import { typography } from '@/shared/theme'\n"
DP_IMPORT_NEW = ("import { typography } from '@/shared/theme'\n"
                 "import CalendarPicker from '@/shared/components/CalendarPicker'  // [fatia3-month-trigger]\n")

DP_STATE_ANCHOR = "  const [selectedCategory, setSelectedCategory] = useState<ExpenseCategory | ''>('')\n"
DP_STATE_NEW = ("  const [selectedCategory, setSelectedCategory] = useState<ExpenseCategory | ''>('')\n"
                "  const [monthOpen, setMonthOpen] = useState(false)\n")

DP_SPAN_ANCHOR = """            <span style={{
              fontSize:      13,
              fontWeight:    600,
              color:         typography.color.primary,
              padding:       '0 8px',
              minWidth:      isMobile ? 118 : 148,
              textAlign:     'center',
              textTransform: 'capitalize',
            }}>
              {monthLabel}
              {isCurrentMonth && (
                <span style={{
                  fontSize:     10,
                  fontWeight:   600,
                  color:        '#dc2626',
                  marginLeft:   6,
                  background:   'rgba(220,38,38,0.1)',
                  padding:      '1px 6px',
                  borderRadius: 10,
                }}>
                  atual
                </span>
              )}
            </span>"""
DP_SPAN_NEW = """            <button
              onClick={() => setMonthOpen(true)}
              style={{
                fontSize:      13,
                fontWeight:    600,
                color:         typography.color.primary,
                padding:       '0 8px',
                minWidth:      isMobile ? 118 : 148,
                textAlign:     'center',
                textTransform: 'capitalize',
                background:    'transparent',
                border:        'none',
                cursor:        'pointer',
                lineHeight:    'inherit',
              }}
            >
              {monthLabel}
              {isCurrentMonth && (
                <span style={{
                  fontSize:     10,
                  fontWeight:   600,
                  color:        '#dc2626',
                  marginLeft:   6,
                  background:   'rgba(220,38,38,0.1)',
                  padding:      '1px 6px',
                  borderRadius: 10,
                }}>
                  atual
                </span>
              )}
            </button>"""

DP_PICKER_ANCHOR = "      {/* ── Modal criar/editar ─────────────────────────────────────────── */}\n"
DP_PICKER_NEW = ("      {monthOpen && (\n"
                 "        <CalendarPicker\n"
                 "          mode=\"month\"\n"
                 "          date={dayjs(`${currentMonth}-01`)}\n"
                 "          isMobile={isMobile}\n"
                 "          monthValue={currentMonth}\n"
                 "          maxMonth={dayjs().format('YYYY-MM')}\n"
                 "          onSelect={() => {}}\n"
                 "          onClose={() => setMonthOpen(false)}\n"
                 "          onSelectMonth={(m) => { setCurrentMonth(m); setMonthOpen(false) }}\n"
                 "        />\n"
                 "      )}\n\n"
                 "      {/* ── Modal criar/editar ─────────────────────────────────────────── */}\n")

# ─────────────────────────────────────────────────────────────────────────────
def backup(target, bdir):
    os.makedirs(bdir, exist_ok=True)
    bpath = os.path.join(bdir, os.path.basename(target))
    shutil.copy2(target, bpath)
    print(f'backup -> {bpath}')

def write_full(target, marker, new, bdir):
    if not os.path.isfile(target):
        print(f'False  ausente: {target}'); return
    cur = open(target, encoding='utf-8').read()
    if marker in cur:
        print(f'True   ja aplicado: {target}'); return
    backup(target, bdir)
    with open(target, 'w', encoding='utf-8') as f: f.write(new)
    ok = (open(target, encoding='utf-8').read() == new) and (marker in new)
    print(f'{ok}   escrito: {target}')

def patch_anchors(target, marker, edits, bdir):
    if not os.path.isfile(target):
        print(f'False  ausente: {target}'); return
    cur = open(target, encoding='utf-8').read()
    if marker in cur:
        print(f'True   ja aplicado: {target}'); return
    # valida todas as ancoras (exatamente 1 match) ANTES de escrever
    for anchor, _ in edits:
        n = cur.count(anchor)
        if n != 1:
            print(f'False  ancora {n}x (esperado 1) em {target} — abortado, nada escrito')
            print(f'       >> {anchor.splitlines()[0][:70]}')
            return
    backup(target, bdir)
    for anchor, repl in edits:
        cur = cur.replace(anchor, repl, 1)
    with open(target, 'w', encoding='utf-8') as f: f.write(cur)
    ok = marker in open(target, encoding='utf-8').read()
    print(f'{ok}   patched: {target}')

def main():
    ts = datetime.datetime.now().strftime('%Y%m%d-%H%M%S')
    bdir = os.path.join('.backup', ts)

    write_full(CAL_TARGET, CAL_MARKER, CAL_NEW, bdir)

    patch_anchors(RM_TARGET, RM_MARKER, [
        (RM_IMPORT_ANCHOR, RM_IMPORT_NEW),
        (RM_STATE_ANCHOR,  RM_STATE_NEW),
        (RM_LABEL_ANCHOR,  RM_LABEL_NEW),
    ], bdir)

    patch_anchors(DP_TARGET, DP_MARKER, [
        (DP_IMPORT_ANCHOR, DP_IMPORT_NEW),
        (DP_STATE_ANCHOR,  DP_STATE_NEW),
        (DP_SPAN_ANCHOR,   DP_SPAN_NEW),
        (DP_PICKER_ANCHOR, DP_PICKER_NEW),
    ], bdir)

main()
