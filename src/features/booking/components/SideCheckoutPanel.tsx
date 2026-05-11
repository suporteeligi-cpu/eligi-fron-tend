'use client'
// src/features/booking/components/SideCheckoutPanel.tsx

import { useState, useEffect } from 'react'
import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import api from '@/shared/lib/apiClient'
import { AgendaBooking, AgendaProfessional } from '@/features/agenda/types'

dayjs.extend(utc)

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
  booking:        AgendaBooking | null   // para pré-preencher no modo edit
  professionals:  AgendaProfessional[]
  selectedDate:   Date
  onClose:        () => void
}

// Gera slots de 5 em 5 minutos das 08:00 às 20:00
function generateTimeChips(): string[] {
  const chips: string[] = []
  for (let h = 8; h < 20; h++) {
    for (let m = 0; m < 60; m += 5) {
      chips.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`)
    }
  }
  return chips
}

const TIME_CHIPS = generateTimeChips()

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
  const [clientName,       setClientName]       = useState('')
  const [clientPhone,      setClientPhone]       = useState('')
  const [selectedService,  setSelectedService]  = useState<Service | null>(null)
  const [selectedTime,     setSelectedTime]     = useState<string | null>(time)
  const [selectedProf,     setSelectedProf]     = useState<string | null>(professionalId)
  const [services,         setServices]         = useState<Service[]>([])
  const [loading,          setLoading]          = useState(false)
  const [saving,           setSaving]           = useState(false)
  const [success,          setSuccess]          = useState(false)
  const [error,            setError]            = useState<string | null>(null)

  const profName =
    professionals.find(p => p.id === (selectedProf ?? professionalId))?.name ?? 'Profissional'

  // Carrega serviços quando o panel abre
  useEffect(() => {
    if (!open) return
    setLoading(true)
    api
      .get<{ data: Service[] }>('/services')
      .then((res) => {
        const list = Array.isArray(res.data)
          ? res.data
          : (res.data as { data: Service[] })?.data ?? []
        setServices(list)
      })
      .catch(() => setServices([]))
      .finally(() => setLoading(false))
  }, [open])

  // Reseta / pré-preenche campos ao abrir
  useEffect(() => {
    if (!open) return

    if (mode === 'edit' && booking) {
      // Modo edit: pré-preenche com dados do booking
      setClientName(booking.clientName)
      setClientPhone('')
      setSelectedTime(booking.start)
      setSelectedProf(booking.professionalId)
      // Serviço será encontrado depois que `services` carregar
      setSelectedService(null)
    } else {
      // Modo create: limpa tudo, mantém time e prof do clique
      setClientName('')
      setClientPhone('')
      setSelectedService(null)
      setSelectedTime(time)
      setSelectedProf(professionalId)
    }

    setError(null)
    setSuccess(false)
  }, [open, mode, time, professionalId, booking])

  // Quando services carrega no modo edit, tenta encontrar o serviço pelo nome
  useEffect(() => {
    if (mode === 'edit' && booking && services.length > 0 && !selectedService) {
      const match = services.find(s => s.name === booking.serviceName)
      if (match) setSelectedService(match)
    }
  }, [services, mode, booking, selectedService])

  const endTime =
    selectedService && selectedTime
      ? dayjs(`2000-01-01 ${selectedTime}`).add(selectedService.duration, 'minute').format('HH:mm')
      : null

  async function handleSave() {
    if (!selectedProf || !selectedTime || !selectedService || !clientName.trim()) {
      setError('Preencha todos os campos obrigatórios.')
      return
    }
    try {
      setSaving(true)
      setError(null)
      const dateStr = dayjs(selectedDate).format('YYYY-MM-DD')
      const startAt = dayjs.utc(`${dateStr} ${selectedTime}`).toISOString()

      await api.post('/bookings/confirm', {
        clientName:     clientName.trim(),
        clientPhone:    clientPhone.trim() || undefined,
        serviceId:      selectedService.id,
        professionalId: selectedProf,
        startAt,
      })

      setSuccess(true)
      setTimeout(() => { onClose() }, 1500)
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error
        ?? 'Erro ao salvar agendamento.'
      setError(msg)
    } finally {
      setSaving(false)
    }
  }

  if (!open) return null

  const isDisabled = saving || success || !selectedService || !clientName.trim() || !selectedTime

  return (
    <>
      {/* Overlay */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0,
          background: 'rgba(0,0,0,0.18)',
          backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)',
          zIndex: 9998,
          animation: 'glFadeIn 0.2s ease',
        }}
      />

      {/* Modal */}
      <div style={{
        position: 'fixed', top: '50%', left: '50%',
        transform: 'translate(-50%,-50%)',
        width: 360, maxWidth: '94vw', maxHeight: '88vh',
        background: 'rgba(255,255,255,0.92)',
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
          .svc-btn.sel  { background:rgba(220,38,38,0.06); border-color:rgba(220,38,38,0.35); color:#b91c1c; font-weight:600; }

          /* Time chips: compactos para caber slots de 5min */
          .time-chip {
            padding:4px 9px; border-radius:16px; font-size:11px; font-weight:500;
            border:1px solid rgba(0,0,0,0.08); cursor:pointer;
            background:rgba(255,255,255,0.6); color:#374151;
            transition:all 0.12s; font-family:-apple-system,system-ui,sans-serif;
            font-variant-numeric:tabular-nums; white-space:nowrap;
          }
          .time-chip:hover { border-color:rgba(220,38,38,0.28); background:rgba(220,38,38,0.04); }
          .time-chip.sel {
            background:linear-gradient(135deg,#dc2626,#b91c1c);
            color:#fff; border-color:transparent;
            box-shadow:0 3px 10px rgba(220,38,38,0.25);
          }

          .prof-sel {
            flex:1; padding:8px 12px; border-radius:12px;
            border:1px solid rgba(0,0,0,0.08); background:rgba(255,255,255,0.6);
            color:#374151; font-size:13px; cursor:pointer; transition:all 0.15s; text-align:center;
            font-family:-apple-system,system-ui,sans-serif;
          }
          .prof-sel:hover { border-color:rgba(220,38,38,0.25); }
          .prof-sel.sel {
            background:linear-gradient(135deg,#dc2626,#b91c1c);
            color:#fff; border-color:transparent;
            box-shadow:0 3px 10px rgba(220,38,38,0.22);
          }

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

          /* Scrollbar fina na lista de horários */
          .time-scroll::-webkit-scrollbar { width:4px; height:4px; }
          .time-scroll::-webkit-scrollbar-track { background:transparent; }
          .time-scroll::-webkit-scrollbar-thumb { background:rgba(0,0,0,0.12); border-radius:4px; }
        `}</style>

        {/* Header */}
        <div style={{ padding:'20px 20px 14px', borderBottom:'1px solid rgba(0,0,0,0.07)' }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
            <div>
              <h2 style={{ margin:0, fontSize:17, fontWeight:700, color:'#111827', letterSpacing:'-0.3px' }}>
                {mode === 'create' ? 'Novo Agendamento' : 'Editar Agendamento'}
              </h2>
              <p style={{ margin:'3px 0 0', fontSize:12, color:'rgba(0,0,0,0.4)' }}>
                {selectedTime && endTime ? `${selectedTime} – ${endTime} · ${profName}` : profName}
              </p>
            </div>
            <button className="close-btn" onClick={onClose}>✕</button>
          </div>
        </div>

        {/* Body */}
        <div style={{ flex:1, overflowY:'auto', padding:'16px 20px' }}>

          {success && (
            <div style={{ padding:'12px 14px', borderRadius:12, background:'rgba(100,116,139,0.08)', border:'1px solid rgba(100,116,139,0.2)', color:'#334155', fontSize:13, marginBottom:14, display:'flex', alignItems:'center', gap:8 }}>
              <span style={{ fontSize:15, color:'#dc2626' }}>✓</span> Agendamento confirmado!
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

          {/* Horários — 5 em 5 min com scroll */}
          <div>
            <label style={{ display:'block', fontSize:10, fontWeight:700, color:'rgba(0,0,0,0.35)', marginBottom:8, letterSpacing:'0.08em', textTransform:'uppercase' }}>
              Horário *
            </label>
            <div
              className="time-scroll"
              style={{ display:'flex', flexWrap:'wrap', gap:5, maxHeight:160, overflowY:'auto', paddingRight:2 }}
            >
              {TIME_CHIPS.map(t => (
                <button key={t} className={`time-chip${selectedTime === t ? ' sel' : ''}`} onClick={() => setSelectedTime(t)}>
                  {t}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{ padding:'14px 20px 20px', borderTop:'1px solid rgba(0,0,0,0.07)', display:'flex', flexDirection:'column', gap:8 }}>
          <button
            onClick={handleSave}
            disabled={isDisabled}
            style={{
              width:'100%', padding:'14px',
              background: success
                ? 'linear-gradient(135deg,#475569,#334155)'
                : isDisabled
                ? 'rgba(220,38,38,0.25)'
                : 'linear-gradient(135deg,#dc2626,#b91c1c)',
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