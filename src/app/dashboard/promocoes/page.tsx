'use client'
// src/app/dashboard/promocoes/page.tsx
// @eligi:cpromo-page — Promocoes para os clientes do app, direcao 8C (fatia 8, 16/11/2026).
// Comeca por um modelo (publico e texto prontos) ou do zero; ajusta e envia
// agora ou agenda. No maximo 2 por semana (o back conta e recusa a 3a).
// Quantos recebem vem do back (app ligado e promocao nao desligada).
// Previa: o titulo comeca com o nome do lugar; {nome} vira "Ana" (exemplo).
// Vermelho so no Enviar. Dono e gerente (o back responde 403 aos outros).

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { ChevronLeft, ChevronRight, Lock, Megaphone } from 'lucide-react'
import api from '@/shared/lib/apiClient'
import { typography } from '@/shared/theme'

type Audience = 'ALL' | 'LAPSED' | 'BIRTHDAY_MONTH' | 'SERVICE' | 'PROFESSIONAL'
type Template = { key: string; label: string; audience: Audience; audienceName: string; title: string; body: string; count: number | null }
type Promo = {
  id: string; title: string; body: string; audience: Audience; audienceName: string
  status: 'SCHEDULED' | 'SENDING' | 'SENT' | 'CANCELED'; sendAt: string; sentAt: string | null; recipients: number | null
}
type Opt = { id: string; name: string }
type Data = {
  businessName: string
  week: { used: number; max: number; resetsAt: string }
  templates: Template[]
  audiences: { key: Audience; label: string; needsRef: boolean }[]
  services: Opt[]
  professionals: Opt[]
  items: Promo[]
}
type Load = { state: 'loading' } | { state: 'error'; forbidden: boolean } | { state: 'ok'; d: Data }
type Draft = { audience: Audience; ref: string | null; title: string; body: string; when: 'now' | 'later'; at: string; templateKey: string | null }

const TITLE_MAX = 40
const BODY_MAX = 178
const len = (s: string) => [...s].length
const needsRef = (a: Audience) => a === 'SERVICE' || a === 'PROFESSIONAL'
const exemplo = (s: string) => s.replace(/\{\s*nome\s*\}/gi, 'Ana')

function fetchData(): Promise<Data> {
  return api.get('/client-promotions').then((r) => r.data as Data)
}

function dataHora(iso: string) {
  const d = new Date(iso)
  const dia = d.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: '2-digit' }).replace('.', '')
  return `${dia} · ${d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`
}

const INK = '#111114'
const INK_2 = '#4b4b52'
const INK_3 = '#6b6b73'

const CSS = `
.cpm{ max-width:1080px; font-family:${typography.fontFamily}; color:${INK}; }
.cpm *{ box-sizing:border-box; }
.cpm :where(span, div, b, i, p, h1, h2, strong, small, label){ color:inherit; } /* vence main span */
.cpm a{ text-decoration:none; color:inherit; }
.cpm button{ font-family:inherit; cursor:pointer; -webkit-tap-highlight-color:transparent; }
.cpm a:focus-visible, .cpm button:focus-visible, .cpm input:focus-visible, .cpm textarea:focus-visible{ outline:2px solid #dc2626; outline-offset:2px; }
.cpm-top{ display:flex; align-items:flex-start; gap:12px; flex-wrap:wrap; }
.cpm-h1{ margin:0; font-size:28px; font-weight:600; font-family:${typography.fontFamilyDisplay}; letter-spacing:-.03em; }
.cpm-week{ font-family:${typography.fontFamilyMono}; font-size:11px; letter-spacing:.05em; text-transform:uppercase; border-radius:99px; padding:4px 10px; margin-top:8px; background:#f2f2f5; color:${INK_2}; }
.cpm-week.used{ background:#fffbeb; color:#b45309; }
.cpm-lead{ margin:6px 0 0; font-size:14px; line-height:1.45; color:${INK_3}; max-width:620px; }
.cpm-auto{ display:inline-flex; align-items:center; gap:2px; min-height:44px; font-size:13.5px; font-weight:500; color:${INK_2}; margin-top:4px; }
.cpm-cap{ font-family:${typography.fontFamilyMono}; font-size:11px; letter-spacing:.07em; text-transform:uppercase; color:${INK_3}; }
.cpm-grid{ display:grid; grid-template-columns:minmax(0,1fr); gap:12px; margin-top:16px; }
@media (min-width:760px){ .cpm-grid{ grid-template-columns:repeat(2,minmax(0,1fr)); } }
.cpm-card{ background:#fff; border:1px solid #ececf0; border-radius:18px; padding:16px; display:flex; flex-direction:column; gap:10px; }
.cpm-card h2{ margin:0; font-size:19px; font-weight:600; font-family:${typography.fontFamilyDisplay}; letter-spacing:-.02em; }
.cpm-bub{ background:#f5f5f7; border-radius:14px; padding:10px 12px; font-size:13px; line-height:1.45; }
.cpm-bub b{ display:block; font-weight:600; }
.cpm-foot{ display:flex; align-items:center; gap:10px; flex-wrap:wrap; }
.cpm-n{ font-size:13px; color:#0f6e56; }
.cpm-n.zero{ color:${INK_3}; }
.cpm-btn{ min-height:44px; padding:0 16px; border-radius:12px; font-size:14px; font-weight:600; display:inline-flex; align-items:center; gap:6px; }
.cpm-btn.pri{ background:${INK}; border:0; color:#fff; }
.cpm-btn.sec{ background:#fff; border:1px solid #dcdce2; color:${INK}; }
.cpm-btn.send{ background:#dc2626; border:0; color:#fff; min-height:52px; padding:0 22px; }
.cpm-btn:disabled{ opacity:.45; cursor:default; }
.cpm-sp{ flex:1; }
.cpm-zero{ margin-top:12px; }

.cpm-form{ display:grid; grid-template-columns:minmax(0,1fr); gap:16px; margin-top:16px; }
@media (min-width:1000px){ .cpm-form{ grid-template-columns:minmax(0,1fr) 320px; align-items:start; } .cpm-side{ position:sticky; top:120px; } }
.cpm-sec{ background:#fff; border:1px solid #ececf0; border-radius:18px; padding:16px; display:flex; flex-direction:column; gap:10px; }
.cpm-chips{ display:flex; gap:8px; flex-wrap:wrap; }
.cpm-chip{ min-height:44px; padding:0 14px; border-radius:99px; border:1px solid #dcdce2; background:#fff; font-size:13.5px; font-weight:500; color:${INK}; }
.cpm-chip[aria-pressed="true"]{ background:${INK}; border-color:${INK}; color:#fff; }
.cpm-ok{ font-size:14px; border-radius:10px; padding:8px 12px; background:#ecfdf5; color:#0f6e56; }
.cpm-ok.zero{ background:#f7f7f9; color:${INK_2}; }
.cpm-in{ display:flex; align-items:center; border:1px solid #dcdce2; border-radius:12px; padding:0 12px; min-height:48px; }
.cpm-in:focus-within{ border-color:${INK}; }
.cpm-in span{ color:${INK_3}; font-size:16px; white-space:nowrap; flex-shrink:0; max-width:45%; overflow:hidden; text-overflow:ellipsis; }
.cpm-in input{ flex:1; min-width:0; border:0; outline:0; font:inherit; font-size:16px; color:${INK}; background:transparent; padding:12px 0 12px 4px; }
.cpm-ta{ width:100%; border:1px solid #dcdce2; border-radius:12px; padding:12px; font:inherit; font-size:16px; line-height:1.45; color:${INK}; resize:vertical; min-height:88px; }
.cpm-ta:focus{ outline:0; border-color:${INK}; }
.cpm-dt{ border:1px solid #dcdce2; border-radius:12px; min-height:48px; padding:0 12px; font:inherit; font-size:16px; color:${INK}; }
.cpm-row{ display:flex; gap:8px; align-items:center; flex-wrap:wrap; }
.cpm-count{ margin-left:auto; font-family:${typography.fontFamilyMono}; font-size:11px; color:${INK_3}; }
.cpm-count.over{ color:#b45309; }
.cpm-note{ font-size:12.5px; color:${INK_3}; line-height:1.45; margin:0; }
.cpm-err{ padding:10px 12px; border-radius:12px; background:#fffbeb; color:#7a4a0f; font-size:13px; line-height:1.4; }
.cpm-notif{ background:#e9e9ee; border-radius:20px; padding:12px 14px; display:flex; gap:10px; }
.cpm-notif .ic{ width:34px; height:34px; border-radius:9px; background:${INK}; flex-shrink:0; }
.cpm-notif b{ display:block; font-size:13.5px; font-weight:600; }
.cpm-notif p{ margin:2px 0 0; font-size:13.5px; color:#3a3a40; line-height:1.4; }

.cpm-hist{ margin-top:28px; display:flex; flex-direction:column; gap:8px; }
.cpm-list{ background:#fff; border:1px solid #ececf0; border-radius:16px; overflow:hidden; }
.cpm-li{ display:flex; align-items:center; gap:12px; padding:12px 14px; flex-wrap:wrap; }
.cpm-li + .cpm-li{ border-top:1px solid #f0f0f3; }
.cpm-li .t{ flex:1; min-width:180px; }
.cpm-li .t b{ display:block; font-size:14px; font-weight:600; }
.cpm-li .t small{ display:block; font-size:12.5px; color:${INK_3}; margin-top:1px; }
.cpm-st{ font-size:12px; font-weight:600; border-radius:99px; padding:3px 9px; background:#f2f2f5; color:${INK_2}; white-space:nowrap; }
.cpm-st.sent{ background:#ecfdf5; color:#0f6e56; }
.cpm-st.sched{ background:#fffbeb; color:#b45309; }
.cpm-empty{ padding:16px; font-size:13.5px; color:${INK_3}; }
.cpm-skel{ height:120px; border-radius:18px; background:#f2f2f5; margin-top:12px; }
.cpm-box{ margin-top:22px; padding:16px; border-radius:16px; background:#fff; border:1px solid #ececf0; font-size:14px; color:${INK_2}; display:flex; gap:10px; align-items:flex-start; }
.cpm-toast{ position:fixed; left:50%; transform:translateX(-50%); bottom:calc(64px + env(safe-area-inset-bottom) + 14px); z-index:10000; padding:11px 16px; border-radius:12px; font-size:14px; font-weight:500; box-shadow:0 8px 24px rgba(17,17,20,.18); max-width:calc(100vw - 32px); }
.cpm-toast.ok{ background:${INK}; color:#fff; }
.cpm-toast.err{ background:#fff; color:#a32d2d; border:1px solid #f1d0d0; }
@media (min-width:1024px){ .cpm-toast{ bottom:24px; left:calc(50% + var(--sidebar-width, 0px) / 2); } }
`

const errMsg = (e: unknown, padrao: string) => {
  const r = (e as { response?: { status?: number; data?: { error?: string } } })?.response
  if (r?.status === 403) return 'Só o dono e o gerente enviam promoções.'
  return r?.data?.error ?? padrao
}

export default function PromocoesPage() {
  const [load, setLoad] = useState<Load>({ state: 'loading' })
  const [draft, setDraft] = useState<Draft | null>(null)
  const [count, setCount] = useState<{ key: string; n: number } | null>(null)
  const [busy, setBusy] = useState(false)
  const [formErr, setFormErr] = useState<string | null>(null)
  const [toast, setToast] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null)

  const reload = () =>
    fetchData()
      .then((d) => setLoad({ state: 'ok', d }))
      .catch((e: { response?: { status?: number } }) => {
        console.error('[promocoes] carregar', e)
        setLoad({ state: 'error', forbidden: e?.response?.status === 403 })
      })

  useEffect(() => {
    let vivo = true
    fetchData()
      .then((d) => { if (vivo) setLoad({ state: 'ok', d }) })
      .catch((e: { response?: { status?: number } }) => {
        console.error('[promocoes] carregar', e)
        if (vivo) setLoad({ state: 'error', forbidden: e?.response?.status === 403 })
      })
    return () => { vivo = false }
  }, [])

  useEffect(() => {
    if (!toast) return
    const t = window.setTimeout(() => setToast(null), 2800)
    return () => window.clearTimeout(t)
  }, [toast])

  // Quantos recebem o grupo escolhido (do back).
  const aud = draft?.audience
  const ref = draft?.ref ?? null
  const countKey = aud ? `${aud}|${ref ?? ''}` : ''
  useEffect(() => {
    if (!aud || (needsRef(aud) && !ref)) return
    let vivo = true
    const t = window.setTimeout(() => {
      api.get('/client-promotions/audience', { params: { audience: aud, ...(ref ? { ref } : {}) } })
        .then((r) => { if (vivo) setCount({ key: `${aud}|${ref ?? ''}`, n: (r.data as { count: number }).count }) })
        .catch((e) => console.error('[promocoes] contar', e))
    }, 250)
    return () => { vivo = false; window.clearTimeout(t) }
  }, [aud, ref])

  const d = load.state === 'ok' ? load.d : null
  const cheia = !!d && d.week.used >= d.week.max
  const n = count && count.key === countKey ? count.n : null

  const start = (t: Template | null) => {
    setFormErr(null)
    setDraft(t
      ? { audience: t.audience, ref: null, title: t.title, body: t.body, when: 'now', at: '', templateKey: t.key }
      : { audience: 'ALL', ref: null, title: '', body: '', when: 'now', at: '', templateKey: null })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const set = (patch: Partial<Draft>) => { setFormErr(null); setDraft((x) => (x ? { ...x, ...patch } : x)) }

  const invalido = (x: Draft): string | null => {
    if (needsRef(x.audience) && !x.ref) return x.audience === 'SERVICE' ? 'Escolha o serviço.' : 'Escolha o profissional.'
    if (!x.title.trim()) return 'Escreva o título.'
    if (!x.body.trim()) return 'Escreva o texto.'
    if (len(x.title) > TITLE_MAX) return `O título pode ter até ${TITLE_MAX} letras.`
    if (len(x.body) > BODY_MAX) return `O texto pode ter até ${BODY_MAX} letras.`
    if (x.when === 'later' && !x.at) return 'Escolha o dia e a hora.'
    return null
  }

  const enviar = () => {
    if (!draft || busy) return
    const e = invalido(draft)
    if (e) { setFormErr(e); return }
    setBusy(true)
    api.post('/client-promotions', {
      audience: draft.audience,
      ref: draft.ref,
      title: draft.title,
      body: draft.body,
      sendAt: draft.when === 'later' ? new Date(draft.at).toISOString() : null,
      templateKey: draft.templateKey,
    })
      .then((r) => {
        const p = r.data as Promo & { expected: number }
        setToast({ kind: 'ok', text: draft.when === 'later' ? `Agendada para ${dataHora(p.sendAt)}` : `Saindo para ${p.expected} ${p.expected === 1 ? 'cliente' : 'clientes'}` })
        setDraft(null)
        void reload()
      })
      .catch((err) => { console.error('[promocoes] enviar', err); setFormErr(errMsg(err, 'Não foi possível enviar. Tente de novo.')) })
      .finally(() => setBusy(false))
  }

  const cancelar = (p: Promo) => {
    api.post(`/client-promotions/${p.id}/cancel`)
      .then(() => { setToast({ kind: 'ok', text: 'Promoção cancelada. A vaga da semana voltou.' }); void reload() })
      .catch((e) => { console.error('[promocoes] cancelar', e); setToast({ kind: 'err', text: errMsg(e, 'Não foi possível cancelar.') }) })
  }

  const refOpts = draft?.audience === 'SERVICE' ? d?.services ?? [] : draft?.audience === 'PROFESSIONAL' ? d?.professionals ?? [] : []
  const semana = d ? (cheia ? 'Semana cheia · abre na segunda' : `${d.week.used} de ${d.week.max} desta semana`) : ''

  return (
    <div className="cpm">
      <style>{CSS}</style>

      {draft ? (
        <button type="button" className="cpm-auto" style={{ background: 'none', border: 0, padding: 0 }} onClick={() => setDraft(null)}>
          <ChevronLeft size={18} aria-hidden /> Modelos
        </button>
      ) : null}
      <div className="cpm-top">
        <h1 className="cpm-h1">{draft ? 'Nova promoção' : 'O que você quer fazer hoje?'}</h1>
        {d && <span className={`cpm-week${d.week.used > 0 ? ' used' : ''}`}>{semana}</span>}
      </div>
      {!draft && (
        <>
          <p className="cpm-lead">Um aviso no celular de quem tem o app Eligi Cliente. Escolha um começo: o público e o texto já vêm prontos, você ajusta antes de enviar.</p>
          <Link href="/dashboard/configuracoes/avisos-app" className="cpm-auto">Textos dos avisos automáticos <ChevronRight size={15} aria-hidden /></Link>
        </>
      )}

      {load.state === 'loading' && <div aria-busy="true" aria-label="Carregando">{[0, 1].map((i) => <div key={i} className="cpm-skel" />)}</div>}

      {load.state === 'error' && (
        <div className="cpm-box" role="alert">
          {load.forbidden ? (
            <><Lock size={16} aria-hidden style={{ flexShrink: 0, marginTop: 2 }} /> Só o dono e o gerente enviam promoções.</>
          ) : (
            <div>Não foi possível carregar as promoções.<div style={{ marginTop: 12 }}><button type="button" className="cpm-btn pri" onClick={() => { setLoad({ state: 'loading' }); void reload() }}>Tentar de novo</button></div></div>
          )}
        </div>
      )}

      {d && !draft && (
        <>
          <div className="cpm-grid">
            {d.templates.map((t) => (
              <article key={t.key} className="cpm-card">
                <div className="cpm-cap">{t.audienceName}</div>
                <h2>{t.label}</h2>
                <div className="cpm-bub"><b>{d.businessName}: {exemplo(t.title)}</b>{exemplo(t.body)}</div>
                <div className="cpm-foot">
                  {t.count === null
                    ? <span className="cpm-n zero">Você escolhe o serviço</span>
                    : <span className={`cpm-n${t.count === 0 ? ' zero' : ''}`}>{t.count === 0 ? 'Ninguém deste grupo no app agora' : <>Chega para <b>{t.count}</b></>}</span>}
                  <span className="cpm-sp" />
                  <button type="button" className="cpm-btn pri" disabled={cheia} onClick={() => start(t)}>Usar este</button>
                </div>
              </article>
            ))}
          </div>
          <button type="button" className="cpm-btn sec cpm-zero" disabled={cheia} onClick={() => start(null)}>Começar do zero</button>
          {cheia && <p className="cpm-note" style={{ marginTop: 8 }}>Já saíram {d.week.max} promoções nesta semana. Cancele uma agendada ou espere a segunda.</p>}

          <section className="cpm-hist" aria-label="Enviadas e agendadas">
            <div className="cpm-cap">Enviadas e agendadas</div>
            <div className="cpm-list">
              {d.items.length === 0 && <div className="cpm-empty"><Megaphone size={16} aria-hidden style={{ verticalAlign: -3, marginRight: 6 }} />Nenhuma promoção ainda.</div>}
              {d.items.map((p) => (
                <div key={p.id} className="cpm-li">
                  <div className="t">
                    <b>{exemplo(p.title)}</b>
                    <small>{p.audienceName} · {dataHora(p.sentAt ?? p.sendAt)}</small>
                  </div>
                  {p.status === 'SENT' && <span className="cpm-st sent">Enviada para {p.recipients ?? 0}</span>}
                  {(p.status === 'SCHEDULED' || p.status === 'SENDING') && <span className="cpm-st sched">{p.status === 'SENDING' ? 'Saindo' : 'Agendada'}</span>}
                  {p.status === 'CANCELED' && <span className="cpm-st">Cancelada</span>}
                  {p.status === 'SCHEDULED' && <button type="button" className="cpm-btn sec" onClick={() => cancelar(p)}>Cancelar</button>}
                </div>
              ))}
            </div>
            <p className="cpm-note">Contamos quantos receberam. O celular não informa quem leu.</p>
          </section>
        </>
      )}

      {d && draft && (
        <div className="cpm-form">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, minWidth: 0 }}>
            <section className="cpm-sec" aria-label="Para quem">
              <div className="cpm-cap">1 · Para quem</div>
              <div className="cpm-chips">
                {d.audiences.map((a) => (
                  <button key={a.key} type="button" className="cpm-chip" aria-pressed={draft.audience === a.key} onClick={() => set({ audience: a.key, ref: null })}>{a.label}</button>
                ))}
              </div>
              {needsRef(draft.audience) && (
                refOpts.length === 0
                  ? <p className="cpm-note">{draft.audience === 'SERVICE' ? 'Nenhum serviço ativo.' : 'Nenhum profissional ativo.'}</p>
                  : <div className="cpm-chips">
                      {refOpts.map((o) => (
                        <button key={o.id} type="button" className="cpm-chip" aria-pressed={draft.ref === o.id} onClick={() => set({ ref: o.id })}>{o.name}</button>
                      ))}
                    </div>
              )}
              {(!needsRef(draft.audience) || draft.ref) && (
                <div className={`cpm-ok${n === 0 ? ' zero' : ''}`} aria-live="polite">
                  {n === null ? 'Contando…' : n === 0 ? 'Ninguém deste grupo recebe aviso pelo app agora.' : <>Chega para <b>{n}</b> {n === 1 ? 'cliente' : 'clientes'} com o app e avisos ligados.</>}
                </div>
              )}
            </section>

            <section className="cpm-sec" aria-label="Mensagem">
              <div className="cpm-cap">2 · Mensagem</div>
              <label className="cpm-in">
                <span>{d.businessName}:</span>
                <input aria-label="Título" value={draft.title} placeholder="o fim do título" onChange={(e) => set({ title: e.target.value.replace(/[\r\n]/g, ' ') })} />
              </label>
              <textarea
                aria-label="Texto" className="cpm-ta" rows={3} value={draft.body} placeholder="O que você quer contar"
                onKeyDown={(e) => { if (e.key === 'Enter') e.preventDefault() }}
                onChange={(e) => set({ body: e.target.value.replace(/[\r\n]/g, ' ') })}
              />
              <div className="cpm-row">
                <button type="button" className="cpm-chip" onClick={() => set({ body: `${draft.body}${draft.body && !draft.body.endsWith(' ') ? ' ' : ''}{nome}` })}>+ nome</button>
                <span className={`cpm-count${len(draft.title) > TITLE_MAX ? ' over' : ''}`}>título {len(draft.title)}/{TITLE_MAX}</span>
                <span className={`cpm-count${len(draft.body) > BODY_MAX ? ' over' : ''}`} style={{ marginLeft: 8 }}>texto {len(draft.body)}/{BODY_MAX}</span>
              </div>
            </section>

            <section className="cpm-sec" aria-label="Quando">
              <div className="cpm-cap">3 · Quando</div>
              <div className="cpm-chips">
                <button type="button" className="cpm-chip" aria-pressed={draft.when === 'now'} onClick={() => set({ when: 'now' })}>Agora</button>
                <button type="button" className="cpm-chip" aria-pressed={draft.when === 'later'} onClick={() => set({ when: 'later' })}>Escolher dia e hora</button>
              </div>
              {draft.when === 'later' && (
                <input type="datetime-local" aria-label="Dia e hora" className="cpm-dt" value={draft.at} onChange={(e) => set({ at: e.target.value })} />
              )}
              <p className="cpm-note">Entre 23h30 e 6h nada sai: fica para as 6h. Quem desligou promoções no app não recebe.</p>
            </section>
          </div>

          <aside className="cpm-side" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div className="cpm-cap">Como chega</div>
            <div className="cpm-notif">
              <span className="ic" />
              <div><b>{d.businessName}: {exemplo(draft.title) || '…'}</b><p>{exemplo(draft.body) || '…'}</p></div>
            </div>
            <p className="cpm-note">Exemplo com uma cliente chamada Ana. O toque abre a sua página de agendar.</p>
            {formErr && <div className="cpm-err" role="alert">{formErr}</div>}
            <button type="button" className="cpm-btn send" onClick={enviar} disabled={busy || n === 0}>
              {busy ? 'Enviando…' : draft.when === 'later' ? 'Agendar promoção' : n ? `Enviar para ${n} ${n === 1 ? 'cliente' : 'clientes'}` : 'Enviar'}
            </button>
            <p className="cpm-note">{semana}</p>
          </aside>
        </div>
      )}

      {toast && <div className={`cpm-toast ${toast.kind}`} role="status" aria-live="polite">{toast.text}</div>}
    </div>
  )
}
