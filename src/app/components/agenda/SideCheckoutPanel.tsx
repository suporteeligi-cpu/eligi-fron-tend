'use client'

import { useState, useEffect } from 'react'
import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import api from '@/lib/apiClient'
import { Professional } from './AgendaBoard'

dayjs.extend(utc)

type Service = {
  id: string
  name: string
  duration: number
  price?: number
}

interface Props {
  open: boolean
  mode: 'create' | 'edit'
  time: string | null
  professionalId: string | null
  professionals: Professional[]
  selectedDate: Date
  onClose: () => void
}

export default function SideCheckoutPanel({
  open, mode, time, professionalId, professionals, selectedDate, onClose
}: Props) {
  const [clientName, setClientName] = useState('')
  const [clientPhone, setClientPhone] = useState('')
  const [selectedService, setSelectedService] = useState<Service | null>(null)
  const [selectedTime, setSelectedTime] = useState<string | null>(time)
  const [selectedProf, setSelectedProf] = useState<string | null>(professionalId)
  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const profName = professionals.find(p => p.id === (selectedProf ?? professionalId))?.name ?? 'Profissional'

  // Gera chips de horário das 08:00 às 20:00 de 30 em 30min
  const timeChips: string[] = []
  for (let h = 8; h < 20; h++) {
    timeChips.push(`${String(h).padStart(2,'0')}:00`)
    timeChips.push(`${String(h).padStart(2,'0')}:30`)
  }

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

  useEffect(() => {
    if (open) {
      setClientName('')
      setClientPhone('')
      setSelectedService(null)
      setSelectedTime(time)
      setSelectedProf(professionalId)
      setError(null)
      setSuccess(false)
    }
  }, [open, time, professionalId])

  const endTime = selectedService && selectedTime
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
        clientName: clientName.trim(),
        clientPhone: clientPhone.trim() || undefined,
        serviceId: selectedService.id,
        professionalId: selectedProf,
        startAt
      })

      setSuccess(true)
      setTimeout(() => { onClose() }, 1500)
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })
        ?.response?.data?.error ?? 'Erro ao salvar agendamento.'
      setError(msg)
    } finally {
      setSaving(false)
    }
  }

  if (!open) return null

  return (
    <>
      {/* overlay */}
      <div onClick={onClose} style={{
        position: 'fixed', inset: 0,
        background: 'rgba(30, 10, 10, 0.25)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        zIndex: 9998,
        animation: 'glFadeIn 0.2s ease'
      }} />

      {/* modal */}
      <div style={{
        position: 'fixed',
        top: '50%', left: '50%',
        transform: 'translate(-50%,-50%)',
        width: 340, maxWidth: '94vw',
        maxHeight: '88vh',
        background: 'rgba(255,255,255,0.82)',
        backdropFilter: 'blur(32px)',
        WebkitBackdropFilter: 'blur(32px)',
        borderRadius: 28,
        border: '1px solid rgba(255,255,255,0.6)',
        boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
        zIndex: 9999,
        display: 'flex', flexDirection: 'column',
        animation: 'glSlideIn 0.25s cubic-bezier(0.34,1.56,0.64,1)',
        fontFamily: '-apple-system, "SF Pro Display", system-ui, sans-serif',
        overflow: 'hidden'
      }}>
        <style>{`
          @keyframes glFadeIn { from { opacity:0 } to { opacity:1 } }
          @keyframes glSlideIn { from { opacity:0; transform:translate(-50%,-50%) scale(0.92) } to { opacity:1; transform:translate(-50%,-50%) scale(1) } }
          .gl-input {
            width:100%; padding:11px 14px; border-radius:14px;
            border:1px solid rgba(0,0,0,0.1);
            background:rgba(255,255,255,0.6);
            color:#1a1a2e; font-size:14px; outline:none;
            box-sizing:border-box; transition:border-color 0.15s, box-shadow 0.15s;
            font-family:-apple-system,system-ui,sans-serif;
          }
          .gl-input:focus {
            border-color:rgba(255, 43, 43, 0.5);
            box-shadow:0 0 0 3px rgba(255, 43, 43, 0.1);
          }
          .gl-input::placeholder { color:rgba(46, 26, 26, 0.35); }
          .svc-btn {
            padding:10px 14px; border-radius:14px;
            border:1px solid rgba(0,0,0,0.08);
            background:rgba(255,255,255,0.5);
            color:#1a1a2e; font-size:13px;
            display:flex; align-items:center; justify-content:space-between;
            cursor:pointer; transition:all 0.15s;
            font-family:-apple-system,system-ui,sans-serif;
          }
          .svc-btn:hover { border-color:rgba(255, 43, 43, 0.35); background:rgba(255, 43, 43, 0.04); }
          .svc-btn.sel {
            background:linear-gradient(135deg,rgba(255, 43, 43, 0.12),rgba(230, 92, 92, 0.12));
            border-color:rgba(255, 43, 43, 0.4); color:#2B7DFF; font-weight:600;
          }
          .time-chip {
            padding:6px 12px; border-radius:20px; font-size:12px; font-weight:500;
            border:1px solid rgba(0,0,0,0.08); cursor:pointer;
            background:rgba(255,255,255,0.5); color:#1a1a2e;
            transition:all 0.15s; font-family:-apple-system,system-ui,sans-serif;
            font-variant-numeric:tabular-nums;
          }
          .time-chip:hover { border-color:rgba(255, 43, 43, 0.3); background:rgba(255, 43, 43, 0.06); }
          .time-chip.sel {
            background:linear-gradient(135deg,#2B7DFF,#5E5CE6);
            color:#fff; border-color:transparent;
            box-shadow:0 3px 10px rgba(255, 43, 43, 0.3);
          }
          .prof-sel {
            flex:1; padding:8px 12px; border-radius:14px;
            border:1px solid rgba(0,0,0,0.08);
            background:rgba(255,255,255,0.5); color:#1a1a2e;
            font-size:13px; cursor:pointer; transition:all 0.15s; text-align:center;
            font-family:-apple-system,system-ui,sans-serif;
          }
          .prof-sel:hover { border-color:rgba(255, 43, 43, 0.3); }
          .prof-sel.sel {
            background:linear-gradient(135deg,#2B7DFF,#5E5CE6);
            color:#fff; border-color:transparent;
            box-shadow:0 3px 10px rgba(255, 43, 43, 0.25);
          }
        `}</style>

        {/* header */}
        <div style={{
          padding: '20px 20px 14px',
          borderBottom: '1px solid rgba(255,255,255,0.5)'
        }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
            <div>
              <h2 style={{ margin:0, fontSize:17, fontWeight:600, color:'#1a1a2e', letterSpacing:'-0.3px' }}>
                {mode === 'create' ? 'Novo Agendamento' : 'Editar Agendamento'}
              </h2>
              <p style={{ margin:'3px 0 0', fontSize:12, color:'rgba(26,26,46,0.45)' }}>
                {selectedTime && endTime
                  ? `${selectedTime} – ${endTime} · ${profName}`
                  : profName}
              </p>
            </div>
            <button onClick={onClose} style={{
              width:30, height:30, borderRadius:'50%',
              border:'1px solid rgba(0,0,0,0.1)',
              background:'rgba(255,255,255,0.5)',
              cursor:'pointer', fontSize:14, color:'rgba(26,26,46,0.5)',
              display:'flex', alignItems:'center', justifyContent:'center',
              transition:'all 0.15s'
            }}>✕</button>
          </div>
        </div>

        {/* body scrollable */}
        <div style={{ flex:1, overflowY:'auto', padding:'16px 20px' }}>

          {/* success */}
          {success && (
            <div style={{
              padding:'12px 14px', borderRadius:14,
              background:'rgba(48,209,88,0.1)', border:'1px solid rgba(48,209,88,0.25)',
              color:'#1a6b30', fontSize:13, marginBottom:14,
              display:'flex', alignItems:'center', gap:8
            }}>
              <span style={{ fontSize:16 }}>✓</span> Agendamento confirmado!
            </div>
          )}

          {/* error */}
          {error && (
            <div style={{
              padding:'10px 14px', borderRadius:14,
              background:'rgba(255,55,95,0.08)', border:'1px solid rgba(255,55,95,0.2)',
              color:'#b01a35', fontSize:13, marginBottom:14
            }}>
              {error}
            </div>
          )}

          {/* cliente */}
          <div style={{ marginBottom:14 }}>
            <label style={{ display:'block', fontSize:11, fontWeight:600, color:'rgba(26,26,46,0.45)', marginBottom:6, letterSpacing:'0.06em' }}>
              NOME DO CLIENTE *
            </label>
            <input className="gl-input" placeholder="Ex: Lucas Mendes"
              value={clientName} onChange={e => setClientName(e.target.value)} />
          </div>

          {/* telefone */}
          <div style={{ marginBottom:16 }}>
            <label style={{ display:'block', fontSize:11, fontWeight:600, color:'rgba(26,26,46,0.45)', marginBottom:6, letterSpacing:'0.06em' }}>
              TELEFONE
            </label>
            <input className="gl-input" placeholder="(11) 99999-9999"
              value={clientPhone} onChange={e => setClientPhone(e.target.value)} />
          </div>

          {/* serviços */}
          <div style={{ marginBottom:16 }}>
            <label style={{ display:'block', fontSize:11, fontWeight:600, color:'rgba(26,26,46,0.45)', marginBottom:8, letterSpacing:'0.06em' }}>
              SERVIÇO *
            </label>
            {loading ? (
              <div style={{ padding:'14px', textAlign:'center', color:'rgba(26,26,46,0.4)', fontSize:13 }}>
                Carregando...
              </div>
            ) : (
              <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
                {services.map(s => (
                  <button key={s.id}
                    className={`svc-btn${selectedService?.id === s.id ? ' sel' : ''}`}
                    onClick={() => setSelectedService(selectedService?.id === s.id ? null : s)}>
                    <span>
                      {s.name}
                      <span style={{ marginLeft:8, fontSize:11, opacity:0.6 }}>{s.duration}min</span>
                    </span>
                    <span style={{ display:'flex', alignItems:'center', gap:8 }}>
                      {s.price != null && (
                        <span style={{ fontWeight:600, fontSize:13 }}>
                          R$ {s.price.toFixed(2).replace('.',',')}
                        </span>
                      )}
                      {selectedService?.id === s.id && <span>✓</span>}
                    </span>
                  </button>
                ))}
                {services.length === 0 && (
                  <div style={{ padding:'14px', textAlign:'center', color:'rgba(26,26,46,0.4)', fontSize:13, border:'1px dashed rgba(0,0,0,0.1)', borderRadius:14 }}>
                    Nenhum serviço cadastrado
                  </div>
                )}
              </div>
            )}
          </div>

          {/* profissional */}
          {professionals.length > 1 && (
            <div style={{ marginBottom:16 }}>
              <label style={{ display:'block', fontSize:11, fontWeight:600, color:'rgba(26,26,46,0.45)', marginBottom:8, letterSpacing:'0.06em' }}>
                PROFISSIONAL
              </label>
              <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
                {professionals.map(p => (
                  <button key={p.id}
                    className={`prof-sel${selectedProf === p.id ? ' sel' : ''}`}
                    onClick={() => setSelectedProf(p.id)}>
                    {p.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* horário chips */}
          <div>
            <label style={{ display:'block', fontSize:11, fontWeight:600, color:'rgba(26,26,46,0.45)', marginBottom:8, letterSpacing:'0.06em' }}>
              HORÁRIO *
            </label>
            <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
              {timeChips.map(t => (
                <button key={t}
                  className={`time-chip${selectedTime === t ? ' sel' : ''}`}
                  onClick={() => setSelectedTime(t)}>
                  {t}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* footer */}
        <div style={{
          padding:'14px 20px 20px',
          borderTop:'1px solid rgba(255,255,255,0.5)',
          display:'flex', flexDirection:'column', gap:8
        }}>
          <button
            onClick={handleSave}
            disabled={saving || success || !selectedService || !clientName.trim() || !selectedTime}
            style={{
              width:'100%', padding:'14px',
              background: success
                ? 'linear-gradient(135deg, #30D158, #34c759)'
                : (saving || !selectedService || !clientName.trim() || !selectedTime)
                  ? 'rgba(43,125,255,0.3)'
                  : 'linear-gradient(135deg, #ff2b2b, #e65c5c)',
              color:'#fff', border:'none', borderRadius:14,
              fontWeight:600, fontSize:15, cursor: saving ? 'not-allowed' : 'pointer',
              boxShadow: success ? '0 4px 16px rgba(48,209,88,0.3)' : '0 4px 16px rgba(43,125,255,0.3)',
              transition:'all 0.2s', fontFamily:'-apple-system,system-ui,sans-serif'
            }}>
            {success ? '✓ Confirmado!' : saving ? 'Salvando...' : mode === 'create' ? 'Confirmar agendamento' : 'Atualizar'}
          </button>
          <button onClick={onClose} style={{
            width:'100%', padding:'11px',
            background:'rgba(255,255,255,0.4)', border:'1px solid rgba(0,0,0,0.08)',
            borderRadius:14, fontSize:14, cursor:'pointer',
            color:'rgba(26,26,46,0.5)', fontFamily:'-apple-system,system-ui,sans-serif',
            transition:'all 0.15s'
          }}>
            Cancelar
          </button>
        </div>
      </div>
    </>
  )
}