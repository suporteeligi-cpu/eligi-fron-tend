// src/features/anamnesis/components/TemplatesTab.tsx
// @eligi:anamnese-front-modelos-aba
// Aba "Modelos": as fichas configuradas do estabelecimento (dono e gerente).
// Criar abre o "Configure sua ficha"; ativar, desativar e excluir ficam no cartao.
// Excluir so aparece para ficha nunca usada: o back recusa as outras (409) e
// a ficha preenchida guarda copia das perguntas, entao desativar basta.
'use client'

import { useState } from 'react'
import { AlertTriangle, ClipboardList, Plus } from 'lucide-react'
import { apiMessage, apiStatus, deleteTemplate, setTemplateActive } from '../api'
import { segmentNames } from '../catalog'
import type { Catalog, Template } from '../types'
import TemplateWizard from './TemplateWizard'

interface Props {
  loading: boolean
  error: string | null
  templates: Template[]
  catalog: Catalog | null
  reload: () => void
  replace: (t: Template) => void
  remove: (id: string) => void
}

function plural(n: number, one: string, many: string) {
  return `${n} ${n === 1 ? one : many}`
}

export default function TemplatesTab({ loading, error, templates, catalog, reload, replace, remove }: Props) {
  const [creating, setCreating] = useState(false)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [confirmId, setConfirmId] = useState<string | null>(null)
  const [cardError, setCardError] = useState<{ id: string; message: string } | null>(null)
  const [created, setCreated] = useState<string | null>(null)

  if (creating && catalog) {
    return (
      <TemplateWizard
        catalog={catalog}
        templates={templates}
        onCancel={() => setCreating(false)}
        onCreated={(t) => {
          setCreating(false)
          setCreated(t.name)
          reload()
          window.scrollTo({ top: 0 })
        }}
      />
    )
  }

  async function toggleActive(t: Template) {
    setBusyId(t.id)
    setCardError(null)
    try {
      replace(await setTemplateActive(t.id, !t.isActive))
    } catch (e) {
      setCardError({ id: t.id, message: apiMessage(e, 'Não foi possível salvar. Tente de novo.') })
    } finally {
      setBusyId(null)
    }
  }

  async function handleDelete(t: Template) {
    setBusyId(t.id)
    setCardError(null)
    try {
      await deleteTemplate(t.id)
      setConfirmId(null)
      remove(t.id)
    } catch (e) {
      const message = apiStatus(e) === 409
        ? 'Esta ficha já foi usada com clientes. Desative em vez de excluir.'
        : apiMessage(e, 'Não foi possível excluir. Tente de novo.')
      setCardError({ id: t.id, message })
      setConfirmId(null)
    } finally {
      setBusyId(null)
    }
  }

  if (loading) {
    return (
      <div aria-busy="true">
        <div className="an-skel" style={{ height: 120, marginBottom: 10 }} />
        <div className="an-skel" style={{ height: 120 }} />
      </div>
    )
  }

  if (error || !catalog) {
    return (
      <div className="an-state" role="alert">
        <p className="an-state-t">{error ?? 'Não foi possível carregar as fichas.'}</p>
        <button type="button" className="an-btn-ghost" onClick={reload}>Tentar de novo</button>
      </div>
    )
  }

  if (templates.length === 0) {
    return (
      <section className="tt-empty">
        <style>{CSS}</style>
        <div className="an-off-ic"><ClipboardList size={22} color="#111114" aria-hidden /></div>
        <h2 className="an-off-t">Configure sua primeira ficha</h2>
        <p className="an-off-s">
          Diga o que seu estabelecimento faz e a gente monta as perguntas e o termo. Leva um minuto, e você ajusta tudo depois.
        </p>
        <button type="button" className="an-btn-primary tt-new" onClick={() => setCreating(true)}>
          <Plus size={18} aria-hidden /> Configurar ficha
        </button>
      </section>
    )
  }

  return (
    <div>
      <style>{CSS}</style>
      {created && (
        <p className="tt-ok" role="status">Ficha {created} criada. Ela já aparece para os serviços que você escolheu.</p>
      )}
      <div className="tt-top">
        <p className="tt-count">{plural(templates.length, 'ficha configurada', 'fichas configuradas')}</p>
        <button type="button" className="an-btn-primary tt-new" onClick={() => { setCreated(null); setCreating(true) }}>
          <Plus size={18} aria-hidden /> Configurar nova ficha
        </button>
      </div>

      <ul className="tt-list">
        {templates.map((t) => {
          const segs = segmentNames(catalog, t.segments)
          const busy = busyId === t.id
          const err = cardError?.id === t.id ? cardError.message : null
          return (
            <li key={t.id} className={`tt-card${t.isActive ? '' : ' is-off'}`}>
              <div className="tt-head">
                <h3 className="tt-name">{t.name}</h3>
                <span className={`an-pill ${t.isActive ? 'is-ok' : 'tt-pill-off'}`}>{t.isActive ? 'Ativa' : 'Desativada'}</span>
              </div>
              {segs.length > 0 && <p className="tt-segs">{segs.join(' · ')}</p>}
              <p className="tt-stats">
                <span>{plural(t.stats.questions, 'pergunta', 'perguntas')}</span>
                {t.stats.alerts > 0 && (
                  <span className="tt-alert"><AlertTriangle size={12} aria-hidden />{plural(t.stats.alerts, 'gera alerta', 'geram alerta')}</span>
                )}
                <span>{plural(t.stats.records, 'ficha preenchida', 'fichas preenchidas')}</span>
              </p>
              <p className="tt-svcs">
                {t.services.length === 0
                  ? 'Nenhum serviço pede esta ficha ainda.'
                  : `Pedida em: ${t.services.map((s) => s.name).join(', ')}`}
              </p>
              {err && <p className="tt-err" role="alert">{err}</p>}

              {confirmId === t.id ? (
                <div className="tt-confirm">
                  <span>Excluir a ficha {t.name}? Não dá para desfazer.</span>
                  <div className="tt-acts">
                    <button type="button" className="an-btn-ghost" onClick={() => setConfirmId(null)} disabled={busy}>Cancelar</button>
                    <button type="button" className="tt-btn-del" onClick={() => handleDelete(t)} disabled={busy}>
                      {busy ? 'Excluindo…' : 'Excluir'}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="tt-acts">
                  <button type="button" className="an-btn-ghost" onClick={() => toggleActive(t)} disabled={busy}>
                    {busy ? 'Salvando…' : t.isActive ? 'Desativar' : 'Ativar'}
                  </button>
                  {t.stats.records === 0 && (
                    <button type="button" className="tt-btn-del-ghost" onClick={() => { setCardError(null); setConfirmId(t.id) }} disabled={busy}>
                      Excluir
                    </button>
                  )}
                </div>
              )}
            </li>
          )
        })}
      </ul>
      <p className="an-foot"><span>Ficha desativada não é pedida em novos atendimentos. As fichas já preenchidas continuam guardadas.</span></p>
    </div>
  )
}

const CSS = `
.tt-empty{background:#fff;border:1px solid rgba(17,17,20,.07);border-radius:18px;padding:22px 20px;max-width:640px}
.tt-new{display:inline-flex;align-items:center;justify-content:center;gap:8px;margin-top:14px}
.tt-top{display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:10px;margin-bottom:12px}
.tt-top .tt-new{margin-top:0}
.tt-count{margin:0;font-size:14px;color:#4b4b52}
@media (max-width:639px){.tt-new{width:100%}}
.tt-ok{margin:0 0 12px;padding:10px 12px;border-radius:12px;background:rgba(29,158,117,.10);color:#0f6e56;font-size:13.5px;font-weight:600}
.tt-list{list-style:none;margin:0;padding:0;display:grid;grid-template-columns:minmax(0,1fr);gap:10px}
@media (min-width:900px){.tt-list{grid-template-columns:repeat(2,minmax(0,1fr))}}
.tt-card{background:#fff;border:1px solid rgba(17,17,20,.07);border-radius:16px;padding:16px;display:flex;flex-direction:column;gap:6px}
.tt-card.is-off .tt-name,.tt-card.is-off .tt-segs{color:#8a8a93}
.tt-head{display:flex;align-items:flex-start;justify-content:space-between;gap:10px}
.tt-name{margin:0;font-family:var(--font-display);font-size:18px;font-weight:700;letter-spacing:-.025em;color:#111114;overflow-wrap:anywhere}
.tt-pill-off{color:#4b4b52;background:#f0f0f3;border-color:rgba(17,17,20,.10)}
.tt-segs{margin:0;font-size:13.5px;color:#4b4b52}
.tt-stats{margin:4px 0 0;display:flex;flex-wrap:wrap;gap:4px 12px;font-size:13px;color:#4b4b52;font-variant-numeric:tabular-nums}
.tt-stats span{color:#4b4b52}
.tt-stats .tt-alert{display:inline-flex;align-items:center;gap:4px;color:#a32d2d;font-weight:600}
.tt-svcs{margin:0;font-size:12.5px;color:#8a8a93;line-height:1.45}
.tt-err{margin:4px 0 0;font-size:13px;color:#a32d2d}
.tt-acts{display:flex;flex-wrap:wrap;gap:8px;margin-top:8px}
.tt-btn-del-ghost{min-height:44px;padding:0 16px;border-radius:12px;border:1px solid rgba(220,38,38,.24);background:#fff;color:#a32d2d;font-family:inherit;font-size:14px;font-weight:600;cursor:pointer}
.tt-btn-del-ghost:hover{background:rgba(220,38,38,.06)}
.tt-btn-del{min-height:44px;padding:0 18px;border-radius:12px;border:0;background:#dc2626;color:#fff;font-family:inherit;font-size:14px;font-weight:700;cursor:pointer}
.tt-btn-del:disabled,.tt-btn-del-ghost:disabled{opacity:.6;cursor:not-allowed}
.tt-confirm{margin-top:8px;padding:12px;border-radius:12px;background:rgba(220,38,38,.05);border:1px solid rgba(220,38,38,.18);font-size:13.5px;color:#111114}
.tt-confirm span{color:#111114}
.tt-confirm .tt-acts{margin-top:10px}
`
