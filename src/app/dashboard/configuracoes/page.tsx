'use client'
// src/app/dashboard/configuracoes/page.tsx
//
// @eligi:cfg-hub-v2 — tela inicial de Configuracoes, direcao B "Cartoes" com o
// "o que falta" da C (nov/2026). Cada modulo diz para que serve e como esta
// agora; o resumo vem de GET /business-settings/overview (so o dono).
// Branco, ícones cinza, vermelho so no foco de teclado e em "Excluir conta".
// Layout por @media. Todo texto tem cor propria: o globals.css pinta
// `main span` de cinza (ver @eligi:doc-main-span).

import Link from 'next/link'
import { useEffect, useState } from 'react'
import LegalModal from '@/shared/legal/LegalModal'
import { useCanBuyPlan } from '@/shared/utils/useEligiApp' // @eligi:cfg-web-only-import
import { useCardStyle } from '@/hooks/useCardStyle'
import api from '@/shared/lib/apiClient'
import { typography } from '@/shared/theme'
import {
  Building2, Clock, CalendarDays, MessageSquare, Sparkles, Globe, Palette, Bell,
  FileText, Lock, UserX, ChevronRight, AlertTriangle, Check,
} from 'lucide-react'

type Tone = 'ok' | 'warn' | 'neutral'
type Summary = { summary: string; tone: Tone }
type ModuleKey = 'empresa' | 'horarios' | 'agendamento' | 'mensagens' | 'assinatura' | 'eligiclub' | 'notificacoes'
type ChecklistItem = { key: string; label: string; hint: string; done: boolean; href: string; webOnly?: boolean }
type Overview = { modules: Record<ModuleKey, Summary>; checklist: ChecklistItem[] }

type Card = {
  key: ModuleKey | 'aparencia'
  href: string
  icon: React.ElementType
  label: string
  what: string
  webOnly?: boolean
}
type Group = { title: string; sub: string; cards: Card[] }

const GROUPS: Group[] = [
  {
    title: 'Seu negócio', sub: 'O que o cliente vê de você',
    cards: [
      { key: 'empresa', href: '/dashboard/configuracoes/empresa', icon: Building2, label: 'Perfil e endereço', what: 'Nome, logo, capa, fotos, endereço, fuso e se aparece em "Perto de você".' },
      { key: 'horarios', href: '/dashboard/configuracoes/horarios', icon: Clock, label: 'Horário de funcionamento', what: 'Os dias e as horas em que a casa abre para agendamento.' },
    ],
  },
  {
    title: 'Agenda e link', sub: 'Como o cliente marca horário',
    cards: [
      { key: 'agendamento', href: '/dashboard/configuracoes/agendamento', icon: CalendarDays, label: 'Regras do agendamento', what: 'Antecedência, até quando remarcar, CPF e planos no link.' },
      { key: 'mensagens', href: '/dashboard/configuracoes/mensagens', icon: MessageSquare, label: 'Mensagem de confirmação', what: 'O texto que vai pelo WhatsApp quando você confirma o horário.' },
    ],
  },
  {
    title: 'Dinheiro', sub: 'O que você paga e o que recebe',
    cards: [
      { key: 'assinatura', href: '/dashboard/configuracoes/assinatura', icon: Sparkles, label: 'Sua assinatura Eligi', what: 'Seu plano, o valor do mês e a próxima cobrança.', webOnly: true },
      { key: 'eligiclub', href: '/dashboard/configuracoes/eligiclub', icon: Globe, label: 'Cobrança do EligiClub', what: 'A conta que recebe as mensalidades do clube no cartão.' },
    ],
  },
  {
    title: 'Seu jeito de usar', sub: 'Muda só a sua tela',
    cards: [
      { key: 'aparencia', href: '/dashboard/configuracoes/aparencia', icon: Palette, label: 'Aparência da agenda', what: 'Cards com cor cheia ou suave. Vale só neste aparelho.' },
      { key: 'notificacoes', href: '/dashboard/configuracoes/notificacoes', icon: Bell, label: 'Avisos', what: 'O que te avisa no sino e no celular.' },
    ],
  },
]

const SOON = 'Pagamentos no link · Permissões da equipe · Privacidade e dados'

const INK = '#111114'
const INK_2 = '#4b4b52'
const INK_3 = '#6b6b73'

const CSS = `
.cfg{ max-width:1080px; font-family:${typography.fontFamily}; color:${INK}; animation:cfg-in .25s ease; }
@keyframes cfg-in{ from{opacity:0; transform:translateY(6px)} to{opacity:1; transform:none} }
@keyframes cfg-pulse{ 0%,100%{opacity:.5} 50%{opacity:1} }
.cfg *{ box-sizing:border-box; }
.cfg :where(span, div, b, i, p, h1, h2){ color:inherit; } /* vence main span (ver @eligi:doc-main-span) */
.cfg a{ text-decoration:none; color:inherit; }
.cfg button{ font-family:inherit; cursor:pointer; -webkit-tap-highlight-color:transparent; }
.cfg a:focus-visible, .cfg button:focus-visible{ outline:2px solid #dc2626; outline-offset:2px; }
.cfg-d{ font-family:${typography.fontFamilyDisplay}; letter-spacing:-.03em; }
.cfg-m{ font-family:${typography.fontFamilyMono}; }
.cfg-h1{ margin:0; font-size:28px; font-weight:600; color:${INK}; }
.cfg-lead{ margin:6px 0 0; font-size:14px; line-height:1.45; color:${INK_3}; max-width:560px; }

.cfg-todo{ background:#fff; border:1px solid #ececf0; border-radius:18px; padding:18px; margin-top:22px; }
.cfg-todo-top{ display:flex; align-items:center; justify-content:space-between; gap:12px; }
.cfg-cap{ font-size:11px; letter-spacing:.06em; text-transform:uppercase; font-weight:500; color:${INK_3}; }
.cfg-count{ font-size:12px; color:${INK_2}; font-variant-numeric:tabular-nums; }
.cfg-todo-t{ font-size:21px; font-weight:600; margin:10px 0 4px; color:${INK}; }
.cfg-todo-s{ font-size:13.5px; line-height:1.45; color:${INK_3}; margin:0 0 12px; }
.cfg-track{ height:6px; border-radius:99px; background:#ececf0; overflow:hidden; }
.cfg-track > i{ display:block; height:100%; background:${INK}; border-radius:99px; }
.cfg-pend{ display:flex; flex-direction:column; gap:8px; margin-top:14px; }
.cfg-pend a{ display:flex; align-items:center; gap:12px; min-height:56px; padding:10px 12px; border-radius:14px; background:#fffbeb; border:1px solid rgba(180,83,9,.16); }
.cfg-pend .ic{ color:#b45309; flex-shrink:0; display:flex; }
.cfg-pend .tx{ flex:1; min-width:0; }
.cfg-pend .lb{ display:block; font-weight:600; font-size:14px; color:${INK}; }
.cfg-pend .hn{ display:block; font-size:12.5px; line-height:1.4; color:#7a4a0f; margin-top:2px; }
.cfg-pend .go{ font-size:13px; font-weight:600; color:${INK}; white-space:nowrap; display:flex; align-items:center; gap:2px; }
.cfg-done{ display:flex; align-items:center; gap:10px; margin-top:22px; padding:12px 14px; border-radius:14px; background:#ecfdf5; color:#0f6e56; font-size:14px; font-weight:600; }

.cfg-groups{ display:flex; flex-direction:column; gap:26px; margin-top:26px; }
.cfg-gt{ font-size:19px; font-weight:600; color:${INK}; }
.cfg-gs{ font-size:13px; color:${INK_3}; margin-top:2px; }
.cfg-grid{ display:grid; grid-template-columns:minmax(0,1fr); gap:10px; margin-top:10px; }
@media (min-width:720px){ .cfg-grid{ grid-template-columns:repeat(2,minmax(0,1fr)); } }
.cfg-card{ display:flex; flex-direction:column; gap:10px; min-height:148px; padding:16px; background:#fff; border:1px solid #ececf0; border-radius:18px; transition:border-color .15s ease, box-shadow .15s ease, transform .15s ease; }
@media (hover:hover){ .cfg-card:hover{ border-color:#d6d6dc; box-shadow:0 6px 18px rgba(17,17,20,.06); transform:translateY(-1px); } }
.cfg-card-top{ display:flex; align-items:center; justify-content:space-between; }
.cfg-tile{ width:38px; height:38px; border-radius:11px; background:#f2f2f5; color:#3c3c43; display:flex; align-items:center; justify-content:center; flex-shrink:0; }
.cfg-chev{ color:#b8b8c0; display:flex; }
.cfg-name{ font-weight:600; font-size:15.5px; color:${INK}; }
.cfg-what{ font-size:13px; line-height:1.4; color:${INK_3}; margin-top:3px; }
.cfg-state{ margin-top:auto; border-top:1px dashed #e6e6ea; padding-top:9px; display:flex; align-items:center; gap:7px; min-height:22px; }
.cfg-dot{ width:7px; height:7px; border-radius:50%; flex-shrink:0; background:#b8b8c0; }
.cfg-state .cfg-m{ font-size:11.5px; color:${INK_2}; line-height:1.35; }
.cfg-state.ok .cfg-dot{ background:#16a34a; } .cfg-state.ok .cfg-m{ color:#0f6e56; }
.cfg-state.warn .cfg-dot{ background:#d97706; } .cfg-state.warn .cfg-m{ color:#b45309; }
.cfg-skel{ display:inline-block; height:10px; width:60%; border-radius:6px; background:#ececf0; animation:cfg-pulse 1.2s ease-in-out infinite; }

.cfg-links{ display:flex; gap:8px; flex-wrap:wrap; margin-top:10px; }
.cfg-chip{ display:inline-flex; align-items:center; gap:7px; min-height:44px; padding:0 14px; border:1px solid #e3e3e8; border-radius:999px; background:#fff; font-size:14px; font-weight:500; color:${INK}; }
.cfg-chip.danger{ color:#a32d2d; }
.cfg-soon{ background:#fbfbfc; border:1px dashed #e3e3e8; border-radius:16px; padding:14px 16px; }
.cfg-soon p{ margin:6px 0 0; font-size:13px; color:${INK_3}; }
@media (prefers-reduced-motion:reduce){ .cfg, .cfg-skel{ animation:none; } .cfg-card{ transition:none; } }
`

// Busca pura: o setState fica no .then de quem chama (regra do React Compiler).
function fetchOverview(): Promise<Overview> {
  return api.get('/business-settings/overview').then((r) => r.data?.data ?? r.data)
}

type Load = { data: Overview | null; failed: boolean }

function StateLine({ s, loading }: { s?: Summary; loading: boolean }) {
  if (loading) return <div className="cfg-state"><span className="cfg-skel" aria-hidden /></div>
  if (!s) return <div className="cfg-state"><span className="cfg-dot" /><span className="cfg-m">Abrir para ver</span></div>
  return (
    <div className={`cfg-state ${s.tone === 'neutral' ? '' : s.tone}`}>
      <span className="cfg-dot" aria-hidden />
      <span className="cfg-m">{s.summary}</span>
    </div>
  )
}

export default function ConfiguracoesPage() {
  const canBuy = useCanBuyPlan() // @eligi:cfg-web-only-flag
  const cardStyle = useCardStyle()
  const [legal, setLegal] = useState<null | 'termos' | 'privacidade'>(null)
  const [load, setLoad] = useState<Load | null>(null)

  useEffect(() => {
    let vivo = true
    fetchOverview()
      .then((data) => { if (vivo) setLoad({ data, failed: false }) })
      .catch((e) => {
        console.error('[configuracoes] resumo', e)
        if (vivo) setLoad({ data: null, failed: true })
      })
    return () => { vivo = false }
  }, [])

  const loading = load === null
  const ov = load?.data ?? null
  const summaryOf = (key: Card['key']): Summary | undefined => {
    if (key === 'aparencia') return { summary: cardStyle === 'clean' ? 'Clean · cores suaves' : 'Clássico · cores cheias', tone: 'neutral' }
    return ov?.modules[key]
  }

  const items = (ov?.checklist ?? []).filter((c) => !c.webOnly || canBuy)
  const pend = items.filter((c) => !c.done)
  const done = items.length - pend.length

  return (
    <>
      <style>{CSS}</style>
      <div className="cfg">
        <h1 className="cfg-h1 cfg-d">Configurações</h1>
        <p className="cfg-lead">Separado pelo que muda: o que o cliente vê, como ele marca, o seu dinheiro e a sua tela. Cada cartão mostra como está agora.</p>

        {/* @eligi:cfg-hub-todo — "o que falta" (direcao C) */}
        {ov && items.length > 0 && (pend.length > 0 ? (
          <section className="cfg-todo" aria-label="O que falta configurar">
            <div className="cfg-todo-top">
              <span className="cfg-cap cfg-m">Seu negócio no Eligi</span>
              <span className="cfg-count cfg-m">{done}/{items.length}</span>
            </div>
            <div className="cfg-todo-t cfg-d">{pend.length === 1 ? 'Falta 1 coisa' : `Faltam ${pend.length} coisas`}</div>
            <p className="cfg-todo-s">Resolva para o cliente encontrar você e marcar sem travar.</p>
            <div className="cfg-track" role="progressbar" aria-valuemin={0} aria-valuemax={items.length} aria-valuenow={done}>
              <i style={{ width: `${Math.round((done / items.length) * 100)}%` }} />
            </div>
            <div className="cfg-pend">
              {pend.map((c) => (
                <Link key={c.key} href={c.href}>
                  <span className="ic"><AlertTriangle size={18} strokeWidth={1.9} /></span>
                  <span className="tx"><span className="lb">{c.label}</span><span className="hn">{c.hint}</span></span>
                  <span className="go">Resolver <ChevronRight size={15} /></span>
                </Link>
              ))}
            </div>
          </section>
        ) : (
          <div className="cfg-done"><Check size={18} strokeWidth={2.2} /> Tudo pronto: o essencial está configurado.</div>
        ))}

        <div className="cfg-groups">
          {GROUPS.map((g) => {
            const cards = g.cards.filter((c) => !c.webOnly || canBuy)
            if (cards.length === 0) return null
            return (
              <section key={g.title} aria-label={g.title}>
                <div className="cfg-gt cfg-d">{g.title}</div>
                <div className="cfg-gs">{g.sub}</div>
                <div className="cfg-grid">
                  {cards.map(({ key, href, icon: Icon, label, what }) => (
                    <Link key={key} href={href} className="cfg-card">
                      <div className="cfg-card-top">
                        <span className="cfg-tile"><Icon size={19} strokeWidth={1.8} /></span>
                        <span className="cfg-chev"><ChevronRight size={17} /></span>
                      </div>
                      <div>
                        <div className="cfg-name">{label}</div>
                        <div className="cfg-what">{what}</div>
                      </div>
                      <StateLine s={summaryOf(key)} loading={loading && key !== 'aparencia'} />
                    </Link>
                  ))}
                </div>
              </section>
            )
          })}

          <section aria-label="Conta e documentos">
            <div className="cfg-cap cfg-m">Conta e documentos</div>
            <div className="cfg-links">
              <button type="button" className="cfg-chip" onClick={() => setLegal('termos')}><FileText size={16} /> Termos de uso</button>
              <button type="button" className="cfg-chip" onClick={() => setLegal('privacidade')}><Lock size={16} /> Política de privacidade</button>
              <Link href="/dashboard/conta/excluir" className="cfg-chip danger"><UserX size={16} /> Excluir conta</Link>
            </div>
          </section>

          <div className="cfg-soon">
            <div className="cfg-cap cfg-m">Em breve</div>
            <p>{SOON}</p>
          </div>
        </div>
      </div>
      {legal && <LegalModal kind={legal} onClose={() => setLegal(null)} />}
    </>
  )
}
