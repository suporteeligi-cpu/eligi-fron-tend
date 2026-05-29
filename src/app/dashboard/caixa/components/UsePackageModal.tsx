'use client'
// src/app/dashboard/caixa/components/UsePackageModal.tsx
//
// Modal "Usar pacote" — abre a partir do CartPanel quando o cliente tem cards ativos.
// Fluxo:
//   1. Lista cartões ATIVOS do cliente
//   2. Toca em um card → mostra itens do carrinho que podem ser cobertos pelo pacote
//   3. Pra cada item compatível, botão "Aplicar" → chama POST /sales/:id/items/:itemId/apply-package

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import {
  X, Loader2, AlertCircle, Package as PackageIcon, ChevronRight, Check,
  ArrowLeft, CreditCard,
} from 'lucide-react'

import api from '@/shared/lib/apiClient'
import { colors, typography, transitions, radius } from '@/shared/theme'
import { Sale, SaleItem, PackageCardLite } from '@/features/sales/types'
import { formatBRL } from '@/features/sales/utils/format'

interface Props {
  sale:        Sale
  isMobile:    boolean
  onApplied:   (updatedSale: Sale) => void
  onClose:     () => void
}

export default function UsePackageModal({ sale, isMobile, onApplied, onClose }: Props) {
  const [cards, setCards]       = useState<PackageCardLite[]>([])
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState<string | null>(null)
  const [selectedCard, setSelectedCard] = useState<PackageCardLite | null>(null)
  const [applyingItemId, setApplyingItemId] = useState<string | null>(null)
  const [mounted, setMounted]   = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 10)
    return () => clearTimeout(t)
  }, [])

  // Carrega cards ativos do cliente
  useEffect(() => {
    let cancelled = false

    if (!sale.clientId) {
      // Defer setState pra escapar do "set-state-in-effect" do React Compiler
      const t = setTimeout(() => {
        if (!cancelled) setLoading(false)
      }, 0)
      return () => { cancelled = true; clearTimeout(t) }
    }

    const tLoad = setTimeout(() => {
      if (!cancelled) setLoading(true)
    }, 0)
    api.get(`/package-cards/client/${sale.clientId}/active`)
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
      await api.post(`/sales/${sale.id}/items/${item.id}/apply-package`, {
        cardId: selectedCard.id,
      })
      // Refetch a sale e atualiza
      const r = await api.get(`/sales/${sale.id}`)
      const updated: Sale = r.data?.data ?? r.data
      onApplied(updated)
      handleClose()
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: string } } }
      setError(e.response?.data?.error ?? 'Erro ao aplicar pacote')
      setApplyingItemId(null)
    }
  }

  // Items do carrinho que poderiam ser cobertos pelo card selecionado
  const eligibleItems: Array<{ item: SaleItem; balance: PackageCardLite['balances'][0] | null; reason?: string }> = []
  if (selectedCard) {
    for (const item of sale.items) {
      // Já tem pacote aplicado?
      if (item.appliedPackageCardId) {
        eligibleItems.push({ item, balance: null, reason: 'Já tem pacote aplicado' })
        continue
      }
      // Não é serviço?
      if (item.type !== 'SERVICE') {
        eligibleItems.push({ item, balance: null, reason: 'Só serviços podem usar pacote' })
        continue
      }
      // Tem balance pra esse serviço?
      const balance = selectedCard.balances.find(b => b.serviceId === item.serviceId)
      if (!balance) {
        eligibleItems.push({ item, balance: null, reason: 'Serviço não incluso neste pacote' })
        continue
      }
      const remaining = balance.initialQty - balance.usedQty
      if (remaining < item.quantity) {
        eligibleItems.push({ item, balance, reason: `Saldo insuficiente: ${remaining} restante(s)` })
        continue
      }
      // Trava de profissional
      if (selectedCard.package?.lockProfessionalId && item.professionalId &&
          selectedCard.package.lockProfessionalId !== item.professionalId) {
        eligibleItems.push({ item, balance, reason: 'Profissional do item não bate com pacote' })
        continue
      }
      eligibleItems.push({ item, balance })
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
            <CreditCard size={18} color={colors.red.DEFAULT} strokeWidth={2} />
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
              : `Cartões de ${sale.clientName ?? 'cliente'}`}
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
              <Loader2 size={22} style={{ animation: 'pkg-spin 0.8s linear infinite', color: colors.red.DEFAULT }} />
            </div>
          ) : !sale.clientId ? (
            <EmptyState
              title="Sem cliente"
              subtitle="Vincule um cliente à venda pra usar um pacote."
            />
          ) : cards.length === 0 ? (
            <EmptyState
              title="Sem cartões ativos"
              subtitle={`${sale.clientName ?? 'Este cliente'} não tem cartões de pacote ativos.`}
            />
          ) : !selectedCard ? (
            // ─── ETAPA 1: Lista de cartões ───
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {cards.map(card => {
                const remaining = card.balances.reduce((s, b) => s + (b.initialQty - b.usedQty), 0)
                const total     = card.balances.reduce((s, b) => s + b.initialQty, 0)
                const dot = card.package?.color ?? colors.red.DEFAULT
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
                      <PackageIcon size={17} color="#fff" strokeWidth={2} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{
                        fontSize: 13, fontWeight: 700, color: colors.gray[900],
                        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                      }}>
                        {card.packageName}
                      </div>
                      <div style={{
                        fontSize: 10, color: colors.gray.dimText,
                        marginTop: 2,
                        fontVariantNumeric: 'tabular-nums',
                      }}>
                        #{card.cardNumber} · {card.validUntil ? `expira ${new Date(card.validUntil).toLocaleDateString('pt-BR')}` : 'nunca expira'}
                      </div>
                    </div>
                    <div style={{
                      textAlign: 'right',
                      flexShrink: 0,
                    }}>
                      <div style={{
                        fontSize: 16, fontWeight: 800,
                        color: colors.gray[900],
                        fontVariantNumeric: 'tabular-nums',
                        letterSpacing: '-0.01em',
                        lineHeight: 1,
                      }}>
                        {remaining}<span style={{ color: colors.gray.dimText, fontSize: 11, fontWeight: 600 }}>/{total}</span>
                      </div>
                      <div style={{
                        fontSize: 9, color: colors.gray.dimText,
                        textTransform: 'uppercase', letterSpacing: '.05em',
                        marginTop: 2,
                      }}>Saldo</div>
                    </div>
                    <ChevronRight size={15} color={colors.gray.dimText} strokeWidth={2} />
                  </button>
                )
              })}
            </div>
          ) : (
            // ─── ETAPA 2: Aplicar a itens ───
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {/* Resumo do cartão */}
              <div style={{
                padding: '10px 12px',
                background: colors.background.page,
                borderRadius: 10,
                fontSize: 11,
                color: colors.gray[700],
              }}>
                <strong style={{ color: colors.gray[900] }}>{selectedCard.packageName}</strong>
                {' · '}
                <span style={{ fontVariantNumeric: 'tabular-nums' }}>
                  #{selectedCard.cardNumber}
                </span>
              </div>

              {sale.items.length === 0 ? (
                <EmptyState
                  title="Carrinho vazio"
                  subtitle="Adicione um serviço ao carrinho primeiro pra aplicar o pacote."
                />
              ) : (
                <>
                  <div style={{
                    fontSize: 10, fontWeight: 700,
                    color: colors.gray.dimText,
                    textTransform: 'uppercase',
                    letterSpacing: '.07em',
                  }}>
                    Itens do carrinho
                  </div>
                  {eligibleItems.map(({ item, balance, reason }) => {
                    const canApply = !reason && balance != null
                    const remaining = balance ? balance.initialQty - balance.usedQty : 0
                    return (
                      <div
                        key={item.id}
                        style={{
                          padding: '10px 12px',
                          background: canApply ? '#fff' : colors.background.page,
                          border: `1px solid ${canApply ? colors.gray.border : colors.gray.borderMd}`,
                          borderRadius: 10,
                          display: 'flex', alignItems: 'center', gap: 10,
                          opacity: canApply ? 1 : 0.7,
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
                          {canApply ? (
                            <div style={{
                              fontSize: 10, color: colors.gray.dimText,
                              marginTop: 2,
                            }}>
                              {remaining} disponíve{remaining !== 1 ? 'is' : 'l'} no pacote · economiza {formatBRL(item.total)}
                            </div>
                          ) : (
                            <div style={{
                              fontSize: 10, color: '#b45309',
                              marginTop: 2,
                              fontWeight: 600,
                            }}>
                              {reason}
                            </div>
                          )}
                        </div>
                        {canApply ? (
                          <button
                            onClick={() => applyToItem(item)}
                            disabled={applyingItemId != null}
                            style={{
                              padding: '7px 11px',
                              borderRadius: 8,
                              border: 'none',
                              background: applyingItemId === item.id ? colors.gray.borderMd : colors.red.gradient,
                              color: '#fff',
                              fontSize: 11, fontWeight: 700,
                              cursor: applyingItemId != null ? 'not-allowed' : 'pointer',
                              fontFamily: 'inherit',
                              letterSpacing: '.04em',
                              textTransform: 'uppercase',
                              display: 'flex', alignItems: 'center', gap: 4,
                              flexShrink: 0,
                              WebkitTapHighlightColor: 'transparent',
                            }}
                          >
                            {applyingItemId === item.id ? (
                              <Loader2 size={11} style={{ animation: 'pkg-spin 0.8s linear infinite' }} />
                            ) : (
                              <Check size={11} strokeWidth={2.5} />
                            )}
                            Aplicar
                          </button>
                        ) : (
                          <span style={{
                            fontSize: 9, fontWeight: 700,
                            color: colors.gray.dimText,
                            textTransform: 'uppercase',
                            letterSpacing: '.04em',
                            flexShrink: 0,
                          }}>—</span>
                        )}
                      </div>
                    )
                  })}
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

      <style>{`@keyframes pkg-spin { to { transform: rotate(360deg) } }`}</style>
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
      <PackageIcon size={32} style={{ opacity: 0.3, marginBottom: 8 }} />
      <div style={{ fontSize: 13, fontWeight: 700, color: colors.gray[900], marginBottom: 4 }}>
        {title}
      </div>
      <div style={{ fontSize: 11 }}>
        {subtitle}
      </div>
    </div>
  )
}
