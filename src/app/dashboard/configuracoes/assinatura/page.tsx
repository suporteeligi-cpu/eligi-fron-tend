"use client"
// src/app/dashboard/configuracoes/assinatura/page.tsx
//
// @eligi:cfg-assinatura-v2 — Assinatura, direcao B (ver @eligi:doc-cfg-assinatura).
// - Situacao no topo, em uma frase, com o botao que resolve (pagar, assinar, reativar).
// - Mensalidade detalhada: base, profissionais extras e notas fiscais somam o total.
// - Trocar de plano mostra o valor novo ANTES e pede confirmacao (antes era 1 toque).
// - Cancelar explica ate quando o acesso continua, numa folha de confirmacao.
// - Erro de acao vira aviso no rodape; a tela nao some (antes o cartao sumia).
// Precos vem do back (`pricing`, `planValues`): o front nao recalcula preco.
// O "agora" sai do momento em que o dado chegou (loadedAt), nao do render.
//
// @eligi:plan-app-wrap — no app (Android/iPhone) esta tela nao existe: plano,
// valor e pagamento ficam fora do app por regra das lojas (ver useEligiApp.ts).

import { useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import Link from 'next/link'
import {
  ChevronLeft, Check, X, CreditCard, Users, User, ReceiptText, Tag, AlertTriangle, Lock,
} from 'lucide-react'
import api from '@/shared/lib/apiClient'
import { typography } from '@/shared/theme'
import { useAuth } from '@/hooks/useAuth'
import { useEligiAppState } from '@/shared/utils/useEligiApp' // @eligi:plan-app-import
import AppPlanNotice from '@/shared/components/AppPlanNotice'

type Plan = 'AUTONOMO' | 'ESTABELECIMENTO'
type AccessStatus =
  | 'EXEMPT' | 'ACTIVE' | 'TRIAL'
  | 'BLOCKED_TRIAL_EXPIRED' | 'BLOCKED_PAST_DUE' | 'BLOCKED_CANCELED' | 'BLOCKED_ARCHIVED' | 'CANCELED_GRACE'
  | 'PENDING_FIRST_PAYMENT' | 'PAST_DUE_GRACE' // @eligi:renew-grace-front-type

type Invoice = { dueDate: string | null; invoiceUrl: string }

interface SubscriptionView {
  access: { status: AccessStatus; blocked: boolean; trialDaysLeft: number; graceEndsAt?: string }
  hasSubscription: boolean
  overdue?: Invoice | null
  firstInvoice?: Invoice | null
  plan?: Plan | null
  value?: number | null
  currentPeriodEnd?: string | null
  extraSeats?: number
  activeCount?: number
  nfseCharged?: boolean
  planValues?: Record<Plan, number>
  nextChange?: { delta: number; expectedValue: number; activeCount: number } | null
  // @eligi:coupon-assinatura-types — tabela vigente servida pela API
  pricing?: { base: Record<Plan, number>; extraSeat: number; addon: number }
  coupon?: { code: string; label: string; regularValue: number } | null
}

type ProfLite = { id: string; name: string; role?: string | null }
type Loaded = { data: SubscriptionView; at: number }
type Load = { state: 'loading' } | { state: 'error' } | { state: 'ok'; v: Loaded }

const PLAN_LABEL: Record<Plan, string> = { AUTONOMO: 'Autônomo', ESTABELECIMENTO: 'Estabelecimento' }
const PLAN_DESC: Record<Plan, string> = {
  AUTONOMO: 'Só você atende. Uma agenda.',
  ESTABELECIMENTO: 'Equipe com até 3 profissionais inclusos.',
}
// @eligi:coupon-assinatura-fallback — so se a API responder sem pricing.
const FALLBACK_PRICING = { base: { AUTONOMO: 49.9, ESTABELECIMENTO: 89.9 }, extraSeat: 19.9, addon: 29.9 } // @eligi:assin-fallback-nov26
const DAY = 86_400_000

const brl = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
const dataLonga = (iso: string) => new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })
const diasAte = (iso: string, now: number) => Math.ceil((new Date(iso).getTime() - now) / DAY)

type ApiErr = { response?: { status?: number; data?: { error?: { code?: string; message?: string }; data?: { professionals?: ProfLite[] } } } }
const errMsg = (e: unknown, fallback: string) => (e as ApiErr)?.response?.data?.error?.message ?? fallback

// Busca pura: o setState fica no .then de quem chama (regra do React Compiler).
function fetchSubscription(): Promise<Loaded> {
  return api.get('/billing/subscription').then((r) => {
    const data = r.data?.data as SubscriptionView | undefined
    if (!data) throw new Error('resposta vazia')
    return { data, at: Date.now() }
  })
}

export default function AssinaturaPage() {
  const app = useEligiAppState()
  if (app === 'unknown') return null
  if (app !== 'web') {
    return (
      <div className="cfs" style={{ maxWidth: 560, fontFamily: typography.fontFamily }}>
        <style>{CSS}</style>
        <Link href="/dashboard/configuracoes" className="cfs-back"><ChevronLeft size={18} aria-hidden /> Configurações</Link>
        <AppPlanNotice
          title="Assinatura"
          text="O plano e a cobrança do Eligi não são gerenciados pelo app."
          support
          supportText="Olá! Tenho uma dúvida sobre a minha assinatura do Eligi."
        />
      </div>
    )
  }
  return <AssinaturaWeb />
}

const INK = '#111114'
const INK_2 = '#4b4b52'
const INK_3 = '#6b6b73'

const CSS = `
.cfs{ max-width:720px; font-family:${typography.fontFamily}; color:${INK}; animation:cfs-in .25s ease; }
@keyframes cfs-in{ from{opacity:0; transform:translateY(6px)} to{opacity:1; transform:none} }
@keyframes cfs-pulse{ 0%,100%{opacity:.5} 50%{opacity:1} }
.cfs *, .cfs-sheet *{ box-sizing:border-box; }
.cfs :where(span, div, b, i, p, h1, h2, strong, small, label), .cfs-sheet :where(span, div, b, i, p, h2, strong, small, label){ color:inherit; } /* vence main span */
.cfs a, .cfs-sheet a{ text-decoration:none; color:inherit; }
.cfs button, .cfs-sheet button{ font-family:inherit; cursor:pointer; -webkit-tap-highlight-color:transparent; }
.cfs a:focus-visible, .cfs button:focus-visible, .cfs-sheet button:focus-visible, .cfs-sheet a:focus-visible{ outline:2px solid #dc2626; outline-offset:2px; }
.cfs-d{ font-family:${typography.fontFamilyDisplay}; letter-spacing:-.03em; }
.cfs-n{ font-variant-numeric:tabular-nums; }
.cfs-back{ display:inline-flex; align-items:center; gap:4px; min-height:44px; padding:0 10px 0 4px; margin-left:-4px; border-radius:12px; font-size:14px; font-weight:500; color:${INK_2}; }
.cfs-h1{ margin:4px 0 0; font-size:28px; font-weight:600; }
.cfs-lead{ margin:6px 0 0; font-size:14px; line-height:1.45; color:${INK_3}; max-width:560px; }
.cfs-cap{ margin:24px 0 8px; font-family:${typography.fontFamilyMono}; font-size:11px; letter-spacing:.08em; text-transform:uppercase; font-weight:500; color:${INK_3}; }
.cfs-card{ background:#fff; border:1px solid #ececf0; border-radius:18px; padding:18px; }
.cfs-banner{ margin-top:16px; display:flex; gap:10px; align-items:flex-start; padding:12px 14px; border-radius:14px; font-size:13.5px; line-height:1.5; }
.cfs-banner.ok{ background:#ecfdf5; color:#0f6e56; }
.cfs-hero-top{ display:flex; align-items:flex-start; justify-content:space-between; gap:12px; flex-wrap:wrap; }
.cfs-plan{ font-size:26px; font-weight:700; line-height:1.1; }
.cfs-pill{ display:inline-flex; align-items:center; gap:6px; min-height:28px; padding:0 10px; border-radius:99px; font-size:12.5px; font-weight:600; white-space:nowrap; }
.cfs-pill i{ width:7px; height:7px; border-radius:50%; background:currentColor; }
.cfs-pill.ok{ background:#ecfdf5; color:#0f6e56; }
.cfs-pill.warn{ background:#fffbeb; color:#b45309; }
.cfs-pill.bad{ background:#fef2f2; color:#b91c1c; }
.cfs-pill.neutral{ background:#f2f2f5; color:${INK_2}; }
.cfs-price{ margin-top:14px; display:flex; align-items:baseline; gap:6px; flex-wrap:wrap; }
.cfs-price b{ font-size:34px; font-weight:700; letter-spacing:-.04em; }
.cfs-price span{ font-size:14px; color:${INK_3}; }
.cfs-desc{ margin-top:8px; font-size:14px; line-height:1.5; color:${INK_2}; }
.cfs-due{ margin-top:14px; padding-top:14px; border-top:1px solid #f0f0f3; display:flex; align-items:center; justify-content:space-between; gap:10px; flex-wrap:wrap; }
.cfs-due-l{ font-size:13px; color:${INK_3}; }
.cfs-due-v{ font-size:15px; font-weight:600; margin-top:2px; }
.cfs-cta{ display:inline-flex; align-items:center; justify-content:center; gap:8px; min-height:48px; padding:0 18px; border-radius:14px; border:0; background:${INK}; color:#fff !important; font-size:15px; font-weight:600; }
.cfs-cta.block{ width:100%; margin-top:16px; }
.cfs-cta:disabled{ opacity:.5; cursor:default; }
.cfs-sec{ display:inline-flex; align-items:center; justify-content:center; min-height:44px; padding:0 14px; border-radius:12px; border:1px solid #e3e3e8; background:#fff; font-size:14px; font-weight:600; color:${INK}; }
@media (hover:hover){ .cfs-sec:hover{ border-color:#cfcfd6; background:#fafafb; } }
.cfs-lines{ display:flex; flex-direction:column; }
.cfs-line{ display:flex; align-items:center; justify-content:space-between; gap:12px; padding:9px 0; font-size:14px; color:${INK_2}; }
.cfs-line + .cfs-line{ border-top:1px solid #f4f4f6; }
.cfs-line span:last-child{ font-variant-numeric:tabular-nums; color:${INK}; font-weight:500; white-space:nowrap; }
.cfs-line.total{ border-top:1px solid #e6e6ea !important; margin-top:4px; padding-top:12px; font-weight:600; color:${INK}; font-size:15px; }
.cfs-line.total span:last-child{ font-weight:700; }
.cfs-coupon{ margin-top:12px; display:flex; gap:10px; align-items:flex-start; padding:10px 12px; border-radius:12px; background:#ecfdf5; color:#0f6e56; font-size:13px; line-height:1.45; }
.cfs-note{ margin-top:12px; padding:10px 12px; border-radius:12px; background:#f7f7f9; color:${INK_2}; font-size:13px; line-height:1.45; }
.cfs-plans{ display:grid; grid-template-columns:repeat(auto-fit, minmax(240px, 1fr)); gap:10px; }
.cfs-po{ background:#fff; border:1px solid #ececf0; border-radius:18px; padding:16px; display:flex; flex-direction:column; gap:10px; }
.cfs-po.cur{ border:2px solid ${INK}; padding:15px; }
.cfs-po-top{ display:flex; align-items:center; justify-content:space-between; gap:8px; }
.cfs-po-t{ display:flex; align-items:center; gap:8px; font-size:16px; font-weight:600; }
.cfs-po-v{ font-size:22px; font-weight:700; }
.cfs-po-v small{ font-size:13px; font-weight:500; color:${INK_3}; }
.cfs-po-d{ font-size:13px; line-height:1.45; color:${INK_3}; }
.cfs-tag{ font-size:11.5px; font-weight:600; padding:3px 9px; border-radius:99px; background:${INK}; color:#fff !important; }
.cfs-cancel{ margin-top:24px; padding-top:16px; border-top:1px solid #ececf0; }
.cfs-cancel button{ min-height:44px; padding:0 4px; border:0; background:transparent; font-size:14px; font-weight:500; color:${INK_3}; text-decoration:underline; text-underline-offset:3px; }
.cfs-skel{ border-radius:18px; background:#f2f2f5; animation:cfs-pulse 1.2s ease-in-out infinite; }
.cfs-err{ margin-top:22px; padding:16px; border-radius:16px; background:#fff; border:1px solid #ececf0; font-size:14px; color:${INK_2}; }
.cfs-toast{ position:fixed; left:50%; transform:translateX(-50%); bottom:calc(64px + env(safe-area-inset-bottom) + 14px); z-index:10000; padding:11px 16px; border-radius:12px; font-size:14px; font-weight:500; font-family:${typography.fontFamily}; box-shadow:0 8px 24px rgba(17,17,20,.18); max-width:calc(100vw - 32px); }
.cfs-toast.ok{ background:${INK}; color:#fff; }
.cfs-toast.err{ background:#fff; color:#a32d2d; border:1px solid #f1d0d0; }
@media (min-width:1024px){ .cfs-toast{ bottom:24px; left:calc(50% + var(--sidebar-width, 0px) / 2); } }

.cfs-drop{ position:fixed; inset:0; z-index:9998; background:rgba(17,17,20,.32); animation:cfs-fade .18s ease; }
@keyframes cfs-fade{ from{opacity:0} to{opacity:1} }
@keyframes cfs-up{ from{transform:translateY(24px); opacity:0} to{transform:none; opacity:1} }
.cfs-sheet{ position:fixed; z-index:9999; left:0; right:0; bottom:calc(64px + env(safe-area-inset-bottom)); max-height:calc(100dvh - 104px - 64px - env(safe-area-inset-bottom)); overflow:auto; background:#fff; border-radius:22px 22px 0 0; padding:10px 16px 18px; font-family:${typography.fontFamily}; color:${INK}; animation:cfs-up .22s cubic-bezier(.34,1.56,.64,1); outline:none; }
.cfs-grab{ width:40px; height:4px; border-radius:99px; background:#d6d6dc; margin:0 auto 10px; }
.cfs-sh-top{ display:flex; align-items:flex-start; justify-content:space-between; gap:12px; }
.cfs-sh-t{ margin:0; font-size:21px; font-weight:600; font-family:${typography.fontFamilyDisplay}; letter-spacing:-.03em; }
.cfs-sh-h{ margin:4px 0 0; font-size:13.5px; line-height:1.45; color:${INK_3}; }
.cfs-x{ width:44px; height:44px; flex-shrink:0; border:0; border-radius:12px; background:#f2f2f5; color:${INK_2}; display:flex; align-items:center; justify-content:center; }
.cfs-cmp{ margin-top:16px; display:grid; grid-template-columns:1fr auto 1fr; align-items:center; gap:8px; }
.cfs-cmp div{ border-radius:14px; background:#f7f7f9; padding:12px; }
.cfs-cmp div.to{ background:${INK}; color:#fff; }
.cfs-cmp small{ display:block; font-size:12px; opacity:.75; }
.cfs-cmp b{ display:block; margin-top:2px; font-size:18px; font-weight:700; font-variant-numeric:tabular-nums; }
.cfs-cmp > span{ color:${INK_3}; font-size:18px; }
.cfs-bul{ margin:14px 0 0; padding:0; list-style:none; display:flex; flex-direction:column; gap:8px; }
.cfs-bul li{ display:flex; gap:10px; align-items:flex-start; font-size:13.5px; line-height:1.45; color:${INK_2}; }
.cfs-bul li i{ width:6px; height:6px; border-radius:50%; background:#9a9aa3; margin-top:7px; flex-shrink:0; }
.cfs-pick{ margin-top:14px; display:flex; flex-direction:column; gap:8px; }
.cfs-pick button{ display:flex; align-items:center; gap:12px; min-height:52px; padding:0 14px; border-radius:14px; border:1px solid #e3e3e8; background:#fff; text-align:left; font-size:15px; color:${INK}; }
.cfs-pick button[aria-checked="true"]{ border:2px solid ${INK}; padding:0 13px; font-weight:600; }
.cfs-pick .dot{ width:20px; height:20px; border-radius:50%; border:2px solid #c9c9d0; flex-shrink:0; }
.cfs-pick button[aria-checked="true"] .dot{ border:6px solid ${INK}; }
.cfs-pick small{ color:${INK_3}; font-weight:400; }
.cfs-row2{ display:flex; gap:8px; margin-top:16px; }
.cfs-row2 > *{ flex:1; }
.cfs-danger{ min-height:48px; border:0; border-radius:14px; background:#b91c1c; color:#fff !important; font-size:15px; font-weight:600; }
.cfs-danger:disabled{ opacity:.5; cursor:default; }
@media (min-width:1024px){
  .cfs-sheet{ left:calc(50% + var(--sidebar-width, 0px) / 2); right:auto; bottom:auto; top:50%; transform:translate(-50%,-50%); width:460px; max-height:calc(100dvh - 160px); border-radius:22px; padding:20px; animation:cfs-fade .18s ease; }
  .cfs-grab{ display:none; }
}
@media (max-width:379px){ .cfs-price b{ font-size:30px; } .cfs-plan{ font-size:23px; } }
@media (prefers-reduced-motion:reduce){ .cfs, .cfs-skel, .cfs-sheet, .cfs-drop{ animation:none; } }
`

/** Folha de confirmacao: Esc fecha, foco volta para quem abriu, rolagem do fundo travada. */
function Sheet({ title, help, onClose, children }: { title: string; help?: string; onClose: () => void; children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null)
  const closeRef = useRef(onClose)
  useEffect(() => { closeRef.current = onClose })
  useEffect(() => {
    const prev = document.activeElement as HTMLElement | null
    ref.current?.focus()
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') closeRef.current() }
    document.addEventListener('keydown', onKey)
    const overflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = overflow
      prev?.focus()
    }
  }, [])
  return createPortal(
    <>
      <style>{CSS}</style>
      <div className="cfs-drop" onClick={onClose} aria-hidden />
      <div className="cfs-sheet" role="dialog" aria-modal="true" aria-labelledby="cfs-sh-t" tabIndex={-1} ref={ref}>
        <div className="cfs-grab" aria-hidden />
        <div className="cfs-sh-top">
          <div>
            <h2 id="cfs-sh-t" className="cfs-sh-t">{title}</h2>
            {help && <p className="cfs-sh-h">{help}</p>}
          </div>
          <button type="button" className="cfs-x" onClick={onClose} aria-label="Fechar"><X size={18} /></button>
        </div>
        {children}
      </div>
    </>,
    document.body,
  )
}

type Tone = 'ok' | 'warn' | 'bad' | 'neutral'

function AssinaturaWeb() {
  const { user } = useAuth()
  const [load, setLoad] = useState<Load>({ state: 'loading' })
  const [paidFlag] = useState(() => typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('pago') === '1')
  const [renewed, setRenewed] = useState(false)
  const [invoice, setInvoice] = useState<{ available: boolean; invoiceUrl?: string } | null>(null)
  const [toast, setToast] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null)
  const [busy, setBusy] = useState(false)
  const [sheet, setSheet] = useState<null | { kind: 'plan'; target: Plan; profs: ProfLite[] | null; keep: string | null } | { kind: 'cancel' }>(null)

  useEffect(() => {
    let vivo = true
    fetchSubscription()
      .then((v) => { if (vivo) setLoad({ state: 'ok', v }) })
      .catch((e) => { console.error('[assinatura] carregar', e); if (vivo) setLoad({ state: 'error' }) })
    return () => { vivo = false }
  }, [])

  useEffect(() => {
    if (!toast) return
    const t = window.setTimeout(() => setToast(null), 3200)
    return () => window.clearTimeout(t)
  }, [toast])

  const reload = useCallback(() => {
    return fetchSubscription().then((v) => setLoad({ state: 'ok', v }))
  }, [])

  const retry = () => {
    setLoad({ state: 'loading' })
    reload().catch((e) => { console.error('[assinatura] carregar', e); setLoad({ state: 'error' }) })
  }

  // Pagou no Asaas e voltou para a aba: refaz em silencio. Se o ciclo andou, avisa.
  const currentEnd = load.state === 'ok' ? load.v.data.currentPeriodEnd ?? null : null
  useEffect(() => {
    let vivo = true
    function onFocus() {
      if (document.visibilityState !== 'visible') return
      fetchSubscription()
        .then((v) => {
          if (!vivo) return
          const fresh = v.data.currentPeriodEnd
          if (fresh && currentEnd && new Date(fresh).getTime() > new Date(currentEnd).getTime()) {
            setRenewed(true)
            setInvoice(null)
          }
          setLoad({ state: 'ok', v })
        })
        .catch(() => { /* silencioso: mantem o que esta na tela */ })
    }
    window.addEventListener('focus', onFocus)
    document.addEventListener('visibilitychange', onFocus)
    return () => {
      vivo = false
      window.removeEventListener('focus', onFocus)
      document.removeEventListener('visibilitychange', onFocus)
    }
  }, [currentEnd])

  // Fatura do proximo ciclo (adiantar): so ACTIVE e a ate 3 dias. O back e o portao.
  const status = load.state === 'ok' ? load.v.data.access.status : null
  const at = load.state === 'ok' ? load.v.at : 0
  const daysLeft = currentEnd && at ? diasAte(currentEnd, at) : null
  const inRenewWindow = status === 'ACTIVE' && daysLeft !== null && daysLeft >= 0 && daysLeft <= 3
  useEffect(() => {
    if (!inRenewWindow) return
    let vivo = true
    api.get('/billing/next-invoice')
      .then((r) => { if (vivo) setInvoice(r.data?.data ?? null) })
      .catch(() => { if (vivo) setInvoice(null) })
    return () => { vivo = false }
  }, [inRenewWindow])

  function openSubscribe() {
    // reusa o overlay de assinatura do BillingGuard
    // @eligi:overdue-detail — explicito: o fallback do guard nao e mais VOLUNTARY
    window.dispatchEvent(new CustomEvent('billing:blocked', { detail: { code: 'VOLUNTARY' } }))
  }

  function doCancel() {
    setBusy(true)
    api.post('/billing/cancel')
      .then(() => reload())
      .then(() => { setSheet(null); setToast({ kind: 'ok', text: 'Assinatura cancelada. Nada mais será cobrado.' }) })
      .catch((e) => { console.error('[assinatura] cancelar', e); setToast({ kind: 'err', text: errMsg(e, 'Não foi possível cancelar. Tente de novo.') }) })
      .finally(() => setBusy(false))
  }

  function doResume() {
    setBusy(true)
    api.post('/billing/resume')
      .then(() => reload())
      .then(() => setToast({ kind: 'ok', text: 'Assinatura reativada.' }))
      .catch((e) => { console.error('[assinatura] reativar', e); setToast({ kind: 'err', text: errMsg(e, 'Não foi possível reativar. Tente de novo.') }) })
      .finally(() => setBusy(false))
  }

  function doChangePlan(target: Plan, keep: string | null) {
    setBusy(true)
    api.post('/billing/change-plan', { plan: target, ...(keep ? { keepProfessionalIds: [keep] } : {}) })
      .then(() => reload())
      .then(() => { setSheet(null); setToast({ kind: 'ok', text: `Plano ${PLAN_LABEL[target]} ativado.` }) })
      .catch((e: unknown) => {
        const r = (e as ApiErr)?.response
        if (r?.status === 409 && r.data?.error?.code === 'SEAT_SELECTION_REQUIRED') {
          setSheet({ kind: 'plan', target, profs: r.data?.data?.professionals ?? [], keep: null })
          return
        }
        console.error('[assinatura] trocar plano', e)
        setToast({ kind: 'err', text: errMsg(e, 'Não foi possível trocar de plano. Tente de novo.') })
      })
      .finally(() => setBusy(false))
  }

  return (
    <div className="cfs">
      <style>{CSS}</style>
      <Link href="/dashboard/configuracoes" className="cfs-back"><ChevronLeft size={18} aria-hidden /> Configurações</Link>
      <h1 className="cfs-h1 cfs-d">Assinatura</h1>
      <p className="cfs-lead">Seu plano do Eligi, quanto custa por mês e a próxima cobrança.</p>

      {paidFlag && load.state === 'ok' && status !== 'ACTIVE' && (
        <div className="cfs-banner ok" role="status"><Check size={16} aria-hidden style={{ flexShrink: 0, marginTop: 2 }} />
          Pagamento enviado. O banco pode levar alguns minutos para confirmar; esta tela atualiza sozinha quando você voltar para ela.
        </div>
      )}
      {renewed && load.state === 'ok' && (
        <div className="cfs-banner ok" role="status"><Check size={16} aria-hidden style={{ flexShrink: 0, marginTop: 2 }} />
          Pagamento confirmado.{currentEnd ? ` Próximo vencimento: ${dataLonga(currentEnd)}.` : ''}
        </div>
      )}

      {load.state === 'loading' && (
        <div aria-busy="true" aria-label="Carregando" style={{ marginTop: 22, display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div className="cfs-skel" style={{ height: 190 }} />
          <div className="cfs-skel" style={{ height: 150 }} />
        </div>
      )}

      {load.state === 'error' && (
        <div className="cfs-err" role="alert">
          Não foi possível carregar a sua assinatura.
          <div><button type="button" className="cfs-cta" style={{ marginTop: 12 }} onClick={retry}>Tentar de novo</button></div>
        </div>
      )}

      {load.state === 'ok' && (
        <Body
          d={load.v.data}
          at={load.v.at}
          isOwner={user?.role === 'BUSINESS_OWNER'}
          busy={busy}
          invoiceUrl={inRenewWindow && invoice?.available ? invoice.invoiceUrl ?? null : null}
          onSubscribe={openSubscribe}
          onResume={doResume}
          onAskPlan={(target) => setSheet({ kind: 'plan', target, profs: null, keep: null })}
          onAskCancel={() => setSheet({ kind: 'cancel' })}
        />
      )}

      {sheet?.kind === 'plan' && load.state === 'ok' && (
        <PlanSheet
          d={load.v.data}
          target={sheet.target}
          profs={sheet.profs}
          keep={sheet.keep}
          busy={busy}
          onKeep={(id) => setSheet({ ...sheet, keep: id })}
          onClose={() => { if (!busy) setSheet(null) }}
          onConfirm={() => doChangePlan(sheet.target, sheet.keep)}
        />
      )}

      {sheet?.kind === 'cancel' && load.state === 'ok' && (
        <Sheet title="Cancelar a assinatura?" onClose={() => { if (!busy) setSheet(null) }}>
          <ul className="cfs-bul">
            <li><i aria-hidden />{load.v.data.currentPeriodEnd
              ? <>Você continua usando o Eligi até <b>{dataLonga(load.v.data.currentPeriodEnd)}</b>, que já está pago.</>
              : <>Você continua usando o Eligi até o fim do período já pago.</>}</li>
            <li><i aria-hidden />Nada mais é cobrado depois disso.</li>
            <li><i aria-hidden />Depois dessa data o painel trava até você assinar de novo. Seus dados ficam guardados.</li>
            <li><i aria-hidden />Mudou de ideia antes da data? Dá para reativar aqui mesmo, sem pagar de novo agora.</li>
          </ul>
          <div className="cfs-row2">
            <button type="button" className="cfs-sec" onClick={() => setSheet(null)} disabled={busy}>Manter</button>
            <button type="button" className="cfs-danger" onClick={doCancel} disabled={busy}>{busy ? 'Cancelando…' : 'Cancelar assinatura'}</button>
          </div>
        </Sheet>
      )}

      {toast && <div className={`cfs-toast ${toast.kind}`} role="status" aria-live="polite">{toast.text}</div>}
    </div>
  )
}

function Body({ d, at, isOwner, busy, invoiceUrl, onSubscribe, onResume, onAskPlan, onAskCancel }: {
  d: SubscriptionView
  at: number
  isOwner: boolean
  busy: boolean
  invoiceUrl: string | null
  onSubscribe: () => void
  onResume: () => void
  onAskPlan: (target: Plan) => void
  onAskCancel: () => void
}) {
  const st = d.access.status
  // So o dono tem assinatura: para os outros o back devolve "sem assinatura".
  if (!isOwner && !d.hasSubscription) {
    return (
      <div className="cfs-note" style={{ marginTop: 22, display: 'flex', gap: 10 }} role="note">
        <Lock size={16} aria-hidden style={{ flexShrink: 0, marginTop: 2 }} />
        Só o dono do negócio vê e muda a assinatura do Eligi.
      </div>
    )
  }

  const pricing = d.pricing ?? FALLBACK_PRICING
  const plan = d.plan ?? null
  const end = d.currentPeriodEnd ?? null
  const days = end ? diasAte(end, at) : null
  const endLong = end ? dataLonga(end) : 'o fim do período pago'

  let tone: Tone = 'neutral'
  let pill = ''
  let title = plan ? PLAN_LABEL[plan] : 'Eligi'
  let desc = ''
  let action: React.ReactNode = null

  switch (st) {
    case 'ACTIVE':
      tone = 'ok'; pill = 'Em dia'
      desc = 'Sua assinatura está paga. Tudo funcionando.'
      break
    case 'EXEMPT':
      tone = 'ok'; pill = 'Cortesia'; title = 'Conta cortesia'
      desc = 'Este acesso é isento de cobrança.'
      break
    case 'TRIAL':
      tone = 'neutral'; title = 'Teste grátis'
      pill = `${d.access.trialDaysLeft} ${d.access.trialDaysLeft === 1 ? 'dia restante' : 'dias restantes'}`
      desc = 'Você está usando o Eligi sem pagar. Assine antes do fim do teste para não perder o acesso.'
      action = <button type="button" className="cfs-cta block" onClick={onSubscribe}>Assinar agora</button>
      break
    case 'PENDING_FIRST_PAYMENT':
      tone = 'warn'; pill = 'Aguardando pagamento'
      desc = 'Sua assinatura foi criada. Assim que o banco confirmar o primeiro pagamento, ela aparece em dia aqui.'
      if (d.firstInvoice?.invoiceUrl) {
        action = <a className="cfs-cta block" href={d.firstInvoice.invoiceUrl} target="_blank" rel="noopener noreferrer"><CreditCard size={17} aria-hidden /> Pagar a fatura</a>
      }
      break
    case 'PAST_DUE_GRACE':
      tone = 'warn'; pill = 'Pagamento em aberto'
      desc = `A mensalidade venceu${end ? ` em ${dataLonga(end)}` : ''}. Se você já pagou, é só aguardar o banco confirmar.${d.access.graceEndsAt ? ` Seu acesso continua até ${dataLonga(d.access.graceEndsAt)}.` : ''}`
      if (d.overdue?.invoiceUrl) {
        action = <a className="cfs-cta block" href={d.overdue.invoiceUrl} target="_blank" rel="noopener noreferrer"><CreditCard size={17} aria-hidden /> Pagar a fatura</a>
      }
      break
    case 'BLOCKED_PAST_DUE':
      tone = 'bad'; pill = 'Pagamento atrasado'
      desc = 'Há uma mensalidade em aberto. Pague a fatura para o painel voltar a funcionar.'
      if (d.overdue?.invoiceUrl) {
        action = <a className="cfs-cta block" href={d.overdue.invoiceUrl} target="_blank" rel="noopener noreferrer"><CreditCard size={17} aria-hidden /> Pagar a fatura</a>
      }
      break
    case 'CANCELED_GRACE':
      tone = 'warn'; pill = 'Cancelada'
      desc = `Você continua usando até ${endLong}. Depois o painel trava até uma nova assinatura. Reativando agora, nada é cobrado hoje: a próxima cobrança cai em ${endLong}.`
      action = <button type="button" className="cfs-cta block" onClick={onResume} disabled={busy}>{busy ? 'Reativando…' : 'Reativar assinatura'}</button>
      break
    case 'BLOCKED_CANCELED':
      tone = 'bad'; pill = 'Cancelada'
      desc = 'Assine de novo para voltar a usar o Eligi. Seus dados continuam guardados.'
      action = <button type="button" className="cfs-cta block" onClick={onSubscribe}>Assinar de novo</button>
      break
    case 'BLOCKED_TRIAL_EXPIRED':
      tone = 'bad'; pill = 'Teste encerrado'; title = 'Teste grátis'
      desc = 'O período de teste terminou. Assine para continuar.'
      action = <button type="button" className="cfs-cta block" onClick={onSubscribe}>Assinar agora</button>
      break
    default:
      tone = 'neutral'; pill = ''
      desc = 'Se tiver alguma dúvida sobre a sua assinatura, fale com o suporte do Eligi.'
  }

  const showValue = d.value != null && plan && (st === 'ACTIVE' || st === 'PAST_DUE_GRACE' || st === 'CANCELED_GRACE' || st === 'PENDING_FIRST_PAYMENT' || st === 'BLOCKED_PAST_DUE')
  const showDue = st === 'ACTIVE' && end

  return (
    <>
      <section className="cfs-card" style={{ marginTop: 22 }} aria-label="Situação">
        <div className="cfs-hero-top">
          <div>
            <div className="cfs-cap" style={{ margin: 0 }}>{plan && st !== 'EXEMPT' && st !== 'TRIAL' && st !== 'BLOCKED_TRIAL_EXPIRED' ? 'Plano' : 'Situação'}</div>
            <div className="cfs-plan cfs-d" style={{ marginTop: 4 }}>{title}</div>
          </div>
          {pill && <span className={`cfs-pill ${tone}`}><i aria-hidden />{pill}</span>}
        </div>
        {showValue && (
          <div className="cfs-price"><b className="cfs-d cfs-n">{brl(d.value as number)}</b><span>por mês</span></div>
        )}
        <p className="cfs-desc">{tone === 'bad' && <AlertTriangle size={15} aria-hidden style={{ verticalAlign: '-2px', marginRight: 6, color: '#b91c1c' }} />}{desc}</p>
        {showDue && end && (
          <div className="cfs-due">
            <div>
              <div className="cfs-due-l">Próxima cobrança</div>
              <div className="cfs-due-v cfs-n">
                {dataLonga(end)}
                {days !== null && days >= 0 && (
                  <span style={{ fontWeight: 500, color: days <= 3 ? '#b45309' : INK_3, fontSize: 13 }}>
                    {' · '}{days === 0 ? 'vence hoje' : days === 1 ? 'vence amanhã' : `em ${days} dias`}
                  </span>
                )}
              </div>
            </div>
            {invoiceUrl && (
              <a className="cfs-sec" href={invoiceUrl} target="_blank" rel="noopener noreferrer"><CreditCard size={16} aria-hidden style={{ marginRight: 6 }} /> Pagar agora</a>
            )}
          </div>
        )}
        {action}
      </section>

      {showValue && plan && (
        <>
          <div className="cfs-cap">Mensalidade</div>
          <section className="cfs-card" aria-label="Mensalidade">
            <div className="cfs-lines">
              <div className="cfs-line"><span>{PLAN_LABEL[plan]}{plan === 'ESTABELECIMENTO' ? ' (3 profissionais)' : ''}</span><span>{brl(pricing.base[plan])}</span></div>
              {plan === 'ESTABELECIMENTO' && (d.extraSeats ?? 0) > 0 && (
                <div className="cfs-line"><span>{d.extraSeats} {d.extraSeats === 1 ? 'profissional extra' : 'profissionais extras'} × {brl(pricing.extraSeat)}</span><span>{brl(pricing.extraSeat * (d.extraSeats ?? 0))}</span></div>
              )}
              {d.nfseCharged && (
                <div className="cfs-line"><span>Notas fiscais</span><span>{brl(pricing.addon)}</span></div>
              )}
              <div className="cfs-line total"><span>Total por mês</span><span>{brl(d.value as number)}</span></div>
            </div>
            {/* @eligi:coupon-assinatura-selo */}
            {d.coupon && (
              <div className="cfs-coupon"><Tag size={15} aria-hidden style={{ flexShrink: 0, marginTop: 2 }} />
                <span>Cupom {d.coupon.code} aplicado. Sem ele seriam {brl(d.coupon.regularValue)} por mês.</span>
              </div>
            )}
            {d.nextChange && (
              <div className="cfs-note">
                {d.nextChange.delta > 0 ? 'Sua equipe cresceu: ' : 'Sua equipe diminuiu: '}
                a partir da próxima cobrança o valor passa para <b className="cfs-n">{brl(d.nextChange.expectedValue)}</b> por mês.
              </div>
            )}
          </section>
        </>
      )}

      {st === 'ACTIVE' && plan && (
        <>
          <div className="cfs-cap">Plano</div>
          <div className="cfs-plans">
            {(['AUTONOMO', 'ESTABELECIMENTO'] as Plan[]).map((p) => {
              const cur = p === plan
              const val = cur ? d.value : d.planValues?.[p]
              const Icon = p === 'AUTONOMO' ? User : Users
              return (
                <div key={p} className={`cfs-po${cur ? ' cur' : ''}`}>
                  <div className="cfs-po-top">
                    <span className="cfs-po-t"><Icon size={18} aria-hidden /> {PLAN_LABEL[p]}</span>
                    {cur && <span className="cfs-tag">Seu plano</span>}
                  </div>
                  {val != null && <div className="cfs-po-v cfs-d cfs-n">{brl(val)} <small>por mês</small></div>}
                  <div className="cfs-po-d">
                    {PLAN_DESC[p]}
                    {p === 'ESTABELECIMENTO' && ` Cada profissional a mais: ${brl(pricing.extraSeat)}.`}
                  </div>
                  {!cur && (
                    <button type="button" className="cfs-sec" onClick={() => onAskPlan(p)} disabled={busy}>Mudar para {PLAN_LABEL[p]}</button>
                  )}
                </div>
              )
            })}
          </div>
          {d.nfseCharged && (
            <p className="cfs-note"><ReceiptText size={15} aria-hidden style={{ verticalAlign: '-3px', marginRight: 6 }} />Os valores já incluem as notas fiscais.</p>
          )}
          <div className="cfs-cancel">
            <button type="button" onClick={onAskCancel} disabled={busy}>Cancelar assinatura</button>
          </div>
        </>
      )}
    </>
  )
}

function PlanSheet({ d, target, profs, keep, busy, onKeep, onClose, onConfirm }: {
  d: SubscriptionView
  target: Plan
  profs: ProfLite[] | null
  keep: string | null
  busy: boolean
  onKeep: (id: string) => void
  onClose: () => void
  onConfirm: () => void
}) {
  const from = d.value ?? null
  const to = d.planValues?.[target] ?? null
  const up = target === 'ESTABELECIMENTO'
  const choosing = !up && profs !== null
  const extra = Math.max(0, (d.activeCount ?? 0) - 3)

  return (
    <Sheet
      title={choosing ? 'Quem continua atendendo?' : `Mudar para ${PLAN_LABEL[target]}?`}
      help={choosing ? 'O Autônomo tem 1 profissional. Os outros ficam desativados, e voltam ao trocar para o Estabelecimento.' : undefined}
      onClose={onClose}
    >
      {!choosing && (
        <>
          {from != null && to != null && (
            <div className="cfs-cmp" aria-label="Valor por mês">
              <div><small>Hoje</small><b>{brl(from)}</b></div>
              <span aria-hidden>→</span>
              <div className="to"><small>Novo valor</small><b>{brl(to)}</b></div>
            </div>
          )}
          <ul className="cfs-bul">
            {up ? (
              <>
                <li><i aria-hidden />A equipe libera na hora: até 3 profissionais sem custo extra.</li>
                {extra > 0 && <li><i aria-hidden />Você tem {d.activeCount} ativos, então {extra} {extra === 1 ? 'entra' : 'entram'} como profissional extra.</li>}
                <li><i aria-hidden />O novo valor vale a partir da próxima cobrança.</li>
              </>
            ) : (
              <>
                <li><i aria-hidden />Fica só 1 profissional ativo na agenda.{(d.activeCount ?? 0) > 1 ? ' No próximo passo você escolhe quem.' : ''}</li>
                <li><i aria-hidden />Os outros ficam desativados, com o histórico guardado.</li>
                <li><i aria-hidden />O novo valor vale a partir da próxima cobrança.</li>
              </>
            )}
          </ul>
        </>
      )}

      {choosing && (
        <div className="cfs-pick" role="radiogroup" aria-label="Quem continua">
          {(profs ?? []).map((p) => (
            <button key={p.id} type="button" role="radio" aria-checked={keep === p.id} onClick={() => onKeep(p.id)}>
              <span className="dot" aria-hidden />
              <span>{p.name}{p.role ? <small> · {p.role}</small> : null}</span>
            </button>
          ))}
        </div>
      )}

      <div className="cfs-row2">
        <button type="button" className="cfs-sec" onClick={onClose} disabled={busy}>Voltar</button>
        <button type="button" className="cfs-cta" onClick={onConfirm} disabled={busy || (choosing && !keep)}>
          {busy ? 'Mudando…' : 'Confirmar troca'}
        </button>
      </div>
    </Sheet>
  )
}
