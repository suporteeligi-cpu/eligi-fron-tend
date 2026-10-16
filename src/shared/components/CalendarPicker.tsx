'use client'
// src/shared/components/CalendarPicker.tsx
// Calendário eligi COMPARTILHADO — dia (Agenda/Caixa/Pacotes) + range (Financeiro/Vendas) + month (Relatorios/Despesas).
// [fatia1-grid7-alinhado] header e grade dividem o MESMO grid repeat(7,1fr).
// [fatia2-range] mode='range': 2 cliques pintam de–até, atalhos, Aplicar commita.
// [fatia3-month] mode='month': grade 3x4 de meses + navegacao de ano; seleção única (clica = aplica e fecha).
// @eligi:calp-v2 (out/2026) — identidade v1.0: selecionado em GRAFITE (não vermelho),
//   hoje = anel grafite, semana/intervalo = cinza suave. Vermelho só no "Aplicar" do range.
//   Modo dia com showWeekJump (Agenda): resumo do dia por extenso, "Voltar em" e
//   "Daqui a N semanas". Celular: folha com alça de arrastar para fechar e troca de
//   mês por arrasto lateral. Esc fecha.
// Retrocompatível: mesmas props; mode default 'day'.

import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import dayjs from 'dayjs'
import 'dayjs/locale/pt-br'
import { ChevronLeft, ChevronRight, CalendarDays, ArrowRight } from 'lucide-react'
import { colors, typography } from '@/shared/theme'
import { brand } from '@/shared/brand.generated'

dayjs.locale('pt-br')

const DAYS_HEADER  = ['SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB', 'DOM']
const MONTHS_PT    = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro']
const MONTHS_SHORT = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']
const WEEKDAYS_LONG = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado']
const WEEKDAYS_SHORT = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb']

const EASE_SPRING = 'cubic-bezier(0.34,1.56,0.64,1)'
const EASE_SHEET  = 'cubic-bezier(0.32,1.18,0.6,1)'

// Tinta da superfície clara (brand.surfaceLight) — seleção é grafite, nunca vermelho.
const INK   = brand.surfaceLight.ink
const INK2  = brand.surfaceLight.ink2
const INK3  = brand.surfaceLight.ink3
const SOFT  = '#f0f0f3'
const LINE  = 'rgba(17,17,20,0.14)'
const OUT   = '#c4c4cc'

const MAX_WEEKS = 12
const SWIPE_PX  = 45
const CLOSE_DRAG_PX = 70

function shortLabel(d: dayjs.Dayjs): string {
  return `${WEEKDAYS_SHORT[d.day()]}, ${d.format('DD/MM')}`
}

/** Semana ISO (segunda a domingo). */
function isoWeek(d: dayjs.Dayjs): number {
  const t = new Date(Date.UTC(d.year(), d.month(), d.date()))
  const n = (t.getUTCDay() + 6) % 7
  t.setUTCDate(t.getUTCDate() - n + 3)
  const firstThu = new Date(Date.UTC(t.getUTCFullYear(), 0, 4))
  return 1 + Math.round(((t.getTime() - firstThu.getTime()) / 864e5 - 3 + ((firstThu.getUTCDay() + 6) % 7)) / 7)
}

/** Mesmo dia do mês seguinte, ou o último dia dele (31/01 → 28/02). */
function addOneMonthClamped(d: dayjs.Dayjs): dayjs.Dayjs {
  const next = d.startOf('month').add(1, 'month')
  return next.date(Math.min(d.date(), next.daysInMonth()))
}

interface Props {
  date:      dayjs.Dayjs
  onSelect:  (d: dayjs.Dayjs) => void
  onClose:   () => void
  isMobile:  boolean
  maxDate?:  dayjs.Dayjs   // (dia/range) bloqueia dias após esta data
  minDate?:  dayjs.Dayjs   // (dia/range) bloqueia dias antes desta data
  showWeekJump?: boolean   // (dia) mostra resumo + "Voltar em" + "Daqui a" (default: true)
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
  const [slideDir,  setSlideDir]  = useState<'next' | 'prev' | null>(null)
  const [draftStart, setDraftStart] = useState<dayjs.Dayjs | null>(() => rangeStart)
  const [draftEnd,   setDraftEnd]   = useState<dayjs.Dayjs | null>(() => rangeEnd)
  const [hover,      setHover]      = useState<dayjs.Dayjs | null>(null)
  const [weeks,      setWeeks]      = useState(3)
  const [viewYear,   setViewYear]   = useState<number>(() =>
    isMonth && monthValue ? Number(monthValue.slice(0, 4)) : today.year())

  const sheetRef = useRef<HTMLDivElement>(null)
  const dragRef  = useRef<{ y0: number; dy: number } | null>(null)
  const swipeRef = useRef<{ x0: number; y0: number } | null>(null)

  // Esc fecha (teclado / iPad com teclado).
  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  if (typeof document === 'undefined') return null

  function shiftMonth(delta: number) {
    setSlideDir(delta > 0 ? 'next' : 'prev')
    setViewMonth(v => v.add(delta, 'month'))
  }

  // ── Arrastar a alça para fechar (celular). Estilo escrito no DOM, nunca em state.
  function onGrabDown(e: React.PointerEvent<HTMLDivElement>) {
    dragRef.current = { y0: e.clientY, dy: 0 }
    e.currentTarget.setPointerCapture(e.pointerId)
    if (sheetRef.current) sheetRef.current.style.transition = 'none'
  }
  function onGrabMove(e: React.PointerEvent<HTMLDivElement>) {
    const d = dragRef.current
    if (!d || !sheetRef.current) return
    d.dy = Math.max(0, e.clientY - d.y0)
    sheetRef.current.style.transform = `translateY(${d.dy}px)`
  }
  function onGrabUp() {
    const d = dragRef.current
    dragRef.current = null
    const el = sheetRef.current
    if (!el || !d) return
    el.style.transition = `transform 0.26s ${EASE_SHEET}`
    if (d.dy > CLOSE_DRAG_PX) {
      el.style.transform = 'translateY(105%)'
      window.setTimeout(onClose, 180)
    } else {
      el.style.transform = 'translateY(0)'
    }
  }

  // ── Trocar de mês arrastando a grade para o lado.
  function onGridDown(e: React.PointerEvent<HTMLDivElement>) {
    swipeRef.current = { x0: e.clientX, y0: e.clientY }
  }
  function onGridUp(e: React.PointerEvent<HTMLDivElement>) {
    const s = swipeRef.current
    swipeRef.current = null
    if (!s) return
    const dx = e.clientX - s.x0
    const dy = e.clientY - s.y0
    if (Math.abs(dx) > SWIPE_PX && Math.abs(dx) > Math.abs(dy) * 1.3) shiftMonth(dx < 0 ? 1 : -1)
  }

  function shellStyle(): React.CSSProperties {
    return isMobile ? {
      position: 'fixed', bottom: 0, left: 0, right: 0,
      maxHeight: '92dvh', display: 'flex', flexDirection: 'column',
      background: '#fff',
      borderRadius: '26px 26px 0 0',
      boxShadow: '0 -12px 40px rgba(7,7,11,0.18)',
      zIndex: 10999, fontFamily: typography.fontFamily, color: INK,
      animation: `calUp 0.32s ${EASE_SHEET}`,
      paddingBottom: 'max(16px, env(safe-area-inset-bottom))',
    } : {
      position: 'fixed', top: '50%', left: '50%',
      transform: 'translate(-50%,-50%)',
      width: 360, maxHeight: 'calc(100dvh - 32px)', display: 'flex', flexDirection: 'column',
      background: '#fff',
      borderRadius: 20,
      boxShadow: '0 24px 60px -12px rgba(7,7,11,0.30), 0 0 0 1px rgba(17,17,20,0.06)',
      zIndex: 10999, fontFamily: typography.fontFamily, color: INK,
      animation: `calIn 0.22s ${EASE_SPRING}`,
      overflow: 'hidden',
    }
  }

  const styleBlock = (
    <style>{`
      @keyframes calIn{from{opacity:0; transform:translate(-50%,-50%) scale(0.96)} to{opacity:1; transform:translate(-50%,-50%) scale(1)}}
      @keyframes calUp{from{transform:translateY(100%)} to{transform:translateY(0)}}
      @keyframes calFade{from{opacity:0} to{opacity:1}}
      @keyframes calNext{from{opacity:0; transform:translateX(22px)} to{opacity:1; transform:none}}
      @keyframes calPrev{from{opacity:0; transform:translateX(-22px)} to{opacity:1; transform:none}}
      .calp-body{flex:1; min-height:0; overflow-y:auto; overscroll-behavior:contain; padding:0 16px}
      .calp-nav{width:44px; height:44px; border-radius:50%; border:1px solid ${LINE}; background:#fff; display:grid; place-items:center; cursor:pointer; color:${INK2}; flex-shrink:0; -webkit-tap-highlight-color:transparent; transition:transform 0.16s ${EASE_SPRING}, background 0.15s}
      .calp-nav:hover:not(:disabled){background:${SOFT}}
      .calp-nav:active:not(:disabled){transform:scale(0.9)}
      .calp-nav:disabled{opacity:0.3; cursor:not-allowed}
      .calp-grid{touch-action:pan-y}
      .calp-grid.next{animation:calNext 0.28s cubic-bezier(0.22,1,0.36,1)}
      .calp-grid.prev{animation:calPrev 0.28s cubic-bezier(0.22,1,0.36,1)}
      .calp-day{position:relative; z-index:1; display:flex; align-items:center; justify-content:center; width:40px; height:40px; border-radius:12px; cursor:pointer; font-family:${typography.fontFamilyDisplay}; font-size:15.5px; font-weight:500; font-variant-numeric:tabular-nums; border:none; background:transparent; color:${INK}; -webkit-tap-highlight-color:transparent; transition:transform 0.16s ${EASE_SPRING}, background 0.15s}
      .calp-day:hover:not(:disabled):not(.is-sel){background:rgba(17,17,20,0.06)}
      .calp-day:active:not(:disabled){transform:scale(0.88)}
      .calp-day.is-wknd{color:${INK2}}
      .calp-day.is-out{color:${OUT}}
      .calp-day.is-today{box-shadow:inset 0 0 0 1.5px ${INK}; font-weight:700}
      .calp-day.is-sel{background:${INK}; color:#fff; font-weight:700; box-shadow:0 6px 14px -4px rgba(17,17,20,0.45)}
      .calp-day:disabled{color:rgba(17,17,20,0.18); cursor:not-allowed; box-shadow:none}
      .calp-chip{flex-shrink:0; height:44px; padding:0 14px; border-radius:999px; border:1px solid ${LINE}; background:#fff; font-size:13px; font-weight:600; color:${INK}; cursor:pointer; display:flex; flex-direction:column; align-items:flex-start; justify-content:center; line-height:1.15; -webkit-tap-highlight-color:transparent; transition:transform 0.16s ${EASE_SPRING}, background 0.15s}
      .calp-chip small{font-size:10.5px; color:${INK3}; font-weight:500; font-variant-numeric:tabular-nums}
      .calp-chip:hover:not(:disabled){background:${SOFT}}
      .calp-chip:active:not(:disabled){transform:scale(0.94)}
      .calp-chip:disabled{opacity:0.35; cursor:not-allowed}
      .calp-quick{display:flex; gap:8px; overflow-x:auto; scrollbar-width:none; margin:0 -16px; padding:2px 16px 4px}
      .calp-quick::-webkit-scrollbar{display:none}
      .calp-pm{width:44px; height:44px; border-radius:12px; border:0; background:#fff; font-size:20px; font-weight:600; color:${INK}; cursor:pointer; box-shadow:0 1px 2px rgba(17,17,20,0.08); -webkit-tap-highlight-color:transparent; transition:transform 0.16s ${EASE_SPRING}}
      .calp-pm:active:not(:disabled){transform:scale(0.9)}
      .calp-pm:disabled{opacity:0.35; cursor:not-allowed}
      .calp-go{flex:1; min-width:0; height:48px; padding:0 14px; border-radius:12px; border:0; background:${INK}; color:#fff; font-size:14px; font-weight:600; cursor:pointer; display:flex; align-items:center; gap:8px; text-align:left; -webkit-tap-highlight-color:transparent; transition:transform 0.16s ${EASE_SPRING}}
      .calp-go:active:not(:disabled){transform:scale(0.98)}
      .calp-go:disabled{opacity:0.35; cursor:not-allowed}
      .calp-btn{height:40px; padding:0 16px; border-radius:999px; border:1px solid ${LINE}; background:#fff; font-size:13px; font-weight:600; color:${INK2}; cursor:pointer; display:inline-flex; align-items:center; gap:6px; -webkit-tap-highlight-color:transparent; transition:transform 0.16s ${EASE_SPRING}, background 0.15s}
      .calp-btn:hover:not(:disabled){background:${SOFT}}
      .calp-btn:active:not(:disabled){transform:scale(0.95)}
      .calp-btn:disabled{opacity:0.35; cursor:not-allowed}
      .calp-btn.ghost{border-color:transparent; background:transparent}
      .calp-btn.ghost:hover:not(:disabled){background:${SOFT}}
      .calp-apply{height:40px; padding:0 22px; border-radius:999px; border:0; background:${colors.red.DEFAULT}; color:#fff; font-size:13px; font-weight:600; cursor:pointer; box-shadow:0 4px 12px rgba(220,38,38,0.28)}
      .calp-apply:hover:not(:disabled){background:${colors.red.dark}}
      .calp-apply:disabled{background:${LINE}; box-shadow:none; cursor:not-allowed}
      .calp-mo{height:52px; display:flex; align-items:center; justify-content:center; border-radius:12px; font-family:${typography.fontFamilyDisplay}; font-size:15px; font-weight:600; cursor:pointer; border:0; background:transparent; color:${INK}; transition:transform 0.14s ${EASE_SPRING}, background 0.15s; -webkit-tap-highlight-color:transparent}
      .calp-mo:hover:not(:disabled):not(.is-sel){background:${SOFT}}
      .calp-mo:active:not(:disabled){transform:scale(0.94)}
      .calp-mo.is-now{box-shadow:inset 0 0 0 1.5px ${INK}; font-weight:700}
      .calp-mo.is-sel{background:${INK}; color:#fff; font-weight:700; box-shadow:0 6px 14px -4px rgba(17,17,20,0.45)}
      .calp-mo:disabled{color:rgba(17,17,20,0.20); cursor:not-allowed}
      .calp-lbl{font-size:10.5px; font-weight:700; letter-spacing:0.09em; text-transform:uppercase; color:${INK3}; margin:12px 0 6px}
      .calp-grab{padding:10px 0 4px; display:flex; justify-content:center; cursor:grab; touch-action:none}
      .calp-grab i{width:38px; height:5px; border-radius:3px; background:rgba(17,17,20,0.16)}
    `}</style>
  )

  const backdrop = (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(7,7,11,0.32)', backdropFilter: 'blur(3px)', WebkitBackdropFilter: 'blur(3px)', zIndex: 10998, animation: 'calFade 0.2s ease' }} />
  )

  const grabber = isMobile ? (
    <div className="calp-grab" onPointerDown={onGrabDown} onPointerMove={onGrabMove} onPointerUp={onGrabUp} onPointerCancel={onGrabUp} aria-hidden>
      <i />
    </div>
  ) : null

  const titleStyle: React.CSSProperties = {
    fontFamily: typography.fontFamilyDisplay, fontSize: 19, fontWeight: 600, letterSpacing: '-0.025em', color: INK,
  }
  const subStyle: React.CSSProperties = {
    fontFamily: typography.fontFamily, fontSize: 13, fontWeight: 500, color: INK3, marginLeft: 6, letterSpacing: 0,
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
        {backdrop}
        <div ref={sheetRef} style={shellStyle()} role="dialog" aria-label="Escolher mês">
          {styleBlock}
          {grabber}

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px 12px' }}>
            <button className="calp-nav" onClick={() => setViewYear(y => y - 1)} aria-label="Ano anterior">
              <ChevronLeft size={18} strokeWidth={2.4} />
            </button>
            <div style={{ ...titleStyle, fontSize: 20 }}>{viewYear}</div>
            <button className="calp-nav" onClick={() => { if (!nextYearBlocked) setViewYear(y => y + 1) }} disabled={nextYearBlocked} aria-label="Próximo ano">
              <ChevronRight size={18} strokeWidth={2.4} />
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8, padding: '0 16px 8px' }}>
            {MONTHS_SHORT.map((name, i) => {
              const isSel = selYear === viewYear && selMonth === i
              const isNow = nowY === viewYear && nowM === i
              const blocked = maxY !== null && maxM !== null && (viewYear > maxY || (viewYear === maxY && i > maxM))
              return (
                <button
                  key={name}
                  className={`calp-mo${isSel ? ' is-sel' : ''}${isNow && !isSel ? ' is-now' : ''}`}
                  disabled={blocked}
                  aria-pressed={isSel}
                  onClick={() => { if (!blocked) { onSelectMonth?.(`${viewYear}-${String(i + 1).padStart(2, '0')}`); onClose() } }}
                >
                  {name}
                </button>
              )
            })}
          </div>

          <div style={{ padding: '10px 16px 14px', display: 'flex', justifyContent: 'flex-end' }}>
            <button className="calp-btn" onClick={onClose}>Fechar</button>
          </div>
        </div>
      </>
    )
    return createPortal(monthContent, document.body)
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // MODO DIA / RANGE
  // ═══════════════════════════════════════════════════════════════════════════
  // Só as semanas do mês (5 ou 6 linhas): no celular cada linha a menos é a
  // diferença entre a folha caber ou rolar.
  function buildGrid(month: dayjs.Dayjs): dayjs.Dayjs[] {
    const firstDay = month.startOf('month')
    const startOffset = (firstDay.day() + 6) % 7 // 0 = segunda
    const start = firstDay.subtract(startOffset, 'day')
    const cells = Math.ceil((startOffset + month.daysInMonth()) / 7) * 7
    return Array.from({ length: cells }, (_, i) => start.add(i, 'day'))
  }
  const grid = buildGrid(viewMonth)

  const selWeekStart = date.subtract((date.day() + 6) % 7, 'day') // segunda
  const selWeekEnd   = selWeekStart.add(6, 'day')
  const isInSelWeek = (d: dayjs.Dayjs) => !d.isBefore(selWeekStart, 'day') && !d.isAfter(selWeekEnd, 'day')

  function isDisabled(d: dayjs.Dayjs): boolean {
    if (maxDate && d.isAfter(maxDate, 'day')) return true
    if (minDate && d.isBefore(minDate, 'day')) return true
    return false
  }

  function pick(d: dayjs.Dayjs) {
    if (isDisabled(d)) return
    onSelect(d)
    onClose()
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
  const extras = !isRange && showWeekJump

  // Resumo do dia escolhido (só com extras).
  const daysFromToday = date.startOf('day').diff(today.startOf('day'), 'day')
  const relLabel = daysFromToday === 0 ? 'HOJE'
    : daysFromToday === 1 ? 'AMANHÃ'
    : daysFromToday === -1 ? 'ONTEM'
    : daysFromToday > 0 ? `DAQUI A ${daysFromToday} DIAS`
    : `HÁ ${-daysFromToday} DIAS`

  const backIn: Array<[string, dayjs.Dayjs]> = [
    ['Amanhã',     today.add(1, 'day')],
    ['+1 semana',  date.add(1, 'week')],
    ['+2 semanas', date.add(2, 'week')],
    ['+3 semanas', date.add(3, 'week')],
    ['+4 semanas', date.add(4, 'week')],
    ['+1 mês',     addOneMonthClamped(date)],
  ]
  const weeksTarget = date.add(weeks, 'week')

  const monthHeader = (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0 10px' }}>
      <button className="calp-nav" onClick={() => shiftMonth(-1)} aria-label="Mês anterior">
        <ChevronLeft size={18} strokeWidth={2.4} />
      </button>
      <div style={titleStyle} aria-live="polite">
        {MONTHS_PT[viewMonth.month()]}<span style={subStyle}>{viewMonth.year()}</span>
      </div>
      <button className="calp-nav" onClick={() => shiftMonth(1)} aria-label="Próximo mês">
        <ChevronRight size={18} strokeWidth={2.4} />
      </button>
    </div>
  )

  const weekdayHeader = (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', paddingBottom: 6 }}>
      {DAYS_HEADER.map(d => (
        <div key={d} style={{ textAlign: 'center', fontSize: 10, fontWeight: 600, color: INK3, letterSpacing: '0.08em' }}>{d}</div>
      ))}
    </div>
  )

  const monthGrid = (
    <div
      key={viewMonth.format('YYYY-MM')}
      className={`calp-grid${slideDir ? ` ${slideDir}` : ''}`}
      style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', rowGap: 2 }}
      onPointerDown={onGridDown}
      onPointerUp={onGridUp}
      onMouseLeave={() => { if (isRange) setHover(null) }}
    >
      {grid.map(day => {
        const key          = day.format('YYYY-MM-DD')
        const isTodayD     = day.isSame(today, 'day')
        const isOtherMonth = day.month() !== viewMonth.month()
        const disabled     = isDisabled(day)
        const isWknd       = day.day() === 0 || day.day() === 6
        const aria         = `${WEEKDAYS_LONG[day.day()]}, ${day.date()} de ${MONTHS_PT[day.month()].toLowerCase()}`

        let bandRadius: string | null = null
        let selected = false

        if (isRange) {
          const inR  = !!pb && !day.isBefore(pb[0], 'day') && !day.isAfter(pb[1], 'day')
          const isLo = !!pb && day.isSame(pb[0], 'day')
          const isHi = !!pb && day.isSame(pb[1], 'day')
          const single = !!pb && pb[0].isSame(pb[1], 'day')
          selected = isLo || isHi
          if (inR && !single) bandRadius = isLo ? '12px 0 0 12px' : isHi ? '0 12px 12px 0' : '0'
        } else {
          selected = day.isSame(date, 'day')
          if (isInSelWeek(day) && !selected && !isOtherMonth) {
            const s = day.isSame(selWeekStart, 'day') || day.date() === 1
            const e = day.isSame(selWeekEnd, 'day') || day.date() === day.daysInMonth()
            bandRadius = s && e ? '12px' : s ? '12px 0 0 12px' : e ? '0 12px 12px 0' : '0'
          }
        }

        const cls = ['calp-day',
          isWknd ? 'is-wknd' : '',
          isOtherMonth ? 'is-out' : '',
          isTodayD && !selected ? 'is-today' : '',
          selected ? 'is-sel' : '',
        ].filter(Boolean).join(' ')

        return (
          <div key={key} style={{ position: 'relative', display: 'flex', justifyContent: 'center', alignItems: 'center', height: 44 }}>
            {bandRadius !== null && (
              <div style={{ position: 'absolute', left: 0, right: 0, top: 4, bottom: 4, background: SOFT, borderRadius: bandRadius, zIndex: 0 }} />
            )}
            <button
              className={cls}
              disabled={disabled}
              aria-label={aria}
              aria-pressed={selected}
              onClick={() => { if (isRange) clickRange(day); else pick(day) }}
              onMouseEnter={() => { if (isRange && draftStart && !draftEnd) setHover(day) }}
            >
              {day.date()}
            </button>
          </div>
        )
      })}
    </div>
  )

  const summary = extras ? (
    <div style={{ padding: '2px 0 10px', borderBottom: `1px solid ${brand.surfaceLight.border}`, marginBottom: 4 }}>
      <div style={{ fontFamily: typography.fontFamilyMono, fontSize: 10.5, fontWeight: 600, letterSpacing: '0.06em', color: INK3 }}>
        {relLabel} · SEMANA {isoWeek(date)}
      </div>
      <div style={{ fontFamily: typography.fontFamilyDisplay, fontSize: isMobile ? 22 : 26, fontWeight: 600, letterSpacing: '-0.035em', lineHeight: 1.15, marginTop: 3, color: INK }}>
        {WEEKDAYS_LONG[date.day()]}
        <span style={{ fontFamily: typography.fontFamily, fontSize: 14, fontWeight: 500, letterSpacing: 0, color: INK2, marginLeft: 8 }}>
          {date.date()} de {MONTHS_PT[date.month()].toLowerCase()}{date.year() !== today.year() ? ` de ${date.year()}` : ''}
        </span>
      </div>
    </div>
  ) : null

  const backInRow = extras ? (
    <>
      <div className="calp-lbl" style={{ marginTop: 10 }}>Voltar em</div>
      <div className="calp-quick">
        {backIn.map(([label, d]) => (
          <button key={label} className="calp-chip" disabled={isDisabled(d)} onClick={() => pick(d)}>
            {label}<small>{shortLabel(d)}</small>
          </button>
        ))}
      </div>
    </>
  ) : null

  // Uma linha só: [−] [ir para a data] [+]. O botão do meio é a ação (cabe no
  // celular sem rolar a folha).
  const weeksStepper = extras ? (
    <>
      <div className="calp-lbl">Daqui a</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: SOFT, borderRadius: 16, padding: 6 }}>
        <button className="calp-pm" disabled={weeks <= 1} onClick={() => setWeeks(w => Math.max(1, w - 1))} aria-label="Menos uma semana">−</button>
        <button className="calp-go" disabled={isDisabled(weeksTarget)} onClick={() => pick(weeksTarget)} aria-live="polite">
          <span style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', lineHeight: 1.15 }}>
            <span style={{ fontFamily: typography.fontFamilyDisplay, fontSize: 16, fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>
              {weeks} {weeks === 1 ? 'semana' : 'semanas'}
            </span>
            <span style={{ fontSize: 11.5, fontWeight: 500, opacity: 0.7, fontVariantNumeric: 'tabular-nums' }}>
              {WEEKDAYS_LONG[weeksTarget.day()].toLowerCase()}, {weeksTarget.date()} de {MONTHS_SHORT[weeksTarget.month()].toLowerCase()}
            </span>
          </span>
          <ArrowRight size={16} strokeWidth={2.4} style={{ marginLeft: 'auto' }} />
        </button>
        <button className="calp-pm" disabled={weeks >= MAX_WEEKS} onClick={() => setWeeks(w => Math.min(MAX_WEEKS, w + 1))} aria-label="Mais uma semana">+</button>
      </div>
    </>
  ) : null

  const rangeShortcutsRow = isRange ? (
    <>
      <div className="calp-lbl">Atalhos</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 6 }}>
        {rangeShortcuts.map(([label, fn]) => (
          <button key={label} className="calp-btn" style={{ justifyContent: 'center', padding: 0 }} onClick={fn}>{label}</button>
        ))}
      </div>
    </>
  ) : null

  const footer = isRange ? (
    <div style={{ padding: '12px 16px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <button className="calp-btn ghost" onClick={() => { setDraftStart(null); setDraftEnd(null); setHover(null) }}>Limpar</button>
      <button className="calp-apply" onClick={commitRange} disabled={!draftStart}>Aplicar</button>
    </div>
  ) : (
    <div style={{ padding: isMobile ? '6px 16px 4px' : '12px 16px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <button className="calp-btn ghost" disabled={isDisabled(today)} onClick={() => pick(today)}>
        <CalendarDays size={16} strokeWidth={2.2} /> Hoje
      </button>
      <button className="calp-btn" onClick={onClose}>Fechar</button>
    </div>
  )

  const content = (
    <>
      {backdrop}
      <div ref={sheetRef} style={shellStyle()} role="dialog" aria-label={isRange ? 'Escolher período' : 'Escolher dia'}>
        {styleBlock}
        {grabber}
        <div className="calp-body" style={{ paddingTop: isMobile ? 4 : 14 }}>
          {summary}
          {backInRow}
          <div style={{ paddingTop: extras ? 4 : 0 }}>{monthHeader}</div>
          {weekdayHeader}
          {monthGrid}
          {weeksStepper}
          {rangeShortcutsRow}
        </div>
        {footer}
      </div>
    </>
  )

  return createPortal(content, document.body)
}
