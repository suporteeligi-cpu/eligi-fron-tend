'use client'
// src/features/client-notices/Composer.tsx
// @eligi:cnot-composer — formulario de promocao e de aviso (nov/2026).
// Promocao: escolhe o grupo de clientes (como antes). Aviso: vai para todos e pode
// ficar fixado no link e no app ate um dia (faixa). Vermelho so no Enviar.
// Quem recebe vem do back: /audience (promocao) e /reach (aviso, com a quebra).

import { useEffect, useState } from 'react'
import api from '@/shared/lib/apiClient'
import ReachSummary from './ReachSummary'
import {
  BODY_MAX, PIN_MAX_DAYS, TITLE_MAX, addDays, dataHora, diaMes, exemplo, len, needsRef, pinProblem, semNome, sendDay,
} from './rules'
import type { Audience, Data, Kind, Promo, Reach } from './types'

export type Draft = {
  kind: Kind
  audience: Audience
  ref: string | null
  title: string
  body: string
  when: 'now' | 'later'
  at: string
  templateKey: string | null
  pin: boolean
  pinUntil: string
  /** dia local de quando o formulario abriu ("YYYY-MM-DD"); base do "agora" */
  today: string
}

export const errMsg = (e: unknown, padrao: string) => {
  const r = (e as { response?: { status?: number; data?: { error?: string } } })?.response
  if (r?.status === 403) return 'Só o dono e o gerente enviam promoções e avisos.'
  return r?.data?.error ?? padrao
}

type Props = {
  d: Data
  draft: Draft
  setDraft: (fn: (x: Draft | null) => Draft | null) => void
  onSent: (text: string) => void
  onOpenReach: () => void
}

export default function Composer({ d, draft, setDraft, onSent, onOpenReach }: Props) {
  const [count, setCount] = useState<{ key: string; n: number } | null>(null)
  const [reach, setReach] = useState<Reach | null>(null)
  const [busy, setBusy] = useState(false)
  const [formErr, setFormErr] = useState<string | null>(null)

  const aviso = draft.kind === 'AVISO'
  const aud = draft.audience
  const ref = draft.ref
  const countKey = `${draft.kind}|${aud}|${ref ?? ''}`

  // Promocao: quantos recebem o grupo escolhido.
  useEffect(() => {
    if (aviso || (needsRef(aud) && !ref)) return
    let vivo = true
    const t = window.setTimeout(() => {
      api.get('/client-promotions/audience', { params: { audience: aud, kind: 'PROMO', ...(ref ? { ref } : {}) } })
        .then((r) => { if (vivo) setCount({ key: `PROMO|${aud}|${ref ?? ''}`, n: (r.data as { count: number }).count }) })
        .catch((e) => console.error('[promocoes] contar', e))
    }, 250)
    return () => { vivo = false; window.clearTimeout(t) }
  }, [aviso, aud, ref])

  // Aviso: vai para todos; o alcance traz a quebra de quem nao recebe.
  useEffect(() => {
    if (!aviso) return
    let vivo = true
    api.get('/client-promotions/reach', { params: { kind: 'AVISO' } })
      .then((r) => { if (vivo) setReach(r.data as Reach) })
      .catch((e) => console.error('[avisos] alcance', e))
    return () => { vivo = false }
  }, [aviso])

  const n = aviso ? (reach ? reach.recebem : null) : count && count.key === countKey ? count.n : null
  const envio = sendDay(draft.when, draft.at, draft.today)
  const pinMax = addDays(envio, PIN_MAX_DAYS)

  const set = (patch: Partial<Draft>) => { setFormErr(null); setDraft((x) => (x ? { ...x, ...patch } : x)) }

  const invalido = (x: Draft): string | null => {
    if (needsRef(x.audience) && !x.ref) return x.audience === 'SERVICE' ? 'Escolha o serviço.' : 'Escolha o profissional.'
    if (!x.title.trim()) return 'Escreva o título.'
    if (!x.body.trim()) return 'Escreva o texto.'
    if (len(x.title) > TITLE_MAX) return `O título pode ter até ${TITLE_MAX} letras.`
    if (len(x.body) > BODY_MAX) return `O texto pode ter até ${BODY_MAX} letras.`
    if (x.when === 'later' && !x.at) return 'Escolha o dia e a hora.'
    if (x.kind === 'AVISO' && x.pin) return pinProblem(x.pinUntil, envio)
    return null
  }

  const enviar = () => {
    if (busy) return
    const e = invalido(draft)
    if (e) { setFormErr(e); return }
    setBusy(true)
    api.post('/client-promotions', {
      kind: draft.kind,
      audience: aviso ? 'ALL' : draft.audience,
      ref: aviso ? null : draft.ref,
      title: draft.title,
      body: draft.body,
      sendAt: draft.when === 'later' ? new Date(draft.at).toISOString() : null,
      templateKey: draft.templateKey,
      pinUntil: aviso && draft.pin ? draft.pinUntil : null,
    })
      .then((r) => {
        const p = r.data as Promo & { expected: number }
        const nome = aviso ? 'Aviso' : 'Promoção'
        const quem = `${p.expected} ${p.expected === 1 ? 'cliente' : 'clientes'}`
        const faixa = aviso && draft.pin ? ` · faixa no link até ${diaMes(draft.pinUntil)}` : ''
        onSent(draft.when === 'later'
          ? `${nome} agendad${aviso ? 'o' : 'a'} para ${dataHora(p.sendAt)}${faixa}`
          : p.expected > 0 ? `Saindo para ${quem}${faixa}` : `Faixa no link até ${diaMes(draft.pinUntil)}`)
      })
      .catch((err) => { console.error('[promocoes] enviar', err); setFormErr(errMsg(err, 'Não foi possível enviar. Tente de novo.')) })
      .finally(() => setBusy(false))
  }

  const refOpts = draft.audience === 'SERVICE' ? d.services : draft.audience === 'PROFESSIONAL' ? d.professionals : []
  const semDestino = n === 0 && !(aviso && draft.pin)
  const botao = busy
    ? 'Enviando…'
    : draft.when === 'later'
      ? aviso ? 'Agendar aviso' : 'Agendar promoção'
      : n
        ? `Enviar para ${n} ${n === 1 ? 'cliente' : 'clientes'}`
        : aviso && draft.pin ? 'Publicar a faixa no link' : 'Enviar'

  return (
    <div className="cpm-form">
      <div className="cpm-col">
        {aviso ? (
          <section className="cpm-sec" aria-label="Para quem">
            <div className="cpm-cap">1 · Para quem</div>
            <p className="cpm-note" style={{ fontSize: 13.5, color: '#4b4b52' }}>
              Aviso vai para todos os clientes com o app. Chega também para quem desligou só as promoções.
            </p>
            <ReachSummary reach={reach} onOpenList={onOpenReach} />
          </section>
        ) : (
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
        )}

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
          <p className="cpm-note">
            Entre 23h30 e 6h nada sai: fica para as 6h. Quem desligou {aviso ? 'os avisos deste lugar' : 'promoções'} no app não recebe.
          </p>
        </section>

        {aviso && (
          <section className="cpm-sec" aria-label="Faixa no link">
            <div className="cpm-pin">
              <div className="txt">
                <b>Fixar no link e no app</b>
                <small>
                  {draft.pin
                    ? `Quem abre seu link para marcar também vê. Some no fim do dia ${diaMes(draft.pinUntil)}.`
                    : 'Desligado: o aviso só chega no celular.'}
                </small>
              </div>
              <button
                type="button" role="switch" aria-checked={draft.pin} aria-label="Fixar no link e no app" className="cpm-sw"
                onClick={() => set({ pin: !draft.pin, pinUntil: draft.pinUntil || addDays(envio, 1) })}
              />
            </div>
            {draft.pin && (
              <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <span className="cpm-cap">Fica até</span>
                <input
                  type="date" className="cpm-dt" value={draft.pinUntil} min={envio} max={pinMax}
                  onChange={(e) => set({ pinUntil: e.target.value })}
                />
                <span className="cpm-note">No máximo {PIN_MAX_DAYS} dias depois do envio. Uma faixa por vez: a mais nova substitui a anterior.</span>
              </label>
            )}
          </section>
        )}
      </div>

      <aside className="cpm-side" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div className="cpm-cap">No celular do cliente</div>
        <div className="cpm-notif">
          <span className="ic" />
          <div><b>{d.businessName}: {exemplo(draft.title) || '…'}</b><p>{exemplo(draft.body) || '…'}</p></div>
        </div>
        <p className="cpm-note">Exemplo com uma cliente chamada Ana. O toque abre a sua página de agendar.</p>
        {aviso && draft.pin && (
          <>
            <div className="cpm-cap" style={{ marginTop: 4 }}>No seu link</div>
            <div className="cpm-banner">
              <span className="bar" />
              <div><b>{semNome(draft.title, true) || '…'}</b>{semNome(draft.body) || '…'}</div>
            </div>
          </>
        )}
        {formErr && <div className="cpm-err" role="alert">{formErr}</div>}
        <button type="button" className="cpm-btn send" onClick={enviar} disabled={busy || semDestino}>{botao}</button>
      </aside>
    </div>
  )
}
