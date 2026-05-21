'use client'
// src/features/agenda/components/BlockEditModal.tsx

import { useState } from 'react'
import { Ban, Trash2, AlertTriangle } from 'lucide-react'
import { AgendaBlock, AgendaProfessional } from '../types'
import { colors, typography, radius, shadows, transitions } from '@/shared/theme'
import MobileSheet from '@/app/components/ui/MobileSheet'
import { createPortal } from 'react-dom'
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

function defaultEnd(start: string): string {
  const [h, m] = start.split(':').map(Number)
  const total  = h * 60 + m + 60
  return `${String(Math.floor(total/60)%24).padStart(2,'0')}:${String(total%60).padStart(2,'0')}`
}

function ConfirmDelete({ onConfirm, onCancel, deleting }: { onConfirm:()=>void; onCancel:()=>void; deleting:boolean }) {
  return createPortal(
    <>
      <div onClick={onCancel} style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.3)',backdropFilter:'blur(6px)',zIndex:10998}}/>
      <div style={{position:'fixed',top:'50%',left:'50%',transform:'translate(-50%,-50%)',width:320,maxWidth:'90vw',background:'#fff',borderRadius:radius['2xl'],boxShadow:shadows.lg,zIndex:10999,padding:'28px 24px 22px',textAlign:'center',fontFamily:typography.fontFamily}}>
        <div style={{width:52,height:52,borderRadius:radius.full,background:'rgba(220,38,38,0.08)',display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 14px'}}>
          <AlertTriangle size={24} color={colors.red.DEFAULT}/>
        </div>
        <h3 style={{margin:'0 0 8px',fontSize:17,fontWeight:typography.weight.bold,color:typography.color.primary}}>Remover bloqueio?</h3>
        <p style={{margin:'0 0 22px',fontSize:typography.scale.base,color:typography.color.muted,lineHeight:1.5}}>Esse horário ficará disponível para agendamentos novamente.</p>
        <button onClick={onConfirm} disabled={deleting} style={{width:'100%',padding:'12px',marginBottom:8,background:colors.red.gradient,color:'#fff',border:'none',borderRadius:radius.sm,fontWeight:typography.weight.bold,fontSize:typography.scale.base,cursor:deleting?'not-allowed':'pointer',boxShadow:shadows.redSm,opacity:deleting?0.7:1}}>
          {deleting?'Removendo...':'Sim, remover bloqueio'}
        </button>
        <button onClick={onCancel} style={{width:'100%',padding:'11px',background:'rgba(0,0,0,0.04)',border:`1px solid ${colors.gray.borderMd}`,borderRadius:radius.sm,fontSize:typography.scale.base,cursor:'pointer',color:typography.color.muted}}>
          Cancelar
        </button>
      </div>
    </>,
    document.body
  )
}

export default function BlockEditModal({ block, professionals, onClose, onDeleted, onUpdated }: Props) {
  const [startTime,  setStartTime]  = useState(block.startTime)
  const [endTime,    setEndTime]    = useState(block.endTime)
  const [profId,     setProfId]     = useState(block.professionalId)
  const [reason,     setReason]     = useState(block.reason ?? '')
  const [saving,     setSaving]     = useState(false)
  const [deleting,   setDeleting]   = useState(false)
  const [error,      setError]      = useState<string|null>(null)
  const [confirmDel, setConfirmDel] = useState(false)

  const profName  = professionals.find(p => p.id === block.professionalId)?.name ?? 'Profissional'
  const dateLabel = dayjs(block.date).format('ddd, DD [de] MMM').replace(/^\w/, c => c.toUpperCase())

  async function handleSave() {
    if (startTime >= endTime) { setError('Horário de início deve ser antes do fim'); return }
    try {
      setSaving(true); setError(null)
      const res     = await api.put(`/blocks/${block.id}`, { professionalId: profId, startTime, endTime, reason: reason.trim() || 'Indisponibilidade' })
      const updated = res.data?.data ?? res.data
      onUpdated({ ...block, ...updated }); onClose()
    } catch (e: unknown) {
      const msg = (e as {response?:{data?:{error?:string}}})?.response?.data?.error ?? 'Erro ao atualizar'
      setError(msg)
    } finally { setSaving(false) }
  }

  async function handleDelete() {
    try {
      setDeleting(true); setError(null)
      // O AgendaBoard já faz a chamada DELETE — aqui só notifica o pai
      onDeleted(block.id)
      onClose()
    } catch { setError('Erro ao remover bloqueio') }
    finally  { setDeleting(false) }
  }

  const footer = (
    <div style={{display:'flex',flexDirection:'column',gap:8}}>
      <div style={{display:'flex',gap:8}}>
        <button onClick={onClose} style={{flex:1,padding:'12px',borderRadius:radius.sm,border:`1px solid ${colors.gray.borderMd}`,background:'transparent',fontSize:typography.scale.base,fontWeight:typography.weight.semibold,cursor:'pointer',color:typography.color.secondary,fontFamily:typography.fontFamily}}>
          Cancelar
        </button>
        <button onClick={handleSave} disabled={saving} style={{flex:2,padding:'12px',borderRadius:radius.sm,border:'none',background:colors.slate.gradient,color:'#fff',fontSize:typography.scale.base,fontWeight:typography.weight.bold,cursor:saving?'not-allowed':'pointer',opacity:saving?0.7:1,fontFamily:typography.fontFamily}}>
          {saving?'Salvando...':'Salvar alterações'}
        </button>
      </div>
      <button onClick={()=>setConfirmDel(true)} style={{width:'100%',padding:'11px',borderRadius:radius.sm,border:`1px solid rgba(220,38,38,0.2)`,background:'rgba(220,38,38,0.06)',color:colors.red.DEFAULT,fontSize:typography.scale.sm,fontWeight:typography.weight.bold,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',gap:6,fontFamily:typography.fontFamily,transition:transitions.fast}}>
        <Trash2 size={14} strokeWidth={2}/> Remover bloqueio
      </button>
    </div>
  )

  return (
    <>
      {confirmDel && <ConfirmDelete onConfirm={handleDelete} onCancel={()=>setConfirmDel(false)} deleting={deleting}/>}
      <MobileSheet open onClose={onClose} title="Editar bloqueio" subtitle={`${profName} · ${dateLabel}`} icon={<Ban size={18} color={colors.slate.DEFAULT} strokeWidth={2}/>} footer={footer} maxWidth={400}>
        <style>{`
          .bem-sel{width:100%;height:42px;padding:0 12px;border-radius:${radius.sm}px;border:1px solid ${colors.gray.borderMd};background:${colors.background.surface};color:${colors.gray[900]};font-size:${typography.scale.base}px;outline:none;appearance:none;font-family:${typography.fontFamily};cursor:pointer;transition:border-color ${transitions.fast}}
          .bem-sel:focus{border-color:${colors.red.borderHover};box-shadow:0 0 0 3px ${colors.red.focusRing}}
          .bem-lbl{display:block;font-size:${typography.scale.xs}px;font-weight:${typography.weight.bold};color:${colors.gray.dimText};letter-spacing:.08em;text-transform:uppercase;margin-bottom:6px}
        `}</style>

        {error && <div style={{marginBottom:14,padding:'9px 12px',borderRadius:radius.sm,background:'rgba(220,38,38,0.06)',border:`1px solid ${colors.red.border}`,color:colors.red.dark,fontSize:typography.scale.sm}}>{error}</div>}

        {professionals.length > 1 && (
          <div style={{marginBottom:14}}>
            <span className="bem-lbl">Profissional</span>
            <div style={{position:'relative'}}>
              <select className="bem-sel" value={profId} onChange={e=>setProfId(e.target.value)}>
                {professionals.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
              <div style={{position:'absolute',right:12,top:'50%',transform:'translateY(-50%)',pointerEvents:'none',fontSize:10,color:colors.gray.dimText}}>▾</div>
            </div>
          </div>
        )}

        <div style={{display:'flex',gap:12,marginBottom:14}}>
          <div style={{flex:1}}>
            <span className="bem-lbl">Início</span>
            <div style={{position:'relative'}}>
              <select className="bem-sel" value={startTime} onChange={e=>{setStartTime(e.target.value);if(e.target.value>=endTime)setEndTime(defaultEnd(e.target.value))}}>
                {TIME_OPTIONS.map(t=><option key={t} value={t}>{t}</option>)}
              </select>
              <div style={{position:'absolute',right:10,top:'50%',transform:'translateY(-50%)',pointerEvents:'none',fontSize:10,color:colors.gray.dimText}}>▾</div>
            </div>
          </div>
          <div style={{flex:1}}>
            <span className="bem-lbl">Fim</span>
            <div style={{position:'relative'}}>
              <select className="bem-sel" value={endTime} onChange={e=>setEndTime(e.target.value)}>
                {TIME_OPTIONS.filter(t=>t>startTime).map(t=><option key={t} value={t}>{t}</option>)}
              </select>
              <div style={{position:'absolute',right:10,top:'50%',transform:'translateY(-50%)',pointerEvents:'none',fontSize:10,color:colors.gray.dimText}}>▾</div>
            </div>
          </div>
        </div>

        <div>
          <span className="bem-lbl">Motivo (opcional)</span>
          <textarea value={reason} onChange={e=>setReason(e.target.value)} placeholder="Ex: Almoço, reunião, folga..." rows={3}
            style={{width:'100%',padding:'11px 12px',borderRadius:radius.sm,border:`1px solid ${colors.gray.borderMd}`,background:colors.background.surface,color:colors.gray[900],fontSize:typography.scale.base,outline:'none',resize:'none',boxSizing:'border-box',fontFamily:typography.fontFamily}}
            onFocus={e=>{e.target.style.borderColor=colors.red.borderHover;e.target.style.boxShadow=`0 0 0 3px ${colors.red.focusRing}`}}
            onBlur={e=>{e.target.style.borderColor=colors.gray.borderMd;e.target.style.boxShadow='none'}}
          />
        </div>
      </MobileSheet>
    </>
  )
}