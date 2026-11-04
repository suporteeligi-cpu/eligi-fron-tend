// src/features/anamnesis/components/QuestionSheet.tsx
// @eligi:anamnese-front-pergunta-folha
// Folha de criar ou editar UMA pergunta da ficha. Pergunta do banco tambem se
// edita (o id continua o mesmo); pergunta propria ganha id "p_" ao salvar.
// So Sim/Nao pode gerar alerta e pedir detalhe, igual a regra do back.
'use client'

import { useCallback, useState } from 'react'
import { AlertTriangle, Plus, X } from 'lucide-react'
import Sheet from '@/shared/components/Sheet'
import {
  ALERT_MAX, DETAIL_MAX, HELP_MAX, LABEL_MAX, OPTION_MAX, OPTIONS_MAX,
  TYPE_LABEL, TYPE_ORDER, cleanQuestion, isChoice, newQuestionId, questionProblem,
} from '../questions'
import type { AnamnesisQuestion, AnamnesisQuestionType } from '../types'

interface Props {
  /** null = pergunta nova */
  initial: AnamnesisQuestion | null
  /** ids ja usados na ficha (para a pergunta nova nao repetir) */
  taken: ReadonlySet<string>
  onSave: (q: AnamnesisQuestion) => void
  onClose: () => void
}

const EMPTY: AnamnesisQuestion = { id: '', type: 'yes_no', label: '', required: true }

export default function QuestionSheet({ initial, taken, onSave, onClose }: Props) {
  const [q, setQ] = useState<AnamnesisQuestion>(() => {
    const base = initial ?? EMPTY
    return { ...base, options: isChoice(base.type) ? [...(base.options ?? [])] : ['', ''] }
  })
  const [askDetail, setAskDetail] = useState(() => Boolean(initial?.detailLabel))
  const [tried, setTried] = useState(false)

  const close = useCallback(() => onClose(), [onClose])
  const set = (patch: Partial<AnamnesisQuestion>) => setQ((cur) => ({ ...cur, ...patch }))

  function setType(type: AnamnesisQuestionType) {
    setQ((cur) => {
      const opts = cur.options && cur.options.length >= 2 ? cur.options : ['', '']
      return { ...cur, type, options: opts }
    })
  }

  function setOption(i: number, v: string) {
    setQ((cur) => ({ ...cur, options: (cur.options ?? []).map((o, j) => (j === i ? v : o)) }))
  }

  const draft: AnamnesisQuestion = {
    ...q,
    detailLabel: q.type === 'yes_no' && askDetail ? (q.detailLabel ?? '') || 'Qual?' : undefined,
  }
  const problem = questionProblem(draft)

  function save() {
    setTried(true)
    if (problem) return
    const id = initial?.id ?? newQuestionId(draft.label, taken)
    onSave(cleanQuestion({ ...draft, id }))
  }

  const yesNo = q.type === 'yes_no'
  const choice = isChoice(q.type)
  const opts = q.options ?? []

  return (
    <Sheet
      title={initial ? 'Editar pergunta' : 'Nova pergunta'}
      subtitle={initial ? undefined : 'Pergunta só desta ficha'}
      onClose={close}
      level={1}
      footer={
        <div className="qs-foot">
          {tried && problem ? <p className="qs-err" role="alert">{problem}</p> : null}
          <div className="qs-acts">
            <button type="button" className="qs-ghost" onClick={close}>Cancelar</button>
            <button type="button" className="qs-primary" onClick={save}>{initial ? 'Salvar pergunta' : 'Adicionar à ficha'}</button>
          </div>
        </div>
      }
    >
      <style>{CSS}</style>

      <label className="qs-field">
        <span className="qs-label">PERGUNTA</span>
        <textarea
          className="qs-input qs-ta"
          value={q.label}
          onChange={(e) => set({ label: e.target.value })}
          maxLength={LABEL_MAX}
          rows={2}
          placeholder="Ex.: Você usa lente de contato?"
        />
      </label>

      <div className="qs-field">
        <span className="qs-label">TIPO DE RESPOSTA</span>
        <div className="qs-types" role="radiogroup" aria-label="Tipo de resposta">
          {TYPE_ORDER.map((t) => (
            <button key={t} type="button" role="radio" aria-checked={q.type === t} className={`qs-type${q.type === t ? ' is-on' : ''}`} onClick={() => setType(t)}>
              {TYPE_LABEL[t]}
            </button>
          ))}
        </div>
      </div>

      {choice && (
        <div className="qs-field">
          <span className="qs-label">OPÇÕES</span>
          <div className="qs-opts">
            {opts.map((o, i) => (
              <div key={i} className="qs-opt">
                <input
                  className="qs-input"
                  value={o}
                  onChange={(e) => setOption(i, e.target.value)}
                  maxLength={OPTION_MAX}
                  placeholder={`Opção ${i + 1}`}
                  aria-label={`Opção ${i + 1}`}
                />
                <button
                  type="button"
                  className="qs-icon"
                  aria-label={`Remover opção ${i + 1}`}
                  disabled={opts.length <= 2}
                  onClick={() => set({ options: opts.filter((_, j) => j !== i) })}
                >
                  <X size={16} aria-hidden />
                </button>
              </div>
            ))}
          </div>
          {opts.length < OPTIONS_MAX && (
            <button type="button" className="qs-add" onClick={() => set({ options: [...opts, ''] })}>
              <Plus size={16} aria-hidden /> Adicionar opção
            </button>
          )}
        </div>
      )}

      <Toggle
        label="Resposta obrigatória"
        hint="O cliente não consegue enviar a ficha sem responder."
        on={q.required}
        onChange={(v) => set({ required: v })}
      />

      {yesNo && (
        <>
          <Toggle
            label="Pedir detalhe quando responder Sim"
            hint="Abre um campo para o cliente explicar."
            on={askDetail}
            onChange={setAskDetail}
          />
          {askDetail && (
            <label className="qs-field qs-sub">
              <span className="qs-label">TEXTO DO CAMPO DE DETALHE</span>
              <input
                className="qs-input"
                value={q.detailLabel ?? ''}
                onChange={(e) => set({ detailLabel: e.target.value })}
                maxLength={DETAIL_MAX}
                placeholder="Qual?"
              />
            </label>
          )}

          <Toggle
            label="Gera alerta quando a resposta for Sim"
            hint="Quem atende vê o aviso em vermelho antes do atendimento."
            on={Boolean(q.isAlert)}
            onChange={(v) => set({ isAlert: v })}
            alert
          />
          {q.isAlert && (
            <label className="qs-field qs-sub">
              <span className="qs-label">TEXTO DO ALERTA</span>
              <input
                className="qs-input"
                value={q.alertLabel ?? ''}
                onChange={(e) => set({ alertLabel: e.target.value })}
                maxLength={ALERT_MAX}
                placeholder="Ex.: Usa lente de contato"
              />
              <span className="qs-hint">Curto: é o que aparece no aviso.</span>
            </label>
          )}
        </>
      )}

      <label className="qs-field">
        <span className="qs-label">EXPLICAÇÃO PARA O CLIENTE (OPCIONAL)</span>
        <input
          className="qs-input"
          value={q.helpText ?? ''}
          onChange={(e) => set({ helpText: e.target.value })}
          maxLength={HELP_MAX}
          placeholder="Aparece embaixo da pergunta"
        />
      </label>
    </Sheet>
  )
}

function Toggle({ label, hint, on, onChange, alert = false }: {
  label: string
  hint: string
  on: boolean
  onChange: (v: boolean) => void
  alert?: boolean
}) {
  return (
    <button type="button" role="switch" aria-checked={on} className="qs-tg" onClick={() => onChange(!on)}>
      <span className="qs-tg-body">
        <span className="qs-tg-l">
          {alert ? <AlertTriangle size={14} aria-hidden className="qs-tg-ic" /> : null}
          {label}
        </span>
        <span className="qs-tg-h">{hint}</span>
      </span>
      <span className={`qs-sw${on ? ' is-on' : ''}${on && alert ? ' is-alert' : ''}`} aria-hidden><span /></span>
    </button>
  )
}

const CSS = `
.qs-field{display:flex;flex-direction:column;gap:6px;margin-bottom:16px}
.qs-sub{margin-top:-6px;padding-left:12px;border-left:2px solid #ececf0}
.qs-label{font-family:var(--font-mono);font-size:11px;font-weight:600;letter-spacing:.1em;color:#8a8a93}
.qs-input{min-height:46px;padding:10px 12px;border-radius:12px;border:1px solid rgba(17,17,20,.14);background:#fff;font-family:inherit;font-size:16px;color:#111114;width:100%;box-sizing:border-box}
.qs-input:focus{border-color:#111114}
.qs-ta{resize:vertical;line-height:1.45}
.qs-hint{font-size:12px;color:#8a8a93}
.qs-types{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:6px}
@media (min-width:640px){.qs-types{grid-template-columns:repeat(3,minmax(0,1fr))}}
.qs-type{min-height:44px;padding:0 10px;border-radius:12px;border:1.5px solid rgba(17,17,20,.10);background:#fff;font-family:inherit;font-size:14px;font-weight:600;color:#4b4b52;cursor:pointer}
.qs-type.is-on{border-color:#111114;color:#111114;background:#f5f5f7}
.qs-opts{display:flex;flex-direction:column;gap:6px}
.qs-opt{display:flex;gap:6px;align-items:center}
.qs-icon{width:44px;height:44px;flex-shrink:0;border-radius:12px;border:1px solid rgba(17,17,20,.10);background:#fff;color:#4b4b52;display:grid;place-items:center;cursor:pointer}
.qs-icon:disabled{opacity:.35;cursor:not-allowed}
.qs-add{align-self:flex-start;min-height:44px;padding:0 12px;border:0;background:none;font-family:inherit;font-size:14px;font-weight:600;color:#111114;display:inline-flex;align-items:center;gap:6px;cursor:pointer;border-radius:10px}
.qs-add:hover{background:#f5f5f7}
.qs-tg{width:100%;display:flex;align-items:center;justify-content:space-between;gap:12px;min-height:56px;padding:10px 0;border:0;border-top:1px solid rgba(17,17,20,.07);background:none;font-family:inherit;text-align:left;cursor:pointer;margin-bottom:10px}
.qs-tg-body{display:flex;flex-direction:column;gap:2px;min-width:0}
.qs-tg-l{display:inline-flex;align-items:center;gap:6px;font-size:15px;font-weight:600;color:#111114}
.qs-tg-ic{color:#a32d2d}
.qs-tg-h{font-size:12.5px;color:#8a8a93;line-height:1.4}
.qs-sw{width:46px;height:28px;flex-shrink:0;border-radius:999px;background:#d4d4da;position:relative}
.qs-sw span{position:absolute;top:3px;left:3px;width:22px;height:22px;border-radius:50%;background:#fff;box-shadow:0 1px 3px rgba(17,17,20,.25);transition:transform .18s}
.qs-sw.is-on{background:#111114}
.qs-sw.is-alert{background:#dc2626}
.qs-sw.is-on span{transform:translateX(18px)}
.qs-foot{display:flex;flex-direction:column;gap:8px}
.qs-err{margin:0;font-size:13px;color:#a32d2d}
.qs-acts{display:flex;gap:8px;justify-content:flex-end}
.qs-ghost{min-height:46px;padding:0 16px;border-radius:12px;border:1px solid rgba(17,17,20,.12);background:#fff;color:#111114;font-family:inherit;font-size:14.5px;font-weight:600;cursor:pointer}
.qs-primary{min-height:46px;padding:0 18px;border-radius:12px;border:0;background:#111114;color:#fff;font-family:inherit;font-size:14.5px;font-weight:700;cursor:pointer}
@media (max-width:639px){.qs-acts>button{flex:1}}
`
