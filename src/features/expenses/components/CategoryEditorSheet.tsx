// src/features/expenses/components/CategoryEditorSheet.tsx
// @eligi:expcat-editor — criar ou editar uma categoria propria.
'use client'

import { useState } from 'react'
import ExpenseSheet from './ExpenseSheet'
import {
  CATEGORY_ICON_NAMES, CATEGORY_NAME_MAX, CATEGORY_PALETTE, iconFor, nameProblem, tint,
} from '../categories'
import type { CustomCategory, CustomCategoryInput } from '../types'

interface Props {
  existing: CustomCategory[]
  editing?: CustomCategory | null
  level?:   1 | 2
  onSubmit: (input: CustomCategoryInput) => Promise<unknown>
  onClose:  () => void
}

const ICON_LABEL: Record<string, string> = {
  'home': 'Casa', 'zap': 'Energia', 'droplet': 'Água', 'wifi': 'Internet', 'file-text': 'Documento',
  'sparkles': 'Limpeza', 'car': 'Carro', 'coffee': 'Café', 'graduation-cap': 'Curso', 'landmark': 'Impostos',
  'shield': 'Seguro', 'pen-tool': 'Manutenção', 'megaphone': 'Divulgação', 'package': 'Produtos',
  'users': 'Equipe', 'credit-card': 'Cartão', 'tag': 'Etiqueta', 'more-horizontal': 'Outros',
}

export default function CategoryEditorSheet({ existing, editing, level = 1, onSubmit, onClose }: Props) {
  const [name, setName]   = useState(editing?.name ?? '')
  const [color, setColor] = useState<string>(editing?.color ?? CATEGORY_PALETTE[existing.length % CATEGORY_PALETTE.length])
  const [icon, setIcon]   = useState(editing?.icon ?? 'tag')
  const [touched, setTouched] = useState(false)
  const [saving, setSaving]   = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)

  const problem = nameProblem(name, existing, editing?.id)
  const Icon = iconFor(icon)
  const preview = name.replace(/\s+/g, ' ').trim() || 'Nome da categoria'

  async function save() {
    setTouched(true)
    if (problem || saving) return
    setSaving(true)
    setServerError(null)
    try {
      await onSubmit({ name: name.replace(/\s+/g, ' ').trim(), color, icon })
      onClose()
    } catch (err) {
      setServerError(err instanceof Error ? err.message : 'Não foi possível salvar.')
    } finally {
      setSaving(false)
    }
  }

  const shownError = serverError ?? (touched && problem ? problem : null)

  return (
    <ExpenseSheet
      title={editing ? 'Editar categoria' : 'Nova categoria'}
      subtitle="Aparece nos cartões, nos filtros e no fluxo de caixa."
      level={level}
      onClose={onClose}
      footer={
        <button type="button" className="ce-save" onClick={save} disabled={saving}>
          {saving ? 'Salvando…' : editing ? 'Salvar categoria' : 'Criar categoria'}
        </button>
      }
    >
      <style>{CSS}</style>

      <div className="ce-prev" aria-hidden>
        <span className="ce-tile" style={{ background: tint(color, 0.13), color }}><Icon size={20} /></span>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div className="ce-pname">{preview}</div>
          <div className="ce-pmeta">Assim ela aparece nos cartões e na lista</div>
        </div>
      </div>

      <label className="ce-lbl" htmlFor="ce-name">Nome</label>
      <input
        id="ce-name"
        className={`ce-in${shownError ? ' is-err' : ''}`}
        value={name}
        maxLength={CATEGORY_NAME_MAX}
        placeholder="Ex.: Aluguel, Contador, Limpeza"
        autoComplete="off"
        autoFocus={!editing}
        onChange={(e) => { setName(e.target.value); setServerError(null) }}
        onBlur={() => setTouched(true)}
        onKeyDown={(e) => { if (e.key === 'Enter') void save() }}
      />
      <div className={`ce-hint${shownError ? ' is-err' : ''}`}>
        <span>{shownError ?? 'Use um nome curto, que você reconheça de relance.'}</span>
        <span className="ce-count">{name.length}/{CATEGORY_NAME_MAX}</span>
      </div>

      <div className="ce-lbl">Cor</div>
      <div className="ce-sw" role="radiogroup" aria-label="Cor da categoria">
        {CATEGORY_PALETTE.map((c) => (
          <button
            key={c}
            type="button"
            role="radio"
            aria-checked={color === c}
            aria-label={`Cor ${c}`}
            className={`ce-dot${color === c ? ' is-on' : ''}`}
            style={{ background: c }}
            onClick={() => setColor(c)}
          />
        ))}
      </div>

      <div className="ce-lbl">Ícone</div>
      <div className="ce-ig" role="radiogroup" aria-label="Ícone da categoria">
        {CATEGORY_ICON_NAMES.map((n) => {
          const I = iconFor(n)
          return (
            <button
              key={n}
              type="button"
              role="radio"
              aria-checked={icon === n}
              aria-label={ICON_LABEL[n] ?? n}
              title={ICON_LABEL[n] ?? n}
              className={`ce-ic${icon === n ? ' is-on' : ''}`}
              onClick={() => setIcon(n)}
            >
              <I size={19} />
            </button>
          )
        })}
      </div>
    </ExpenseSheet>
  )
}

const CSS = `
.ce-prev{display:flex;align-items:center;gap:12px;padding:12px;border-radius:14px;background:#f5f5f7;margin-bottom:16px}
.ce-tile{width:40px;height:40px;border-radius:12px;display:grid;place-items:center;flex-shrink:0}
.ce-pname{font-size:15px;font-weight:600;color:#111114;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.ce-pmeta{font-size:12.5px;color:#8a8a93;margin-top:2px}
.ce-lbl{display:block;font-family:var(--font-mono);font-size:10.5px;font-weight:600;letter-spacing:.09em;text-transform:uppercase;color:#8a8a93;margin:0 0 8px}
.ce-in{width:100%;height:48px;border-radius:12px;border:1.5px solid rgba(17,17,20,.14);padding:0 14px;font-size:16px;font-family:inherit;color:#111114;background:#fff;box-sizing:border-box}
.ce-in.is-err{border-color:#dc2626}
.ce-hint{display:flex;justify-content:space-between;gap:12px;font-size:12px;color:#8a8a93;margin:6px 0 18px}
.ce-hint.is-err{color:#b91c1c}
.ce-count{font-variant-numeric:tabular-nums;flex-shrink:0}
.ce-sw{display:grid;grid-template-columns:repeat(10,minmax(0,1fr));gap:8px;margin-bottom:20px}
.ce-dot{aspect-ratio:1;min-width:0;border-radius:50%;border:0;cursor:pointer;position:relative}
.ce-dot.is-on::after{content:"";position:absolute;inset:-4px;border-radius:50%;border:2px solid #111114}
.ce-ig{display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:6px}
.ce-ic{height:46px;border-radius:12px;border:1px solid rgba(17,17,20,.08);background:#fff;color:#4b4b52;display:grid;place-items:center;cursor:pointer}
.ce-ic:hover{background:#f5f5f7}
.ce-ic.is-on{background:#111114;border-color:#111114;color:#fff}
.ce-save{width:100%;height:50px;border-radius:14px;border:0;background:#111114;color:#fff;font-size:15px;font-weight:700;font-family:inherit;cursor:pointer}
.ce-save:hover{background:#26262c}
.ce-save:disabled{background:#a1a1aa;cursor:not-allowed}
@media (max-width:380px){.ce-sw{gap:6px}}
`
