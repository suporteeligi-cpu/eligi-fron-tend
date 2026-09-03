'use client'
// src/app/dashboard/eligiclub/components/ClubMemberDetailModal.tsx
//
// Detalhe de um membro do EligiClub: resumo (plano, valor, vencimento, fichas),
// histórico de pagamentos e ações — registrar pagamento (renova +1 mês via
// POST /:id/payments) e cancelar (POST /:id/cancel). Espelha a cromática dos
// outros modais do módulo. Lote 4.

import { useState, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import {
  X, Loader2, AlertCircle, Banknote, Smartphone, CreditCard, Hash, CalendarClock, Ban, Check, Link2, MessageCircle } from 'lucide-react'

import api from '@/shared/lib/apiClient'
import { waLink, clubPaymentMessage } from '@/shared/utils/whatsapp'
import { colors, typography, transitions, radius } from '@/shared/theme'

// ── tipos (espelham o back / page.tsx) ──────────────────────────────────────
type SubStatus = 'PENDING' | 'ACTIVE' | 'PAST_DUE' | 'CANCELED'
// @eligi:pote-cancel-tipo — excludedFromPoolAt ja vem do back (SUB_INCLUDE
// inclui payments sem `select`, entao o Prisma devolve todos os escalares)
interface ClubPayment {
  id: string
  amount: number
  periodKey: string
  method: string | null
  paidAt: string | null
  excludedFromPoolAt?: string | null
  // @eligi:recebivel-tipo — chegam do SUB_INCLUDE (payments sem `select`)
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
  { key: 'PIX',      label: 'PIX',      Icon: Smartphone },
  { key: 'CARTAO',   label: 'Cartão',   Icon: CreditCard },
]
const STATUS: Record<SubStatus, { label: string; color: string; bg: string }> = {
  ACTIVE:   { label: 'Ativo',     color: '#059669', bg: 'rgba(16,185,129,0.12)' },
  PENDING:  { label: 'Pendente',  color: '#D97706', bg: 'rgba(245,158,11,0.12)' },
  PAST_DUE: { label: 'Atrasado',  color: '#DC2626', bg: 'rgba(220,38,38,0.10)' },
  CANCELED: { label: 'Cancelado', color: '#6B7280', bg: 'rgba(107,114,128,0.14)' },
}
const fmtBRL = (n: number) => n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

// @eligi:pote-cancel-helpers
/**
 * periodKey do mes corrente em BRT — mesmo formato do back (YYYY-MM).
 * NAO usar toISOString(): ele devolve UTC, e no dia 31 as 22h de Brasilia ja e
 * dia 1 do mes seguinte em UTC — o pagamento seria comparado com o mes errado.
 */
function currentPeriodKeyBR(): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Sao_Paulo', year: 'numeric', month: '2-digit',
  }).format(new Date()).slice(0, 7)
}

/** Quanto esta assinatura colocou no pote do mes corrente e ainda conta. */
function poteDoMes(payments: ClubPayment[], staffSharePct: number): { valor: number; qtd: number } {
  const atual = currentPeriodKeyBR()
  const noMes = payments.filter(p => p.periodKey === atual && !p.excludedFromPoolAt)
  const valor = noMes.reduce((s, p) => s + p.amount * (staffSharePct / 100), 0)
  return { valor: Math.round(valor * 100) / 100, qtd: noMes.length }
}
// @eligi:recebivel-helpers
/** Forma que o CLIENTE escolheu no checkout. Cai pro `method` no registro manual. */
const FORMA: Record<string, string> = {
  CREDIT_CARD: 'Crédito',
  DEBIT_CARD:  'Débito',
  PIX:         'Pix',
  BOLETO:      'Boleto',
  DINHEIRO:    'Dinheiro',
  CARTAO:      'Cartão',
  MANUAL:      'Manual',
}
function formaLabel(billingTypeReal?: string | null, method?: string | null): string | null {
  const bruto = billingTypeReal ?? method ?? null
  if (!bruto || bruto === 'ASAAS' || bruto === 'UNDEFINED') return null
  return FORMA[bruto] ?? bruto
}
/**
 * dd/mm. creditDate foi gravado como MEIO-DIA UTC no back justamente para nao
 * deslocar o dia aqui — data pura do Asaas convertida com new Date(str) daria
 * meia-noite UTC, que em BRT e o dia anterior.
 */
// @eligi:recebivel-agora
// Date.now() NAO pode ser chamado no corpo de um componente (React Compiler
// purity — 4a vez que esse erro aparece no projeto). Aqui ele roda uma vez no
// carregamento do modulo, fora de qualquer render.
// O valor so muda de significado quando vira o dia; aba aberta na virada
// mantem o rotulo ate recarregar, o que e' irrelevante para "entra em 30/09".
const AGORA_MS = Date.now()

const fmtDia = (iso: string | null | undefined) =>
  iso ? new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }) : null

const fmtDate = (iso: string | null) =>
  iso ? new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'

interface Props {
  initialSub: ClubSubscription
  isMobile:   boolean
  onUpdated:  (sub: ClubSubscription) => void
  onClose:    () => void
}

export default function ClubMemberDetailModal({ initialSub, isMobile, onUpdated, onClose }: Props) {
  const [sub, setSub] = useState<ClubSubscription>(initialSub)
  const [mounted, setMounted] = useState(false)

  const [payAmountStr, setPayAmountStr] = useState(String(initialSub.value ?? initialSub.plan.price))
  const [payMethod, setPayMethod] = useState<Method>('DINHEIRO')
  const [paying, setPaying] = useState(false)
  // link de pagamento (assinatura recorrente) — buscado ao abrir o modal
  const [linkData, setLinkData] = useState<{ checkoutUrl: string | null; businessName: string; clientName: string; clientPhone: string | null } | null>(null)
  const [linkLoading, setLinkLoading] = useState(false)
  const [linkCopied, setLinkCopied] = useState(false)
  const [paySuccess, setPaySuccess] = useState(false)
  const [payError, setPayError] = useState<string | null>(null)

  const [confirmCancel, setConfirmCancel] = useState(false)
  // @eligi:pote-cancel-state — sem default: com dinheiro em jogo a escolha e deliberada
  const [poolAction, setPoolAction] = useState<'KEEP' | 'REMOVE' | null>(null)
  const [canceling, setCanceling] = useState(false)
  const [cancelError, setCancelError] = useState<string | null>(null)

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 10)
    return () => clearTimeout(t)
  }, [])

  // enriquece com o detalhe (payments[12])
  useEffect(() => {
    let cancelled = false
    api.get(`/club-subscriptions/${initialSub.id}`).then(res => {
      if (cancelled) return
      const data = res.data?.data ?? res.data
      if (data && data.id) setSub(data)
    }).catch(() => {})
    return () => { cancelled = true }
  }, [initialSub.id])

  function handleClose() {
    setMounted(false)
    setTimeout(onClose, 200)
  }

  const payAmount = parseFloat(payAmountStr.replace(',', '.')) || 0
  const isCanceled = sub.status === 'CANCELED'
  const st = STATUS[sub.status]

  // busca o link assim que o modal abre (so se a assinatura for recorrente)
  useEffect(() => {
    if (!sub.asaasSubscriptionId) return
    let alive = true
    setLinkLoading(true)
    api.get(`/club-subscriptions/${sub.id}/payment-link`)
      .then(res => {
        if (!alive) return
        setLinkData((res.data?.data ?? null) as typeof linkData)
      })
      .catch(() => { if (alive) setLinkData(null) })
      .finally(() => { if (alive) setLinkLoading(false) })
    return () => { alive = false }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sub.id, sub.asaasSubscriptionId])

  const copyLink = useCallback(async () => {
    if (!linkData?.checkoutUrl) return
    try {
      await navigator.clipboard.writeText(linkData.checkoutUrl)
      setLinkCopied(true)
      window.setTimeout(() => setLinkCopied(false), 2200)
    } catch { /* clipboard indisponivel */ }
  }, [linkData])

  const sendWhats = useCallback(() => {
    if (!linkData?.checkoutUrl || !linkData.clientPhone) return
    const msg = clubPaymentMessage(linkData.clientName, linkData.businessName, linkData.checkoutUrl)
    window.open(waLink(linkData.clientPhone, msg), '_blank', 'noopener,noreferrer')
  }, [linkData])


  const registerPayment = useCallback(async () => {
    setPayError(null)
    if (payAmount < 0) { setPayError('Valor inválido'); return }
    setPaying(true)
    try {
      const res = await api.post(`/club-subscriptions/${sub.id}/payments`, { amount: payAmount, method: payMethod })
      const data = res.data?.data ?? res.data
      setSub(data)
      onUpdated(data)
      // feedback explicito: sem isso o lojista nao sabia se deu certo e
      // clicava de novo (aconteceu em prod — pagamento em duplicidade).
      setPaySuccess(true)
      window.setTimeout(() => setPaySuccess(false), 3000)
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: string } } }
      setPayError(e.response?.data?.error ?? 'Erro ao registrar pagamento')
    } finally {
      setPaying(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sub.id, payAmount, payMethod])

  const cancelSub = useCallback(async () => {
    setCancelError(null)
    setCanceling(true)
    try {
      // @eligi:pote-cancel-send — sem valor no pote, o back usa o default KEEP
      const res = await api.post(`/club-subscriptions/${sub.id}/cancel`,
        poolAction ? { poolAction } : {})
      const data = res.data?.data ?? res.data
      setSub(data)
      onUpdated(data)
      setConfirmCancel(false)
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: string } } }
      setCancelError(e.response?.data?.error ?? 'Erro ao cancelar')
    } finally {
      setCanceling(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    // @eligi:pote-cancel-deps
  }, [sub.id, poolAction])

  const labelStyle: React.CSSProperties = {
    display: 'block', fontSize: 11, fontWeight: 700, color: colors.gray.dimText,
    textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: 6,
  }
  const inputStyle: React.CSSProperties = {
    width: '100%', boxSizing: 'border-box', padding: isMobile ? '11px 13px' : '10px 13px',
    borderRadius: 9, fontSize: 13, border: `1px solid ${colors.gray.borderMd}`, outline: 'none',
    fontFamily: typography.fontFamily, color: colors.gray[900], background: '#fff',
  }
  const initials = (name: string) => name.trim().split(/\s+/).slice(0, 2).map(w => w[0]?.toUpperCase() ?? '').join('')

  const payments = sub.payments ?? []
  // @eligi:pote-cancel-calc
  const pote = poteDoMes(payments, sub.plan.staffSharePct)

  const content = (
    <div
      onClick={handleClose}
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(3px)',
        zIndex: 9998, display: 'flex', alignItems: isMobile ? 'flex-end' : 'center', justifyContent: 'center',
        opacity: mounted ? 1 : 0, transition: 'opacity 0.2s ease', fontFamily: typography.fontFamily,
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: '#fff', width: isMobile ? '100%' : 500, maxWidth: '100%',
          maxHeight: isMobile ? '94vh' : '90vh', borderRadius: isMobile ? '20px 20px 0 0' : radius.lg,
          overflow: 'hidden', display: 'flex', flexDirection: 'column',
          transform: mounted ? 'translateY(0)' : isMobile ? 'translateY(100%)' : 'scale(0.97)',
          transition: `transform 0.25s ${transitions.spring ?? 'cubic-bezier(0.34,1.56,0.64,1)'}`,
          boxShadow: '0 -8px 40px rgba(0,0,0,0.20)',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '16px 20px', borderBottom: `1px solid ${colors.gray.border}`, flexShrink: 0 }}>
          <button onClick={handleClose} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 6, display: 'flex', WebkitTapHighlightColor: 'transparent' }}>
            <X size={20} color={colors.gray[700]} strokeWidth={2} />
          </button>
          <span style={{ width: 38, height: 38, borderRadius: '50%', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 760, color: '#fff', background: colors.red.gradient }}>
            {initials(sub.client.name)}
          </span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: colors.gray[900], letterSpacing: '-0.01em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{sub.client.name}</h2>
            {sub.client.phone && <div style={{ fontSize: 11.5, color: colors.gray.dimText }}>{sub.client.phone}</div>}
          </div>
          <span style={{ flexShrink: 0, fontSize: 10.5, fontWeight: 800, letterSpacing: '.04em', textTransform: 'uppercase', color: st.color, background: st.bg, borderRadius: 7, padding: '4px 9px' }}>{st.label}</span>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch', padding: isMobile ? 16 : 22, display: 'flex', flexDirection: 'column', gap: 18 }}>
          {/* Resumo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', borderRadius: 12, border: `1px solid ${colors.gray.border}`, position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: 0, left: 0, bottom: 0, width: 3, background: sub.plan.color ?? colors.red.DEFAULT }} />
            <div style={{ flex: 1, minWidth: 0, paddingLeft: 6 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: colors.gray[900] }}>{sub.plan.name}</div>
              <div style={{ fontSize: 11.5, color: colors.gray.dimText }}>{fmtBRL(sub.value ?? sub.plan.price)}/mês</div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10 }}>
            <Stat icon={<CalendarClock size={14} />} label="Vence em" value={fmtDate(sub.currentPeriodEnd)} />
            <Stat icon={<Hash size={14} />} label="Fichas" value={String(sub._count?.fichas ?? 0)} />
            <Stat icon={<Check size={14} />} label="Pagamentos" value={String(sub._count?.payments ?? payments.length)} />
          </div>

          {/* LINK DE PAGAMENTO — so para assinatura recorrente (tem id no Asaas).
              Antes o link so aparecia ao criar a assinatura e na tela de
              Configuracoes (e la, so para PENDING). O lojista que precisava
              reenviar depois — troca de cartao, cliente perdeu — nao tinha de onde tirar. */}
          {sub.asaasSubscriptionId && (
            <div style={{
              padding: 14, borderRadius: 12,
              background: 'rgba(255,255,255,.85)',
              border: '1px solid rgba(17,17,20,.07)',
              boxShadow: '0 4px 20px rgba(17,17,20,.05)',
            }}>
              <label style={labelStyle}>Link de pagamento</label>

              {linkLoading ? (
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  fontSize: 12.5, color: '#8a8a93', padding: '6px 0',
                }}>
                  <Loader2 size={14} style={{ animation: 'club-spin 0.8s linear infinite' }} />
                  Carregando link…
                </div>
              ) : linkData?.checkoutUrl ? (
                <>
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: 9,
                    background: '#f5f5f7', border: '1px solid rgba(17,17,20,.07)',
                    borderRadius: 10, padding: '10px 12px', marginBottom: 9,
                  }}>
                    <Link2 size={14} style={{ color: '#8a8a93', flexShrink: 0 }} />
                    <span style={{
                      flex: 1, minWidth: 0, fontSize: 11.5, color: '#4b4b52',
                      fontFamily: 'ui-monospace, monospace',
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}>
                      {linkData.checkoutUrl.replace(/^https?:\/\//, '')}
                    </span>
                  </div>

                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      onClick={copyLink}
                      style={{
                        flex: 1, minHeight: 44, borderRadius: 10, cursor: 'pointer',
                        border: `1px solid ${linkCopied ? 'rgba(16,185,129,.4)' : 'rgba(17,17,20,.12)'}`,
                        background: linkCopied ? '#ecfdf5' : '#fff',
                        color: linkCopied ? '#0f6e56' : '#4b4b52',
                        fontSize: 12.5, fontWeight: 600, fontFamily: 'inherit',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                        transition: 'background .2s ease', WebkitTapHighlightColor: 'transparent',
                      }}
                    >
                      {linkCopied ? <Check size={14} /> : <Link2 size={14} />}
                      {linkCopied ? 'Copiado' : 'Copiar'}
                    </button>

                    {linkData.clientPhone && (
                      <button
                        onClick={sendWhats}
                        style={{
                          flex: 1, minHeight: 44, borderRadius: 10, cursor: 'pointer',
                          border: '1px solid rgba(16,185,129,.4)', background: '#ecfdf5',
                          color: '#0f6e56', fontSize: 12.5, fontWeight: 600, fontFamily: 'inherit',
                          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                          WebkitTapHighlightColor: 'transparent',
                        }}
                      >
                        <MessageCircle size={14} /> WhatsApp
                      </button>
                    )}
                  </div>

                  <div style={{ fontSize: 11, color: '#8a8a93', marginTop: 9, lineHeight: 1.5 }}>
                    Envie para o cliente cadastrar ou trocar o cartão. A cobrança passa a
                    ser automática todo mês.
                  </div>
                </>
              ) : (
                <div style={{ fontSize: 12, color: '#8a8a93', lineHeight: 1.5 }}>
                  Link indisponível no momento.
                </div>
              )}
            </div>
          )}

          {/* Registrar pagamento */}
          {!isCanceled && (
            <div style={{ padding: 14, borderRadius: 12, background: colors.background.page, border: `1px solid ${colors.gray.border}` }}>
              <label style={labelStyle}>Registrar pagamento (renova +1 mês)</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', fontSize: 12, color: colors.gray.dimText, fontWeight: 600 }}>R$</span>
                  <input value={payAmountStr} onChange={e => setPayAmountStr(e.target.value.replace(/[^\d,.]/g, ''))} inputMode="decimal" style={{ ...inputStyle, paddingLeft: 34, textAlign: 'right', fontVariantNumeric: 'tabular-nums', fontWeight: 700 }} />
                </div>
                <div style={{ display: 'flex', gap: 5 }}>
                  {METHODS.map(({ key, label, Icon }) => {
                    const sel = payMethod === key
                    return (
                      <button key={key} onClick={() => setPayMethod(key)} title={label} style={{
                        flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 9, cursor: 'pointer',
                        border: `1px solid ${sel ? colors.red.border : colors.gray.borderMd}`,
                        background: sel ? 'rgba(220,38,38,0.06)' : '#fff', color: sel ? colors.red.DEFAULT : colors.gray[700],
                        WebkitTapHighlightColor: 'transparent',
                      }}>
                        <Icon size={16} strokeWidth={2} />
                      </button>
                    )
                  })}
                </div>
              </div>
              {payError && (
                <div style={{ fontSize: 11.5, color: colors.red.DEFAULT, display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                  <AlertCircle size={13} strokeWidth={2.4} />{payError}
                </div>
              )}
              <button onClick={registerPayment} disabled={paying || paySuccess} style={{
                width: '100%', padding: '11px', borderRadius: 10, border: 'none',
                background: paySuccess ? '#10B981' : paying ? colors.gray.borderMd : colors.red.gradient,
                color: '#fff',
                fontSize: 12.5, fontWeight: 800, letterSpacing: '.03em', textTransform: 'uppercase',
                cursor: (paying || paySuccess) ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
                fontFamily: 'inherit',
                boxShadow: (paying || paySuccess) ? 'none' : `0 4px 14px ${colors.red.glow}`,
                transition: 'background .2s ease', WebkitTapHighlightColor: 'transparent',
              }}>
                {paySuccess
                  ? <><Check size={15} strokeWidth={2.6} />Pagamento registrado</>
                  : paying
                    ? <><Loader2 size={14} style={{ animation: 'club-spin 0.8s linear infinite' }} />Registrando</>
                    : 'Registrar pagamento'}
              </button>
              {paySuccess && (
                <div style={{
                  fontSize: 11.5, color: '#0b7a53', textAlign: 'center', marginTop: 8, lineHeight: 1.5,
                }}>
                  Ciclo renovado por mais 1 mês. Não precisa registrar de novo.
                </div>
              )}
            </div>
          )}

          {/* Histórico */}
          <div>
            <label style={labelStyle}>Histórico de pagamentos ({sub._count?.payments ?? payments.length})</label>
            {payments.length === 0 ? (
              <div style={{ padding: '20px 14px', textAlign: 'center', background: colors.background.page, borderRadius: 11, border: `1px dashed ${colors.gray.borderMd}`, color: colors.gray.dimText, fontSize: 12 }}>
                Nenhum pagamento registrado.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {payments.map(p => (
                  <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', borderRadius: 9, border: `1px solid ${colors.gray.border}` }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 12.5, fontWeight: 700, color: colors.gray[900], fontVariantNumeric: 'tabular-nums' }}>{fmtBRL(p.amount)}</div>
                      <div style={{ fontSize: 10.5, color: colors.gray.dimText }}>{fmtDate(p.paidAt)} · {p.periodKey}{formaLabel(p.billingTypeReal, p.method) ? ` · ${formaLabel(p.billingTypeReal, p.method)}` : ''}</div>
                        {/* @eligi:recebivel-linha */}
                        <RecebivelLinha p={p} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {isCanceled && sub.canceledAt && (
            <div style={{ fontSize: 11.5, color: colors.gray.dimText, textAlign: 'center' }}>
              Cancelada em {fmtDate(sub.canceledAt)}
            </div>
          )}
        </div>

        {/* Footer — cancelar */}
        {!isCanceled && (
          <div style={{ flexShrink: 0, padding: '14px 20px', paddingBottom: isMobile ? 'calc(14px + env(safe-area-inset-bottom))' : 14, borderTop: `1px solid ${colors.gray.border}`, background: '#fff' }}>
            {cancelError && (
              <div style={{ fontSize: 11.5, color: colors.red.DEFAULT, display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                <AlertCircle size={13} strokeWidth={2.4} />{cancelError}
              </div>
            )}
            {confirmCancel ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ fontSize: 12.5, color: colors.gray[700], textAlign: 'center' }}>
                  Cancelar a assinatura de <b>{sub.client.name}</b>? O membro perde o acesso ao clube.
                </div>

                {/* @eligi:pote-cancel-ui — so aparece quando ha dinheiro em jogo */}
                {pote.valor > 0 && (
                  <div style={{
                    padding: 12, borderRadius: 11,
                    background: colors.background.page,
                    border: `1px solid ${colors.gray.border}`,
                  }}>
                    <div style={{ fontSize: 12, color: colors.gray[700], lineHeight: 1.55, marginBottom: 10 }}>
                      Este mês {sub.client.name.trim().split(' ')[0]} pagou e{' '}
                      <b style={{ fontVariantNumeric: 'tabular-nums' }}>{fmtBRL(pote.valor)}</b>{' '}
                      disso {pote.qtd > 1 ? 'estão' : 'está'} no pote da equipe.
                    </div>

                    <PoolOption
                      on={poolAction === 'KEEP'}
                      onClick={() => setPoolAction('KEEP')}
                      titulo="O pagamento foi real"
                      texto="O valor fica no pote. A equipe atendeu este mês."
                      cor="#0f6e56"
                    />
                    <PoolOption
                      on={poolAction === 'REMOVE'}
                      onClick={() => setPoolAction('REMOVE')}
                      titulo="Foi teste ou engano"
                      texto={`Tira ${fmtBRL(pote.valor)} do pote deste mês. O registro do pagamento não é apagado.`}
                      cor="#b45309"
                    />
                  </div>
                )}
                <div style={{ display: 'flex', gap: 10 }}>
                  <button onClick={() => setConfirmCancel(false)} disabled={canceling} style={{ flex: 1, padding: '11px', borderRadius: 10, border: `1px solid ${colors.gray.borderMd}`, background: '#fff', fontSize: 12.5, fontWeight: 700, color: colors.gray[700], cursor: 'pointer', fontFamily: 'inherit', WebkitTapHighlightColor: 'transparent' }}>
                    Voltar
                  </button>
                  <button onClick={cancelSub} disabled={canceling || (pote.valor > 0 && !poolAction)} /* @eligi:pote-cancel-gate */ style={{ flex: 1, padding: '11px', borderRadius: 10, border: 'none', background: '#DC2626', color: '#fff', opacity: (pote.valor > 0 && !poolAction) ? 0.45 : 1 /* @eligi:pote-cancel-opacity */, fontSize: 12.5, fontWeight: 800, cursor: canceling ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, fontFamily: 'inherit', WebkitTapHighlightColor: 'transparent' }}>
                    {canceling ? <><Loader2 size={14} style={{ animation: 'club-spin 0.8s linear infinite' }} />Cancelando</> : 'Sim, cancelar'}
                  </button>
                </div>
              </div>
            ) : (
              <button onClick={() => setConfirmCancel(true)} style={{ width: '100%', padding: '11px', borderRadius: 10, border: `1px solid ${colors.gray.borderMd}`, background: '#fff', fontSize: 12.5, fontWeight: 700, color: '#DC2626', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, fontFamily: 'inherit', WebkitTapHighlightColor: 'transparent' }}>
                <Ban size={14} strokeWidth={2.2} />Cancelar assinatura
              </button>
            )}
          </div>
        )}
      </div>

      <style>{`@keyframes club-spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )

  if (typeof document === 'undefined') return null
  return createPortal(content, document.body)
}

// @eligi:pote-cancel-option — escopo de modulo (React Compiler)
// @eligi:recebivel-componente — escopo de modulo (React Compiler)
/**
 * Onde o dinheiro esta. Tres estados:
 *   ja entrou  (creditDate no passado)  verde
 *   a caminho  (creditDate no futuro)   ambar  <- o caso que confundiu o ZERO9
 *   sem data   (registro manual, ou o Asaas ainda nao calculou)  nada
 */
function RecebivelLinha({ p }: { p: ClubPayment }) {
  const dia = fmtDia(p.creditDate)
  if (!dia && p.netValue == null) return null

  const entrou = p.creditDate ? new Date(p.creditDate).getTime() <= AGORA_MS : false
  const cor = !dia ? colors.gray.dimText : entrou ? '#0f6e56' : '#b45309'
  const texto = !dia
    ? 'Liberação em processamento'
    : entrou
      ? `Na conta desde ${dia}`
      : `Entra em ${dia}`

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap',
      fontSize: 10.5, color: cor, fontWeight: 600, marginTop: 3,
    }}>
      <span style={{
        width: 5, height: 5, borderRadius: '50%', flexShrink: 0,
        background: cor, opacity: dia ? 1 : 0.5,
      }} />
      <span>{texto}</span>
      {p.netValue != null && (
        <span style={{ color: colors.gray.dimText, fontWeight: 500, fontVariantNumeric: 'tabular-nums' }}>
          · líquido {fmtBRL(p.netValue)}
        </span>
      )}
    </div>
  )
}

function PoolOption({
  on, onClick, titulo, texto, cor,
}: {
  on: boolean
  onClick: () => void
  titulo: string
  texto: string
  cor: string
}) {
  return (
    <button
      onClick={onClick}
      style={{
        width: '100%', textAlign: 'left', display: 'flex', gap: 10, alignItems: 'flex-start',
        padding: '11px 12px', marginBottom: 7, minHeight: 44,
        borderRadius: 10, cursor: 'pointer', fontFamily: 'inherit',
        background: '#fff',
        border: `1.5px solid ${on ? cor : colors.gray.borderMd}`,
        boxShadow: on ? `0 0 0 3px ${cor}14` : 'none',
        WebkitTapHighlightColor: 'transparent',
      }}
    >
      <span style={{
        width: 17, height: 17, flexShrink: 0, marginTop: 1, borderRadius: '50%',
        border: `2px solid ${on ? cor : 'rgba(17,17,20,0.22)'}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        {on && <span style={{ width: 8, height: 8, borderRadius: '50%', background: cor }} />}
      </span>
      <span style={{ flex: 1, minWidth: 0 }}>
        <b style={{ display: 'block', fontSize: 12.5, fontWeight: 700, color: colors.gray[900] }}>{titulo}</b>
        <span style={{ display: 'block', fontSize: 11.5, color: colors.gray.dimText, lineHeight: 1.45, marginTop: 2 }}>{texto}</span>
      </span>
    </button>
  )
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div style={{ padding: '11px 10px', borderRadius: 11, border: `1px solid ${colors.gray.border}`, textAlign: 'center' }}>
      <div style={{ color: colors.gray.dimText, display: 'flex', justifyContent: 'center', marginBottom: 4 }}>{icon}</div>
      <div style={{ fontSize: 14, fontWeight: 800, color: colors.gray[900], fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}>{value}</div>
      <div style={{ fontSize: 9.5, fontWeight: 700, color: colors.gray.dimText, textTransform: 'uppercase', letterSpacing: '.05em', marginTop: 2 }}>{label}</div>
    </div>
  )
}
