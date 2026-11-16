'use client'
// src/app/dashboard/configuracoes/avisos-app/page.tsx
// @eligi:cna-page — Avisos do app do cliente, direcao 7B (fatia 7, 16/11/2026).
// Lista dos avisos | editor | celular com o aviso ao vivo. No celular: lista,
// e o editor abre por cima com "‹ Avisos". O texto da previa vem do back
// (POST /client-notices/preview, a mesma funcao do envio): a tela nunca monta.
// Rascunho por aviso: trocar de aviso nao perde o que foi digitado.
// So dono e gerente (o back responde 403 aos outros).

import Link from 'next/link'
import { useEffect, useMemo, useRef, useState } from 'react'
import { ChevronLeft, Lock, RotateCcw } from 'lucide-react'
import api from '@/shared/lib/apiClient'
import { typography } from '@/shared/theme'

type Group = 'AGENDAMENTO' | 'LEMBRETE' | 'CAIXA' | 'RELACIONAMENTO'
type Txt = { title: string; body: string }
type Item = {
  key: string
  group: Group
  label: string
  when: string
  vars: string[]
  canToggle: boolean
  on: boolean | null
  default: Txt
  custom: Txt | null
}
type Data = { businessName: string; toggles: { birthday: boolean; lapsed: boolean }; items: Item[] }
type Load = { state: 'loading' } | { state: 'error'; forbidden: boolean } | { state: 'ok'; d: Data }
type Preview = { title: string; body: string } | { error: { code: string; message: string } }

const GROUP_LABEL: Record<Group, string> = {
  AGENDAMENTO: 'Agendamento · sempre ligados',
  LEMBRETE: 'Lembretes · sempre ligados',
  CAIXA: 'Depois do caixa · sempre ligados',
  RELACIONAMENTO: 'Relacionamento · você pode desligar',
}
const GROUPS: Group[] = ['AGENDAMENTO', 'LEMBRETE', 'CAIXA', 'RELACIONAMENTO']
const TITLE_MAX = 40
const BODY_MAX = 178

// Relogio da tela bloqueada: lido uma vez (regra de pureza do React Compiler).
const AGORA = new Date()
const HORA_TELA = `${String(AGORA.getHours()).padStart(2, '0')}:${String(AGORA.getMinutes()).padStart(2, '0')}`
const DATA_TELA = AGORA.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })

function fetchData(): Promise<Data> {
  return api.get('/client-notices').then((r) => r.data as Data)
}

const current = (it: Item): Txt => it.custom ?? it.default
const len = (s: string) => [...s].length

const INK = '#111114'
const INK_2 = '#4b4b52'
const INK_3 = '#6b6b73'

const CSS = `
.cna{ max-width:1180px; font-family:${typography.fontFamily}; color:${INK}; }
.cna *{ box-sizing:border-box; }
.cna :where(span, div, b, i, p, h1, h2, strong, small, label){ color:inherit; } /* vence main span */
.cna a{ text-decoration:none; color:inherit; }
.cna button{ font-family:inherit; cursor:pointer; -webkit-tap-highlight-color:transparent; }
.cna a:focus-visible, .cna button:focus-visible, .cna input:focus-visible, .cna textarea:focus-visible{ outline:2px solid #dc2626; outline-offset:2px; }
.cna-back{ display:inline-flex; align-items:center; gap:4px; min-height:44px; padding:0 10px 0 4px; margin-left:-4px; border-radius:12px; font-size:14px; font-weight:500; color:${INK_2}; background:none; border:0; }
.cna-h1{ margin:4px 0 0; font-size:28px; font-weight:600; font-family:${typography.fontFamilyDisplay}; letter-spacing:-.03em; }
.cna-lead{ margin:6px 0 0; font-size:14px; line-height:1.45; color:${INK_3}; max-width:620px; }
.cna-cap{ font-family:${typography.fontFamilyMono}; font-size:11px; letter-spacing:.07em; text-transform:uppercase; color:${INK_3}; }
.cna-grid{ display:grid; grid-template-columns:minmax(0,1fr); gap:16px; margin-top:20px; }
@media (min-width:760px){ .cna-grid{ grid-template-columns:300px minmax(0,1fr); } .cna-phone-col{ grid-column:2; } }
@media (min-width:1200px){ .cna-grid{ grid-template-columns:300px minmax(0,1fr) 300px; } .cna-phone-col{ grid-column:auto; } }
@media (max-width:759px){ .cna[data-open="1"] .cna-list, .cna[data-open="1"] .cna-head{ display:none; } .cna[data-open="0"] .cna-ed, .cna[data-open="0"] .cna-phone-col{ display:none; } }
@media (min-width:760px){ .cna-mback{ display:none; } }

.cna-list{ display:flex; flex-direction:column; gap:14px; }
.cna-sec{ display:flex; flex-direction:column; gap:6px; }
.cna-card{ background:#fff; border:1px solid #ececf0; border-radius:16px; overflow:hidden; }
.cna-row{ display:flex; align-items:center; gap:10px; min-height:56px; padding:8px 8px 8px 14px; }
.cna-row + .cna-row{ border-top:1px solid #f0f0f3; }
.cna-row[aria-current="true"]{ background:#f5f5f7; box-shadow:inset 3px 0 0 ${INK}; }
.cna-pick{ flex:1; min-width:0; text-align:left; background:none; border:0; padding:6px 0; color:${INK}; }
.cna-pick b{ display:block; font-size:14px; font-weight:600; }
.cna-pick small{ display:block; font-size:12px; color:${INK_3}; margin-top:1px; }
.cna-tag{ display:inline-block; margin-left:6px; font-size:11px; font-weight:600; padding:1px 7px; border-radius:99px; background:#f0f0f3; color:${INK_2}; vertical-align:1px; }
.cna-tag.draft{ background:#fffbeb; color:#b45309; }
.cna-sw{ position:relative; flex-shrink:0; width:52px; height:44px; border:0; background:transparent; padding:0; }
.cna-sw i{ position:absolute; left:2px; top:8px; width:48px; height:28px; border-radius:99px; background:#d6d6dc; transition:background .18s ease; }
.cna-sw i::after{ content:''; position:absolute; top:3px; left:3px; width:22px; height:22px; border-radius:50%; background:#fff; box-shadow:0 1px 3px rgba(17,17,20,.25); transition:transform .18s cubic-bezier(.34,1.56,.64,1); }
.cna-sw[aria-checked="true"] i{ background:${INK}; }
.cna-sw[aria-checked="true"] i::after{ transform:translateX(20px); }

.cna-ed{ background:#fff; border:1px solid #ececf0; border-radius:18px; padding:20px; display:flex; flex-direction:column; gap:14px; min-width:0; }
.cna-ed-t{ font-size:22px; font-weight:600; font-family:${typography.fontFamilyDisplay}; letter-spacing:-.02em; margin:2px 0 0; }
.cna-off{ padding:10px 12px; border-radius:12px; background:#f7f7f9; font-size:13px; color:${INK_2}; }
.cna-lbl{ display:flex; flex-direction:column; gap:6px; font-size:13px; color:${INK_2}; font-weight:500; }
.cna-in{ display:flex; align-items:center; border:1px solid #dcdce2; border-radius:12px; padding:0 12px; min-height:48px; background:#fff; }
.cna-in:focus-within{ border-color:${INK}; }
.cna-in span{ color:${INK_3}; font-size:16px; white-space:nowrap; flex-shrink:0; max-width:45%; overflow:hidden; text-overflow:ellipsis; }
.cna-in input{ flex:1; min-width:0; border:0; outline:0; font:inherit; font-size:16px; color:${INK}; background:transparent; padding:12px 0 12px 4px; }
.cna-ta{ width:100%; border:1px solid #dcdce2; border-radius:12px; padding:12px; font:inherit; font-size:16px; line-height:1.45; color:${INK}; resize:vertical; min-height:96px; }
.cna-ta:focus{ outline:0; border-color:${INK}; }
.cna-vars{ display:flex; gap:6px; flex-wrap:wrap; align-items:center; }
.cna-chip{ min-height:36px; padding:0 12px; border-radius:99px; border:1px solid #e3e3e8; background:#f7f7f9; font-size:13px; font-weight:500; color:${INK}; }
.cna-count{ margin-left:auto; font-family:${typography.fontFamilyMono}; font-size:11px; color:${INK_3}; font-variant-numeric:tabular-nums; }
.cna-count.over{ color:#b45309; }
.cna-err{ padding:10px 12px; border-radius:12px; background:#fffbeb; color:#7a4a0f; font-size:13px; line-height:1.4; }
.cna-acts{ display:flex; gap:10px; flex-wrap:wrap; margin-top:4px; }
.cna-btn{ min-height:48px; padding:0 18px; border-radius:12px; font-size:14px; font-weight:600; display:inline-flex; align-items:center; gap:6px; }
.cna-btn.sec{ background:#fff; border:1px solid #dcdce2; color:${INK}; }
.cna-btn.pri{ background:${INK}; border:0; color:#fff; }
.cna-btn:disabled{ opacity:.45; cursor:default; }

.cna-phone-col{ display:flex; flex-direction:column; align-items:center; gap:10px; }
.cna-phone{ width:100%; max-width:290px; aspect-ratio:290/560; border-radius:44px; background:linear-gradient(160deg,#2d3a52,#151821); padding:14px; display:flex; flex-direction:column; color:#fff; }
.cna-phone .h{ text-align:center; font-family:${typography.fontFamilyDisplay}; font-size:56px; font-weight:500; margin-top:34px; letter-spacing:-.02em; }
.cna-phone .d{ text-align:center; font-size:13px; opacity:.8; }
.cna-notif{ margin-top:22px; background:rgba(255,255,255,.88); color:${INK}; border-radius:18px; padding:11px 12px; display:flex; gap:10px; }
.cna-notif .ic{ width:32px; height:32px; border-radius:8px; background:${INK}; flex-shrink:0; }
.cna-notif b{ display:block; font-size:12.5px; font-weight:600; line-height:1.3; }
.cna-notif p{ margin:2px 0 0; font-size:12.5px; line-height:1.35; color:#3a3a40; }
.cna-notif.wait{ opacity:.6; }
.cna-pnote{ margin:0; font-size:12px; color:${INK_3}; text-align:center; max-width:280px; }

.cna-skel{ height:56px; border-radius:16px; background:#f2f2f5; margin-top:10px; }
.cna-box{ margin-top:22px; padding:16px; border-radius:16px; background:#fff; border:1px solid #ececf0; font-size:14px; color:${INK_2}; display:flex; gap:10px; align-items:flex-start; }
.cna-box button{ margin-top:12px; }
.cna-toast{ position:fixed; left:50%; transform:translateX(-50%); bottom:calc(64px + env(safe-area-inset-bottom) + 14px); z-index:10000; padding:11px 16px; border-radius:12px; font-size:14px; font-weight:500; box-shadow:0 8px 24px rgba(17,17,20,.18); max-width:calc(100vw - 32px); }
.cna-toast.ok{ background:${INK}; color:#fff; }
.cna-toast.err{ background:#fff; color:#a32d2d; border:1px solid #f1d0d0; }
@media (min-width:1024px){ .cna-toast{ bottom:24px; left:calc(50% + var(--sidebar-width, 0px) / 2); } }
`

function Switch({ on, label, onClick }: { on: boolean; label: string; onClick: () => void }) {
  return (
    <button type="button" role="switch" aria-checked={on} aria-label={label} className="cna-sw" onClick={onClick}>
      <i aria-hidden />
    </button>
  )
}

export default function AvisosAppPage() {
  const [load, setLoad] = useState<Load>({ state: 'loading' })
  const [sel, setSel] = useState<string>('BOOKING_CONFIRMED')
  const [open, setOpen] = useState(false)
  const [drafts, setDrafts] = useState<Record<string, Txt>>({})
  const [preview, setPreview] = useState<{ key: string; p: Preview } | null>(null)
  const [busy, setBusy] = useState(false)
  const [toast, setToast] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null)
  const focus = useRef<'title' | 'body'>('body')
  const titleRef = useRef<HTMLInputElement>(null)
  const bodyRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    let vivo = true
    fetchData()
      .then((d) => { if (vivo) setLoad({ state: 'ok', d }) })
      .catch((e: { response?: { status?: number } }) => {
        console.error('[avisos-app] carregar', e)
        if (vivo) setLoad({ state: 'error', forbidden: e?.response?.status === 403 })
      })
    return () => { vivo = false }
  }, [])

  useEffect(() => {
    if (!toast) return
    const t = window.setTimeout(() => setToast(null), 2600)
    return () => window.clearTimeout(t)
  }, [toast])

  const d = load.state === 'ok' ? load.d : null
  const item = d?.items.find((i) => i.key === sel) ?? null
  const draft: Txt | null = item ? drafts[item.key] ?? current(item) : null
  const dirty = !!item && !!draft && (draft.title !== current(item).title || draft.body !== current(item).body)
  const isDefault = !!item && !!draft && draft.title === item.default.title && draft.body === item.default.body

  // Previa do back (a mesma funcao do envio), 350ms depois de parar de digitar.
  const pTitle = draft?.title
  const pBody = draft?.body
  const pKey = item?.key
  useEffect(() => {
    if (!pKey || pTitle === undefined || pBody === undefined) return
    let vivo = true
    const t = window.setTimeout(() => {
      api.post('/client-notices/preview', { key: pKey, title: pTitle, body: pBody })
        .then((r) => { if (vivo) setPreview({ key: pKey, p: r.data as Preview }) })
        .catch((e) => console.error('[avisos-app] previa', e))
    }, 350)
    return () => { vivo = false; window.clearTimeout(t) }
  }, [pKey, pTitle, pBody])

  const pv = preview && preview.key === item?.key ? preview.p : null
  const pvErr = pv && 'error' in pv ? pv.error : null
  const pvOk = pv && !('error' in pv) ? pv : null

  const grouped = useMemo(() => GROUPS.map((g) => ({ g, items: (d?.items ?? []).filter((i) => i.group === g) })), [d])

  const setDraft = (patch: Partial<Txt>) => {
    if (!item || !draft) return
    setDrafts((m) => ({ ...m, [item.key]: { ...draft, ...patch } }))
  }

  const insertVar = (v: string) => {
    if (!draft) return
    const token = `{${v}}`
    const isTitle = focus.current === 'title'
    const el = isTitle ? titleRef.current : bodyRef.current
    const text = isTitle ? draft.title : draft.body
    const a = el?.selectionStart ?? text.length
    const b = el?.selectionEnd ?? text.length
    const next = text.slice(0, a) + token + text.slice(b)
    setDraft(isTitle ? { title: next } : { body: next })
    window.requestAnimationFrame(() => {
      el?.focus()
      el?.setSelectionRange(a + token.length, a + token.length)
    })
  }

  const replaceItem = (next: Item) => {
    setLoad((l) => (l.state === 'ok' ? { state: 'ok', d: { ...l.d, items: l.d.items.map((i) => (i.key === next.key ? next : i)) } } : l))
    setDrafts((m) => {
      const { [next.key]: _drop, ...rest } = m
      void _drop
      return rest
    })
  }

  const errMsg = (e: unknown) => {
    const r = (e as { response?: { status?: number; data?: { error?: string } } })?.response
    if (r?.status === 403) return 'Só o dono e o gerente mudam os textos.'
    return r?.data?.error ?? 'Não foi possível salvar. Tente de novo.'
  }

  const save = () => {
    if (!item || !draft || busy) return
    setBusy(true)
    api.put(`/client-notices/${item.key}`, draft)
      .then((r) => { replaceItem(r.data as Item); setToast({ kind: 'ok', text: `${item.label}: salvo` }) })
      .catch((e) => { console.error('[avisos-app] salvar', e); setToast({ kind: 'err', text: errMsg(e) }) })
      .finally(() => setBusy(false))
  }

  const reset = () => {
    if (!item || busy) return
    if (!item.custom) {
      setDrafts((m) => ({ ...m, [item.key]: item.default }))
      return
    }
    setBusy(true)
    api.delete(`/client-notices/${item.key}`)
      .then((r) => { replaceItem(r.data as Item); setToast({ kind: 'ok', text: `${item.label}: voltou ao padrão` }) })
      .catch((e) => { console.error('[avisos-app] padrao', e); setToast({ kind: 'err', text: errMsg(e) }) })
      .finally(() => setBusy(false))
  }

  const toggle = (it: Item) => {
    if (!d || it.on === null) return
    const field = it.key === 'CLIENT_BIRTHDAY' ? 'birthday' : 'lapsed'
    const on = !it.on
    const apply = (v: boolean) =>
      setLoad((l) => (l.state === 'ok'
        ? { state: 'ok', d: { ...l.d, toggles: { ...l.d.toggles, [field]: v }, items: l.d.items.map((i) => (i.key === it.key ? { ...i, on: v } : i)) } }
        : l))
    apply(on)
    api.patch('/client-notices/toggles', { [field]: on })
      .then(() => setToast({ kind: 'ok', text: `${it.label}: ${on ? 'ligado' : 'desligado'}` }))
      .catch((e) => { console.error('[avisos-app] ligar', e); apply(!on); setToast({ kind: 'err', text: errMsg(e) }) })
  }

  const pick = (key: string) => { setSel(key); setOpen(true) }

  return (
    <div className="cna" data-open={open ? '1' : '0'}>
      <style>{CSS}</style>
      <div className="cna-head">
        <Link href="/dashboard/configuracoes" className="cna-back"><ChevronLeft size={18} aria-hidden /> Configurações</Link>
        <h1 className="cna-h1">Avisos do app do cliente</h1>
        <p className="cna-lead">O que chega no celular de quem tem o app Eligi Cliente. O título sempre começa com o nome do seu estabelecimento.</p>
      </div>

      {load.state === 'loading' && <div aria-busy="true" aria-label="Carregando">{[0, 1, 2, 3].map((i) => <div key={i} className="cna-skel" />)}</div>}

      {load.state === 'error' && (
        <div className="cna-box" role="alert">
          {load.forbidden ? (
            <><Lock size={16} aria-hidden style={{ flexShrink: 0, marginTop: 2 }} /> Só o dono e o gerente mudam os avisos do app.</>
          ) : (
            <div>
              Não foi possível carregar os avisos.
              <div><button type="button" className="cna-btn pri" onClick={() => { setLoad({ state: 'loading' }); fetchData().then((x) => setLoad({ state: 'ok', d: x })).catch(() => setLoad({ state: 'error', forbidden: false })) }}>Tentar de novo</button></div>
            </div>
          )}
        </div>
      )}

      {d && item && draft && (
        <div className="cna-grid">
          <nav className="cna-list" aria-label="Avisos">
            {grouped.map(({ g, items }) => (
              <section key={g} className="cna-sec" aria-label={GROUP_LABEL[g]}>
                <div className="cna-cap">{GROUP_LABEL[g]}</div>
                <div className="cna-card">
                  {items.map((it) => (
                    <div key={it.key} className="cna-row" aria-current={it.key === sel ? 'true' : undefined}>
                      <button type="button" className="cna-pick" onClick={() => pick(it.key)}>
                        <b>
                          {it.label}
                          {drafts[it.key] && (drafts[it.key]?.title !== current(it).title || drafts[it.key]?.body !== current(it).body)
                            ? <span className="cna-tag draft">não salvo</span>
                            : it.custom ? <span className="cna-tag">editado</span> : null}
                        </b>
                        <small>{it.when}</small>
                      </button>
                      {it.on !== null && <Switch on={it.on} label={it.label} onClick={() => toggle(it)} />}
                    </div>
                  ))}
                </div>
              </section>
            ))}
          </nav>

          <section className="cna-ed" aria-label={`Editar ${item.label}`}>
            <button type="button" className="cna-back cna-mback" onClick={() => setOpen(false)}><ChevronLeft size={18} aria-hidden /> Avisos</button>
            <div>
              <div className="cna-cap">{GROUP_LABEL[item.group].split(' · ')[0]} · {item.when}</div>
              <h2 className="cna-ed-t">{item.label}</h2>
            </div>
            {item.on === false && <div className="cna-off">Desligado: este aviso não está saindo. O texto fica guardado.</div>}

            <label className="cna-lbl">Título
              <span className="cna-in">
                <span>{d.businessName}:</span>
                <input
                  ref={titleRef}
                  value={draft.title}
                  maxLength={TITLE_MAX + 20}
                  onFocus={() => { focus.current = 'title' }}
                  onChange={(e) => setDraft({ title: e.target.value.replace(/[\r\n]/g, ' ') })}
                />
              </span>
            </label>
            <label className="cna-lbl">Texto
              <textarea
                ref={bodyRef}
                className="cna-ta"
                value={draft.body}
                rows={3}
                onFocus={() => { focus.current = 'body' }}
                onKeyDown={(e) => { if (e.key === 'Enter') e.preventDefault() }}
                onChange={(e) => setDraft({ body: e.target.value.replace(/[\r\n]/g, ' ') })}
              />
            </label>
            <div className="cna-vars">
              {item.vars.map((v) => (
                <button key={v} type="button" className="cna-chip" onMouseDown={(e) => e.preventDefault()} onClick={() => insertVar(v)}>+ {v}</button>
              ))}
              <span className={`cna-count${len(draft.body) > BODY_MAX ? ' over' : ''}`}>{len(draft.body)}/{BODY_MAX}</span>
            </div>
            {pvErr && <div className="cna-err" role="alert">{pvErr.message}</div>}

            <div className="cna-acts">
              <button type="button" className="cna-btn sec" onClick={reset} disabled={busy || (isDefault && !item.custom)}>
                <RotateCcw size={15} aria-hidden /> Voltar ao padrão
              </button>
              <button type="button" className="cna-btn pri" onClick={save} disabled={busy || !dirty || !!pvErr}>
                {busy ? 'Salvando…' : 'Salvar'}
              </button>
            </div>
          </section>

          <aside className="cna-phone-col" aria-label="Como chega no celular">
            <div className="cna-cap">No celular, ao vivo</div>
            <div className="cna-phone">
              <div className="h">{HORA_TELA}</div>
              <div className="d">{DATA_TELA}</div>
              <div className={`cna-notif${pvOk ? '' : ' wait'}`}>
                <span className="ic" />
                <div>
                  <b>{pvOk?.title ?? `${d.businessName}: …`}</b>
                  <p>{pvOk?.body ?? '…'}</p>
                </div>
              </div>
            </div>
            <p className="cna-pnote">Exemplo com uma cliente fictícia (Ana) e o seu primeiro serviço e profissional.</p>
          </aside>
        </div>
      )}

      {toast && <div className={`cna-toast ${toast.kind}`} role="status" aria-live="polite">{toast.text}</div>}
    </div>
  )
}
