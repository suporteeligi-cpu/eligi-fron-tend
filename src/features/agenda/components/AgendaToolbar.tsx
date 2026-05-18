'use client'
// src/features/agenda/components/AgendaToolbar.tsx

import { useState, useRef, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import dayjs from 'dayjs'
import 'dayjs/locale/pt-br'
import weekOfYear from 'dayjs/plugin/weekOfYear'
import { ChevronLeft, ChevronRight, Plus, X, Ban } from 'lucide-react'
import { colors, transitions, radius, typography, shadows, glass } from '@/shared/theme'
import { useAgendaStore } from '../hooks/useAgendaStore'
import { useIsMobile } from '@/hooks/useIsMobile'

dayjs.extend(weekOfYear)
dayjs.locale('pt-br')

const DAYS_PT      = ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb']
const DAYS_HEADER  = ['SEG','TER','QUA','QUI','SEX','SÁB','DOM']
const MONTHS_PT    = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro']
const MONTHS_SHORT = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez']

// ─── CalendarPicker ───────────────────────────────────────────────────────────
function CalendarPicker({ date, onSelect, onClose, isMobile }: {
  date: dayjs.Dayjs
  onSelect: (d: dayjs.Dayjs) => void
  onClose:  () => void
  isMobile: boolean
}) {
  const today = dayjs()
  const [viewMonth, setViewMonth] = useState(date.startOf('month'))

  // Gera grade do calendário (semana começa na segunda)
  function buildGrid(month: dayjs.Dayjs) {
    const firstDay = month.startOf('month')
    // Ajusta para segunda (dayjs: 0=dom,1=seg,...6=sab)
    const startOffset = (firstDay.day() + 6) % 7  // 0=seg
    const daysInMonth = month.daysInMonth()
    const cells: (dayjs.Dayjs | null)[] = []

    for (let i = 0; i < startOffset; i++) cells.push(null)
    for (let d = 1; d <= daysInMonth; d++) cells.push(month.date(d))

    // Completa para múltiplo de 7
    while (cells.length % 7 !== 0) cells.push(null)
    return cells
  }

  const grid = buildGrid(viewMonth)

  // Semana do dia selecionado
  const selWeekStart = date.startOf('week').add(1, 'day') // segunda
  function isInSelWeek(d: dayjs.Dayjs) {
    const start = selWeekStart
    const end   = start.add(6, 'day')
    return !d.isBefore(start, 'day') && !d.isAfter(end, 'day')
  }

  function isWeekStart(d: dayjs.Dayjs) { return d.day() === 1 } // segunda
  function isWeekEnd(d: dayjs.Dayjs)   { return d.day() === 0 } // domingo

  const calW = isMobile ? Math.min(340, (typeof window !== 'undefined' ? window.innerWidth - 32 : 320)) : 320

  const content = (
    <>
      <div onClick={onClose} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.22)', backdropFilter:'blur(6px)', zIndex:9998 }} />

      <div style={isMobile ? {
        position:'fixed', bottom:0, left:0, right:0,
        background:'rgba(255,255,255,0.99)',
        borderRadius:'24px 24px 0 0',
        boxShadow:'0 -8px 40px rgba(0,0,0,0.18)',
        zIndex:9999, fontFamily:typography.fontFamily,
        animation:'calUp 0.28s cubic-bezier(0.34,1.2,0.64,1)',
        paddingBottom:'max(20px,env(safe-area-inset-bottom))',
      } : {
        position:'fixed', top:'50%', left:'50%',
        transform:'translate(-50%,-50%)',
        width: calW,
        background:'rgba(255,255,255,0.99)',
        borderRadius:radius['2xl'],
        boxShadow:shadows.lg,
        zIndex:9999, fontFamily:typography.fontFamily,
        animation:'calIn 0.22s cubic-bezier(0.34,1.56,0.64,1)',
        overflow:'hidden',
      }}>
        <style>{`
          @keyframes calIn{from{opacity:0;transform:translate(-50%,-50%) scale(0.93)}to{opacity:1;transform:translate(-50%,-50%) scale(1)}}
          @keyframes calUp{from{transform:translateY(100%)}to{transform:translateY(0)}}
          .cal-day{display:flex;align-items:center;justify-content:center;width:36px;height:36px;border-radius:50%;cursor:pointer;font-size:13px;font-weight:500;transition:all 0.12s;border:none;background:transparent;-webkit-tap-highlight-color:transparent}
          .cal-day:active{transform:scale(0.88)}
          .cal-week-cell{display:flex;align-items:center;justify-content:center}
          .cal-jump-btn{flex:1;padding:8px 0;border:1px solid ${colors.gray.borderMd};border-radius:8px;background:${colors.background.surface};font-size:12px;font-weight:600;cursor:pointer;color:${colors.gray[700]};transition:all 0.12s;-webkit-tap-highlight-color:transparent}
          .cal-jump-btn:hover{border-color:${colors.red.borderHover};color:${colors.red.DEFAULT};background:${colors.red.subtle}}
          .cal-jump-btn:active{transform:scale(0.94)}
        `}</style>

        {/* Handle mobile */}
        {isMobile && (
          <div style={{ display:'flex', justifyContent:'center', padding:'12px 0 2px' }}>
            <div style={{ width:40, height:4, borderRadius:2, background:'rgba(0,0,0,0.12)' }} />
          </div>
        )}

        {/* Header do calendário */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'14px 20px 10px' }}>
          <button
            onClick={() => setViewMonth(v => v.subtract(1,'month'))}
            style={{ width:32, height:32, borderRadius:'50%', border:`1px solid ${colors.gray.borderMd}`, background:'transparent', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', transition:transitions.fast }}
            onMouseEnter={e => { e.currentTarget.style.background = colors.red.subtle; e.currentTarget.style.borderColor = colors.red.border }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = colors.gray.borderMd }}
          >
            <ChevronLeft size={16} color={colors.gray[700]} strokeWidth={2.5} />
          </button>

          <button
            onClick={() => { setViewMonth(today.startOf('month')); onSelect(today); onClose() }}
            style={{ fontSize:16, fontWeight:700, color:colors.gray[900], background:'none', border:'none', cursor:'pointer', letterSpacing:'-0.3px', padding:'4px 8px', borderRadius:8, transition:transitions.fast }}
            onMouseEnter={e => { e.currentTarget.style.color = colors.red.DEFAULT }}
            onMouseLeave={e => { e.currentTarget.style.color = colors.gray[900] }}
          >
            {MONTHS_PT[viewMonth.month()]} {viewMonth.year()}
          </button>

          <button
            onClick={() => setViewMonth(v => v.add(1,'month'))}
            style={{ width:32, height:32, borderRadius:'50%', border:`1px solid ${colors.gray.borderMd}`, background:'transparent', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', transition:transitions.fast }}
            onMouseEnter={e => { e.currentTarget.style.background = colors.red.subtle; e.currentTarget.style.borderColor = colors.red.border }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = colors.gray.borderMd }}
          >
            <ChevronRight size={16} color={colors.gray[700]} strokeWidth={2.5} />
          </button>
        </div>

        {/* Cabeçalho dos dias — Seg a Dom */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', padding:'0 16px', marginBottom:4 }}>
          {/* Coluna semana */}
          <div style={{ width:32 }} />
          {DAYS_HEADER.map(d => (
            <div key={d} style={{ textAlign:'center', fontSize:10, fontWeight:700, color:colors.gray.dimText, letterSpacing:'.06em', padding:'4px 0' }}>{d}</div>
          ))}
        </div>

        {/* Grade */}
        <div style={{ padding:'0 16px 12px' }}>
          {Array.from({ length: grid.length / 7 }, (_, row) => {
            const week      = grid.slice(row * 7, row * 7 + 7)
            const weekNum   = week.find(d => d != null)?.week() ?? 0
            const hasSelDay = week.some(d => d && d.isSame(date,'day'))

            return (
              <div key={row} style={{ display:'flex', alignItems:'center', gap:0, marginBottom:2 }}>
                {/* Número da semana */}
                <div style={{ width:32, flexShrink:0, textAlign:'center', fontSize:10, fontWeight:600, color: hasSelDay ? colors.red.DEFAULT : 'rgba(0,0,0,0.22)', letterSpacing:'.02em' }}>
                  {weekNum}
                </div>

                {/* 7 dias */}
                <div style={{ flex:1, display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:0 }}>
                  {week.map((day, ci) => {
                    if (!day) return <div key={ci} />

                    const isSel     = day.isSame(date,  'day')
                    const isTodayD  = day.isSame(today, 'day')
                    const inSelWeek = isInSelWeek(day)
                    const isStart   = inSelWeek && (isWeekStart(day) || day.isSame(selWeekStart,'day'))
                    const isEnd     = inSelWeek && (isWeekEnd(day)   || day.isSame(selWeekStart.add(6,'day'),'day'))
                    const isOtherMonth = day.month() !== viewMonth.month()

                    return (
                      <div key={ci} style={{ position:'relative', display:'flex', justifyContent:'center' }}>
                        {/* Faixa de semana */}
                        {inSelWeek && !isSel && (
                          <div style={{
                            position:'absolute', inset:0, top:'50%', height:36, transform:'translateY(-50%)',
                            background:colors.red.subtle,
                            borderRadius: isStart ? '18px 0 0 18px' : isEnd ? '0 18px 18px 0' : 0,
                            zIndex:0,
                          }} />
                        )}

                        <button
                          className="cal-day"
                          onClick={() => { onSelect(day); onClose() }}
                          style={{
                            position:'relative', zIndex:1,
                            background: isSel ? colors.red.gradient : 'transparent',
                            color: isSel ? '#fff' : isTodayD ? colors.red.DEFAULT : isOtherMonth ? 'rgba(0,0,0,0.2)' : colors.gray[900],
                            fontWeight: isSel || isTodayD ? 700 : 500,
                            boxShadow: isSel ? `0 3px 10px ${colors.red.glow}` : 'none',
                          }}
                        >
                          {day.date()}
                          {/* Ponto "hoje" quando não selecionado */}
                          {isTodayD && !isSel && (
                            <div style={{ position:'absolute', bottom:3, left:'50%', transform:'translateX(-50%)', width:4, height:4, borderRadius:'50%', background:colors.red.DEFAULT }} />
                          )}
                        </button>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>

        {/* Divisor */}
        <div style={{ height:1, background:colors.gray.border, margin:'0 16px 12px' }} />

        {/* Pular por semana */}
        <div style={{ padding:'0 16px 4px' }}>
          <div style={{ fontSize:11, fontWeight:700, color:colors.gray.dimText, textTransform:'uppercase', letterSpacing:'.07em', marginBottom:8 }}>Pular por semana</div>
          <div style={{ display:'flex', gap:4, marginBottom:4 }}>
            {[1,2,3,4,5,6].map(n => (
              <button key={n} className="cal-jump-btn" onClick={() => { onSelect(date.add(n,'week')); onClose() }}>+{n}</button>
            ))}
          </div>
          <div style={{ display:'flex', gap:4 }}>
            {[1,2,3,4,5,6].map(n => (
              <button key={-n} className="cal-jump-btn" onClick={() => { onSelect(date.subtract(n,'week')); onClose() }} style={{ color:colors.gray.dimText }}>-{n}</button>
            ))}
          </div>
        </div>

        {/* Fechar */}
        <div style={{ padding:'10px 16px 0', display:'flex', justifyContent:'flex-end' }}>
          <button onClick={onClose} style={{ padding:'8px 20px', borderRadius:radius.sm, border:`1px solid ${colors.gray.borderMd}`, background:'transparent', fontSize:13, fontWeight:600, cursor:'pointer', color:colors.gray[700] }}>Fechar</button>
        </div>
      </div>
    </>
  )

  if (typeof document === 'undefined') return null
  return createPortal(content, document.body)
}

// ─── Toolbar ─────────────────────────────────────────────────────────────────
interface Props { onBlockClick?: () => void }

export default function AgendaToolbar({ onBlockClick }: Props) {
  const { selectedDate, setSelectedDate, openCreate } = useAgendaStore()
  const isMobile   = useIsMobile(768)
  const selected   = dayjs(selectedDate)
  const today      = dayjs()
  const isToday    = selected.isSame(today, 'day')
  const [showCal, setShowCal] = useState(false)
  const stripRef  = useRef<HTMLDivElement>(null)

  const startDay  = selected.subtract(3, 'day')
  const stripDays = Array.from({ length: 7 }, (_, i) => startDay.add(i, 'day'))

  useEffect(() => {
    if (!stripRef.current) return
    const el = stripRef.current.querySelector('.day-active') as HTMLElement | null
    el?.scrollIntoView({ inline:'center', behavior:'smooth', block:'nearest' })
  }, [selectedDate])

  function goDay(delta: number) { setSelectedDate(selected.add(delta, 'day').toDate()) }

  return (
    <div style={{
      background: glass.surface.toolbar.background,
      backdropFilter: glass.surface.toolbar.backdropFilter,
      WebkitBackdropFilter: glass.surface.toolbar.backdropFilter,
      borderBottom: glass.surface.toolbar.borderBottom,
      position:'sticky', top:0, zIndex:100, flexShrink:0,
      fontFamily: typography.fontFamily,
    }}>
      <style>{`
        .day-chip{display:flex;flex-direction:column;align-items:center;justify-content:center;border-radius:12px;border:1px solid transparent;cursor:pointer;transition:${transitions.spring};background:transparent;flex:1;-webkit-tap-highlight-color:transparent}
        .day-chip:active{transform:scale(0.90)}
        .day-chip.day-active{background:${colors.red.gradient};border-color:transparent;box-shadow:0 3px 12px ${colors.red.glow}}
        .day-chip:not(.day-active):active{background:${colors.red.subtle}}
        .nav-btn{width:30px;height:30px;border-radius:50%;border:1px solid ${colors.gray.borderMd};background:${colors.background.surface};cursor:pointer;display:flex;align-items:center;justify-content:center;transition:${transitions.fast};color:${colors.gray[700]};flex-shrink:0;-webkit-tap-highlight-color:transparent}
        .nav-btn:hover{background:${colors.red.subtle};border-color:${colors.red.border};color:${colors.red.DEFAULT}}
        .nav-btn:active{transform:scale(0.90)}
        .strip-scroll::-webkit-scrollbar{display:none}
        .tb-new-btn{display:flex;align-items:center;gap:4px;padding:7px 14px;border-radius:20px;font-size:13px;font-weight:700;cursor:pointer;border:none;background:${colors.red.gradient};color:#fff;transition:${transitions.spring};box-shadow:0 3px 10px ${colors.red.glow};-webkit-tap-highlight-color:transparent;white-space:nowrap}
        .tb-new-btn:active{transform:scale(0.94)}
        .tb-block-btn{display:flex;align-items:center;gap:4px;padding:7px 12px;border-radius:20px;font-size:12px;font-weight:600;cursor:pointer;border:1px solid rgba(71,85,105,0.20);background:rgba(71,85,105,0.06);color:#475569;transition:${transitions.fast};white-space:nowrap}
        .tb-block-btn:hover{background:rgba(71,85,105,0.12)}
        .tb-block-btn:active{transform:scale(0.94)}
        .tb-today-btn{padding:7px 13px;border-radius:20px;font-size:12px;font-weight:600;cursor:pointer;border:1px solid ${colors.red.border};background:${colors.red.subtle};color:${colors.red.DEFAULT};transition:${transitions.spring};white-space:nowrap}
        .tb-today-btn:hover{background:${colors.red.gradient};color:#fff;border-color:transparent}
        .tb-today-btn.is-today{background:rgba(0,0,0,0.04);border-color:${colors.gray.borderMd};color:${colors.gray[500]};pointer-events:none}
        .tb-month-btn{display:flex;align-items:center;gap:3px;padding:5px 10px;border-radius:16px;border:1px solid ${colors.gray.borderMd};background:${colors.background.surface};cursor:pointer;font-weight:600;color:${colors.gray[800]};transition:${transitions.fast};white-space:nowrap;-webkit-tap-highlight-color:transparent}
        .tb-month-btn:hover{border-color:${colors.red.borderHover};color:${colors.red.DEFAULT};background:${colors.red.subtle}}
        .tb-month-btn:active{transform:scale(0.96)}
      `}</style>

      {showCal && (
        <CalendarPicker
          date={selected}
          onSelect={d => setSelectedDate(d.toDate())}
          onClose={() => setShowCal(false)}
          isMobile={isMobile}
        />
      )}

      {isMobile ? (
        /* ══ MOBILE ══ */
        <>
          {/* Linha 1: mês + botão novo */}
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'8px 12px 6px', gap:8 }}>
            <button className="tb-month-btn" onClick={() => setShowCal(true)} style={{ fontSize:13 }}>
              {MONTHS_SHORT[selected.month()]} {selected.year()}
              <span style={{ fontSize:9, opacity:0.45 }}>▾</span>
            </button>

            <button className="tb-new-btn" onClick={() => openCreate('09:00', '')}>
              <Plus size={14} strokeWidth={2.5} /> Novo
            </button>
          </div>

          {/* Linha 2: setas + strip */}
          <div style={{ display:'flex', alignItems:'center', gap:4, padding:'0 10px 8px' }}>
            <button className="nav-btn" onClick={() => goDay(-1)}>
              <ChevronLeft size={15} strokeWidth={2.5} />
            </button>

            <div ref={stripRef} className="strip-scroll" style={{ flex:1, display:'flex', gap:2, overflowX:'auto', scrollbarWidth:'none' }}>
              {stripDays.map(day => {
                const isSel    = day.isSame(selected, 'day')
                const isTodayD = day.isSame(today, 'day')
                return (
                  <button
                    key={day.format('YYYY-MM-DD')}
                    className={`day-chip${isSel?' day-active':''}`}
                    onClick={() => setSelectedDate(day.toDate())}
                    style={{ padding:'5px 2px' }}
                  >
                    <span style={{ fontSize:9, fontWeight:700, letterSpacing:'.05em', color:isSel?'rgba(255,255,255,0.7)':colors.gray.dimText, marginBottom:2 }}>
                      {DAYS_PT[day.day()].toUpperCase()}
                    </span>
                    <span style={{ fontSize:17, fontWeight:700, lineHeight:1, color:isSel?'#fff':isTodayD?colors.red.DEFAULT:colors.gray[900] }}>
                      {day.date()}
                    </span>
                    <div style={{ width:4, height:4, borderRadius:'50%', marginTop:2, background:isTodayD?(isSel?'rgba(255,255,255,0.7)':colors.red.DEFAULT):'transparent' }} />
                  </button>
                )
              })}
            </div>

            <button className="nav-btn" onClick={() => goDay(1)}>
              <ChevronRight size={15} strokeWidth={2.5} />
            </button>
          </div>
        </>
      ) : (
        /* ══ DESKTOP ══ */
        <>
          {/* Linha 1: ações */}
          <div style={{ display:'flex', alignItems:'center', justifyContent:'flex-end', padding:'10px 20px 8px', gap:6 }}>
            {onBlockClick && (
              <button className="tb-block-btn" onClick={onBlockClick}>
                <Ban size={11} strokeWidth={2.5} /> Bloquear
              </button>
            )}
            <button className={`tb-today-btn${isToday?' is-today':''}`} onClick={() => setSelectedDate(today.toDate())}>
              Hoje
            </button>
            <button className="tb-new-btn" onClick={() => openCreate('09:00', '')}>
              <Plus size={13} strokeWidth={2.5} /> Novo
            </button>
          </div>

          {/* Linha 2: mês + setas + strip */}
          <div style={{ display:'flex', alignItems:'center', gap:8, padding:'0 20px 10px' }}>
            <button className="tb-month-btn" onClick={() => setShowCal(true)} style={{ fontSize:13, minWidth:106 }}>
              {MONTHS_SHORT[selected.month()]} {selected.year()}
              <span style={{ fontSize:9, opacity:0.45 }}>▾</span>
            </button>

            <div style={{ flex:1, display:'flex', alignItems:'center', gap:4 }}>
              <button className="nav-btn" onClick={() => goDay(-1)}>
                <ChevronLeft size={16} strokeWidth={2.5} />
              </button>
              <div ref={stripRef} className="strip-scroll" style={{ flex:1, display:'flex', gap:4, overflowX:'auto', scrollbarWidth:'none', justifyContent:'space-between' }}>
                {stripDays.map(day => {
                  const isSel    = day.isSame(selected, 'day')
                  const isTodayD = day.isSame(today, 'day')
                  return (
                    <button
                      key={day.format('YYYY-MM-DD')}
                      className={`day-chip${isSel?' day-active':''}`}
                      onClick={() => setSelectedDate(day.toDate())}
                      style={{ minWidth:44, padding:'7px 6px' }}
                    >
                      <span style={{ fontSize:9, fontWeight:700, letterSpacing:'.06em', color:isSel?'rgba(255,255,255,0.75)':colors.gray.dimText, marginBottom:3 }}>
                        {DAYS_PT[day.day()].toUpperCase()}
                      </span>
                      <span style={{ fontSize:18, fontWeight:700, lineHeight:1, color:isSel?'#fff':isTodayD?colors.red.DEFAULT:colors.gray[900] }}>
                        {day.date()}
                      </span>
                      <div style={{ width:4, height:4, borderRadius:'50%', marginTop:4, background:isTodayD?(isSel?'rgba(255,255,255,0.7)':colors.red.DEFAULT):'transparent' }} />
                    </button>
                  )
                })}
              </div>
              <button className="nav-btn" onClick={() => goDay(1)}>
                <ChevronRight size={16} strokeWidth={2.5} />
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}