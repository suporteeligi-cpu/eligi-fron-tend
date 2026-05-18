'use client'
// src/features/agenda/components/BlockModal.tsx

import { useState } from 'react'
import { Ban } from 'lucide-react'
import { AgendaProfessional } from '../types'
import { colors, typography, radius, shadows, transitions } from '@/shared/theme'
import MobileSheet from '@/app/components/ui/MobileSheet'
import api from '@/shared/lib/apiClient'
import dayjs from 'dayjs'

interface Props {
  professionals:  AgendaProfessional[]
  selectedDate:   Date
  initialTime?:   string
  initialProfId?: string
  onClose:        () => void
  onCreated:      (block: { id: string; professionalId: string; date: string; startTime: string; endTime: string; reason: string | null }) => void
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
  return `${String(Math.floor(total/60) % 24).padStart(2,'0')}:${String(total%60).padStart(2,'0')}`
}

export default function BlockModal({ professionals, selectedDate, initialTime, initialProfId, onClose, onCreated }: Props) {
  const [profId,    setProfId]    = useState(initialProfId ?? professionals[0]?.id ?? '')
  const [startTime, setStartTime] = useState(initialTime ?? '09:00')
  const [endTime,   setEndTime]   = useState(defaultEnd(initialTime ?? '09:00'))
  const [reason,    setReason]    = useState('')
  const [saving,    setSaving]    = useState(false)
  const [error,     setError]     = useState<string | null>(null)

  const dateStr  = dayjs(selectedDate).format('YYYY-MM-DD')
  const dateLabel = dayjs(selectedDate).format('ddd, DD [de] MMM').replace(/^\w/, c => c.toUpperCase())

  async function handleSave() {
    if (!profId) { setError('Selecione um profissional'); return }
    if (startTime >= endTime) { setError('Horário de início deve ser antes do fim'); return }
    try {
      setSaving(true); setError(null)
      const res   = await api.post('/blocks', { professionalId: profId, date: dateStr, startTime, endTime, reason: reason.trim() || null })
      const block = res.data?.data ?? res.data
      onCreated(block); onClose()
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { error?: string } } })?.response?.data?.error ?? 'Erro ao criar bloqueio'
      setError(msg)
    } finally { setSaving(false) }
  }

  const footer = (
    <div style={{ display:'flex', gap:8 }}>
      <button onClick={onClose} style={{ flex:1, padding:'12px', borderRadius:radius.sm, border:`1px solid ${colors.gray.borderMd}`, background:'transparent', fontSize:typography.scale.base, fontWeight:typography.weight.semibold, cursor:'pointer', color:typography.color.secondary, fontFamily:typography.fontFamily }}>
        Cancelar
      </button>
      <button onClick={handleSave} disabled={saving} style={{ flex:2, padding:'12px', borderRadius:radius.sm, border:'none', background:colors.slate.gradient, color:'#fff', fontSize:typography.scale.base, fontWeight:typography.weight.bold, cursor:saving?'not-allowed':'pointer', boxShadow:shadows.sm, opacity:saving?0.7:1, fontFamily:typography.fontFamily, transition:transitions.base }}>
        {saving ? 'Salvando...' : 'Criar bloqueio'}
      </button>
    </div>
  )

  return (
    <MobileSheet
      open
      onClose={onClose}
      title="Bloquear horário"
      subtitle={dateLabel}
      icon={<Ban size={18} color={colors.slate.DEFAULT} strokeWidth={2} />}
      footer={footer}
      maxWidth={400}
    >
      <style>{`
        .bm-sel{width:100%;height:42px;padding:0 12px;border-radius:${radius.sm}px;border:1px solid ${colors.gray.borderMd};background:${colors.background.surface};color:${colors.gray[900]};font-size:${typography.scale.base}px;outline:none;appearance:none;font-family:${typography.fontFamily};cursor:pointer;transition:border-color ${transitions.fast}}
        .bm-sel:focus{border-color:${colors.red.borderHover};box-shadow:0 0 0 3px ${colors.red.focusRing}}
        .bm-lbl{display:block;font-size:${typography.scale.xs}px;font-weight:${typography.weight.bold};color:${colors.gray.dimText};letter-spacing:.08em;text-transform:uppercase;margin-bottom:6px}
      `}</style>

      {error && (
        <div style={{ marginBottom:14, padding:'9px 12px', borderRadius:radius.sm, background:'rgba(220,38,38,0.06)', border:`1px solid ${colors.red.border}`, color:colors.red.dark, fontSize:typography.scale.sm }}>
          {error}
        </div>
      )}

      {/* Profissional */}
      {professionals.length > 1 && (
        <div style={{ marginBottom:14 }}>
          <span className="bm-lbl">Profissional</span>
          <div style={{ position:'relative' }}>
            <select className="bm-sel" value={profId} onChange={e => setProfId(e.target.value)}>
              {professionals.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
            <div style={{ position:'absolute', right:12, top:'50%', transform:'translateY(-50%)', pointerEvents:'none', fontSize:10, color:colors.gray.dimText }}>▾</div>
          </div>
        </div>
      )}

      {/* Horários */}
      <div style={{ display:'flex', gap:12, marginBottom:14 }}>
        <div style={{ flex:1 }}>
          <span className="bm-lbl">Início</span>
          <div style={{ position:'relative' }}>
            <select className="bm-sel" value={startTime} onChange={e => { setStartTime(e.target.value); if (e.target.value >= endTime) setEndTime(defaultEnd(e.target.value)) }}>
              {TIME_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
            <div style={{ position:'absolute', right:10, top:'50%', transform:'translateY(-50%)', pointerEvents:'none', fontSize:10, color:colors.gray.dimText }}>▾</div>
          </div>
        </div>
        <div style={{ flex:1 }}>
          <span className="bm-lbl">Fim</span>
          <div style={{ position:'relative' }}>
            <select className="bm-sel" value={endTime} onChange={e => setEndTime(e.target.value)}>
              {TIME_OPTIONS.filter(t => t > startTime).map(t => <option key={t} value={t}>{t}</option>)}
            </select>
            <div style={{ position:'absolute', right:10, top:'50%', transform:'translateY(-50%)', pointerEvents:'none', fontSize:10, color:colors.gray.dimText }}>▾</div>
          </div>
        </div>
      </div>

      {/* Motivo */}
      <div>
        <span className="bm-lbl">Motivo (opcional)</span>
        <textarea
          value={reason}
          onChange={e => setReason(e.target.value)}
          placeholder="Ex: Almoço, reunião, folga..."
          rows={3}
          style={{ width:'100%', padding:'11px 12px', borderRadius:radius.sm, border:`1px solid ${colors.gray.borderMd}`, background:colors.background.surface, color:colors.gray[900], fontSize:typography.scale.base, outline:'none', resize:'none', boxSizing:'border-box', fontFamily:typography.fontFamily, transition:`border-color ${transitions.fast}` }}
          onFocus={e => { e.target.style.borderColor = colors.red.borderHover; e.target.style.boxShadow = `0 0 0 3px ${colors.red.focusRing}` }}
          onBlur={e  => { e.target.style.borderColor = colors.gray.borderMd;   e.target.style.boxShadow = 'none' }}
        />
      </div>
    </MobileSheet>
  )
}