// src/features/anamnesis/components/ServicePicker.tsx
// @eligi:anamnese-front-servicos
// Escolha dos servicos que pedem a ficha. Usado no "Configure sua ficha" e no
// editor. Um servico pede UMA ficha so (o back move o vinculo); por isso o
// aviso "hoje na ficha X" antes de marcar e "sai da ficha X" depois.
'use client'

import { useEffect, useState } from 'react'
import { Check } from 'lucide-react'
import { apiMessage, fetchServices } from '../api'
import type { ServiceLite, Template } from '../types'

interface Props {
  selected: ReadonlySet<string>
  onToggle: (id: string) => void
  templates: Template[]
  /** ficha que esta sendo editada (o vinculo com ela mesma nao e "outra ficha") */
  currentTemplateId?: string
}

type State = { ok: true; list: ServiceLite[] } | { ok: false; message: string } | null

export default function ServicePicker({ selected, onToggle, templates, currentTemplateId }: Props) {
  const [state, setState] = useState<State>(null)

  useEffect(() => {
    let alive = true
    fetchServices().then(
      (list) => { if (alive) setState({ ok: true, list }) },
      (e) => { if (alive) setState({ ok: false, message: apiMessage(e, 'Não foi possível carregar os serviços.') }) },
    )
    return () => { alive = false }
  }, [])

  const nameOf = (id: string) => templates.find((t) => t.id === id)?.name ?? null

  return (
    <div className="sp">
      <style>{CSS}</style>
      {state === null && <div className="an-skel" style={{ height: 88 }} />}
      {state && !state.ok && <p className="sp-hint is-err" role="alert">{state.message}</p>}
      {state && state.ok && state.list.length === 0 && (
        <p className="sp-hint">Nenhum serviço cadastrado ainda. Cadastre em Serviços e ligue aqui depois.</p>
      )}
      {state && state.ok && state.list.length > 0 && (
        <div className="sp-grid">
          {state.list.map((s) => {
            const on = selected.has(s.id)
            const otherId = s.anamnesisTemplateId && s.anamnesisTemplateId !== currentTemplateId ? s.anamnesisTemplateId : null
            const other = otherId ? nameOf(otherId) : null
            return (
              <button key={s.id} type="button" className={`sp-svc${on ? ' is-on' : ''}`} aria-pressed={on} onClick={() => onToggle(s.id)}>
                <span className="sp-box" aria-hidden>{on ? <Check size={13} /> : null}</span>
                <span className="sp-body">
                  <span className="sp-name">{s.name}</span>
                  {other ? (
                    <span className={`sp-note${on ? ' is-warn' : ''}`}>
                      {on ? `Sai da ficha ${other} e passa para esta` : `Hoje na ficha ${other}`}
                    </span>
                  ) : null}
                </span>
              </button>
            )
          })}
        </div>
      )}
      <span className="sp-hint">Um serviço pede uma ficha só. Pode deixar sem nenhum e ligar depois.</span>
    </div>
  )
}

const CSS = `
.sp{display:flex;flex-direction:column;gap:8px}
.sp-grid{display:grid;grid-template-columns:minmax(0,1fr);gap:8px}
@media (min-width:640px){.sp-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}
.sp-svc{display:flex;gap:10px;align-items:flex-start;text-align:left;min-height:48px;padding:12px;border-radius:12px;border:1.5px solid rgba(17,17,20,.09);background:#fff;font-family:inherit;cursor:pointer}
.sp-svc.is-on{border-color:#111114}
.sp-box{width:22px;height:22px;flex-shrink:0;border-radius:6px;border:1.5px solid rgba(17,17,20,.22);display:grid;place-items:center;background:#fff;color:#fff}
.sp-svc.is-on .sp-box{background:#111114;border-color:#111114}
.sp-body{display:flex;flex-direction:column;gap:2px;min-width:0}
.sp-name{font-size:14.5px;font-weight:600;color:#111114;overflow-wrap:anywhere}
.sp-note{font-size:12px;color:#8a8a93}
.sp-note.is-warn{color:#b45309}
.sp-hint{font-size:12.5px;color:#8a8a93;line-height:1.4}
.sp-hint.is-err{color:#a32d2d;margin:0}
`
