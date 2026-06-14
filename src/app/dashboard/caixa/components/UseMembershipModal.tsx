'use client'
// src/app/dashboard/caixa/components/UseMembershipModal.tsx
//
// Modal "Usar assinatura" — espelha UsePackageModal, mas SEM saldo (ilimitado).
// 1. Lista cartões de assinatura ATIVOS do cliente
// 2. Toca num cartão -> mostra itens de SERVIÇO que ele cobre
// 3. "Aplicar" -> POST /sales/:id/items/:itemId/apply-membership { cardId }

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import {
  X, Loader2, AlertCircle, Ticket, Infinity as InfinityIcon, ChevronRight, Check,
  ArrowLeft,
} from 'lucide-react'

import api from '@/shared/lib/apiClient'
import { colors, typography, transitions, radius } from '@/shared/theme'
import { Sale, SaleItem } from '@/features/sales/types'
import { formatBRL } from '@/features/sales/utils/format'

// Cartão de assinatura ativo (payload de GET /membership-cards/client/:id/active)
export interface MembershipCardLite {
  id:         string
  cardNumber: string
  planName:   string
  validUntil: string | null
  status:     'ACTIVE' | 'EXPIRED' | 'CANCELED'
  recurring?: boolean
  plan?: {
    id:                 string
    name:               string
    color?:             string | null
    lockProfessionalId?: string | null
    allServices:        boolean
    services:           { service: { id: string; name: string; color?: string | null } }[]
  }
}

interface Props {
  sale:       Sale
  isMobile:   boolean
  onApplied:  (updatedSale: Sale) => void
  onClose:    () => void
}

export default function UseMembershipModal({ sale, isMobile, onApplied, onClose }: Props) {
  const [cards, setCards]       = useState<MembershipCardLite[]>([])
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState<string | null>(null)
  const [selectedCard, setSelectedCard] = useState<MembershipCardLite | null>(null)
  const [applyingItemId, setApplyingItemId] = useState<string | null>(null)
  const [mounted, setMounted]   = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 10)
    return () => clearTimeout(t)
  }, [])

  useEffect(() => {
    let cancelled = false
    if (!sale.clientId) {
      const t = setTimeout(() => { if (!cancelled) setLoading(false) }, 0)
      return () => { cancelled = true; clearTimeout(t) }
    }
    const tLoad = setTimeout(() => { if (!cancelled) setLoading(true) }, 0)
    api.get(`/membership-cards/client/${sale.clientId}/active`)
      .then(res => {
        if (cancelled) return
        const data = res.data?.data ?? res.data
        setCards(Array.isArray(data) ? data : [])
      })
      .catch(() => { if (!cancelled) setCards([]) })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true; clearTimeout(tLoad) }
  }, [sale.clientId])

  function handleClose() {
    setMounted(false)
    setTimeout(onClose, 200)
  }

  async function applyToItem(item: SaleItem) {
    if (!selectedCard) return
    setError(null)
    setApplyingItemId(item.id)
    try {
      await api.post(`/sales/${sale.id}/items/${item.id}/apply-membership`, {
        cardId: selectedCard.id,
      })
      const r = await api.get(`/sales/${sale.id}`)
      const updated: Sale = r.data?.data ?? r.data
      onApplied(updated)
      handleClose()
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: string } } }
      setError(e.response?.data?.error ?? 'Erro ao aplicar assinatura')
      setApplyingItemId(null)
    }
  }

  // Itens do carrinho cobríveis pelo cartão selecionado
  const eligibleItems: Array<{ item: SaleItem; eligible: boolean; reason?: string }> = []
  if (selectedCard) {
    const plan = selectedCard.plan
    for (const item of sale.items) {
      if (item.appliedPackageCardId) {
        eligibleItems.push({ item, eligible: false, reason: 'Já tem pacote aplicado' })
        continue
      }
      if (item.appliedMembershipCardId) {
        eligibleItems.push({ item, eligible: false, reason: 'Já tem assinatura aplicada' })
        continue
      }
      if (item.type !== 'SERVICE') {
        eligibleItems.push({ item, eligible: false, reason: 'Só serviços usam assinatura' })
        continue
      }
      const covered = !plan || plan.allServices ||
        plan.services.some(s => s.service.id === item.serviceId)
      if (!covered) {
        eligibleItems.push({ item, eligible: false, reason: 'Serviço não incluso na assinatura' })
        continue
      }
      if (plan?.lockProfessionalId && item.professionalId &&
          plan.lockProfessionalId !== item.professionalId) {
        eligibleItems.push({ item, eligible: false, reason: 'Profissional do item não bate com a assinatura' })
        continue
      }
      eligibleItems.push({ item, eligible: true })
    }
  }

  const content = (
    <div
      onClick={handleClose}
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(0,0,0,0.5)',
        backdropFilter: 'blur(3px)',
        zIndex: 9998,
        display: 'flex',
        alignItems: isMobile ? 'flex-end' : 'center',
        justifyContent: 'center',
        opacity: mounted ? 1 : 0,
        transition: 'opacity 0.2s ease',
        fontFamily: typography.fontFamily,
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: '#fff',
          width: isMobile ? '100%' : 540,
          maxWidth: '100%',
          maxHeight: isMobile ? '90vh' : '85vh',
          borderRadius: isMobile ? '20px 20px 0 0' : radius.lg,
          overflow: 'hidden',
          display: 'flex', flexDirection: 'column',
          transform: mounted
            ? 'translateY(0)'
            : isMobile ? 'translateY(100%)' : 'scale(0.97)',
          transition: `transform 0.25s ${transitions.spring ?? 'cubic-bezier(0.34,1.56,0.64,1)'}`,
          boxShadow: '0 -8px 40px rgba(0,0,0,0.18)',
        }}
      >
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center',
          padding: '16px 20px',
          borderBottom: `1px solid ${colors.gray.border}`,
          flexShrink: 0,
          gap: 10,
        }}>
          {selectedCard ? (
            <button
              onClick={() => setSelectedCard(null)}
              aria-label="Voltar"
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                padding: 4, display: 'flex',
                WebkitTapHighlightColor: 'transparent',
              }}
            >
              <ArrowLeft size={18} color={colors.gray[700]} strokeWidth={2} />
            </button>
          ) : (
            <Ticket size={18} color="#6366f1" strokeWidth={2} />
          )}
          <h2 style={{
            flex: 1,
            margin: 0,
            fontSize: 15, fontWeight: 700,
            color: colors.gray[900],
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          }}>
            {selectedCard
              ? `Aplicar #${selectedCard.cardNumber.slice(-6)}`
              : `Assinaturas de ${sale.clientName ?? 'cliente'}`}
          </h2>
          <button
            onClick={handleClose}
            aria-label="Fechar"
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              padding: 4, display: 'flex',
              WebkitTapHighlightColor: 'transparent',
            }}
          >
            <X size={18} color={colors.gray[700]} strokeWidth={2} />
          </button>
        </div>

        {/* Body */}
        <div style={{
          flex: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch',
          padding: isMobile ? 14 : 18,
        }}>
          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: 50 }}>
              <Loader2 size={22} style={{ animation: 'mem-spin 0.8s linear infinite', color: '#6366f1' }} />
            </div>
          ) : !sale.clientId ? (
            <EmptyState title="Sem cliente" subtitle="Vincule um cliente à venda pra usar uma assinatura." />
          ) : cards.length === 0 ? (
            <EmptyState
              title="Sem assinaturas ativas"
              subtitle={`${sale.clientName ?? 'Este cliente'} não tem assinaturas ativas.`}
            />
          ) : !selectedCard ? (
            // ─── ETAPA 1: Lista de cartões ───
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {cards.map(card => {
                const dot = card.plan?.color ?? '#6366f1'
                const scope = card.plan?.allServices
                  ? 'Todos os serviços'
                  : `${card.plan?.services.length ?? 0} serviço(s)`
                return (
                  <button
                    key={card.id}
                    onClick={() => setSelectedCard(card)}
                    style={{
                      width: '100%',
                      display: 'flex', alignItems: 'center', gap: 12,
                      padding: '12px 14px',
                      background: '#fff',
                      border: `1px solid ${colors.gray.border}`,
                      borderRadius: 12,
                      cursor: 'pointer',
                      textAlign: 'left',
                      fontFamily: 'inherit',
                      transition: `all ${transitions.fast}`,
                      WebkitTapHighlightColor: 'transparent',
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.borderColor = dot
                      e.currentTarget.style.transform = 'translateY(-1px)'
                      e.currentTarget.style.boxShadow = `0 4px 14px ${dot}30`
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.borderColor = colors.gray.border
                      e.currentTarget.style.transform = 'translateY(0)'
                      e.currentTarget.style.boxShadow = 'none'
                    }}
                  >
                    <div style={{
                      width: 38, height: 38, borderRadius: 9,
                      background: dot,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      flexShrink: 0,
                    }}>
                      <Ticket size={17} color="#fff" strokeWidth={2} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{
                        fontSize: 13, fontWeight: 700, color: colors.gray[900],
                        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                      }}>
                        {card.planName}
                      </div>
                      <div style={{
                        fontSize: 10, color: colors.gray.dimText,
                        marginTop: 2, fontVariantNumeric: 'tabular-nums',
                      }}>
                        #{card.cardNumber} · {card.validUntil ? `expira ${new Date(card.validUntil).toLocaleDateString('pt-BR')}` : 'sem validade'} · {scope}
                      </div>
                    </div>
                    <div style={{
                      display: 'flex', alignItems: 'center', gap: 3,
                      color: '#6366f1', flexShrink: 0,
                    }}>
                      <InfinityIcon size={16} strokeWidth={2.2} />
                      <span style={{ fontSize: 9, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.04em' }}>
                        ilimitada
                      </span>
                    </div>
                    <ChevronRight size={15} color={colors.gray.dimText} strokeWidth={2} />
                  </button>
                )
              })}
            </div>
          ) : (
            // ─── ETAPA 2: Aplicar a itens ───
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{
                padding: '10px 12px',
                background: colors.background.page,
                borderRadius: 10,
                fontSize: 11,
                color: colors.gray[700],
              }}>
                <strong style={{ color: colors.gray[900] }}>{selectedCard.planName}</strong>
                {' · '}
                <span style={{ fontVariantNumeric: 'tabular-nums' }}>#{selectedCard.cardNumber}</span>
                {' · '}
                <span style={{ color: '#6366f1', fontWeight: 700 }}>ilimitada</span>
              </div>

              {sale.items.length === 0 ? (
                <EmptyState
                  title="Carrinho vazio"
                  subtitle="Adicione um serviço ao carrinho primeiro pra aplicar a assinatura."
                />
              ) : (
                <>
                  <div style={{
                    fontSize: 10, fontWeight: 700,
                    color: colors.gray.dimText,
                    textTransform: 'uppercase', letterSpacing: '.07em',
                  }}>
                    Itens do carrinho
                  </div>
                  {eligibleItems.map(({ item, eligible, reason }) => (
                    <div
                      key={item.id}
                      style={{
                        padding: '10px 12px',
                        background: eligible ? '#fff' : colors.background.page,
                        border: `1px solid ${eligible ? colors.gray.border : colors.gray.borderMd}`,
                        borderRadius: 10,
                        display: 'flex', alignItems: 'center', gap: 10,
                        opacity: eligible ? 1 : 0.7,
                      }}
                    >
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{
                          fontSize: 12, fontWeight: 700,
                          color: colors.gray[900],
                          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                        }}>
                          {item.name}
                          {item.quantity > 1 && (
                            <span style={{ color: colors.gray.dimText, fontWeight: 500 }}>
                              {' × '}{item.quantity}
                            </span>
                          )}
                        </div>
                        {eligible ? (
                          <div style={{ fontSize: 10, color: colors.gray.dimText, marginTop: 2 }}>
                            coberto pela assinatura · economiza {formatBRL(item.total)}
                          </div>
                        ) : (
                          <div style={{ fontSize: 10, color: '#b45309', marginTop: 2, fontWeight: 600 }}>
                            {reason}
                          </div>
                        )}
                      </div>
                      {eligible ? (
                        <button
                          onClick={() => applyToItem(item)}
                          disabled={applyingItemId != null}
                          style={{
                            padding: '7px 11px',
                            borderRadius: 8,
                            border: 'none',
                            background: applyingItemId === item.id ? colors.gray.borderMd : 'linear-gradient(135deg, #6366f1, #4f46e5)',
                            color: '#fff',
                            fontSize: 11, fontWeight: 700,
                            cursor: applyingItemId != null ? 'not-allowed' : 'pointer',
                            fontFamily: 'inherit',
                            letterSpacing: '.04em', textTransform: 'uppercase',
                            display: 'flex', alignItems: 'center', gap: 4,
                            flexShrink: 0,
                            WebkitTapHighlightColor: 'transparent',
                          }}
                        >
                          {applyingItemId === item.id ? (
                            <Loader2 size={11} style={{ animation: 'mem-spin 0.8s linear infinite' }} />
                          ) : (
                            <Check size={11} strokeWidth={2.5} />
                          )}
                          Aplicar
                        </button>
                      ) : (
                        <span style={{
                          fontSize: 9, fontWeight: 700,
                          color: colors.gray.dimText,
                          textTransform: 'uppercase', letterSpacing: '.04em',
                          flexShrink: 0,
                        }}>—</span>
                      )}
                    </div>
                  ))}
                </>
              )}
            </div>
          )}

          {error && (
            <div style={{
              marginTop: 14,
              padding: '8px 10px',
              background: 'rgba(220,38,38,0.06)',
              border: `1px solid ${colors.red.border}`,
              borderRadius: 7,
              fontSize: 11,
              color: colors.red.DEFAULT,
              display: 'flex', alignItems: 'center', gap: 6,
            }}>
              <AlertCircle size={12} strokeWidth={2.4} />
              {error}
            </div>
          )}
        </div>
      </div>

      <style>{`@keyframes mem-spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )

  if (typeof document === 'undefined') return null
  return createPortal(content, document.body)
}

function EmptyState({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div style={{
      textAlign: 'center',
      padding: '40px 20px',
      color: colors.gray.dimText,
    }}>
      <Ticket size={32} style={{ opacity: 0.3, marginBottom: 8 }} />
      <div style={{ fontSize: 13, fontWeight: 700, color: colors.gray[900], marginBottom: 4 }}>
        {title}
      </div>
      <div style={{ fontSize: 11 }}>
        {subtitle}
      </div>
    </div>
  )
}
