"use client"
// src/app/dashboard/eligiclub/components/ClubSubscriptionModal.tsx
//
// ASSINAR MEMBRO NO ELIGICLUB — cobranca recorrente no cartao.
//
// Fluxo unico: cliente + plano -> POST /club-subscriptions/recurring (CREDIT_CARD).
// A assinatura nasce PENDING; o cliente cadastra o cartao no checkout hospedado
// do Asaas e a partir dai a cobranca se repete sozinha todo mes.
// O registro manual saiu de cena de proposito: gerava assinatura sem recorrencia,
// obrigando o lojista a cobrar na mao todo mes.
//
// Ao criar, o modal ja mostra o LINK e o botao de WhatsApp — o lojista nao precisa
// ir em Configuracoes pra enviar.
//
// Padrao visual do redesign: @media (nunca isMobile pra layout), alvos >= 44px,
// inputs 16px (sem zoom no iOS), planos como cartoes (nunca <select> nativo),
// numeros em Space Grotesk com fallback, sem window.confirm/alert.

import { useState, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import {
  X, Loader2, AlertCircle, Search, Check, CreditCard, Link2, MessageCircle, ShieldCheck,
} from 'lucide-react'
import api from '@/shared/lib/apiClient'
import { colors, typography } from '@/shared/theme'
import { waLink, clubPaymentMessage } from '@/shared/utils/whatsapp'

// ── tipos ───────────────────────────────────────────────────────────────────
type SubStatus = 'PENDING' | 'ACTIVE' | 'PAST_DUE' | 'CANCELED'

interface ClubSubscription {
  id: string
  status: SubStatus
  value: number | null
  billingType: string | null
  startedAt: string | null
  currentPeriodEnd: string | null
  canceledAt: string | null
  plan: { id: string; name: string; price: number; staffSharePct: number; color: string | null }
  client: { id: string; name: string; phone: string | null }
  payments?: { id: string; amount: number; periodKey: string; method: string | null; paidAt: string | null }[]
  _count?: { payments: number; fichas: number }
}
interface ClientLite { id: string; name: string; phone: string | null; cpf: string | null }
interface PlanLite { id: string; name: string; price: number; color: string | null; active: boolean }
interface PaymentLink {
  checkoutUrl: string | null
  businessName: string
  clientName: string
  clientPhone: string | null
}

const fmtBRL = (n: number) => n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
const NUM_FONT = `'Space Grotesk', ${typography.fontFamily}`

interface Props {
  /** mantido por compatibilidade com o page.tsx — o layout usa @media */
  isMobile?: boolean
  onSaved: (sub: ClubSubscription) => void
  onClose: () => void
}

export default function ClubSubscriptionModal({ onSaved, onClose }: Props) {
  const [clients, setClients] = useState<ClientLite[]>([])
  const [plans, setPlans] = useState<PlanLite[]>([])
  const [loadingData, setLoadingData] = useState(true)

  const [clientId, setClientId] = useState<string | null>(null)
  const [planId, setPlanId] = useState<string | null>(null)
  const [clientQuery, setClientQuery] = useState('')
  const [searching, setSearching] = useState(false)

  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)

  // pos-criacao: link de pagamento pra enviar ao cliente
  const [done, setDone] = useState<PaymentLink | null>(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 10)
    return () => clearTimeout(t)
  }, [])

  useEffect(() => {
    let cancelled = false
    api.get('/club')
      .then(planRes => {
        if (cancelled) return
        const planData = planRes.data?.data ?? planRes.data
        const planList: PlanLite[] = (Array.isArray(planData) ? planData : planData.plans ?? [])
          .map((p: { id: string; name: string; price: number; color?: string | null; active?: boolean }) => ({
            id: p.id, name: p.name, price: p.price, color: p.color ?? null, active: p.active !== false,
          }))
          .filter((p: PlanLite) => p.active)
        setPlans(planList)
      })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoadingData(false) })
    return () => { cancelled = true }
  }, [])

  // ── BUSCA DE CLIENTES NO SERVIDOR ──────────────────────────────────────────
  // Antes carregavamos so a 1a pagina (30 de 1.100+) e filtravamos no cliente —
  // quem nao estivesse nessa fatia simplesmente nao existia na busca.
  // Agora consulta /clients?search=... com debounce e cancelamento da anterior.
  useEffect(() => {
    const ctrl = new AbortController()
    const termo = clientQuery.trim()
    setSearching(true)

    const t = setTimeout(() => {
      const qs = termo
        ? `?search=${encodeURIComponent(termo)}&limit=30&orderBy=name&order=asc`
        : '?limit=30&orderBy=createdAt&order=desc'

      api.get(`/clients${qs}`, { signal: ctrl.signal })
        .then(res => {
          const raw = res.data?.data ?? res.data
          const arr = Array.isArray(raw) ? raw : raw?.clients ?? []
          setClients(
            arr.map((c: { id: string; name: string; phone?: string | null; cpf?: string | null }) => ({
              id: c.id, name: c.name, phone: c.phone ?? null, cpf: c.cpf ?? null,
            })),
          )
        })
        .catch(() => { /* abortada ou falha: mantem a lista atual */ })
        .finally(() => setSearching(false))
    }, termo ? 350 : 0)

    return () => { clearTimeout(t); ctrl.abort() }
  }, [clientQuery])

  const handleClose = useCallback(() => {
    setMounted(false)
    setTimeout(onClose, 200)
  }, [onClose])

  const selectedClient = clients.find(c => c.id === clientId) ?? null
  const selectedPlan = plans.find(p => p.id === planId) ?? null

  // o servidor ja devolve filtrado e paginado
  const filteredClients = clients

  const submit = useCallback(async () => {
    setError(null)
    if (!clientId) { setError('Selecione o cliente que vai assinar.'); return }
    if (!planId) { setError('Escolha o plano do clube.'); return }

    setSaving(true)
    try {
      const res = await api.post('/club-subscriptions/recurring', {
        clientId, planId, billingType: 'CREDIT_CARD',
      })
      const payload = (res.data?.data ?? res.data) as { subscription?: ClubSubscription } & ClubSubscription
      const sub = (payload.subscription ?? payload) as ClubSubscription
      onSaved(sub)

      // busca o link + dados pra montar a mensagem de WhatsApp
      if (sub?.id) {
        try {
          const lk = await api.get(`/club-subscriptions/${sub.id}/payment-link`)
          setDone((lk.data?.data ?? null) as PaymentLink | null)
        } catch {
          setDone(null)
        }
      }
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: string } } }
      setError(e.response?.data?.error ?? 'Não foi possível criar a assinatura.')
    } finally {
      setSaving(false)
    }
  }, [clientId, planId, onSaved])

  const copyLink = useCallback(async () => {
    if (!done?.checkoutUrl) return
    try {
      await navigator.clipboard.writeText(done.checkoutUrl)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2200)
    } catch {
      setError('Não foi possível copiar. Link: ' + done.checkoutUrl)
    }
  }, [done])

  const sendWhats = useCallback(() => {
    if (!done?.checkoutUrl || !done.clientPhone) return
    const msg = clubPaymentMessage(done.clientName, done.businessName, done.checkoutUrl)
    window.open(waLink(done.clientPhone, msg), '_blank', 'noopener,noreferrer')
  }, [done])

  const podeSalvar = !!clientId && !!planId && !saving

  const content = (
    <div
      onClick={handleClose}
      className="ecs-overlay"
      style={{ opacity: mounted ? 1 : 0 }}
    >
      <style>{`
        .ecs-overlay{
          position:fixed; inset:0; background:rgba(0,0,0,.45); backdrop-filter:blur(3px);
          z-index:9998; display:flex; align-items:flex-end; justify-content:center;
          transition:opacity .2s ease;
        }
        .ecs-sheet{
          background:#fff; width:100%; max-height:94vh; border-radius:22px 22px 0 0;
          display:flex; flex-direction:column; overflow:hidden;
          box-shadow:0 -12px 48px rgba(0,0,0,.22);
          transition:transform .28s cubic-bezier(.34,1.56,.64,1);
        }
        .ecs-body{ overflow-y:auto; -webkit-overflow-scrolling:touch; padding:4px 18px 18px; }
        .ecs-foot{ padding:14px 18px calc(14px + env(safe-area-inset-bottom)); border-top:1px solid rgba(17,17,20,.07); background:#fff; }
        .ecs-label{ font-size:11.5px; font-weight:700; color:#8a8a93; text-transform:uppercase; letter-spacing:.08em; margin:20px 0 9px; }
        .ecs-input{
          width:100%; box-sizing:border-box; padding:14px 14px 14px 40px; border-radius:12px;
          font-size:16px; border:1px solid rgba(17,17,20,.12); outline:none; background:#fff;
          color:#111114; min-height:50px;
        }
        .ecs-input:focus{ border-color:#dc2626; }
        .ecs-row{
          display:flex; align-items:center; gap:12px; width:100%; text-align:left;
          padding:13px 14px; border-radius:12px; border:1px solid rgba(17,17,20,.08);
          background:#fff; cursor:pointer; min-height:56px; font-family:inherit;
          transition:border-color .15s ease, background .15s ease;
        }
        .ecs-row:disabled{ cursor:not-allowed; opacity:.55; }
        .ecs-row[data-on="1"]{ border-color:#dc2626; background:rgba(220,38,38,.05); }
        .ecs-btn{
          width:100%; min-height:54px; border:none; border-radius:14px; cursor:pointer;
          font-size:16px; font-weight:600; font-family:inherit;
          display:flex; align-items:center; justify-content:center; gap:8px;
          background:linear-gradient(135deg,#dc2626,#b91c1c); color:#fff;
        }
        .ecs-btn:disabled{ opacity:.5; cursor:not-allowed; }
        .ecs-mini{
          flex:1; min-height:48px; border-radius:12px; cursor:pointer; font-family:inherit;
          font-size:14px; font-weight:600; display:flex; align-items:center; justify-content:center; gap:7px;
          border:1px solid rgba(17,17,20,.12); background:#fff; color:#4b4b52;
        }
        @keyframes ecs-spin{ to{ transform:rotate(360deg) } }
        .ecs-spin{ animation:ecs-spin .9s linear infinite; }
        @media (min-width: 768px){
          .ecs-overlay{ align-items:center; }
          .ecs-sheet{ width:520px; max-width:calc(100vw - 32px); max-height:90vh; border-radius:20px; }
          .ecs-body{ padding:4px 24px 22px; }
          .ecs-foot{ padding:16px 24px; }
        }
      `}</style>

      <div
        onClick={e => e.stopPropagation()}
        className="ecs-sheet"
        style={{
          transform: mounted ? 'translateY(0)' : 'translateY(100%)',
          fontFamily: typography.fontFamily,
        }}
      >
        {/* ── header ── */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 12,
          padding: '18px 18px 14px', borderBottom: '1px solid rgba(17,17,20,.07)', flexShrink: 0,
        }}>
          <span style={{
            width: 40, height: 40, borderRadius: 12, flexShrink: 0,
            background: 'linear-gradient(135deg,rgba(220,38,38,.12),rgba(185,28,28,.07))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <CreditCard size={19} color="#dc2626" strokeWidth={2} />
          </span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 17, fontWeight: 700, letterSpacing: '-.02em', color: '#111114' }}>
              {done ? 'Assinatura criada' : 'Novo assinante'}
            </div>
            <div style={{ fontSize: 12.5, color: '#8a8a93', marginTop: 1 }}>
              {done ? 'Envie o link para o cliente pagar' : 'Cobrança automática no cartão'}
            </div>
          </div>
          <button
            onClick={handleClose}
            aria-label="Fechar"
            style={{
              width: 40, height: 40, borderRadius: 11, border: 'none', cursor: 'pointer',
              background: 'rgba(17,17,20,.05)', color: '#4b4b52', flexShrink: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <X size={18} strokeWidth={2} />
          </button>
        </div>

        {/* ── corpo ── */}
        <div className="ecs-body">
          {done ? (
            /* ═══ SUCESSO: link pronto pra enviar ═══ */
            <>
              <div style={{
                display: 'flex', gap: 10, alignItems: 'flex-start', marginTop: 16,
                background: '#ecfdf5', border: '1px solid rgba(16,185,129,.25)',
                borderRadius: 14, padding: '14px 15px',
              }}>
                <Check size={17} color="#10B981" style={{ flexShrink: 0, marginTop: 1 }} />
                <div style={{ fontSize: 13.5, color: '#065f46', lineHeight: 1.55 }}>
                  <b>{done.clientName}</b> já está no clube. Falta ele cadastrar o cartão —
                  depois disso a cobrança acontece sozinha todo mês.
                </div>
              </div>

              <div className="ecs-label">Link de pagamento</div>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 10,
                background: '#f5f5f7', border: '1px solid rgba(17,17,20,.08)',
                borderRadius: 12, padding: '13px 14px',
              }}>
                <Link2 size={15} color="#8a8a93" style={{ flexShrink: 0 }} />
                <span style={{
                  flex: 1, fontSize: 12.5, color: '#4b4b52', fontFamily: 'ui-monospace,monospace',
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}>
                  {done.checkoutUrl?.replace(/^https?:\/\//, '') ?? '—'}
                </span>
              </div>

              <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
                <button onClick={() => void copyLink()} className="ecs-mini">
                  {copied ? <Check size={15} color="#10B981" /> : <Link2 size={15} />}
                  {copied ? 'Copiado' : 'Copiar'}
                </button>
                {done.clientPhone && (
                  <button
                    onClick={sendWhats}
                    className="ecs-mini"
                    style={{ borderColor: 'rgba(16,185,129,.4)', background: '#ecfdf5', color: '#0b7a53' }}
                  >
                    <MessageCircle size={15} /> WhatsApp
                  </button>
                )}
              </div>

              <div style={{
                display: 'flex', gap: 8, alignItems: 'center', marginTop: 18,
                fontSize: 11.5, color: '#8a8a93', lineHeight: 1.5,
              }}>
                <ShieldCheck size={14} style={{ flexShrink: 0 }} />
                <span>Os dados do cartão são tratados pelo Asaas — o Eligi nunca os armazena.</span>
              </div>
            </>
          ) : loadingData ? (
            <div style={{ padding: '44px 0', textAlign: 'center', color: '#8a8a93', fontSize: 14 }}>
              <Loader2 size={22} className="ecs-spin" style={{ marginBottom: 10 }} />
              <div>Carregando…</div>
            </div>
          ) : (
            /* ═══ FORMULÁRIO ═══ */
            <>
              {error && (
                <div style={{
                  display: 'flex', gap: 9, alignItems: 'flex-start', marginTop: 16,
                  background: 'rgba(220,38,38,.07)', border: '1px solid rgba(220,38,38,.2)',
                  borderRadius: 12, padding: '13px 14px', fontSize: 13, color: '#b91c1c', lineHeight: 1.5,
                }}>
                  <AlertCircle size={16} style={{ flexShrink: 0, marginTop: 1 }} />
                  <span>{error}</span>
                </div>
              )}

              {/* CLIENTE */}
              <div className="ecs-label">Cliente</div>
              <div style={{ position: 'relative' }}>
                <Search
                  size={16}
                  color="#8a8a93"
                  style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)' }}
                />
                <input
                  className="ecs-input"
                  value={clientQuery}
                  onChange={e => setClientQuery(e.target.value)}
                  placeholder="Digite o nome do cliente"
                  inputMode="search"
                />
              </div>

              <div style={{
                fontSize: 11.5, color: '#8a8a93', marginTop: 9, lineHeight: 1.5,
              }}>
                Clientes sem CPF aparecem bloqueados — o CPF é exigido para cobrança
                no cartão. Cadastre na ficha do cliente para liberar.
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 10 }}>
                {searching && filteredClients.length === 0 && (
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    fontSize: 13, color: '#8a8a93', padding: '14px 2px',
                  }}>
                    <Loader2 size={15} className="ecs-spin" /> Buscando…
                  </div>
                )}
                {!searching && filteredClients.length === 0 && (
                  <div style={{ fontSize: 13, color: '#8a8a93', padding: '14px 2px', lineHeight: 1.5 }}>
                    {clientQuery.trim()
                      ? `Nenhum cliente encontrado para "${clientQuery.trim()}".`
                      : 'Nenhum cliente cadastrado ainda.'}
                  </div>
                )}
                {filteredClients.map(c => {
                  const on = clientId === c.id
                  const bloqueado = !c.cpf
                  return (
                    <button
                      key={c.id}
                      className="ecs-row"
                      data-on={on ? '1' : '0'}
                      disabled={bloqueado}
                      onClick={() => setClientId(c.id)}
                    >
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{
                          fontSize: 15, fontWeight: 600, color: bloqueado ? '#8a8a93' : '#111114',
                          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                        }}>
                          {c.name}
                        </div>
                        <div style={{ fontSize: 12, color: bloqueado ? '#b45309' : '#8a8a93', marginTop: 2 }}>
                          {bloqueado ? 'Sem CPF cadastrado' : c.phone ?? 'Sem telefone'}
                        </div>
                      </div>
                      {on && <Check size={18} color="#dc2626" style={{ flexShrink: 0 }} />}
                    </button>
                  )
                })}
              </div>

              {/* PLANO */}
              <div className="ecs-label">Plano</div>
              {plans.length === 0 ? (
                <div style={{
                  fontSize: 13, color: '#b45309', background: '#fffbeb',
                  border: '1px solid rgba(180,83,9,.2)', borderRadius: 12,
                  padding: '14px 15px', lineHeight: 1.55,
                }}>
                  Nenhum plano ativo. Crie um plano do clube antes de assinar um cliente.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
                  {plans.map(p => {
                    const on = planId === p.id
                    return (
                      <button
                        key={p.id}
                        className="ecs-row"
                        data-on={on ? '1' : '0'}
                        onClick={() => setPlanId(p.id)}
                      >
                        <span style={{
                          width: 8, height: 38, borderRadius: 5, flexShrink: 0,
                          background: p.color ?? '#dc2626',
                        }} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{
                            fontSize: 15, fontWeight: 600, color: '#111114',
                            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                          }}>
                            {p.name}
                          </div>
                          <div style={{
                            fontSize: 19, fontWeight: 700, color: '#111114',
                            fontFamily: NUM_FONT, letterSpacing: '-.02em', marginTop: 2,
                          }}>
                            {fmtBRL(p.price)}
                            <span style={{ fontSize: 12.5, fontWeight: 500, color: '#8a8a93' }}> /mês</span>
                          </div>
                        </div>
                        {on && <Check size={18} color="#dc2626" style={{ flexShrink: 0 }} />}
                      </button>
                    )
                  })}
                </div>
              )}

              {/* explicação */}
              <div style={{
                display: 'flex', gap: 10, alignItems: 'flex-start', marginTop: 20,
                background: '#f5f5f7', borderRadius: 14, padding: '14px 15px',
              }}>
                <CreditCard size={17} color="#4b4b52" style={{ flexShrink: 0, marginTop: 1 }} />
                <div style={{ fontSize: 13, color: '#4b4b52', lineHeight: 1.6 }}>
                  Você envia um link, o cliente cadastra o cartão dele e a mensalidade
                  passa a ser cobrada <b>automaticamente todo mês</b>.
                </div>
              </div>
            </>
          )}
        </div>

        {/* ── rodapé ── */}
        <div className="ecs-foot">
          {done ? (
            <button onClick={handleClose} className="ecs-btn">Concluir</button>
          ) : (
            <>
              {selectedClient && selectedPlan && (
                <div style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
                  marginBottom: 11, fontSize: 13, color: '#4b4b52',
                }}>
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {selectedClient.name}
                  </span>
                  <span style={{ fontFamily: NUM_FONT, fontWeight: 700, fontSize: 16, color: '#111114', flexShrink: 0 }}>
                    {fmtBRL(selectedPlan.price)}<span style={{ fontSize: 12, fontWeight: 500, color: '#8a8a93' }}>/mês</span>
                  </span>
                </div>
              )}
              <button onClick={() => void submit()} disabled={!podeSalvar} className="ecs-btn">
                {saving && <Loader2 size={17} className="ecs-spin" />}
                {saving ? 'Criando…' : 'Criar assinatura'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )

  if (typeof document === 'undefined') return null
  return createPortal(content, document.body)
}
