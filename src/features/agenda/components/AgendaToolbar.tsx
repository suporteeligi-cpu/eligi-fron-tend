'use client'
// src/features/agenda/components/AgendaToolbar.tsx
// @eligi:agenda-regua (out/2026) — direção C "Régua" de 3 mockups.
// Régua contínua de dias: desliza com o dedo, trava no centro e, ao parar,
// seleciona o dia do meio (como o seletor do iPhone). O dia selecionado é uma
// pastilha GRAFITE larga (com o mês); o vermelho fica só no "+ Novo".
// Tocar no dia já selecionado abre o CalendarPicker compartilhado (calendário da direção B).
// "Hoje" só aparece quando o dia escolhido não é hoje, apontando o lado de hoje.
// Virada de mês marcada na própria régua.

import { useRef, useEffect, useLayoutEffect, useCallback, useState } from 'react'
import dayjs from 'dayjs'
import 'dayjs/locale/pt-br'
import { ChevronLeft, ChevronRight, Plus, Ban } from 'lucide-react'

import { colors, typography, glass } from '@/shared/theme'
import { brand } from '@/shared/brand.generated'
import { useAgendaStore } from '../hooks/useAgendaStore'
import { useDeviceMode }  from '../hooks/useDeviceMode'
import { AgendaProfessional } from '../types'
import CalendarPicker from '@/shared/components/CalendarPicker'

dayjs.locale('pt-br')

const DAYS_PT   = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
const DAYS_LONG = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado']
const MONTHS_ABBR = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez']
const MONTHS_LONG = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro']

const INK  = brand.surfaceLight.ink
const INK2 = brand.surfaceLight.ink2
const INK3 = brand.surfaceLight.ink3
const SOFT = '#f0f0f3'
const LINE = 'rgba(17,17,20,0.14)'

// Janela da régua: 4 semanas antes da semana do dia escolhido + 9 semanas depois.
// Ancorada na SEGUNDA da semana: só muda quando o dia escolhido troca de semana.
const WEEKS_BEFORE = 4
const WINDOW_DAYS  = 13 * 7
const SETTLE_MS    = 140

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
  const selKey   = selected.format('YYYY-MM-DD')

  const [showCal, setShowCal] = useState(false)

  const scrollerRef  = useRef<HTMLDivElement>(null)
  const prevKeyRef   = useRef<string | null>(null)
  const userScrollRef = useRef(false)          // rolagem iniciada pelo dedo/roda
  const settleRef    = useRef<number | null>(null)

  const weekMonday  = selected.subtract((selected.day() + 6) % 7, 'day')
  const windowStart = weekMonday.subtract(WEEKS_BEFORE, 'week')
  const days = Array.from({ length: WINDOW_DAYS }, (_, i) => windowStart.add(i, 'day'))

  // Centraliza o dia escolhido. Se o dia anterior ainda está na régua, primeiro
  // coloca ELE no centro (sem animação) e depois desliza até o novo: a janela pode
  // ter sido reancorada, e assim nada "pula" na tela.
  useLayoutEffect(() => {
    const sc = scrollerRef.current
    if (!sc) return
    const centerOf = (el: HTMLElement) => el.offsetLeft - (sc.clientWidth - el.offsetWidth) / 2
    const target = sc.querySelector<HTMLElement>(`[data-day="${selKey}"]`)
    if (!target) return
    const prev = prevKeyRef.current
    const prevEl = prev && prev !== selKey ? sc.querySelector<HTMLElement>(`[data-day="${prev}"]`) : null
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    sc.style.scrollSnapType = 'none'
    if (prevEl && !reduce) {
      sc.scrollTo({ left: centerOf(prevEl), behavior: 'auto' })
      sc.scrollTo({ left: centerOf(target), behavior: 'smooth' })
    } else {
      sc.scrollTo({ left: centerOf(target), behavior: 'auto' })
    }
    const t = window.setTimeout(() => { sc.style.scrollSnapType = '' }, 420)
    prevKeyRef.current = selKey
    return () => window.clearTimeout(t)
  }, [selKey])

  useEffect(() => () => { if (settleRef.current) window.clearTimeout(settleRef.current) }, [])

  const select = useCallback((d: dayjs.Dayjs) => {
    userScrollRef.current = false
    if (!d.isSame(dayjs(selectedDate), 'day')) setSelectedDate(d.toDate())
  }, [selectedDate, setSelectedDate])

  // Toque num dia: se já é o selecionado → abre o calendário; senão → seleciona.
  const pickDay = useCallback((d: dayjs.Dayjs) => {
    userScrollRef.current = false
    if (d.isSame(dayjs(selectedDate), 'day')) setShowCal(true)
    else setSelectedDate(d.toDate())
  }, [selectedDate, setSelectedDate])

  const goDay = useCallback((delta: number) => {
    userScrollRef.current = false
    setSelectedDate(dayjs(selectedDate).add(delta, 'day').toDate())
  }, [selectedDate, setSelectedDate])

  // Quando a rolagem do DEDO para, o dia do meio vira o selecionado.
  // Rolagem programática (centralizar) não seleciona nada: userScrollRef fica false.
  // Função simples (sem useCallback): o React Compiler memoiza sozinho.
  function onScroll() {
    if (!userScrollRef.current) return
    if (settleRef.current) window.clearTimeout(settleRef.current)
    settleRef.current = window.setTimeout(() => {
      settleRef.current = null
      const sc = scrollerRef.current
      if (!sc || !userScrollRef.current) return
      userScrollRef.current = false
      const mid = sc.getBoundingClientRect().left + sc.clientWidth / 2
      let best: HTMLElement | null = null
      let bestDist = Infinity
      sc.querySelectorAll<HTMLElement>('[data-day]').forEach(el => {
        const r = el.getBoundingClientRect()
        const dist = Math.abs(r.left + r.width / 2 - mid)
        if (dist < bestDist) { bestDist = dist; best = el }
      })
      const key = (best as HTMLElement | null)?.dataset.day
      if (key && key !== selKey) setSelectedDate(dayjs(key).toDate())
    }, SETTLE_MS)
  }

  function markUserScroll() { userScrollRef.current = true }

  const openNew = useCallback(() => {
    const defaultProfId = professionals[0]?.id ?? ''
    openCreate('09:00', defaultProfId)
  }, [professionals, openCreate])

  const todayOnLeft = selected.isAfter(today, 'day')

  const ruler = (
    <div className="rg-wrap">
      <div className="rg-fade l" />
      <div className="rg-fade r" />
      {!isToday && (
        <button
          className={`rg-today ${todayOnLeft ? 'l' : 'r'}`}
          onClick={() => select(today)}
          aria-label="Ir para hoje"
        >
          {todayOnLeft && <ChevronLeft size={13} strokeWidth={2.8} />}
          Hoje
          {!todayOnLeft && <ChevronRight size={13} strokeWidth={2.8} />}
        </button>
      )}
      <div
        ref={scrollerRef}
        className="rg-scroll"
        onScroll={onScroll}
        onPointerDown={markUserScroll}
        onTouchStart={markUserScroll}
        onWheel={markUserScroll}
        role="listbox"
        aria-label="Dias"
      >
        {days.map(day => {
          const key      = day.format('YYYY-MM-DD')
          const isSel    = key === selKey
          const isTodayD = day.isSame(today, 'day')
          const isWknd   = day.day() === 0 || day.day() === 6
          const isFirst  = day.date() === 1
          const cls = ['rg-day',
            isSel ? 'is-sel' : '',
            isTodayD ? 'is-today' : '',
            isWknd ? 'is-wknd' : '',
            isFirst ? 'is-first' : '',
          ].filter(Boolean).join(' ')
          return (
            <button
              key={key}
              data-day={key}
              className={cls}
              role="option"
              aria-selected={isSel}
              aria-label={`${DAYS_LONG[day.day()]}, ${day.date()} de ${MONTHS_LONG[day.month()]}${isTodayD ? ', hoje' : ''}${isSel ? '. Toque para abrir o calendário' : ''}`}
              onClick={() => pickDay(day)}
            >
              {isFirst && !isSel && <span className="rg-mo1">{MONTHS_ABBR[day.month()].toUpperCase()}</span>}
              <span className="rg-w">{DAYS_PT[day.day()]}</span>
              <span className="rg-n">
                {day.date()}
                {isSel && <span className="rg-mo">{MONTHS_ABBR[day.month()]}</span>}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )

  const actions = (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
      {!isMobile && onBlockClick && (
        <button className="tb-btn" onClick={onBlockClick}>
          <Ban size={14} strokeWidth={2.3} /> Bloquear
        </button>
      )}
      <button
        className={`tb-new${isMobile ? ' round' : ''}`}
        onClick={openNew}
        aria-label="Novo agendamento"
      >
        <Plus size={isMobile ? 20 : 15} strokeWidth={2.6} />{isMobile ? null : ' Novo'}
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
        .rg-wrap{position:relative; flex:1; min-width:0}
        .rg-scroll{position:relative; display:flex; gap:2px; overflow-x:auto; scroll-snap-type:x mandatory; scrollbar-width:none; padding:6px calc(50% - 42px); -webkit-overflow-scrolling:touch; overscroll-behavior-x:contain}
        .rg-scroll::-webkit-scrollbar{display:none}
        .rg-day{position:relative; scroll-snap-align:center; flex:0 0 44px; height:58px; border:0; background:transparent; border-radius:14px; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:3px; cursor:pointer; color:${INK}; -webkit-tap-highlight-color:transparent; transition:background .18s, transform .18s cubic-bezier(0.34,1.56,0.64,1)}
        .rg-day:hover:not(.is-sel){background:${SOFT}}
        .rg-day:active{transform:scale(0.92)}
        .rg-w{font-size:10px; font-weight:600; letter-spacing:.07em; text-transform:uppercase; color:${INK3}}
        .rg-day.is-wknd .rg-w{color:#b0b0b8}
        /* @eligi:regua-fix-n cor explicita: o globals.css pinta 'main span' de cinza */
        .rg-n{font-family:${typography.fontFamilyDisplay}; font-size:18px; font-weight:600; letter-spacing:-.02em; line-height:1; font-variant-numeric:tabular-nums; color:${INK}}
        .rg-day.is-today:not(.is-sel) .rg-n{text-decoration:underline; text-decoration-thickness:2px; text-underline-offset:5px}
        .rg-day.is-sel{flex-basis:84px; background:${INK}; color:#fff; box-shadow:0 8px 18px -6px rgba(17,17,20,.45)}
        .rg-day.is-sel .rg-w{color:rgba(255,255,255,.6)}
        .rg-day.is-sel .rg-n{font-size:21px; color:#fff} /* @eligi:regua-fix-sel */
        .rg-mo{font-family:${typography.fontFamily}; font-size:11px; font-weight:600; opacity:.7; margin-left:3px; letter-spacing:0; color:#fff} /* @eligi:regua-fix-mo */
        .rg-day.is-first::before{content:''; position:absolute; left:-2px; top:12px; bottom:12px; width:1px; background:${LINE}}
        .rg-day.is-sel.is-first::before{display:none}
        .rg-mo1{position:absolute; top:1px; left:50%; transform:translateX(-50%); font-family:${typography.fontFamilyMono}; font-size:8.5px; font-weight:600; letter-spacing:.08em; color:${INK3}}
        .rg-day.is-first:not(.is-sel){justify-content:flex-end; padding-bottom:9px}
        .rg-fade{position:absolute; top:0; bottom:0; width:28px; pointer-events:none; z-index:2}
        .rg-fade.l{left:0; background:linear-gradient(90deg, rgba(255,255,255,.95), rgba(255,255,255,0))}
        .rg-fade.r{right:0; background:linear-gradient(270deg, rgba(255,255,255,.95), rgba(255,255,255,0))}
        .rg-today{position:absolute; top:50%; transform:translateY(-50%); z-index:3; height:32px; padding:0 11px; border-radius:999px; border:1px solid ${LINE}; background:#fff; color:${INK}; font-size:12px; font-weight:700; display:flex; align-items:center; gap:3px; cursor:pointer; box-shadow:0 4px 12px rgba(17,17,20,.12); animation:rgPop .26s cubic-bezier(0.34,1.56,0.64,1); -webkit-tap-highlight-color:transparent}
        .rg-today::after{content:''; position:absolute; inset:-6px}
        .rg-today.l{left:4px} .rg-today.r{right:4px}
        .rg-today:active{transform:translateY(-50%) scale(.94)}
        @keyframes rgPop{from{opacity:0; transform:translateY(-50%) scale(.8)} to{opacity:1; transform:translateY(-50%) scale(1)}}
        .rg-nav{width:36px; height:36px; border-radius:50%; border:1px solid ${LINE}; background:#fff; cursor:pointer; display:grid; place-items:center; color:${INK2}; flex-shrink:0; transition:transform .16s cubic-bezier(0.34,1.56,0.64,1), background .15s}
        .rg-nav:hover{background:${SOFT}}
        .rg-nav:active{transform:scale(.9)}
        .tb-btn{height:36px; padding:0 14px; border-radius:999px; border:1px solid ${LINE}; background:#fff; font-size:12.5px; font-weight:600; color:${INK2}; cursor:pointer; display:inline-flex; align-items:center; gap:6px; white-space:nowrap; transition:background .15s, transform .16s cubic-bezier(0.34,1.56,0.64,1)}
        .tb-btn:hover{background:${SOFT}}
        .tb-btn:active{transform:scale(.95)}
        .tb-new{height:36px; padding:0 15px; border-radius:999px; border:0; background:${colors.red.DEFAULT}; color:#fff; font-size:12.5px; font-weight:700; cursor:pointer; display:inline-flex; align-items:center; justify-content:center; gap:4px; white-space:nowrap; box-shadow:0 4px 12px rgba(220,38,38,.28); -webkit-tap-highlight-color:transparent; transition:background .15s, transform .16s cubic-bezier(0.34,1.56,0.64,1)}
        .tb-new:hover{background:${colors.red.dark}}
        .tb-new:active{transform:scale(.94)}
        .tb-new.round{width:44px; height:44px; padding:0; border-radius:50%}
        @media (prefers-reduced-motion: reduce){ .rg-scroll{scroll-behavior:auto} .rg-today{animation:none} }
      `}</style>

      {showCal && (
        <CalendarPicker
          date={selected}
          isMobile={isMobile}
          onSelect={d => setSelectedDate(d.toDate())}
          onClose={() => setShowCal(false)}
        />
      )}

      <div style={{
        display: 'flex', alignItems: 'center', gap: isMobile ? 6 : 10,
        padding: isMobile ? '2px 10px 2px 0' : '4px 20px 4px 12px',
      }}>
        {!isMobile && (
          <button className="rg-nav" onClick={() => goDay(-1)} aria-label="Dia anterior">
            <ChevronLeft size={16} strokeWidth={2.4} />
          </button>
        )}
        {ruler}
        {!isMobile && (
          <button className="rg-nav" onClick={() => goDay(1)} aria-label="Próximo dia">
            <ChevronRight size={16} strokeWidth={2.4} />
          </button>
        )}
        {actions}
      </div>
    </div>
  )
}
