'use client'
// src/app/dashboard/configuracoes/notificacoes/page.tsx
// @eligi:cfg-avisos-v2 — Avisos, direcao B (ver @eligi:doc-cfg-avisos).
// Cada aviso diz quando chega e quem recebe. Vale para o negocio inteiro, no
// sino e no celular, e so dono e gerente mudam (o back recusa os outros com 403;
// `canEdit` vem do GET). Cobranca e notas fiscais ficam sempre ligadas.
// "Nao veio" saiu da lista: o evento ainda nao e disparado por nenhuma tela.
// Salva a cada toque, com a lista inteira; erro volta a chave e avisa.

import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import {
  ChevronLeft, BellRing, Sunrise, CalendarPlus, CalendarClock, CalendarX2,
  UserPlus, Cake, Package, CreditCard, ReceiptText, Lock,
} from 'lucide-react'
import api from '@/shared/lib/apiClient'
import EligiClubIcon from '@/app/components/navigation/EligiClubIcon' // @eligi:cfg-avisos-club-icon
import { typography } from '@/shared/theme'

type CatKey =
  | 'DAILY_SUMMARY' | 'BOOKING_ONLINE' | 'RESCHEDULE' | 'CANCELLATION'
  | 'NEW_CLIENT' | 'BIRTHDAY' | 'STOCK_LOW' | 'BILLING' | 'FISCAL' | 'CLUB' // @eligi:cfg-avisos-club-key

type Cat = { key: CatKey; label: string; when: string; who: string; icon: React.ElementType }
type Group = { title: string; cats: Cat[] }

const DONO = 'Dono'
const DONO_PROF = 'Dono e o profissional do horário'

const GROUPS: Group[] = [
  { title: 'Agenda', cats: [
    { key: 'DAILY_SUMMARY',  label: 'Resumo do dia',     icon: Sunrise,       who: DONO,      when: 'Às 8h, quantos clientes você tem no dia.' },
    { key: 'BOOKING_ONLINE', label: 'Agendou pelo link', icon: CalendarPlus,  who: DONO_PROF, when: 'O cliente marcou sozinho pelo seu link.' },
    { key: 'RESCHEDULE',     label: 'Remarcou',          icon: CalendarClock, who: DONO_PROF, when: 'O cliente mudou o horário pelo link.' },
    { key: 'CANCELLATION',   label: 'Cancelou',          icon: CalendarX2,    who: DONO_PROF, when: 'O cliente cancelou pelo link.' },
  ] },
  { title: 'Clientes', cats: [
    { key: 'NEW_CLIENT', label: 'Cliente novo',  icon: UserPlus, who: DONO, when: 'Alguém se cadastrou pelo seu link.' },
    { key: 'BIRTHDAY',   label: 'Aniversários',  icon: Cake,     who: DONO, when: 'Os da semana e os do dia, às 9h.' },
  ] },
  // @eligi:cfg-avisos-club-grupo — o aviso no celular do cliente e outra coisa (o cliente desliga no app)
  { title: 'EligiClub', cats: [
    { key: 'CLUB', label: 'EligiClub', icon: EligiClubIcon, who: DONO, when: 'Vence hoje e atrasados às 9h, pagou e cartão recusado na hora.' },
  ] },
  { title: 'Estoque', cats: [
    { key: 'STOCK_LOW', label: 'Estoque baixo', icon: Package, who: DONO, when: 'Um produto chegou no mínimo ou acabou.' },
  ] },
]

const ALWAYS: Cat[] = [
  { key: 'BILLING', label: 'Assinatura e cobrança', icon: CreditCard,  who: DONO, when: 'Mensalidade perto de vencer ou vencida.' },
  { key: 'FISCAL',  label: 'Notas fiscais',         icon: ReceiptText, who: DONO, when: 'Certificado vencendo ou nota recusada.' },
]

const EDITABLE: CatKey[] = GROUPS.flatMap(g => g.cats.map(c => c.key))

type Settings = { muted: CatKey[]; popup: boolean; canEdit: boolean }
type Load = { state: 'loading' } | { state: 'error' } | { state: 'ok'; s: Settings }

// Busca pura: o setState fica no .then de quem chama (regra do React Compiler).
function fetchSettings(): Promise<Settings> {
  return api.get('/notifications/settings').then((r) => {
    const d = r.data ?? {}
    const muted = (Array.isArray(d.mutedCategories) ? d.mutedCategories : [])
      .filter((c: string): c is CatKey => (EDITABLE as string[]).includes(c))
    // back antigo nao manda canEdit: ele aceitava todos, entao vale true
    return { muted, popup: d.popupEnabled !== false, canEdit: d.canEdit !== false }
  })
}

/** Avisa a navbar (balao na tela) sem precisar recarregar. */
function announcePopup(on: boolean) {
  window.dispatchEvent(new CustomEvent('eligi:notif-popup', { detail: { popupEnabled: on } }))
}

const INK = '#111114'
const INK_2 = '#4b4b52'
const INK_3 = '#6b6b73'

const CSS = `
.cfn{ max-width:720px; font-family:${typography.fontFamily}; color:${INK}; animation:cfn-in .25s ease; }
@keyframes cfn-in{ from{opacity:0; transform:translateY(6px)} to{opacity:1; transform:none} }
@keyframes cfn-pulse{ 0%,100%{opacity:.5} 50%{opacity:1} }
.cfn *{ box-sizing:border-box; }
.cfn :where(span, div, b, i, p, h1, h2, strong, small){ color:inherit; } /* vence main span */
.cfn a{ text-decoration:none; color:inherit; }
.cfn button{ font-family:inherit; cursor:pointer; -webkit-tap-highlight-color:transparent; }
.cfn a:focus-visible, .cfn button:focus-visible{ outline:2px solid #dc2626; outline-offset:2px; }
.cfn-back{ display:inline-flex; align-items:center; gap:4px; min-height:44px; padding:0 10px 0 4px; margin-left:-4px; border-radius:12px; font-size:14px; font-weight:500; color:${INK_2}; }
.cfn-h1{ margin:4px 0 0; font-size:28px; font-weight:600; font-family:${typography.fontFamilyDisplay}; letter-spacing:-.03em; }
.cfn-lead{ margin:6px 0 0; font-size:14px; line-height:1.45; color:${INK_3}; max-width:560px; }
.cfn-ro{ margin-top:16px; display:flex; gap:10px; align-items:flex-start; padding:12px 14px; border-radius:14px; background:#f7f7f9; font-size:13px; line-height:1.5; color:${INK_2}; }
.cfn-cap{ margin:24px 0 8px; font-family:${typography.fontFamilyMono}; font-size:11px; letter-spacing:.08em; text-transform:uppercase; font-weight:500; color:${INK_3}; }
.cfn-card{ background:#fff; border:1px solid #ececf0; border-radius:18px; overflow:hidden; }
.cfn-row{ display:flex; align-items:center; gap:12px; padding:14px 16px; }
.cfn-row + .cfn-row{ border-top:1px solid #f0f0f3; }
.cfn-tile{ width:38px; height:38px; border-radius:11px; background:#f2f2f5; color:#3c3c43; display:flex; align-items:center; justify-content:center; flex-shrink:0; }
.cfn-body{ flex:1; min-width:0; }
.cfn-t{ font-size:15px; font-weight:600; }
.cfn-w{ font-size:13px; line-height:1.4; color:${INK_3}; margin-top:2px; }
.cfn-who{ font-family:${typography.fontFamilyMono}; font-size:11px; letter-spacing:.04em; text-transform:uppercase; color:#6b6b73; margin-top:4px; }
.cfn-sw{ position:relative; flex-shrink:0; width:52px; height:44px; border:0; background:transparent; padding:0; }
.cfn-sw i{ position:absolute; left:2px; top:8px; width:48px; height:28px; border-radius:99px; background:#d6d6dc; transition:background .18s ease; }
.cfn-sw i::after{ content:''; position:absolute; top:3px; left:3px; width:22px; height:22px; border-radius:50%; background:#fff; box-shadow:0 1px 3px rgba(17,17,20,.25); transition:transform .18s cubic-bezier(.34,1.56,.64,1); }
.cfn-sw[aria-checked="true"] i{ background:${INK}; }
.cfn-sw[aria-checked="true"] i::after{ transform:translateX(20px); }
.cfn-sw:disabled{ opacity:.5; cursor:default; }
.cfn-lock{ flex-shrink:0; display:inline-flex; align-items:center; gap:5px; min-height:28px; padding:0 10px; border-radius:99px; background:#f2f2f5; color:${INK_2}; font-size:12px; font-weight:600; }
.cfn-note{ margin-top:16px; padding:12px 14px; border-radius:14px; background:#f7f7f9; font-size:13px; line-height:1.5; color:${INK_3}; }
.cfn-skel{ height:64px; border-radius:18px; background:#f2f2f5; animation:cfn-pulse 1.2s ease-in-out infinite; margin-top:10px; }
.cfn-err{ margin-top:22px; padding:16px; border-radius:16px; background:#fff; border:1px solid #ececf0; font-size:14px; color:${INK_2}; }
.cfn-err button{ margin-top:12px; min-height:44px; padding:0 16px; border-radius:12px; border:0; background:${INK}; color:#fff; font-weight:600; font-size:14px; }
.cfn-toast{ position:fixed; left:50%; transform:translateX(-50%); bottom:calc(64px + env(safe-area-inset-bottom) + 14px); z-index:10000; padding:11px 16px; border-radius:12px; font-size:14px; font-weight:500; font-family:${typography.fontFamily}; box-shadow:0 8px 24px rgba(17,17,20,.18); max-width:calc(100vw - 32px); }
.cfn-toast.ok{ background:${INK}; color:#fff; }
.cfn-toast.err{ background:#fff; color:#a32d2d; border:1px solid #f1d0d0; }
@media (min-width:1024px){ .cfn-toast{ bottom:24px; left:calc(50% + var(--sidebar-width, 0px) / 2); } }
@media (max-width:379px){ .cfn-tile{ display:none; } }
`

function Switch({ on, label, disabled, onClick }: { on: boolean; label: string; disabled?: boolean; onClick: () => void }) {
  return (
    <button type="button" role="switch" aria-checked={on} aria-label={label} disabled={disabled} className="cfn-sw" onClick={onClick}>
      <i aria-hidden />
    </button>
  )
}

export default function AvisosPage() {
  const [load, setLoad] = useState<Load>({ state: 'loading' })
  const [toast, setToast] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null)
  const saving = useRef(Promise.resolve())

  useEffect(() => {
    let vivo = true
    fetchSettings()
      .then((s) => { if (vivo) setLoad({ state: 'ok', s }) })
      .catch((e) => { console.error('[avisos] carregar', e); if (vivo) setLoad({ state: 'error' }) })
    return () => { vivo = false }
  }, [])

  useEffect(() => {
    if (!toast) return
    const t = window.setTimeout(() => setToast(null), 2600)
    return () => window.clearTimeout(t)
  }, [toast])

  const retry = () => {
    setLoad({ state: 'loading' })
    fetchSettings()
      .then((s) => setLoad({ state: 'ok', s }))
      .catch((e) => { console.error('[avisos] carregar', e); setLoad({ state: 'error' }) })
  }

  /** Grava o estado novo; erro volta para o anterior. Pedidos em fila, na ordem dos toques. */
  const save = (prev: Settings, next: Settings, okText: string) => {
    setLoad({ state: 'ok', s: next })
    saving.current = saving.current.then(() =>
      api.put('/notifications/settings', { mutedCategories: next.muted, popupEnabled: next.popup })
        .then(() => {
          if (next.popup !== prev.popup) announcePopup(next.popup)
          setToast({ kind: 'ok', text: okText })
        })
        .catch((e: { response?: { status?: number } }) => {
          console.error('[avisos] salvar', e)
          setLoad({ state: 'ok', s: prev })
          setToast({ kind: 'err', text: e?.response?.status === 403
            ? 'Só o dono e o gerente mudam os avisos.'
            : 'Não foi possível salvar. Tente de novo.' })
        }),
    )
  }

  const s = load.state === 'ok' ? load.s : null
  const ro = !!s && !s.canEdit

  const toggleCat = (c: Cat) => {
    if (!s || ro) return
    const off = s.muted.includes(c.key)
    const muted = off ? s.muted.filter(k => k !== c.key) : [...s.muted, c.key]
    save(s, { ...s, muted }, off ? `${c.label}: ligado` : `${c.label}: desligado`)
  }
  const togglePopup = () => {
    if (!s || ro) return
    save(s, { ...s, popup: !s.popup }, !s.popup ? 'Aviso na tela ligado' : 'Aviso na tela desligado')
  }

  return (
    <div className="cfn">
      <style>{CSS}</style>
      <Link href="/dashboard/configuracoes" className="cfn-back"><ChevronLeft size={18} aria-hidden /> Configurações</Link>
      <h1 className="cfn-h1">Avisos</h1>
      <p className="cfn-lead">O que avisa você e a equipe, no sino do painel e no celular. Vale para todo o negócio.</p>

      {load.state === 'loading' && <div aria-busy="true" aria-label="Carregando">{[0, 1, 2, 3].map(i => <div key={i} className="cfn-skel" />)}</div>}

      {load.state === 'error' && (
        <div className="cfn-err" role="alert">
          Não foi possível carregar os avisos.
          <div><button type="button" onClick={retry}>Tentar de novo</button></div>
        </div>
      )}

      {s && (
        <>
          {ro && (
            <div className="cfn-ro" role="note">
              <Lock size={16} aria-hidden style={{ flexShrink: 0, marginTop: 2 }} />
              Só o dono e o gerente mudam os avisos. Aqui você vê o que está ligado.
            </div>
          )}

          <div className="cfn-cap">Na tela</div>
          <div className="cfn-card">
            <div className="cfn-row">
              <span className="cfn-tile"><BellRing size={18} aria-hidden /></span>
              <div className="cfn-body">
                <div className="cfn-t">Aviso na tela</div>
                <div className="cfn-w">Um balão aparece no topo quando chega algo novo. Desligado, o sino continua contando.</div>
              </div>
              <Switch on={s.popup} label="Aviso na tela" disabled={ro} onClick={togglePopup} />
            </div>
          </div>

          {GROUPS.map(g => (
            <section key={g.title} aria-label={g.title}>
              <div className="cfn-cap">{g.title}</div>
              <div className="cfn-card">
                {g.cats.map(c => {
                  const Icon = c.icon
                  const on = !s.muted.includes(c.key)
                  return (
                    <div key={c.key} className="cfn-row">
                      <span className="cfn-tile"><Icon size={18} aria-hidden /></span>
                      <div className="cfn-body">
                        <div className="cfn-t">{c.label}</div>
                        <div className="cfn-w">{c.when}</div>
                        <div className="cfn-who">{on ? c.who : 'Ninguém recebe'}</div>
                      </div>
                      <Switch on={on} label={c.label} disabled={ro} onClick={() => toggleCat(c)} />
                    </div>
                  )
                })}
              </div>
            </section>
          ))}

          <div className="cfn-cap">Sempre ligados</div>
          <div className="cfn-card">
            {ALWAYS.map(c => {
              const Icon = c.icon
              return (
                <div key={c.key} className="cfn-row">
                  <span className="cfn-tile"><Icon size={18} aria-hidden /></span>
                  <div className="cfn-body">
                    <div className="cfn-t">{c.label}</div>
                    <div className="cfn-w">{c.when}</div>
                    <div className="cfn-who">{c.who}</div>
                  </div>
                  <span className="cfn-lock"><Lock size={12} aria-hidden /> Sempre</span>
                </div>
              )
            })}
          </div>

          <p className="cfn-note">
            Sem estes dois avisos, uma mensalidade vencida ou um certificado vencendo pararia o seu negócio sem ninguém perceber.
            Os lembretes de horário dos seus clientes não dependem desta tela.
          </p>
        </>
      )}

      {toast && <div className={`cfn-toast ${toast.kind}`} role="status" aria-live="polite">{toast.text}</div>}
    </div>
  )
}
