'use client'
// src/app/dashboard/promocoes/page.tsx
// @eligi:cpromo-page @eligi:cnot-page — Promocoes e avisos para os clientes do app,
// direcao A "Tres abas" (decisao do Eli, 25/11/2026): Promocao · Aviso · Alcance.
// Promocao: ate 2 por semana, por grupo de clientes (como a fatia 8C).
// Aviso: ate 3 por semana, contados a parte, vai para todos e pode ficar fixado
// no link e no app ate um dia. Alcance: quem recebe e o convite pelo WhatsApp.
// Os numeros e as regras ficam no back; a tela so mostra. Dono e gerente (403 aos outros).

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { ChevronLeft, ChevronRight, Lock } from 'lucide-react'
import api from '@/shared/lib/apiClient'
import Composer, { errMsg, type Draft } from '@/features/client-notices/Composer'
import History from '@/features/client-notices/History'
import ReachTab from '@/features/client-notices/ReachTab'
import { addDays, exemplo, weekOf, ymd } from '@/features/client-notices/rules'
import { CSS } from '@/features/client-notices/styles'
import type { Data, Kind, Promo, Template } from '@/features/client-notices/types'

type Tab = 'PROMO' | 'AVISO' | 'ALCANCE'
type Load = { state: 'loading' } | { state: 'error'; forbidden: boolean } | { state: 'ok'; d: Data }

function fetchData(): Promise<Data> {
  return api.get('/client-promotions').then((r) => r.data as Data)
}

const TABS: { key: Tab; label: string }[] = [
  { key: 'PROMO', label: 'Promoção' },
  { key: 'AVISO', label: 'Aviso' },
  { key: 'ALCANCE', label: 'Alcance' },
]

export default function PromocoesPage() {
  const [load, setLoad] = useState<Load>({ state: 'loading' })
  const [tab, setTab] = useState<Tab>('PROMO')
  const [draft, setDraft] = useState<Draft | null>(null)
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
    const t = window.setTimeout(() => setToast(null), 3200)
    return () => window.clearTimeout(t)
  }, [toast])

  const d = load.state === 'ok' ? load.d : null
  const kind: Kind = tab === 'AVISO' ? 'AVISO' : 'PROMO'
  const week = d ? weekOf(d, kind) : null
  const cheia = !!week && week.used >= week.max
  const templates: Template[] = d ? (kind === 'AVISO' ? d.avisoTemplates ?? [] : d.templates) : []

  const trocarAba = (t: Tab) => { setDraft(null); setTab(t) }

  const start = (k: Kind, t: Template | null) => {
    const today = ymd(new Date())
    setDraft({
      kind: k,
      audience: t && k === 'PROMO' ? t.audience : 'ALL',
      ref: null,
      title: t?.title ?? '',
      body: t?.body ?? '',
      when: 'now',
      at: '',
      templateKey: t?.key ?? null,
      pin: k === 'AVISO',
      pinUntil: k === 'AVISO' ? addDays(today, 1) : '',
      today,
    })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const cancelar = (p: Promo) => {
    api.post(`/client-promotions/${p.id}/cancel`)
      .then(() => { setToast({ kind: 'ok', text: p.kind === 'AVISO' ? 'Aviso cancelado. A vaga da semana voltou.' : 'Promoção cancelada. A vaga da semana voltou.' }); void reload() })
      .catch((e) => { console.error('[promocoes] cancelar', e); setToast({ kind: 'err', text: errMsg(e, 'Não foi possível cancelar.') }) })
  }

  const tirarFaixa = (p: Promo) => {
    api.post(`/client-promotions/${p.id}/unpin`)
      .then(() => { setToast({ kind: 'ok', text: 'Faixa tirada do link.' }); void reload() })
      .catch((e) => { console.error('[avisos] tirar faixa', e); setToast({ kind: 'err', text: errMsg(e, 'Não foi possível tirar a faixa.') }) })
  }

  const nome = kind === 'AVISO' ? 'avisos' : 'promoções'
  const semana = week ? (cheia ? 'Semana cheia · abre na segunda' : `${week.used} de ${week.max} ${nome} desta semana`) : ''
  const titulo = draft
    ? draft.kind === 'AVISO' ? 'Novo aviso' : 'Nova promoção'
    : 'Promoções e avisos'

  return (
    <div className="cpm">
      <style>{CSS}</style>

      {draft ? (
        <button type="button" className="cpm-auto" onClick={() => setDraft(null)}>
          <ChevronLeft size={18} aria-hidden /> Modelos
        </button>
      ) : (
        <span className="cpm-eyebrow">Clientes do app</span>
      )}
      <div className="cpm-top">
        <h1 className="cpm-h1">{titulo}</h1>
        {d && tab !== 'ALCANCE' && <span className={`cpm-week${week && week.used > 0 ? ' used' : ''}`}>{semana}</span>}
      </div>

      {!draft && (
        <div className="cpm-tabs" role="tablist" aria-label="Promoções e avisos">
          {TABS.map((t) => (
            <button key={t.key} type="button" role="tab" className="cpm-tab" aria-selected={tab === t.key} onClick={() => trocarAba(t.key)}>
              {t.label}
            </button>
          ))}
        </div>
      )}

      {load.state === 'loading' && <div aria-busy="true" aria-label="Carregando">{[0, 1].map((i) => <div key={i} className="cpm-skel" />)}</div>}

      {load.state === 'error' && (
        <div className="cpm-box" role="alert">
          {load.forbidden ? (
            <><Lock size={16} aria-hidden style={{ flexShrink: 0, marginTop: 2 }} /> Só o dono e o gerente enviam promoções e avisos.</>
          ) : (
            <div>Não foi possível carregar.<div style={{ marginTop: 12 }}><button type="button" className="cpm-btn pri" onClick={() => { setLoad({ state: 'loading' }); void reload() }}>Tentar de novo</button></div></div>
          )}
        </div>
      )}

      {d && tab === 'ALCANCE' && !draft && <ReachTab />}

      {d && tab !== 'ALCANCE' && !draft && (
        <>
          <p className="cpm-lead">
            {kind === 'AVISO'
              ? 'Recado da casa no celular de quem tem o app Eligi Cliente: feriado, horário, férias. Pode ficar fixado no seu link até o dia que você escolher.'
              : 'Uma oferta no celular de quem tem o app Eligi Cliente. Escolha um começo: o público e o texto já vêm prontos, você ajusta antes de enviar.'}
          </p>
          <Link href="/dashboard/configuracoes/avisos-app" className="cpm-auto">Textos dos avisos automáticos <ChevronRight size={15} aria-hidden /></Link>

          <div className="cpm-grid">
            {templates.map((t) => (
              <article key={t.key} className="cpm-card">
                <div className="cpm-cap">{kind === 'AVISO' ? 'Todos os clientes' : t.audienceName}</div>
                <h2>{t.label}</h2>
                <div className="cpm-bub"><b>{d.businessName}: {exemplo(t.title)}</b>{exemplo(t.body)}</div>
                <div className="cpm-foot">
                  {t.count === null
                    ? <span className="cpm-n zero">Você escolhe o serviço</span>
                    : <span className={`cpm-n${t.count === 0 ? ' zero' : ''}`}>{t.count === 0 ? 'Ninguém no app recebe agora' : <>Chega para <b>{t.count}</b></>}</span>}
                  <span className="cpm-sp" />
                  <button type="button" className="cpm-btn pri" disabled={cheia} onClick={() => start(kind, t)}>Usar este</button>
                </div>
              </article>
            ))}
          </div>
          <button type="button" className="cpm-btn sec cpm-zero" disabled={cheia} onClick={() => start(kind, null)}>Começar do zero</button>
          {cheia && week && (
            <p className="cpm-note" style={{ marginTop: 8 }}>
              Já saíram {week.max} {nome} nesta semana. Cancele {kind === 'AVISO' ? 'um agendado' : 'uma agendada'} ou espere a segunda.
            </p>
          )}

          <History kind={kind} items={d.items} pinnedId={d.pinned?.id ?? null} onCancel={cancelar} onUnpin={tirarFaixa} />
        </>
      )}

      {d && draft && (
        <Composer
          d={d}
          draft={draft}
          setDraft={setDraft}
          onSent={(text) => { setToast({ kind: 'ok', text }); setDraft(null); void reload() }}
          onOpenReach={() => { setDraft(null); setTab('ALCANCE') }}
        />
      )}

      {toast && <div className={`cpm-toast ${toast.kind}`} role="status" aria-live="polite">{toast.text}</div>}
    </div>
  )
}
