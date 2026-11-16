"use client"
// src/app/dashboard/configuracoes/eligiclub/page.tsx
// @eligi:cfg-club-v2
//
// COBRANCA DO ELIGICLUB — direcao B das Configuracoes (nov/2026).
// A conta de pagamentos do lojista no Asaas (subconta White Label), criada pelo
// Eligi via API. O lojista nunca sai do painel para abrir a conta.
//
// Uma situacao por vez, sempre com o que fazer:
//   nao ativada · falta cadastro (CNPJ/CEP/endereco) · em analise · recusada · ativa
//   + modo teste, so o dono, app, erro ao carregar.
//
// Regras de quem pode: so o dono ativa e envia documento (o back recusa os outros).
// Saldo, saque, chave Pix e antecipacao ficam no modulo do clube (aba Financeiro).
// Erro ao carregar NUNCA vira "nao ativada": mostraria a ativacao a quem ja tem conta.

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import {
  ChevronLeft, ChevronRight, Check, Loader2, Link2, MessageCircle, ExternalLink,
  RefreshCw, ShieldCheck, Wallet, CircleAlert, Lock,
} from 'lucide-react'
import api from '@/shared/lib/apiClient'
import { typography } from '@/shared/theme'
import { useAuth } from '@/hooks/useAuth'
import { waLink, clubPaymentMessage } from '@/shared/utils/whatsapp'
import AsaasSeal, { AsaasSupportNote } from '@/shared/components/AsaasSeal'
import { useCanBuyPlan } from '@/shared/utils/useEligiApp'

// ── tipos ───────────────────────────────────────────────────────────────────
type Missing = 'CNPJ' | 'CEP' | 'ADDRESS'
interface AccountOnboarding {
  connected: boolean
  accountId: string | null
  status: string
  approved: boolean
  onboardingUrl: string | null
  pendingDocs: string[]
  pendingDocIds?: { id: string; type: string }[]
  isento: boolean
  /** back antigo nao manda: tratar como lista vazia */
  missing?: Missing[]
}
interface PendingSub {
  id: string
  status: string
  value: number | null
  plan: { name: string; price: number } | null
  client: { name: string; phone: string | null } | null
}
interface PaymentLink {
  checkoutUrl: string | null
  businessName: string
  clientName: string
  clientPhone: string | null
}
type CompanyType = 'MEI' | 'LIMITED'
type Load = { state: 'loading' } | { state: 'error' } | { state: 'ok'; acc: AccountOnboarding }
type ApiErr = { response?: { status?: number; data?: { error?: string | { message?: string }; code?: string } } }

// ── helpers ─────────────────────────────────────────────────────────────────
/** Espelha CLUB_ACTIVATION_FEE no back (billing.service.ts). Mudou la, muda aqui. */
const CLUB_ACTIVATION_FEE = 12.9

const DOC_LABEL: Record<string, string> = {
  IDENTIFICATION: 'Documento com foto (RG ou CNH)',
  SELFIE: 'Selfie do titular',
  SOCIAL_CONTRACT: 'Contrato social',
  ENTREPRENEUR_REQUIREMENT: 'Requerimento de empresário',
  MINUTES_OF_ELECTION: 'Ata de eleição',
  CUSTOM: 'Documento adicional',
}
const docLabel = (t: string) => DOC_LABEL[t] ?? t.replace(/_/g, ' ').toLowerCase()

const MISSING_LABEL: Record<Missing, string> = {
  CNPJ: 'CNPJ do negócio',
  CEP: 'CEP',
  ADDRESS: 'Endereço (rua)',
}

const onlyDigits = (v: string) => v.replace(/\D/g, '')
function maskPhone(v: string): string {
  const d = onlyDigits(v).slice(0, 11)
  if (d.length <= 2) return d
  if (d.length <= 7) return `(${d.slice(0, 2)}) ${d.slice(2)}`
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`
}
function maskMoney(v: string): string {
  const d = onlyDigits(v).slice(0, 11)
  if (!d) return ''
  return (Number(d) / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}
const moneyToNumber = (v: string) => Number(onlyDigits(v)) / 100
const brl = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

function errMsg(e: unknown, fallback: string): string {
  const err = (e as ApiErr)?.response?.data?.error
  if (typeof err === 'string' && err) return err
  if (err && typeof err === 'object' && err.message) return err.message
  return fallback
}
const errCode = (e: unknown) => (e as ApiErr)?.response?.data?.code ?? null
const errStatus = (e: unknown) => (e as ApiErr)?.response?.status ?? null

function fetchAccount(force = false): Promise<AccountOnboarding> {
  return api
    .get(`/club-subscriptions/asaas/account-status${force ? '?force=1' : ''}`)
    .then((r) => {
      const d = r.data?.data as AccountOnboarding | undefined
      if (!d) throw new Error('resposta sem dados')
      return d
    })
}
function fetchPending(): Promise<PendingSub[]> {
  return api
    .get('/club-subscriptions?status=PENDING')
    .then((r) => ((r.data?.data ?? []) as PendingSub[]).filter((s) => s.status === 'PENDING'))
}

// ── estilos ─────────────────────────────────────────────────────────────────
const INK = '#111114'
const INK_2 = '#4b4b52'
const INK_3 = '#6b6b73'

const CSS = `
.cfc{ max-width:640px; font-family:${typography.fontFamily}; color:${INK}; animation:cfc-in .25s ease; }
@keyframes cfc-in{ from{opacity:0; transform:translateY(6px)} to{opacity:1; transform:none} }
@keyframes cfc-pulse{ 0%,100%{opacity:.5} 50%{opacity:1} }
@keyframes cfc-spin{ to{ transform:rotate(360deg) } }
.cfc *{ box-sizing:border-box; }
.cfc :where(span, div, b, i, p, h1, h2, h3, strong, small, label, li){ color:inherit; } /* vence main span */
.cfc a{ text-decoration:none; color:inherit; }
.cfc button{ font-family:inherit; cursor:pointer; -webkit-tap-highlight-color:transparent; }
.cfc a:focus-visible, .cfc button:focus-visible, .cfc input:focus-visible{ outline:2px solid #dc2626; outline-offset:2px; }
.cfc-d{ font-family:${typography.fontFamilyDisplay}; letter-spacing:-.03em; }
.cfc-n{ font-variant-numeric:tabular-nums; }
.cfc-spin{ animation:cfc-spin .9s linear infinite; }
.cfc-back{ display:inline-flex; align-items:center; gap:4px; min-height:44px; padding:0 10px 0 4px; margin-left:-4px; border-radius:12px; font-size:14px; font-weight:500; color:${INK_2}; }
.cfc-h1{ margin:4px 0 0; font-size:28px; font-weight:600; }
.cfc-lead{ margin:6px 0 0; font-size:14px; line-height:1.45; color:${INK_3}; }
.cfc-cap{ margin:24px 0 8px; font-family:${typography.fontFamilyMono}; font-size:11px; letter-spacing:.08em; text-transform:uppercase; font-weight:500; color:${INK_3}; }
.cfc-card{ background:#fff; border:1px solid #ececf0; border-radius:18px; padding:18px; }
.cfc-top{ display:flex; align-items:flex-start; justify-content:space-between; gap:12px; flex-wrap:wrap; }
.cfc-t{ font-size:20px; font-weight:600; line-height:1.2; }
.cfc-p{ margin:8px 0 0; font-size:14px; line-height:1.5; color:${INK_2}; }
.cfc-pill{ display:inline-flex; align-items:center; gap:6px; min-height:28px; padding:0 10px; border-radius:99px; font-size:12.5px; font-weight:600; white-space:nowrap; }
.cfc-pill i{ width:7px; height:7px; border-radius:50%; background:currentColor; }
.cfc-pill.ok{ background:#ecfdf5; color:#0f6e56; }
.cfc-pill.warn{ background:#fffbeb; color:#b45309; }
.cfc-pill.bad{ background:#fef2f2; color:#b91c1c; }
.cfc-pill.neutral{ background:#f2f2f5; color:${INK_2}; }
.cfc-note{ margin-top:14px; display:flex; gap:10px; align-items:flex-start; padding:12px 14px; border-radius:14px; font-size:13.5px; line-height:1.5; background:#f7f7f9; color:${INK_2}; }
.cfc-note.warn{ background:#fffbeb; color:#92400e; }
.cfc-note.bad{ background:#fef2f2; color:#991b1b; }
.cfc-note svg{ flex-shrink:0; margin-top:2px; }
.cfc-cta{ display:inline-flex; align-items:center; justify-content:center; gap:8px; min-height:48px; padding:0 18px; border-radius:14px; border:0; background:${INK}; color:#fff !important; font-size:15px; font-weight:600; }
.cfc-cta.block{ width:100%; }
.cfc-cta:disabled{ opacity:.5; cursor:default; }
.cfc-sec{ display:inline-flex; align-items:center; justify-content:center; gap:7px; min-height:44px; padding:0 14px; border-radius:12px; border:1px solid #e3e3e8; background:#fff; font-size:14px; font-weight:600; color:${INK}; }
.cfc-sec:disabled{ opacity:.55; cursor:default; }
@media (hover:hover){ .cfc-sec:not(:disabled):hover{ border-color:#cfcfd6; background:#fafafb; } }
.cfc-actions{ margin-top:16px; display:flex; gap:8px; flex-wrap:wrap; }
.cfc-actions > *{ flex:1 1 200px; }

/* passos da analise */
.cfc-steps{ margin:16px 0 0; padding:0; list-style:none; display:flex; flex-direction:column; }
.cfc-step{ display:flex; gap:12px; align-items:flex-start; padding:10px 0; font-size:14px; line-height:1.4; }
.cfc-step + .cfc-step{ border-top:1px solid #f4f4f6; }
.cfc-step-n{ width:26px; height:26px; flex-shrink:0; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:12.5px; font-weight:700; background:#f2f2f5; color:${INK_2}; }
.cfc-step.done .cfc-step-n{ background:#ecfdf5; color:#0f6e56; }
.cfc-step.now .cfc-step-n{ background:${INK}; color:#fff; }
.cfc-step small{ display:block; margin-top:2px; font-size:13px; color:${INK_3}; }
.cfc-docs{ margin:8px 0 0; padding:0; list-style:none; display:flex; flex-direction:column; gap:6px; }
.cfc-docs li{ display:flex; gap:8px; align-items:center; font-size:13.5px; color:${INK_2}; }
.cfc-docs li i{ width:6px; height:6px; border-radius:50%; background:#b45309; flex-shrink:0; }

/* falta cadastro */
.cfc-miss{ margin:14px 0 0; padding:0; list-style:none; display:flex; flex-direction:column; gap:8px; }
.cfc-miss li{ display:flex; align-items:center; gap:10px; font-size:14px; color:${INK}; }
.cfc-miss li i{ width:18px; height:18px; border-radius:50%; border:2px solid #d97706; flex-shrink:0; }

/* valor + perguntas */
.cfc-fee{ display:flex; align-items:baseline; justify-content:space-between; gap:12px; flex-wrap:wrap; }
.cfc-fee b{ font-size:15px; font-weight:600; }
.cfc-fee span{ font-size:26px; font-weight:700; letter-spacing:-.035em; }
.cfc-faq{ border:1px solid #ececf0; border-radius:18px; background:#fff; overflow:hidden; }
.cfc-faq > div{ padding:14px 16px; }
.cfc-faq > div + div{ border-top:1px solid #f0f0f3; }
.cfc-faq b{ display:block; font-size:14px; font-weight:600; }
.cfc-faq p{ margin:4px 0 0; font-size:13.5px; line-height:1.5; color:${INK_3}; }

/* formulario */
.cfc-lbl{ display:block; margin:16px 0 6px; font-size:13px; font-weight:600; color:${INK_2}; }
.cfc-lbl small{ font-weight:400; color:${INK_3}; }
.cfc-in{ width:100%; min-height:48px; padding:0 14px; border:1px solid #dcdce2; border-radius:12px; font-size:16px; font-family:inherit; background:#fff; color:${INK}; -webkit-appearance:none; appearance:none; }
.cfc-in:focus{ border-color:${INK}; outline:none; }
.cfc-in[aria-invalid="true"]{ border-color:#dc2626; }
.cfc-help{ margin-top:6px; font-size:12.5px; line-height:1.45; color:${INK_3}; }
.cfc-fielderr{ margin-top:6px; font-size:12.5px; color:#b91c1c; }
.cfc-row{ display:grid; grid-template-columns:minmax(0,1fr) minmax(0,2fr); gap:10px; }
.cfc-seg{ display:grid; grid-template-columns:1fr 1fr; gap:8px; }
.cfc-seg button{ min-height:48px; border-radius:12px; border:1px solid #dcdce2; background:#fff; font-size:15px; font-weight:500; color:${INK}; }
.cfc-seg button[aria-checked="true"]{ border:2px solid ${INK}; font-weight:600; }

/* assinaturas aguardando */
.cfc-sub{ padding:14px 0; }
.cfc-sub + .cfc-sub{ border-top:1px solid #f0f0f3; }
.cfc-sub-n{ font-size:15px; font-weight:600; }
.cfc-sub-m{ margin-top:2px; font-size:13px; color:${INK_3}; }
.cfc-sub-a{ margin-top:10px; display:flex; gap:8px; }
.cfc-sub-a > *{ flex:1; }
.cfc-go{ margin-top:10px; display:flex; align-items:center; gap:12px; min-height:64px; padding:12px 16px; border-radius:18px; border:1px solid #ececf0; background:#fff; }
@media (hover:hover){ .cfc-go:hover{ border-color:#d6d6dc; } }
.cfc-go-i{ width:40px; height:40px; border-radius:12px; background:#f2f2f5; display:flex; align-items:center; justify-content:center; flex-shrink:0; color:${INK_2}; }
.cfc-go-t{ flex:1; min-width:0; }
.cfc-go-t b{ display:block; font-size:15px; font-weight:600; }
.cfc-go-t small{ display:block; margin-top:2px; font-size:13px; color:${INK_3}; }

.cfc-trust{ margin-top:22px; display:flex; gap:8px; align-items:flex-start; font-size:12.5px; line-height:1.5; color:${INK_3}; }
.cfc-skel{ border-radius:18px; background:#f2f2f5; animation:cfc-pulse 1.2s ease-in-out infinite; }
.cfc-toast{ position:fixed; left:50%; transform:translateX(-50%); bottom:calc(64px + env(safe-area-inset-bottom) + 14px); z-index:10000; padding:11px 16px; border-radius:12px; font-size:14px; font-weight:500; font-family:${typography.fontFamily}; box-shadow:0 8px 24px rgba(17,17,20,.18); max-width:calc(100vw - 32px); }
.cfc-toast.ok{ background:${INK}; color:#fff; }
.cfc-toast.err{ background:#fff; color:#a32d2d; border:1px solid #f1d0d0; }
@media (min-width:1024px){ .cfc-toast{ bottom:24px; left:calc(50% + var(--sidebar-width, 0px) / 2); } }
@media (max-width:379px){ .cfc-row{ grid-template-columns:1fr; } .cfc-h1{ font-size:25px; } }
@media (prefers-reduced-motion:reduce){ .cfc, .cfc-skel, .cfc-spin{ animation:none; } }
`

// ── pagina ──────────────────────────────────────────────────────────────────
type Toast = { kind: 'ok' | 'err'; text: string }

export default function EligiClubCobrancaPage() {
  const { user } = useAuth()
  const isOwner = user?.role === 'BUSINESS_OWNER'
  const canBuy = useCanBuyPlan()

  const [load, setLoad] = useState<Load>({ state: 'loading' })
  const [refreshing, setRefreshing] = useState(false)
  const [toast, setToast] = useState<Toast | null>(null)

  useEffect(() => {
    let vivo = true
    fetchAccount()
      .then((acc) => { if (vivo) setLoad({ state: 'ok', acc }) })
      .catch((e) => { console.error('[cobranca-clube] carregar', e); if (vivo) setLoad({ state: 'error' }) })
    return () => { vivo = false }
  }, [])

  useEffect(() => {
    if (!toast) return
    const t = window.setTimeout(() => setToast(null), 3200)
    return () => window.clearTimeout(t)
  }, [toast])

  const retry = () => {
    setLoad({ state: 'loading' })
    fetchAccount()
      .then((acc) => setLoad({ state: 'ok', acc }))
      .catch((e) => { console.error('[cobranca-clube] carregar', e); setLoad({ state: 'error' }) })
  }

  /** "Atualizar situacao": consulta o Asaas agora, ignorando o atalho de 5 min. */
  const refresh = useCallback(() => {
    setRefreshing(true)
    fetchAccount(true)
      .then((acc) => { setLoad({ state: 'ok', acc }); setToast({ kind: 'ok', text: 'Situação atualizada.' }) })
      .catch((e) => {
        console.error('[cobranca-clube] atualizar', e)
        setToast({ kind: 'err', text: 'Não foi possível atualizar agora. Tente em instantes.' })
      })
      .finally(() => setRefreshing(false))
  }, [])

  const acc = load.state === 'ok' ? load.acc : null
  const rejected = !!acc?.connected && !acc.approved && acc.status === 'REJECTED'
  const inReview = !!acc?.connected && !acc.approved && !rejected

  return (
    <div className="cfc">
      <style>{CSS}</style>
      <Link href="/dashboard/configuracoes" className="cfc-back"><ChevronLeft size={18} aria-hidden /> Configurações</Link>
      <h1 className="cfc-h1 cfc-d">Cobrança do EligiClub</h1>
      <p className="cfc-lead">A conta de pagamentos que recebe as mensalidades do clube no cartão do cliente.</p>

      {load.state === 'loading' && (
        <div aria-busy="true" aria-label="Carregando" style={{ marginTop: 22, display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div className="cfc-skel" style={{ height: 150 }} />
          <div className="cfc-skel" style={{ height: 220 }} />
        </div>
      )}

      {load.state === 'error' && (
        <div className="cfc-card" role="alert" style={{ marginTop: 22 }}>
          <div className="cfc-p" style={{ marginTop: 0 }}>Não foi possível carregar a situação da sua conta de pagamentos.</div>
          <button type="button" className="cfc-cta" style={{ marginTop: 14 }} onClick={retry}>Tentar de novo</button>
        </div>
      )}

      {acc?.isento && (
        <div className="cfc-note" style={{ marginTop: 18 }}>
          <CircleAlert size={16} aria-hidden />
          <span><b>Modo teste.</b> As cobranças do clube são simuladas e não geram pagamento de verdade.</span>
        </div>
      )}

      {acc && !acc.connected && (
        <NotConnected acc={acc} isOwner={isOwner} canBuy={canBuy}
          onActivated={(next) => { setLoad({ state: 'ok', acc: next }); setToast({ kind: 'ok', text: 'Conta de pagamentos criada.' }) }} />
      )}

      {acc && inReview && <InReview acc={acc} isOwner={isOwner} refreshing={refreshing} onRefresh={refresh} />}

      {acc && rejected && (
        <>
          <p className="cfc-cap">Situação</p>
          <div className="cfc-card">
            <div className="cfc-top">
              <div className="cfc-t cfc-d">Conta recusada</div>
              <span className="cfc-pill bad"><i aria-hidden />Recusada pelo Asaas</span>
            </div>
            <p className="cfc-p">
              O Asaas não aprovou a sua conta de pagamentos, então o clube ainda não cobra no cartão.
              Fale com o suporte do Asaas informando o CNPJ do negócio para saber o motivo e como corrigir.
            </p>
            <div className="cfc-actions">
              <a className="cfc-sec" href="tel:08000090037">Ligar 0800 009 0037</a>
              <a className="cfc-sec" href="mailto:contato@asaas.com.br">Enviar e-mail</a>
            </div>
            <button type="button" className="cfc-sec" style={{ marginTop: 8, width: '100%' }} onClick={refresh} disabled={refreshing}>
              <RefreshCw size={15} aria-hidden className={refreshing ? 'cfc-spin' : undefined} />
              {refreshing ? 'Atualizando…' : 'Atualizar situação'}
            </button>
          </div>
        </>
      )}

      {acc?.approved && <Approved isOwner={isOwner} onToast={setToast} />}

      {acc && (
        <>
          <div className="cfc-trust">
            <ShieldCheck size={15} aria-hidden style={{ flexShrink: 0, marginTop: 2 }} />
            <span>O dinheiro cai na conta do seu negócio no Asaas, não passa pelo Eligi. Os dados do cartão ficam com o Asaas; o Eligi nunca os guarda.</span>
          </div>
          <AsaasSeal variant="positivo" />
          <AsaasSupportNote />
        </>
      )}

      {toast && <div className={`cfc-toast ${toast.kind}`} role="status" aria-live="polite">{toast.text}</div>}
    </div>
  )
}

// ── 1. nao ativada ──────────────────────────────────────────────────────────
function NotConnected({ acc, isOwner, canBuy, onActivated }: {
  acc: AccountOnboarding
  isOwner: boolean
  canBuy: boolean
  onActivated: (acc: AccountOnboarding) => void
}) {
  const missing = acc.missing ?? []

  return (
    <>
      <p className="cfc-cap">Situação</p>
      <div className="cfc-card">
        <div className="cfc-top">
          <div className="cfc-t cfc-d">Cobrança desligada</div>
          <span className="cfc-pill neutral"><i aria-hidden />Não ativada</span>
        </div>
        <p className="cfc-p">
          Com a conta ativa, as mensalidades do clube são cobradas no cartão do cliente todo mês, sem você lembrar ninguém.
        </p>
        {!isOwner && (
          <div className="cfc-note"><Lock size={16} aria-hidden /><span>Só o dono do estabelecimento ativa a cobrança do clube.</span></div>
        )}
        {isOwner && !canBuy && (
          <div className="cfc-note"><CircleAlert size={16} aria-hidden /><span>A ativação não é feita pelo app. Abra o Eligi no navegador para ativar.</span></div>
        )}
      </div>

      {isOwner && canBuy && missing.length > 0 && (
        <>
          <p className="cfc-cap">Antes de ativar</p>
          <div className="cfc-card">
            <div className="cfc-t cfc-d" style={{ fontSize: 17 }}>Complete o cadastro do negócio</div>
            <p className="cfc-p">O Asaas usa estes dados para abrir a conta em nome do seu negócio. Falta:</p>
            <ul className="cfc-miss">
              {missing.map((m) => <li key={m}><i aria-hidden />{MISSING_LABEL[m]}</li>)}
            </ul>
            <Link href="/dashboard/configuracoes/empresa" className="cfc-cta block" style={{ marginTop: 16 }}>
              Completar perfil e endereço <ChevronRight size={17} aria-hidden />
            </Link>
          </div>
        </>
      )}

      {isOwner && canBuy && (
        <>
          <p className="cfc-cap">Quanto custa</p>
          <div className="cfc-card">
            <div className="cfc-fee">
              <b>Ativação da conta</b>
              <span className="cfc-d cfc-n">{brl(CLUB_ACTIVATION_FEE)}</span>
            </div>
            <p className="cfc-p">
              Uma única vez. Você não paga nada agora: o valor entra na sua próxima mensalidade do Eligi.
              Se o Asaas não aprovar a conta, a cobrança é cancelada antes de vencer.
            </p>
          </div>

          <p className="cfc-cap">Perguntas comuns</p>
          <div className="cfc-faq">
            <div><b>O dinheiro passa pelo Eligi?</b><p>Não. A conta é aberta no Asaas, em nome do seu negócio. O valor cai direto lá.</p></div>
            <div><b>Quanto tempo leva?</b><p>O Asaas analisa em até 48h depois que você envia os documentos. Você acompanha por esta tela.</p></div>
            <div><b>O cliente pode cancelar?</b><p>Pode, quando quiser. Ele fica com o plano até o fim do mês já pago e não é cobrado de novo.</p></div>
          </div>

          {missing.length === 0 && <ActivateForm onActivated={onActivated} />}
        </>
      )}
    </>
  )
}

type Field = 'mobilePhone' | 'email' | 'addressNumber' | 'province' | 'income'
const FIELD_ORDER: Field[] = ['mobilePhone', 'email', 'addressNumber', 'province', 'income']

function ActivateForm({ onActivated }: { onActivated: (acc: AccountOnboarding) => void }) {
  const [companyType, setCompanyType] = useState<CompanyType>('MEI')
  const [mobilePhone, setMobilePhone] = useState('')
  const [email, setEmail] = useState('')
  const [addressNumber, setAddressNumber] = useState('')
  const [province, setProvince] = useState('')
  const [income, setIncome] = useState('')
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState<Partial<Record<Field, string>>>({})
  const [formError, setFormError] = useState<string | null>(null)

  function validate(): Partial<Record<Field, string>> {
    const e: Partial<Record<Field, string>> = {}
    if (onlyDigits(mobilePhone).length < 10) e.mobilePhone = 'Informe um celular com DDD.'
    if (email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) e.email = 'E-mail inválido.'
    if (!addressNumber.trim()) e.addressNumber = 'Informe o número.'
    if (!province.trim()) e.province = 'Informe o bairro.'
    if (!(moneyToNumber(income) > 0)) e.income = 'Informe o faturamento mensal aproximado.'
    return e
  }

  function submit(ev: React.FormEvent) {
    ev.preventDefault()
    if (saving) return
    const e = validate()
    setErrors(e)
    setFormError(null)
    const first = FIELD_ORDER.find((k) => e[k])
    if (first) { document.getElementById(`cfc-${first}`)?.focus(); return }

    setSaving(true)
    api.post('/club-subscriptions/asaas/provision', {
      companyType,
      mobilePhone: onlyDigits(mobilePhone),
      addressNumber: addressNumber.trim(),
      province: province.trim(),
      incomeValue: moneyToNumber(income),
      ...(email.trim() ? { email: email.trim() } : {}),
    })
      .then(() => fetchAccount(true))
      .then((acc) => onActivated(acc))
      .catch((err: unknown) => {
        console.error('[cobranca-clube] ativar', err)
        if (errStatus(err) === 403) { setFormError('Só o dono do estabelecimento ativa a cobrança.'); return }
        if (errCode(err) === 'ASAAS_EMAIL_IN_USE') {
          setErrors({ email: errMsg(err, 'Este e-mail já tem conta no Asaas. Use outro.') })
          window.setTimeout(() => document.getElementById('cfc-email')?.focus(), 30)
          return
        }
        setFormError(errMsg(err, 'Não foi possível ativar a cobrança. Tente de novo.'))
      })
      .finally(() => setSaving(false))
  }

  const fieldProps = (k: Field) => ({
    id: `cfc-${k}`,
    className: 'cfc-in',
    'aria-invalid': errors[k] ? true : undefined,
    'aria-describedby': errors[k] ? `cfc-${k}-err` : undefined,
  })
  const fieldErr = (k: Field) => (errors[k] ? <div id={`cfc-${k}-err`} className="cfc-fielderr">{errors[k]}</div> : null)

  return (
    <>
      <p className="cfc-cap">Ativar a cobrança</p>
      <form className="cfc-card" onSubmit={submit} noValidate>
        <p className="cfc-p" style={{ marginTop: 0 }}>
          Confirme alguns dados do negócio. O Eligi abre a conta no Asaas por você.
        </p>

        <span className="cfc-lbl" id="cfc-type-l">Tipo de empresa</span>
        <div className="cfc-seg" role="radiogroup" aria-labelledby="cfc-type-l">
          <button type="button" role="radio" aria-checked={companyType === 'MEI'} onClick={() => setCompanyType('MEI')}>MEI</button>
          <button type="button" role="radio" aria-checked={companyType === 'LIMITED'} onClick={() => setCompanyType('LIMITED')}>LTDA / ME</button>
        </div>

        <label className="cfc-lbl" htmlFor="cfc-mobilePhone">Celular do responsável</label>
        <input {...fieldProps('mobilePhone')} value={mobilePhone} onChange={(e) => setMobilePhone(maskPhone(e.target.value))}
          placeholder="(11) 99999-9999" inputMode="numeric" autoComplete="tel" />
        {fieldErr('mobilePhone')}

        <label className="cfc-lbl" htmlFor="cfc-email">E-mail da conta de pagamentos <small>(opcional)</small></label>
        <input {...fieldProps('email')} value={email} onChange={(e) => setEmail(e.target.value)}
          placeholder="Em branco = o e-mail da sua conta" inputMode="email" autoComplete="email" type="email" />
        {fieldErr('email') ?? <div className="cfc-help">Já tem conta no Asaas? Use outro e-mail aqui: cada conta precisa de um e-mail próprio.</div>}

        <div className="cfc-row">
          <div>
            <label className="cfc-lbl" htmlFor="cfc-addressNumber">Número</label>
            <input {...fieldProps('addressNumber')} value={addressNumber} onChange={(e) => setAddressNumber(e.target.value)} placeholder="123" />
            {fieldErr('addressNumber')}
          </div>
          <div>
            <label className="cfc-lbl" htmlFor="cfc-province">Bairro</label>
            <input {...fieldProps('province')} value={province} onChange={(e) => setProvince(e.target.value)} placeholder="Centro" />
            {fieldErr('province')}
          </div>
        </div>

        <label className="cfc-lbl" htmlFor="cfc-income">Faturamento mensal aproximado</label>
        <input {...fieldProps('income')} value={income} onChange={(e) => setIncome(maskMoney(e.target.value))}
          placeholder="R$ 5.000,00" inputMode="numeric" />
        {fieldErr('income') ?? <div className="cfc-help">Exigido pelo Asaas para a análise do cadastro.</div>}

        {formError && <div className="cfc-note bad" role="alert"><CircleAlert size={16} aria-hidden /><span>{formError}</span></div>}

        <button type="submit" className="cfc-cta block" style={{ marginTop: 18 }} disabled={saving}>
          {saving && <Loader2 size={16} aria-hidden className="cfc-spin" />}
          {saving ? 'Criando a conta…' : 'Ativar cobrança'}
        </button>
      </form>
    </>
  )
}

// ── 2. em analise ───────────────────────────────────────────────────────────
function InReview({ acc, isOwner, refreshing, onRefresh }: {
  acc: AccountOnboarding
  isOwner: boolean
  refreshing: boolean
  onRefresh: () => void
}) {
  const docs = Array.from(new Set([...(acc.pendingDocIds ?? []).map((d) => d.type), ...acc.pendingDocs]))
  const awaiting = acc.status === 'AWAITING_APPROVAL' || (docs.length === 0 && !acc.onboardingUrl)

  return (
    <>
      <p className="cfc-cap">Situação</p>
      <div className="cfc-card">
        <div className="cfc-top">
          <div className="cfc-t cfc-d">Conta em análise</div>
          <span className="cfc-pill warn"><i aria-hidden />{awaiting ? 'Aguardando o Asaas' : 'Faltam documentos'}</span>
        </div>
        <p className="cfc-p">A cobrança no cartão é liberada assim que o Asaas aprovar a conta.</p>

        <ol className="cfc-steps">
          <li className="cfc-step done">
            <span className="cfc-step-n" aria-hidden><Check size={14} /></span>
            <div>Conta criada<small>A conta do seu negócio já existe no Asaas.</small></div>
          </li>
          <li className={`cfc-step ${awaiting ? 'done' : 'now'}`}>
            <span className="cfc-step-n" aria-hidden>{awaiting ? <Check size={14} /> : '2'}</span>
            <div>
              Enviar documentos
              <small>{awaiting ? 'Nada pendente do seu lado.' : 'Leva uns 2 minutos, pelo site seguro do Asaas.'}</small>
              {!awaiting && docs.length > 0 && (
                <ul className="cfc-docs">
                  {docs.map((t) => <li key={t}><i aria-hidden />{docLabel(t)}</li>)}
                </ul>
              )}
            </div>
          </li>
          <li className={`cfc-step ${awaiting ? 'now' : ''}`}>
            <span className="cfc-step-n" aria-hidden>3</span>
            <div>Análise do Asaas<small>Até 48h depois do envio. A aprovação aparece aqui.</small></div>
          </li>
        </ol>

        {!awaiting && !isOwner && (
          <div className="cfc-note"><Lock size={16} aria-hidden /><span>Só o dono do estabelecimento envia os documentos.</span></div>
        )}
        {!awaiting && isOwner && acc.onboardingUrl && (
          <a className="cfc-cta block" style={{ marginTop: 14 }} href={acc.onboardingUrl} target="_blank" rel="noopener noreferrer">
            Enviar documentos <ExternalLink size={16} aria-hidden />
          </a>
        )}
        {!awaiting && isOwner && !acc.onboardingUrl && (
          <div className="cfc-note warn">
            <CircleAlert size={16} aria-hidden />
            <span>
              O link de envio expirou ou já foi usado. Peça um novo ao suporte do Asaas pelo <b>0800 009 0037</b> ou{' '}
              <a href="mailto:contato@asaas.com.br" style={{ textDecoration: 'underline' }}>contato@asaas.com.br</a>, informando o CNPJ do negócio.
            </span>
          </div>
        )}

        <button type="button" className="cfc-sec" style={{ marginTop: 10, width: '100%' }} onClick={onRefresh} disabled={refreshing}>
          <RefreshCw size={15} aria-hidden className={refreshing ? 'cfc-spin' : undefined} />
          {refreshing ? 'Atualizando…' : 'Atualizar situação'}
        </button>
      </div>
    </>
  )
}

// ── 3. ativa ────────────────────────────────────────────────────────────────
type PendingLoad = { state: 'loading' } | { state: 'error' } | { state: 'ok'; subs: PendingSub[] }

function Approved({ isOwner, onToast }: { isOwner: boolean; onToast: (t: Toast) => void }) {
  const [pend, setPend] = useState<PendingLoad>({ state: 'loading' })
  const [busyId, setBusyId] = useState<string | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  useEffect(() => {
    let vivo = true
    fetchPending()
      .then((subs) => { if (vivo) setPend({ state: 'ok', subs }) })
      .catch((e) => { console.error('[cobranca-clube] pendentes', e); if (vivo) setPend({ state: 'error' }) })
    return () => { vivo = false }
  }, [])

  useEffect(() => {
    if (!copiedId) return
    const t = window.setTimeout(() => setCopiedId(null), 2200)
    return () => window.clearTimeout(t)
  }, [copiedId])

  const retryPending = () => {
    setPend({ state: 'loading' })
    fetchPending()
      .then((subs) => setPend({ state: 'ok', subs }))
      .catch((e) => { console.error('[cobranca-clube] pendentes', e); setPend({ state: 'error' }) })
  }

  /** O link e buscado na hora: link guardado pode expirar no Asaas. */
  function getLink(id: string): Promise<PaymentLink | null> {
    setBusyId(id)
    return api.get(`/club-subscriptions/${id}/payment-link`)
      .then((r) => {
        const d = (r.data?.data ?? null) as PaymentLink | null
        if (!d?.checkoutUrl) { onToast({ kind: 'err', text: 'Link de pagamento indisponível para esta assinatura.' }); return null }
        return d
      })
      .catch((e) => { console.error('[cobranca-clube] link', e); onToast({ kind: 'err', text: errMsg(e, 'Não foi possível buscar o link.') }); return null })
      .finally(() => setBusyId(null))
  }

  function copy(id: string) {
    void getLink(id).then((d) => {
      if (!d?.checkoutUrl) return
      navigator.clipboard.writeText(d.checkoutUrl)
        .then(() => { setCopiedId(id); onToast({ kind: 'ok', text: 'Link copiado.' }) })
        .catch(() => onToast({ kind: 'err', text: 'Não foi possível copiar. Tente o WhatsApp.' }))
    })
  }

  function whats(id: string) {
    // a aba abre antes da espera: aberta depois de um await, o navegador bloqueia
    const win = window.open('', '_blank')
    void getLink(id).then((d) => {
      if (!d?.checkoutUrl || !d.clientPhone) { win?.close(); return }
      const url = waLink(d.clientPhone, clubPaymentMessage(d.clientName, d.businessName, d.checkoutUrl))
      if (win) { win.opener = null; win.location.href = url } else { window.location.href = url }
    })
  }

  const subs = pend.state === 'ok' ? pend.subs : []

  return (
    <>
      <p className="cfc-cap">Situação</p>
      <div className="cfc-card">
        <div className="cfc-top">
          <div className="cfc-t cfc-d">Cobrança ativa</div>
          <span className="cfc-pill ok"><i aria-hidden />Conta aprovada</span>
        </div>
        <p className="cfc-p">As mensalidades do clube são cobradas no cartão do cliente todo mês e caem na conta do seu negócio no Asaas.</p>
      </div>

      {isOwner && (
        <Link href="/dashboard/eligiclub?tab=financeiro" className="cfc-go">
          <span className="cfc-go-i"><Wallet size={19} aria-hidden /></span>
          <span className="cfc-go-t"><b>Saldo, saque e antecipação</b><small>No clube, aba Financeiro</small></span>
          <ChevronRight size={18} aria-hidden style={{ color: INK_3 }} />
        </Link>
      )}

      <p className="cfc-cap">Aguardando o 1º pagamento</p>
      <div className="cfc-card">
        {pend.state === 'loading' && <div className="cfc-skel" style={{ height: 64 }} aria-label="Carregando" />}
        {pend.state === 'error' && (
          <div role="alert">
            <div className="cfc-p" style={{ marginTop: 0 }}>Não foi possível carregar as assinaturas.</div>
            <button type="button" className="cfc-sec" style={{ marginTop: 10 }} onClick={retryPending}>Tentar de novo</button>
          </div>
        )}
        {pend.state === 'ok' && subs.length === 0 && (
          <div className="cfc-p" style={{ marginTop: 0 }}>Ninguém esperando. Quem você assina no cartão aparece aqui até pagar a 1ª mensalidade.</div>
        )}
        {subs.length > 0 && (
          <>
            <div className="cfc-p" style={{ marginTop: 0 }}>Envie o link para o cliente pagar e cadastrar o cartão.</div>
            <div style={{ marginTop: 6 }}>
              {subs.map((s) => {
                const busy = busyId === s.id
                return (
                  <div key={s.id} className="cfc-sub">
                    <div className="cfc-sub-n">{s.client?.name ?? 'Cliente'}</div>
                    <div className="cfc-sub-m cfc-n">{s.plan?.name ?? 'Plano'} · {brl(s.value ?? s.plan?.price ?? 0)}/mês</div>
                    <div className="cfc-sub-a">
                      <button type="button" className="cfc-sec" disabled={busy} onClick={() => copy(s.id)}>
                        {busy ? <Loader2 size={15} aria-hidden className="cfc-spin" /> : copiedId === s.id ? <Check size={15} aria-hidden /> : <Link2 size={15} aria-hidden />}
                        {copiedId === s.id ? 'Copiado' : 'Copiar link'}
                      </button>
                      {s.client?.phone && (
                        <button type="button" className="cfc-sec" disabled={busy} onClick={() => whats(s.id)}>
                          <MessageCircle size={15} aria-hidden /> WhatsApp
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </>
        )}
      </div>
    </>
  )
}
