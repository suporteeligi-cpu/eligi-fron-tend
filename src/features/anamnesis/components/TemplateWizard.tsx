// src/features/anamnesis/components/TemplateWizard.tsx
// @eligi:anamnese-front-configurar
// "Configure sua ficha" em 3 passos (mock a+ aprovado):
//   1. o que o estabelecimento faz (pode misturar segmentos)
//   2. perguntas: as sugeridas ja vem marcadas, o resto do banco fica para marcar
//   3. nome, termo de consentimento e servicos que pedem esta ficha
// Perguntas proprias e ajustes finos ficam no editor, depois de criada.
'use client'

import { useEffect, useMemo, useState } from 'react'
import { AlertTriangle, ArrowLeft, Check, ChevronDown } from 'lucide-react'
import { apiMessage, createTemplate, fetchServices } from '../api'
import { buildConsentText, buildQuestions, recommendedIds, suggestName } from '../catalog'
import type { AnamnesisQuestionType, Catalog, SegmentKey, ServiceLite, Template } from '../types'

/** Mesmo teto do back (MAX_QUESTIONS em anamnesis.schemas.ts). */
const MAX_QUESTIONS = 60
const CONSENT_MIN = 20

const TYPE_LABEL: Record<AnamnesisQuestionType, string> = {
  yes_no: 'Sim ou não',
  text: 'Texto curto',
  longtext: 'Texto longo',
  single_choice: 'Uma opção',
  multi_choice: 'Várias opções',
  date: 'Data',
}

interface Props {
  catalog: Catalog
  templates: Template[]
  onCancel: () => void
  onCreated: (t: Template) => void
}

type ServicesState = { ok: true; list: ServiceLite[] } | { ok: false; message: string } | null

export default function TemplateWizard({ catalog, templates, onCancel, onCreated }: Props) {
  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [segments, setSegments] = useState<SegmentKey[]>([])
  // Segmentos que geraram a marcacao atual: voltar e trocar o segmento refaz a sugestao.
  const [seededFor, setSeededFor] = useState<string>('')
  const [picked, setPicked] = useState<Set<string>>(() => new Set())
  const [openSections, setOpenSections] = useState<Set<string>>(() => new Set())
  const [name, setName] = useState('')
  const [consent, setConsent] = useState('')
  const [serviceIds, setServiceIds] = useState<Set<string>>(() => new Set())
  const [services, setServices] = useState<ServicesState>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let alive = true
    fetchServices().then(
      (list) => { if (alive) setServices({ ok: true, list }) },
      (e) => { if (alive) setServices({ ok: false, message: apiMessage(e, 'Não foi possível carregar os serviços.') }) },
    )
    return () => { alive = false }
  }, [])

  const questions = useMemo(() => buildQuestions(catalog, picked), [catalog, picked])
  const alertCount = questions.filter((q) => q.isAlert).length
  const segmentLabel = segments
    .map((k) => catalog.segments.find((s) => s.key === k)?.name)
    .filter(Boolean)
    .join(' + ')
  const templateName = (id: string | null) => templates.find((t) => t.id === id)?.name ?? null

  // Troca de passo volta ao topo: o passo novo comeca pelo titulo, nao no meio da lista.
  function go(n: 1 | 2 | 3) {
    setStep(n)
    window.scrollTo({ top: 0 })
  }

  function toggleSegment(key: SegmentKey) {
    setSegments((cur) => (cur.includes(key) ? cur.filter((k) => k !== key) : [...cur, key]))
  }

  function goToQuestions() {
    const key = [...segments].sort().join(',')
    if (key !== seededFor) {
      const ids = recommendedIds(catalog, segments)
      setPicked(new Set(ids))
      const withPicked = new Set(catalog.questions.filter((q) => ids.includes(q.id)).map((q) => q.section))
      setOpenSections(withPicked)
      setName(suggestName(catalog, segments))
      setConsent(buildConsentText(catalog, segments))
      setSeededFor(key)
    }
    go(2)
  }

  function toggleQuestion(id: string) {
    setPicked((cur) => {
      const next = new Set(cur)
      if (next.has(id)) next.delete(id)
      else if (next.size < MAX_QUESTIONS) next.add(id)
      return next
    })
  }

  function toggleSection(key: string) {
    setOpenSections((cur) => {
      const next = new Set(cur)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  function toggleService(id: string) {
    setServiceIds((cur) => {
      const next = new Set(cur)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const nameOk = name.trim().length >= 2
  const consentOk = consent.trim().length >= CONSENT_MIN

  async function handleCreate() {
    if (!nameOk || !consentOk || questions.length === 0) return
    setSaving(true)
    setError(null)
    try {
      const t = await createTemplate({
        name: name.trim(),
        segments,
        questions,
        consentText: consent.trim(),
        serviceIds: [...serviceIds],
      })
      onCreated(t)
    } catch (e) {
      setError(apiMessage(e, 'Não foi possível criar a ficha. Tente de novo.'))
      setSaving(false)
    }
  }

  return (
    <section className="aw" aria-label="Configurar ficha de anamnese">
      <style>{CSS}</style>

      <div className="aw-steps" aria-label="Passos">
        {(['O que você faz', 'Perguntas', 'Termo e serviços'] as const).map((label, i) => {
          const n = (i + 1) as 1 | 2 | 3
          return (
            <span key={label} className={`aw-step${step === n ? ' is-on' : ''}${step > n ? ' is-done' : ''}`} aria-current={step === n ? 'step' : undefined}>
              <span className="aw-step-n">{step > n ? <Check size={12} aria-hidden /> : n}</span>
              <span className="aw-step-l">{label}</span>
            </span>
          )
        })}
      </div>

      {step === 1 && (
        <>
          <h2 className="aw-h2">Configure sua ficha de anamnese</h2>
          <p className="aw-lead">Escolha o que seu estabelecimento faz. A gente já marca as perguntas certas, e você ajusta depois.</p>
          <div className="aw-segs">
            {catalog.segments.map((s) => {
              const on = segments.includes(s.key)
              return (
                <button key={s.key} type="button" className={`aw-seg${on ? ' is-on' : ''}`} aria-pressed={on} onClick={() => toggleSegment(s.key)}>
                  <span className="aw-seg-top">
                    <span className="aw-seg-name">{s.name}</span>
                    <span className="aw-box" aria-hidden>{on ? <Check size={13} /> : null}</span>
                  </span>
                  <span className="aw-seg-desc">{s.description}</span>
                  <span className="aw-seg-n">{s.recommended.length} perguntas sugeridas</span>
                </button>
              )
            })}
          </div>
          <div className="aw-bar">
            <span className="aw-bar-info">
              {segments.length === 0 ? 'Escolha pelo menos um.' : `${segments.length} ${segments.length === 1 ? 'escolhido' : 'escolhidos'}: ${segmentLabel}`}
            </span>
            <div className="aw-bar-acts">
              <button type="button" className="an-btn-ghost" onClick={onCancel}>Cancelar</button>
              <button type="button" className="an-btn-primary" disabled={segments.length === 0} onClick={goToQuestions}>Continuar</button>
            </div>
          </div>
        </>
      )}

      {step === 2 && (
        <>
          <h2 className="aw-h2">Quais perguntas entram na ficha?</h2>
          <p className="aw-lead">
            As sugeridas para {segmentLabel} já vêm marcadas. Toque para tirar ou incluir. Perguntas próprias você cria no editor, depois de salvar.
          </p>
          <div className="aw-sections">
            {catalog.sections.map((sec) => {
              const list = catalog.questions.filter((q) => q.section === sec.key)
              if (list.length === 0) return null
              const chosen = list.filter((q) => picked.has(q.id)).length
              const open = openSections.has(sec.key)
              return (
                <div key={sec.key} className="aw-sec">
                  <button type="button" className="aw-sec-h" aria-expanded={open} onClick={() => toggleSection(sec.key)}>
                    <span className="aw-sec-name">{sec.name}</span>
                    <span className="aw-sec-n">{chosen} de {list.length}</span>
                    <ChevronDown size={18} className={`aw-chev${open ? ' is-open' : ''}`} aria-hidden />
                  </button>
                  {open && (
                    <ul className="aw-qs">
                      {list.map((q) => {
                        const on = picked.has(q.id)
                        const full = !on && picked.size >= MAX_QUESTIONS
                        return (
                          <li key={q.id}>
                            <button type="button" className={`aw-q${on ? ' is-on' : ''}`} aria-pressed={on} disabled={full} onClick={() => toggleQuestion(q.id)}>
                              <span className="aw-box" aria-hidden>{on ? <Check size={13} /> : null}</span>
                              <span className="aw-q-body">
                                <span className="aw-q-label">{q.label}</span>
                                <span className="aw-q-meta">
                                  <span>{TYPE_LABEL[q.type]}</span>
                                  {q.required ? <span>· obrigatória</span> : null}
                                  {q.isAlert ? <span className="aw-q-alert"><AlertTriangle size={11} aria-hidden />gera alerta</span> : null}
                                </span>
                              </span>
                            </button>
                          </li>
                        )
                      })}
                    </ul>
                  )}
                </div>
              )
            })}
          </div>
          <div className="aw-bar">
            <span className="aw-bar-info">
              {questions.length} {questions.length === 1 ? 'pergunta' : 'perguntas'} · {alertCount} {alertCount === 1 ? 'gera' : 'geram'} alerta
              {picked.size >= MAX_QUESTIONS ? ` · limite de ${MAX_QUESTIONS}` : ''}
            </span>
            <div className="aw-bar-acts">
              <button type="button" className="an-btn-ghost" onClick={() => go(1)}>Voltar</button>
              <button type="button" className="an-btn-primary" disabled={questions.length === 0} onClick={() => go(3)}>Continuar</button>
            </div>
          </div>
        </>
      )}

      {step === 3 && (
        <>
          <h2 className="aw-h2">Termo e serviços</h2>
          <p className="aw-lead">O cliente lê e aceita o termo antes de enviar a ficha. Escolha também os serviços que pedem esta ficha.</p>

          <label className="aw-field">
            <span className="aw-label">NOME DA FICHA</span>
            <input className="aw-input" value={name} onChange={(e) => setName(e.target.value)} maxLength={80} placeholder="Ex.: Cílios" />
            {!nameOk && <span className="aw-hint">Dê um nome à ficha.</span>}
          </label>

          <label className="aw-field">
            <span className="aw-label">TERMO DE CONSENTIMENTO</span>
            <textarea className="aw-input aw-textarea" value={consent} onChange={(e) => setConsent(e.target.value)} maxLength={5000} rows={7} />
            <span className={`aw-hint${consentOk ? ' is-ok' : ''}`}>
              {consentOk ? 'Montado com as cláusulas do que você escolheu. Pode editar.' : 'Escreva o termo que o cliente vai aceitar.'}
            </span>
          </label>

          <div className="aw-field">
            <span className="aw-label">SERVIÇOS QUE PEDEM ESTA FICHA</span>
            {services === null && <div className="an-skel" style={{ height: 88 }} />}
            {services && !services.ok && <p className="aw-hint is-err" role="alert">{services.message}</p>}
            {services && services.ok && services.list.length === 0 && (
              <p className="aw-hint">Nenhum serviço cadastrado ainda. Você liga os serviços depois, no editor.</p>
            )}
            {services && services.ok && services.list.length > 0 && (
              <div className="aw-svcs">
                {services.list.map((s) => {
                  const on = serviceIds.has(s.id)
                  const other = s.anamnesisTemplateId ? templateName(s.anamnesisTemplateId) : null
                  return (
                    <button key={s.id} type="button" className={`aw-svc${on ? ' is-on' : ''}`} aria-pressed={on} onClick={() => toggleService(s.id)}>
                      <span className="aw-box" aria-hidden>{on ? <Check size={13} /> : null}</span>
                      <span className="aw-svc-body">
                        <span className="aw-svc-name">{s.name}</span>
                        {other ? (
                          <span className={`aw-svc-note${on ? ' is-warn' : ''}`}>
                            {on ? `Sai da ficha ${other} e passa para esta` : `Hoje na ficha ${other}`}
                          </span>
                        ) : null}
                      </span>
                    </button>
                  )
                })}
              </div>
            )}
            <span className="aw-hint">Um serviço pede uma ficha só. Pode deixar sem nenhum e ligar depois.</span>
          </div>

          {error && <p className="aw-err" role="alert">{error}</p>}

          <div className="aw-bar">
            <span className="aw-bar-info">
              {questions.length} perguntas · {serviceIds.size} {serviceIds.size === 1 ? 'serviço' : 'serviços'}
            </span>
            <div className="aw-bar-acts">
              <button type="button" className="an-btn-ghost" onClick={() => go(2)} disabled={saving}>
                <ArrowLeft size={16} aria-hidden /> Voltar
              </button>
              <button type="button" className="an-btn-primary" disabled={saving || !nameOk || !consentOk} onClick={handleCreate}>
                {saving ? 'Criando…' : 'Criar ficha'}
              </button>
            </div>
          </div>
        </>
      )}
    </section>
  )
}

const CSS = `
.aw-steps{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:16px}
.aw-step{display:inline-flex;align-items:center;gap:8px;min-height:36px;padding:0 14px 0 6px;border-radius:999px;border:1px solid rgba(17,17,20,.12);background:#fff;font-size:13.5px;color:#4b4b52}
.aw-step span{color:inherit}
.aw-step-n{width:24px;height:24px;border-radius:50%;display:grid;place-items:center;background:#f0f0f3;font-size:12px;font-weight:700;color:#4b4b52}
.aw-step.is-on{border-color:#111114;color:#111114;font-weight:700}
.aw-step.is-on .aw-step-n{background:#111114;color:#fff}
.aw-step.is-done .aw-step-n{background:#0f6e56;color:#fff}
@media (max-width:639px){.aw-step:not(.is-on) .aw-step-l{display:none}.aw-step:not(.is-on){padding:0 6px}}
.aw-h2{font-family:var(--font-display);font-size:26px;font-weight:700;letter-spacing:-.035em;margin:0;color:#111114;line-height:1.15}
@media (min-width:720px){.aw-h2{font-size:30px}}
.aw-lead{margin:8px 0 18px;font-size:14.5px;line-height:1.5;color:#4b4b52;max-width:640px}
.aw-segs{display:grid;grid-template-columns:minmax(0,1fr);gap:10px}
@media (min-width:640px){.aw-segs{grid-template-columns:repeat(2,minmax(0,1fr))}}
@media (min-width:980px){.aw-segs{grid-template-columns:repeat(3,minmax(0,1fr))}}
.aw-seg{display:flex;flex-direction:column;gap:6px;text-align:left;padding:16px;border-radius:16px;border:1.5px solid rgba(17,17,20,.09);background:#fff;font-family:inherit;cursor:pointer;min-height:44px}
.aw-seg:hover{border-color:rgba(17,17,20,.25)}
.aw-seg.is-on{border-color:#111114;box-shadow:0 0 0 1px #111114 inset}
.aw-seg-top{display:flex;justify-content:space-between;align-items:flex-start;gap:10px}
.aw-seg-name{font-family:var(--font-display);font-size:17px;font-weight:700;letter-spacing:-.02em;color:#111114}
.aw-seg-desc{font-size:13.5px;line-height:1.45;color:#4b4b52}
.aw-seg-n{font-family:var(--font-mono);font-size:11.5px;color:#8a8a93}
.aw-box{width:22px;height:22px;flex-shrink:0;border-radius:6px;border:1.5px solid rgba(17,17,20,.22);display:grid;place-items:center;background:#fff;color:#fff}
.is-on>.aw-box,.is-on .aw-seg-top .aw-box{background:#111114;border-color:#111114}
.aw-sections{display:flex;flex-direction:column;gap:10px}
.aw-sec{background:#fff;border:1px solid rgba(17,17,20,.07);border-radius:16px;overflow:hidden}
.aw-sec-h{width:100%;min-height:52px;display:flex;align-items:center;gap:10px;padding:0 14px 0 16px;border:0;background:none;font-family:inherit;cursor:pointer;text-align:left}
.aw-sec-name{flex:1;font-size:15px;font-weight:700;color:#111114}
.aw-sec-n{font-size:12.5px;color:#8a8a93;font-variant-numeric:tabular-nums}
.aw-chev{color:#8a8a93;transition:transform .18s}
.aw-chev.is-open{transform:rotate(180deg)}
.aw-qs{list-style:none;margin:0;padding:0 8px 8px}
.aw-q{width:100%;display:flex;gap:12px;align-items:flex-start;text-align:left;padding:11px 8px;border:0;border-top:1px solid rgba(17,17,20,.06);background:none;font-family:inherit;cursor:pointer;border-radius:10px}
.aw-q:hover{background:#fafafb}
.aw-q:disabled{opacity:.45;cursor:not-allowed}
.aw-q-body{display:flex;flex-direction:column;gap:3px;min-width:0}
.aw-q-label{font-size:14.5px;line-height:1.4;color:#111114}
.aw-q-meta{display:flex;flex-wrap:wrap;gap:6px;font-size:12px;color:#8a8a93}
.aw-q-meta span{color:#8a8a93}
.aw-q-meta .aw-q-alert{display:inline-flex;align-items:center;gap:3px;color:#a32d2d;font-weight:600}
.aw-field{display:flex;flex-direction:column;gap:6px;margin-bottom:18px}
.aw-label{font-family:var(--font-mono);font-size:11px;font-weight:600;letter-spacing:.1em;color:#8a8a93}
.aw-input{min-height:48px;padding:12px 14px;border-radius:12px;border:1px solid rgba(17,17,20,.14);background:#fff;font-family:inherit;font-size:16px;color:#111114;width:100%;box-sizing:border-box}
.aw-input:focus{border-color:#111114}
.aw-textarea{line-height:1.5;resize:vertical;min-height:150px}
.aw-hint{font-size:12.5px;color:#8a8a93;line-height:1.4}
.aw-hint.is-ok{color:#0f6e56}
.aw-hint.is-err{color:#a32d2d;margin:0}
.aw-svcs{display:grid;grid-template-columns:minmax(0,1fr);gap:8px}
@media (min-width:640px){.aw-svcs{grid-template-columns:repeat(2,minmax(0,1fr))}}
.aw-svc{display:flex;gap:10px;align-items:flex-start;text-align:left;min-height:48px;padding:12px;border-radius:12px;border:1.5px solid rgba(17,17,20,.09);background:#fff;font-family:inherit;cursor:pointer}
.aw-svc.is-on{border-color:#111114}
.aw-svc-body{display:flex;flex-direction:column;gap:2px;min-width:0}
.aw-svc-name{font-size:14.5px;font-weight:600;color:#111114;overflow-wrap:anywhere}
.aw-svc-note{font-size:12px;color:#8a8a93}
.aw-svc-note.is-warn{color:#b45309}
.aw-err{margin:0 0 12px;font-size:13.5px;color:#a32d2d}
.aw-bar{position:sticky;bottom:var(--bottom-nav-h,0px);z-index:5;display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:10px;margin-top:18px;padding:12px 0 calc(12px + env(safe-area-inset-bottom));background:linear-gradient(to top,#f5f5f7 75%,rgba(245,245,247,0));border-top:1px solid rgba(17,17,20,.07)}
.aw-bar-info{font-size:13.5px;color:#4b4b52;font-variant-numeric:tabular-nums}
.aw-bar-acts{display:flex;gap:8px;margin-left:auto}
.aw-bar-acts .an-btn-ghost{display:inline-flex;align-items:center;gap:6px}
`
