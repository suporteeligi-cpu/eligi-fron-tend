'use client'
// src/features/agenda/components/BlockModal.tsx

import { useState } from 'react'
import { X, Ban } from 'lucide-react'
import { AgendaProfessional } from '../types'
import api from '@/shared/lib/apiClient'
import dayjs from 'dayjs'

interface Props {
  professionals: AgendaProfessional[]
  selectedDate:  Date
  initialTime?:  string
  initialProfId?:string
  onClose:       () => void
  onCreated:     (block: { id: string; professionalId: string; date: string; startTime: string; endTime: string; reason: string | null }) => void
}

function generateTimeOptions(): string[] {
  const opts: string[] = []
  for (let h = 0; h < 24; h++)
    for (let m = 0; m < 60; m += 15)
      opts.push(`${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`)
  return opts
}
const TIME_OPTIONS = generateTimeOptions()

// Calcula endTime padrão: startTime + 1h
function defaultEnd(start: string): string {
  const [h, m] = start.split(':').map(Number)
  const total  = h * 60 + m + 60
  return `${String(Math.floor(total/60) % 24).padStart(2,'0')}:${String(total%60).padStart(2,'0')}`
}

export default function BlockModal({ professionals, selectedDate, initialTime, initialProfId, onClose, onCreated }: Props) {
  const [profId,    setProfId]    = useState(initialProfId ?? professionals[0]?.id ?? '')
  const [startTime, setStartTime] = useState(initialTime ?? '09:00')
  const [endTime,   setEndTime]   = useState(defaultEnd(initialTime ?? '09:00'))
  const [reason,    setReason]    = useState('')
  const [saving,    setSaving]    = useState(false)
  const [error,     setError]     = useState<string | null>(null)

  async function handleSave() {
    if (!profId)               { setError('Selecione um profissional'); return }
    if (startTime >= endTime)  { setError('Horário de início deve ser antes do fim'); return }

    try {
      setSaving(true); setError(null)
      const date = dayjs(selectedDate).format('YYYY-MM-DD')
      const res  = await api.post('/blocks', { professionalId: profId, date, startTime, endTime, reason: reason.trim() || undefined })
      const data = res.data?.data ?? res.data
      onCreated(data)
      onClose()
    } catch (e: unknown) {
      setError((e as { response?: { data?: { error?: string } } })?.response?.data?.error ?? 'Erro ao criar bloqueio')
    } finally { setSaving(false) }
  }

  return (
    <>
      <div onClick={onClose} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.2)', backdropFilter:'blur(6px)', zIndex:9998 }} />
      <div style={{
        position:'fixed', top:'50%', left:'50%', transform:'translate(-50%,-50%)',
        width:360, maxWidth:'94vw',
        background:'rgba(255,255,255,0.92)', backdropFilter:'blur(32px)',
        borderRadius:20, border:'1px solid rgba(0,0,0,0.08)',
        boxShadow:'0 24px 64px rgba(0,0,0,0.14)',
        zIndex:9999, display:'flex', flexDirection:'column',
        fontFamily:'-apple-system,"SF Pro Display",system-ui,sans-serif',
        animation:'blockModalIn 0.22s cubic-bezier(0.34,1.56,0.64,1)',
        overflow:'hidden',
      }}>
        <style>{`@keyframes blockModalIn{from{opacity:0;transform:translate(-50%,-50%) scale(0.95)}to{opacity:1;transform:translate(-50%,-50%) scale(1)}}`}</style>

        {/* Header */}
        <div style={{ padding:'18px 20px 14px', borderBottom:'1px solid rgba(0,0,0,0.07)', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <div style={{ width:32, height:32, borderRadius:9, background:'rgba(100,116,139,0.12)', border:'1px solid rgba(100,116,139,0.18)', display:'flex', alignItems:'center', justifyContent:'center' }}>
              <Ban size={16} color="#475569" strokeWidth={2} />
            </div>
            <div>
              <h2 style={{ margin:0, fontSize:16, fontWeight:700, color:'#111827' }}>Bloquear horário</h2>
              <p style={{ margin:0, fontSize:11, color:'rgba(0,0,0,0.4)' }}>{dayjs(selectedDate).format('DD/MM/YYYY')}</p>
            </div>
          </div>
          <button onClick={onClose} style={{ width:28, height:28, borderRadius:'50%', border:'1px solid rgba(0,0,0,0.09)', background:'rgba(255,255,255,0.7)', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>
            <X size={13} color="rgba(0,0,0,0.4)" />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding:'18px 20px', display:'flex', flexDirection:'column', gap:14 }}>
          <style>{`
            .bl-input{width:100%;padding:9px 13px;border-radius:10px;border:1px solid rgba(0,0,0,0.1);background:rgba(255,255,255,0.8);color:#111827;font-size:13px;outline:none;box-sizing:border-box;font-family:-apple-system,system-ui,sans-serif;transition:border-color .15s,box-shadow .15s;appearance:none;cursor:pointer}
            .bl-input:focus{border-color:rgba(100,116,139,0.5);box-shadow:0 0 0 3px rgba(100,116,139,0.1)}
          `}</style>

          {error && <div style={{ padding:'9px 13px', borderRadius:9, background:'rgba(220,38,38,0.06)', border:'1px solid rgba(220,38,38,0.18)', color:'#b91c1c', fontSize:12 }}>{error}</div>}

          {/* Profissional */}
          {professionals.length > 1 && (
            <div>
              <label style={{ display:'block', fontSize:10, fontWeight:700, color:'rgba(0,0,0,0.38)', letterSpacing:'0.08em', textTransform:'uppercase', marginBottom:6 }}>Profissional</label>
              <div style={{ position:'relative' }}>
                <select className="bl-input" value={profId} onChange={e => setProfId(e.target.value)}>
                  {professionals.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
                <div style={{ position:'absolute', right:10, top:'50%', transform:'translateY(-50%)', pointerEvents:'none', fontSize:10, color:'rgba(0,0,0,0.3)' }}>▾</div>
              </div>
            </div>
          )}

          {/* Horário */}
          <div>
            <label style={{ display:'block', fontSize:10, fontWeight:700, color:'rgba(0,0,0,0.38)', letterSpacing:'0.08em', textTransform:'uppercase', marginBottom:6 }}>Horário *</label>
            <div style={{ display:'flex', gap:8, alignItems:'center' }}>
              <div style={{ position:'relative', flex:1 }}>
                <select className="bl-input" value={startTime} onChange={e => setStartTime(e.target.value)}>
                  {TIME_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
                <div style={{ position:'absolute', right:10, top:'50%', transform:'translateY(-50%)', pointerEvents:'none', fontSize:10, color:'rgba(0,0,0,0.3)' }}>▾</div>
              </div>
              <span style={{ fontSize:12, color:'rgba(0,0,0,0.35)', fontWeight:500, flexShrink:0 }}>até</span>
              <div style={{ position:'relative', flex:1 }}>
                <select className="bl-input" value={endTime} onChange={e => setEndTime(e.target.value)}>
                  {TIME_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
                <div style={{ position:'absolute', right:10, top:'50%', transform:'translateY(-50%)', pointerEvents:'none', fontSize:10, color:'rgba(0,0,0,0.3)' }}>▾</div>
              </div>
            </div>
          </div>

          {/* Motivo */}
          <div>
            <label style={{ display:'block', fontSize:10, fontWeight:700, color:'rgba(0,0,0,0.38)', letterSpacing:'0.08em', textTransform:'uppercase', marginBottom:6 }}>Motivo (opcional)</label>
            <input className="bl-input" placeholder="Ex: Almoço, Reunião, Folga..." value={reason} onChange={e => setReason(e.target.value)} />
          </div>
        </div>

        {/* Footer */}
        <div style={{ padding:'0 20px 20px', display:'flex', gap:8 }}>
          <button
            onClick={handleSave}
            disabled={saving}
            style={{
              flex:1, padding:'12px',
              background: saving ? 'rgba(71,85,105,0.2)' : 'linear-gradient(135deg,#475569,#334155)',
              color:'#fff', border:'none', borderRadius:11,
              fontWeight:600, fontSize:14, cursor:saving?'not-allowed':'pointer',
              boxShadow: saving ? 'none' : '0 4px 14px rgba(71,85,105,0.28)',
              transition:'all .2s',
            }}
          >
            {saving ? 'Salvando...' : 'Bloquear horário'}
          </button>
          <button onClick={onClose} style={{ padding:'12px 16px', background:'rgba(0,0,0,0.05)', border:'1px solid rgba(0,0,0,0.08)', borderRadius:11, fontSize:13, cursor:'pointer', color:'rgba(0,0,0,0.5)' }}>Cancelar</button>
        </div>
      </div>
    </>
  )
}
