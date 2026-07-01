#!/usr/bin/env python3
# -*- coding: utf-8 -*-
# eligi-codeflow / Fatia 1 — CalendarPicker (modo dia): alinhamento + Denso Preciso + glass.
# Rode na raiz do front-end:  python3 patch_calendar_fatia1.py
# Read/write so no arquivo alvo. Backup automatico em .backup/<ts>/. Idempotente.

import os, sys, shutil, datetime

TARGET = sys.argv[1] if len(sys.argv) > 1 else 'src/shared/components/CalendarPicker.tsx'
MARKER = '[fatia1-grid7-alinhado]'

NEW = """'use client'
// src/shared/components/CalendarPicker.tsx
// Calendário eligi COMPARTILHADO (Agenda, Caixa, Pacotes) — modo dia.
// [fatia1-grid7-alinhado] Header e grade dividem o MESMO grid repeat(7,1fr).
// Coluna de número da semana REMOVIDA (era a causa do desalinhamento: no header
// entrava dentro das 7 colunas empurrando DOM pra fora; na grade ficava fora).
// Visual: Denso Preciso (célula arredondada 10px + tabular-nums) + glass.
// Props: maxDate/minDate opcionais bloqueiam dias fora do range.

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
const EASE_SMOOTH = 'cubic-bezier(0.4,0,0.2,1)'

interface Props {
  date:      dayjs.Dayjs
  onSelect:  (d: dayjs.Dayjs) => void
  onClose:   () => void
  isMobile:  boolean
  maxDate?:  dayjs.Dayjs   // bloqueia dias após esta data
  minDate?:  dayjs.Dayjs   // bloqueia dias antes desta data
  showWeekJump?: boolean   // mostra "pular por semana" (default: true)
}

export default function CalendarPicker({
  date, onSelect, onClose, isMobile, maxDate, minDate, showWeekJump = true,
}: Props) {
  const today = dayjs()
  const [viewMonth, setViewMonth] = useState(() => date.startOf('month'))

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
          .calp-day:hover:not(:disabled){background:rgba(0,0,0,0.05)}
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

        {/* Cabeçalho dias da semana — MESMO grid da grade (7 col, mesmo padding lateral) */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', padding: '0 14px', marginBottom: 6 }}>
          {DAYS_HEADER.map(d => (
            <div key={d} style={{ textAlign: 'center', fontSize: 10, fontWeight: 700, color: colors.gray.dimText, letterSpacing: '.06em', padding: '4px 0' }}>{d}</div>
          ))}
        </div>

        {/* Grade */}
        <div style={{ padding: '0 14px 12px' }}>
          {Array.from({ length: grid.length / 7 }, (_, row) => {
            const week = grid.slice(row * 7, row * 7 + 7)
            return (
              <div key={row} style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', marginBottom: 2 }}>
                {week.map((day, ci) => {
                  if (!day) return <div key={ci} />
                  const isSel     = day.isSame(date, 'day')
                  const isTodayD  = day.isSame(today, 'day')
                  const inSelWeek = isInSelWeek(day)
                  const isStart   = inSelWeek && (isWeekStart(day) || day.isSame(selWeekStart, 'day'))
                  const isEnd     = inSelWeek && (isWeekEnd(day) || day.isSame(selWeekStart.add(6, 'day'), 'day'))
                  const isOtherMonth = day.month() !== viewMonth.month()
                  const disabled  = isDisabled(day)

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

        {/* Pular por semana (opcional) */}
        {showWeekJump && (
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
        )}

        {/* Fechar */}
        <div style={{ padding: '10px 14px 14px', display: 'flex', justifyContent: 'flex-end' }}>
          <button onClick={onClose} style={{ padding: '9px 20px', borderRadius: radius.sm, border: `1px solid ${colors.gray.borderMd}`, background: 'transparent', fontSize: 13, fontWeight: 600, cursor: 'pointer', color: colors.gray[700] }}>
            Fechar
          </button>
        </div>
      </div>
    </>
  )

  return createPortal(content, document.body)
}
"""

def main():
    if not os.path.isfile(TARGET):
        print(f'False  arquivo nao encontrado: {TARGET}')
        print('       rode na raiz do front-end, ou passe o caminho como argumento.')
        sys.exit(1)
    cur = open(TARGET, encoding='utf-8').read()
    if MARKER in cur:
        print(f'True   ja aplicado (idempotente): {TARGET}')
        return
    ts = datetime.datetime.now().strftime('%Y%m%d-%H%M%S')
    bdir = os.path.join('.backup', ts)
    os.makedirs(bdir, exist_ok=True)
    bpath = os.path.join(bdir, 'CalendarPicker.tsx')
    shutil.copy2(TARGET, bpath)
    print(f'backup -> {bpath}')
    with open(TARGET, 'w', encoding='utf-8') as f:
        f.write(NEW)
    ok = (open(TARGET, encoding='utf-8').read() == NEW) and (MARKER in NEW)
    print(f'{ok}   escrito: {TARGET}')

main()
