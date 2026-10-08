'use client'
// src/app/dashboard/eligiclub/components/ClubPlanChangeSheet.tsx
//
// @eligi:club-plan-sheet
// Troca de plano de um membro (direcao A + aviso da C, prototipo de 07/10/2026).
// O plano novo vale a partir do PROXIMO vencimento e a diferenca do mes nao e
// cobrada. No cartao, a proxima cobranca do Asaas ja sai com o valor novo.
// Quem pode (dono ou gerente) e a regra de verdade moram no back; aqui o 403 ou
// o 409 aparece como mensagem na propria folha.

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { Loader2, AlertCircle, ArrowRightLeft } from 'lucide-react'

import api from '@/shared/lib/apiClient'
import { colors, typography, inkLight } from '@/shared/theme'

export interface ClubPlanOption {
  id: string
  name: string
  price: number
  color: string | null
  active: boolean
  serviceNames: string[]
}

type RawPlan = {
  id: string; name: string; price: number; color?: string | null; active?: boolean
  services?: Array<{ service?: { id: string; name: string } | null }>
}

// Uma busca por abertura da tela, dividida entre o aviso e a folha.
let plansPromise: Promise<ClubPlanOption[]> | null = null
export function loadClubPlans(): Promise<ClubPlanOption[]> {
  if (!plansPromise) {
    plansPromise = api.get('/club')
      .then(res => {
        const d = res.data?.data ?? res.data
        const list: RawPlan[] = Array.isArray(d) ? d : (d?.plans ?? [])
        return list.map(p => ({
          id: p.id, name: p.name, price: p.price, color: p.color ?? null, active: p.active !== false,
          serviceNames: (p.services ?? []).map(s => s.service?.name).filter((n): n is string => !!n),
        }))
      })
      .catch(err => { plansPromise = null; throw err })
  }
  return plansPromise
}
export function invalidateClubPlans() { plansPromise = null }

const BRT_MS = 3 * 60 * 60 * 1000
const ddmm = (iso: string) => {
  const ymd = new Date(new Date(iso).getTime() - BRT_MS).toISOString().slice(0, 10)
  return `${ymd.slice(8, 10)}/${ymd.slice(5, 7)}`
}
const brl = (n: number) => n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

function apiError(err: unknown, fallback: string) {
  const e = err as { response?: { data?: { error?: string; message?: string } } }
  return e.response?.data?.error ?? e.response?.data?.message ?? fallback
}

// ── Aviso na ficha: troca agendada ──────────────────────────────────────────
export function ClubPlanPendingBanner({ subId, pendingPlanId, dueIso, isCard, onSaved, onPlanLoaded }: {
  subId: string
  pendingPlanId: string
  dueIso: string | null
  isCard: boolean
  onSaved: (data: unknown) => void
  onPlanLoaded?: (plan: ClubPlanOption) => void
}) {
  const [plan, setPlan] = useState<ClubPlanOption | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let alive = true
    loadClubPlans()
      .then(list => {
        if (!alive) return
        const p = list.find(x => x.id === pendingPlanId) ?? null
        setPlan(p)
        if (p) onPlanLoaded?.(p)
      })
      .catch(() => {})
    return () => { alive = false }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingPlanId])

  async function cancelar() {
    if (busy) return
    setError(null); setBusy(true)
    try {
      const res = await api.delete(`/club-subscriptions/${subId}/plan-change`)
      onSaved(res.data?.data ?? res.data)
    } catch (err) {
      setError(apiError(err, 'Não foi possível cancelar a troca.'))
      setBusy(false)
    }
  }

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', gap: 6, borderRadius: 12, padding: '10px 12px',
      background: inkLight.warn.bg, border: `1px solid ${inkLight.warn.border}`, color: inkLight.warn.text, fontSize: 12.5, lineHeight: 1.5,
    }}>
      <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
        <ArrowRightLeft size={15} style={{ flexShrink: 0, marginTop: 2 }} />
        <span style={{ flex: 1, minWidth: 0 }}>
          Muda para <b>{plan?.name ?? 'outro plano'}</b>{plan ? <> ({brl(plan.price)})</> : null}
          {dueIso ? <> em <b>{ddmm(dueIso)}</b></> : null}.
          {isCard ? ' A cobrança no cartão já sai com o valor novo.' : ' Registre a renovação com o valor novo.'}
        </span>
      </div>
      <button type="button" onClick={cancelar} disabled={busy} style={{
        alignSelf: 'flex-start', minHeight: 32, padding: '0 2px', border: 'none', background: 'none', cursor: 'pointer',
        fontFamily: typography.fontFamily, fontSize: 12.5, fontWeight: 700, color: colors.red.DEFAULT,
        display: 'inline-flex', alignItems: 'center', gap: 6,
      }}>
        {busy && <Loader2 size={13} style={{ animation: 'club-spin 0.8s linear infinite' }} />}
        {busy ? 'Cancelando…' : 'Cancelar troca'}
      </button>
      {error && <span role="alert" style={{ color: inkLight.bad.text }}>{error}</span>}
    </div>
  )
}

// ── Folha: escolher o plano novo ────────────────────────────────────────────
interface Props {
  subId: string
  currentPlanId: string
  pendingPlanId: string | null
  dueIso: string | null
  isCard: boolean
  isMobile: boolean
  onSaved: (data: unknown) => void
  onClose: () => void
}

export default function ClubPlanChangeSheet({ subId, currentPlanId, pendingPlanId, dueIso, isCard, isMobile, onSaved, onClose }: Props) {
  const [plans, setPlans] = useState<ClubPlanOption[] | null>(null)
  const [loadError, setLoadError] = useState(false)
  const [sel, setSel] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let alive = true
    loadClubPlans()
      .then(list => { if (alive) setPlans(list) })
      .catch(() => { if (alive) setLoadError(true) })
    return () => { alive = false }
  }, [])

  const atual = plans?.find(p => p.id === currentPlanId) ?? null
  const opcoes = (plans ?? []).filter(p => p.active && p.id !== currentPlanId && p.id !== pendingPlanId)
  const escolhido = opcoes.find(p => p.id === sel) ?? null
  const venc = dueIso ? ddmm(dueIso) : null

  async function salvar() {
    if (!escolhido || saving) return
    setError(null); setSaving(true)
    try {
      const res = await api.post(`/club-subscriptions/${subId}/plan-change`, { planId: escolhido.id })
      onSaved(res.data?.data ?? res.data)
      onClose()
    } catch (err) {
      setError(apiError(err, 'Não foi possível agendar a troca.'))
      setSaving(false)
    }
  }

  const content = (
    <div
      onClick={() => { if (!saving) onClose() }}
      style={{
        position: 'fixed', inset: 0, zIndex: 10000, background: 'rgba(0,0,0,0.38)',
        display: 'flex', alignItems: isMobile ? 'flex-end' : 'center', justifyContent: 'center',
        fontFamily: typography.fontFamily,
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="club-plan-title"
        onClick={e => e.stopPropagation()}
        style={{
          background: '#fff', width: isMobile ? '100%' : 440, maxWidth: '100%',
          borderRadius: isMobile ? '20px 20px 0 0' : 18, boxShadow: '0 -8px 40px rgba(0,0,0,0.20)',
          padding: isMobile ? '10px 16px calc(18px + env(safe-area-inset-bottom))' : '20px 22px 20px',
          display: 'flex', flexDirection: 'column', gap: 14, maxHeight: '92vh', overflowY: 'auto',
        }}
      >
        {isMobile && <div style={{ width: 38, height: 4, borderRadius: 4, background: 'rgba(0,0,0,0.15)', margin: '0 auto' }} />}
        <div>
          <h3 id="club-plan-title" style={{ margin: 0, fontSize: 17, fontWeight: 700, color: colors.gray[900], letterSpacing: '-0.01em' }}>
            Trocar plano
          </h3>
          <p style={{ margin: '4px 0 0', fontSize: 12.5, color: colors.gray[500] }}>
            {venc ? `Vale a partir de ${venc}.` : 'Vale a partir do próximo vencimento.'} Até lá o membro continua no plano atual
            {atual ? <> ({atual.name})</> : null}.
          </p>
        </div>

        {plans === null && !loadError && (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 20, color: colors.gray[500] }}>
            <Loader2 size={18} style={{ animation: 'club-spin 0.8s linear infinite' }} />
          </div>
        )}
        {loadError && (
          <div role="alert" style={{ fontSize: 12.5, color: inkLight.bad.text, background: inkLight.bad.bg, borderRadius: 10, padding: '9px 11px' }}>
            Não foi possível carregar os planos. Feche e abra de novo.
          </div>
        )}
        {plans !== null && opcoes.length === 0 && (
          <div style={{ fontSize: 13, color: colors.gray[700], background: 'rgba(0,0,0,0.035)', borderRadius: 12, padding: '12px 14px' }}>
            Não há outro plano ativo para trocar. Crie o plano na aba Planos.
          </div>
        )}

        {opcoes.length > 0 && (
          <div role="radiogroup" aria-label="Plano novo" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {opcoes.map(p => {
              const on = p.id === sel
              const ganha = atual ? p.serviceNames.filter(n => !atual.serviceNames.includes(n)) : []
              const perde = atual ? atual.serviceNames.filter(n => !p.serviceNames.includes(n)) : []
              const mantem = atual ? p.serviceNames.filter(n => atual.serviceNames.includes(n)) : p.serviceNames
              return (
                <button
                  key={p.id}
                  type="button"
                  role="radio"
                  aria-checked={on}
                  onClick={() => setSel(p.id)}
                  style={{
                    textAlign: 'left', padding: '12px 14px', borderRadius: 12, cursor: 'pointer', fontFamily: typography.fontFamily,
                    border: on ? `1.5px solid ${colors.gray[900]}` : `1px solid ${colors.gray.borderMd}`,
                    background: on ? 'rgba(0,0,0,0.025)' : '#fff', display: 'flex', flexDirection: 'column', gap: 4,
                    position: 'relative', overflow: 'hidden',
                  }}
                >
                  <span style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 3, background: p.color ?? colors.gray.borderMd }} />
                  <span style={{ display: 'flex', alignItems: 'baseline', gap: 10, paddingLeft: 4 }}>
                    <span style={{ flex: 1, minWidth: 0, fontSize: 14, fontWeight: 700, color: colors.gray[900] }}>{p.name}</span>
                    <span style={{ fontSize: 15, fontWeight: 700, color: colors.gray[900], fontVariantNumeric: 'tabular-nums', flexShrink: 0 }}>{brl(p.price)}</span>
                  </span>
                  <span style={{ fontSize: 11.5, color: colors.gray[500], lineHeight: 1.45, paddingLeft: 4 }}>
                    {ganha.map(n => <span key={`g${n}`} style={{ color: inkLight.ok.text, fontWeight: 600 }}>+ {n} · </span>)}
                    {perde.map(n => <span key={`p${n}`} style={{ color: inkLight.warn.text, fontWeight: 600 }}>− {n} · </span>)}
                    {mantem.join(' · ')}
                  </span>
                </button>
              )
            })}
          </div>
        )}

        {escolhido && atual && (
          <div style={{ borderRadius: 12, background: 'rgba(37,99,235,0.07)', border: '1px solid rgba(37,99,235,0.22)', color: '#1e40af', padding: '10px 12px', fontSize: 12.5, lineHeight: 1.5 }}>
            {venc ? <>Até <b>{venc}</b> continua no {atual.name}. </> : null}
            {isCard
              ? <>A cobrança{venc ? <> de <b>{venc}</b></> : null} no cartão já sai <b>{brl(escolhido.price)}</b>.</>
              : <>A renovação{venc ? <> de <b>{venc}</b></> : null} no balcão passa a ser <b>{brl(escolhido.price)}</b>.</>}
            {' '}Nada é cobrado agora.
          </div>
        )}

        {error && (
          <div role="alert" style={{ display: 'flex', gap: 8, alignItems: 'flex-start', fontSize: 12.5, color: inkLight.bad.text, background: inkLight.bad.bg, borderRadius: 10, padding: '9px 11px' }}>
            <AlertCircle size={15} style={{ flexShrink: 0, marginTop: 1 }} />
            <span>{error}</span>
          </div>
        )}

        <button
          type="button"
          onClick={salvar}
          disabled={!escolhido || saving}
          style={{
            minHeight: 50, borderRadius: 14, border: 'none', fontSize: 15, fontWeight: 700, fontFamily: typography.fontFamily,
            background: !escolhido || saving ? 'rgba(0,0,0,0.10)' : colors.red.DEFAULT,
            color: !escolhido || saving ? colors.gray[500] : '#fff',
            cursor: !escolhido || saving ? 'not-allowed' : 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          }}
        >
          {saving && <Loader2 size={16} style={{ animation: 'club-spin 0.8s linear infinite' }} />}
          {saving ? 'Agendando…' : venc ? `Agendar troca para ${venc}` : 'Agendar troca'}
        </button>
        <button
          type="button"
          onClick={onClose}
          disabled={saving}
          style={{ minHeight: 40, border: 'none', background: 'transparent', color: colors.gray[700], fontSize: 13, fontWeight: 600, fontFamily: typography.fontFamily, cursor: 'pointer' }}
        >
          Cancelar
        </button>
      </div>
    </div>
  )

  return createPortal(content, document.body)
}
