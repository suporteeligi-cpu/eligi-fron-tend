// src/features/anamnesis/components/TemplateEditor.tsx
// @eligi:anamnese-front-editor
// Editor de uma ficha ja criada (dono e gerente): nome, perguntas (ordem,
// editar, remover, adicionar do banco ou propria), termo e servicos.
// Mudar perguntas ou termo cria a versao seguinte no back; ficha ja preenchida
// guarda a copia da epoca e nao muda. Nome e servicos nao mudam a versao.
'use client'

import { useMemo, useState } from 'react'
import { AlertTriangle, ArrowDown, ArrowLeft, ArrowUp, Info, Library, Plus, X } from 'lucide-react'
import { apiMessage, apiStatus, setTemplateServices, updateTemplate, type TemplateUpdatePayload } from '../api'
import { MAX_QUESTIONS, TYPE_LABEL, sameQuestions } from '../questions'
import type { AnamnesisQuestion, Catalog, Template } from '../types'
import BankSheet from './BankSheet'
import QuestionSheet from './QuestionSheet'
import ServicePicker from './ServicePicker'

const CONSENT_MIN = 20

interface Props {
  template: Template
  catalog: Catalog
  templates: Template[]
  onClose: () => void
  /** salvou: a lista recarrega (servicos podem ter saido de outra ficha) */
  onSaved: (name: string) => void
}

type SheetState = { kind: 'edit'; index: number } | { kind: 'new' } | { kind: 'bank' } | null

function sameSet(a: ReadonlySet<string>, b: ReadonlySet<string>) {
  if (a.size !== b.size) return false
  for (const x of a) if (!b.has(x)) return false
  return true
}

export default function TemplateEditor({ template, catalog, templates, onClose, onSaved }: Props) {
  const initialServices = useMemo(() => new Set(template.services.map((s) => s.id)), [template])
  const [name, setName] = useState(template.name)
  const [consent, setConsent] = useState(template.consentText)
  const [questions, setQuestions] = useState<AnamnesisQuestion[]>(() => template.questions.map((q) => ({ ...q })))
  const [serviceIds, setServiceIds] = useState<Set<string>>(() => new Set(initialServices))
  const [sheet, setSheet] = useState<SheetState>(null)
  const [confirmLeave, setConfirmLeave] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const nameChanged = name.trim() !== template.name
  const consentChanged = consent.trim() !== template.consentText
  const questionsChanged = !sameQuestions(questions, template.questions)
  const servicesChanged = !sameSet(serviceIds, initialServices)
  const dirty = nameChanged || consentChanged || questionsChanged || servicesChanged
  const newVersion = consentChanged || questionsChanged

  const nameOk = name.trim().length >= 2
  const consentOk = consent.trim().length >= CONSENT_MIN
  const questionsOk = questions.length > 0
  const canSave = dirty && nameOk && consentOk && questionsOk && !saving

  const present = useMemo(() => new Set(questions.map((q) => q.id)), [questions])
  const taken = useMemo(() => new Set([...catalog.questions.map((q) => q.id), ...present]), [catalog, present])
  const alertCount = questions.filter((q) => q.isAlert).length
  const full = questions.length >= MAX_QUESTIONS

  function move(i: number, d: -1 | 1) {
    setQuestions((cur) => {
      const j = i + d
      if (j < 0 || j >= cur.length) return cur
      const next = [...cur]
      ;[next[i], next[j]] = [next[j], next[i]]
      return next
    })
  }

  function remove(i: number) {
    setQuestions((cur) => cur.filter((_, j) => j !== i))
  }

  function saveQuestion(q: AnamnesisQuestion) {
    setQuestions((cur) => (sheet?.kind === 'edit' ? cur.map((x, i) => (i === sheet.index ? q : x)) : [...cur, q]))
    setSheet(null)
  }

  function addFromBank(qs: AnamnesisQuestion[]) {
    setQuestions((cur) => [...cur, ...qs].slice(0, MAX_QUESTIONS))
    setSheet(null)
  }

  function toggleService(id: string) {
    setServiceIds((cur) => {
      const next = new Set(cur)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function leave() {
    if (dirty && !confirmLeave) {
      setConfirmLeave(true)
      return
    }
    onClose()
  }

  async function save() {
    if (!canSave) return
    setSaving(true)
    setError(null)
    try {
      const patch: TemplateUpdatePayload = {}
      if (nameChanged) patch.name = name.trim()
      if (consentChanged) patch.consentText = consent.trim()
      if (questionsChanged) patch.questions = questions
      if (Object.keys(patch).length > 0) await updateTemplate(template.id, patch)
      if (servicesChanged) await setTemplateServices(template.id, [...serviceIds])
      onSaved(name.trim())
    } catch (e) {
      setError(
        apiStatus(e) === 409
          ? 'Esta ficha foi alterada por outra pessoa. Volte para a lista e abra de novo.'
          : apiMessage(e, 'Não foi possível salvar. Tente de novo.'),
      )
      setSaving(false)
    }
  }

  return (
    <section className="te" aria-label={`Editar ficha ${template.name}`}>
      <style>{CSS}</style>

      <button type="button" className="te-back" onClick={leave}>
        <ArrowLeft size={16} aria-hidden /> Modelos
      </button>
      <h2 className="te-h2">Editar ficha</h2>
      <p className="te-meta">
        Versão {template.version} · {template.stats.records} {template.stats.records === 1 ? 'ficha preenchida' : 'fichas preenchidas'}
      </p>

      <div className="te-card">
        <label className="te-field">
          <span className="te-label">NOME DA FICHA</span>
          <input className="te-input" value={name} onChange={(e) => setName(e.target.value)} maxLength={80} />
          {!nameOk && <span className="te-hint is-err">Dê um nome à ficha.</span>}
        </label>
      </div>

      <div className="te-card">
        <div className="te-card-h">
          <span className="te-label">PERGUNTAS</span>
          <span className="te-count">
            {questions.length} · {alertCount} {alertCount === 1 ? 'gera' : 'geram'} alerta
          </span>
        </div>
        {questions.length === 0 && <p className="te-hint is-err">A ficha precisa de pelo menos uma pergunta.</p>}
        <ol className="te-qs">
          {questions.map((q, i) => (
            <li key={q.id} className="te-q">
              <span className="te-q-n">{i + 1}</span>
              <button type="button" className="te-q-main" onClick={() => setSheet({ kind: 'edit', index: i })} aria-label={`Editar: ${q.label}`}>
                <span className="te-q-label">{q.label}</span>
                <span className="te-q-meta">
                  <span>{TYPE_LABEL[q.type]}</span>
                  {q.required ? <span>· obrigatória</span> : null}
                  {q.isAlert ? <span className="te-q-alert"><AlertTriangle size={11} aria-hidden />{q.alertLabel}</span> : null}
                </span>
              </button>
              <span className="te-q-acts">
                <button type="button" className="te-ic" aria-label="Subir" disabled={i === 0} onClick={() => move(i, -1)}><ArrowUp size={16} aria-hidden /></button>
                <button type="button" className="te-ic" aria-label="Descer" disabled={i === questions.length - 1} onClick={() => move(i, 1)}><ArrowDown size={16} aria-hidden /></button>
                <button type="button" className="te-ic" aria-label={`Remover: ${q.label}`} onClick={() => remove(i)}><X size={16} aria-hidden /></button>
              </span>
            </li>
          ))}
        </ol>
        <div className="te-adds">
          <button type="button" className="te-add" disabled={full} onClick={() => setSheet({ kind: 'bank' })}>
            <Library size={16} aria-hidden /> Adicionar do banco
          </button>
          <button type="button" className="te-add" disabled={full} onClick={() => setSheet({ kind: 'new' })}>
            <Plus size={16} aria-hidden /> Criar pergunta própria
          </button>
        </div>
        {full && <p className="te-hint">A ficha chegou ao máximo de {MAX_QUESTIONS} perguntas.</p>}
      </div>

      <div className="te-card">
        <label className="te-field">
          <span className="te-label">TERMO DE CONSENTIMENTO</span>
          <textarea className="te-input te-ta" value={consent} onChange={(e) => setConsent(e.target.value)} maxLength={5000} rows={7} />
          {!consentOk && <span className="te-hint is-err">Escreva o termo que o cliente vai aceitar.</span>}
        </label>
      </div>

      <div className="te-card">
        <span className="te-label te-label-block">SERVIÇOS QUE PEDEM ESTA FICHA</span>
        <ServicePicker selected={serviceIds} onToggle={toggleService} templates={templates} currentTemplateId={template.id} />
      </div>

      {newVersion && template.stats.records > 0 && (
        <p className="te-version">
          <Info size={15} aria-hidden />
          <span>Salvar cria a versão {template.version + 1}. As fichas já preenchidas continuam com as perguntas e o termo da época.</span>
        </p>
      )}
      {error && <p className="te-err" role="alert">{error}</p>}

      <div className="te-bar">
        {confirmLeave ? (
          <>
            <span className="te-bar-info">Sair sem salvar as alterações?</span>
            <div className="te-bar-acts">
              <button type="button" className="an-btn-ghost" onClick={() => setConfirmLeave(false)}>Continuar editando</button>
              <button type="button" className="te-discard" onClick={onClose}>Sair sem salvar</button>
            </div>
          </>
        ) : (
          <>
            <span className="te-bar-info">{dirty ? 'Alterações não salvas' : 'Nada alterado'}</span>
            <div className="te-bar-acts">
              <button type="button" className="an-btn-ghost" onClick={leave} disabled={saving}>{dirty ? 'Descartar' : 'Voltar'}</button>
              <button type="button" className="an-btn-primary" onClick={save} disabled={!canSave}>
                {saving ? 'Salvando…' : 'Salvar'}
              </button>
            </div>
          </>
        )}
      </div>

      {sheet?.kind === 'bank' && (
        <BankSheet
          catalog={catalog}
          present={present}
          room={MAX_QUESTIONS - questions.length}
          onAdd={addFromBank}
          onClose={() => setSheet(null)}
        />
      )}
      {(sheet?.kind === 'edit' || sheet?.kind === 'new') && (
        <QuestionSheet
          initial={sheet.kind === 'edit' ? questions[sheet.index] ?? null : null}
          taken={taken}
          onSave={saveQuestion}
          onClose={() => setSheet(null)}
        />
      )}
    </section>
  )
}

const CSS = `
.te-back{min-height:44px;padding:0 10px 0 4px;margin-left:-4px;border:0;background:none;font-family:inherit;font-size:14px;font-weight:600;color:#4b4b52;display:inline-flex;align-items:center;gap:6px;cursor:pointer;border-radius:10px}
.te-back:hover{background:#ececf0}
.te-h2{font-family:var(--font-display);font-size:26px;font-weight:700;letter-spacing:-.035em;margin:4px 0 0;color:#111114}
@media (min-width:720px){.te-h2{font-size:30px}}
.te-meta{margin:4px 0 16px;font-size:13.5px;color:#8a8a93;font-variant-numeric:tabular-nums}
.te-card{background:#fff;border:1px solid rgba(17,17,20,.07);border-radius:16px;padding:16px;margin-bottom:12px}
.te-card-h{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:6px}
.te-count{font-size:12.5px;color:#8a8a93;font-variant-numeric:tabular-nums}
.te-field{display:flex;flex-direction:column;gap:6px}
.te-label{font-family:var(--font-mono);font-size:11px;font-weight:600;letter-spacing:.1em;color:#8a8a93}
.te-label-block{display:block;margin-bottom:10px}
.te-input{min-height:48px;padding:12px 14px;border-radius:12px;border:1px solid rgba(17,17,20,.14);background:#fff;font-family:inherit;font-size:16px;color:#111114;width:100%;box-sizing:border-box}
.te-input:focus{border-color:#111114}
.te-ta{line-height:1.5;resize:vertical;min-height:150px}
.te-hint{font-size:12.5px;color:#8a8a93;margin:6px 0 0}
.te-hint.is-err{color:#a32d2d}
.te-qs{list-style:none;margin:0;padding:0}
.te-q{display:flex;align-items:center;gap:6px;padding:6px 0;border-top:1px solid rgba(17,17,20,.06)}
.te-q:first-child{border-top:0}
.te-q-n{width:24px;flex-shrink:0;text-align:right;font-family:var(--font-mono);font-size:12px;color:#8a8a93;font-variant-numeric:tabular-nums}
.te-q-main{flex:1;min-width:0;min-height:44px;display:flex;flex-direction:column;gap:3px;padding:6px 8px;border:0;background:none;text-align:left;font-family:inherit;cursor:pointer;border-radius:10px}
.te-q-main:hover{background:#fafafb}
.te-q-label{font-size:14.5px;line-height:1.4;color:#111114;overflow-wrap:anywhere}
.te-q-meta{display:flex;flex-wrap:wrap;gap:6px;font-size:12px;color:#8a8a93}
.te-q-meta span{color:#8a8a93}
.te-q-meta .te-q-alert{display:inline-flex;align-items:center;gap:3px;color:#a32d2d;font-weight:600}
.te-q-acts{display:flex;flex-shrink:0}
.te-ic{width:40px;height:44px;border-radius:10px;border:0;background:none;color:#4b4b52;display:grid;place-items:center;cursor:pointer}
.te-ic:hover{background:#f0f0f3}
.te-ic:disabled{opacity:.3;cursor:not-allowed}
@media (max-width:479px){.te-q{flex-wrap:wrap}.te-q-main{flex-basis:calc(100% - 30px)}.te-q-acts{width:100%;justify-content:flex-end;margin-top:-6px}}
.te-adds{display:flex;flex-wrap:wrap;gap:8px;margin-top:10px}
.te-add{min-height:44px;padding:0 14px;border-radius:12px;border:1px solid rgba(17,17,20,.12);background:#fff;font-family:inherit;font-size:14px;font-weight:600;color:#111114;display:inline-flex;align-items:center;gap:6px;cursor:pointer}
.te-add:hover{background:#f5f5f7}
.te-add:disabled{opacity:.45;cursor:not-allowed}
@media (max-width:479px){.te-add{flex:1 1 100%;justify-content:center}}
.te-version{display:flex;gap:8px;align-items:flex-start;margin:0 0 12px;padding:10px 12px;border-radius:12px;background:#f0f0f3;font-size:13px;line-height:1.45;color:#4b4b52}
.te-version svg{flex-shrink:0;margin-top:2px}
.te-version span{color:#4b4b52}
.te-err{margin:0 0 12px;font-size:13.5px;color:#a32d2d}
.te-bar{position:sticky;bottom:var(--bottom-nav-h,0px);z-index:5;display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:10px;margin-top:6px;padding:12px 0 calc(12px + env(safe-area-inset-bottom));background:linear-gradient(to top,#f5f5f7 75%,rgba(245,245,247,0));border-top:1px solid rgba(17,17,20,.07)}
.te-bar-info{font-size:13.5px;color:#4b4b52}
.te-bar-acts{display:flex;gap:8px;margin-left:auto}
.te-discard{min-height:48px;padding:0 18px;border-radius:12px;border:0;background:#dc2626;color:#fff;font-family:inherit;font-size:15px;font-weight:700;cursor:pointer}
`
