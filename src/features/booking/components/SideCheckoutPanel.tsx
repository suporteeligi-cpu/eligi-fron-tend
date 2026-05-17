'use client'
// src/features/booking/components/SideCheckoutPanel.tsx

import { useState, useEffect, useRef, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { X, ChevronRight, Clock, User, Phone, Check, Search } from 'lucide-react'
import dayjs from 'dayjs'
import utc      from 'dayjs/plugin/utc'
import timezone from 'dayjs/plugin/timezone'
import api from '@/shared/lib/apiClient'
import { AgendaBooking, AgendaProfessional } from '@/features/agenda/types'
import { colors, glass, typography, radius, shadows, transitions } from '@/shared/theme'

dayjs.extend(utc)
dayjs.extend(timezone)

type Service = { id: string; name: string; duration: number; price?: number }
type Client  = { id: string; name: string; phone: string }

interface Props {
  open:           boolean
  mode:           'create' | 'edit'
  time:           string | null
  professionalId: string | null
  booking:        AgendaBooking | null
  professionals:  AgendaProfessional[]
  selectedDate:   Date
  onClose:        () => void
}

// ─── Time slots ───────────────────────────────────────────────────────────────
function generateTimeSlots(): string[] {
  const slots: string[] = []
  for (let h = 6; h < 23; h++)
    for (let m = 0; m < 60; m += 5)
      slots.push(`${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`)
  return slots
}
const TIME_SLOTS = generateTimeSlots()
const ITEM_H     = 40
const VISIBLE    = 5

// ─── TimeWheel ────────────────────────────────────────────────────────────────
function TimeWheel({ value, onChange }: { value: string; onChange: (t: string) => void }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const isDragging   = useRef(false)
  const startY       = useRef(0)
  const startScroll  = useRef(0)
  const scrollTimer  = useRef<ReturnType<typeof setTimeout> | null>(null)
  const selectedIdx  = TIME_SLOTS.indexOf(value)
  const padding      = Math.floor(VISIBLE / 2)
  const containerH   = VISIBLE * ITEM_H

  const scrollTo = useCallback((idx: number, smooth = true) => {
    containerRef.current?.scrollTo({ top: idx * ITEM_H, behavior: smooth ? 'smooth' : 'instant' })
  }, [])

  useEffect(() => { if (selectedIdx >= 0) scrollTo(selectedIdx, false) }, [selectedIdx, scrollTo])

  const snapToNearest = useCallback(() => {
    if (!containerRef.current) return
    const idx     = Math.round(containerRef.current.scrollTop / ITEM_H)
    const clamped = Math.max(0, Math.min(idx, TIME_SLOTS.length - 1))
    scrollTo(clamped); onChange(TIME_SLOTS[clamped])
  }, [onChange, scrollTo])

  return (
    <div style={{ position:'relative', height:containerH, userSelect:'none', flex:1 }}>
      <div style={{ position:'absolute', top:0, left:0, right:0, height:padding*ITEM_H, background:`linear-gradient(to bottom, ${colors.background.page} 0%, transparent 100%)`, zIndex:2, pointerEvents:'none' }} />
      <div style={{ position:'absolute', top:padding*ITEM_H, left:0, right:0, height:ITEM_H, background:colors.red.subtle, borderTop:`1px solid ${colors.red.border}`, borderBottom:`1px solid ${colors.red.border}`, zIndex:2, pointerEvents:'none' }} />
      <div style={{ position:'absolute', bottom:0, left:0, right:0, height:padding*ITEM_H, background:`linear-gradient(to top, ${colors.background.page} 0%, transparent 100%)`, zIndex:2, pointerEvents:'none' }} />
      <div
        ref={containerRef}
        onScroll={() => { if (scrollTimer.current) clearTimeout(scrollTimer.current); scrollTimer.current = setTimeout(snapToNearest, 100) }}
        onTouchStart={e => { startY.current = e.touches[0].clientY; startScroll.current = containerRef.current?.scrollTop ?? 0 }}
        onTouchMove={e => { if (containerRef.current) containerRef.current.scrollTop = startScroll.current + (startY.current - e.touches[0].clientY) }}
        onTouchEnd={snapToNearest}
        onMouseDown={e => { isDragging.current = true; startY.current = e.clientY; startScroll.current = containerRef.current?.scrollTop ?? 0 }}
        onMouseMove={e => { if (isDragging.current && containerRef.current) containerRef.current.scrollTop = startScroll.current + (startY.current - e.clientY) }}
        onMouseUp={() => { isDragging.current = false; snapToNearest() }}
        onMouseLeave={() => { isDragging.current = false; snapToNearest() }}
        style={{ height:'100%', overflowY:'scroll', scrollbarWidth:'none', cursor:'grab' }}
      >
        <div style={{ height:padding*ITEM_H }} />
        {TIME_SLOTS.map((t, i) => {
          const dist = Math.abs(i - selectedIdx)
          return (
            <div key={t} onClick={() => { onChange(t); scrollTo(i) }} style={{
              height:ITEM_H, display:'flex', alignItems:'center', justifyContent:'center',
              fontSize:15, fontWeight:dist===0?700:400,
              color:dist===0?colors.red.DEFAULT:colors.gray.dimText,
              opacity:dist===0?1:dist===1?0.6:0.28,
              transform:`scale(${dist===0?1:dist===1?0.9:0.8})`,
              transition:`all ${transitions.fast}`, cursor:'pointer',
              fontVariantNumeric:'tabular-nums',
            }}>{t}</div>
          )
        })}
        <div style={{ height:padding*ITEM_H }} />
      </div>
    </div>
  )
}

// ─── ServiceSheet ─────────────────────────────────────────────────────────────
function ServiceSheet({ services, selected, loading, onSelect, onClose }: {
  services: Service[]; selected: Service | null; loading: boolean
  onSelect: (s: Service) => void; onClose: () => void
}) {
  return createPortal(
    <>
      <div onClick={onClose} style={{ position:'fixed', inset:0, zIndex:10998, background:colors.background.overlay }} />
      <div style={{
        position:'fixed', top:0, right:0, bottom:0,
        width:360, maxWidth:'100vw',
        background:glass.surface.modal.background,
        backdropFilter:glass.surface.modal.backdropFilter,
        WebkitBackdropFilter:glass.surface.modal.backdropFilter,
        borderLeft:`1px solid ${colors.gray.borderMd}`,
        boxShadow:`-8px 0 32px rgba(0,0,0,0.12)`,
        zIndex:10999, display:'flex', flexDirection:'column',
        fontFamily:typography.fontFamily,
        animation:'sheetIn 0.2s cubic-bezier(0.25,0.46,0.45,0.94)',
      }}>
        <style>{`@keyframes sheetIn{from{transform:translateX(100%)}to{transform:translateX(0)}}`}</style>
        <div style={{ padding:'16px 20px', borderBottom:`1px solid ${colors.gray.border}`, display:'flex', alignItems:'center', justifyContent:'space-between', flexShrink:0 }}>
          <h3 style={{ margin:0, fontSize:typography.scale.lg, fontWeight:typography.weight.bold, color:colors.gray[900] }}>Selecione o serviço</h3>
          <button onClick={onClose} style={{ width:28, height:28, borderRadius:radius.full, border:`1px solid ${colors.gray.borderMd}`, background:colors.background.surfaceLight, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>
            <X size={14} color={colors.gray.dimText} />
          </button>
        </div>
        <div style={{ flex:1, overflowY:'auto' }}>
          {loading ? (
            <div style={{ padding:32, textAlign:'center', color:colors.gray.dimText }}>Carregando...</div>
          ) : services.length === 0 ? (
            <div style={{ padding:32, textAlign:'center', color:colors.gray.dimText }}>Nenhum serviço cadastrado</div>
          ) : services.map(s => (
            <button key={s.id} onClick={() => { onSelect(s); onClose() }} style={{
              width:'100%', display:'flex', alignItems:'center', gap:12,
              padding:'14px 20px', border:'none', borderBottom:`1px solid ${colors.gray.border}`,
              background: selected?.id === s.id ? colors.red.subtle : 'transparent',
              cursor:'pointer', textAlign:'left', transition:`background ${transitions.fast}`,
            }}
              onMouseEnter={e => (e.currentTarget.style.background = selected?.id === s.id ? colors.red.subtle : colors.gray.hover)}
              onMouseLeave={e => (e.currentTarget.style.background = selected?.id === s.id ? colors.red.subtle : 'transparent')}
            >
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontSize:typography.scale.md, fontWeight:typography.weight.semibold, color:colors.gray[900] }}>{s.name}</div>
                <div style={{ fontSize:typography.scale.sm, color:colors.gray.dimText, marginTop:2, display:'flex', alignItems:'center', gap:4 }}>
                  <Clock size={11} strokeWidth={2} color={colors.gray.dimText} />
                  {s.duration}min
                  {s.price != null && <span style={{ marginLeft:4 }}>· R$ {s.price.toFixed(2).replace('.', ',')}</span>}
                </div>
              </div>
              {selected?.id === s.id
                ? <Check size={16} color={colors.red.DEFAULT} strokeWidth={2.5} />
                : <div style={{ width:18, height:18, borderRadius:radius.full, border:`1.5px solid ${colors.gray.borderMd}`, flexShrink:0 }} />
              }
            </button>
          ))}
        </div>
      </div>
    </>,
    document.body
  )
}

// ─── ClientSearchSheet ────────────────────────────────────────────────────────
function ClientSearchSheet({ selected, onSelect, onClose }: {
  selected: Client | null
  onSelect: (c: Client | null) => void
  onClose:  () => void
}) {
  const [query,   setQuery]   = useState('')
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => { setTimeout(() => inputRef.current?.focus(), 100) }, [])

  useEffect(() => {
    const t = setTimeout(async () => {
      try {
        setLoading(true)
        const res  = await api.get('/clients', { params: { search: query || undefined, limit: 20 } })
        const data = res.data?.data ?? res.data
        setClients(data.clients ?? [])
      } catch { setClients([]) }
      finally  { setLoading(false) }
    }, 300)
    return () => clearTimeout(t)
  }, [query])

  function getInitials(name: string) {
    return name.split(' ').slice(0,2).map((w: string) => w[0]).join('').toUpperCase()
  }
  function formatPhone(p: string) {
    const d = p.replace(/\D/g,'')
    if (d.length === 11) return `(${d.slice(0,2)}) ${d.slice(2,7)}-${d.slice(7)}`
    if (d.length === 10) return `(${d.slice(0,2)}) ${d.slice(2,6)}-${d.slice(6)}`
    return p
  }

  return createPortal(
    <>
      <div onClick={onClose} style={{ position:'fixed', inset:0, zIndex:10998, background:colors.background.overlay }} />
      <div style={{
        position:'fixed', top:0, right:0, bottom:0,
        width:360, maxWidth:'100vw',
        background:glass.surface.modal.background,
        backdropFilter:glass.surface.modal.backdropFilter,
        WebkitBackdropFilter:glass.surface.modal.backdropFilter,
        borderLeft:`1px solid ${colors.gray.borderMd}`,
        boxShadow:`-8px 0 32px rgba(0,0,0,0.12)`,
        zIndex:10999, display:'flex', flexDirection:'column',
        fontFamily:typography.fontFamily,
        animation:'sheetIn 0.2s cubic-bezier(0.25,0.46,0.45,0.94)',
      }}>

        {/* Header com busca */}
        <div style={{ padding:'14px 16px', borderBottom:`1px solid ${colors.gray.border}`, display:'flex', alignItems:'center', gap:10, flexShrink:0 }}>
          <button onClick={onClose} style={{ width:28, height:28, borderRadius:radius.full, border:`1px solid ${colors.gray.borderMd}`, background:colors.background.surfaceLight, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
            <X size={14} color={colors.gray.dimText} />
          </button>
          <div style={{ flex:1, position:'relative' }}>
            <Search size={14} color={colors.gray.dimText} style={{ position:'absolute', left:10, top:'50%', transform:'translateY(-50%)', pointerEvents:'none' }} />
            <input
              ref={inputRef}
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Buscar cliente por nome ou telefone..."
              style={{ width:'100%', height:36, paddingLeft:32, paddingRight:10, borderRadius:radius.sm, border:`1px solid ${colors.gray.borderMd}`, background:colors.background.surface, fontSize:typography.scale.sm, outline:'none', boxSizing:'border-box', fontFamily:typography.fontFamily, color:colors.gray[900] }}
            />
          </div>
        </div>

        {/* Opção: sem cliente */}
        <button onClick={() => { onSelect(null); onClose() }} style={{
          width:'100%', display:'flex', alignItems:'center', gap:12,
          padding:'12px 20px', border:'none', borderBottom:`1px solid ${colors.gray.border}`,
          background: !selected ? colors.red.subtle : 'transparent',
          cursor:'pointer', textAlign:'left', transition:`background ${transitions.fast}`,
        }}
          onMouseEnter={e => (e.currentTarget.style.background = !selected ? colors.red.subtle : colors.gray.hover)}
          onMouseLeave={e => (e.currentTarget.style.background = !selected ? colors.red.subtle : 'transparent')}
        >
          <div style={{ width:36, height:36, borderRadius:radius.full, background:colors.gray.hover, border:`1px solid ${colors.gray.borderMd}`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
            <User size={16} color={colors.gray.dimText} />
          </div>
          <div style={{ flex:1, textAlign:'left' }}>
            <div style={{ fontSize:typography.scale.base, fontWeight:typography.weight.semibold, color:colors.gray[900] }}>Sem cliente</div>
            <div style={{ fontSize:typography.scale.sm, color:colors.gray.dimText }}>Chegada sem cadastro</div>
          </div>
          {!selected && <Check size={16} color={colors.red.DEFAULT} strokeWidth={2.5} />}
        </button>

        {/* Lista de clientes */}
        <div style={{ flex:1, overflowY:'auto' }}>
          {loading ? (
            <div style={{ display:'flex', justifyContent:'center', padding:32 }}>
              <div style={{ width:24, height:24, borderRadius:'50%', border:`3px solid ${colors.red.subtle}`, borderTopColor:colors.red.DEFAULT, animation:'spin 0.8s linear infinite' }} />
              <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
            </div>
          ) : clients.length === 0 ? (
            <div style={{ padding:32, textAlign:'center', color:colors.gray.dimText, fontSize:typography.scale.base }}>
              {query ? 'Nenhum cliente encontrado' : 'Nenhum cliente cadastrado'}
            </div>
          ) : clients.map(c => {
            const isSel = selected?.id === c.id
            return (
              <button key={c.id} onClick={() => { onSelect(c); onClose() }} style={{
                width:'100%', display:'flex', alignItems:'center', gap:12,
                padding:'12px 20px', border:'none', borderBottom:`1px solid ${colors.gray.border}`,
                background: isSel ? colors.red.subtle : 'transparent',
                cursor:'pointer', textAlign:'left', transition:`background ${transitions.fast}`,
              }}
                onMouseEnter={e => (e.currentTarget.style.background = isSel ? colors.red.subtle : colors.gray.hover)}
                onMouseLeave={e => (e.currentTarget.style.background = isSel ? colors.red.subtle : 'transparent')}
              >
                <div style={{ width:36, height:36, borderRadius:radius.full, background:colors.red.gradient, color:'#fff', fontSize:typography.scale.base, fontWeight:typography.weight.bold, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, boxShadow:shadows.redSm }}>
                  {getInitials(c.name)}
                </div>
                <div style={{ flex:1, minWidth:0, textAlign:'left' }}>
                  <div style={{ fontSize:typography.scale.base, fontWeight:typography.weight.semibold, color:colors.gray[900], whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{c.name}</div>
                  <div style={{ fontSize:typography.scale.sm, color:colors.gray.dimText }}>{formatPhone(c.phone)}</div>
                </div>
                {isSel && <Check size={16} color={colors.red.DEFAULT} strokeWidth={2.5} />}
              </button>
            )
          })}
        </div>
      </div>
    </>,
    document.body
  )
}

// ─── Panel principal ──────────────────────────────────────────────────────────
export default function SideCheckoutPanel({
  open, mode, time, professionalId, booking, professionals, selectedDate, onClose,
}: Props) {
  const [mounted,          setMounted]          = useState(false)
  const [tab,              setTab]              = useState<'booking' | 'info'>('booking')
  const [selectedClient,   setSelectedClient]   = useState<Client | null>(null)
  const [clientName,       setClientName]       = useState('')
  const [clientPhone,      setClientPhone]      = useState('')
  const [selectedService,  setSelectedService]  = useState<Service | null>(null)
  const [selectedTime,     setSelectedTime]     = useState(time ?? '09:00')
  const [selectedProf,     setSelectedProf]     = useState<string | null>(professionalId)
  const [services,         setServices]         = useState<Service[]>([])
  const [loading,          setLoading]          = useState(false)
  const [saving,           setSaving]           = useState(false)
  const [success,          setSuccess]          = useState(false)
  const [error,            setError]            = useState<string | null>(null)
  const [showSvcSheet,     setShowSvcSheet]     = useState(false)
  const [showClientSheet,  setShowClientSheet]  = useState(false)

  useEffect(() => { setMounted(true) }, [])

  const endTime   = selectedService
    ? dayjs(`2000-01-01 ${selectedTime}`).add(selectedService.duration, 'minute').format('HH:mm')
    : null
  const dateLabel = dayjs(selectedDate).format('ddd, DD [de] MMM').replace(/^\w/, c => c.toUpperCase())
  const total     = selectedService?.price ?? 0

  // Nome efetivo: cliente selecionado tem prioridade sobre o campo manual
  const effectiveName  = selectedClient?.name  ?? clientName
  const effectivePhone = selectedClient?.phone ?? clientPhone
  const isDisabled = saving || success || !selectedService || !effectiveName.trim()

  useEffect(() => {
    if (!open) return
    setLoading(true)
    api.get('/services')
      .then(res => { const d = res.data?.data ?? res.data; setServices(Array.isArray(d) ? d : []) })
      .catch(() => setServices([]))
      .finally(() => setLoading(false))
  }, [open])

  useEffect(() => {
    if (!open) return
    setTab('booking'); setError(null); setSuccess(false)
    setShowSvcSheet(false); setShowClientSheet(false)
    setSelectedClient(null)
    if (mode === 'edit' && booking) {
      setClientName(booking.clientName); setClientPhone('')
      setSelectedTime(booking.start); setSelectedProf(booking.professionalId); setSelectedService(null)
    } else {
      setClientName(''); setClientPhone(''); setSelectedService(null)
      setSelectedTime(time ?? '09:00'); setSelectedProf(professionalId)
    }
  }, [open, mode, time, professionalId, booking])

  useEffect(() => {
    if (mode === 'edit' && booking && services.length > 0 && !selectedService) {
      const match = services.find(s => s.name === booking.serviceName)
      if (match) setSelectedService(match)
    }
  }, [services, mode, booking, selectedService])

  async function handleSave() {
    if (!selectedProf || !selectedTime || !selectedService || !effectiveName.trim()) {
      setError('Preencha nome, serviço e horário.'); return
    }
    try {
      setSaving(true); setError(null)
      const dateStr = dayjs(selectedDate).format('YYYY-MM-DD')
      const startAt = dayjs.tz(`${dateStr} ${selectedTime}`, 'America/Sao_Paulo').toISOString()
      await api.post('/bookings/confirm', {
        clientName:     effectiveName.trim(),
        clientPhone:    effectivePhone.trim() || undefined,
        clientId:       selectedClient?.id ?? undefined,
        serviceId:      selectedService.id,
        professionalId: selectedProf,
        startAt,
      })
      setSuccess(true)
      setTimeout(onClose, 1400)
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error ?? 'Erro ao salvar.'
      setError(msg)
    } finally { setSaving(false) }
  }

  if (!open || !mounted) return null

  const panel = (
    <>
      <style>{`
        @keyframes cpPanelIn { from{transform:translateX(100%)} to{transform:translateX(0)} }
        .cp-input{width:100%;padding:0 12px;height:40px;border-radius:${radius.sm}px;border:1px solid ${colors.gray.borderMd};background:${colors.background.surface};color:${colors.gray[900]};font-size:${typography.scale.base}px;outline:none;box-sizing:border-box;font-family:${typography.fontFamily};transition:border-color ${transitions.fast},box-shadow ${transitions.fast}}
        .cp-input:focus{border-color:${colors.red.borderHover};box-shadow:0 0 0 3px ${colors.red.focusRing}}
        .cp-input::placeholder{color:${colors.gray.dimTextLight}}
        .cp-tab{flex:1;padding:10px 0;border:none;background:transparent;font-size:${typography.scale.sm}px;font-weight:${typography.weight.bold};letter-spacing:.06em;cursor:pointer;color:${colors.gray.dimText};border-bottom:2px solid transparent;transition:all ${transitions.fast};font-family:${typography.fontFamily}}
        .cp-tab.active{color:${colors.gray[900]};border-bottom-color:${colors.red.DEFAULT}}
        .cp-prof{padding:6px 14px;border-radius:${radius.full}px;border:1px solid ${colors.gray.borderMd};background:${colors.background.surface};font-size:${typography.scale.sm}px;font-weight:${typography.weight.semibold};cursor:pointer;color:${colors.gray[700]};transition:all ${transitions.fast};white-space:nowrap;font-family:${typography.fontFamily}}
        .cp-prof:hover{border-color:${colors.red.borderHover};color:${colors.red.DEFAULT}}
        .cp-prof.sel{background:${colors.red.gradient};color:#fff;border-color:transparent;box-shadow:${shadows.redSm}}
        .cp-svc{width:100%;display:flex;align-items:center;justify-content:space-between;padding:11px 14px;border-radius:${radius.sm}px;border:1px solid ${colors.gray.borderMd};background:${colors.background.surface};cursor:pointer;text-align:left;transition:border-color ${transitions.fast},box-shadow ${transitions.fast};font-family:${typography.fontFamily}}
        .cp-svc:hover{border-color:${colors.red.borderHover};box-shadow:0 0 0 3px ${colors.red.focusRing}}
        .cp-svc.has-value{border-color:${colors.red.border};background:${colors.red.subtle}}
        .cp-save{flex:1;padding:12px;border:none;border-radius:${radius.sm}px;font-size:${typography.scale.base}px;font-weight:${typography.weight.bold};cursor:pointer;transition:all ${transitions.base};font-family:${typography.fontFamily};letter-spacing:.04em;background:${colors.red.gradient};color:#fff;box-shadow:${shadows.redMd}}
        .cp-save:hover:not(:disabled){box-shadow:${shadows.redLg};transform:translateY(-1px)}
        .cp-save:disabled{background:${colors.gray.hover};color:${colors.gray.dimText};box-shadow:none;cursor:not-allowed;transform:none}
        .cp-discard{padding:12px 16px;border:1px solid ${colors.gray.borderMd};border-radius:${radius.sm}px;background:${colors.background.surface};font-size:${typography.scale.sm}px;font-weight:${typography.weight.bold};cursor:pointer;color:${colors.gray[700]};font-family:${typography.fontFamily};letter-spacing:.04em;transition:all ${transitions.fast};white-space:nowrap}
        .cp-discard:hover{background:${colors.gray.hover}}
        .cp-lbl{display:block;font-size:${typography.scale.xs}px;font-weight:${typography.weight.bold};color:${colors.gray.dimText};letter-spacing:.08em;text-transform:uppercase;margin-bottom:6px}
        .cp-field{padding:0 12px;height:40px;border-radius:${radius.sm}px;border:1px solid ${colors.gray.borderMd};background:${colors.background.surface};display:flex;align-items:center}
        .cp-client-pill{display:flex;align-items:center;gap:10px;padding:10px 12px;border-radius:${radius.md}px;cursor:pointer;margin-bottom:14px;transition:all ${transitions.fast}}
        .cp-client-pill:hover{filter:brightness(0.97)}
      `}</style>

      {showSvcSheet && (
        <ServiceSheet
          services={services} selected={selectedService} loading={loading}
          onSelect={setSelectedService} onClose={() => setShowSvcSheet(false)}
        />
      )}

      {showClientSheet && (
        <ClientSearchSheet
          selected={selectedClient}
          onSelect={setSelectedClient}
          onClose={() => setShowClientSheet(false)}
        />
      )}

      {/* Painel lateral */}
      <div style={{
        position:'fixed', top:0, right:0, bottom:0,
        width:360, maxWidth:'100vw',
        background:glass.surface.modal.background,
        backdropFilter:glass.surface.modal.backdropFilter,
        WebkitBackdropFilter:glass.surface.modal.backdropFilter,
        borderLeft:`1px solid ${colors.gray.borderMd}`,
        boxShadow:`-8px 0 40px rgba(0,0,0,0.12), ${glass.surface.modal.boxShadow}`,
        zIndex:9995,
        display:'flex', flexDirection:'column',
        fontFamily:typography.fontFamily,
        animation:'cpPanelIn 0.22s cubic-bezier(0.25,0.46,0.45,0.94)',
      }}>

        {/* Header */}
        <div style={{ padding:'16px 20px 0', flexShrink:0 }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:14 }}>
            <h2 style={{ margin:0, fontSize:typography.scale.xl, fontWeight:typography.weight.bold, color:typography.color.primary, letterSpacing:'-0.3px' }}>
              {mode === 'create' ? 'Novo agendamento' : 'Editar agendamento'}
            </h2>
            <button onClick={onClose} style={{ display:'flex', alignItems:'center', justifyContent:'center', width:30, height:30, borderRadius:radius.full, border:`1px solid ${colors.gray.borderMd}`, background:colors.background.surfaceLight, cursor:'pointer', transition:transitions.fast }}
              onMouseEnter={e => { e.currentTarget.style.background = colors.red.subtle; e.currentTarget.style.borderColor = colors.red.border }}
              onMouseLeave={e => { e.currentTarget.style.background = colors.background.surfaceLight; e.currentTarget.style.borderColor = colors.gray.borderMd }}
            >
              <X size={14} color={colors.gray.dimText} />
            </button>
          </div>

          {/* Pill cliente — dinâmica */}
          <div
            className="cp-client-pill"
            onClick={() => setShowClientSheet(true)}
            style={{
              border: selectedClient
                ? `1px solid ${colors.red.border}`
                : `1px dashed ${colors.gray.borderMd}`,
              background: selectedClient ? colors.red.subtle : colors.gray.hover,
            }}
          >
            <div style={{ width:34, height:34, borderRadius:radius.full, background: selectedClient ? colors.red.gradient : colors.background.surface, border:`1px solid ${selectedClient ? 'transparent' : colors.gray.border}`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, boxShadow: selectedClient ? shadows.redSm : 'none' }}>
              {selectedClient
                ? <span style={{ color:'#fff', fontSize:typography.scale.sm, fontWeight:typography.weight.bold }}>
                    {selectedClient.name.split(' ').slice(0,2).map(w=>w[0]).join('').toUpperCase()}
                  </span>
                : <User size={15} color={colors.gray.dimText} />
              }
            </div>
            <span style={{ fontSize:typography.scale.base, color: selectedClient ? colors.gray[900] : colors.gray.dimText, flex:1, fontWeight: selectedClient ? typography.weight.semibold : typography.weight.normal, lineHeight:1.3 }}>
              {selectedClient ? selectedClient.name : 'Selecione um cliente ou deixe em branco para chegada'}
            </span>
            {selectedClient ? (
              <div
                onClick={e => { e.stopPropagation(); setSelectedClient(null) }}
                style={{ width:22, height:22, borderRadius:radius.full, border:`1px solid ${colors.gray.borderMd}`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, background:colors.background.surface, cursor:'pointer' }}
              >
                <X size={11} color={colors.gray.dimText} />
              </div>
            ) : (
              <div style={{ width:24, height:24, borderRadius:radius.full, border:`1px solid ${colors.gray.borderMd}`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, background:colors.background.surface }}>
                <span style={{ fontSize:16, color:colors.gray.dimText, lineHeight:1 }}>+</span>
              </div>
            )}
          </div>

          {/* Tabs */}
          <div style={{ display:'flex', borderBottom:`1px solid ${colors.gray.border}` }}>
            <button className={`cp-tab${tab==='booking'?' active':''}`} onClick={() => setTab('booking')}>AGENDAMENTO</button>
            <button className={`cp-tab${tab==='info'?' active':''}`} onClick={() => setTab('info')}>INFORMAÇÕES</button>
          </div>
        </div>

        {/* Body */}
        <div style={{ flex:1, overflowY:'auto', padding:'16px 20px' }}>

          {error && <div style={{ marginBottom:12, padding:'9px 12px', borderRadius:radius.sm, background:'rgba(220,38,38,0.06)', border:`1px solid ${colors.red.border}`, color:colors.red.dark, fontSize:typography.scale.sm }}>{error}</div>}
          {success && <div style={{ marginBottom:12, padding:'9px 12px', borderRadius:radius.sm, background:'rgba(22,163,74,0.06)', border:'1px solid rgba(22,163,74,0.2)', color:'#15803d', fontSize:typography.scale.sm, display:'flex', alignItems:'center', gap:6 }}><Check size={13}/> Agendamento confirmado!</div>}

          {tab === 'booking' ? (
            <>
              {/* Data */}
              <div style={{ marginBottom:14 }}>
                <span className="cp-lbl">Data</span>
                <div className="cp-field">
                  <span style={{ fontSize:typography.scale.base, fontWeight:typography.weight.semibold, color:colors.gray[900] }}>{dateLabel}</span>
                </div>
              </div>

              {/* Serviço */}
              <div style={{ marginBottom:14 }}>
                <span className="cp-lbl">Serviço *</span>
                <button className={`cp-svc${selectedService ? ' has-value' : ''}`} onClick={() => setShowSvcSheet(true)}>
                  <div>
                    <div style={{ fontSize:typography.scale.base, fontWeight: selectedService ? typography.weight.semibold : typography.weight.normal, color: selectedService ? colors.gray[900] : colors.gray.dimTextLight }}>
                      {selectedService ? selectedService.name : 'Selecione o serviço'}
                    </div>
                    {selectedService && (
                      <div style={{ fontSize:typography.scale.xs, color:colors.gray.dimText, marginTop:2, display:'flex', alignItems:'center', gap:3 }}>
                        <Clock size={10} strokeWidth={2} color={colors.gray.dimText} />
                        {selectedService.duration}min
                        {selectedService.price != null && <> · R$ {selectedService.price.toFixed(2).replace('.', ',')}</>}
                      </div>
                    )}
                  </div>
                  <ChevronRight size={15} color={selectedService ? colors.red.DEFAULT : colors.gray.dimText} />
                </button>
              </div>

              {/* Horários */}
              <div style={{ display:'flex', gap:12, marginBottom:14 }}>
                <div style={{ flex:1 }}>
                  <span className="cp-lbl">Início</span>
                  <div style={{ border:`1px solid ${colors.gray.borderMd}`, borderRadius:radius.sm, overflow:'hidden', background:colors.background.page, display:'flex' }}>
                    <TimeWheel value={selectedTime} onChange={setSelectedTime} />
                  </div>
                </div>
                <div style={{ flex:1 }}>
                  <span className="cp-lbl">Fim</span>
                  <div style={{ border:`1px solid ${colors.gray.borderMd}`, borderRadius:radius.sm, background:colors.background.page, height:ITEM_H*VISIBLE, display:'flex', alignItems:'center', justifyContent:'center' }}>
                    <span style={{ fontSize:typography.scale.lg, fontWeight:typography.weight.bold, color: endTime ? colors.gray[900] : colors.gray.dimTextLight, fontVariantNumeric:'tabular-nums' }}>
                      {endTime ?? '--:--'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Profissional */}
              {professionals.length > 1 && (
                <div style={{ marginBottom:14 }}>
                  <span className="cp-lbl">Funcionário</span>
                  <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
                    {professionals.map(p => (
                      <button key={p.id} className={`cp-prof${selectedProf===p.id?' sel':''}`} onClick={() => setSelectedProf(p.id)}>{p.name}</button>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            /* Tab Informações — campos manuais se não houver cliente selecionado */
            <>
              {selectedClient ? (
                <div style={{ padding:'14px', borderRadius:radius.sm, background:colors.red.subtle, border:`1px solid ${colors.red.border}`, marginBottom:14 }}>
                  <div style={{ fontSize:typography.scale.sm, color:colors.gray.dimText, marginBottom:4 }}>Cliente selecionado</div>
                  <div style={{ fontSize:typography.scale.md, fontWeight:typography.weight.bold, color:colors.gray[900] }}>{selectedClient.name}</div>
                  <div style={{ fontSize:typography.scale.sm, color:colors.gray.dimText, marginTop:2 }}>{selectedClient.phone}</div>
                  <button onClick={() => setSelectedClient(null)} style={{ marginTop:10, fontSize:typography.scale.sm, color:colors.red.DEFAULT, fontWeight:typography.weight.semibold, background:'none', border:'none', cursor:'pointer', padding:0 }}>
                    Remover cliente
                  </button>
                </div>
              ) : (
                <>
                  <div style={{ marginBottom:14 }}>
                    <span className="cp-lbl">Nome do cliente *</span>
                    <div style={{ position:'relative' }}>
                      <User size={13} color={colors.gray.dimText} style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', pointerEvents:'none' }} />
                      <input className="cp-input" style={{ paddingLeft:34 }} placeholder="Ex: Lucas Mendes" value={clientName} onChange={e => setClientName(e.target.value)} />
                    </div>
                  </div>
                  <div>
                    <span className="cp-lbl">Telefone</span>
                    <div style={{ position:'relative' }}>
                      <Phone size={13} color={colors.gray.dimText} style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', pointerEvents:'none' }} />
                      <input className="cp-input" style={{ paddingLeft:34 }} placeholder="(11) 99999-9999" value={clientPhone} onChange={e => setClientPhone(e.target.value)} />
                    </div>
                  </div>
                </>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding:'12px 20px 20px', borderTop:`1px solid ${colors.gray.border}`, flexShrink:0, background:colors.background.surface, backdropFilter:glass.blur.sm }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-end', marginBottom:12 }}>
            <div>
              <div style={{ fontSize:typography.scale.xs, fontWeight:typography.weight.bold, color:colors.gray.dimText, textTransform:'uppercase', letterSpacing:'.07em', marginBottom:2 }}>Total</div>
              <div style={{ fontSize:22, fontWeight:typography.weight.bold, color:colors.gray[900], fontVariantNumeric:'tabular-nums' }}>R$ {total.toFixed(2).replace('.', ',')}</div>
            </div>
            <div style={{ textAlign:'right' }}>
              <div style={{ fontSize:typography.scale.xs, fontWeight:typography.weight.bold, color:colors.gray.dimText, textTransform:'uppercase', letterSpacing:'.07em', marginBottom:2 }}>A ser pago</div>
              <div style={{ fontSize:22, fontWeight:typography.weight.bold, color:colors.gray[900], fontVariantNumeric:'tabular-nums' }}>R$ {total.toFixed(2).replace('.', ',')}</div>
            </div>
          </div>
          <div style={{ display:'flex', gap:8 }}>
            <button className="cp-discard" onClick={onClose}>DESCARTAR</button>
            <button className="cp-save" disabled={isDisabled} onClick={handleSave}
              style={{
                background: success ? 'linear-gradient(135deg,#16a34a,#15803d)' : isDisabled ? undefined : colors.red.gradient,
                boxShadow:  success ? '0 4px 14px rgba(22,163,74,0.28)' : isDisabled ? 'none' : shadows.redMd,
              }}
            >
              {success ? '✓ CONFIRMADO' : saving ? 'SALVANDO...' : 'SALVAR'}
            </button>
          </div>
        </div>
      </div>
    </>
  )

  return createPortal(panel, document.body)
}