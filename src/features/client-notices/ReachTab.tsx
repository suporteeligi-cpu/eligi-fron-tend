'use client'
// src/features/client-notices/ReachTab.tsx
// @eligi:cnot-reach-tab — aba Alcance (nov/2026, decisao do Eli "1 A"):
// quem recebe, quem esta no app sem receber e quem esta fora. Quem nao tem o app
// nao recebe nada automatico: o convite e pelo WhatsApp, um a um, com a mensagem pronta.

import { useEffect, useState } from 'react'
import { MessageCircle } from 'lucide-react'
import api from '@/shared/lib/apiClient'
import { waLink } from '@/shared/utils/whatsapp'
import ReachSummary from './ReachSummary'
import { haQuanto, inviteMessage } from './rules'
import { REACH_COLOR } from './styles'
import type { Kind, OutPage, OutPerson, Reach } from './types'

type Out = { key: string; items: OutPerson[]; total: number; next: number | null; at: number; inviteUrl: string; businessName: string }

export default function ReachTab() {
  const [kind, setKind] = useState<Kind>('AVISO')
  const [reach, setReach] = useState<{ kind: Kind; r: Reach } | null>(null)
  const [reachErr, setReachErr] = useState(false)
  const [q, setQ] = useState('')
  const [out, setOut] = useState<Out | null>(null)
  const [outErr, setOutErr] = useState(false)
  const [more, setMore] = useState(false)
  const [invited, setInvited] = useState<Set<string>>(() => new Set())

  useEffect(() => {
    let vivo = true
    api.get('/client-promotions/reach', { params: { kind } })
      .then((r) => { if (vivo) { setReach({ kind, r: r.data as Reach }); setReachErr(false) } })
      .catch((e) => { console.error('[alcance] numeros', e); if (vivo) setReachErr(true) })
    return () => { vivo = false }
  }, [kind])

  const busca = q.trim()
  useEffect(() => {
    let vivo = true
    const t = window.setTimeout(() => {
      api.get('/client-promotions/reach/out', { params: busca ? { q: busca } : {} })
        .then((r) => {
          const p = r.data as OutPage
          if (vivo) {
            setOut({ key: busca, items: p.items, total: p.total, next: p.nextCursor, at: Date.now(), inviteUrl: p.inviteUrl, businessName: p.businessName })
            setOutErr(false)
          }
        })
        .catch((e) => { console.error('[alcance] fora do app', e); if (vivo) setOutErr(true) })
    }, busca ? 300 : 0)
    return () => { vivo = false; window.clearTimeout(t) }
  }, [busca])

  const carregarMais = () => {
    if (!out || out.next === null || more) return
    setMore(true)
    api.get('/client-promotions/reach/out', { params: { cursor: out.next, ...(out.key ? { q: out.key } : {}) } })
      .then((r) => {
        const p = r.data as OutPage
        setOut((x) => (x && x.key === out.key ? { ...x, items: [...x.items, ...p.items], next: p.nextCursor, total: p.total } : x))
      })
      .catch((e) => console.error('[alcance] carregar mais', e))
      .finally(() => setMore(false))
  }

  const r = reach && reach.kind === kind ? reach.r : null
  const lista = out && out.key === busca ? out : null
  const agora = new Date(lista?.at ?? 0)

  return (
    <div className="cpm-al">
      <div className="cpm-chips" role="group" aria-label="Contar para">
        <button type="button" className="cpm-chip" aria-pressed={kind === 'AVISO'} onClick={() => setKind('AVISO')}>Avisos</button>
        <button type="button" className="cpm-chip" aria-pressed={kind === 'PROMO'} onClick={() => setKind('PROMO')}>Promoções</button>
      </div>

      <section className="cpm-sec" aria-label="Quem recebe">
        {reachErr ? (
          <p className="cpm-note">Não foi possível contar agora. Tente abrir a aba de novo.</p>
        ) : (
          <>
            <ReachSummary reach={r} />
            {r && (
              <div>
                <div className="cpm-group">
                  <span className="dot" style={{ background: REACH_COLOR.recebem }} />
                  <div className="g"><b>Recebem no celular</b><small>Têm o app Eligi Cliente com {kind === 'AVISO' ? 'os avisos' : 'as promoções'} ligados.</small></div>
                  <span className="num">{r.recebem}</span>
                </div>
                <div className="cpm-group">
                  <span className="dot" style={{ background: REACH_COLOR.semReceber }} />
                  <div className="g">
                    <b>No app, sem receber</b>
                    <small>
                      {r.desligaram} desligaram tudo deste lugar · {r.semCelular} usam só pelo navegador
                      {r.desligouTipo > 0 ? ` · ${r.desligouTipo} desligaram ${kind === 'AVISO' ? 'os avisos' : 'as promoções'}` : ''}.
                      {' '}Quem desligou não é convidado de novo.
                    </small>
                  </div>
                  <span className="num">{r.noAppSemReceber}</span>
                </div>
                <div className="cpm-group">
                  <span className="dot" style={{ background: REACH_COLOR.fora }} />
                  <div className="g"><b>Fora do app</b><small>Nunca entraram no app. Não recebem nada: convide pelo WhatsApp.</small></div>
                  <span className="num">{r.foraDoApp}</span>
                </div>
              </div>
            )}
          </>
        )}
      </section>

      <section className="cpm-sec" aria-label="Convidar quem está fora do app">
        <div className="cpm-cap">Fora do app{lista ? ` · ${lista.total}` : ''}</div>
        <p className="cpm-note" style={{ fontSize: 13.5 }}>
          A mensagem vai pronta, com o link do seu perfil. Ela abre no seu WhatsApp e você envia.
        </p>
        <input
          type="search" className="cpm-search" placeholder="Buscar cliente" aria-label="Buscar cliente"
          value={q} onChange={(e) => setQ(e.target.value)}
        />
        {outErr && <p className="cpm-note">Não foi possível carregar a lista. Tente de novo.</p>}
        {!lista && !outErr && <div className="cpm-skel" style={{ height: 160, marginTop: 4 }} aria-busy="true" />}
        {lista && lista.items.length === 0 && (
          <p className="cpm-note">{busca ? 'Ninguém com esse nome fora do app.' : 'Todos os seus clientes já estão no app.'}</p>
        )}
        {lista && lista.items.length > 0 && (
          <div>
            {lista.items.map((p) => {
              const foi = invited.has(p.id)
              return (
                <div key={p.id} className="cpm-person">
                  <div className="p">
                    <b>{p.name}</b>
                    <small>{haQuanto(p.lastVisitAt, agora)}{p.visits > 0 ? ` · ${p.visits} ${p.visits === 1 ? 'visita' : 'visitas'}` : ''}</small>
                  </div>
                  {p.phone ? (
                    <a
                      className={`cpm-inv${foi ? ' done' : ''}`}
                      href={waLink(p.phone, inviteMessage(p.name, lista.businessName, lista.inviteUrl))}
                      target="_blank" rel="noopener noreferrer"
                      onClick={() => setInvited((s) => new Set(s).add(p.id))}
                    >
                      <MessageCircle size={16} aria-hidden /> {foi ? 'Convidado' : 'Convidar'}
                    </a>
                  ) : (
                    <span className="cpm-inv none">Sem telefone</span>
                  )}
                </div>
              )
            })}
          </div>
        )}
        {lista && lista.next !== null && (
          <button type="button" className="cpm-btn sec" onClick={carregarMais} disabled={more}>{more ? 'Carregando…' : 'Carregar mais'}</button>
        )}
      </section>
    </div>
  )
}
