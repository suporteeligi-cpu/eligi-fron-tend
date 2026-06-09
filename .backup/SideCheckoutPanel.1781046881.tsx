'use client'
// src/features/booking/components/SideCheckoutPanel.tsx
//
// Fase 6.3 refator: agora suporta modo 'edit' de verdade.
// - Recebe checkout.booking do store quando mode==='edit'
// - Busca detalhe via GET /bookings/:id pra preencher form
// - Save em edit faz PATCH /bookings/:id (cancela Sale OPEN linkada automaticamente)
// - Em edit, "adicionar outro serviço" é bloqueado (1 booking = 1 serviço)

import { useState, useEffect, useRef, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { X, ChevronRight, Clock, Check, Search, Plus, Star, Trash2, Calendar, ChevronDown, User, Loader2 } from 'lucide-react'
import dayjs from 'dayjs'
import 'dayjs/locale/pt-br'
import utc      from 'dayjs/plugin/utc'
import timezone from 'dayjs/plugin/timezone'
import api from '@/shared/lib/apiClient'
import { AgendaProfessional, AgendaBooking } from '@/features/agenda/types'
import { colors, glass, typography, radius, shadows, transitions } from '@/shared/theme'
import { useIsMobile } from '@/hooks/useIsMobile'
import { useAgendaStore } from '@/features/agenda/hooks/useAgendaStore'

dayjs.extend(utc)
dayjs.extend(timezone)
dayjs.locale('pt-br')

// ─── Modal de confirmação padrão eligi ────────────────────────────────────────
function ConfirmModal({ title, confirmLabel, onConfirm, onCancel, isMobile }: {
  title:string; confirmLabel:string; onConfirm:()=>void; onCancel:()=>void; isMobile:boolean
}) {
  const content = isMobile ? (
    <>
      <div onClick={onCancel} style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.32)',backdropFilter:'blur(8px)',zIndex:10998}}/>
      <div style={{position:'fixed',bottom:0,left:0,right:0,background:'rgba(255,255,255,0.99)',borderRadius:'24px 24px 0 0',boxShadow:'0 -8px 40px rgba(0,0,0,0.15)',zIndex:10999,padding:`28px 24px max(36px,env(safe-area-inset-bottom))`,textAlign:'center',fontFamily:typography.fontFamily,animation:'cmUp 0.28s cubic-bezier(0.34,1.2,0.64,1)'}}>
        <style>{`@keyframes cmUp{from{transform:translateY(100%)}to{transform:translateY(0)}}`}</style>
        <div style={{width:40,height:4,borderRadius:2,background:'rgba(0,0,0,0.12)',margin:'0 auto 24px'}}/>
        <div style={{width:44,height:44,borderRadius:13,background:'linear-gradient(145deg,#ef4444,#dc2626,#b91c1c)',display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 16px',boxShadow:'0 6px 18px rgba(220,38,38,0.30)'}}>
          <span style={{color:'#fff',fontWeight:800,fontSize:20,letterSpacing:'-0.04em'}}>e</span>
        </div>
        <h3 style={{margin:'0 0 22px',fontSize:17,fontWeight:700,color:'#0f0f14',lineHeight:1.3,whiteSpace:'pre-line'}}>{title}</h3>
        <button onClick={onConfirm} style={{width:'100%',padding:'15px',marginBottom:10,background:'linear-gradient(135deg,#dc2626,#b91c1c)',color:'#fff',border:'none',borderRadius:13,fontWeight:700,fontSize:14,cursor:'pointer',letterSpacing:'0.04em',textTransform:'uppercase' as const,boxShadow:'0 4px 16px rgba(220,38,38,0.28)'}}>{confirmLabel}</button>
        <button onClick={onCancel} style={{width:'100%',padding:'14px',background:'transparent',border:'1px solid rgba(0,0,0,0.08)',borderRadius:13,fontSize:14,cursor:'pointer',color:'rgba(0,0,0,0.45)',fontWeight:500}}>Voltar</button>
      </div>
    </>
  ) : (
    <>
      <div onClick={onCancel} style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.28)',backdropFilter:'blur(8px)',zIndex:10998}}/>
      <div style={{position:'fixed',top:'50%',left:'50%',transform:'translate(-50%,-50%)',width:340,maxWidth:'88vw',background:'rgba(255,255,255,0.98)',borderRadius:22,boxShadow:'0 32px 72px rgba(0,0,0,0.18)',zIndex:10999,padding:'32px 24px 22px',fontFamily:typography.fontFamily,textAlign:'center',animation:'cmIn 0.22s cubic-bezier(0.34,1.56,0.64,1)'}}>
        <style>{`@keyframes cmIn{from{opacity:0;transform:translate(-50%,-50%) scale(0.93)}to{opacity:1;transform:translate(-50%,-50%) scale(1)}}`}</style>
        <div style={{width:44,height:44,borderRadius:13,background:'linear-gradient(145deg,#ef4444,#dc2626,#b91c1c)',display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 18px',boxShadow:'0 6px 18px rgba(220,38,38,0.30)'}}>
          <span style={{color:'#fff',fontWeight:800,fontSize:20,letterSpacing:'-0.04em'}}>e</span>
        </div>
        <h3 style={{margin:'0 0 24px',fontSize:18,fontWeight:700,color:'#0f0f14',lineHeight:1.3,letterSpacing:'-0.02em',whiteSpace:'pre-line'}}>{title}</h3>
        <button onClick={onConfirm} style={{width:'100%',padding:'14px',marginBottom:10,background:'linear-gradient(135deg,#dc2626,#b91c1c)',color:'#fff',border:'none',borderRadius:13,fontWeight:700,fontSize:14,cursor:'pointer',letterSpacing:'0.04em',textTransform:'uppercase' as const,boxShadow:'0 4px 16px rgba(220,38,38,0.28)'}}>{confirmLabel}</button>
        <button onClick={onCancel} style={{width:'100%',padding:'13px',background:'transparent',border:'1px solid rgba(0,0,0,0.08)',borderRadius:13,fontSize:14,cursor:'pointer',color:'rgba(0,0,0,0.45)',fontWeight:500}}>Voltar</button>
      </div>
    </>
  )
  if (typeof document==='undefined') return null
  return createPortal(content, document.body)
}

// ─── Types ────────────────────────────────────────────────────────────────────
type Service = { id: string; name: string; duration: number; price?: number }
type Client  = { id: string; name: string; phone: string }

interface ServiceItem {
  service:   Service
  startTime: string
  endTime:   string
  profId:    string
  mode?:     'after' | 'parallel'   // só relevante para idx >= 1 (1º item não tem âncora)
}

interface Props {
  open:            boolean
  mode:            'create' | 'edit'
  time:            string | null
  professionalId:  string | null
  professionals:   AgendaProfessional[]
  selectedDate:    Date
  existingBooking?: AgendaBooking | null   // ← novo: passado pelo AgendaBoard em modo edit
  prefillClient?:   { id: string; name: string; phone: string } | null  // ← adicionar serviço: cliente herdado
  addToGroupRefId?: string | null   // ← adicionar serviço: booking de referência do grupo
  onClose:         () => void
  onDateChange?:   (date: Date) => void
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function generateTimeSlots(): string[] {
  const s: string[] = []
  for (let h = 6; h < 23; h++)
    for (let m = 0; m < 60; m += 5)
      s.push(`${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`)
  return s
}
const TIME_SLOTS = generateTimeSlots()
const ITEM_H = 36, VISIBLE = 3

function addMinutes(time: string, min: number): string {
  const [h, m] = time.split(':').map(Number)
  const total  = h * 60 + m + min
  return `${String(Math.floor(total/60)).padStart(2,'0')}:${String(total%60).padStart(2,'00')}`
}
function fmtPhone(p: string) {
  const d = p.replace(/\D/g,'')
  if (d.length === 11) return `(${d.slice(0,2)}) ${d.slice(2,7)}-${d.slice(7)}`
  if (d.length === 10) return `(${d.slice(0,2)}) ${d.slice(2,6)}-${d.slice(6)}`
  return p
}
function getInitials(name: string) {
  return name.split(' ').slice(0,2).map(w=>w[0]).join('').toUpperCase()
}

// ─── Helpers de cadeia (Frente 2: paralelo/sequencial) ─────────────────────────
function toMin(t: string): number {
  const [h, m] = t.split(':').map(Number)
  return (h || 0) * 60 + (m || 0)
}

// Re-deriva startTime/endTime a partir de `fromIdx`.
// Itens [0..fromIdx) ficam intactos (valores manuais preservados);
// itens [fromIdx..] têm o start derivado da cadeia conforme o `mode`:
//   'parallel' → mesmo início do item anterior · 'after' → começa no fim do anterior.
// O 1º item (idx 0) nunca é derivado: mantém o start, só recalcula o fim.
function recomputeFrom(items: ServiceItem[], fromIdx: number): ServiceItem[] {
  const out: ServiceItem[] = items.slice(0, Math.max(0, fromIdx)).map(x => ({ ...x }))
  for (let i = Math.max(0, fromIdx); i < items.length; i++) {
    const it = items[i]
    if (i === 0) {
      const endTime = it.service ? addMinutes(it.startTime, it.service.duration) : it.endTime
      out.push({ ...it, endTime })
      continue
    }
    const prev      = out[i - 1]
    const startTime = it.mode === 'parallel'
      ? prev.startTime
      : (prev.endTime || prev.startTime)
    const endTime   = it.service ? addMinutes(startTime, it.service.duration) : startTime
    out.push({ ...it, startTime, endTime })
  }
  return out
}

// Escolhe o 1º profissional que NÃO está ocupado por outro item do painel
// no intervalo [start, end). Usado ao virar um item para 'parallel'.
// Fallback: null (mantém o prof atual) quando todos estão ocupados.
function pickFreeProf(
  items: ServiceItem[], idx: number, start: string, end: string,
  professionals: AgendaProfessional[],
): string | null {
  const s = toMin(start)
  const e = toMin(end || start)
  const used = new Set<string>()
  items.forEach((it, i) => {
    if (i === idx || !it.profId) return
    const is = toMin(it.startTime)
    const ie = toMin(it.endTime || it.startTime)
    if (is < e && ie > s) used.add(it.profId)
  })
  return professionals.find(p => !used.has(p.id))?.id ?? null
}

// ─── TimeWheel ────────────────────────────────────────────────────────────────
function TimeWheel({ value, onChange }: { value: string; onChange: (t: string) => void }) {
  const ref        = useRef<HTMLDivElement>(null)
  const isDragging = useRef(false)
  const startY     = useRef(0)
  const startScroll= useRef(0)
  const timer      = useRef<ReturnType<typeof setTimeout>|null>(null)
  const idx        = TIME_SLOTS.indexOf(value)
  const pad        = Math.floor(VISIBLE / 2)

  const scrollTo = useCallback((i: number, smooth = true) => {
    ref.current?.scrollTo({ top: i * ITEM_H, behavior: smooth ? 'smooth' : 'instant' })
  }, [])

  useEffect(() => { if (idx >= 0) scrollTo(idx, false) }, [idx, scrollTo])

  const snap = useCallback(() => {
    if (!ref.current) return
    const i = Math.max(0, Math.min(Math.round(ref.current.scrollTop / ITEM_H), TIME_SLOTS.length-1))
    scrollTo(i); onChange(TIME_SLOTS[i])
  }, [onChange, scrollTo])

  return (
    <div style={{ position:'relative', height:VISIBLE*ITEM_H, userSelect:'none', flex:1 }}>
      <div style={{ position:'absolute', top:0, left:0, right:0, height:pad*ITEM_H, background:`linear-gradient(to bottom,${colors.background.page},transparent)`, zIndex:2, pointerEvents:'none' }} />
      <div style={{ position:'absolute', top:pad*ITEM_H, left:0, right:0, height:ITEM_H, background:colors.red.subtle, borderTop:`1px solid ${colors.red.border}`, borderBottom:`1px solid ${colors.red.border}`, zIndex:2, pointerEvents:'none' }} />
      <div style={{ position:'absolute', bottom:0, left:0, right:0, height:pad*ITEM_H, background:`linear-gradient(to top,${colors.background.page},transparent)`, zIndex:2, pointerEvents:'none' }} />
      <div ref={ref}
        onScroll={() => { if (timer.current) clearTimeout(timer.current); timer.current = setTimeout(snap, 100) }}
        onTouchStart={e => { startY.current=e.touches[0].clientY; startScroll.current=ref.current?.scrollTop??0 }}
        onTouchMove={e => { if (ref.current) ref.current.scrollTop=startScroll.current+(startY.current-e.touches[0].clientY) }}
        onTouchEnd={snap}
        onMouseDown={e => { isDragging.current=true; startY.current=e.clientY; startScroll.current=ref.current?.scrollTop??0 }}
        onMouseMove={e => { if (isDragging.current && ref.current) ref.current.scrollTop=startScroll.current+(startY.current-e.clientY) }}
        onMouseUp={() => { isDragging.current=false; snap() }}
        onMouseLeave={() => { isDragging.current=false; snap() }}
        style={{ height:'100%', overflowY:'scroll', scrollbarWidth:'none', cursor:'grab' }}
      >
        <div style={{ height:pad*ITEM_H }} />
        {TIME_SLOTS.map((t, i) => {
          const dist = Math.abs(i - idx)
          return (
            <div key={t} onClick={() => { onChange(t); scrollTo(i) }} style={{ height:ITEM_H, display:'flex', alignItems:'center', justifyContent:'center', fontSize:15, fontWeight:dist===0?700:400, color:dist===0?colors.red.DEFAULT:colors.gray.dimText, opacity:dist===0?1:dist===1?0.6:0.28, transform:`scale(${dist===0?1:dist===1?0.9:0.8})`, transition:`all ${transitions.fast}`, cursor:'pointer', fontVariantNumeric:'tabular-nums' }}>
              {t}
            </div>
          )
        })}
        <div style={{ height:pad*ITEM_H }} />
      </div>
    </div>
  )
}

// ─── DatePickerModal ──────────────────────────────────────────────────────────
function DatePickerModal({ date, onSelect, onClose, isMobile }: {
  date: dayjs.Dayjs; onSelect:(d:dayjs.Dayjs)=>void; onClose:()=>void; isMobile:boolean
}) {
  const today = dayjs()
  const [view, setView] = useState(date.startOf('month'))
  const DAYS_H = ['SEG','TER','QUA','QUI','SEX','SÁB','DOM']
  const MONTHS = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro']

  function buildGrid(month: dayjs.Dayjs) {
    const first  = month.startOf('month')
    const offset = (first.day() + 6) % 7
    const cells: (dayjs.Dayjs|null)[] = []
    for (let i=0;i<offset;i++) cells.push(null)
    for (let d=1;d<=month.daysInMonth();d++) cells.push(month.date(d))
    while (cells.length%7!==0) cells.push(null)
    return cells
  }
  const grid = buildGrid(view)

  const content = (
    <>
      <div onClick={onClose} style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.22)',backdropFilter:'blur(6px)',zIndex:10998}}/>
      <div style={isMobile ? {position:'fixed',bottom:0,left:0,right:0,background:'rgba(255,255,255,0.99)',borderRadius:'24px 24px 0 0',boxShadow:'0 -8px 40px rgba(0,0,0,0.15)',zIndex:10999,fontFamily:typography.fontFamily,animation:'dpUp 0.28s cubic-bezier(0.34,1.2,0.64,1)',paddingBottom:'max(20px,env(safe-area-inset-bottom))'} : {position:'fixed',top:'50%',left:'50%',transform:'translate(-50%,-50%)',width:320,background:'rgba(255,255,255,0.99)',borderRadius:radius['2xl'],boxShadow:shadows.lg,zIndex:10999,fontFamily:typography.fontFamily,animation:'dpIn 0.22s cubic-bezier(0.34,1.56,0.64,1)',overflow:'hidden'}}>
        <style>{`@keyframes dpIn{from{opacity:0;transform:translate(-50%,-50%) scale(0.93)}to{opacity:1;transform:translate(-50%,-50%) scale(1)}}@keyframes dpUp{from{transform:translateY(100%)}to{transform:translateY(0)}}`}</style>
        {isMobile && <div style={{display:'flex',justifyContent:'center',padding:'12px 0 4px'}}><div style={{width:40,height:4,borderRadius:2,background:'rgba(0,0,0,0.12)'}}/></div>}
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'14px 20px 10px'}}>
          <button onClick={()=>setView(v=>v.subtract(1,'month'))} style={{width:32,height:32,borderRadius:'50%',border:`1px solid ${colors.gray.borderMd}`,background:'transparent',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center'}}>
            <ChevronRight size={16} color={colors.gray[700]} style={{transform:'rotate(180deg)'}} strokeWidth={2.5}/>
          </button>
          <span style={{fontSize:16,fontWeight:700,color:colors.gray[900]}}>{MONTHS[view.month()]} {view.year()}</span>
          <button onClick={()=>setView(v=>v.add(1,'month'))} style={{width:32,height:32,borderRadius:'50%',border:`1px solid ${colors.gray.borderMd}`,background:'transparent',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center'}}>
            <ChevronRight size={16} color={colors.gray[700]} strokeWidth={2.5}/>
          </button>
        </div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(7,1fr)',padding:'0 16px 4px'}}>
          {DAYS_H.map(d=><div key={d} style={{textAlign:'center',fontSize:10,fontWeight:700,color:colors.gray.dimText,letterSpacing:'.06em',padding:'4px 0'}}>{d}</div>)}
        </div>
        <div style={{padding:'0 16px 16px'}}>
          {Array.from({length:grid.length/7},(_,row)=>(
            <div key={row} style={{display:'grid',gridTemplateColumns:'repeat(7,1fr)',gap:2,marginBottom:2}}>
              {grid.slice(row*7,row*7+7).map((day,ci)=>{
                if (!day) return <div key={ci}/>
                const isSel    = day.isSame(date,'day')
                const isTodayD = day.isSame(today,'day')
                const isOther  = day.month()!==view.month()
                return (
                  <button key={ci} onClick={()=>{onSelect(day);onClose()}} style={{height:36,borderRadius:'50%',border:'none',background:isSel?colors.red.gradient:'transparent',color:isSel?'#fff':isTodayD?colors.red.DEFAULT:isOther?'rgba(0,0,0,0.2)':colors.gray[900],fontWeight:isSel||isTodayD?700:500,fontSize:13,cursor:'pointer',position:'relative',boxShadow:isSel?`0 3px 10px ${colors.red.glow}`:'none'}}>
                    {day.date()}
                    {isTodayD&&!isSel&&<div style={{position:'absolute',bottom:3,left:'50%',transform:'translateX(-50%)',width:4,height:4,borderRadius:'50%',background:colors.red.DEFAULT}}/>}
                  </button>
                )
              })}
            </div>
          ))}
        </div>
      </div>
    </>
  )
  if (typeof document==='undefined') return null
  return createPortal(content, document.body)
}

// ─── ServiceSheet ─────────────────────────────────────────────────────────────
function ServiceSheet({ services, selected, loading, onSelect, onClose }: {
  services:Service[]; selected:Service|null; loading:boolean
  onSelect:(s:Service)=>void; onClose:()=>void
}) {
  const isMobile = useIsMobile()
  const [q, setQ] = useState('')
  const filtered = services.filter(s => s.name.toLowerCase().includes(q.toLowerCase()))

  const style = isMobile ? {
    position:'fixed' as const, left:0, right:0, bottom:0, height:'88dvh',
    background:glass.surface.modal.background, backdropFilter:glass.surface.modal.backdropFilter,
    WebkitBackdropFilter:glass.surface.modal.backdropFilter,
    borderRadius:`${radius['2xl']}px ${radius['2xl']}px 0 0`,
    boxShadow:'0 -8px 40px rgba(0,0,0,0.15)', zIndex:10999,
    display:'flex', flexDirection:'column' as const, fontFamily:typography.fontFamily,
    animation:'sheetUp 0.28s cubic-bezier(0.34,1.2,0.64,1)',
  } : {
    position:'fixed' as const, top:0, right:0, bottom:0, width:360,
    background:glass.surface.modal.background, backdropFilter:glass.surface.modal.backdropFilter,
    WebkitBackdropFilter:glass.surface.modal.backdropFilter,
    borderLeft:`1px solid ${colors.gray.borderMd}`,
    boxShadow:`-8px 0 32px rgba(0,0,0,0.12)`, zIndex:10999,
    display:'flex', flexDirection:'column' as const, fontFamily:typography.fontFamily,
    animation:'sheetIn 0.2s cubic-bezier(0.25,0.46,0.45,0.94)',
  }

  return createPortal(
    <>
      <div onClick={onClose} style={{position:'fixed',inset:0,zIndex:10998,background:colors.background.overlay}}/>
      <div style={style}>
        <style>{`@keyframes sheetIn{from{transform:translateX(100%)}to{transform:translateX(0)}}@keyframes sheetUp{from{transform:translateY(100%)}to{transform:translateY(0)}}`}</style>
        {isMobile && <div style={{display:'flex',justifyContent:'center',padding:'12px 0 4px',flexShrink:0}}><div style={{width:40,height:4,borderRadius:2,background:'rgba(0,0,0,0.12)'}}/></div>}
        <div style={{padding:'14px 20px',borderBottom:`1px solid ${colors.gray.border}`,display:'flex',alignItems:'center',justifyContent:'space-between',flexShrink:0}}>
          <h3 style={{margin:0,fontSize:16,fontWeight:700,color:colors.gray[900]}}>Selecione o serviço</h3>
          <button onClick={onClose} style={{width:28,height:28,borderRadius:radius.full,border:`1px solid ${colors.gray.borderMd}`,background:'transparent',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center'}}>
            <X size={14} color={colors.gray.dimText}/>
          </button>
        </div>
        <div style={{padding:'10px 16px',borderBottom:`1px solid ${colors.gray.border}`,flexShrink:0}}>
          <div style={{display:'flex',alignItems:'center',gap:8,padding:'8px 12px',borderRadius:10,background:colors.background.page,border:`1px solid ${colors.gray.borderMd}`}}>
            <Search size={14} color={colors.gray.dimText}/>
            <input value={q} onChange={e=>setQ(e.target.value)} placeholder="Buscar serviço..." style={{flex:1,border:'none',outline:'none',fontSize:13,background:'transparent',color:colors.gray[900],fontFamily:typography.fontFamily}}/>
          </div>
        </div>
        <div style={{flex:1,overflowY:'auto'}}>
          {loading ? <div style={{padding:32,textAlign:'center',color:colors.gray.dimText}}>Carregando...</div>
          : filtered.length===0 ? <div style={{padding:32,textAlign:'center',color:colors.gray.dimText}}>Nenhum serviço encontrado</div>
          : filtered.map(s=>(
            <button key={s.id} onClick={()=>{onSelect(s);onClose()}} style={{width:'100%',display:'flex',alignItems:'center',gap:12,padding:'14px 20px',border:'none',borderBottom:`1px solid ${colors.gray.border}`,background:selected?.id===s.id?colors.red.subtle:'transparent',cursor:'pointer',textAlign:'left',transition:`background ${transitions.fast}`}}
              onMouseEnter={e=>(e.currentTarget.style.background=selected?.id===s.id?colors.red.subtle:colors.gray.hover)}
              onMouseLeave={e=>(e.currentTarget.style.background=selected?.id===s.id?colors.red.subtle:'transparent')}
            >
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontSize:14,fontWeight:600,color:colors.gray[900]}}>{s.name}</div>
                <div style={{fontSize:12,color:colors.gray.dimText,marginTop:2,display:'flex',alignItems:'center',gap:4}}>
                  <Clock size={11} strokeWidth={2} color={colors.gray.dimText}/>{s.duration}min
                  {s.price!=null&&<span style={{marginLeft:4}}>· R$ {s.price.toFixed(2).replace('.',',')}</span>}
                </div>
              </div>
              {selected?.id===s.id ? <Check size={16} color={colors.red.DEFAULT} strokeWidth={2.5}/> : <div style={{width:18,height:18,borderRadius:radius.full,border:`1.5px solid ${colors.gray.borderMd}`,flexShrink:0}}/>}
            </button>
          ))}
        </div>
      </div>
    </>,
    document.body
  )
}

// ─── ClientSearchSheet ────────────────────────────────────────────────────────
function ClientSearchSheet({ selected, onSelect, onClose, onCreateNew }: {
  selected:Client|null; onSelect:(c:Client|null)=>void; onClose:()=>void; onCreateNew:()=>void
}) {
  const [query,   setQuery]   = useState('')
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const isMobile = useIsMobile()

  useEffect(() => { setTimeout(()=>inputRef.current?.focus(),100) }, [])

  useEffect(() => {
    const t = setTimeout(async () => {
      try {
        setLoading(true)
        const res  = await api.get('/clients',{params:{search:query||undefined,limit:30}})
        const data = res.data?.data??res.data
        setClients(data.clients??[])
      } catch { setClients([]) }
      finally  { setLoading(false) }
    }, 300)
    return () => clearTimeout(t)
  }, [query])

  const style = isMobile ? {
    position:'fixed' as const, left:0, right:0, bottom:0, height:'92dvh',
    background:glass.surface.modal.background, backdropFilter:glass.surface.modal.backdropFilter,
    WebkitBackdropFilter:glass.surface.modal.backdropFilter,
    borderRadius:`${radius['2xl']}px ${radius['2xl']}px 0 0`,
    boxShadow:'0 -8px 40px rgba(0,0,0,0.15)', zIndex:10999,
    display:'flex', flexDirection:'column' as const, fontFamily:typography.fontFamily,
    animation:'sheetUp 0.28s cubic-bezier(0.34,1.2,0.64,1)',
  } : {
    position:'fixed' as const, top:0, right:0, bottom:0, width:400,
    background:glass.surface.modal.background, backdropFilter:glass.surface.modal.backdropFilter,
    WebkitBackdropFilter:glass.surface.modal.backdropFilter,
    borderLeft:`1px solid ${colors.gray.borderMd}`,
    boxShadow:`-8px 0 32px rgba(0,0,0,0.12)`, zIndex:10999,
    display:'flex', flexDirection:'column' as const, fontFamily:typography.fontFamily,
    animation:'sheetIn 0.2s cubic-bezier(0.25,0.46,0.45,0.94)',
  }

  const grouped = clients.reduce((acc, c) => {
    const letter = c.name[0]?.toUpperCase() ?? '#'
    if (!acc[letter]) acc[letter] = []
    acc[letter].push(c)
    return acc
  }, {} as Record<string,Client[]>)

  return createPortal(
    <>
      <div onClick={onClose} style={{position:'fixed',inset:0,zIndex:10998,background:colors.background.overlay}}/>
      <div style={style}>
        <style>{`@keyframes sheetIn{from{transform:translateX(100%)}to{transform:translateX(0)}}@keyframes sheetUp{from{transform:translateY(100%)}to{transform:translateY(0)}}`}</style>
        {isMobile && <div style={{display:'flex',justifyContent:'center',padding:'12px 0 4px',flexShrink:0}}><div style={{width:40,height:4,borderRadius:2,background:'rgba(0,0,0,0.12)'}}/></div>}
        <div style={{padding:'14px 20px 10px',flexShrink:0,display:'flex',alignItems:'center',gap:12}}>
          <button onClick={onClose} style={{width:32,height:32,borderRadius:'50%',border:`1px solid ${colors.gray.borderMd}`,background:'transparent',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center'}}>
            <ChevronRight size={16} color={colors.gray[700]} style={{transform:'rotate(180deg)'}} strokeWidth={2.5}/>
          </button>
          <h3 style={{margin:0,fontSize:17,fontWeight:700,color:colors.gray[900]}}>Busca de clientes</h3>
        </div>
        <div style={{padding:'0 16px 10px',flexShrink:0}}>
          <div style={{display:'flex',alignItems:'center',gap:8,padding:'10px 14px',borderRadius:12,border:`1px solid ${colors.gray.borderMd}`,background:colors.background.page}}>
            <Search size={16} color={colors.gray.dimText}/>
            <input ref={inputRef} value={query} onChange={e=>setQuery(e.target.value)} placeholder="Digite o nome, número de telefone..." style={{flex:1,border:'none',outline:'none',fontSize:14,background:'transparent',color:colors.gray[900],fontFamily:typography.fontFamily}}/>
          </div>
        </div>
        <div style={{flex:1,overflowY:'auto'}}>
          <button onClick={()=>{onClose();onCreateNew()}} style={{width:'100%',display:'flex',alignItems:'center',gap:14,padding:'14px 20px',border:'none',borderBottom:`1px solid ${colors.gray.border}`,background:'transparent',cursor:'pointer',textAlign:'left'}}
            onMouseEnter={e=>(e.currentTarget.style.background=colors.gray.hover)}
            onMouseLeave={e=>(e.currentTarget.style.background='transparent')}
          >
            <div style={{width:40,height:40,borderRadius:'50%',border:`2px dashed ${colors.red.border}`,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
              <Plus size={18} color={colors.red.DEFAULT} strokeWidth={2}/>
            </div>
            <span style={{fontSize:14,fontWeight:600,color:colors.red.DEFAULT}}>Adicionar novo cliente</span>
          </button>

          {loading ? <div style={{padding:32,textAlign:'center',color:colors.gray.dimText}}>Buscando...</div>
          : clients.length===0 ? (
            <div style={{padding:'32px 20px',textAlign:'center',color:colors.gray.dimText}}>
              <Search size={28} style={{opacity:0.2,marginBottom:8}}/>
              <div style={{fontSize:14}}>Nenhum cliente encontrado</div>
            </div>
          ) : Object.keys(grouped).sort().map(letter=>(
            <div key={letter}>
              <div style={{padding:'8px 20px 4px',fontSize:12,fontWeight:700,color:colors.gray.dimText,letterSpacing:'.07em',background:colors.background.page}}>{letter}</div>
              {grouped[letter].map(c=>{
                const isSel = selected?.id===c.id
                return (
                  <button key={c.id} onClick={()=>{onSelect(c);onClose()}} style={{width:'100%',display:'flex',alignItems:'center',gap:14,padding:'12px 20px',border:'none',borderBottom:`1px solid ${colors.gray.border}`,background:isSel?colors.red.subtle:'transparent',cursor:'pointer',textAlign:'left',transition:`background ${transitions.fast}`}}
                    onMouseEnter={e=>(e.currentTarget.style.background=isSel?colors.red.subtle:colors.gray.hover)}
                    onMouseLeave={e=>(e.currentTarget.style.background=isSel?colors.red.subtle:'transparent')}
                  >
                    <div style={{width:40,height:40,borderRadius:'50%',background:isSel?colors.red.gradient:colors.background.page,border:`1px solid ${isSel?'transparent':colors.gray.borderMd}`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:13,fontWeight:700,color:isSel?'#fff':colors.gray[700],flexShrink:0,boxShadow:isSel?`0 2px 8px ${colors.red.glow}`:'none'}}>
                      {getInitials(c.name)}
                    </div>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontSize:14,fontWeight:600,color:colors.gray[900],whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{c.name}</div>
                      {c.phone&&<div style={{fontSize:12,color:colors.gray.dimText,marginTop:1}}>{fmtPhone(c.phone)}</div>}
                    </div>
                    {isSel&&<Check size={16} color={colors.red.DEFAULT} strokeWidth={2.5}/>}
                  </button>
                )
              })}
            </div>
          ))}
        </div>
      </div>
    </>,
    document.body
  )
}

// ─── CreateClientSheet ────────────────────────────────────────────────────────
function CreateClientSheet({ onCreated, onClose }: {
  onCreated:(c:Client)=>void; onClose:()=>void
}) {
  const isMobile = useIsMobile()
  const [name,  setName]  = useState('')
  const [phone, setPhone] = useState('')
  const [saving,setSaving]= useState('')

  async function handleSave() {
    if (!name.trim()) return
    try {
      setSaving('saving')
      const res = await api.post('/clients',{name:name.trim(),phone:phone.trim()})
      const c   = res.data?.data??res.data
      onCreated({id:c.id,name:c.name,phone:c.phone??''})
    } catch { setSaving('error') }
  }

  const style = isMobile ? {
    position:'fixed' as const, left:0, right:0, bottom:0, height:'60dvh',
    background:'rgba(255,255,255,0.99)', borderRadius:`${radius['2xl']}px ${radius['2xl']}px 0 0`,
    boxShadow:'0 -8px 40px rgba(0,0,0,0.15)', zIndex:11000,
    display:'flex', flexDirection:'column' as const, fontFamily:typography.fontFamily,
    animation:'sheetUp 0.28s cubic-bezier(0.34,1.2,0.64,1)',
    paddingBottom:'max(20px,env(safe-area-inset-bottom))',
  } : {
    position:'fixed' as const, top:'50%', left:'50%', transform:'translate(-50%,-50%)',
    width:360, background:'rgba(255,255,255,0.99)', borderRadius:radius['2xl'],
    boxShadow:shadows.lg, zIndex:11000, fontFamily:typography.fontFamily,
    animation:'cmIn 0.22s cubic-bezier(0.34,1.56,0.64,1)', overflow:'hidden',
  }

  return createPortal(
    <>
      <div onClick={onClose} style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.25)',backdropFilter:'blur(6px)',zIndex:10999}}/>
      <div style={style}>
        <style>{`@keyframes sheetUp{from{transform:translateY(100%)}to{transform:translateY(0)}}@keyframes cmIn{from{opacity:0;transform:translate(-50%,-50%) scale(0.93)}to{opacity:1;transform:translate(-50%,-50%) scale(1)}}`}</style>
        {isMobile&&<div style={{display:'flex',justifyContent:'center',padding:'12px 0 8px'}}><div style={{width:40,height:4,borderRadius:2,background:'rgba(0,0,0,0.12)'}}/></div>}
        <div style={{padding:'16px 20px 14px',borderBottom:`1px solid ${colors.gray.border}`,display:'flex',alignItems:'center',justifyContent:'space-between',flexShrink:0}}>
          <h3 style={{margin:0,fontSize:16,fontWeight:700,color:colors.gray[900]}}>Novo cliente</h3>
          <button onClick={onClose} style={{width:28,height:28,borderRadius:radius.full,border:`1px solid ${colors.gray.borderMd}`,background:'transparent',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center'}}>
            <X size={14} color={colors.gray.dimText}/>
          </button>
        </div>
        <div style={{padding:'16px 20px',display:'flex',flexDirection:'column',gap:12,flex:1}}>
          <div>
            <div style={{fontSize:11,fontWeight:700,color:colors.gray.dimText,textTransform:'uppercase',letterSpacing:'.07em',marginBottom:6}}>Nome *</div>
            <input value={name} onChange={e=>setName(e.target.value)} placeholder="Nome completo" style={{width:'100%',padding:'10px 12px',borderRadius:9,border:`1px solid ${colors.gray.borderMd}`,fontSize:14,outline:'none',fontFamily:typography.fontFamily,boxSizing:'border-box'}}/>
          </div>
          <div>
            <div style={{fontSize:11,fontWeight:700,color:colors.gray.dimText,textTransform:'uppercase',letterSpacing:'.07em',marginBottom:6}}>Telefone</div>
            <input value={phone} onChange={e=>setPhone(e.target.value)} placeholder="(11) 99999-9999" style={{width:'100%',padding:'10px 12px',borderRadius:9,border:`1px solid ${colors.gray.borderMd}`,fontSize:14,outline:'none',fontFamily:typography.fontFamily,boxSizing:'border-box'}}/>
          </div>
          {saving==='error'&&<div style={{fontSize:12,color:colors.red.DEFAULT}}>Erro ao criar cliente. Tente novamente.</div>}
        </div>
        <div style={{padding:'0 20px 8px',display:'flex',gap:8}}>
          <button onClick={onClose} style={{flex:1,padding:'12px',borderRadius:10,border:`1px solid ${colors.gray.borderMd}`,background:'transparent',fontSize:13,cursor:'pointer',color:colors.gray[700],fontWeight:600}}>Cancelar</button>
          <button onClick={handleSave} disabled={!name.trim()||saving==='saving'} style={{flex:2,padding:'12px',borderRadius:10,border:'none',background:colors.red.gradient,color:'#fff',fontSize:13,cursor:'pointer',fontWeight:700,boxShadow:shadows.redSm,opacity:!name.trim()?0.5:1}}>
            {saving==='saving'?'Salvando...':'Criar cliente'}
          </button>
        </div>
      </div>
    </>,
    document.body
  )
}

// ─── SideCheckoutPanel ────────────────────────────────────────────────────────
export default function SideCheckoutPanel({
  open, mode, time, professionalId, professionals, selectedDate,
  existingBooking, prefillClient, addToGroupRefId, onClose, onDateChange,
}: Props) {
  const isMobile = useIsMobile()
  const { setPreview, setSelectedDate } = useAgendaStore()

  const [tab,           setTab]          = useState<'booking'|'info'>('booking')
  const [selectedClient,setSelectedClient]= useState<Client|null>(null)
  const [services,      setServices]     = useState<Service[]>([])
  const [servicesLoad,  setServicesLoad] = useState(false)

  // Múltiplos serviços
  const [items, setItems] = useState<ServiceItem[]>([])
  const firstItem = items[0]
  const total     = items.reduce((acc, it) => acc + (it.service?.price ?? 0), 0)

  // Data
  const [date, setDate] = useState<dayjs.Dayjs>(dayjs(selectedDate))
  const [showDatePicker,setShowDatePicker] = useState(false)

  const [showSvcSheet,  setShowSvcSheet]   = useState(false)
  const [addingSvcIdx,  setAddingSvcIdx]   = useState<number>(-1)
  const [showClientSheet,setShowClientSheet]= useState(false)
  const [showCreateClient,setShowCreateClient]= useState(false)

  // Notas e mensagem (aba Informações)
  const [internalNote, setInternalNote] = useState('')
  const [clientMessage,setClientMessage]= useState('')

  const [saving,  setSaving]  = useState(false)
  const [success, setSuccess] = useState(false)
  const [error,   setError]   = useState<string|null>(null)
  const [pendingOverlap, setPendingOverlap] = useState(false)

  // Loading do detalhe do booking (apenas em mode === 'edit')
  const [loadingBooking, setLoadingBooking] = useState(false)

  const isEdit = mode === 'edit'

  // ── Reset ao abrir ────────────────────────────────────────────────────────
  useEffect(() => {
    if (!open) return
    setTab('booking')
    setSuccess(false); setError(null); setPendingOverlap(false)
    setInternalNote(''); setClientMessage('')

    const initTime  = time ?? '09:00'
    const initProf  = professionalId ?? professionals[0]?.id ?? ''
    const initDate  = dayjs(selectedDate)

    setDate(initDate)
    setSelectedClient(prefillClient ?? null)
    setAddingSvcIdx(-1)

    if (mode === 'create') {
      setItems([{ service: null as unknown as Service, startTime: initTime, endTime: '', profId: initProf }])
    } else {
      // mode === 'edit': aguardando fetch do detalhe (logo abaixo)
      setItems([])
    }
  }, [open, mode, time, professionalId, professionals, selectedDate])

  // ── Busca serviços ao abrir ───────────────────────────────────────────────
  useEffect(() => {
    if (!open) return
    setServicesLoad(true)
    api.get('/services').then(res => {
      const data = res.data?.data ?? res.data
      setServices(Array.isArray(data) ? data : data.services ?? [])
    }).catch(()=>{}).finally(()=>setServicesLoad(false))
  }, [open])

  // ── Busca detalhe do booking (modo edit) ──────────────────────────────────
  useEffect(() => {
    if (!open || mode !== 'edit' || !existingBooking) return

    let cancelled = false

    const tLoad = setTimeout(async () => {
      if (cancelled) return
      setLoadingBooking(true)
      try {
        const res  = await api.get(`/bookings/${existingBooking.id}`)
        if (cancelled) return
        const data = res.data?.data ?? res.data

        // Popula cliente (se houver)
        if (data.client) {
          setSelectedClient({
            id:    data.client.id,
            name:  data.client.name,
            phone: data.client.phone ?? '',
          })
        } else if (data.clientName) {
          // Cliente "Avulso" (sem id, só nome no booking)
          setSelectedClient(null)
        }

        // Popula data
        const dt = dayjs(data.startAt).tz('America/Sao_Paulo')
        setDate(dt)

        // Popula item (1 serviço por booking)
        const startTime = dt.format('HH:mm')
        const endTime   = dayjs(data.endAt).tz('America/Sao_Paulo').format('HH:mm')

        setItems([{
          service: {
            id:       data.service.id,
            name:     data.service.name,
            duration: data.service.duration,
            price:    data.service.price ?? undefined,
          },
          startTime,
          endTime,
          profId: data.professional?.id ?? data.professionalId ?? '',
        }])
      } catch {
        if (!cancelled) {
          // Fallback: usa dados básicos do AgendaBooking
          setItems([{
            service: {
              id:       '',
              name:     existingBooking.serviceName,
              duration: 30,  // estimativa — será corrigida ao selecionar
            },
            startTime: existingBooking.start,
            endTime:   existingBooking.end,
            profId:    existingBooking.professionalId,
          }])
          setError('Não foi possível carregar todos os detalhes — dados básicos preenchidos.')
        }
      } finally {
        if (!cancelled) setLoadingBooking(false)
      }
    }, 0)

    return () => {
      cancelled = true
      clearTimeout(tLoad)
    }
  }, [open, mode, existingBooking])

  // Sincroniza data com agenda (só em create — em edit a data vem do booking)
  useEffect(() => {
    if (open && mode === 'create') setDate(dayjs(selectedDate))
  }, [selectedDate, open, mode])

  // ── Preview em tempo real na grade ──────────────────────────────────────────
  const dateStr2    = date.format('YYYY-MM-DD')
  const clientLabel = selectedClient?.name ?? 'Avulso'

  useEffect(() => {
    if (!open || !items.length || !items[0]?.service) {
      setPreview(null)
      return
    }
    const first      = items[0]
    const validItems = items.filter(it => it.service)
    setPreview({
      active:         true,
      date:           dateStr2,
      time:           first.startTime || '09:00',
      professionalId: first.profId,
      duration:       first.service?.duration ?? 30,
      serviceName:    first.service?.name,
      clientName:     clientLabel,
      allItems:       validItems.map(it => ({
        startTime:   it.startTime,
        endTime:     it.endTime,
        duration:    it.service?.duration ?? 30,
        serviceName: it.service?.name ?? '',
        profId:      it.profId,
        clientName:  clientLabel,
      })),
    })
  }, [open, dateStr2, items, clientLabel, setPreview])

  function handleDateSelect(d: dayjs.Dayjs) {
    setDate(d)
    setSelectedDate(d.toDate())
    onDateChange?.(d.toDate())
  }

  function handleServiceSelect(svc: Service) {
    setItems(prev => {
      const next = prev.map(x => ({ ...x }))
      let changedIdx: number

      if (addingSvcIdx === -1) {
        // Novo item: nasce sequencial ('after') e herda o prof do 1º item.
        // start/fim são derivados logo abaixo pela cadeia (recomputeFrom).
        next.push({
          service:   svc,
          startTime: next[next.length - 1]?.startTime || time || '09:00',
          endTime:   '',
          profId:    next[0]?.profId ?? professionals[0]?.id ?? '',
          mode:      'after',
        })
        changedIdx = next.length - 1
      } else {
        // Edição do serviço de um item existente: troca o serviço e deixa
        // a cadeia recalcular os tempos (a duração pode ter mudado).
        changedIdx = addingSvcIdx
        next[changedIdx] = { ...next[changedIdx], service: svc }
      }

      return recomputeFrom(next, changedIdx)
    })
    setAddingSvcIdx(-1)
  }

  function updateItemTime(idx: number, field: 'startTime'|'endTime', val: string) {
    setItems(prev => {
      const next = prev.map(x => ({ ...x }))
      next[idx]  = { ...next[idx], [field]: val }
      if (field === 'startTime' && next[idx].service) {
        next[idx].endTime = addMinutes(val, next[idx].service.duration)
      }
      // Ajuste manual é "rei" para ESTE item; os itens seguintes (após idx)
      // re-snapeiam conforme seus modos.
      return recomputeFrom(next, idx + 1)
    })
  }

  function removeItem(idx: number) {
    setItems(prev => recomputeFrom(prev.filter((_,i) => i !== idx), idx))
  }

  // ── Alterna modo do item (Frente 2): sequencial ⇄ paralelo ────────────────
  function setItemMode(idx: number, mode: 'after' | 'parallel') {
    if (idx < 1) return  // 1º item não tem âncora
    setItems(prev => {
      const next = prev.map(x => ({ ...x }))
      next[idx]  = { ...next[idx], mode }
      // Re-deriva o start deste item (e cascateia para os seguintes).
      const recomputed = recomputeFrom(next, idx)
      // Ao virar paralelo, puxa o próximo profissional livre nesse horário —
      // senão o paralelo com o mesmo prof nasceria em conflito.
      if (mode === 'parallel') {
        const it   = recomputed[idx]
        const free = pickFreeProf(recomputed, idx, it.startTime, it.endTime, professionals)
        if (free) recomputed[idx] = { ...recomputed[idx], profId: free }
      }
      return recomputed
    })
  }

  // ── SAVE ──────────────────────────────────────────────────────────────────
  async function handleSave(allowOverlap = false) {
    if (!firstItem?.service) { setError('Selecione pelo menos um serviço'); return }
    const invalidExtra = items.slice(1).find(it => !it.service)
    if (invalidExtra) { setError('Selecione o serviço de todos os itens'); return }

    try {
      setSaving(true); setError(null)
      const dateStr = date.format('YYYY-MM-DD')

      if (isEdit && existingBooking) {
        // ── MODO EDIT: PATCH /bookings/:id (1 serviço por booking) ──────────
        const it = items[0]
        const startAt = dayjs.tz(`${dateStr} ${it.startTime}`, 'America/Sao_Paulo').toISOString()

        await api.patch(`/bookings/${existingBooking.id}`, {
          serviceId:      it.service.id,
          professionalId: it.profId || null,
          startAt,
          clientId:       selectedClient?.id ?? null,        // ⭐ NEW: linka com Client cadastrado
          clientName:     selectedClient?.name ?? 'Avulso', // ⭐ NEW: mantém nome mesmo com cliente linkado (pode ser editável futuramente)
          clientPhone:    selectedClient?.phone ?? undefined,
          allowOverlap,
        })

        setPreview(null)
        setSuccess(true)
        setPendingOverlap(false)
        setTimeout(() => onClose(), 1400)
      } else {
        // ── MODO CREATE: POST /bookings/confirm (múltiplos serviços) ────────
        // Se há mais de 1 serviço, gera um groupId comum pra vinculá-los
        // (cada serviço continua um booking/card independente na grade,
        //  mas o BookingViewPanel os exibe juntos estilo Booksy).
        if (addToGroupRefId) {
          // ── ADICIONAR SERVIÇO A UM GRUPO EXISTENTE ──────────────────────
          // Em SÉRIE (não Promise.all): a 1ª chamada faz o ref virar grupo
          // (gera groupId); as próximas reusam o mesmo. Paralelo causaria race.
          for (const it of items) {
            const startAt = dayjs.tz(`${dateStr} ${it.startTime}`, 'America/Sao_Paulo').toISOString()
            await api.post(`/bookings/${addToGroupRefId}/add-to-group`, {
              serviceId:      it.service.id,
              professionalId: it.profId || null,
              startAt,
              allowOverlap,
            })
          }
        } else {
          // ── MODO CREATE normal: POST /bookings/confirm (múltiplos serviços) ──
          const groupId = items.length > 1
            ? (crypto.randomUUID?.() ?? `grp_${Date.now()}_${Math.random().toString(36).slice(2)}`)
            : undefined

          await Promise.all(items.map(it => {
            const startAt = dayjs.tz(`${dateStr} ${it.startTime}`, 'America/Sao_Paulo').toISOString()
            return api.post('/bookings/confirm', {
              clientId:       selectedClient?.id ?? null,
              clientName:     selectedClient?.name ?? 'Avulso',
              clientPhone:    selectedClient?.phone ?? '',
              professionalId: it.profId,
              serviceId:      it.service.id,
              startAt,
              allowOverlap,
              groupId,
              internalNote:   internalNote || undefined,
              clientMessage:  clientMessage || undefined,
            })
          }))
        }

        setPreview(null)
        setSuccess(true)
        setPendingOverlap(false)
        setTimeout(() => onClose(), 1400)
      }
    } catch (e: unknown) {
      const status = (e as {response?:{status?:number}})?.response?.status
      const code   = (e as {response?:{data?:{code?:string}}})?.response?.data?.code
      if (status === 409 || code === 'BOOKING_CONFLICT') {
        setPendingOverlap(true)
      } else {
        const msg = (e as {response?:{data?:{error?:string}}})?.response?.data?.error
        setError(msg ?? (isEdit ? 'Erro ao atualizar agendamento' : 'Erro ao salvar agendamento'))
      }
    } finally { setSaving(false) }
  }

  const isDisabled = !firstItem?.service || saving || success || loadingBooking
  const dateLabel  = date.format('ddd, DD [de] MMM').replace(/^\w/,c=>c.toUpperCase())

  if (!open || typeof document === 'undefined') return null

  const panelStyle = isMobile ? {
    position:'fixed' as const, left:0, right:0, bottom:'calc(64px + env(safe-area-inset-bottom, 0px))', top:'104px',
    background:glass.surface.modal.background, backdropFilter:glass.surface.modal.backdropFilter,
    WebkitBackdropFilter:glass.surface.modal.backdropFilter,
    borderRadius:`${radius['2xl']}px ${radius['2xl']}px 0 0`,
    boxShadow:'0 -8px 40px rgba(0,0,0,0.18)', zIndex:9995,
    display:'flex', flexDirection:'column' as const, fontFamily:typography.fontFamily,
    animation:'sheetUp 0.32s cubic-bezier(0.34,1.2,0.64,1)',
  } : {
    position:'fixed' as const, top:0, right:0, bottom:0, width:400, maxWidth:'100vw',
    background:glass.surface.modal.background, backdropFilter:glass.surface.modal.backdropFilter,
    WebkitBackdropFilter:glass.surface.modal.backdropFilter,
    borderLeft:`1px solid ${colors.gray.borderMd}`,
    boxShadow:`-12px 0 40px rgba(0,0,0,0.12)`, zIndex:9995,
    display:'flex', flexDirection:'column' as const, fontFamily:typography.fontFamily,
    animation:'sheetIn 0.24s cubic-bezier(0.25,0.46,0.45,0.94)',
  }

  const panel = (
    <>
      <style>{`
        @keyframes sheetIn{from{transform:translateX(100%)}to{transform:translateX(0)}}
        @keyframes sheetUp{from{transform:translateY(100%)}to{transform:translateY(0)}}
        @keyframes scp-spin{to{transform:rotate(360deg)}}
        .cp-tab{flex:1;padding:12px 8px;border:none;background:transparent;cursor:pointer;font-size:13px;font-weight:600;color:${colors.gray.dimText};border-bottom:2px solid transparent;transition:all ${transitions.fast};font-family:${typography.fontFamily};letter-spacing:.04em}
        .cp-tab.active{color:${colors.red.DEFAULT};border-bottom-color:${colors.red.DEFAULT}}
        .cp-lbl{display:block;font-size:11px;font-weight:700;color:${colors.gray.dimText};text-transform:uppercase;letter-spacing:.07em;margin-bottom:6px}
        .cp-field{padding:11px 14px;border-radius:${radius.sm}px;border:1px solid ${colors.gray.borderMd};background:${colors.background.page};font-family:${typography.fontFamily}}
        .cp-svc{width:100%;display:flex;align-items:center;justify-content:space-between;padding:11px 14px;border-radius:${radius.sm}px;border:1px solid ${colors.gray.borderMd};background:${colors.background.page};cursor:pointer;text-align:left;transition:border-color ${transitions.fast};font-family:${typography.fontFamily}}
        .cp-svc:hover,.cp-svc.has-value{border-color:${colors.red.borderHover}}
        .cp-prof{padding:7px 14px;border-radius:${radius.full}px;border:1px solid ${colors.gray.borderMd};background:${colors.background.page};font-size:13px;font-weight:500;cursor:pointer;color:${colors.gray[700]};transition:all ${transitions.spring};white-space:nowrap}
        .cp-prof.sel{background:${colors.red.gradient};color:#fff;border-color:transparent;box-shadow:0 3px 10px ${colors.red.glow}}
        .cp-discard{flex:1;padding:13px;border-radius:${radius.sm}px;border:1px solid ${colors.gray.borderMd};background:transparent;font-size:13px;font-weight:600;cursor:pointer;color:${colors.gray[700]};letter-spacing:.04em;transition:background ${transitions.fast};font-family:${typography.fontFamily}}
        .cp-discard:hover{background:${colors.gray.hover}}
        .cp-save{flex:2;padding:13px;border-radius:${radius.sm}px;border:none;background:rgba(0,0,0,0.06);font-size:13px;font-weight:700;cursor:pointer;color:rgba(0,0,0,0.3);letter-spacing:.04em;transition:all ${transitions.spring};font-family:${typography.fontFamily}}
        .cp-save:not(:disabled){background:${colors.red.gradient};color:#fff;box-shadow:${shadows.redSm};cursor:pointer}
        .cp-save:not(:disabled):hover{transform:translateY(-1px);box-shadow:${shadows.redMd}}
        .cp-note{width:100%;padding:12px;border-radius:${radius.sm}px;border:1px solid ${colors.gray.borderMd};background:${colors.background.page};font-size:13px;resize:none;outline:none;font-family:${typography.fontFamily};color:${colors.gray[900]};box-sizing:border-box;transition:border-color ${transitions.fast};min-height:96px}
        .cp-note:focus{border-color:${colors.red.borderHover}}
        .add-svc-btn{width:100%;display:flex;align-items:center;gap:8;padding:11px 14px;border-radius:${radius.sm}px;border:1.5px dashed ${colors.red.border};background:transparent;cursor:pointer;color:${colors.red.DEFAULT};font-size:13px;font-weight:600;transition:all ${transitions.fast};font-family:${typography.fontFamily}}
        .add-svc-btn:hover{background:${colors.red.subtle};border-color:${colors.red.DEFAULT}}
        .cp-seg-btn{flex:1;padding:8px 6px;border-radius:9px;border:1px solid ${colors.gray.borderMd};background:${colors.background.page};font-size:12px;font-weight:600;cursor:pointer;color:${colors.gray[700]};transition:all ${transitions.fast};font-family:${typography.fontFamily};white-space:nowrap;display:flex;align-items:center;justify-content:center;gap:4px}
        .cp-seg-btn.sel{background:${colors.red.gradient};color:#fff;border-color:transparent;box-shadow:0 2px 8px ${colors.red.glow}}
      `}</style>

      {showSvcSheet && (
        <ServiceSheet
          services={services} selected={addingSvcIdx >= 0 ? (items[addingSvcIdx]?.service ?? null) : null}
          loading={servicesLoad}
          onSelect={handleServiceSelect}
          onClose={()=>setShowSvcSheet(false)}
        />
      )}
      {showClientSheet && (
        <ClientSearchSheet
          selected={selectedClient}
          onSelect={c=>{setSelectedClient(c);setShowClientSheet(false)}}
          onClose={()=>setShowClientSheet(false)}
          onCreateNew={()=>setShowCreateClient(true)}
        />
      )}
      {showCreateClient && (
        <CreateClientSheet
          onCreated={c=>{setSelectedClient(c);setShowCreateClient(false)}}
          onClose={()=>setShowCreateClient(false)}
        />
      )}
      {showDatePicker && (
        <DatePickerModal
          date={date}
          onSelect={handleDateSelect}
          onClose={()=>setShowDatePicker(false)}
          isMobile={isMobile}
        />
      )}

      {pendingOverlap && (
        <ConfirmModal
          title={'Já existe um agendamento\nnesse horário. Confirmar mesmo assim?'}
          confirmLabel="Confirmar sobreposição"
          onConfirm={() => { setPendingOverlap(false); handleSave(true) }}
          onCancel={() => setPendingOverlap(false)}
          isMobile={isMobile}
        />
      )}

      <div onClick={onClose} style={{position:'fixed',inset:0,zIndex:9994,background:colors.background.overlay}}/>

      <div style={panelStyle}>
        {isMobile && <div style={{display:'flex',justifyContent:'center',padding:'10px 0 4px',flexShrink:0}}><div style={{width:40,height:4,borderRadius:2,background:'rgba(0,0,0,0.12)'}}/></div>}

        {/* Header */}
        <div style={{flexShrink:0,borderBottom:`1px solid ${colors.gray.border}`}}>
          <div style={{display:'flex',alignItems:'center',gap:12,padding:'14px 20px 10px'}}>
            <button onClick={onClose} style={{width:32,height:32,borderRadius:10,border:`1px solid ${colors.gray.borderMd}`,background:'transparent',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
              <X size={16} color={colors.gray[700]} strokeWidth={2.5}/>
            </button>
            <h2 style={{margin:0,fontSize:17,fontWeight:700,color:colors.gray[900],letterSpacing:'-0.02em'}}>
              {isEdit ? 'Editar agendamento' : 'Novo agendamento'}
            </h2>
          </div>

          {/* Seleção de cliente */}
          <button onClick={()=>setShowClientSheet(true)} style={{width:'100%',display:'flex',alignItems:'center',gap:12,padding:'10px 20px 14px',border:'none',background:'transparent',cursor:'pointer',textAlign:'left'}}>
            <div style={{width:40,height:40,borderRadius:'50%',border:`1.5px dashed ${selectedClient?'transparent':colors.gray.borderMd}`,background:selectedClient?colors.red.gradient:colors.background.page,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,fontSize:13,fontWeight:700,color:selectedClient?'#fff':colors.gray.dimText,boxShadow:selectedClient?`0 2px 8px ${colors.red.glow}`:'none',transition:`all ${transitions.spring}`}}>
              {selectedClient ? getInitials(selectedClient.name) : <User size={16} color={colors.gray.dimText} strokeWidth={1.8}/>}
            </div>
            <div style={{flex:1,minWidth:0}}>
              {selectedClient ? (
                <>
                  <div style={{fontSize:14,fontWeight:700,color:colors.gray[900],whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{selectedClient.name}</div>
                  {selectedClient.phone&&<div style={{fontSize:12,color:colors.gray.dimText}}>{fmtPhone(selectedClient.phone)}</div>}
                </>
              ) : (
                <span style={{fontSize:13,color:colors.gray.dimText}}>Selecione um cliente ou deixe em branco para chegada</span>
              )}
            </div>
            <div style={{width:28,height:28,borderRadius:'50%',border:`1px solid ${colors.gray.borderMd}`,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
              <Plus size={14} color={colors.gray.dimText} strokeWidth={2.5}/>
            </div>
          </button>

          {/* Tabs */}
          <div style={{display:'flex',borderTop:`1px solid ${colors.gray.border}`}}>
            <button className={`cp-tab${tab==='booking'?' active':''}`} onClick={()=>setTab('booking')}>AGENDAMENTO</button>
            <button className={`cp-tab${tab==='info'?' active':''}`} onClick={()=>setTab('info')}>INFORMAÇÕES</button>
          </div>
        </div>

        {/* Body */}
        <div style={{flex:1,overflowY:'auto',padding:'16px 20px'}}>
          {loadingBooking ? (
            <div style={{display:'flex',justifyContent:'center',alignItems:'center',padding:60}}>
              <Loader2 size={28} color={colors.red.DEFAULT} style={{animation:'scp-spin 0.8s linear infinite'}}/>
            </div>
          ) : (
            <>
              {error && <div style={{marginBottom:12,padding:'9px 12px',borderRadius:radius.sm,background:'rgba(220,38,38,0.06)',border:`1px solid ${colors.red.border}`,color:colors.red.dark,fontSize:13}}>{error}</div>}
              {success && <div style={{marginBottom:12,padding:'9px 12px',borderRadius:radius.sm,background:'rgba(22,163,74,0.06)',border:'1px solid rgba(22,163,74,0.2)',color:'#15803d',fontSize:13,display:'flex',alignItems:'center',gap:6}}><Check size={13}/> {isEdit ? 'Agendamento atualizado!' : 'Agendamento confirmado!'}</div>}

              {tab === 'booking' ? (
                <div style={{display:'flex',flexDirection:'column',gap:16}}>

                  {/* Data — clicável */}
                  <div>
                    <span className="cp-lbl">Data</span>
                    <button className="cp-field" onClick={()=>setShowDatePicker(true)} style={{width:'100%',display:'flex',alignItems:'center',justifyContent:'space-between',cursor:'pointer',border:`1px solid ${colors.gray.borderMd}`,background:colors.background.page,borderRadius:radius.sm,padding:'11px 14px'}}>
                      <div style={{display:'flex',alignItems:'center',gap:8}}>
                        <Calendar size={15} color={colors.red.DEFAULT} strokeWidth={2}/>
                        <span style={{fontSize:14,fontWeight:600,color:colors.gray[900]}}>{dateLabel}</span>
                      </div>
                      <ChevronDown size={14} color={colors.gray.dimText}/>
                    </button>
                  </div>

                  {/* Serviços */}
                  {items.map((item, idx) => (
                    <div key={idx} style={{borderRadius:radius.sm,border:`1px solid ${colors.gray.borderMd}`,background:colors.background.page,overflow:'hidden'}}>
                      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'10px 14px',borderBottom:`1px solid ${colors.gray.border}`}}>
                        <span className="cp-lbl" style={{margin:0}}>Serviço {items.length>1?`${idx+1}`:'*'}</span>
                        {idx>0&&<button onClick={()=>removeItem(idx)} style={{background:'none',border:'none',cursor:'pointer',padding:2,display:'flex'}}><Trash2 size={14} color={colors.gray.dimText}/></button>}
                      </div>

                      {/* Frente 2: relação temporal com o item anterior (só do 2º item em diante) */}
                      {idx > 0 && (
                        <div style={{display:'flex',gap:6,padding:'10px 14px',borderBottom:`1px solid ${colors.gray.border}`}}>
                          <button className={`cp-seg-btn${(item.mode ?? 'after')==='after'?' sel':''}`} onClick={()=>setItemMode(idx,'after')}>↳ Após anterior</button>
                          <button className={`cp-seg-btn${item.mode==='parallel'?' sel':''}`} onClick={()=>setItemMode(idx,'parallel')}>∥ Em paralelo</button>
                        </div>
                      )}

                      <button className={`cp-svc${item.service?' has-value':''}`} style={{borderRadius:0,border:'none',borderBottom:`1px solid ${colors.gray.border}`}} onClick={()=>{setAddingSvcIdx(idx);setShowSvcSheet(true)}}>
                        <div>
                          <div style={{fontSize:14,fontWeight:item.service?600:400,color:item.service?colors.gray[900]:colors.gray.dimTextLight}}>
                            {item.service?item.service.name:'Selecione o serviço'}
                          </div>
                          {item.service&&<div style={{fontSize:11,color:colors.gray.dimText,marginTop:2,display:'flex',alignItems:'center',gap:3}}>
                            <Clock size={10} strokeWidth={2} color={colors.gray.dimText}/>{item.service.duration}min
                            {item.service.price!=null&&<> · R$ {item.service.price.toFixed(2).replace('.',',')}</>}
                          </div>}
                        </div>
                        <ChevronRight size={15} color={item.service?colors.red.DEFAULT:colors.gray.dimText}/>
                      </button>

                      <div style={{display:'flex',gap:0}}>
                        <div style={{flex:1,padding:'8px 12px',borderRight:`1px solid ${colors.gray.border}`}}>
                          <div style={{fontSize:10,fontWeight:700,color:colors.gray.dimText,textTransform:'uppercase',letterSpacing:'.06em',marginBottom:4}}>Início</div>
                          <div style={{border:`1px solid ${colors.gray.borderMd}`,borderRadius:8,overflow:'hidden',background:'#fff',display:'flex'}}>
                            <TimeWheel value={item.startTime||'09:00'} onChange={v=>updateItemTime(idx,'startTime',v)}/>
                          </div>
                        </div>
                        <div style={{flex:1,padding:'8px 12px'}}>
                          <div style={{fontSize:10,fontWeight:700,color:colors.gray.dimText,textTransform:'uppercase',letterSpacing:'.06em',marginBottom:4}}>Fim</div>
                          <div style={{height:ITEM_H*VISIBLE,border:`1px solid ${colors.gray.borderMd}`,borderRadius:8,background:'#fff',display:'flex',alignItems:'center',justifyContent:'center'}}>
                            <span style={{fontSize:17,fontWeight:700,color:item.endTime?colors.gray[900]:colors.gray.dimTextLight,fontVariantNumeric:'tabular-nums'}}>
                              {item.endTime||'--:--'}
                            </span>
                          </div>
                        </div>
                      </div>

                      {professionals.length > 1 && (
                        <div style={{padding:'10px 12px',borderTop:`1px solid ${colors.gray.border}`}}>
                          <div style={{fontSize:10,fontWeight:700,color:colors.gray.dimText,textTransform:'uppercase',letterSpacing:'.06em',marginBottom:8}}>Funcionário</div>
                          <div style={{display:'flex',gap:6,flexWrap:'wrap'}}>
                            {professionals.map(p=>(
                              <button key={p.id} className={`cp-prof${item.profId===p.id?' sel':''}`} onClick={()=>setItems(prev=>{const n=[...prev];n[idx]={...n[idx],profId:p.id};return n})}>{p.name.split(' ')[0]}</button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}

                  {/* Adicionar outro serviço — só em modo create */}
                  {!isEdit && (
                    <button className="add-svc-btn" onClick={()=>{setAddingSvcIdx(-1);setShowSvcSheet(true)}}>
                      <Plus size={15} strokeWidth={2}/> Adicionar outro serviço
                    </button>
                  )}

                  {isEdit && (
                    <div style={{
                      padding: '10px 12px',
                      background: 'rgba(0,0,0,0.03)',
                      border: `1px dashed ${colors.gray.borderMd}`,
                      borderRadius: radius.sm,
                      fontSize: 11,
                      color: colors.gray.dimText,
                      textAlign: 'center',
                      lineHeight: 1.5,
                    }}>
                      ✏️ Modo edição: 1 serviço por agendamento.<br/>
                      Para múltiplos serviços, crie agendamentos separados.
                    </div>
                  )}

                </div>
              ) : (
                <div style={{display:'flex',flexDirection:'column',gap:14}}>
                  <div>
                    <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:6}}>
                      <span className="cp-lbl" style={{margin:0}}>Nota interna</span>
                      <Star size={14} color={colors.gray.dimText} strokeWidth={1.8}/>
                    </div>
                    <textarea className="cp-note" value={internalNote} onChange={e=>setInternalNote(e.target.value)} placeholder="Nota interna (visível apenas para funcionários)"/>
                  </div>
                  <div>
                    <span className="cp-lbl">Mensagem para o cliente</span>
                    <textarea className="cp-note" value={clientMessage} onChange={e=>setClientMessage(e.target.value)} placeholder="Mensagem para o cliente"/>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div style={{padding:'12px 20px 20px',borderTop:`1px solid ${colors.gray.border}`,flexShrink:0,background:colors.background.surface,backdropFilter:glass.blur.sm}}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-end',marginBottom:12}}>
            <div>
              <div style={{fontSize:11,fontWeight:700,color:colors.gray.dimText,textTransform:'uppercase',letterSpacing:'.07em',marginBottom:2}}>Total</div>
              <div style={{fontSize:22,fontWeight:700,color:colors.gray[900],fontVariantNumeric:'tabular-nums'}}>R$ {total.toFixed(2).replace('.',',')}</div>
            </div>
            <div style={{textAlign:'right'}}>
              <div style={{fontSize:11,fontWeight:700,color:colors.gray.dimText,textTransform:'uppercase',letterSpacing:'.07em',marginBottom:2}}>A ser pago</div>
              <div style={{fontSize:22,fontWeight:700,color:colors.gray[900],fontVariantNumeric:'tabular-nums'}}>R$ {total.toFixed(2).replace('.',',')}</div>
            </div>
          </div>
          <div style={{display:'flex',gap:8}}>
            <button className="cp-discard" onClick={onClose}>DESCARTAR</button>
            <button className="cp-save" disabled={isDisabled} onClick={()=>handleSave(false)} style={{background:success?'linear-gradient(135deg,#16a34a,#15803d)':isDisabled?undefined:colors.red.gradient,boxShadow:success?'0 4px 14px rgba(22,163,74,0.28)':isDisabled?'none':shadows.redMd}}>
              {success ? (isEdit ? '✓ ATUALIZADO' : '✓ CONFIRMADO')
              : saving ? 'SALVANDO...'
              : (isEdit ? 'ATUALIZAR' : 'SALVAR')}
            </button>
          </div>
        </div>
      </div>
    </>
  )

  return createPortal(panel, document.body)
}
