'use client'
// src/app/dashboard/eligiclub/components/ClubSubscriptionModal.tsx
//
// Assinar membro no EligiClub — escolhe cliente + plano + valor + método e cria
// a assinatura (POST /club-subscriptions). A assinatura nasce ACTIVE com o 1º
// pagamento registrado, então o membro já pode usar o clube no caixa.
// Espelha a cromática do PackageEditorModal (portal, overlay blur, sheet, footer).
//
// NOTA: assume GET /clients => array de { id, name, phone, cpf?, email? } e filtra
// client-side (sem busca server-side). Se o endpoint tiver shape/busca diferente,
// é ajuste localizado no fetch + no filtro.

import { useState, useEffect, useMemo, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { X, Loader2, AlertCircle, Search, Check, User, Banknote, Smartphone, CreditCard } from 'lucide-react'

import api from '@/shared/lib/apiClient'
import { colors, typography, transitions, radius } from '@/shared/theme'

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
interface ClientLite { id: string; name: string; phone: string | null }
interface PlanLite { id: string; name: string; price: number; color: string | null; active: boolean }

type Method = 'DINHEIRO' | 'PIX' | 'CARTAO'
const METHODS: { key: Method; label: string; Icon: typeof Banknote }[] = [
  { key: 'DINHEIRO', label: 'Dinheiro', Icon: Banknote },
  { key: 'PIX',      label: 'PIX',      Icon: Smartphone },
  { key: 'CARTAO',   label: 'Cartão',   Icon: CreditCard },
]
const fmtBRL = (n: number) => n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

interface Props {
  isMobile: boolean
  onSaved:  (sub: ClubSubscription) => void
  onClose:  () => void
}

export default function ClubSubscriptionModal({ isMobile, onSaved, onClose }: Props) {
  const [clients, setClients] = useState<ClientLite[]>([])
  const [plans,   setPlans]   = useState<PlanLite[]>([])
  const [loadingData, setLoadingData] = useState(true)

  const [clientId,    setClientId]    = useState<string | null>(null)
  const [planId,      setPlanId]      = useState<string | null>(null)
  const [valueStr,    setValueStr]    = useState('')
  const [method,      setMethod]      = useState<Method>('DINHEIRO')
  const [clientQuery, setClientQuery] = useState('')

  const [saving,  setSaving]  = useState(false)
  const [error,   setError]   = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 10)
    return () => clearTimeout(t)
  }, [])

  useEffect(() => {
    let cancelled = false
    Promise.all([api.get('/club'), api.get('/clients')]).then(([planRes, cliRes]) => {
      if (cancelled) return
      const planData = planRes.data?.data ?? planRes.data
      const cliData  = cliRes.data?.data ?? cliRes.data
      const planList: PlanLite[] = (Array.isArray(planData) ? planData : planData.plans ?? [])
        .map((p: { id: string; name: string; price: number; color?: string | null; active?: boolean }) => ({
          id: p.id, name: p.name, price: p.price, color: p.color ?? null, active: p.active !== false,
        }))
        .filter((p: PlanLite) => p.active)
      const cliList: ClientLite[] = (Array.isArray(cliData) ? cliData : cliData.clients ?? [])
        .map((c: { id: string; name: string; phone?: string | null }) => ({ id: c.id, name: c.name, phone: c.phone ?? null }))
      setPlans(planList)
      setClients(cliList)
    }).catch(() => {}).finally(() => { if (!cancelled) setLoadingData(false) })
    return () => { cancelled = true }
  }, [])

  function handleClose() {
    setMounted(false)
    setTimeout(onClose, 200)
  }

  function selectPlan(id: string) {
    setPlanId(id)
    const p = plans.find(pl => pl.id === id)
    if (p) setValueStr(String(p.price))
  }

  const selectedClient = clients.find(c => c.id === clientId) ?? null
  const selectedPlan   = plans.find(p => p.id === planId) ?? null

  const filteredClients = useMemo(() => {
    const q = clientQuery.trim().toLowerCase()
    const base = q
      ? clients.filter(c => c.name.toLowerCase().includes(q) || (c.phone ?? '').toLowerCase().includes(q))
      : clients
    return base.slice(0, 50)
  }, [clients, clientQuery])

  const valueNum = parseFloat(valueStr.replace(',', '.')) || 0

  const submit = useCallback(async () => {
    setError(null)
    if (!clientId)      { setError('Selecione um cliente'); return }
    if (!planId)        { setError('Selecione um plano'); return }
    if (valueNum < 0)   { setError('Valor inválido'); return }

    setSaving(true)
    try {
      const res = await api.post('/club-subscriptions', { clientId, planId, amount: valueNum, method })
      const data = res.data?.data ?? res.data
      onSaved(data)
      handleClose()
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: string } } }
      setError(e.response?.data?.error ?? 'Erro ao assinar')
      setSaving(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clientId, planId, valueNum, method])

  const labelStyle: React.CSSProperties = {
    display: 'block', fontSize: 11, fontWeight: 700, color: colors.gray.dimText,
    textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: 6,
  }
  const inputStyle: React.CSSProperties = {
    width: '100%', boxSizing: 'border-box', padding: isMobile ? '11px 13px' : '10px 13px',
    borderRadius: 9, fontSize: 13, border: `1px solid ${colors.gray.borderMd}`, outline: 'none',
    fontFamily: typography.fontFamily, color: colors.gray[900], background: '#fff',
  }

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
          background: '#fff', width: isMobile ? '100%' : 480, maxWidth: '100%',
          maxHeight: isMobile ? '94vh' : '90vh', borderRadius: isMobile ? '20px 20px 0 0' : radius.lg,
          overflow: 'hidden', display: 'flex', flexDirection: 'column',
          transform: mounted ? 'translateY(0)' : isMobile ? 'translateY(100%)' : 'scale(0.97)',
          transition: `transform 0.25s ${transitions.spring ?? 'cubic-bezier(0.34,1.56,0.64,1)'}`,
          boxShadow: '0 -8px 40px rgba(0,0,0,0.20)',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', padding: '16px 20px', borderBottom: `1px solid ${colors.gray.border}`, flexShrink: 0 }}>
          <button onClick={handleClose} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 6, marginRight: 10, display: 'flex', WebkitTapHighlightColor: 'transparent' }}>
            <X size={20} color={colors.gray[700]} strokeWidth={2} />
          </button>
          <h2 style={{ flex: 1, margin: 0, fontSize: 17, fontWeight: 700, color: colors.gray[900], letterSpacing: '-0.01em' }}>
            Assinar membro
          </h2>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch', padding: isMobile ? 16 : 22, display: 'flex', flexDirection: 'column', gap: 18 }}>
          {/* 1. CLIENTE */}
          <div>
            <label style={labelStyle}>Cliente *</label>
            {selectedClient ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 12px', background: 'rgba(220,38,38,0.04)', border: `1px solid ${colors.red.border}`, borderRadius: 10 }}>
                <span style={{ width: 34, height: 34, borderRadius: '50%', background: colors.red.gradient, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <User size={17} color="#fff" />
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: colors.gray[900], whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{selectedClient.name}</div>
                  {selectedClient.phone && <div style={{ fontSize: 11, color: colors.gray.dimText }}>{selectedClient.phone}</div>}
                </div>
                <button onClick={() => { setClientId(null); setClientQuery('') }} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 6, display: 'flex', color: colors.gray.dimText, fontSize: 11, fontWeight: 700, WebkitTapHighlightColor: 'transparent' }}>
                  Trocar
                </button>
              </div>
            ) : (
              <>
                <div style={{ position: 'relative' }}>
                  <Search size={15} color={colors.gray.dimText} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
                  <input value={clientQuery} onChange={e => setClientQuery(e.target.value)} placeholder="Buscar por nome ou telefone" style={{ ...inputStyle, paddingLeft: 36 }} />
                </div>
                <div style={{ marginTop: 8, border: `1px solid ${colors.gray.border}`, borderRadius: 10, maxHeight: 190, overflowY: 'auto', background: colors.background.page }}>
                  {loadingData ? (
                    <div style={{ padding: 16, textAlign: 'center', color: colors.gray.dimText, fontSize: 12 }}>Carregando…</div>
                  ) : clients.length === 0 ? (
                    <div style={{ padding: 16, textAlign: 'center', color: colors.gray.dimText, fontSize: 12 }}>Nenhum cliente cadastrado. Cadastre em Clientes primeiro.</div>
                  ) : filteredClients.length === 0 ? (
                    <div style={{ padding: 16, textAlign: 'center', color: colors.gray.dimText, fontSize: 12 }}>Nenhum cliente encontrado.</div>
                  ) : (
                    filteredClients.map(c => (
                      <button key={c.id} onClick={() => setClientId(c.id)} style={{
                        width: '100%', display: 'flex', alignItems: 'center', gap: 8, padding: '9px 12px',
                        background: 'transparent', border: 'none', borderBottom: `1px solid ${colors.gray.border}`,
                        cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit', WebkitTapHighlightColor: 'transparent',
                      }}
                        onMouseEnter={e => (e.currentTarget.style.background = '#fff')}
                        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                      >
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 12.5, fontWeight: 600, color: colors.gray[900], whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.name}</div>
                          {c.phone && <div style={{ fontSize: 10.5, color: colors.gray.dimText }}>{c.phone}</div>}
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </>
            )}
          </div>

          {/* 2. PLANO */}
          <div>
            <label style={labelStyle}>Plano de clube *</label>
            {loadingData ? (
              <div style={{ padding: 14, textAlign: 'center', color: colors.gray.dimText, fontSize: 12 }}>Carregando…</div>
            ) : plans.length === 0 ? (
              <div style={{ padding: '16px 12px', textAlign: 'center', background: colors.background.page, borderRadius: 10, border: `1px dashed ${colors.gray.borderMd}`, color: colors.gray.dimText, fontSize: 12 }}>
                Nenhum plano ativo. Crie um plano na aba Planos.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {plans.map(p => {
                  const sel = planId === p.id
                  return (
                    <button key={p.id} onClick={() => selectPlan(p.id)} style={{
                      display: 'flex', alignItems: 'center', gap: 10, padding: '11px 12px', borderRadius: 10,
                      border: `1px solid ${sel ? colors.red.border : colors.gray.border}`,
                      background: sel ? 'rgba(220,38,38,0.04)' : '#fff', cursor: 'pointer', textAlign: 'left',
                      fontFamily: 'inherit', WebkitTapHighlightColor: 'transparent', position: 'relative', overflow: 'hidden',
                    }}>
                      <div style={{ position: 'absolute', top: 0, left: 0, bottom: 0, width: 3, background: p.color ?? colors.red.DEFAULT }} />
                      <div style={{ flex: 1, minWidth: 0, paddingLeft: 6 }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: colors.gray[900], whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.name}</div>
                        <div style={{ fontSize: 11, color: colors.gray.dimText, fontVariantNumeric: 'tabular-nums' }}>{fmtBRL(p.price)}/mês</div>
                      </div>
                      {sel && <Check size={18} color={colors.red.DEFAULT} strokeWidth={2.6} style={{ flexShrink: 0 }} />}
                    </button>
                  )
                })}
              </div>
            )}
          </div>

          {/* 3. VALOR + 4. MÉTODO */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div>
              <label style={labelStyle}>Valor cobrado *</label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', fontSize: 12, color: colors.gray.dimText, fontWeight: 600 }}>R$</span>
                <input value={valueStr} onChange={e => setValueStr(e.target.value.replace(/[^\d,.]/g, ''))} placeholder="0,00" inputMode="decimal" style={{ ...inputStyle, paddingLeft: 36, textAlign: 'right', fontVariantNumeric: 'tabular-nums', fontWeight: 700 }} />
              </div>
              {selectedPlan && valueNum !== selectedPlan.price && (
                <div style={{ fontSize: 10, marginTop: 4, color: colors.gray.dimText }}>plano: {fmtBRL(selectedPlan.price)}</div>
              )}
            </div>
            <div>
              <label style={labelStyle}>Pagamento</label>
              <div style={{ display: 'flex', gap: 6 }}>
                {METHODS.map(({ key, label, Icon }) => {
                  const sel = method === key
                  return (
                    <button key={key} onClick={() => setMethod(key)} title={label} style={{
                      flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 3,
                      padding: '8px 4px', borderRadius: 9, cursor: 'pointer', fontFamily: 'inherit', WebkitTapHighlightColor: 'transparent',
                      border: `1px solid ${sel ? colors.red.border : colors.gray.borderMd}`,
                      background: sel ? 'rgba(220,38,38,0.06)' : '#fff',
                      color: sel ? colors.red.DEFAULT : colors.gray[700],
                    }}>
                      <Icon size={16} strokeWidth={2} />
                      <span style={{ fontSize: 9.5, fontWeight: 700 }}>{label}</span>
                    </button>
                  )
                })}
              </div>
            </div>
          </div>

          {error && (
            <div style={{ padding: '10px 12px', background: 'rgba(220,38,38,0.06)', border: `1px solid ${colors.red.border}`, borderRadius: 8, fontSize: 12, color: colors.red.DEFAULT, display: 'flex', alignItems: 'center', gap: 7 }}>
              <AlertCircle size={14} strokeWidth={2.4} />{error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ flexShrink: 0, padding: '14px 20px', paddingBottom: isMobile ? 'calc(14px + env(safe-area-inset-bottom))' : 14, borderTop: `1px solid ${colors.gray.border}`, background: '#fff', display: 'flex', gap: 10 }}>
          <button onClick={handleClose} style={{ padding: '12px 20px', borderRadius: 10, border: `1px solid ${colors.gray.borderMd}`, background: '#fff', fontSize: 13, fontWeight: 700, color: colors.gray[700], cursor: 'pointer', fontFamily: 'inherit', WebkitTapHighlightColor: 'transparent' }}>
            Cancelar
          </button>
          <button onClick={submit} disabled={saving} style={{ flex: 1, padding: '12px 20px', borderRadius: 10, border: 'none', background: saving ? colors.gray.borderMd : colors.red.gradient, color: '#fff', fontSize: 13, fontWeight: 800, cursor: saving ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, fontFamily: 'inherit', letterSpacing: '.03em', textTransform: 'uppercase', boxShadow: saving ? 'none' : `0 4px 14px ${colors.red.glow}`, WebkitTapHighlightColor: 'transparent' }}>
            {saving ? <><Loader2 size={14} style={{ animation: 'club-spin 0.8s linear infinite' }} />Assinando</> : 'Assinar'}
          </button>
        </div>
      </div>

      <style>{`@keyframes club-spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )

  if (typeof document === 'undefined') return null
  return createPortal(content, document.body)
}
