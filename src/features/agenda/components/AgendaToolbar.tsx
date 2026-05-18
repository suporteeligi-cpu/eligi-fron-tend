'use client'
// src/features/agenda/components/AgendaToolbar.tsx

import { useState, useRef, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import dayjs from 'dayjs'
import 'dayjs/locale/pt-br'
import weekOfYear from 'dayjs/plugin/weekOfYear'
import { Ban, ChevronLeft, ChevronRight, Plus, X } from 'lucide-react'
import { colors, transitions, radius, typography, shadows, glass } from '@/shared/theme'
import { useAgendaStore } from '../hooks/useAgendaStore'

dayjs.extend(weekOfYear)
dayjs.locale('pt-br')

const DAYS_PT   = ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb']
const MONTHS_PT = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro']
const MONTHS_SHORT = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez']

// ─── MonthPicker — roleta estilo iOS ─────────────────────────────────────────
const ITEM_H   = 40
const VISIBLE  = 5

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

  function onScroll() {
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(snap, 100)
  }

  return (
    <div style={{ position:'relative', height:VISIBLE*ITEM_H, overflow:'hidden', userSelect:'none' }}>
      {/* Masks */}
      <div style={{ position:'absolute', top:0, left:0, right:0, height:padding*ITEM_H, background:'linear-gradient(to bottom,rgba(255,255,255,0.97),transparent)', zIndex:2, pointerEvents:'none' }} />
      <div style={{ position:'absolute', top:padding*ITEM_H, left:0, right:0, height:ITEM_H, background:colors.red.subtle, borderTop:`1px solid ${colors.red.border}`, borderBottom:`1px solid ${colors.red.border}`, zIndex:2, pointerEvents:'none', borderRadius:8 }} />
      <div style={{ position:'absolute', bottom:0, left:0, right:0, height:padding*ITEM_H, background:'linear-gradient(to top,rgba(255,255,255,0.97),transparent)', zIndex:2, pointerEvents:'none' }} />
      <div
        ref={ref}
        onScroll={onScroll}
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

function MonthYearPicker({ date, onSelect, onClose }: {
  date: dayjs.Dayjs; onSelect: (d: dayjs.Dayjs) => void; onClose: () => void
}) {
  const currentYear = dayjs().year()
  const years = Array.from({ length: 10 }, (_, i) => String(currentYear - 2 + i))
  const [monthIdx, setMonthIdx] = useState(date.month())
  const [yearIdx,  setYearIdx]  = useState(years.indexOf(String(date.year())))

  function handleConfirm() {
    const year = Number(years[yearIdx])
    onSelect(dayjs().year(year).month(monthIdx).date(1))
    onClose()
  }

  return createPortalEl(
    <>
      <div onClick={onClose} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.2)', backdropFilter:'blur(6px)', zIndex:9998 }} />
      <div style={{
        position:'fixed', top:'50%', left:'50%', transform:'translate(-50%,-50%)',
        width:300, background:'rgba(255,255,255,0.97)',
        backdropFilter:'blur(32px)', borderRadius:24,
        boxShadow:shadows.lg, zIndex:9999,
        fontFamily:typography.fontFamily,
        animation:'mpIn 0.22s cubic-bezier(0.34,1.56,0.64,1)',
        overflow:'hidden',
      }}>
        <style>{`@keyframes mpIn{from{opacity:0;transform:translate(-50%,-50%) scale(0.92)}to{opacity:1;transform:translate(-50%,-50%) scale(1)}}`}</style>
        <div style={{ padding:'16px 20px 12px', borderBottom:`1px solid ${colors.gray.border}`, display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <span style={{ fontSize:15, fontWeight:700, color:colors.gray[900] }}>Selecionar mês</span>
          <button onClick={onClose} style={{ width:28, height:28, borderRadius:radius.full, border:`1px solid ${colors.gray.borderMd}`, background:'transparent', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>
            <X size={13} color={colors.gray.dimText} />
          </button>
        </div>

        <div style={{ display:'flex', gap:0, padding:'8px 20px' }}>
          <div style={{ flex:2 }}>
            <div style={{ fontSize:10, fontWeight:700, color:colors.gray.dimText, textTransform:'uppercase', letterSpacing:'.07em', textAlign:'center', marginBottom:4 }}>Mês</div>
            <WheelPicker items={MONTHS_PT} selectedIdx={monthIdx} onChange={setMonthIdx} />
          </div>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:10, fontWeight:700, color:colors.gray.dimText, textTransform:'uppercase', letterSpacing:'.07em', textAlign:'center', marginBottom:4 }}>Ano</div>
            <WheelPicker items={years} selectedIdx={yearIdx} onChange={setYearIdx} />
          </div>
        </div>

        <div style={{ padding:'12px 20px 20px', display:'flex', gap:8 }}>
          <button onClick={onClose} style={{ flex:1, padding:'11px', borderRadius:radius.sm, border:`1px solid ${colors.gray.borderMd}`, background:'transparent', fontSize:13, cursor:'pointer', color:colors.gray[700], fontWeight:600 }}>Cancelar</button>
          <button onClick={handleConfirm} style={{ flex:2, padding:'11px', borderRadius:radius.sm, border:'none', background:colors.red.gradient, color:'#fff', fontSize:13, cursor:'pointer', fontWeight:700, boxShadow:shadows.redSm }}>Confirmar</button>
        </div>
      </div>
    </>
  )
}

// Portal helper — evita problemas de SSR
function createPortalEl(children: React.ReactNode) {
  if (typeof document === 'undefined') return null
  return createPortal(children, document.body)
}

// ─── Toolbar principal ────────────────────────────────────────────────────────
interface Props {
  onBlockClick?: () => void
}

export default function AgendaToolbar({ onBlockClick }: Props) {
  const { selectedDate, setSelectedDate, openCreate } = useAgendaStore()
  const selected       = dayjs(selectedDate)
  const today          = dayjs()
  const isToday        = selected.isSame(today, 'day')
  const [showPicker, setShowPicker] = useState(false)

  // 7 dias centrados no selecionado
  const startDay   = selected.subtract(3, 'day')
  const stripDays  = Array.from({ length: 7 }, (_, i) => startDay.add(i, 'day'))

  const stripRef   = useRef<HTMLDivElement>(null)

  // Centra o dia selecionado no strip
  useEffect(() => {
    if (!stripRef.current) return
    const el = stripRef.current.querySelector('.day-active') as HTMLElement | null
    if (el) el.scrollIntoView({ inline:'center', behavior:'smooth', block:'nearest' })
  }, [selectedDate])

  function goDay(delta: number) {
    setSelectedDate(selected.add(delta, 'day').toDate())
  }

  function goToday() {
    setSelectedDate(today.toDate())
  }

  const dayLabel = isToday
    ? `Hoje, ${today.date()} de ${MONTHS_PT[today.month()].toLowerCase()}`
    : `${DAYS_PT[selected.day()]}, ${selected.date()} de ${MONTHS_PT[selected.month()].toLowerCase()}`

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
        @keyframes fadeIn{from{opacity:0}to{opacity:1}}
        .day-chip{display:flex;flex-direction:column;align-items:center;padding:8px 10px;border-radius:14px;border:1px solid transparent;cursor:pointer;min-width:44px;transition:${transitions.spring};background:transparent;flex-shrink:0}
        .day-chip:hover{background:${colors.red.subtle};border-color:${colors.red.border}}
        .day-chip.day-active{background:${colors.red.gradient};border-color:transparent;box-shadow:0 4px 16px ${colors.red.glow}}
        .day-chip.day-today-dot .dot{background:${colors.red.DEFAULT}}
        .day-chip.day-active .dot{background:rgba(255,255,255,0.7)}
        .nav-btn{width:32px;height:32px;border-radius:50%;border:1px solid ${colors.gray.borderMd};background:${colors.background.surface};cursor:pointer;display:flex;align-items:center;justify-content:center;transition:${transitions.fast};color:${colors.gray[700]};flex-shrink:0}
        .nav-btn:hover{background:${colors.red.subtle};border-color:${colors.red.border};color:${colors.red.DEFAULT}}
        .nav-btn:active{transform:scale(0.92)}
        .month-btn{display:flex;align-items:center;gap:4px;padding:5px 12px;border-radius:20px;border:1px solid ${colors.gray.borderMd};background:${colors.background.surface};cursor:pointer;font-size:13px;font-weight:600;color:${colors.gray[800]};transition:${transitions.fast};white-space:nowrap}
        .month-btn:hover{border-color:${colors.red.borderHover};color:${colors.red.DEFAULT};background:${colors.red.subtle}}
        .today-btn{padding:5px 13px;border-radius:20px;font-size:12px;font-weight:600;cursor:pointer;border:1px solid ${colors.red.border};background:${colors.red.subtle};color:${colors.red.DEFAULT};transition:${transitions.spring};white-space:nowrap}
        .today-btn:hover{background:${colors.red.gradient};color:#fff;border-color:transparent;box-shadow:0 3px 10px ${colors.red.glow};transform:translateY(-1px)}
        .today-btn.is-today{background:rgba(0,0,0,0.04);border-color:${colors.gray.borderMd};color:${colors.gray[500]};pointer-events:none}
        .block-btn{display:flex;align-items:center;gap:5px;padding:5px 12px;border-radius:20px;font-size:12px;font-weight:600;cursor:pointer;border:1px solid rgba(71,85,105,0.2);background:rgba(71,85,105,0.06);color:#475569;transition:${transitions.spring}}
        .block-btn:hover{background:rgba(71,85,105,0.12);border-color:rgba(71,85,105,0.3);transform:translateY(-1px)}
        .new-btn{display:flex;align-items:center;gap:5px;padding:5px 13px;border-radius:20px;font-size:12px;font-weight:700;cursor:pointer;border:none;background:${colors.red.gradient};color:#fff;transition:${transitions.spring};box-shadow:0 3px 10px ${colors.red.glow}}
        .new-btn:hover{transform:translateY(-1px);box-shadow:0 5px 16px ${colors.red.glow}}
        .strip-scroll::-webkit-scrollbar{display:none}
      `}</style>

      {showPicker && (
        <MonthYearPicker
          date={selected}
          onSelect={d => setSelectedDate(d.toDate())}
          onClose={() => setShowPicker(false)}
        />
      )}

      {/* ── Linha 1: título + ações ── */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'14px 20px 10px', gap:8 }}>
        {/* Esquerda: título + data */}
        <div style={{ minWidth:0 }}>
          <h1 style={{ margin:0, fontSize:20, fontWeight:700, letterSpacing:'-0.4px', color:colors.gray[900], lineHeight:1 }}>
            Agenda
          </h1>
          <p style={{ margin:'3px 0 0', fontSize:12, color:colors.gray.dimText, textTransform:'capitalize', lineHeight:1 }}>
            {dayLabel}
          </p>
        </div>

        {/* Direita: ações */}
        <div style={{ display:'flex', alignItems:'center', gap:6, flexShrink:0 }}>
          {onBlockClick && (
            <button className="block-btn" onClick={onBlockClick}>
              <Ban size={11} strokeWidth={2.5} /> Bloquear
            </button>
          )}
          <button className={`today-btn${isToday?' is-today':''}`} onClick={goToday}>
            Hoje
          </button>
          <button className="new-btn" onClick={() => openCreate('09:00', '')}>
            <Plus size={13} strokeWidth={2.5} /> Novo
          </button>
        </div>
      </div>

      {/* ── Linha 2: navegação de dia ── */}
      <div style={{ display:'flex', alignItems:'center', gap:8, padding:'0 20px 14px' }}>
        {/* Botão mês/ano — abre picker */}
        <button className="month-btn" onClick={() => setShowPicker(true)} style={{ minWidth:110 }}>
          {MONTHS_SHORT[selected.month()]} {selected.year()}
          <span style={{ fontSize:9, opacity:0.5 }}>▾</span>
        </button>

        {/* Nav + strip centralizados */}
        <div style={{ flex:1, display:'flex', alignItems:'center', gap:4 }}>
          {/* Nav ‹ */}
          <button className="nav-btn" onClick={() => goDay(-1)} style={{ flexShrink:0 }}>
            <ChevronLeft size={16} strokeWidth={2.5} />
          </button>

          {/* Strip de 7 dias — ocupa todo o espaço disponível entre as setas */}
          <div
            ref={stripRef}
            className="strip-scroll"
            style={{ flex:1, display:'flex', gap:4, overflowX:'auto', scrollbarWidth:'none', WebkitOverflowScrolling:'touch', justifyContent:'space-between' }}
          >
            {stripDays.map(day => {
              const isSel    = day.isSame(selected, 'day')
              const isTodayD = day.isSame(today, 'day')
              return (
                <button
                  key={day.format('YYYY-MM-DD')}
                  className={`day-chip${isSel?' day-active':''}${isTodayD&&!isSel?' day-today-dot':''}`}
                  onClick={() => setSelectedDate(day.toDate())}
                  style={{ flex:1 }}
                >
                  <span style={{ fontSize:9, fontWeight:700, letterSpacing:'.06em', color:isSel?'rgba(255,255,255,0.75)':colors.gray.dimText, marginBottom:3 }}>
                    {DAYS_PT[day.day()].toUpperCase()}
                  </span>
                  <span style={{ fontSize:18, fontWeight:700, lineHeight:1, color:isSel?'#fff':isTodayD?colors.red.DEFAULT:colors.gray[900] }}>
                    {day.date()}
                  </span>
                  <div className="dot" style={{ width:4, height:4, borderRadius:'50%', marginTop:4, background:'transparent', transition:`background ${transitions.fast}` }} />
                </button>
              )
            })}
          </div>

          {/* Nav › */}
          <button className="nav-btn" onClick={() => goDay(1)} style={{ flexShrink:0 }}>
            <ChevronRight size={16} strokeWidth={2.5} />
          </button>
        </div>
      </div>
    </div>
  )
}