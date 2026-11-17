'use client'
// src/features/booking/components/BookingNoteCard.tsx
// @eligi:booking-note-card — nota interna do atendimento no detalhe.
// Uma nota por atendimento (o back grava no grupo inteiro). Toda a equipe ve e
// edita; o cliente nunca ve (link, app e avisos nao recebem o campo).
// Visual da direcao C final: caixa tracejada "So a equipe ve".
import { useState } from 'react'
import { Lock, Loader2 } from 'lucide-react'
import api from '@/shared/lib/apiClient'
import { typography } from '@/shared/theme'

export const BOOKING_NOTE_MAX = 500

const INK   = '#111114'
const INK2  = '#4b4b52'
const INK3  = '#6b6b73'
const LINE  = 'rgba(17,17,20,.22)'
const MONO  = typography.fontFamilyMono

interface Props {
  bookingId: string
  note:      string | null
  /** Recebe a nota ja gravada (normalizada pelo back; null = sem nota). */
  onSaved:   (note: string | null) => void
}

function errorText(e: unknown): string {
  const r = (e as { response?: { status?: number; data?: { error?: string; message?: string } } }).response
  if (!r) return 'Sem conexão. Tente de novo.'
  if (r.status === 404) return 'Este agendamento não existe mais.'
  return r.data?.error ?? r.data?.message ?? 'Não foi possível salvar a nota.'
}

export default function BookingNoteCard({ bookingId, note, onSaved }: Props) {
  const [editing, setEditing] = useState(false)
  const [draft,   setDraft]   = useState('')
  const [saving,  setSaving]  = useState(false)
  const [error,   setError]   = useState<string | null>(null)

  function startEdit() {
    setDraft(note ?? '')
    setError(null)
    setEditing(true)
  }

  async function save() {
    if (saving) return
    setSaving(true)
    setError(null)
    try {
      const res = await api.patch(`/bookings/${bookingId}/note`, { note: draft.trim() ? draft : null })
      const saved = (res.data as { internalNote?: string | null }).internalNote ?? null
      onSaved(saved)
      setEditing(false)
    } catch (e) {
      setError(errorText(e))
    } finally {
      setSaving(false)
    }
  }

  const label = (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      fontFamily: MONO, fontSize: 11, letterSpacing: '.06em', textTransform: 'uppercase', color: INK3,
    }}>
      <Lock size={13} strokeWidth={2} aria-hidden/>
      Só a equipe vê
    </span>
  )

  if (editing) {
    const len = draft.trim().length
    return (
      <div style={{ border: `1px dashed ${LINE}`, borderRadius: 14, padding: '12px 14px', background: '#fafafb' }}>
        <label htmlFor={`bnote-${bookingId}`} style={{ display: 'block', marginBottom: 8 }}>{label}</label>
        <textarea
          id={`bnote-${bookingId}`}
          value={draft}
          autoFocus
          maxLength={BOOKING_NOTE_MAX}
          onChange={e => setDraft(e.target.value)}
          placeholder="Ex.: alergia, preferência, aviso para quem vai atender"
          rows={3}
          style={{
            width: '100%', boxSizing: 'border-box', resize: 'vertical', minHeight: 84,
            padding: '10px 12px', borderRadius: 12, border: '1px solid rgba(17,17,20,.14)',
            background: '#fff', fontSize: 16, lineHeight: 1.45, color: INK,
            fontFamily: typography.fontFamily,
          }}
        />
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 10 }}>
          <span style={{ flex: 1, fontFamily: MONO, fontSize: 12, color: INK3, fontVariantNumeric: 'tabular-nums' }}>
            {len}/{BOOKING_NOTE_MAX}
          </span>
          <button type="button" onClick={() => setEditing(false)} disabled={saving}
            style={{ height: 44, padding: '0 16px', borderRadius: 12, border: '1px solid rgba(17,17,20,.1)', background: '#fff', color: INK, fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: typography.fontFamily }}>
            Cancelar
          </button>
          <button type="button" onClick={save} disabled={saving}
            style={{ height: 44, padding: '0 18px', borderRadius: 12, border: 'none', background: INK, color: '#fff', fontSize: 14, fontWeight: 600, cursor: saving ? 'default' : 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6, fontFamily: typography.fontFamily }}>
            {saving && <Loader2 size={15} className="bvp-note-spin" aria-hidden/>}
            Salvar
          </button>
        </div>
        {error && <div role="alert" style={{ marginTop: 8, fontSize: 13, color: '#b91c1c' }}>{error}</div>}
        <style>{`@keyframes bvp-note-spin{to{transform:rotate(360deg)}}.bvp-note-spin{animation:bvp-note-spin .8s linear infinite}`}</style>
      </div>
    )
  }

  if (!note) {
    return (
      <button type="button" onClick={startEdit}
        style={{
          width: '100%', minHeight: 52, display: 'flex', alignItems: 'center', gap: 8,
          border: `1px dashed ${LINE}`, borderRadius: 14, background: 'transparent',
          padding: '0 14px', cursor: 'pointer', fontFamily: typography.fontFamily,
          fontSize: 14, color: INK2, textAlign: 'left',
        }}>
        <Lock size={15} color={INK3} aria-hidden/>
        <span style={{ flex: 1 }}>Nenhuma nota da equipe.</span>
        <span style={{ fontWeight: 600, color: INK }}>Adicionar</span>
      </button>
    )
  }

  return (
    <div style={{ border: `1px dashed ${LINE}`, borderRadius: 14, padding: '6px 6px 12px 14px', background: '#fafafb' }}>
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <span style={{ flex: 1 }}>{label}</span>
        <button type="button" onClick={startEdit}
          style={{ height: 40, minWidth: 44, padding: '0 10px', border: 'none', background: 'transparent', color: INK, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: typography.fontFamily }}>
          Editar
        </button>
      </div>
      <p style={{ margin: '2px 8px 0 0', fontSize: 15, lineHeight: 1.45, color: INK, whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>
        {note}
      </p>
    </div>
  )
}
