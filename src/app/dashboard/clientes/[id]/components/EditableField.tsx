'use client'
// src/app/dashboard/clientes/[id]/components/EditableField.tsx
// @eligi:clients-field-v2 — uma linha so, celular e computador (@media).
// `locked`: o cargo nao edita (o back recusa com 403 de qualquer jeito).

import { useState, useRef, useEffect } from 'react'
import { Pencil, Check, X, Lock } from 'lucide-react'

interface Props {
  label:      string
  value:      string
  onSave:     (v: string) => Promise<void>
  mask?:      (v: string) => string
  inputMode?: 'text' | 'tel' | 'email' | 'numeric'
  locked?:    boolean
  /** texto quando vazio (ex.: "Oculto para o seu cargo") */
  emptyText?: string
}

function messageOf(e: unknown): string {
  const data = (e as { response?: { data?: { message?: string; error?: string } } })?.response?.data
  return data?.message || data?.error || 'Não foi possível salvar.'
}

export default function EditableField({ label, value, onSave, mask, inputMode = 'text', locked = false, emptyText = 'Não informado' }: Props) {
  const [editing, setEditing] = useState(false)
  const [val,     setVal]     = useState(value)
  const [saving,  setSaving]  = useState(false)
  const [error,   setError]   = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Foco ao abrir a edicao: so DOM, sem setState no efeito.
  useEffect(() => {
    if (!editing) return
    const t = setTimeout(() => inputRef.current?.focus(), 30)
    return () => clearTimeout(t)
  }, [editing])

  function start() {
    if (locked) return
    setVal(value)
    setError(null)
    setEditing(true)
  }

  async function save() {
    if (val.trim() === value) { setEditing(false); return }
    try {
      setSaving(true)
      setError(null)
      await onSave(val.trim())
      setEditing(false)
    } catch (e) {
      setError(messageOf(e))
    } finally {
      setSaving(false)
    }
  }

  function cancel() {
    setVal(value)
    setError(null)
    setEditing(false)
  }

  if (editing) {
    return (
      <div className="cl-field">
        <div className="cl-field-main">
          <label className="cl-field-l" htmlFor={`f-${label}`}>{label}</label>
          <input
            id={`f-${label}`}
            ref={inputRef}
            value={val}
            inputMode={inputMode}
            onChange={e => setVal(mask ? mask(e.target.value) : e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter') void save()
              if (e.key === 'Escape') cancel()
            }}
            disabled={saving}
          />
          {error && <div className="cl-field-err" role="alert">{error}</div>}
        </div>
        <div className="cl-field-btns" style={{ alignSelf: 'flex-end' }}>
          <button type="button" className="cl-mini" onClick={cancel} aria-label="Cancelar" disabled={saving}>
            <X size={17} />
          </button>
          <button type="button" className="cl-mini is-dark" onClick={() => void save()} aria-label="Salvar" disabled={saving}>
            {saving ? <span className="cl-spinner" style={{ width: 16, height: 16, borderTopColor: '#fff', borderColor: 'rgba(255,255,255,.3)' }} /> : <Check size={17} strokeWidth={2.4} />}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="cl-field">
      <div className="cl-field-main">
        <span className="cl-field-l">{label}</span>
        <span className={`cl-field-v cl-n${value ? '' : ' is-empty'}`}>{value || emptyText}</span>
      </div>
      {locked ? (
        <span role="img" className="cl-mini" style={{ border: 'none', color: '#a1a1aa' }} aria-label="Sem permissão para editar" title="Sem permissão para editar">
          <Lock size={15} />
        </span>
      ) : (
        <button type="button" className="cl-mini" onClick={start} aria-label={`Editar ${label.toLowerCase()}`}>
          <Pencil size={15} />
        </button>
      )}
    </div>
  )
}
