'use client'
// src/features/agenda/components/AgendaToolbar.tsx

import { useState, useRef, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import dayjs from 'dayjs'
import 'dayjs/locale/pt-br'
import weekOfYear from 'dayjs/plugin/weekOfYear'
import { Ban, ChevronLeft, ChevronRight, Plus, X, CalendarDays } from 'lucide-react'
import { colors, transitions, radius, typography, shadows, glass } from '@/shared/theme'
import { useAgendaStore } from '../hooks/useAgendaStore'
import { useIsMobile } from '@/hooks/useIsMobile'

dayjs.extend(weekOfYear)
dayjs.locale('pt-br')

const DAYS_PT      = ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb']
const MONTHS_PT    = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro']
const MONTHS_SHORT = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez']

// ─── WheelPicker ─────────────────────────────────────────────────────────────
const ITEM_H  = 40
const VISIBLE = 5

function WheelPicker({ items, selectedIdx, onChange }: {
  items: string[]; selectedIdx: number; onChange: (i: number) => void
}) {
  const ref         = useRef<HTMLDivElement>(null)
  const isDragging  = useRef(false)
  const startY      = useRef(0)
  const startScroll = useRef(0)
  const timer       = useRef<ReturnType<typeof setTimeout> | null>(null)
  const padding     = Math.floor(VISIBLE / 2)

  const scrollTo = useCallback((idx: number, smooth = true) => {
    ref.current?.scrollTo({ top: idx * ITEM_H, behavior: smooth ? 'smooth' : 'instant' })
  }, [])

  useEffect(() => { scrollTo(selectedIdx, false) }, [selectedIdx, scrollTo])

  const snap = useCallback(() => {
    if (!ref.current) return
    const idx = Math.round(ref.current.scrollTop / ITEM_H)
    const c   = Math.max(0, Math.min(idx, items.length - 1))
    scrollTo(c); onChange(c)
  }, [items.length, onChange, scrollTo])

  return (
    <div style={{ position:'relative', height:VISIBLE*ITEM_H, overflow:'hidden', userSelect:'none' }}>
      <div style={{ position:'absolute', top:0, left:0, right:0, height:padding*ITEM_H, background:'linear-gradient(to bottom,rgba(255,255,255,0.97),transparent)', zIndex:2, pointerEvents:'none' }} />
      <div style={{ position:'absolute', top:padding*ITEM_H, left:0, right:0, height:ITEM_H, background:colors.red.subtle, borderTop:`1px solid ${colors.red.border}`, borderBottom:`1px solid ${colors.red.border}`, zIndex:2, pointerEvents:'none', borderRadius:8 }} />
      <div style={{ position:'absolute', bottom:0, left:0, right:0, height:padding*ITEM_H, background:'linear-gradient(to top,rgba(255,255,255,0.97),transparent)', zIndex:2, pointerEvents:'none' }} />
      <div
        ref={ref}
        onScroll={() => { if (timer.current) clearTimeout(timer.current); timer.current = setTimeout(snap, 100) }}
        onTouchStart={e => { startY.current = e.touches[0].clientY; startScroll.current = ref.current?.scrollTop ?? 0 }}
        onTouchMove={e => { if (ref.current) ref.current.scrollTop = startScroll.current + (startY.current - e.touches[0].clientY) }}
        onTouchEnd={snap}
        onMouseDown={e => { isDragging.current = true; startY.current = e.clientY; startScroll.current = ref.current?.scrollTop ?? 0 }}
        onMouseMove={e => { if (isDragging.current && ref.current) ref.current.scrollTop = startScroll.current + (startY.current - e.clientY) }}
        onMouseUp={snap} onMouseLeave={snap}
        style={{ height:'100%', overflowY:'scroll', scrollbarWidth:'none', cursor:'grab' }}
      >
        <div style={{ height:padding*ITEM_H }} />
        {items.map((item, i) => {
          const dist = Math.abs(i - selectedIdx)
          return (
            <div key={i} onClick={() => { onChange(i); scrollTo(i) }} style={{
              height:ITEM_H, display:'flex', alignItems:'center', justifyContent:'center',
              fontSize:15, fontWeight:dist===0?700:400,
              color:dist===0?colors.red.DEFAULT:colors.gray.dimText,
              opacity:dist===0?1:dist===1?0.55:0.25,
              transform:`scale(${dist===0?1:dist===1?0.88:0.76})`,
              transition:`all ${transitions.fast}`, cursor:'pointer',
            }}>{item}</div>
          )
        })}
        <div style={{ height:padding*ITEM_H }} />
      </div>
    </div>
  )
}

// ─── MonthYearPicker ─────────────────────────────────────────────────────────
function MonthYearPicker({ date, onSelect, onClose, isMobile }: {
  date: dayjs.Dayjs; onSelect: (d: dayjs.Dayjs) => void; onClose: () => void; isMobile: boolean
}) {
  const currentYear = dayjs().year()
  const years       = Array.from({ length: 10 }, (_, i) => String(currentYear - 2 + i))
  const [monthIdx, setMonthIdx] = useState(date.month())
  const [yearIdx,  setYearIdx]  = useState(years.indexOf(String(date.year())))

  function handleConfirm() {
    onSelect(dayjs().year(Number(years[yearIdx])).month(monthIdx).date(1))
    onClose()
  }

  const content = (
    <>
      <div onClick={onClose} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.22)', backdropFilter:'blur(6px)', zIndex:9998 }} />
      <div style={isMobile ? {
        position:'fixed', bottom:0, left:0, right:0,
        background:'rgba(255,255,255,0.98)', backdropFilter:'blur(32px)',
        borderRadius:'24px 24px 0 0',
        boxShadow:'0 -8px 40px rgba(0,0,0,0.18)',
        zIndex:9999, fontFamily:typography.fontFamily,
        animation:'mpUp 0.28s cubic-bezier(0.34,1.2,0.64,1)',
        paddingBottom:'max(20px,env(safe-area-inset-bottom))',
      } : {
        position:'fixed', top:'50%', left:'50%', transform:'translate(-50%,-50%)',
        width:300, background:'rgba(255,255,255,0.97)',
        backdropFilter:'blur(32px)', borderRadius:24,
        boxShadow:shadows.lg, zIndex:9999,
        fontFamily:typography.fontFamily,
        animation:'mpIn 0.22s cubic-bezier(0.34,1.56,0.64,1)',
        overflow:'hidden',
      }}>
        <style>{`
          @keyframes mpIn{from{opacity:0;transform:translate(-50%,-50%) scale(0.92)}to{opacity:1;transform:translate(-50%,-50%) scale(1)}}
          @keyframes mpUp{from{transform:translateY(100%)}to{transform:translateY(0)}}
        `}</style>

        {/* Handle mobile */}
        {isMobile && (
          <div style={{ display:'flex', justifyContent:'center', padding:'12px 0 4px' }}>
            <div style={{ width:40, height:4, borderRadius:2, background:'rgba(0,0,0,0.12)' }} />
          </div>
        )}

        <div style={{ padding:'16px 20px 12px', borderBottom:`1px solid ${colors.gray.border}`, display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <span style={{ fontSize:16, fontWeight:700, color:colors.gray[900] }}>Selecionar mês</span>
          <button onClick={onClose} style={{ width:28, height:28, borderRadius:radius.full, border:`1px solid ${colors.gray.borderMd}`, background:'transparent', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>
            <X size={13} color={colors.gray.dimText} />
          </button>
        </div>

        <div style={{ display:'flex', padding:'8px 20px' }}>
          <div style={{ flex:2 }}>
            <div style={{ fontSize:10, fontWeight:700, color:colors.gray.dimText, textTransform:'uppercase', letterSpacing:'.07em', textAlign:'center', marginBottom:4 }}>Mês</div>
            <WheelPicker items={MONTHS_PT} selectedIdx={monthIdx} onChange={setMonthIdx} />
          </div>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:10, fontWeight:700, color:colors.gray.dimText, textTransform:'uppercase', letterSpacing:'.07em', textAlign:'center', marginBottom:4 }}>Ano</div>
            <WheelPicker items={years} selectedIdx={yearIdx} onChange={setYearIdx} />
          </div>
        </div>

        <div style={{ padding:'12px 20px 16px', display:'flex', gap:8 }}>
          <button onClick={onClose} style={{ flex:1, padding:'12px', borderRadius:radius.sm, border:`1px solid ${colors.gray.borderMd}`, background:'transparent', fontSize:13, cursor:'pointer', color:colors.gray[700], fontWeight:600 }}>Cancelar</button>
          <button onClick={handleConfirm} style={{ flex:2, padding:'12px', borderRadius:radius.sm, border:'none', background:colors.red.gradient, color:'#fff', fontSize:13, cursor:'pointer', fontWeight:700, boxShadow:shadows.redSm }}>Confirmar</button>
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
  const [showPicker, setShowPicker] = useState(false)
  const stripRef   = useRef<HTMLDivElement>(null)

  // 7 dias centrados no selecionado
  const startDay  = selected.subtract(3, 'day')
  const stripDays = Array.from({ length: 7 }, (_, i) => startDay.add(i, 'day'))

  useEffect(() => {
    if (!stripRef.current) return
    const el = stripRef.current.querySelector('.day-active') as HTMLElement | null
    el?.scrollIntoView({ inline:'center', behavior:'smooth', block:'nearest' })
  }, [selectedDate])

  function goDay(delta: number) { setSelectedDate(selected.add(delta, 'day').toDate()) }

  const dayLabel = isToday
    ? `Hoje · ${MONTHS_SHORT[today.month()]} ${today.year()}`
    : `${DAYS_PT[selected.day()]}, ${selected.date()} ${MONTHS_SHORT[selected.month()]}`

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
        .day-chip{display:flex;flex-direction:column;align-items:center;justify-content:center;border-radius:12px;border:1px solid transparent;cursor:pointer;transition:${transitions.spring};background:transparent;flex:1;padding:6px 2px;-webkit-tap-highlight-color:transparent}
        .day-chip:active{transform:scale(0.92)}
        .day-chip.day-active{background:${colors.red.gradient};border-color:transparent;box-shadow:0 3px 12px ${colors.red.glow}}
        .day-chip:not(.day-active):active{background:${colors.red.subtle}}
        .nav-btn{width:30px;height:30px;border-radius:50%;border:1px solid ${colors.gray.borderMd};background:${colors.background.surface};cursor:pointer;display:flex;align-items:center;justify-content:center;transition:${transitions.fast};color:${colors.gray[700]};flex-shrink:0;-webkit-tap-highlight-color:transparent}
        .nav-btn:hover{background:${colors.red.subtle};border-color:${colors.red.border};color:${colors.red.DEFAULT}}
        .nav-btn:active{transform:scale(0.90)}
        .strip-scroll::-webkit-scrollbar{display:none}
        .tb-new-btn{display:flex;align-items:center;gap:4px;padding:8px 14px;border-radius:20px;font-size:13px;font-weight:700;cursor:pointer;border:none;background:${colors.red.gradient};color:#fff;transition:${transitions.spring};box-shadow:0 3px 10px ${colors.red.glow};-webkit-tap-highlight-color:transparent;white-space:nowrap}
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

      {showPicker && (
        <MonthYearPicker
          date={selected}
          onSelect={d => setSelectedDate(d.toDate())}
          onClose={() => setShowPicker(false)}
          isMobile={isMobile}
        />
      )}

      {isMobile ? (
        /* ══════════════ MOBILE LAYOUT ══════════════ */
        <>
          {/* Linha 1: título + mês + botão novo */}
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'10px 14px 8px', gap:8 }}>
            {/* Esquerda: título compacto */}
            <div style={{ minWidth:0 }}>
              <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                <h1 style={{ margin:0, fontSize:17, fontWeight:700, letterSpacing:'-0.3px', color:colors.gray[900], lineHeight:1 }}>
                  Agenda
                </h1>
                {/* Mês integrado ao título */}
                <button className="tb-month-btn" onClick={() => setShowPicker(true)} style={{ fontSize:12 }}>
                  {MONTHS_SHORT[selected.month()]} {selected.year()}
                  <span style={{ fontSize:8, opacity:0.45, marginLeft:1 }}>▾</span>
                </button>
              </div>
              <p style={{ margin:'2px 0 0', fontSize:11, color:colors.gray.dimText, lineHeight:1, textTransform:'capitalize' }}>
                {dayLabel}
              </p>
            </div>

            {/* Direita: só botão Novo */}
            <button className="tb-new-btn" onClick={() => openCreate('09:00', '')}>
              <Plus size={14} strokeWidth={2.5} /> Novo
            </button>
          </div>

          {/* Linha 2: seta ‹ + strip + seta › — ocupa 100% */}
          <div style={{ display:'flex', alignItems:'center', gap:4, padding:'0 10px 10px' }}>
            <button className="nav-btn" onClick={() => goDay(-1)}>
              <ChevronLeft size={15} strokeWidth={2.5} />
            </button>

            <div
              ref={stripRef}
              className="strip-scroll"
              style={{ flex:1, display:'flex', gap:3, overflowX:'auto', scrollbarWidth:'none' }}
            >
              {stripDays.map(day => {
                const isSel    = day.isSame(selected, 'day')
                const isTodayD = day.isSame(today, 'day')
                return (
                  <button
                    key={day.format('YYYY-MM-DD')}
                    className={`day-chip${isSel?' day-active':''}`}
                    onClick={() => setSelectedDate(day.toDate())}
                  >
                    <span style={{ fontSize:9, fontWeight:700, letterSpacing:'.05em', color:isSel?'rgba(255,255,255,0.7)':colors.gray.dimText, marginBottom:2 }}>
                      {DAYS_PT[day.day()].toUpperCase()}
                    </span>
                    <span style={{ fontSize:17, fontWeight:700, lineHeight:1, color:isSel?'#fff':isTodayD?colors.red.DEFAULT:colors.gray[900] }}>
                      {day.date()}
                    </span>
                    {/* dot indicador do dia atual */}
                    <div style={{ width:4, height:4, borderRadius:'50%', marginTop:3, background:isTodayD?(isSel?'rgba(255,255,255,0.7)':colors.red.DEFAULT):'transparent' }} />
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
        /* ══════════════ DESKTOP LAYOUT ══════════════ */
        <>
          {/* Linha 1: título + ações */}
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'14px 20px 10px', gap:8 }}>
            <div style={{ minWidth:0 }}>
              <h1 style={{ margin:0, fontSize:20, fontWeight:700, letterSpacing:'-0.4px', color:colors.gray[900], lineHeight:1 }}>
                Agenda
              </h1>
              <p style={{ margin:'3px 0 0', fontSize:12, color:colors.gray.dimText, textTransform:'capitalize', lineHeight:1 }}>
                {isToday
                  ? `Hoje, ${today.date()} de ${MONTHS_PT[today.month()].toLowerCase()}`
                  : `${DAYS_PT[selected.day()]}, ${selected.date()} de ${MONTHS_PT[selected.month()].toLowerCase()}`
                }
              </p>
            </div>
            <div style={{ display:'flex', alignItems:'center', gap:6, flexShrink:0 }}>
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
          </div>

          {/* Linha 2: mês + setas + strip */}
          <div style={{ display:'flex', alignItems:'center', gap:8, padding:'0 20px 14px' }}>
            <button className="tb-month-btn" onClick={() => setShowPicker(true)} style={{ fontSize:13, minWidth:106 }}>
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
                      style={{ minWidth:44, padding:'8px 6px' }}
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