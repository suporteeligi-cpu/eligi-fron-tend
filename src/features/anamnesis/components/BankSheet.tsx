// src/features/anamnesis/components/BankSheet.tsx
// @eligi:anamnese-front-banco-folha
// Folha "Adicionar do banco": perguntas prontas que ainda nao estao na ficha,
// por secao. Marca varias e adiciona de uma vez, no fim da lista.
'use client'

import { useCallback, useMemo, useState } from 'react'
import { AlertTriangle, Check } from 'lucide-react'
import Sheet from '@/shared/components/Sheet'
import { buildQuestions } from '../catalog'
import { TYPE_LABEL } from '../questions'
import type { AnamnesisQuestion, Catalog } from '../types'

interface Props {
  catalog: Catalog
  /** ids que ja estao na ficha */
  present: ReadonlySet<string>
  /** quantas ainda cabem (teto de 60) */
  room: number
  onAdd: (qs: AnamnesisQuestion[]) => void
  onClose: () => void
}

export default function BankSheet({ catalog, present, room, onAdd, onClose }: Props) {
  const [picked, setPicked] = useState<Set<string>>(() => new Set())
  const close = useCallback(() => onClose(), [onClose])

  const sections = useMemo(
    () => catalog.sections
      .map((s) => ({ ...s, list: catalog.questions.filter((q) => q.section === s.key && !present.has(q.id)) }))
      .filter((s) => s.list.length > 0),
    [catalog, present],
  )

  function toggle(id: string) {
    setPicked((cur) => {
      const next = new Set(cur)
      if (next.has(id)) next.delete(id)
      else if (next.size < room) next.add(id)
      return next
    })
  }

  return (
    <Sheet
      title="Adicionar do banco"
      subtitle={room > 0 ? 'Perguntas prontas que ainda não estão na ficha' : 'A ficha já tem o máximo de 60 perguntas'}
      onClose={close}
      footer={
        <div className="bs-acts">
          <button type="button" className="bs-ghost" onClick={close}>Cancelar</button>
          <button
            type="button"
            className="bs-primary"
            disabled={picked.size === 0}
            onClick={() => onAdd(buildQuestions(catalog, picked))}
          >
            {picked.size === 0 ? 'Adicionar' : `Adicionar ${picked.size}`}
          </button>
        </div>
      }
    >
      <style>{CSS}</style>
      {sections.length === 0 && <p className="bs-empty">Todas as perguntas do banco já estão na ficha.</p>}
      {sections.map((s) => (
        <div key={s.key} className="bs-sec">
          <p className="bs-sec-n">{s.name}</p>
          {s.list.map((q) => {
            const on = picked.has(q.id)
            const full = !on && picked.size >= room
            return (
              <button key={q.id} type="button" className={`bs-q${on ? ' is-on' : ''}`} aria-pressed={on} disabled={full} onClick={() => toggle(q.id)}>
                <span className="bs-box" aria-hidden>{on ? <Check size={13} /> : null}</span>
                <span className="bs-body">
                  <span className="bs-label">{q.label}</span>
                  <span className="bs-meta">
                    <span>{TYPE_LABEL[q.type]}</span>
                    {q.isAlert ? <span className="bs-alert"><AlertTriangle size={11} aria-hidden />gera alerta</span> : null}
                  </span>
                </span>
              </button>
            )
          })}
        </div>
      ))}
    </Sheet>
  )
}

const CSS = `
.bs-empty{margin:8px 0;font-size:14px;color:#4b4b52}
.bs-sec{margin-bottom:14px}
.bs-sec-n{margin:0 0 4px;font-family:var(--font-mono);font-size:11px;font-weight:600;letter-spacing:.1em;text-transform:uppercase;color:#8a8a93}
.bs-q{width:100%;display:flex;gap:12px;align-items:flex-start;text-align:left;padding:10px 6px;border:0;border-top:1px solid rgba(17,17,20,.06);background:none;font-family:inherit;cursor:pointer;border-radius:10px}
.bs-q:hover{background:#fafafb}
.bs-q:disabled{opacity:.45;cursor:not-allowed}
.bs-box{width:22px;height:22px;flex-shrink:0;border-radius:6px;border:1.5px solid rgba(17,17,20,.22);display:grid;place-items:center;background:#fff;color:#fff}
.bs-q.is-on .bs-box{background:#111114;border-color:#111114}
.bs-body{display:flex;flex-direction:column;gap:3px;min-width:0}
.bs-label{font-size:14.5px;line-height:1.4;color:#111114}
.bs-meta{display:flex;flex-wrap:wrap;gap:8px;font-size:12px;color:#8a8a93}
.bs-meta span{color:#8a8a93}
.bs-meta .bs-alert{display:inline-flex;align-items:center;gap:3px;color:#a32d2d;font-weight:600}
.bs-acts{display:flex;gap:8px;justify-content:flex-end}
.bs-ghost{min-height:46px;padding:0 16px;border-radius:12px;border:1px solid rgba(17,17,20,.12);background:#fff;color:#111114;font-family:inherit;font-size:14.5px;font-weight:600;cursor:pointer}
.bs-primary{min-height:46px;padding:0 18px;border-radius:12px;border:0;background:#111114;color:#fff;font-family:inherit;font-size:14.5px;font-weight:700;cursor:pointer}
.bs-primary:disabled{opacity:.5;cursor:not-allowed}
@media (max-width:639px){.bs-acts>button{flex:1}}
`
