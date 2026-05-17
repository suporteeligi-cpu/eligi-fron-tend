'use client'
// src/features/booking/components/SideCheckoutPanel.tsx

import { useState, useEffect, useRef, useCallback } from 'react'
import { X, ChevronRight, Clock, User, Phone, Check } from 'lucide-react'
import dayjs from 'dayjs'
import utc      from 'dayjs/plugin/utc'
import timezone from 'dayjs/plugin/timezone'
import api from '@/shared/lib/apiClient'
import { AgendaBooking, AgendaProfessional } from '@/features/agenda/types'

dayjs.extend(utc)
dayjs.extend(timezone)

type Service = { id: string; name: string; duration: number; price?: number }

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
const ITEM_H     = 44
const VISIBLE    = 5

// ─── TimeWheel ────────────────────────────────────────────────────────────────
function TimeWheel({ value, onChange }: { value: string; onChange: (t: string) => void }) {
  const containerRef  = useRef<HTMLDivElement>(null)
  const isDragging    = useRef(false)
  const startY        = useRef(0)
  const startScroll   = useRef(0)
  const scrollTimer   = useRef<ReturnType<typeof setTimeout> | null>(null)
  const selectedIdx   = TIME_SLOTS.indexOf(value)
  const paddingSlots  = Math.floor(VISIBLE / 2)
  const containerH    = VISIBLE * ITEM_H

  const scrollTo = useCallback((idx: number, smooth = true) => {
    containerRef.current?.scrollTo({ top: idx * ITEM_H, behavior: smooth ? 'smooth' : 'instant' })
  }, [])

  useEffect(() => { if (selectedIdx >= 0) scrollTo(selectedIdx, false) }, [selectedIdx, scrollTo])

  const snapToNearest = useCallback(() => {
    if (!containerRef.current) return
    const idx     = Math.round(containerRef.current.scrollTop / ITEM_H)
    const clamped = Math.max(0, Math.min(idx, TIME_SLOTS.length - 1))
    scrollTo(clamped)
    onChange(TIME_SLOTS[clamped])
  }, [onChange, scrollTo])

  function onScroll() {
    if (scrollTimer.current) clearTimeout(scrollTimer.current)
    scrollTimer.current = setTimeout(snapToNearest, 120)
  }

  return (
    <div style={{ position:'relative', height:containerH, userSelect:'none' }}>
      <div style={{ position:'absolute', top:0, left:0, right:0, height:paddingSlots*ITEM_H, background:'linear-gradient(to bottom,rgba(255,255,255,0.96),rgba(255,255,255,0))', zIndex:2, pointerEvents:'none' }} />
      <div style={{ position:'absolute', top:paddingSlots*ITEM_H, left:0, right:0, height:ITEM_H, background:'rgba(220,38,38,0.06)', borderTop:'1px solid rgba(220,38,38,0.15)', borderBottom:'1px solid rgba(220,38,38,0.15)', borderRadius:10, zIndex:2, pointerEvents:'none' }} />
      <div style={{ position:'absolute', bottom:0, left:0, right:0, height:paddingSlots*ITEM_H, background:'linear-gradient(to top,rgba(255,255,255,0.96),rgba(255,255,255,0))', zIndex:2, pointerEvents:'none' }} />
      <div
        ref={containerRef}
        onScroll={onScroll}
        onTouchStart={e => { startY.current = e.touches[0].clientY; startScroll.current = containerRef.current?.scrollTop ?? 0 }}
        onTouchMove={e => { if (containerRef.current) containerRef.current.scrollTop = startScroll.current + (startY.current - e.touches[0].clientY) }}
        onTouchEnd={snapToNearest}
        onMouseDown={e => { isDragging.current = true; startY.current = e.clientY; startScroll.current = containerRef.current?.scrollTop ?? 0 }}
        onMouseMove={e => { if (isDragging.current && containerRef.current) containerRef.current.scrollTop = startScroll.current + (startY.current - e.clientY) }}
        onMouseUp={() => { isDragging.current = false; snapToNearest() }}
        onMouseLeave={() => { isDragging.current = false; snapToNearest() }}
        style={{ height:'100%', overflowY:'scroll', scrollbarWidth:'none', cursor:'grab' }}
      >
        <div style={{ height:paddingSlots*ITEM_H }} />
        {TIME_SLOTS.map((t, i) => {
          const dist = Math.abs(i - selectedIdx)
          return (
            <div key={t} onClick={() => { onChange(t); scrollTo(i) }} style={{
              height:ITEM_H, display:'flex', alignItems:'center', justifyContent:'center',
              fontSize:17, fontWeight:dist===0?700:500,
              color:dist===0?'#dc2626':'#111827',
              opacity:dist===0?1:dist===1?0.5:0.2,
              transform:`scale(${dist===0?1:dist===1?0.88:0.78})`,
              transition:'opacity 0.15s,transform 0.15s',
              cursor:'pointer', fontVariantNumeric:'tabular-nums', letterSpacing:'0.02em',
            }}>{t}</div>
          )
        })}
        <div style={{ height:paddingSlots*ITEM_H }} />
      </div>
    </div>
  )
}

// ─── ServiceSheet — bottom sheet para selecionar serviço ─────────────────────
function ServiceSheet({ services, selected, onSelect, onClose, loading }: {
  services: Service[]; selected: Service | null
  onSelect: (s: Service) => void; onClose: () => void; loading: boolean
}) {
  // Agrupa por categoria (se disponível)
  return (
    <>
      <div onClick={onClose} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.25)', backdropFilter:'blur(6px)', zIndex:10000 }} />
      <div style={{
        position:'fixed', bottom:0, left:0, right:0,
        maxHeight:'75vh', background:'#fff',
        borderRadius:'20px 20px 0 0',
        boxShadow:'0 -8px 40px rgba(0,0,0,0.15)',
        zIndex:10001, display:'flex', flexDirection:'column',
        fontFamily:'-apple-system,"SF Pro Display",system-ui,sans-serif',
        animation:'sheetUp 0.28s cubic-bezier(0.34,1.56,0.64,1)',
      }}>
        <style>{`@keyframes sheetUp{from{transform:translateY(100%)}to{transform:translateY(0)}}`}</style>
        <div style={{ padding:'12px 20px 0', display:'flex', alignItems:'center', justifyContent:'space-between', flexShrink:0 }}>
          <div style={{ width:36, height:4, borderRadius:2, background:'rgba(0,0,0,0.12)', margin:'0 auto 12px' }} />
        </div>
        <div style={{ padding:'0 20px 12px', flexShrink:0, borderBottom:'1px solid rgba(0,0,0,0.07)' }}>
          <h3 style={{ margin:0, fontSize:17, fontWeight:700, color:'#111827' }}>Selecione o serviço</h3>
        </div>
        <div style={{ flex:1, overflowY:'auto', padding:'8px 0 24px' }}>
          {loading ? (
            <div style={{ padding:32, textAlign:'center', color:'rgba(0,0,0,0.35)', fontSize:14 }}>Carregando...</div>
          ) : services.length === 0 ? (
            <div style={{ padding:32, textAlign:'center', color:'rgba(0,0,0,0.35)', fontSize:14 }}>Nenhum serviço cadastrado</div>
          ) : (
            services.map(s => (
              <button key={s.id} onClick={() => { onSelect(s); onClose() }} style={{
                width:'100%', display:'flex', alignItems:'center', gap:12,
                padding:'14px 20px', border:'none', background:'transparent',
                cursor:'pointer', textAlign:'left',
                borderBottom:'1px solid rgba(0,0,0,0.05)',
                transition:'background 0.1s',
              }}
                onMouseEnter={e => (e.currentTarget.style.background = 'rgba(0,0,0,0.03)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              >
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontSize:14, fontWeight:600, color:'#111827' }}>{s.name}</div>
                  <div style={{ fontSize:12, color:'rgba(0,0,0,0.45)', marginTop:2, display:'flex', alignItems:'center', gap:4 }}>
                    <Clock size={11} />
                    {s.duration}min
                    {s.price != null && <span style={{ marginLeft:6, fontWeight:500 }}>· R$ {s.price.toFixed(2).replace('.', ',')}</span>}
                  </div>
                </div>
                {selected?.id === s.id && <Check size={18} color="#dc2626" strokeWidth={2.5} />}
              </button>
            ))
          )}
        </div>
      </div>
    </>
  )
}

// ─── Panel principal ──────────────────────────────────────────────────────────
export default function SideCheckoutPanel({
  open, mode, time, professionalId, booking, professionals, selectedDate, onClose,
}: Props) {
  const [tab,             setTab]             = useState<'booking' | 'info'>('booking')
  const [clientName,      setClientName]      = useState('')
  const [clientPhone,     setClientPhone]     = useState('')
  const [selectedService, setSelectedService] = useState<Service | null>(null)
  const [selectedTime,    setSelectedTime]    = useState(time ?? '09:00')
  const [selectedProf,    setSelectedProf]    = useState<string | null>(professionalId)
  const [services,        setServices]        = useState<Service[]>([])
  const [loading,         setLoading]         = useState(false)
  const [saving,          setSaving]          = useState(false)
  const [success,         setSuccess]         = useState(false)
  const [error,           setError]           = useState<string | null>(null)
  const [showSvcSheet,    setShowSvcSheet]    = useState(false)

  const profName = professionals.find(p => p.id === selectedProf)?.name ?? 'Profissional'
  const endTime  = selectedService
    ? dayjs(`2000-01-01 ${selectedTime}`).add(selectedService.duration, 'minute').format('HH:mm')
    : null
  const dateLabel = dayjs(selectedDate).format('ddd, DD [de] MMM').replace(/^\w/, c => c.toUpperCase())
  const total     = selectedService?.price ?? 0

  // Carrega serviços
  useEffect(() => {
    if (!open) return
    setLoading(true)
    api.get('/services')
      .then(res => {
        const list = res.data?.data ?? res.data
        setServices(Array.isArray(list) ? list : [])
      })
      .catch(() => setServices([]))
      .finally(() => setLoading(false))
  }, [open])

  // Preenche ao abrir
  useEffect(() => {
    if (!open) return
    setTab('booking')
    setError(null); setSuccess(false)
    if (mode === 'edit' && booking) {
      setClientName(booking.clientName); setClientPhone('')
      setSelectedTime(booking.start); setSelectedProf(booking.professionalId)
      setSelectedService(null)
    } else {
      setClientName(''); setClientPhone('')
      setSelectedService(null)
      setSelectedTime(time ?? '09:00')
      setSelectedProf(professionalId)
    }
  }, [open, mode, time, professionalId, booking])

  // Match serviço no edit
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
      setSaving(true); setError(null)
      const dateStr = dayjs(selectedDate).format('YYYY-MM-DD')
      const startAt = dayjs.tz(`${dateStr} ${selectedTime}`, 'America/Sao_Paulo').toISOString()
      await api.post('/bookings/confirm', {
        clientName: clientName.trim(),
        clientPhone: clientPhone.trim() || undefined,
        serviceId: selectedService.id,
        professionalId: selectedProf,
        startAt,
      })
      setSuccess(true)
      setTimeout(onClose, 1400)
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error ?? 'Erro ao salvar agendamento.'
      setError(msg)
    } finally { setSaving(false) }
  }

  if (!open) return null

  const isDisabled = saving || success || !selectedService || !clientName.trim()

  return (
    <>
      <div onClick={onClose} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.18)', backdropFilter:'blur(6px)', zIndex:9998 }} />

      {showSvcSheet && (
        <ServiceSheet
          services={services} selected={selectedService} loading={loading}
          onSelect={setSelectedService} onClose={() => setShowSvcSheet(false)}
        />
      )}

      {/* Modal */}
      <div style={{
        position:'fixed',
        // Mobile: full bottom sheet; Desktop: modal centralizado
        bottom: 0, left: 0, right: 0,
        maxHeight: '92vh',
        background:'rgba(255,255,255,0.97)',
        backdropFilter:'blur(32px)',
        borderRadius:'20px 20px 0 0',
        boxShadow:'0 -8px 48px rgba(0,0,0,0.18)',
        zIndex:9999,
        display:'flex', flexDirection:'column',
        fontFamily:'-apple-system,"SF Pro Display",system-ui,sans-serif',
        animation:'panelUp 0.28s cubic-bezier(0.34,1.56,0.64,1)',
      }}>
        <style>{`
          @keyframes panelUp{from{transform:translateY(100%)}to{transform:translateY(0)}}
          @media(min-width:640px){
            .checkout-panel{
              top:50% !important; left:50% !important; right:auto !important; bottom:auto !important;
              transform:translate(-50%,-50%) !important;
              width:420px !important; max-height:88vh !important;
              border-radius:24px !important;
              animation:panelScale 0.25s cubic-bezier(0.34,1.56,0.64,1) !important;
            }
            @keyframes panelScale{from{opacity:0;transform:translate(-50%,-50%) scale(0.94)}to{opacity:1;transform:translate(-50%,-50%) scale(1)}}
          }
          .gl-input{width:100%;padding:12px 14px;border-radius:12px;border:1px solid rgba(0,0,0,0.1);background:rgba(255,255,255,0.8);color:#111827;font-size:14px;outline:none;box-sizing:border-box;transition:border-color .15s,box-shadow .15s;font-family:-apple-system,system-ui,sans-serif}
          .gl-input:focus{border-color:rgba(220,38,38,0.4);box-shadow:0 0 0 3px rgba(220,38,38,0.08)}
          .gl-input::placeholder{color:rgba(0,0,0,0.28)}
          .tab-btn{flex:1;padding:10px;border:none;background:transparent;font-size:13px;font-weight:600;cursor:pointer;color:rgba(0,0,0,0.38);border-bottom:2px solid transparent;transition:all .15s;font-family:-apple-system,system-ui,sans-serif}
          .tab-btn.active{color:#dc2626;border-bottom-color:#dc2626}
          .prof-chip{padding:7px 14px;border-radius:20px;border:1px solid rgba(0,0,0,0.1);background:rgba(255,255,255,0.7);font-size:12px;font-weight:600;cursor:pointer;transition:all .15s;color:#374151;font-family:-apple-system,system-ui,sans-serif;white-space:nowrap}
          .prof-chip.sel{background:linear-gradient(135deg,#dc2626,#b91c1c);color:#fff;border-color:transparent;box-shadow:0 3px 10px rgba(220,38,38,0.22)}
        `}</style>

        {/* Handle bar (mobile) */}
        <div style={{ display:'flex', justifyContent:'center', padding:'10px 0 0', flexShrink:0 }}>
          <div style={{ width:36, height:4, borderRadius:2, background:'rgba(0,0,0,0.1)' }} />
        </div>

        {/* Header */}
        <div style={{ padding:'12px 20px 0', flexShrink:0 }}>
          {/* Título + fechar */}
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:14 }}>
            <h2 style={{ margin:0, fontSize:18, fontWeight:700, color:'#111827', letterSpacing:'-0.3px' }}>
              {mode === 'create' ? 'Novo agendamento' : 'Editar agendamento'}
            </h2>
            <button onClick={onClose} style={{ width:30, height:30, borderRadius:'50%', border:'1px solid rgba(0,0,0,0.09)', background:'rgba(255,255,255,0.7)', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>
              <X size={14} color="rgba(0,0,0,0.5)" />
            </button>
          </div>

          {/* Cliente pill */}
          <div style={{ display:'flex', alignItems:'center', gap:12, padding:'12px 14px', borderRadius:14, border:'1px dashed rgba(0,0,0,0.12)', background:'rgba(0,0,0,0.02)', marginBottom:14, cursor:'pointer' }}>
            <div style={{ width:36, height:36, borderRadius:'50%', background:'rgba(0,0,0,0.06)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
              <User size={16} color="rgba(0,0,0,0.3)" />
            </div>
            <span style={{ fontSize:13, color:'rgba(0,0,0,0.4)' }}>Selecione um cliente ou deixe em branco para chegada</span>
            <div style={{ marginLeft:'auto', width:26, height:26, borderRadius:'50%', border:'1px solid rgba(0,0,0,0.1)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
              <span style={{ fontSize:16, color:'rgba(0,0,0,0.4)', lineHeight:1 }}>+</span>
            </div>
          </div>

          {/* Tabs */}
          <div style={{ display:'flex', borderBottom:'1px solid rgba(0,0,0,0.07)' }}>
            <button className={`tab-btn${tab==='booking'?' active':''}`} onClick={() => setTab('booking')}>AGENDAMENTO</button>
            <button className={`tab-btn${tab==='info'?' active':''}`} onClick={() => setTab('info')}>INFORMAÇÕES</button>
          </div>
        </div>

        {/* Body */}
        <div style={{ flex:1, overflowY:'auto', padding:'16px 20px' }}>

          {error && <div style={{ marginBottom:14, padding:'10px 14px', borderRadius:12, background:'rgba(220,38,38,0.06)', border:'1px solid rgba(220,38,38,0.18)', color:'#b91c1c', fontSize:13 }}>{error}</div>}
          {success && <div style={{ marginBottom:14, padding:'12px 14px', borderRadius:12, background:'rgba(34,197,94,0.07)', border:'1px solid rgba(34,197,94,0.2)', color:'#166534', fontSize:13, display:'flex', alignItems:'center', gap:8 }}><Check size={15}/> Agendamento confirmado!</div>}

          {tab === 'booking' ? (
            <>
              {/* Data */}
              <div style={{ marginBottom:4 }}>
                <p style={{ margin:'0 0 4px', fontSize:11, fontWeight:700, color:'rgba(0,0,0,0.35)', letterSpacing:'0.07em', textTransform:'uppercase' }}>Data</p>
                <div style={{ padding:'11px 14px', borderRadius:12, border:'1px solid rgba(0,0,0,0.09)', background:'rgba(255,255,255,0.7)', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                  <span style={{ fontSize:14, fontWeight:600, color:'#111827' }}>{dateLabel}</span>
                </div>
              </div>

              {/* Serviço */}
              <div style={{ margin:'14px 0' }}>
                <p style={{ margin:'0 0 4px', fontSize:11, fontWeight:700, color:'rgba(0,0,0,0.35)', letterSpacing:'0.07em', textTransform:'uppercase' }}>Serviço *</p>
                <button onClick={() => setShowSvcSheet(true)} style={{
                  width:'100%', padding:'12px 14px', borderRadius:12,
                  border:`1px solid ${selectedService ? 'rgba(220,38,38,0.3)' : 'rgba(0,0,0,0.09)'}`,
                  background: selectedService ? 'rgba(220,38,38,0.04)' : 'rgba(255,255,255,0.7)',
                  display:'flex', alignItems:'center', justifyContent:'space-between',
                  cursor:'pointer', textAlign:'left',
                }}>
                  <div>
                    <span style={{ fontSize:14, fontWeight: selectedService ? 600 : 400, color: selectedService ? '#111827' : 'rgba(0,0,0,0.35)' }}>
                      {selectedService ? selectedService.name : 'Selecione o serviço'}
                    </span>
                    {selectedService && (
                      <div style={{ fontSize:11, color:'rgba(0,0,0,0.4)', marginTop:2, display:'flex', alignItems:'center', gap:4 }}>
                        <Clock size={10} /> {selectedService.duration}min
                        {selectedService.price != null && <> · R$ {selectedService.price.toFixed(2).replace('.', ',')}</>}
                      </div>
                    )}
                  </div>
                  <ChevronRight size={16} color="rgba(0,0,0,0.3)" />
                </button>
              </div>

              {/* Horários */}
              <div style={{ display:'flex', gap:12, marginBottom:14 }}>
                <div style={{ flex:1 }}>
                  <p style={{ margin:'0 0 4px', fontSize:11, fontWeight:700, color:'rgba(0,0,0,0.35)', letterSpacing:'0.07em', textTransform:'uppercase' }}>Início</p>
                  <div style={{ border:'1px solid rgba(0,0,0,0.09)', borderRadius:12, overflow:'hidden', background:'rgba(255,255,255,0.7)' }}>
                    <TimeWheel value={selectedTime} onChange={setSelectedTime} />
                  </div>
                </div>
                {endTime && (
                  <div style={{ flex:1 }}>
                    <p style={{ margin:'0 0 4px', fontSize:11, fontWeight:700, color:'rgba(0,0,0,0.35)', letterSpacing:'0.07em', textTransform:'uppercase' }}>Fim</p>
                    <div style={{ border:'1px solid rgba(0,0,0,0.09)', borderRadius:12, overflow:'hidden', background:'rgba(0,0,0,0.02)', display:'flex', alignItems:'center', justifyContent:'center', height:ITEM_H*VISIBLE }}>
                      <span style={{ fontSize:17, fontWeight:700, color:'rgba(0,0,0,0.4)', fontVariantNumeric:'tabular-nums' }}>{endTime}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Profissional */}
              {professionals.length > 1 && (
                <div style={{ marginBottom:14 }}>
                  <p style={{ margin:'0 0 8px', fontSize:11, fontWeight:700, color:'rgba(0,0,0,0.35)', letterSpacing:'0.07em', textTransform:'uppercase' }}>Funcionário</p>
                  <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
                    {professionals.map(p => (
                      <button key={p.id} className={`prof-chip${selectedProf===p.id?' sel':''}`} onClick={() => setSelectedProf(p.id)}>
                        {p.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            /* Tab Informações */
            <>
              <div style={{ marginBottom:14 }}>
                <label style={{ display:'block', fontSize:11, fontWeight:700, color:'rgba(0,0,0,0.35)', letterSpacing:'0.07em', textTransform:'uppercase', marginBottom:6 }}>Nome do cliente *</label>
                <div style={{ position:'relative' }}>
                  <User size={15} color="rgba(0,0,0,0.3)" style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)' }} />
                  <input className="gl-input" style={{ paddingLeft:36 }} placeholder="Ex: Lucas Mendes" value={clientName} onChange={e => setClientName(e.target.value)} />
                </div>
              </div>
              <div>
                <label style={{ display:'block', fontSize:11, fontWeight:700, color:'rgba(0,0,0,0.35)', letterSpacing:'0.07em', textTransform:'uppercase', marginBottom:6 }}>Telefone</label>
                <div style={{ position:'relative' }}>
                  <Phone size={15} color="rgba(0,0,0,0.3)" style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)' }} />
                  <input className="gl-input" style={{ paddingLeft:36 }} placeholder="(11) 99999-9999" value={clientPhone} onChange={e => setClientPhone(e.target.value)} />
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding:'12px 20px 28px', borderTop:'1px solid rgba(0,0,0,0.07)', flexShrink:0 }}>
          {/* Total */}
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'baseline', marginBottom:12 }}>
            <span style={{ fontSize:12, color:'rgba(0,0,0,0.4)', fontWeight:500 }}>Total</span>
            <span style={{ fontSize:20, fontWeight:700, color:'#111827', fontVariantNumeric:'tabular-nums' }}>
              R$ {total.toFixed(2).replace('.', ',')}
            </span>
          </div>

          <div style={{ display:'flex', gap:8 }}>
            <button onClick={onClose} style={{ flex:1, padding:'13px', background:'rgba(0,0,0,0.05)', border:'1px solid rgba(0,0,0,0.08)', borderRadius:12, fontSize:14, fontWeight:600, cursor:'pointer', color:'rgba(0,0,0,0.5)', fontFamily:'-apple-system,system-ui,sans-serif' }}>
              Descartar
            </button>
            <button onClick={handleSave} disabled={isDisabled} style={{
              flex:2, padding:'13px',
              background: success ? '#22c55e' : isDisabled ? 'rgba(220,38,38,0.2)' : 'linear-gradient(135deg,#dc2626,#b91c1c)',
              color:'#fff', border:'none', borderRadius:12,
              fontWeight:700, fontSize:15,
              cursor: isDisabled ? 'not-allowed' : 'pointer',
              boxShadow: isDisabled ? 'none' : '0 4px 16px rgba(220,38,38,0.28)',
              transition:'all 0.2s',
              fontFamily:'-apple-system,system-ui,sans-serif',
              display:'flex', alignItems:'center', justifyContent:'center', gap:6,
            }}>
              {success ? <><Check size={16}/> Confirmado!</> : saving ? 'Salvando...' : 'SALVAR'}
            </button>
          </div>
        </div>
      </div>
    </>
  )
}