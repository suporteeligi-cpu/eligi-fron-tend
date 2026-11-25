'use client'
// src/app/dashboard/eligiclub/components/ClubMemberDetailModal.tsx
// @eligi:club-ficha-b — ficha do membro do EligiClub, direcao B (nov/2026).
//
// Branca. No computador abre como painel a direita; no celular, como folha entre
// a navbar e a barra de baixo. No topo, a situacao em palavras e as acoes que
// resolvem: Cobrar, WhatsApp e Recebi no balcao. Depois vencimento, plano, uso no
// ciclo e pagamentos; cancelar fica no fim.
//
// Regras que nao mudaram (estao no back):
//   - Cobrar so aparece quando o membro esta na fila (`charge`), a mesma lista de
//     GET /club-subscriptions/cobrar. Em dia, o back recusa com 409.
//   - Recebi no balcao: plano manual sempre; cartao so atrasado (o back baixa a
//     cobranca vencida no Asaas). Cartao em dia: o Asaas renova sozinho.
//   - Mudar vencimento: so manual. Trocar plano e cancelar: o back confere o cargo.
//   - Cancelar com dinheiro no pote do mes pergunta o que fazer com ele.

import { useState, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import {
  X, Loader2, AlertCircle, Banknote, Smartphone, CreditCard, Check, Link2, Send, Pencil, Ban, HandCoins,
} from 'lucide-react'

import api from '@/shared/lib/apiClient'
import { waLink, clubPaymentMessage } from '@/shared/utils/whatsapp'
import { colors, inkLight } from '@/shared/theme'
import { effectiveSubStatus } from '../clubStatus'
import ClubDueDateSheet from './ClubDueDateSheet'
import ClubPlanChangeSheet, { ClubPlanPendingBanner } from './ClubPlanChangeSheet'
import CobrarSheet, { chargeChip, type CobrarItem } from './CobrarSheet'

// ── tipos (espelham o back / page.tsx) ──────────────────────────────────────
type SubStatus = 'PENDING' | 'ACTIVE' | 'PAST_DUE' | 'CANCELED'
// excludedFromPoolAt e os campos do recebivel vem do SUB_INCLUDE (payments sem `select`)
interface ClubPayment {
  id: string
  amount: number
  periodKey: string
  method: string | null
  paidAt: string | null
  excludedFromPoolAt?: string | null
  anticipationStatus?: string | null
  anticipationFee?: number | null
  anticipationNetValue?: number | null
  anticipationDays?: number | null
  anticipationOriginalCreditDate?: string | null
  creditDate?: string | null
  netValue?: number | null
  billingTypeReal?: string | null
}
interface ClubSubscription {
  id: string
  status: SubStatus
  value: number | null
  billingType: string | null
  asaasSubscriptionId?: string | null
  pendingPlanId?: string | null
  startedAt: string | null
  currentPeriodEnd: string | null
  canceledAt: string | null
  plan: { id: string; name: string; price: number; staffSharePct: number; color: string | null }
  client: { id: string; name: string; phone: string | null }
  payments?: ClubPayment[]
  _count?: { payments: number; fichas: number }
}

type Method = 'DINHEIRO' | 'PIX' | 'CARTAO'
const METHODS: { key: Method; label: string; Icon: typeof Banknote }[] = [
  { key: 'DINHEIRO', label: 'Dinheiro', Icon: Banknote },
  { key: 'PIX',      label: 'Pix',      Icon: Smartphone },
  { key: 'CARTAO',   label: 'Cartão',   Icon: CreditCard },
]

type Tone = 'ok' | 'warn' | 'bad' | 'info' | 'neutral'
const TONE: Record<Tone, { text: string; bg: string; border: string }> = {
  ok:      { text: '#0f6e56', bg: '#ecfdf5', border: '#a7f3d0' },
  warn:    { text: '#92400e', bg: '#fffbeb', border: '#fde68a' },
  bad:     { text: '#991b1b', bg: '#fef2f2', border: '#fecaca' },
  info:    { text: '#1e40af', bg: '#eff6ff', border: '#bfdbfe' },
  neutral: { text: '#5b5b63', bg: '#f5f5f7', border: 'rgba(17,17,20,.08)' },
}
const CHIP_TONE: Record<string, Tone> = { 'c-hoje': 'neutral', 'c-atraso': 'warn', 'c-cartao': 'bad', 'c-aguarda': 'info' }

const fmtBRL = (n: number) => n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
const TZ = 'America/Sao_Paulo'
const fmtDia = (iso: string | null | undefined) =>
  iso ? new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', timeZone: TZ }) : null
const fmtDate = (iso: string | null | undefined) =>
  iso ? new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric', timeZone: TZ }) : '—'
const iniciais = (name: string) => name.trim().split(/\s+/).slice(0, 2).map(w => w[0]?.toUpperCase() ?? '').join('')

/**
 * periodKey do mes corrente em BRT, mesmo formato do back (YYYY-MM).
 * NAO usar toISOString(): no dia 31 as 22h de Brasilia ja e dia 1 em UTC.
 */
function currentPeriodKeyBR(): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: TZ, year: 'numeric', month: '2-digit' }).format(new Date()).slice(0, 7)
}
/** Quanto esta assinatura colocou no pote do mes corrente e ainda conta. */
function poteDoMes(payments: ClubPayment[], staffSharePct: number): { valor: number; qtd: number } {
  const atual = currentPeriodKeyBR()
  const noMes = payments.filter(p => p.periodKey === atual && !p.excludedFromPoolAt)
  const valor = noMes.reduce((s, p) => s + p.amount * (staffSharePct / 100), 0)
  return { valor: Math.round(valor * 100) / 100, qtd: noMes.length }
}

/** Forma que o CLIENTE escolheu no checkout. Cai pro `method` no registro manual. */
const FORMA: Record<string, string> = {
  CREDIT_CARD: 'Crédito', DEBIT_CARD: 'Débito', PIX: 'Pix', BOLETO: 'Boleto',
  DINHEIRO: 'Dinheiro', CARTAO: 'Cartão', MANUAL: 'Manual',
}
function formaLabel(billingTypeReal?: string | null, method?: string | null): string | null {
  if (billingTypeReal === 'RECEIVED_IN_CASH') return FORMA[method ?? ''] ?? 'Balcão'
  const bruto = billingTypeReal ?? method ?? null
  if (!bruto || bruto === 'ASAAS' || bruto === 'UNDEFINED') return null
  return FORMA[bruto] ?? bruto
}

// Date.now() nao pode ser chamado no corpo de um componente (React Compiler
// purity). Roda uma vez no carregamento do modulo; so muda de sentido na virada do dia.
const AGORA_MS = Date.now()

/** Situacao em palavras, com o tom que a cor carrega. */
function situacao(sub: ClubSubscription, charge: CobrarItem | null | undefined): { tone: Tone; title: string; detail: string } {
  const card = !!sub.asaasSubscriptionId
  const valor = fmtBRL(sub.value ?? sub.plan.price)
  if (sub.status === 'CANCELED') {
    return { tone: 'neutral', title: 'Cancelado', detail: sub.canceledAt ? `Desde ${fmtDate(sub.canceledAt)}` : 'Não é mais membro' }
  }
  if (charge) {
    const chip = chargeChip(charge)
    const venc = charge.dueDay ? `${charge.dueDay.slice(8, 10)}/${charge.dueDay.slice(5, 7)}` : null
    const detail = charge.state === 'AGUARDANDO_1O'
      ? `${valor} · ${card ? 'link do cartão ainda não pago' : 'ainda não pagou'}`
      : charge.state === 'VENCE_HOJE'
        ? `${valor} · plano manual, cobre hoje`
        : `${valor}${venc ? ` · venceu ${venc}` : ''}${card ? ' · o cartão foi recusado' : ''}`
    return { tone: CHIP_TONE[chip.cls] ?? 'warn', title: chip.text, detail }
  }
  const eff = effectiveSubStatus(sub)
  if (eff === 'PAST_DUE') {
    return { tone: card ? 'bad' : 'warn', title: 'Atrasado', detail: `${valor} · venceu ${fmtDia(sub.currentPeriodEnd) ?? '—'}` }
  }
  if (eff === 'PENDING') {
    return { tone: 'info', title: 'Falta o 1º pagamento', detail: card ? 'Assinou agora: o link do cartão está com ele' : 'Ainda não pagou' }
  }
  const quando = fmtDia(sub.currentPeriodEnd)
  return {
    tone: 'ok',
    title: 'Em dia',
    detail: card
      ? `Próxima cobrança no cartão ${quando ?? '—'} · o Asaas cobra sozinho`
      : `Renova ${quando ?? '—'} · ${valor} no balcão ou Pix`,
  }
}

const CSS = `
.cf{position:fixed;inset:0;z-index:9990;display:flex;align-items:flex-end;justify-content:center;font-family:var(--font-sans);color:#111114}
.cf *{box-sizing:border-box}
.cf :where(span,div,b,p,small,strong,label){color:inherit}
.cf .bd{position:absolute;inset:0;background:rgba(17,17,20,.36);border:0;opacity:0;transition:opacity .2s ease}
.cf.on .bd{opacity:1}
.cf .pn{position:relative;z-index:9991;background:#fff;width:100%;max-height:calc(100dvh - 104px - 64px - env(safe-area-inset-bottom));margin-bottom:calc(64px + env(safe-area-inset-bottom));border-radius:22px 22px 0 0;display:flex;flex-direction:column;overflow:hidden;transform:translateY(24px);opacity:0;transition:transform .24s cubic-bezier(.22,1,.36,1),opacity .2s ease}
.cf.on .pn{transform:none;opacity:1}
@media(min-width:1024px){
  .cf{justify-content:flex-end;align-items:stretch}
  .cf .pn{width:480px;max-width:100vw;max-height:none;height:100dvh;margin:0;border-radius:0;transform:translateX(32px);box-shadow:-12px 0 40px rgba(17,17,20,.12)}
}
@media (prefers-reduced-motion:reduce){.cf .pn,.cf .bd{transition:none}}
.cf .hd{display:flex;align-items:center;gap:12px;padding:16px 16px 14px;border-bottom:1px solid rgba(17,17,20,.07)}
@media(min-width:1024px){.cf .hd{padding:20px 22px 16px}}
.cf .av{width:44px;height:44px;border-radius:999px;flex-shrink:0;background:#111114;color:#fff;display:flex;align-items:center;justify-content:center;font:600 15px var(--font-sans)}
.cf .av span{color:#fff}
.cf .nm{margin:0;font-family:var(--font-display);font-size:20px;font-weight:600;letter-spacing:-.03em;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.cf .sub{font-size:13px;color:#5b5b63}
.cf .mono{font-family:var(--font-mono);font-size:11px;letter-spacing:.06em;text-transform:uppercase;font-weight:600;color:#5b5b63}
.cf .x{width:44px;height:44px;border-radius:12px;border:0;background:#f0f0f3;display:flex;align-items:center;justify-content:center;cursor:pointer;flex-shrink:0}
.cf .bdy{flex:1;overflow-y:auto;-webkit-overflow-scrolling:touch;padding:16px;display:flex;flex-direction:column;gap:14px}
@media(min-width:1024px){.cf .bdy{padding:18px 22px 22px}}
.cf .sit{border-radius:16px;padding:14px 16px;display:flex;flex-direction:column;gap:4px;border:1px solid}
.cf .sit .t{font-family:var(--font-display);font-size:24px;font-weight:600;letter-spacing:-.03em}
.cf .sit .d{font-size:13px}
.cf .acts{display:flex;flex-wrap:wrap;gap:8px}
.cf .acts .btn{flex:1 1 auto}
.cf .btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;min-height:44px;padding:0 14px;border-radius:12px;font:600 14px var(--font-sans);border:1px solid rgba(17,17,20,.12);background:#fff;color:#111114;cursor:pointer;text-decoration:none;-webkit-tap-highlight-color:transparent;white-space:nowrap}
.cf .btn-ink{background:#111114;color:#fff;border-color:#111114}
.cf .btn-ink span{color:#fff}
.cf .btn:disabled{opacity:.5;cursor:default}
.cf .btn-on{border-color:#111114;box-shadow:inset 0 0 0 1px #111114}
.cf .card{border:1px solid rgba(17,17,20,.08);border-radius:16px;background:#fff}
.cf .li{display:flex;align-items:center;gap:12px;padding:12px 14px;border-bottom:1px solid rgba(17,17,20,.07);min-height:56px}
.cf .li:last-child{border-bottom:0}
.cf .li .k{flex:1;min-width:0;display:flex;flex-direction:column;gap:2px}
.cf .li .v{font-weight:600;font-size:15px}
.cf .num{font-family:var(--font-display);font-variant-numeric:tabular-nums;letter-spacing:-.02em;font-weight:600}
.cf .lnk{min-height:40px;padding:0 12px;border-radius:10px;border:1px solid rgba(17,17,20,.12);background:#fff;font:600 13px var(--font-sans);color:#111114;cursor:pointer;display:inline-flex;align-items:center;gap:6px;flex-shrink:0}
.cf .lnk:disabled{color:#8a8a93;cursor:default}
.cf .pay{border-radius:16px;background:#f5f5f7;padding:14px;display:flex;flex-direction:column;gap:10px}
.cf .inp{width:100%;min-height:44px;border-radius:12px;border:1px solid rgba(17,17,20,.14);background:#fff;font:600 16px var(--font-sans);padding:0 14px 0 40px;text-align:right;font-variant-numeric:tabular-nums;color:#111114}
.cf .meth{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:6px}
.cf .note{display:flex;gap:8px;align-items:flex-start;border-radius:12px;padding:10px 12px;font-size:13px;line-height:1.45}
.cf .err{color:#991b1b;font-size:13px;display:flex;gap:6px;align-items:center}
.cf .ft{flex-shrink:0;padding:12px 16px calc(12px + env(safe-area-inset-bottom));border-top:1px solid rgba(17,17,20,.07);background:#fff}
@media(min-width:1024px){.cf .ft{padding:14px 22px}}
.cf .danger{color:#b91c1c}
.cf .danger-fill{background:#b91c1c;border-color:#b91c1c;color:#fff}
.cf .danger-fill span{color:#fff}
@keyframes cf-spin{to{transform:rotate(360deg)}}
.cf .spin{animation:cf-spin .8s linear infinite}
`

interface Props {
  initialSub: ClubSubscription
  isMobile:   boolean
  /** Item da fila de cobranca, quando o membro esta nela. Sem ele, Cobrar nao aparece. */
  charge?:    CobrarItem | null
  onUpdated:  (sub: ClubSubscription) => void
  /** Chamado depois de enviar uma cobranca (a fila muda). */
  onCharged?: () => void
  onClose:    () => void
}

export default function ClubMemberDetailModal({ initialSub, isMobile, charge, onUpdated, onCharged, onClose }: Props) {
  const [sub, setSub] = useState<ClubSubscription>(initialSub)
  const [mounted, setMounted] = useState(false)

  const [payOpen, setPayOpen] = useState(false)
  const [payAmountStr, setPayAmountStr] = useState(String(initialSub.value ?? initialSub.plan.price))
  // sem padrao: a forma de pagamento e escolhida de proposito (relatorios dependem dela)
  const [payMethod, setPayMethod] = useState<Method | null>(null)
  const [paying, setPaying] = useState(false)
  const [paySuccess, setPaySuccess] = useState(false)
  const [payError, setPayError] = useState<string | null>(null)

  const [linkData, setLinkData] = useState<{ checkoutUrl: string | null; businessName: string; clientName: string; clientPhone: string | null } | null>(null)
  const [linkCopied, setLinkCopied] = useState(false)

  const [cobrando, setCobrando] = useState(false)
  const [confirmCancel, setConfirmCancel] = useState(false)
  const [poolAction, setPoolAction] = useState<'KEEP' | 'REMOVE' | null>(null)
  const [canceling, setCanceling] = useState(false)
  const [cancelError, setCancelError] = useState<string | null>(null)
  const [dueOpen, setDueOpen] = useState(false)
  const [dueCardNote, setDueCardNote] = useState(false)
  const [planOpen, setPlanOpen] = useState(false)
  const [usage, setUsage] = useState<{ cycleEnd: string; services: { serviceId: string; name: string; limit: number | null; used: number }[] } | null>(null)

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 10)
    return () => clearTimeout(t)
  }, [])

  // detalhe completo (pagamentos)
  useEffect(() => {
    let alive = true
    api.get(`/club-subscriptions/${initialSub.id}`)
      .then(res => {
        const data = res.data?.data ?? res.data
        if (alive && data && data.id) setSub(data as ClubSubscription)
      })
      .catch(err => console.error('[club-ficha] detalhe falhou', err))
    return () => { alive = false }
  }, [initialSub.id])

  // uso do ciclo por servico
  useEffect(() => {
    if (initialSub.status === 'CANCELED') return
    let alive = true
    api.get(`/club-subscriptions/${initialSub.id}/usage`)
      .then(res => { if (alive) setUsage((res.data?.data ?? res.data) as typeof usage) })
      .catch(err => console.error('[club-ficha] uso falhou', err))
    return () => { alive = false }
  }, [initialSub.id, initialSub.status])

  const isCanceled = sub.status === 'CANCELED'
  const isCard = !!sub.asaasSubscriptionId
  // Cartao sem item na fila (acabou de assinar, ou atrasado e ainda nao na fila):
  // o link da fatura em aberto continua disponivel para reenviar.
  const wantsLink = isCard && !charge && (sub.status === 'PENDING' || sub.status === 'PAST_DUE')

  useEffect(() => {
    if (!wantsLink) return
    let alive = true
    api.get(`/club-subscriptions/${sub.id}/payment-link`)
      .then(res => { if (alive) setLinkData((res.data?.data ?? null) as typeof linkData) })
      .catch(err => { console.error('[club-ficha] link falhou', err); if (alive) setLinkData(null) })
    return () => { alive = false }
  }, [sub.id, wantsLink])

  const handleClose = useCallback(() => {
    setMounted(false)
    setTimeout(onClose, 200)
  }, [onClose])

  const subOpen = cobrando || dueOpen || planOpen
  useEffect(() => {
    if (subOpen) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') handleClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [subOpen, handleClose])

  const apply = useCallback((data: ClubSubscription) => { setSub(data); onUpdated(data) }, [onUpdated])

  const payAmount = parseFloat(payAmountStr.replace(',', '.')) || 0
  const registerPayment = useCallback(async () => {
    setPayError(null)
    if (!payMethod) { setPayError('Escolha como ele pagou.'); return }
    if (!isCard && payAmount < 0) { setPayError('Valor inválido.'); return }
    setPaying(true)
    try {
      const body = isCard ? { method: payMethod } : { amount: payAmount, method: payMethod }
      const res = await api.post(`/club-subscriptions/${sub.id}/payments`, body)
      apply((res.data?.data ?? res.data) as ClubSubscription)
      // feedback explicito: sem ele o lojista clicava de novo (pagamento duplicado em prod)
      setPaySuccess(true)
      setPayMethod(null)
      window.setTimeout(() => { setPaySuccess(false); setPayOpen(false) }, 3000)
      onCharged?.()
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: string; message?: string } } }
      setPayError(e.response?.data?.error ?? e.response?.data?.message ?? 'Não foi possível registrar o pagamento.')
    } finally {
      setPaying(false)
    }
  }, [sub.id, isCard, payAmount, payMethod, apply, onCharged])

  const cancelSub = useCallback(async () => {
    setCancelError(null)
    setCanceling(true)
    try {
      const res = await api.post(`/club-subscriptions/${sub.id}/cancel`, poolAction ? { poolAction } : {})
      apply((res.data?.data ?? res.data) as ClubSubscription)
      setConfirmCancel(false)
      onCharged?.()
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: string; message?: string } } }
      setCancelError(e.response?.data?.error ?? e.response?.data?.message ?? 'Não foi possível cancelar.')
    } finally {
      setCanceling(false)
    }
  }, [sub.id, poolAction, apply, onCharged])

  const copyLink = useCallback(async () => {
    if (!linkData?.checkoutUrl) return
    try {
      await navigator.clipboard.writeText(linkData.checkoutUrl)
      setLinkCopied(true)
      window.setTimeout(() => setLinkCopied(false), 2200)
    } catch { setLinkCopied(false) }
  }, [linkData])

  const sit = situacao(sub, charge)
  const tone = TONE[sit.tone]
  const payments = sub.payments ?? []
  const pote = poteDoMes(payments, sub.plan.staffSharePct)
  const canBalcao = !isCanceled && (!isCard || sub.status === 'PAST_DUE')
  const phone = sub.client.phone
  const linkWhats = linkData?.checkoutUrl && linkData.clientPhone
    ? waLink(linkData.clientPhone, clubPaymentMessage(linkData.clientName, linkData.businessName, linkData.checkoutUrl))
    : null
  const effStatus = effectiveSubStatus(sub)
  const limited = !!usage && usage.services.some(s => s.limit != null)

  const content = (
    <div className={`cf${mounted ? ' on' : ''}`} role="dialog" aria-modal="true" aria-labelledby="cf-nome">
      <style>{CSS}</style>
      <button className="bd" aria-label="Fechar" onClick={handleClose} />
      <div className="pn">
        <div className="hd">
          <div className="av" aria-hidden="true"><span>{iniciais(sub.client.name)}</span></div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h2 id="cf-nome" className="nm">{sub.client.name}</h2>
            <div className="sub">{sub.plan.name} · {isCard ? 'Cartão' : 'Manual'}{phone ? ` · ${phone}` : ''}</div>
          </div>
          <button className="x" aria-label="Fechar" onClick={handleClose}><X size={20} /></button>
        </div>

        <div className="bdy">
          {/* situacao + acoes */}
          <div className="sit" style={{ background: tone.bg, borderColor: tone.border, color: tone.text }}>
            <div className="mono" style={{ color: tone.text }}>Situação</div>
            <div className="t">{sit.title}</div>
            <div className="d">{sit.detail}</div>
          </div>

          {!isCanceled && (charge || phone || canBalcao) && (
            <div className="acts">
              {charge && (
                <button className="btn btn-ink" onClick={() => setCobrando(true)}><span>Cobrar</span></button>
              )}
              {charge ? (
                <button className="btn" onClick={() => setCobrando(true)}><Send size={17} />WhatsApp</button>
              ) : phone ? (
                <a className="btn" href={waLink(phone)} target="_blank" rel="noopener noreferrer"><Send size={17} />WhatsApp</a>
              ) : null}
              {canBalcao && (
                <button className={`btn${payOpen ? ' btn-on' : ''}`} aria-expanded={payOpen} onClick={() => { setPayOpen(v => !v); setPayError(null) }}>
                  <HandCoins size={17} />Recebi no balcão
                </button>
              )}
            </div>
          )}

          {canBalcao && payOpen && (
            <div className="pay">
              {isCard && (
                <div className="note" style={{ background: TONE.warn.bg, color: TONE.warn.text }}>
                  <AlertCircle size={16} style={{ flexShrink: 0, marginTop: 1 }} />
                  <span>O cartão está atrasado. Se ele pagou aqui, confirme: a cobrança vencida é baixada no Asaas e deixa de ser cobrada dele. O valor é o da cobrança.</span>
                </div>
              )}
              {!isCard && (
                <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <span className="mono">Valor recebido</span>
                  <span style={{ position: 'relative', display: 'block' }}>
                    <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', fontSize: 14, fontWeight: 600, color: '#5b5b63' }}>R$</span>
                    <input className="inp" value={payAmountStr} inputMode="decimal" aria-label="Valor recebido"
                      onChange={e => setPayAmountStr(e.target.value.replace(/[^\d,.]/g, ''))} />
                  </span>
                </label>
              )}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <span className="mono">Como pagou</span>
                <div className="meth" role="radiogroup" aria-label="Como pagou">
                  {METHODS.map(({ key, label, Icon }) => (
                    <button key={key} role="radio" aria-checked={payMethod === key}
                      className={`btn${payMethod === key ? ' btn-on' : ''}`} style={{ padding: '0 8px' }}
                      onClick={() => setPayMethod(key)}>
                      <Icon size={16} />{label}
                    </button>
                  ))}
                </div>
              </div>
              {payError && <div className="err"><AlertCircle size={14} />{payError}</div>}
              {paySuccess ? (
                <div className="note" style={{ background: TONE.ok.bg, color: TONE.ok.text }}>
                  <Check size={16} style={{ flexShrink: 0, marginTop: 1 }} />
                  <span>Pagamento registrado. O plano renovou: não precisa registrar de novo.</span>
                </div>
              ) : (
                <button className="btn btn-ink" disabled={paying || !payMethod} onClick={() => void registerPayment()}>
                  {paying ? <Loader2 size={16} className="spin" /> : <Check size={16} />}
                  <span>{paying ? 'Registrando' : 'Confirmar recebimento'}</span>
                </button>
              )}
            </div>
          )}

          {wantsLink && linkData?.checkoutUrl && (
            <div className="card">
              <div className="li">
                <div className="k">
                  <span className="mono">Link de pagamento</span>
                  <span className="sub" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Fatura em aberto mais antiga</span>
                </div>
                <button className="lnk" onClick={() => void copyLink()}>{linkCopied ? <Check size={15} /> : <Link2 size={15} />}{linkCopied ? 'Copiado' : 'Copiar'}</button>
                {linkWhats && <a className="lnk" href={linkWhats} target="_blank" rel="noopener noreferrer"><Send size={15} />Enviar</a>}
              </div>
            </div>
          )}

          {/* vencimento e plano */}
          <div className="card">
            <div className="li">
              <div className="k">
                <span className="mono">{effStatus === 'PAST_DUE' ? 'Venceu em' : 'Vencimento'}</span>
                <span className="v">{fmtDate(sub.currentPeriodEnd)}</span>
              </div>
              {!isCanceled && sub.currentPeriodEnd && (
                <button className="lnk" onClick={() => (isCard ? setDueCardNote(v => !v) : setDueOpen(true))}>
                  <Pencil size={14} />Mudar
                </button>
              )}
            </div>
            {dueCardNote && isCard && (
              <div className="li" style={{ minHeight: 0 }}>
                <span className="sub" style={{ color: inkLight.warn.text }}>Plano no cartão: o vencimento segue a cobrança automática do Asaas e não muda por aqui.</span>
              </div>
            )}
            <div className="li">
              <div className="k">
                <span className="mono">Plano</span>
                <span className="v">{sub.plan.name} <span className="num" style={{ fontWeight: 500, color: '#5b5b63', fontSize: 14 }}>· {fmtBRL(sub.value ?? sub.plan.price)}/mês</span></span>
              </div>
              {!isCanceled && <button className="lnk" onClick={() => setPlanOpen(true)}>Trocar</button>}
            </div>
            <div className="li">
              <div className="k"><span className="mono">Desde</span><span className="v">{fmtDate(sub.startedAt)}</span></div>
              <div style={{ textAlign: 'right' }}>
                <div className="mono">Fichas</div>
                <div className="num" style={{ fontSize: 18 }}>{sub._count?.fichas ?? 0}</div>
              </div>
            </div>
          </div>

          {!isCanceled && sub.pendingPlanId && (
            <ClubPlanPendingBanner
              subId={sub.id}
              pendingPlanId={sub.pendingPlanId}
              dueIso={sub.currentPeriodEnd}
              isCard={isCard}
              onPlanLoaded={p => setPayAmountStr(String(p.price))}
              onSaved={data => { const s = data as ClubSubscription; apply(s); setPayAmountStr(String(s.value ?? s.plan.price)) }}
            />
          )}

          {/* uso no ciclo */}
          {!isCanceled && usage && usage.services.length > 0 && (
            <div className="card">
              <div className="li" style={{ minHeight: 0 }}>
                <span className="mono">Uso neste ciclo · até {fmtDia(usage.cycleEnd) ?? '—'}</span>
              </div>
              {usage.services.map(s => {
                const cheio = s.limit != null && s.used >= s.limit
                return (
                  <div key={s.serviceId} className="li" style={{ minHeight: 48 }}>
                    <span style={{ flex: 1, minWidth: 0, fontSize: 14, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{s.name}</span>
                    <span className="num" style={{ fontSize: 15, color: s.limit == null ? '#5b5b63' : cheio ? TONE.warn.text : '#111114' }}>
                      {s.limit == null ? (limited ? `${s.used} · à vontade` : `${s.used}`) : `${s.used} de ${s.limit}`}
                    </span>
                  </div>
                )
              })}
            </div>
          )}

          {/* pagamentos */}
          <div className="card">
            <div className="li" style={{ minHeight: 0 }}>
              <span className="mono">Pagamentos · {sub._count?.payments ?? payments.length}</span>
            </div>
            {payments.length === 0 ? (
              <div className="li"><span className="sub">Nenhum pagamento registrado.</span></div>
            ) : payments.map(p => {
              const forma = formaLabel(p.billingTypeReal, p.method)
              return (
                <div key={p.id} className="li" style={{ alignItems: 'flex-start' }}>
                  <div className="k">
                    <span style={{ fontSize: 14, fontWeight: 600 }}>{fmtDate(p.paidAt)}{forma ? ` · ${forma}` : ''}</span>
                    <RecebivelLinha p={p} />
                  </div>
                  <span className="num" style={{ fontSize: 15 }}>{fmtBRL(p.amount)}</span>
                </div>
              )
            })}
          </div>
        </div>

        {!isCanceled && (
          <div className="ft">
            {cancelError && <div className="err" style={{ marginBottom: 8 }}><AlertCircle size={14} />{cancelError}</div>}
            {confirmCancel ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ fontSize: 14, color: '#4b4b52' }}>
                  Cancelar a assinatura de <b>{sub.client.name}</b>? Ele deixa de ser membro.
                </div>
                {pote.valor > 0 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <div style={{ fontSize: 13, color: '#4b4b52', lineHeight: 1.5 }}>
                      Este mês ele pagou e <b className="num">{fmtBRL(pote.valor)}</b> {pote.qtd > 1 ? 'estão' : 'está'} no pote da equipe.
                    </div>
                    <PoolOption on={poolAction === 'KEEP'} onClick={() => setPoolAction('KEEP')}
                      titulo="O pagamento foi real" texto="O valor fica no pote. A equipe atendeu este mês." cor={TONE.ok.text} />
                    <PoolOption on={poolAction === 'REMOVE'} onClick={() => setPoolAction('REMOVE')}
                      titulo="Foi teste ou engano" texto={`Tira ${fmtBRL(pote.valor)} do pote deste mês. O pagamento não é apagado.`} cor={TONE.warn.text} />
                  </div>
                )}
                <div style={{ display: 'flex', gap: 8 }}>
                  <button className="btn" style={{ flex: 1 }} disabled={canceling} onClick={() => setConfirmCancel(false)}>Voltar</button>
                  <button className="btn danger-fill" style={{ flex: 1 }} disabled={canceling || (pote.valor > 0 && !poolAction)} onClick={() => void cancelSub()}>
                    {canceling && <Loader2 size={16} className="spin" />}<span>{canceling ? 'Cancelando' : 'Sim, cancelar'}</span>
                  </button>
                </div>
              </div>
            ) : (
              <button className="btn danger" style={{ width: '100%' }} onClick={() => setConfirmCancel(true)}>
                <Ban size={16} />Cancelar assinatura
              </button>
            )}
          </div>
        )}
      </div>

      {cobrando && charge && (
        <CobrarSheet
          item={{ subId: sub.id, clientName: sub.client.name, planName: sub.plan.name, value: charge.value ?? sub.value }}
          onClose={() => setCobrando(false)}
          onDone={() => onCharged?.()}
        />
      )}
      {dueOpen && sub.currentPeriodEnd && (
        <ClubDueDateSheet
          subId={sub.id}
          currentPeriodEnd={sub.currentPeriodEnd}
          isMobile={isMobile}
          onSaved={data => apply(data as ClubSubscription)}
          onClose={() => setDueOpen(false)}
        />
      )}
      {planOpen && (
        <ClubPlanChangeSheet
          subId={sub.id}
          currentPlanId={sub.plan.id}
          pendingPlanId={sub.pendingPlanId ?? null}
          dueIso={sub.currentPeriodEnd}
          isCard={isCard}
          isMobile={isMobile}
          onSaved={data => apply(data as ClubSubscription)}
          onClose={() => setPlanOpen(false)}
        />
      )}
    </div>
  )

  if (typeof document === 'undefined') return null
  return createPortal(content, document.body)
}

// ── escopo de modulo (React Compiler) ────────────────────────────────────────
/**
 * Onde o dinheiro esta: ja entrou (verde), a caminho (ambar), sem data (nada).
 * Antecipado: selo + o caminho do dinheiro, com a data em que cairia.
 */
const ANT_COBRA = new Set(['PENDING', 'SCHEDULED', 'CREDITED', 'DEBITED', 'OVERDUE'])
function RecebivelLinha({ p }: { p: ClubPayment }) {
  const dia = fmtDia(p.creditDate)
  if (!dia && p.netValue == null) return null

  const antecipado = !!p.anticipationStatus && ANT_COBRA.has(p.anticipationStatus) && p.anticipationFee != null
  const creditado = p.anticipationStatus === 'CREDITED' || p.anticipationStatus === 'DEBITED'
  const entrou = p.creditDate ? new Date(p.creditDate).getTime() <= AGORA_MS : false
  const ficou = antecipado
    ? (p.anticipationNetValue ?? (p.netValue != null ? p.netValue - (p.anticipationFee ?? 0) : null))
    : (p.netValue ?? null)
  const cor = !dia && !antecipado ? colors.gray.dimText : entrou ? TONE.ok.text : TONE.warn.text
  const texto = entrou
    ? `Na conta desde ${dia}`
    : antecipado && !creditado
      ? 'Antecipação pedida · entra em até 2 dias úteis'
      : dia ? `Entra em ${dia}` : 'Liberação em processamento'
  const original = antecipado ? fmtDia(p.anticipationOriginalCreditDate) : null
  const taxaCartao = p.netValue != null ? p.amount - p.netValue : null

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', fontSize: 12, color: cor, fontWeight: 600 }}>
        <span style={{ width: 6, height: 6, borderRadius: '50%', flexShrink: 0, background: cor }} />
        <span>{texto}</span>
        {antecipado && (
          <span style={{ fontSize: 11, fontWeight: 600, padding: '1px 6px', borderRadius: 6, background: TONE.ok.bg, color: TONE.ok.text }}>Antecipado</span>
        )}
        {ficou != null && <span style={{ color: '#5b5b63', fontWeight: 500, fontVariantNumeric: 'tabular-nums' }}>· ficou {fmtBRL(ficou)}</span>}
      </div>
      {taxaCartao != null && ficou != null && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexWrap: 'wrap', fontSize: 12, color: '#5b5b63', fontVariantNumeric: 'tabular-nums' }}>
          <span>{fmtBRL(p.amount)}</span>
          <span aria-hidden="true">→</span>
          <span>cartão −{fmtBRL(taxaCartao)}</span>
          {antecipado && (
            <>
              <span aria-hidden="true">→</span>
              <span>antecipação −{fmtBRL(p.anticipationFee ?? 0)}{p.anticipationDays ? ` (${p.anticipationDays} dias)` : ''}</span>
            </>
          )}
          {original && <span>· cairia em {original}</span>}
        </div>
      )}
    </div>
  )
}

function PoolOption({ on, onClick, titulo, texto, cor }: { on: boolean; onClick: () => void; titulo: string; texto: string; cor: string }) {
  return (
    <button
      role="radio"
      aria-checked={on}
      onClick={onClick}
      style={{
        width: '100%', textAlign: 'left', display: 'flex', gap: 10, alignItems: 'flex-start',
        padding: '11px 12px', minHeight: 44, borderRadius: 12, cursor: 'pointer', fontFamily: 'inherit',
        background: '#fff', border: `1.5px solid ${on ? cor : 'rgba(17,17,20,.14)'}`, color: '#111114',
        WebkitTapHighlightColor: 'transparent',
      }}
    >
      <span style={{
        width: 18, height: 18, flexShrink: 0, marginTop: 1, borderRadius: '50%',
        border: `2px solid ${on ? cor : 'rgba(17,17,20,0.22)'}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        {on && <span style={{ width: 8, height: 8, borderRadius: '50%', background: cor }} />}
      </span>
      <span style={{ flex: 1, minWidth: 0 }}>
        <b style={{ display: 'block', fontSize: 14, fontWeight: 600 }}>{titulo}</b>
        <span style={{ display: 'block', fontSize: 13, color: '#5b5b63', lineHeight: 1.45, marginTop: 2 }}>{texto}</span>
      </span>
    </button>
  )
}
