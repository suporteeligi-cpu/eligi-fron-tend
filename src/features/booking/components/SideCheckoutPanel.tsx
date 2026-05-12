'use client'
// src/features/booking/components/SideCheckoutPanel.tsx

import { useState, useEffect, useRef, useCallback } from 'react'
import dayjs from 'dayjs'
import utc      from 'dayjs/plugin/utc'
import timezone from 'dayjs/plugin/timezone'
import api from '@/shared/lib/apiClient'
import { AgendaBooking, AgendaProfessional } from '@/features/agenda/types'

dayjs.extend(utc)
dayjs.extend(timezone)

type Service = {
  id: string
  name: string
  duration: number
  price?: number
}

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

// ─── Gera slots de 5 em 5 min ───────────────────────────────────────────────
function generateTimeSlots(): string[] {
  const slots: string[] = []
  for (let h = 8; h < 20; h++) {
    for (let m = 0; m < 60; m += 5) {
      slots.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`)
    }
  }
  return slots
}

const TIME_SLOTS = generateTimeSlots()
const ITEM_H     = 44   // altura de cada item da roleta (px)
const VISIBLE    = 5    // itens visíveis (ímpar para centralizar o selecionado)

// ─── Componente de roleta estilo Apple ──────────────────────────────────────
function TimeWheel({ value, onChange }: { value: string; onChange: (t: string) => void }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const isDragging   = useRef(false)
  const startY       = useRef(0)
  const startScroll  = useRef(0)

  const selectedIdx = TIME_SLOTS.indexOf(value)

  // Scroll para o item selecionado
  const scrollTo = useCallback((idx: number, smooth = true) => {
    if (!containerRef.current) return
    containerRef.current.scrollTo({
      top:      idx * ITEM_H,
      behavior: smooth ? 'smooth' : 'instant',
    })
  }, [])

  useEffect(() => {
    if (selectedIdx >= 0) scrollTo(selectedIdx, false)
  }, [selectedIdx, scrollTo])

  // Snap ao item mais próximo após scroll
  const snapToNearest = useCallback(() => {
    if (!containerRef.current) return
    const idx = Math.round(containerRef.current.scrollTop / ITEM_H)
    const clamped = Math.max(0, Math.min(idx, TIME_SLOTS.length - 1))
    scrollTo(clamped)
    onChange(TIME_SLOTS[clamped])
  }, [onChange, scrollTo])

  // Touch
  function onTouchStart(e: React.TouchEvent) {
    startY.current     = e.touches[0].clientY
    startScroll.current = containerRef.current?.scrollTop ?? 0
  }
  function onTouchMove(e: React.TouchEvent) {
    if (!containerRef.current) return
    const delta = startY.current - e.touches[0].clientY
    containerRef.current.scrollTop = startScroll.current + delta
  }

  // Mouse drag
  function onMouseDown(e: React.MouseEvent) {
    isDragging.current  = true
    startY.current      = e.clientY
    startScroll.current = containerRef.current?.scrollTop ?? 0
  }
  function onMouseMove(e: React.MouseEvent) {
    if (!isDragging.current || !containerRef.current) return
    const delta = startY.current - e.clientY
    containerRef.current.scrollTop = startScroll.current + delta
  }
  function onMouseUp() { isDragging.current = false; snapToNearest() }

  // Scroll nativo (mouse wheel / trackpad)
  const scrollTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  function onScroll() {
    if (scrollTimer.current) clearTimeout(scrollTimer.current)
    scrollTimer.current = setTimeout(snapToNearest, 120)
  }

  const paddingSlots = Math.floor(VISIBLE / 2)   // 2 slots de padding para centralizar
  const containerH   = VISIBLE * ITEM_H

  return (
    <div style={{ position: 'relative', height: containerH, userSelect: 'none' }}>
      {/* Máscara superior */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0,
        height: paddingSlots * ITEM_H,
        background: 'linear-gradient(to bottom, rgba(255,255,255,0.95), rgba(255,255,255,0))',
        zIndex: 2, pointerEvents: 'none',
      }} />

      {/* Destaque central */}
      <div style={{
        position: 'absolute',
        top: paddingSlots * ITEM_H,
        left: 0, right: 0,
        height: ITEM_H,
        background: 'rgba(220,38,38,0.07)',
        borderTop:    '1px solid rgba(220,38,38,0.18)',
        borderBottom: '1px solid rgba(220,38,38,0.18)',
        borderRadius: 10,
        zIndex: 2, pointerEvents: 'none',
      }} />

      {/* Máscara inferior */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0,
        height: paddingSlots * ITEM_H,
        background: 'linear-gradient(to top, rgba(255,255,255,0.95), rgba(255,255,255,0))',
        zIndex: 2, pointerEvents: 'none',
      }} />

      {/* Lista scrollável */}
      <div
        ref={containerRef}
        onScroll={onScroll}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={snapToNearest}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseUp}
        style={{
          height: '100%',
          overflowY: 'scroll',
          scrollbarWidth: 'none',
          cursor: 'grab',
        }}
      >
        <style>{`.tw-scroll::-webkit-scrollbar { display: none; }`}</style>

        {/* Padding inicial para centralizar primeiro item */}
        <div style={{ height: paddingSlots * ITEM_H }} />

        {TIME_SLOTS.map((t, i) => {
          const dist     = Math.abs(i - selectedIdx)
          const isCenter = dist === 0
          const opacity  = isCenter ? 1 : dist === 1 ? 0.5 : 0.25
          const scale    = isCenter ? 1 : dist === 1 ? 0.88 : 0.78
          const weight   = isCenter ? 700 : 500

          return (
            <div
              key={t}
              onClick={() => { onChange(t); scrollTo(i) }}
              style={{
                height:     ITEM_H,
                display:    'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize:   17,
                fontWeight: weight,
                color:      isCenter ? '#dc2626' : '#111827',
                opacity,
                transform:  `scale(${scale})`,
                transition: 'opacity 0.15s, transform 0.15s',
                cursor:     'pointer',
                fontVariantNumeric: 'tabular-nums',
                letterSpacing: '0.02em',
              }}
            >
              {t}
            </div>
          )
        })}

        {/* Padding final */}
        <div style={{ height: paddingSlots * ITEM_H }} />
      </div>
    </div>
  )
}

// ─── Panel principal ─────────────────────────────────────────────────────────
export default function SideCheckoutPanel({
  open,
  mode,
  time,
  professionalId,
  booking,
  professionals,
  selectedDate,
  onClose,
}: Props) {
  const [clientName,      setClientName]      = useState('')
  const [clientPhone,     setClientPhone]     = useState('')
  const [selectedService, setSelectedService] = useState<Service | null>(null)
  const [selectedTime,    setSelectedTime]    = useState<string>(time ?? '09:00')
  const [selectedProf,    setSelectedProf]    = useState<string | null>(professionalId)
  const [services,        setServices]        = useState<Service[]>([])
  const [loading,         setLoading]         = useState(false)
  const [saving,          setSaving]          = useState(false)
  const [success,         setSuccess]         = useState(false)
  const [error,           setError]           = useState<string | null>(null)

  const profName = professionals.find(p => p.id === selectedProf)?.name ?? 'Profissional'

  const endTime = selectedService
    ? dayjs(`2000-01-01 ${selectedTime}`).add(selectedService.duration, 'minute').format('HH:mm')
    : null

  // Carrega serviços
  useEffect(() => {
    if (!open) return
    setLoading(true)
    api.get<{ data: Service[] }>('/services')
      .then(res => {
        const list = Array.isArray(res.data) ? res.data : (res.data as { data: Service[] })?.data ?? []
        setServices(list)
      })
      .catch(() => setServices([]))
      .finally(() => setLoading(false))
  }, [open])

  // Preenche campos ao abrir
  useEffect(() => {
    if (!open) return
    if (mode === 'edit' && booking) {
      setClientName(booking.clientName)
      setClientPhone('')
      setSelectedTime(booking.start)
      setSelectedProf(booking.professionalId)
      setSelectedService(null)
    } else {
      setClientName('')
      setClientPhone('')
      setSelectedService(null)
      setSelectedTime(time ?? '09:00')
      setSelectedProf(professionalId)
    }
    setError(null)
    setSuccess(false)
  }, [open, mode, time, professionalId, booking])

  // Tenta encontrar serviço no modo edit após services carregar
  useEffect(() => {
    if (mode === 'edit' && booking && services.length > 0 && !selectedService) {
      const match = services.find(s => s.name === booking.serviceName)
      if (match) setSelectedService(match)
    }
  }, [services, mode, booking, selectedService])

  async function handleSave() {
    if (!selectedProf || !selectedTime || !selectedService || !clientName.trim()) {
      setError('Preencha todos os campos obrigatórios.')
      return
    }
    try {
      setSaving(true)
      setError(null)
      const dateStr = dayjs(selectedDate).format('YYYY-MM-DD')
      const startAt = dayjs.tz(`${dateStr} ${selectedTime}`, 'America/Sao_Paulo').toISOString()

      await api.post('/bookings/confirm', {
        clientName:     clientName.trim(),
        clientPhone:    clientPhone.trim() || undefined,
        serviceId:      selectedService.id,
        professionalId: selectedProf,
        startAt,
      })

      setSuccess(true)
      setTimeout(onClose, 1500)
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error
        ?? 'Erro ao salvar agendamento.'
      setError(msg)
    } finally {
      setSaving(false)
    }
  }

  if (!open) return null

  const isDisabled = saving || success || !selectedService || !clientName.trim()

  return (
    <>
      {/* Overlay */}
      <div onClick={onClose} style={{
        position: 'fixed', inset: 0,
        background: 'rgba(0,0,0,0.2)',
        backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)',
        zIndex: 9998, animation: 'glFadeIn 0.2s ease',
      }} />

      {/* Modal */}
      <div style={{
        position: 'fixed', top: '50%', left: '50%',
        transform: 'translate(-50%,-50%)',
        width: 360, maxWidth: '94vw', maxHeight: '90vh',
        background: 'rgba(255,255,255,0.94)',
        backdropFilter: 'blur(32px)', WebkitBackdropFilter: 'blur(32px)',
        borderRadius: 24,
        border: '1px solid rgba(0,0,0,0.08)',
        boxShadow: '0 24px 64px rgba(0,0,0,0.14)',
        zIndex: 9999,
        display: 'flex', flexDirection: 'column',
        animation: 'glSlideIn 0.25s cubic-bezier(0.34,1.56,0.64,1)',
        fontFamily: '-apple-system, "SF Pro Display", system-ui, sans-serif',
        overflow: 'hidden',
      }}>
        <style>{`
          @keyframes glFadeIn  { from { opacity:0 } to { opacity:1 } }
          @keyframes glSlideIn {
            from { opacity:0; transform:translate(-50%,-50%) scale(0.93) }
            to   { opacity:1; transform:translate(-50%,-50%) scale(1) }
          }
          .gl-input {
            width:100%; padding:11px 14px; border-radius:12px;
            border:1px solid rgba(0,0,0,0.1); background:rgba(255,255,255,0.7);
            color:#111827; font-size:14px; outline:none; box-sizing:border-box;
            transition:border-color 0.15s, box-shadow 0.15s;
            font-family:-apple-system,system-ui,sans-serif;
          }
          .gl-input:focus { border-color:rgba(220,38,38,0.45); box-shadow:0 0 0 3px rgba(220,38,38,0.08); }
          .gl-input::placeholder { color:rgba(0,0,0,0.28); }
          .svc-btn {
            padding:10px 14px; border-radius:12px; border:1px solid rgba(0,0,0,0.08);
            background:rgba(255,255,255,0.6); color:#1f2937; font-size:13px;
            display:flex; align-items:center; justify-content:space-between;
            cursor:pointer; transition:all 0.15s;
            font-family:-apple-system,system-ui,sans-serif;
          }
          .svc-btn:hover { border-color:rgba(220,38,38,0.25); background:rgba(220,38,38,0.03); }
          .svc-btn.sel   { background:rgba(220,38,38,0.06); border-color:rgba(220,38,38,0.35); color:#b91c1c; font-weight:600; }
          .prof-sel {
            flex:1; padding:8px 12px; border-radius:12px;
            border:1px solid rgba(0,0,0,0.08); background:rgba(255,255,255,0.6);
            color:#374151; font-size:13px; cursor:pointer; transition:all 0.15s; text-align:center;
            font-family:-apple-system,system-ui,sans-serif;
          }
          .prof-sel:hover { border-color:rgba(220,38,38,0.25); }
          .prof-sel.sel   { background:linear-gradient(135deg,#dc2626,#b91c1c); color:#fff; border-color:transparent; box-shadow:0 3px 10px rgba(220,38,38,0.22); }
          .close-btn {
            width:30px; height:30px; border-radius:50%;
            border:1px solid rgba(0,0,0,0.09); background:rgba(255,255,255,0.6);
            cursor:pointer; font-size:13px; color:rgba(0,0,0,0.4);
            display:flex; align-items:center; justify-content:center; transition:all 0.15s;
          }
          .close-btn:hover { background:rgba(220,38,38,0.08); color:#dc2626; border-color:rgba(220,38,38,0.2); }
          .cancel-btn {
            width:100%; padding:11px; background:rgba(0,0,0,0.04);
            border:1px solid rgba(0,0,0,0.08); border-radius:12px;
            font-size:14px; cursor:pointer; color:rgba(0,0,0,0.45);
            font-family:-apple-system,system-ui,sans-serif; transition:all 0.15s;
          }
          .cancel-btn:hover { background:rgba(0,0,0,0.07); }
        `}</style>

        {/* Header */}
        <div style={{ padding:'20px 20px 14px', borderBottom:'1px solid rgba(0,0,0,0.07)', flexShrink:0 }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
            <div>
              <h2 style={{ margin:0, fontSize:17, fontWeight:700, color:'#111827', letterSpacing:'-0.3px' }}>
                {mode === 'create' ? 'Novo Agendamento' : 'Editar Agendamento'}
              </h2>
              <p style={{ margin:'3px 0 0', fontSize:12, color:'rgba(0,0,0,0.4)' }}>
                {endTime ? `${selectedTime} – ${endTime} · ${profName}` : profName}
              </p>
            </div>
            <button className="close-btn" onClick={onClose}>✕</button>
          </div>
        </div>

        {/* Body */}
        <div style={{ flex:1, overflowY:'auto', padding:'16px 20px' }}>

          {success && (
            <div style={{ padding:'12px 14px', borderRadius:12, background:'rgba(34,197,94,0.08)', border:'1px solid rgba(34,197,94,0.2)', color:'#166534', fontSize:13, marginBottom:14, display:'flex', alignItems:'center', gap:8 }}>
              <span>✓</span> Agendamento confirmado!
            </div>
          )}

          {error && (
            <div style={{ padding:'10px 14px', borderRadius:12, background:'rgba(220,38,38,0.06)', border:'1px solid rgba(220,38,38,0.18)', color:'#b91c1c', fontSize:13, marginBottom:14 }}>
              {error}
            </div>
          )}

          {/* Cliente */}
          <div style={{ marginBottom:14 }}>
            <label style={{ display:'block', fontSize:10, fontWeight:700, color:'rgba(0,0,0,0.35)', marginBottom:6, letterSpacing:'0.08em', textTransform:'uppercase' }}>
              Nome do cliente *
            </label>
            <input className="gl-input" placeholder="Ex: Lucas Mendes" value={clientName} onChange={e => setClientName(e.target.value)} />
          </div>

          {/* Telefone */}
          <div style={{ marginBottom:16 }}>
            <label style={{ display:'block', fontSize:10, fontWeight:700, color:'rgba(0,0,0,0.35)', marginBottom:6, letterSpacing:'0.08em', textTransform:'uppercase' }}>
              Telefone
            </label>
            <input className="gl-input" placeholder="(11) 99999-9999" value={clientPhone} onChange={e => setClientPhone(e.target.value)} />
          </div>

          {/* Serviços */}
          <div style={{ marginBottom:16 }}>
            <label style={{ display:'block', fontSize:10, fontWeight:700, color:'rgba(0,0,0,0.35)', marginBottom:8, letterSpacing:'0.08em', textTransform:'uppercase' }}>
              Serviço *
            </label>
            {loading ? (
              <div style={{ padding:'14px', textAlign:'center', color:'rgba(0,0,0,0.35)', fontSize:13 }}>Carregando...</div>
            ) : (
              <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
                {services.map(s => (
                  <button key={s.id} className={`svc-btn${selectedService?.id === s.id ? ' sel' : ''}`} onClick={() => setSelectedService(selectedService?.id === s.id ? null : s)}>
                    <span>
                      {s.name}
                      <span style={{ marginLeft:8, fontSize:11, opacity:0.55 }}>{s.duration}min</span>
                    </span>
                    <span style={{ display:'flex', alignItems:'center', gap:8 }}>
                      {s.price != null && <span style={{ fontWeight:600, fontSize:13 }}>R$ {s.price.toFixed(2).replace('.', ',')}</span>}
                      {selectedService?.id === s.id && <span style={{ color:'#dc2626' }}>✓</span>}
                    </span>
                  </button>
                ))}
                {services.length === 0 && (
                  <div style={{ padding:'14px', textAlign:'center', color:'rgba(0,0,0,0.32)', fontSize:13, border:'1px dashed rgba(0,0,0,0.1)', borderRadius:12 }}>
                    Nenhum serviço cadastrado
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Profissional */}
          {professionals.length > 1 && (
            <div style={{ marginBottom:16 }}>
              <label style={{ display:'block', fontSize:10, fontWeight:700, color:'rgba(0,0,0,0.35)', marginBottom:8, letterSpacing:'0.08em', textTransform:'uppercase' }}>
                Profissional
              </label>
              <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
                {professionals.map(p => (
                  <button key={p.id} className={`prof-sel${selectedProf === p.id ? ' sel' : ''}`} onClick={() => setSelectedProf(p.id)}>
                    {p.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Horário — roleta estilo Apple */}
          <div>
            <label style={{ display:'block', fontSize:10, fontWeight:700, color:'rgba(0,0,0,0.35)', marginBottom:8, letterSpacing:'0.08em', textTransform:'uppercase' }}>
              Horário *
            </label>
            <div style={{ border:'1px solid rgba(0,0,0,0.08)', borderRadius:16, overflow:'hidden', background:'rgba(255,255,255,0.6)' }}>
              <TimeWheel value={selectedTime} onChange={setSelectedTime} />
            </div>
            {endTime && (
              <p style={{ margin:'6px 0 0', fontSize:11, color:'rgba(0,0,0,0.4)', textAlign:'center' }}>
                Término previsto: <strong>{endTime}</strong>
              </p>
            )}
          </div>
        </div>

        {/* Footer */}
        <div style={{ padding:'14px 20px 20px', borderTop:'1px solid rgba(0,0,0,0.07)', display:'flex', flexDirection:'column', gap:8, flexShrink:0 }}>
          <button
            onClick={handleSave}
            disabled={isDisabled}
            style={{
              width:'100%', padding:'14px',
              background: success ? 'linear-gradient(135deg,#475569,#334155)' : isDisabled ? 'rgba(220,38,38,0.25)' : 'linear-gradient(135deg,#dc2626,#b91c1c)',
              color:'#fff', border:'none', borderRadius:12,
              fontWeight:600, fontSize:15,
              cursor: isDisabled ? 'not-allowed' : 'pointer',
              boxShadow: isDisabled ? 'none' : '0 4px 16px rgba(220,38,38,0.28)',
              transition:'all 0.2s',
              fontFamily:'-apple-system,system-ui,sans-serif',
            }}
          >
            {success ? '✓ Confirmado!' : saving ? 'Salvando...' : mode === 'create' ? 'Confirmar agendamento' : 'Atualizar'}
          </button>
          <button className="cancel-btn" onClick={onClose}>Cancelar</button>
        </div>
      </div>
    </>
  )
}