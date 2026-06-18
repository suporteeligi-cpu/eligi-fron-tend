'use client'
// src/app/dashboard/caixa/components/CartPanel.tsx
//
// ⭐ NOVO: botão "Usar pacote" aparece quando:
//   - tem cliente vinculado
//   - cliente tem cartões ativos

import { useState, useEffect, useCallback } from 'react'
import { ShoppingCart, CreditCard, Loader2, XCircle, Layers, Ticket } from 'lucide-react'
import api from '@/shared/lib/apiClient'
import { colors, typography, transitions, radius } from '@/shared/theme'
import { Sale, ProfLite, PackageCardLite } from '@/features/sales/types'
import { formatBRL } from '@/features/sales/utils/format'
import ClientPicker from './ClientPicker'
import CartItemRow from './CartItemRow'
import PaymentModal from './PaymentModal'
import UsePackageModal from './UsePackageModal'
import UseMembershipModal, { MembershipCardLite } from './UseMembershipModal'

interface Props {
  sale:           Sale
  professionals:  ProfLite[]
  isMobile:       boolean
  onSaleUpdated:  (sale: Sale) => void
  onSaleClosed:   () => void
}

export default function CartPanel({
  sale, professionals, isMobile,
  onSaleUpdated, onSaleClosed,
}: Props) {
  const [updatingItemId, setUpdatingItemId] = useState<string | null>(null)
  const [discount, setDiscount] = useState(sale.discount.toString())
  const [notes, setNotes] = useState(sale.notes ?? '')
  const [showPayment, setShowPayment] = useState(false)
  const [showUsePackage, setShowUsePackage] = useState(false)
  const [showUseMembership, setShowUseMembership] = useState(false)
  const [cancelling,  setCancelling]  = useState(false)
  const [confirmingFree, setConfirmingFree] = useState(false)
  const [error,       setError]       = useState<string | null>(null)

  // ⭐ Cartões ativos do cliente atual (pra decidir se mostra botão "Usar pacote")
  const [activeCards, setActiveCards] = useState<PackageCardLite[]>([])
  const [loadingCards, setLoadingCards] = useState(false)
  const [activeMemberships, setActiveMemberships] = useState<MembershipCardLite[]>([])

  const refreshActiveCards = useCallback(() => {
    if (!sale.clientId) {
      setActiveCards([])
      return
    }
    const tLoad = setTimeout(() => setLoadingCards(true), 0)
    api.get(`/package-cards/client/${sale.clientId}/active`)
      .then(res => {
        const data = res.data?.data ?? res.data
        setActiveCards(Array.isArray(data) ? data : [])
      })
      .catch(() => setActiveCards([]))
      .finally(() => {
        setLoadingCards(false)
        clearTimeout(tLoad)
      })
  }, [sale.clientId])

  const refreshActiveMemberships = useCallback(() => {
    if (!sale.clientId) {
      setActiveMemberships([])
      return
    }
    api.get(`/membership-cards/client/${sale.clientId}/active`)
      .then(res => {
        const data = res.data?.data ?? res.data
        setActiveMemberships(Array.isArray(data) ? data : [])
      })
      .catch(() => setActiveMemberships([]))
  }, [sale.clientId])

  useEffect(() => {
    refreshActiveCards()
  }, [refreshActiveCards])

  useEffect(() => {
    refreshActiveMemberships()
  }, [refreshActiveMemberships])

  async function refetchSale() {
    try {
      const res = await api.get(`/sales/${sale.id}`)
      const data = res.data?.data ?? res.data
      onSaleUpdated(data)
    } catch { /* silencioso */ }
  }

  async function updateClient(client: { id: string | null; name: string | null; phone: string | null }) {
    try {
      const res = await api.patch(`/sales/${sale.id}`, {
        clientId: client.id,
        clientName: client.name ?? undefined,
        clientPhone: client.phone ?? undefined,
      })
      const data = res.data?.data ?? res.data
      onSaleUpdated(data)
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: string } } }
      setError(e.response?.data?.error ?? 'Erro ao atualizar cliente')
    }
  }

  async function commitDiscount() {
    const parsed = parseFloat(discount.replace(',', '.'))
    const newDiscount = isNaN(parsed) ? 0 : Math.max(0, parsed)
    if (Math.abs(newDiscount - sale.discount) < 0.01) return
    try {
      const res = await api.patch(`/sales/${sale.id}`, { discount: newDiscount })
      const data = res.data?.data ?? res.data
      onSaleUpdated(data)
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: string } } }
      setError(e.response?.data?.error ?? 'Erro ao atualizar desconto')
    }
  }

  async function commitNotes() {
    if (notes === (sale.notes ?? '')) return
    try {
      await api.patch(`/sales/${sale.id}`, { notes })
    } catch { /* silencioso */ }
  }

  async function changeItemQty(itemId: string, newQty: number) {
    setUpdatingItemId(itemId)
    setError(null)
    try {
      await api.patch(`/sales/${sale.id}/items/${itemId}`, { quantity: newQty })
      await refetchSale()
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: string } } }
      setError(e.response?.data?.error ?? 'Erro ao atualizar item')
    } finally {
      setUpdatingItemId(null)
    }
  }

  async function changeItemProf(itemId: string, profId: string | null) {
    setUpdatingItemId(itemId)
    setError(null)
    try {
      await api.patch(`/sales/${sale.id}/items/${itemId}`, { professionalId: profId })
      await refetchSale()
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: string } } }
      setError(e.response?.data?.error ?? 'Erro ao atualizar profissional')
    } finally {
      setUpdatingItemId(null)
    }
  }

  async function removeItem(itemId: string) {
    setUpdatingItemId(itemId)
    setError(null)
    try {
      await api.delete(`/sales/${sale.id}/items/${itemId}`)
      await refetchSale()
      refreshActiveCards()  // estorno pode ter restaurado saldos
      refreshActiveMemberships()
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: string } } }
      setError(e.response?.data?.error ?? 'Erro ao remover item')
    } finally {
      setUpdatingItemId(null)
    }
  }

  // ⭐ Remove pacote aplicado a um item específico
  async function removePackageFromItem(itemId: string) {
    setUpdatingItemId(itemId)
    setError(null)
    try {
      await api.delete(`/sales/${sale.id}/items/${itemId}/apply-package`)
      await refetchSale()
      refreshActiveCards()
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: string } } }
      setError(e.response?.data?.error ?? 'Erro ao remover pacote do item')
    } finally {
      setUpdatingItemId(null)
    }
  }

  // ⭐ Remove assinatura aplicada a um item específico
  async function removeMembershipFromItem(itemId: string) {
    setUpdatingItemId(itemId)
    setError(null)
    try {
      await api.delete(`/sales/${sale.id}/items/${itemId}/apply-membership`)
      await refetchSale()
      refreshActiveMemberships()
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: string } } }
      setError(e.response?.data?.error ?? 'Erro ao remover assinatura do item')
    } finally {
      setUpdatingItemId(null)
    }
  }

  async function cancelSale() {
    if (!window.confirm('Cancelar esta venda? Esta ação não pode ser desfeita.')) return
    setCancelling(true)
    setError(null)
    try {
      await api.post(`/sales/${sale.id}/cancel`)
      onSaleClosed()
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: string } } }
      setError(e.response?.data?.error ?? 'Erro ao cancelar venda')
      setCancelling(false)
    }
  }

  // ⭐ Confirma direto sem modal quando total = R$ 0 (ex: tudo pago via pacote)
  async function confirmFree() {
    setConfirmingFree(true)
    setError(null)
    try {
      const res = await api.post(`/sales/${sale.id}/confirm`, {})
      const confirmed = res.data?.data ?? res.data
      onSaleUpdated(confirmed)
      onSaleClosed()
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: string } } }
      setError(e.response?.data?.error ?? 'Erro ao confirmar venda')
      setConfirmingFree(false)
    }
  }

  const canCheckout = sale.items.length > 0

  // ⭐ Venda 100% paga via pacote (ou desconto) — sem modal de pagamento
  const isFreeCheckout = canCheckout && sale.total === 0

  // ⭐ Mostra botão "Usar pacote" só se cliente vinculado E tem cards ativos
  const canUsePackage = sale.clientId != null && activeCards.length > 0
  const canUseMembership = sale.clientId != null && activeMemberships.length > 0

  return (
    <>
      {showPayment && (
        <PaymentModal
          sale={sale}
          isMobile={isMobile}
          onClose={() => setShowPayment(false)}
          onPaid={(confirmed) => {
            onSaleUpdated(confirmed)
            setShowPayment(false)
            onSaleClosed()
          }}
        />
      )}

      {showUsePackage && (
        <UsePackageModal
          sale={sale}
          isMobile={isMobile}
          onApplied={(updated) => {
            onSaleUpdated(updated)
            refreshActiveCards()
          }}
          onClose={() => setShowUsePackage(false)}
        />
      )}

      {showUseMembership && (
        <UseMembershipModal
          sale={sale}
          isMobile={isMobile}
          onApplied={(updated) => {
            onSaleUpdated(updated)
            refreshActiveMemberships()
          }}
          onClose={() => setShowUseMembership(false)}
        />
      )}

      <div style={{
        display: 'flex', flexDirection: 'column',
        height: '100%',
        minHeight: 0,
        gap: 12,
        fontFamily: typography.fontFamily,
      }}>
        {/* Cliente */}
        <ClientPicker
          value={{
            id:    sale.clientId ?? null,
            name:  sale.clientName ?? null,
            phone: sale.clientPhone ?? null,
          }}
          onChange={updateClient}
        />

        {/* ⭐ Botão Usar Pacote */}
        {canUsePackage && (
          <button
            onClick={() => setShowUsePackage(true)}
            style={{
              display: 'flex', alignItems: 'center', gap: 9,
              padding: '11px 14px',
              borderRadius: 11,
              border: `1px solid ${colors.red.border}`,
              background: 'linear-gradient(135deg, rgba(220,38,38,0.05), rgba(220,38,38,0.10))',
              cursor: 'pointer',
              fontFamily: 'inherit',
              textAlign: 'left',
              WebkitTapHighlightColor: 'transparent',
              transition: `all ${transitions.fast}`,
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = 'linear-gradient(135deg, rgba(220,38,38,0.08), rgba(220,38,38,0.15))'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'linear-gradient(135deg, rgba(220,38,38,0.05), rgba(220,38,38,0.10))'
            }}
          >
            <div style={{
              width: 32, height: 32, borderRadius: 8,
              background: colors.red.gradient,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}>
              <Layers size={16} color="#fff" strokeWidth={2} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{
                fontSize: 12, fontWeight: 800,
                color: colors.red.DEFAULT,
                letterSpacing: '.04em', textTransform: 'uppercase',
              }}>
                Usar pacote
              </div>
              <div style={{
                fontSize: 10, color: colors.gray[700],
                marginTop: 1,
              }}>
                {activeCards.length} cartão(ões) ativo(s) do cliente
              </div>
            </div>
          </button>
        )}

        {/* ⭐ Botão Usar Assinatura */}
        {canUseMembership && (
          <button
            onClick={() => setShowUseMembership(true)}
            style={{
              display: 'flex', alignItems: 'center', gap: 9,
              padding: '11px 14px',
              borderRadius: 11,
              border: '1px solid rgba(99,102,241,0.30)',
              background: 'linear-gradient(135deg, rgba(99,102,241,0.05), rgba(99,102,241,0.12))',
              cursor: 'pointer',
              fontFamily: 'inherit',
              textAlign: 'left',
              WebkitTapHighlightColor: 'transparent',
              transition: `all ${transitions.fast}`,
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = 'linear-gradient(135deg, rgba(99,102,241,0.10), rgba(99,102,241,0.18))'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'linear-gradient(135deg, rgba(99,102,241,0.05), rgba(99,102,241,0.12))'
            }}
          >
            <div style={{
              width: 32, height: 32, borderRadius: 8,
              background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}>
              <Ticket size={16} color="#fff" strokeWidth={2} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{
                fontSize: 12, fontWeight: 800,
                color: '#4f46e5',
                letterSpacing: '.04em', textTransform: 'uppercase',
              }}>
                Usar assinatura
              </div>
              <div style={{
                fontSize: 10, color: colors.gray[700],
                marginTop: 1,
              }}>
                {activeMemberships.length} assinatura(s) ativa(s) do cliente
              </div>
            </div>
          </button>
        )}

        {loadingCards && sale.clientId && (
          <div style={{
            fontSize: 10, color: colors.gray.dimText,
            textAlign: 'center', padding: '2px 0',
          }}>
            Verificando pacotes do cliente...
          </div>
        )}

        {/* Itens */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          WebkitOverflowScrolling: 'touch',
          minHeight: 0,
        }}>
          {sale.items.length === 0 ? (
            <div style={{
              padding: '40px 20px',
              textAlign: 'center',
              background: colors.background.page,
              borderRadius: 12,
              border: `1px dashed ${colors.gray.borderMd}`,
              color: colors.gray.dimText,
              fontSize: 13,
            }}>
              <ShoppingCart size={28} style={{ opacity: 0.3, marginBottom: 8 }} />
              <div style={{ fontWeight: 600 }}>Carrinho vazio</div>
              <div style={{ fontSize: 11, marginTop: 4 }}>
                Adicione serviços, produtos ou pacotes do catálogo
              </div>
            </div>
          ) : (
            <div style={{
              display: 'flex', flexDirection: 'column', gap: 8,
              position: 'relative',
            }}>
              {sale.items.map(item => (
                <div key={item.id} style={{
                  position: 'relative',
                  opacity: updatingItemId === item.id ? 0.5 : 1,
                  pointerEvents: updatingItemId === item.id ? 'none' : 'auto',
                  transition: 'opacity 0.2s',
                }}>
                  <CartItemRow
                    item={item}
                    professionals={professionals}
                    isMobile={isMobile}
                    onChangeQty={qty => changeItemQty(item.id, qty)}
                    onChangeProf={pid => changeItemProf(item.id, pid)}
                    onRemove={() => removeItem(item.id)}
                    onRemovePackage={() => removePackageFromItem(item.id)}
                    onRemoveMembership={() => removeMembershipFromItem(item.id)}
                    suggestion={(() => {
                      const s = sale.packageSuggestions?.find(ps => ps.saleItemId === item.id)
                      return s ? { cardNumber: s.cardNumber, packageName: s.packageName, remaining: s.remaining } : null
                    })()}
                    onUsePackage={() => setShowUsePackage(true)}
                    disabled={updatingItemId === item.id}
                  />
                </div>
              ))}

            </div>
          )}
        </div>

        {/* Desconto + notas */}
        {sale.items.length > 0 && (
          <div style={{
            background: '#fff',
            border: `1px solid ${colors.gray.border}`,
            borderRadius: 11,
            padding: '10px 12px',
            display: 'flex', flexDirection: 'column', gap: 8,
            flexShrink: 0,
          }}>
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              gap: 8,
            }}>
              <span style={{
                fontSize: 11, fontWeight: 700,
                color: colors.gray.dimText,
                textTransform: 'uppercase',
                letterSpacing: '.06em',
              }}>Desconto</span>
              <div style={{ position: 'relative', width: 110 }}>
                <span style={{
                  position: 'absolute', left: 8, top: '50%',
                  transform: 'translateY(-50%)',
                  fontSize: 11, color: colors.gray.dimText, fontWeight: 600,
                }}>R$</span>
                <input
                  type="text"
                  inputMode="decimal"
                  value={discount}
                  onChange={e => setDiscount(e.target.value.replace(/[^\d,.]/g, ''))}
                  onBlur={commitDiscount}
                  placeholder="0,00"
                  style={{
                    width: '100%', boxSizing: 'border-box',
                    padding: '6px 8px 6px 26px',
                    borderRadius: 7,
                    border: `1px solid ${colors.gray.borderMd}`,
                    fontSize: 12, fontWeight: 600,
                    textAlign: 'right',
                    outline: 'none',
                    fontVariantNumeric: 'tabular-nums',
                    fontFamily: 'inherit',
                  }}
                />
              </div>
            </div>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              onBlur={commitNotes}
              placeholder="Observações da venda (opcional)..."
              rows={1}
              style={{
                width: '100%', boxSizing: 'border-box',
                padding: '7px 10px',
                borderRadius: 7,
                border: `1px solid ${colors.gray.borderMd}`,
                fontSize: 12,
                outline: 'none',
                resize: 'none',
                fontFamily: 'inherit',
                color: colors.gray[700],
                minHeight: 28,
                background: colors.background.page,
              }}
            />
          </div>
        )}

        {/* Total */}
        {sale.items.length > 0 && (
          <div style={{
            background: 'linear-gradient(135deg, #1e293b, #0f172a)',
            color: '#fff',
            borderRadius: radius.md,
            padding: '14px 16px',
            flexShrink: 0,
          }}>
            <div style={{
              display: 'flex', justifyContent: 'space-between',
              fontSize: 11, marginBottom: 4,
            }}>
              <span style={{ color: 'rgba(255,255,255,0.55)' }}>Subtotal</span>
              <span style={{
                color: 'rgba(255,255,255,0.55)',
                fontVariantNumeric: 'tabular-nums',
              }}>{formatBRL(sale.subtotal)}</span>
            </div>
            {sale.discount > 0 && (
              <div style={{
                display: 'flex', justifyContent: 'space-between',
                fontSize: 11, marginBottom: 4,
              }}>
                <span style={{ color: 'rgba(255,255,255,0.55)' }}>Desconto</span>
                <span style={{
                  color: 'rgba(255,255,255,0.55)',
                  fontVariantNumeric: 'tabular-nums',
                }}>−{formatBRL(sale.discount)}</span>
              </div>
            )}
            <div style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end',
              marginTop: 6, paddingTop: 8,
              borderTop: '1px solid rgba(255,255,255,0.15)',
            }}>
              <span style={{
                color: '#fff',
                fontSize: 12, fontWeight: 700,
                letterSpacing: '.04em', textTransform: 'uppercase',
              }}>Total</span>
              <span style={{
                color: '#fff',
                fontSize: 22, fontWeight: 800,
                fontVariantNumeric: 'tabular-nums',
                letterSpacing: '-0.02em', lineHeight: 1,
              }}>{formatBRL(sale.total)}</span>
            </div>
          </div>
        )}

        {error && (
          <div style={{
            padding: '8px 12px',
            background: 'rgba(220,38,38,0.08)',
            border: `1px solid ${colors.red.border}`,
            borderRadius: 8,
            fontSize: 12,
            color: colors.red.DEFAULT,
            flexShrink: 0,
          }}>
            {error}
          </div>
        )}

        {/* Ações */}
        <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
          <button
            onClick={cancelSale}
            disabled={cancelling}
            aria-label="Cancelar venda"
            style={{
              padding: '12px',
              borderRadius: 10,
              border: `1px solid ${colors.gray.borderMd}`,
              background: 'transparent',
              cursor: cancelling ? 'not-allowed' : 'pointer',
              color: colors.gray[700],
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
              fontFamily: 'inherit',
              WebkitTapHighlightColor: 'transparent',
            }}
          >
            {cancelling
              ? <Loader2 size={14} style={{ animation: 'pos-spin 0.8s linear infinite' }} />
              : <XCircle size={14} strokeWidth={2} />}
          </button>
          <button
            onClick={isFreeCheckout ? confirmFree : () => setShowPayment(true)}
            disabled={!canCheckout || confirmingFree}
            style={{
              flex: 1,
              padding: '12px',
              borderRadius: 10,
              border: 'none',
              background: !canCheckout
                ? 'rgba(0,0,0,0.07)'
                : isFreeCheckout
                  ? 'linear-gradient(135deg, #15803d, #166534)'
                  : 'linear-gradient(135deg, #1e293b, #0f172a)',
              color: !canCheckout ? colors.gray.dimText : '#fff',
              fontSize: 13, fontWeight: 800,
              cursor: (!canCheckout || confirmingFree) ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
              fontFamily: 'inherit',
              letterSpacing: '.05em', textTransform: 'uppercase',
              boxShadow: !canCheckout
                ? 'none'
                : isFreeCheckout
                  ? '0 6px 20px rgba(22,101,52,0.30)'
                  : '0 6px 20px rgba(15,23,42,0.28)',
              transition: `all ${transitions.spring}`,
              WebkitTapHighlightColor: 'transparent',
            }}
          >
            {confirmingFree
              ? <Loader2 size={14} style={{ animation: 'pos-spin 0.8s linear infinite' }} />
              : <CreditCard size={14} strokeWidth={2.5} />}
            {isFreeCheckout
              ? `Confirmar venda · ${formatBRL(sale.total)}`
              : `Confirmar · ${formatBRL(sale.total)}`}
          </button>
        </div>
        <style>{`@keyframes pos-spin { to { transform: rotate(360deg) } }`}</style>
      </div>
    </>
  )
}