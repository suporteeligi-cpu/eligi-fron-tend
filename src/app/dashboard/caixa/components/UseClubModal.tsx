'use client'
// src/app/dashboard/caixa/components/UseClubModal.tsx
//
// Modal "Usar clube" (EligiClub) — caminho TOTALMENTE À PARTE de pacote/assinatura.
// Espelha o UseMembershipModal na casca/UX, mas com fonte e endpoints do clube:
//   1. lista assinaturas de clube ATIVAS do cliente (GET /club-subscriptions?clientId=&status=ACTIVE)
//   2. ao escolher uma, busca a cobertura do plano (GET /club/:planId -> services[])
//   3. "Aplicar" -> POST /sales/:id/items/:itemId/apply-club { subscriptionId }
//      (item zera + marca a ficha; comissao NAO e gerada p/ item de clube)
// Nada aqui toca pacote/assinatura nem a logica de comissao/fechamento deles.

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { X, Loader2, AlertCircle, Globe, Infinity as InfinityIcon, ChevronRight, Check, ArrowLeft } from 'lucide-react'

import api from '@/shared/lib/apiClient'
import { colors, typography, transitions, radius } from '@/shared/theme'
import { Sale, SaleItem } from '@/features/sales/types'
import { formatBRL } from '@/features/sales/utils/format'

// Assinatura de clube ativa (payload de GET /club-subscriptions?clientId=&status=ACTIVE)
export interface ClubSubLite {
  id:               string
  status:           string
  value:            number | null
  currentPeriodEnd: string | null
  plan: { id: string; name: string; price: number; color?: string | null }
}

const CLUB = '#dc2626' // tema EligiClub (vermelho), distinto do roxo da assinatura

interface Props {
  sale:      Sale
  isMobile:  boolean
  onApplied: (updatedSale: Sale) => void
  onClose:   () => void
}

export default function UseClubModal({ sale, isMobile, onApplied, onClose }: Props) {
  const [subs, setSubs]       = useState<ClubSubLite[]>([])
  const [loading, setLoading] = useState(() => !!sale.clientId)
  const [error, setError]     = useState<string | null>(null)
  const [selected, setSelected] = useState<ClubSubLite | null>(null)
  const [coveredIds, setCoveredIds] = useState<string[] | null>(null) // null = carregando cobertura
  const [applyingItemId, setApplyingItemId] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 10)
    return () => clearTimeout(t)
  }, [])

  // etapa 1: assinaturas ativas do cliente
  useEffect(() => {
    if (!sale.clientId) return
    let cancelled = false
    const run = async () => {
      try {
        const res = await api.get(`/club-subscriptions?clientId=${sale.clientId}&status=ACTIVE`)
        if (cancelled) return
        const data = res.data?.data ?? res.data
        setSubs(Array.isArray(data) ? data : [])
      } catch {
        if (!cancelled) setSubs([])
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    void run()
    return () => { cancelled = true }
  }, [sale.clientId])

  // etapa 2 (ao escolher): cobertura do plano
  useEffect(() => {
    if (!selected) return
    let cancelled = false
    const run = async () => {
      setCoveredIds(null)
      try {
        const res = await api.get(`/club/${selected.plan.id}`)
        if (cancelled) return
        const data = res.data?.data ?? res.data
        const svcs = (data?.services ?? []) as { service: { id: string } }[]
        setCoveredIds(svcs.map(s => s.service.id))
      } catch {
        if (!cancelled) setCoveredIds([])
      }
    }
    void run()
    return () => { cancelled = true }
  }, [selected])

  function handleClose() {
    setMounted(false)
    setTimeout(onClose, 200)
  }

  async function applyToItem(item: SaleItem) {
    if (!selected) return
    setError(null)
    setApplyingItemId(item.id)
    try {
      await api.post(`/sales/${sale.id}/items/${item.id}/apply-club`, { subscriptionId: selected.id })
      const r = await api.get(`/sales/${sale.id}`)
      const updated: Sale = r.data?.data ?? r.data
      onApplied(updated)
      handleClose()
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: string } } }
      setError(e.response?.data?.error ?? 'Erro ao aplicar clube')
      setApplyingItemId(null)
    }
  }

  // itens do carrinho cobríveis pela assinatura selecionada
  const eligibleItems: Array<{ item: SaleItem; eligible: boolean; reason?: string }> = []
  if (selected && coveredIds != null) {
    for (const item of sale.items) {
      const clubApplied = (item as { appliedClubSubscriptionId?: string | null }).appliedClubSubscriptionId
      if (item.appliedPackageCardId)      { eligibleItems.push({ item, eligible: false, reason: 'Já tem pacote aplicado' }); continue }
      if (item.appliedMembershipCardId)   { eligibleItems.push({ item, eligible: false, reason: 'Já tem assinatura aplicada' }); continue }
      if (clubApplied)                    { eligibleItems.push({ item, eligible: false, reason: 'Já tem clube aplicado' }); continue }
      if (item.type !== 'SERVICE')        { eligibleItems.push({ item, eligible: false, reason: 'Só serviços usam o clube' }); continue }
      if (!item.serviceId || !coveredIds.includes(item.serviceId)) {
        eligibleItems.push({ item, eligible: false, reason: 'Serviço não incluso no clube' }); continue
      }
      eligibleItems.push({ item, eligible: true })
    }
  }

  const content = (
    <div
      onClick={handleClose}
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(3px)',
        zIndex: 9998, display: 'flex', alignItems: isMobile ? 'flex-end' : 'center', justifyContent: 'center',
        opacity: mounted ? 1 : 0, transition: 'opacity 0.2s ease', fontFamily: typography.fontFamily,
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: '#fff', width: isMobile ? '100%' : 540, maxWidth: '100%',
          maxHeight: isMobile ? '90vh' : '85vh', borderRadius: isMobile ? '20px 20px 0 0' : radius.lg,
          overflow: 'hidden', display: 'flex', flexDirection: 'column',
          transform: mounted ? 'translateY(0)' : isMobile ? 'translateY(100%)' : 'scale(0.97)',
          transition: `transform 0.25s ${transitions.spring ?? 'cubic-bezier(0.34,1.56,0.64,1)'}`,
          boxShadow: '0 -8px 40px rgba(0,0,0,0.18)',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', padding: '16px 20px', borderBottom: `1px solid ${colors.gray.border}`, flexShrink: 0, gap: 10 }}>
          {selected ? (
            <button onClick={() => setSelected(null)} aria-label="Voltar" style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, display: 'flex', WebkitTapHighlightColor: 'transparent' }}>
              <ArrowLeft size={18} color={colors.gray[700]} strokeWidth={2} />
            </button>
          ) : (
            <Globe size={18} color={CLUB} strokeWidth={2} />
          )}
          <h2 style={{ flex: 1, margin: 0, fontSize: 15, fontWeight: 700, color: colors.gray[900], whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {selected ? `Aplicar ${selected.plan.name}` : `Clube de ${sale.clientName ?? 'cliente'}`}
          </h2>
          <button onClick={handleClose} aria-label="Fechar" style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, display: 'flex', WebkitTapHighlightColor: 'transparent' }}>
            <X size={18} color={colors.gray[700]} strokeWidth={2} />
          </button>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch', padding: isMobile ? 14 : 18 }}>
          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: 50 }}>
              <Loader2 size={22} style={{ animation: 'club-spin 0.8s linear infinite', color: CLUB }} />
            </div>
          ) : !sale.clientId ? (
            <EmptyState title="Sem cliente" subtitle="Vincule um cliente à venda pra usar o clube." />
          ) : subs.length === 0 ? (
            <EmptyState title="Sem assinaturas de clube ativas" subtitle={`${sale.clientName ?? 'Este cliente'} não tem assinatura de clube ativa.`} />
          ) : !selected ? (
            // ─── ETAPA 1: lista de assinaturas ───
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {subs.map(sub => {
                const dot = sub.plan.color ?? CLUB
                return (
                  <button
                    key={sub.id}
                    onClick={() => setSelected(sub)}
                    style={{
                      width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px',
                      background: '#fff', border: `1px solid ${colors.gray.border}`, borderRadius: 12,
                      cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit',
                      transition: `all ${transitions.fast}`, WebkitTapHighlightColor: 'transparent',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = dot; e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = `0 4px 14px ${dot}30` }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = colors.gray.border; e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none' }}
                  >
                    <div style={{ width: 38, height: 38, borderRadius: 9, background: dot, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Globe size={17} color="#fff" strokeWidth={2} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: colors.gray[900], whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{sub.plan.name}</div>
                      <div style={{ fontSize: 10, color: colors.gray.dimText, marginTop: 2 }}>
                        {sub.currentPeriodEnd ? `vence ${new Date(sub.currentPeriodEnd).toLocaleDateString('pt-BR')}` : 'ativo'}
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 3, color: CLUB, flexShrink: 0 }}>
                      <InfinityIcon size={16} strokeWidth={2.2} />
                      <span style={{ fontSize: 9, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.04em' }}>clube</span>
                    </div>
                    <ChevronRight size={15} color={colors.gray.dimText} strokeWidth={2} />
                  </button>
                )
              })}
            </div>
          ) : coveredIds == null ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}>
              <Loader2 size={20} style={{ animation: 'club-spin 0.8s linear infinite', color: CLUB }} />
            </div>
          ) : (
            // ─── ETAPA 2: aplicar a itens ───
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ padding: '10px 12px', background: colors.background.page, borderRadius: 10, fontSize: 11, color: colors.gray[700] }}>
                <strong style={{ color: colors.gray[900] }}>{selected.plan.name}</strong>{' · '}
                <span style={{ color: CLUB, fontWeight: 700 }}>clube</span>{' · '}
                <span>{coveredIds.length} serviço(s) coberto(s)</span>
              </div>

              {sale.items.length === 0 ? (
                <EmptyState title="Carrinho vazio" subtitle="Adicione um serviço ao carrinho primeiro pra aplicar o clube." />
              ) : (
                <>
                  <div style={{ fontSize: 10, fontWeight: 700, color: colors.gray.dimText, textTransform: 'uppercase', letterSpacing: '.07em' }}>Itens do carrinho</div>
                  {eligibleItems.map(({ item, eligible, reason }) => (
                    <div key={item.id} style={{ padding: '10px 12px', background: eligible ? '#fff' : colors.background.page, border: `1px solid ${eligible ? colors.gray.border : colors.gray.borderMd}`, borderRadius: 10, display: 'flex', alignItems: 'center', gap: 10, opacity: eligible ? 1 : 0.7 }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 12, fontWeight: 700, color: colors.gray[900], whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {item.name}{item.quantity > 1 && <span style={{ color: colors.gray.dimText, fontWeight: 500 }}>{' × '}{item.quantity}</span>}
                        </div>
                        {eligible ? (
                          <div style={{ fontSize: 10, color: colors.gray.dimText, marginTop: 2 }}>coberto pelo clube · economiza {formatBRL(item.total)}</div>
                        ) : (
                          <div style={{ fontSize: 10, color: '#b45309', marginTop: 2, fontWeight: 600 }}>{reason}</div>
                        )}
                      </div>
                      {eligible ? (
                        <button
                          onClick={() => applyToItem(item)}
                          disabled={applyingItemId != null}
                          style={{
                            padding: '7px 11px', borderRadius: 8, border: 'none',
                            background: applyingItemId === item.id ? colors.gray.borderMd : colors.red.gradient,
                            color: '#fff', fontSize: 11, fontWeight: 700, cursor: applyingItemId != null ? 'not-allowed' : 'pointer',
                            fontFamily: 'inherit', letterSpacing: '.04em', textTransform: 'uppercase',
                            display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0, WebkitTapHighlightColor: 'transparent',
                          }}
                        >
                          {applyingItemId === item.id ? <Loader2 size={11} style={{ animation: 'club-spin 0.8s linear infinite' }} /> : <Check size={11} strokeWidth={2.5} />}
                          Aplicar
                        </button>
                      ) : (
                        <span style={{ fontSize: 9, fontWeight: 700, color: colors.gray.dimText, textTransform: 'uppercase', letterSpacing: '.04em', flexShrink: 0 }}>—</span>
                      )}
                    </div>
                  ))}
                </>
              )}
            </div>
          )}

          {error && (
            <div style={{ marginTop: 14, padding: '8px 10px', background: 'rgba(220,38,38,0.06)', border: `1px solid ${colors.red.border}`, borderRadius: 7, fontSize: 11, color: colors.red.DEFAULT, display: 'flex', alignItems: 'center', gap: 6 }}>
              <AlertCircle size={12} strokeWidth={2.4} />{error}
            </div>
          )}
        </div>
      </div>

      <style>{`@keyframes club-spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )

  if (typeof document === 'undefined') return null
  return createPortal(content, document.body)
}

function EmptyState({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div style={{ textAlign: 'center', padding: '40px 20px', color: colors.gray.dimText }}>
      <Globe size={32} style={{ opacity: 0.3, marginBottom: 8 }} />
      <div style={{ fontSize: 13, fontWeight: 700, color: colors.gray[900], marginBottom: 4 }}>{title}</div>
      <div style={{ fontSize: 11 }}>{subtitle}</div>
    </div>
  )
}
