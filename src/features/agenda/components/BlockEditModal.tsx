'use client'
// src/features/agenda/components/BlockEditModal.tsx

import { useState } from 'react'
import { X, Ban, Trash2 } from 'lucide-react'
import { AgendaBlock, AgendaProfessional } from '../types'
import api from '@/shared/lib/apiClient'
import dayjs from 'dayjs'

interface Props {
  block:         AgendaBlock
  professionals: AgendaProfessional[]
  onClose:       () => void
  onDeleted:     (id: string) => void
  onUpdated:     (block: AgendaBlock) => void
}

function generateTimeOptions(): string[] {
  const opts: string[] = []
  for (let h = 0; h < 24; h++)
    for (let m = 0; m < 60; m += 15)
      opts.push(`${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`)
  return opts
}
const TIME_OPTIONS = generateTimeOptions()

export default function BlockEditModal({ block, professionals, onClose, onDeleted, onUpdated }: Props) {
  const [startTime, setStartTime] = useState(block.startTime)
  const [endTime,   setEndTime]   = useState(block.endTime)
  const [profId,    setProfId]    = useState(block.professionalId)
  const [reason,    setReason]    = useState(block.reason ?? '')
  const [saving,    setSaving]    = useState(false)
  const [deleting,  setDeleting]  = useState(false)
  const [error,     setError]     = useState<string | null>(null)
  const [confirmDel,setConfirmDel]= useState(false)

  const profName = professionals.find(p => p.id === block.professionalId)?.name ?? 'Profissional'
  const dateLabel = dayjs(block.date).format('ddd, DD [de] MMM')

  async function handleSave() {
    if (startTime >= endTime) { setError('Início deve ser antes do fim'); return }
    try {
      setSaving(true); setError(null)
      const res  = await api.put(`/blocks/${block.id}`, { startTime, endTime, professionalId: profId, reason: reason.trim() || undefined })
      const data = res.data?.data ?? res.data
      onUpdated({ ...block, startTime, endTime, professionalId: profId, reason: reason.trim() || null, ...data })
      onClose()
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { error?: string; message?: string } } })?.response?.data
      setError(msg?.error ?? msg?.message ?? 'Erro ao salvar')
    } finally { setSaving(false) }
  }

  async function handleDelete() {
    try {
      setDeleting(true)
      await api.delete(`/blocks/${block.id}`)
      onDeleted(block.id)
      onClose()
    } catch {
      setError('Erro ao remover bloqueio')
    } finally { setDeleting(false) }
  }

  return (
    <>
      <div onClick={onClose} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.2)', backdropFilter:'blur(6px)', zIndex:9998 }} />
      <div style={{
        position:'fixed', top:'50%', left:'50%', transform:'translate(-50%,-50%)',
        width:380, maxWidth:'94vw',
        background:'rgba(255,255,255,0.95)', backdropFilter:'blur(32px)',
        borderRadius:20, border:'1px solid rgba(0,0,0,0.08)',
        boxShadow:'0 24px 64px rgba(0,0,0,0.14)',
        zIndex:9999, display:'flex', flexDirection:'column',
        fontFamily:'-apple-system,"SF Pro Display",system-ui,sans-serif',
        animation:'beModalIn 0.22s cubic-bezier(0.34,1.56,0.64,1)',
        overflow:'hidden',
      }}>
        <style>{`
          @keyframes beModalIn{from{opacity:0;transform:translate(-50%,-50%) scale(0.95)}to{opacity:1;transform:translate(-50%,-50%) scale(1)}}
          .be-input{width:100%;padding:9px 13px;border-radius:10px;border:1px solid rgba(0,0,0,0.1);background:rgba(255,255,255,0.8);color:#111827;font-size:13px;outline:none;box-sizing:border-box;font-family:-apple-system,system-ui,sans-serif;transition:border-color .15s,box-shadow .15s;appearance:none}
          .be-input:focus{border-color:rgba(71,85,105,0.4);box-shadow:0 0 0 3px rgba(71,85,105,0.08)}
        `}</style>

        {/* Header */}
        <div style={{ padding:'18px 20px 14px', borderBottom:'1px solid rgba(0,0,0,0.07)', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <div style={{ width:32, height:32, borderRadius:9, background:'rgba(71,85,105,0.10)', border:'1px solid rgba(71,85,105,0.18)', display:'flex', alignItems:'center', justifyContent:'center' }}>
              <Ban size={16} color="#475569" strokeWidth={2} />
            </div>
            <div>
              <h2 style={{ margin:0, fontSize:15, fontWeight:700, color:'#111827' }}>Editar bloqueio de horário</h2>
              <p style={{ margin:0, fontSize:11, color:'rgba(0,0,0,0.4)' }}>{profName} · {dateLabel}</p>
            </div>
          </div>
          <button onClick={onClose} style={{ width:28, height:28, borderRadius:'50%', border:'1px solid rgba(0,0,0,0.09)', background:'rgba(255,255,255,0.7)', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>
            <X size={13} color="rgba(0,0,0,0.4)" />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding:'18px 20px', display:'flex', flexDirection:'column', gap:14, overflowY:'auto' }}>
          {error && <div style={{ padding:'9px 13px', borderRadius:9, background:'rgba(220,38,38,0.06)', border:'1px solid rgba(220,38,38,0.18)', color:'#b91c1c', fontSize:12 }}>{error}</div>}

          {/* Profissional */}
          {professionals.length > 1 && (
            <div>
              <label style={{ display:'block', fontSize:10, fontWeight:700, color:'rgba(0,0,0,0.38)', letterSpacing:'0.08em', textTransform:'uppercase', marginBottom:6 }}>Funcionário</label>
              <div style={{ position:'relative' }}>
                <select className="be-input" value={profId} onChange={e => setProfId(e.target.value)} style={{ cursor:'pointer' }}>
                  {professionals.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
                <div style={{ position:'absolute', right:10, top:'50%', transform:'translateY(-50%)', pointerEvents:'none', fontSize:10, color:'rgba(0,0,0,0.3)' }}>▾</div>
              </div>
            </div>
          )}

          {/* Horários */}
          <div>
            <label style={{ display:'block', fontSize:10, fontWeight:700, color:'rgba(0,0,0,0.38)', letterSpacing:'0.08em', textTransform:'uppercase', marginBottom:6 }}>Horário</label>
            <div style={{ display:'flex', gap:8, alignItems:'center' }}>
              <div style={{ position:'relative', flex:1 }}>
                <select className="be-input" value={startTime} onChange={e => setStartTime(e.target.value)} style={{ cursor:'pointer' }}>
                  {TIME_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
                <div style={{ position:'absolute', right:10, top:'50%', transform:'translateY(-50%)', pointerEvents:'none', fontSize:10, color:'rgba(0,0,0,0.3)' }}>▾</div>
              </div>
              <span style={{ fontSize:12, color:'rgba(0,0,0,0.35)', fontWeight:500, flexShrink:0 }}>até</span>
              <div style={{ position:'relative', flex:1 }}>
                <select className="be-input" value={endTime} onChange={e => setEndTime(e.target.value)} style={{ cursor:'pointer' }}>
                  {TIME_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
                <div style={{ position:'absolute', right:10, top:'50%', transform:'translateY(-50%)', pointerEvents:'none', fontSize:10, color:'rgba(0,0,0,0.3)' }}>▾</div>
              </div>
            </div>
          </div>

          {/* Motivo */}
          <div>
            <label style={{ display:'block', fontSize:10, fontWeight:700, color:'rgba(0,0,0,0.38)', letterSpacing:'0.08em', textTransform:'uppercase', marginBottom:6 }}>Motivo</label>
            <textarea className="be-input" placeholder="Ex: Almoço, Reunião, Folga..." value={reason} onChange={e => setReason(e.target.value)} rows={3} style={{ resize:'vertical', lineHeight:1.5 }} />
          </div>
        </div>

        {/* Footer */}
        <div style={{ padding:'0 20px 20px', display:'flex', flexDirection:'column', gap:8 }}>
          <div style={{ display:'flex', gap:8 }}>
            <button onClick={handleSave} disabled={saving} style={{ flex:1, padding:'12px', background:saving?'rgba(71,85,105,0.2)':'linear-gradient(135deg,#475569,#334155)', color:'#fff', border:'none', borderRadius:11, fontWeight:600, fontSize:14, cursor:saving?'not-allowed':'pointer', boxShadow:saving?'none':'0 4px 14px rgba(71,85,105,0.25)', transition:'all .2s' }}>
              {saving ? 'Salvando...' : 'Salvar alterações'}
            </button>
            <button onClick={onClose} style={{ padding:'12px 16px', background:'rgba(0,0,0,0.05)', border:'1px solid rgba(0,0,0,0.08)', borderRadius:11, fontSize:13, cursor:'pointer', color:'rgba(0,0,0,0.5)' }}>
              Cancelar
            </button>
          </div>

          {/* Remover */}
          {!confirmDel ? (
            <button onClick={() => setConfirmDel(true)} style={{ width:'100%', padding:'11px', background:'rgba(220,38,38,0.06)', border:'1px solid rgba(220,38,38,0.15)', borderRadius:11, fontSize:13, fontWeight:600, cursor:'pointer', color:'#dc2626', display:'flex', alignItems:'center', justifyContent:'center', gap:6, transition:'all .15s' }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(220,38,38,0.10)' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(220,38,38,0.06)' }}
            >
              <Trash2 size={13} strokeWidth={2.2} />
              Remover bloqueio de horário
            </button>
          ) : (
            <div style={{ display:'flex', gap:8 }}>
              <button onClick={handleDelete} disabled={deleting} style={{ flex:1, padding:'11px', background:'linear-gradient(135deg,#dc2626,#b91c1c)', border:'none', borderRadius:11, fontSize:13, fontWeight:600, cursor:deleting?'not-allowed':'pointer', color:'#fff', boxShadow:'0 4px 14px rgba(220,38,38,0.28)' }}>
                {deleting ? 'Removendo...' : 'Confirmar remoção'}
              </button>
              <button onClick={() => setConfirmDel(false)} style={{ padding:'11px 14px', background:'rgba(0,0,0,0.05)', border:'1px solid rgba(0,0,0,0.08)', borderRadius:11, fontSize:13, cursor:'pointer', color:'rgba(0,0,0,0.5)' }}>
                Não
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  )
}