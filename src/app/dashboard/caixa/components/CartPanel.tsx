'use client'
// src/app/dashboard/caixa/components/CartPanel.tsx
// @eligi:caixa-cart-v2
//
// Carrinho do caixa - direcao A "Balcao limpo" (nov/2026).
//
// O desconto mora SO aqui, logo acima do total, em R$ ou %. O modal de pagamento
// nao tem mais desconto: ele cobra o total da venda como esta no banco.
// Antes havia dois campos de desconto (carrinho e modal) que se sobrescreviam:
// o do modal travava o confirmar (o valor recebido nao acompanhava) e o do
// carrinho podia sumir se o confirm chegasse antes do PATCH do desconto.
// Agora "Cobrar" espera o desconto gravar antes de abrir o pagamento.
// No celular (direcao C, nov/2026) a lista inteira rola e so a barra
// Total + Cobrar fica presa embaixo: o botao nunca sai da tela.
//
// Este componente e montado com key={sale.id} pela pagina: trocar de venda
// remonta, entao o campo de desconto e as observacoes nunca vazam de uma venda
// para outra.

import { useState, useEffect, useCallback, useRef } from 'react'
import type { CSSProperties, ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { ShoppingCart, Loader2, Trash2, Layers, Ticket, Globe, Check, ChevronRight } from 'lucide-react'
import api from '@/shared/lib/apiClient'
import { Sale, ProfLite, PackageCardLite } from '@/features/sales/types'
import { formatBRL } from '@/features/sales/utils/format'
import {
  DiscountUnit, parseMoneyInput, checkDiscount, discountToBRL, discountPercentLabel, brlToInput,
} from '@/features/sales/utils/discount'
import { C } from '../ui'
import ClientPicker from './ClientPicker'
import CartItemRow from './CartItemRow'
import PaymentModal from './PaymentModal'
import UsePackageModal from './UsePackageModal'
import UseMembershipModal, { MembershipCardLite } from './UseMembershipModal'
import UseClubModal, { ClubSubLite } from './UseClubModal'
import SaleReceiptModal from '@/features/sales/components/SaleReceiptModal'

interface Props {
  sale:           Sale
  professionals:  ProfLite[]
  isMobile:       boolean
  onSaleUpdated:  (sale: Sale) => void
  onSaleClosed:   () => void
}

const PRESETS = [5, 10, 15] as const

function apiError(err: unknown, fallback: string): string {
  const e = err as { response?: { data?: { error?: string; message?: string } } }
  return e.response?.data?.error ?? e.response?.data?.message ?? fallback
}

export default function CartPanel({
  sale, professionals, isMobile,
  onSaleUpdated, onSaleClosed,
}: Props) {
  const router = useRouter()
  const [updatingItemId, setUpdatingItemId] = useState<string | null>(null)
  const [notes, setNotes] = useState(sale.notes ?? '')
  const [showPayment, setShowPayment] = useState(false)
  const [showUsePackage, setShowUsePackage] = useState(false)
  const [showUseMembership, setShowUseMembership] = useState(false)
  const [showUseClub, setShowUseClub] = useState(false)
  const [confirmCancel, setConfirmCancel] = useState(false)
  const [cancelling, setCancelling] = useState(false)
  const [checkingOut, setCheckingOut] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [receiptSale, setReceiptSale] = useState<Sale | null>(null)

  // Desconto: texto digitado + unidade. Gravado sempre em reais.
  const [discountUnit, setDiscountUnit] = useState<DiscountUnit>('BRL')
  const [discountInput, setDiscountInput] = useState(() => brlToInput(sale.discount))
  const [discountError, setDiscountError] = useState<string | null>(null)
  const [savingDiscount, setSavingDiscount] = useState(false)
  const [discountOpen, setDiscountOpen] = useState(false) // @eligi:caixa-discount-open - celular: linha que abre
  const discountReqRef = useRef<Promise<Sale | null> | null>(null)

  // Cartoes do cliente (decide se mostra "Usar pacote/assinatura/clube")
  const [activeCards, setActiveCards] = useState<PackageCardLite[]>([])
  const [loadingCards, setLoadingCards] = useState(false)
  const [activeMemberships, setActiveMemberships] = useState<MembershipCardLite[]>([])
  const [activeClubSubs, setActiveClubSubs] = useState<ClubSubLite[]>([])

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

  const refreshActiveClubSubs = useCallback(() => {
    if (!sale.clientId) {
      setActiveClubSubs([])
      return
    }
    api.get(`/club-subscriptions?clientId=${sale.clientId}&status=ACTIVE`)
      .then(res => {
        const data = res.data?.data ?? res.data
        setActiveClubSubs(Array.isArray(data) ? data : [])
      })
      .catch(() => setActiveClubSubs([]))
  }, [sale.clientId])

  useEffect(() => { refreshActiveCards() }, [refreshActiveCards])
  useEffect(() => { refreshActiveMemberships() }, [refreshActiveMemberships])
  useEffect(() => { refreshActiveClubSubs() }, [refreshActiveClubSubs])

  async function refetchSale() {
    try {
      const res = await api.get(`/sales/${sale.id}`)
      const data = res.data?.data ?? res.data
      onSaleUpdated(data)
    } catch { /* silencioso: a proxima acao recarrega */ }
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
      setError(apiError(err, 'Erro ao atualizar cliente'))
    }
  }

  // ── Desconto ────────────────────────────────────────────────────────────
  // Uma gravacao por vez: o "Cobrar" espera a que estiver em andamento.
  function saveDiscountValue(value: number): Promise<Sale | null> {
    const run = async (): Promise<Sale | null> => {
      if (Math.abs(value - sale.discount) < 0.005) {
        setDiscountUnit('BRL')
        setDiscountInput(brlToInput(sale.discount))
        return sale
      }
      setSavingDiscount(true)
      try {
        const res = await api.patch(`/sales/${sale.id}`, { discount: value })
        const data: Sale = res.data?.data ?? res.data
        onSaleUpdated(data)
        setDiscountUnit('BRL')
        setDiscountInput(brlToInput(data.discount))
        setDiscountError(null)
        return data
      } catch (err: unknown) {
        setDiscountError(apiError(err, 'Não foi possível aplicar o desconto'))
        return null
      } finally {
        setSavingDiscount(false)
      }
    }
    const pending = discountReqRef.current
    const next = (pending ? pending.then(run, run) : run())
    discountReqRef.current = next
    void next.finally(() => {
      if (discountReqRef.current === next) discountReqRef.current = null
    })
    return next
  }

  function commitDiscount(): Promise<Sale | null> {
    const chk = checkDiscount(parseMoneyInput(discountInput), discountUnit, sale.subtotal)
    if (chk.error) {
      setDiscountError(chk.error)
      return Promise.resolve(null)
    }
    setDiscountError(null)
    return saveDiscountValue(chk.value)
  }

  function applyPreset(pct: number) {
    setDiscountError(null)
    void saveDiscountValue(discountToBRL(pct, 'PCT', sale.subtotal))
  }

  function clearDiscount() {
    setDiscountInput('')
    setDiscountError(null)
    void saveDiscountValue(0)
  }

  async function commitNotes() {
    if (notes === (sale.notes ?? '')) return
    try {
      await api.patch(`/sales/${sale.id}`, { notes })
    } catch { /* observacao nao bloqueia a venda */ }
  }

  // ── Itens ───────────────────────────────────────────────────────────────
  async function runItemAction(itemId: string, fallback: string, fn: () => Promise<unknown>, after?: () => void) {
    setUpdatingItemId(itemId)
    setError(null)
    try {
      await fn()
      await refetchSale()
      after?.()
    } catch (err: unknown) {
      setError(apiError(err, fallback))
    } finally {
      setUpdatingItemId(null)
    }
  }

  const changeItemQty = (itemId: string, quantity: number) =>
    runItemAction(itemId, 'Erro ao atualizar item', () => api.patch(`/sales/${sale.id}/items/${itemId}`, { quantity }))

  // @eligi:pricemode-cart-handler - o back recusa (403) quando o cargo nao pode alterar valor.
  const changeItemPrice = (itemId: string, unitPriceOverride: number) =>
    runItemAction(itemId, 'Erro ao atualizar valor do item', () => api.patch(`/sales/${sale.id}/items/${itemId}`, { unitPriceOverride }))

  const changeItemProf = (itemId: string, profId: string | null) =>
    runItemAction(itemId, 'Erro ao atualizar profissional', () => api.patch(`/sales/${sale.id}/items/${itemId}`, { professionalId: profId }))

  const removeItem = (itemId: string) =>
    runItemAction(itemId, 'Erro ao remover item', () => api.delete(`/sales/${sale.id}/items/${itemId}`), () => {
      refreshActiveCards()        // estorno pode ter restaurado saldo
      refreshActiveMemberships()
    })

  const removePackageFromItem = (itemId: string) =>
    runItemAction(itemId, 'Erro ao remover pacote do item', () => api.delete(`/sales/${sale.id}/items/${itemId}/apply-package`), refreshActiveCards)

  const removeMembershipFromItem = (itemId: string) =>
    runItemAction(itemId, 'Erro ao remover assinatura do item', () => api.delete(`/sales/${sale.id}/items/${itemId}/apply-membership`), refreshActiveMemberships)

  // ── Venda ───────────────────────────────────────────────────────────────
  async function cancelSale() {
    setCancelling(true)
    setError(null)
    try {
      await api.post(`/sales/${sale.id}/cancel`)
      onSaleClosed()
    } catch (err: unknown) {
      setError(apiError(err, 'Erro ao cancelar venda'))
      setCancelling(false)
      setConfirmCancel(false)
    }
  }

  // Venda R$ 0 (tudo coberto por pacote/assinatura/desconto): fecha sem modal.
  async function confirmFree(target: Sale) {
    try {
      const res = await api.post(`/sales/${target.id}/confirm`, {})
      const confirmed: Sale = res.data?.data ?? res.data
      onSaleUpdated(confirmed)
      setReceiptSale(confirmed)
    } catch (err: unknown) {
      setError(apiError(err, 'Erro ao confirmar venda'))
    }
  }

  async function startCheckout() {
    setError(null)
    setCheckingOut(true)
    try {
      const fresh = await commitDiscount()   // desconto gravado ANTES de cobrar
      if (!fresh) return
      if (fresh.total <= 0.005) await confirmFree(fresh)
      else setShowPayment(true)
    } finally {
      setCheckingOut(false)
    }
  }

  // @eligi:pricemode-checkout-gate - servico "a partir de" precisa do valor cobrado.
  const pendingPriceItems = sale.items.filter(
    it => it.type === 'SERVICE'
      && it.service?.priceMode === 'FROM'
      && it.priceOverridden !== true
      && it.appliedPackageCardId == null
      && it.appliedMembershipCardId == null,
  )
  // @eligi:svc-prof-gate - servico sem profissional nao gera comissao; o back recusa.
  const missingProfItems = sale.items.filter(it => it.type === 'SERVICE' && !it.professionalId)
  const canCheckout = sale.items.length > 0 && pendingPriceItems.length === 0 && missingProfItems.length === 0
  const isFreeCheckout = sale.total <= 0.005 && sale.items.length > 0

  const canUsePackage = sale.clientId != null && activeCards.length > 0
  const canUseMembership = sale.clientId != null && activeMemberships.length > 0
  const canUseClub = sale.clientId != null && activeClubSubs.length > 0

  const discountPct = discountPercentLabel(sale.discount, sale.subtotal)
  const discountAboveSubtotal = sale.discount - sale.subtotal > 0.005
  const busy = checkingOut || savingDiscount
  const itemCount = sale.items.reduce((n, it) => n + it.quantity, 0)

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
            setReceiptSale(confirmed)
          }}
        />
      )}

      {showUsePackage && (
        <UsePackageModal
          sale={sale}
          isMobile={isMobile}
          onApplied={(updated) => { onSaleUpdated(updated); refreshActiveCards() }}
          onClose={() => setShowUsePackage(false)}
        />
      )}

      {showUseMembership && (
        <UseMembershipModal
          sale={sale}
          isMobile={isMobile}
          onApplied={(updated) => { onSaleUpdated(updated); refreshActiveMemberships() }}
          onClose={() => setShowUseMembership(false)}
        />
      )}

      {showUseClub && (
        <UseClubModal
          sale={sale}
          isMobile={isMobile}
          onApplied={(updated) => { onSaleUpdated(updated); refreshActiveClubSubs() }}
          onClose={() => setShowUseClub(false)}
        />
      )}

      {receiptSale && (
        <SaleReceiptModal
          sale={receiptSale}
          mode="full"
          isMobile={isMobile}
          onClose={() => { setReceiptSale(null); onSaleClosed() }}
          onGoToAgenda={() => { setReceiptSale(null); onSaleClosed(); router.push('/dashboard/agenda') }}
        />
      )}

      {(() => {
        // @eligi:caixa-cart-mobile-c - direcao C no celular: tudo rola numa lista so
        // (cliente, itens, desconto, observacao) e so a barra Total + Cobrar fica presa
        // embaixo. Antes o rodape (desconto + total + botoes) era fixo e alto: a lista
        // de itens encolhia a zero e o Cobrar saia da tela.
        const headBlock = (
          <>
            <ClientPicker
              value={{
                id:     sale.clientId ?? null,
                name:   sale.clientName ?? null,
                phone:  sale.clientPhone ?? null,
                masked: sale.clientPhoneMasked === true,
              }}
              onChange={updateClient}
            />
            {canUsePackage && (
              <BenefitButton
                icon={<Layers size={15} color={C.onInk} strokeWidth={2} />}
                title="Usar pacote"
                subtitle={`${activeCards.length} ${activeCards.length === 1 ? 'cartão ativo' : 'cartões ativos'} do cliente`}
                onClick={() => setShowUsePackage(true)}
              />
            )}
            {canUseMembership && (
              <BenefitButton
                icon={<Ticket size={15} color={C.onInk} strokeWidth={2} />}
                title="Usar assinatura"
                subtitle={`${activeMemberships.length} ${activeMemberships.length === 1 ? 'assinatura ativa' : 'assinaturas ativas'}`}
                onClick={() => setShowUseMembership(true)}
              />
            )}
            {canUseClub && (
              <BenefitButton
                icon={<Globe size={15} color={C.onInk} strokeWidth={2} />}
                title="Usar clube"
                subtitle={`${activeClubSubs.length} ${activeClubSubs.length === 1 ? 'plano de clube ativo' : 'planos de clube ativos'}`}
                onClick={() => setShowUseClub(true)}
              />
            )}
            {loadingCards && sale.clientId && (
              <div style={{ fontSize: 11, color: C.ink3, textAlign: 'center' }}>Verificando pacotes do cliente…</div>
            )}
          </>
        )

        const itemsBlock = sale.items.length === 0 ? (
          <div style={{
            padding: isMobile ? '24px 16px' : '36px 20px', textAlign: 'center',
            background: C.sunken, borderRadius: 14, border: `1px dashed ${C.line2}`, color: C.ink3, flexShrink: 0,
          }}>
            <ShoppingCart size={26} strokeWidth={1.8} style={{ opacity: 0.5, marginBottom: 8 }} />
            <div style={{ fontSize: 14, fontWeight: 600, color: C.ink2 }}>Carrinho vazio</div>
            <div style={{ fontSize: 12, marginTop: 4 }}>
              {isMobile ? 'Toque num cartão do catálogo, aqui em cima.' : 'Toque num serviço, produto ou pacote do catálogo.'}
            </div>
          </div>
        ) : (
          <>
            {isMobile && (
              <div style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '2px 2px 0',
                fontSize: 11, fontWeight: 700, letterSpacing: '.07em', textTransform: 'uppercase', color: C.ink3,
              }}>
                <span style={{ color: C.ink3 }}>Na comanda</span>
                <span style={{ color: C.ink3, fontVariantNumeric: 'tabular-nums' }}>
                  {itemCount} {itemCount === 1 ? 'item' : 'itens'}
                </span>
              </div>
            )}
            {sale.items.map(item => (
              <div key={item.id} style={{
                flexShrink: 0,
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
                  onChangePrice={v => changeItemPrice(item.id, v)}
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
          </>
        )

        const notesBlock = sale.items.length > 0 && (
          <textarea
            id="cx-notes"
            value={notes}
            onChange={e => setNotes(e.target.value)}
            onBlur={commitNotes}
            placeholder="Observações da venda (opcional)"
            rows={1}
            aria-label="Observações da venda"
            style={{
              width: '100%', boxSizing: 'border-box', padding: '10px 12px',
              borderRadius: 10, border: `1px solid ${C.line2}`, background: C.card,
              fontSize: 16, color: C.ink, fontFamily: 'inherit', resize: 'none', minHeight: 44,
              flexShrink: 0,
            }}
          />
        )

        const discountMessages = (
          <>
            {discountError && (
              <div role="alert" style={{ fontSize: 12, color: C.bad.text, fontWeight: 600 }}>{discountError}</div>
            )}
            {!discountError && discountAboveSubtotal && (
              <div role="status" style={{ fontSize: 12, color: C.warn.text }}>
                Um item saiu e o desconto ficou maior que a venda. Ao cobrar, ele vira {formatBRL(sale.subtotal)}.
              </div>
            )}
          </>
        )

        const presetsRow = (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
            {PRESETS.map(p => (
              <button
                key={p}
                type="button"
                onClick={() => { applyPreset(p); setDiscountOpen(false) }}
                disabled={savingDiscount}
                style={{
                  height: isMobile ? 36 : 30, padding: '0 12px', borderRadius: 999,
                  border: `1px solid ${C.line2}`, background: C.sunken, color: C.ink2,
                  fontSize: 12.5, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
                }}
              >{p}%</button>
            ))}
            {sale.discount > 0 && (
              <button
                type="button"
                onClick={() => { clearDiscount(); setDiscountOpen(false) }}
                disabled={savingDiscount}
                style={{
                  height: isMobile ? 36 : 30, padding: '0 10px', borderRadius: 999, border: 'none',
                  background: 'transparent', color: C.ink3, fontSize: 12, fontWeight: 600,
                  cursor: 'pointer', fontFamily: 'inherit', textDecoration: 'underline',
                }}
              >Tirar desconto</button>
            )}
            {isMobile ? (
              <button
                type="button"
                onClick={() => { void commitDiscount().then(ok => { if (ok) setDiscountOpen(false) }) }}
                disabled={savingDiscount}
                style={{
                  marginLeft: 'auto', height: 40, padding: '0 16px', borderRadius: 10, border: 'none',
                  background: C.ink, color: C.onInk, fontSize: 13, fontWeight: 700, cursor: 'pointer',
                  fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 6,
                }}
              >
                {savingDiscount && <Loader2 size={13} className="cx-spin" />}Aplicar
              </button>
            ) : (
              <span style={{ marginLeft: 'auto', fontSize: 12, color: C.ink3, display: 'flex', alignItems: 'center', gap: 5 }}>
                {savingDiscount && <Loader2 size={12} className="cx-spin" />}
                {!savingDiscount && sale.discount > 0 && !discountError && (
                  <>Cliente economiza <b style={{ color: C.ink, fontVariantNumeric: 'tabular-nums' }}>{formatBRL(sale.discount)}</b>{discountPct && ` (${discountPct})`}</>
                )}
              </span>
            )}
          </div>
        )

        const discountEditor = sale.items.length > 0 && (
          <div style={{
            border: `1px solid ${discountError ? C.bad.border : C.line2}`,
            borderRadius: 12, padding: isMobile ? '10px 12px' : 12, flexShrink: 0,
            background: C.card, display: 'flex', flexDirection: 'column', gap: 8,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <label htmlFor="cx-discount" style={{
                fontSize: 11, fontWeight: 700, letterSpacing: '.06em',
                textTransform: 'uppercase', color: C.ink2, flex: 1,
              }}>Desconto</label>
              <div role="group" aria-label="Tipo de desconto" style={{
                display: 'inline-flex', border: `1px solid ${C.line2}`, borderRadius: 8, overflow: 'hidden',
              }}>
                {(['BRL', 'PCT'] as const).map(u => (
                  <button
                    key={u}
                    type="button"
                    aria-pressed={discountUnit === u}
                    onClick={() => { setDiscountUnit(u); setDiscountInput(''); setDiscountError(null) }}
                    style={{
                      minWidth: isMobile ? 44 : 40, height: isMobile ? 40 : 32, border: 'none', cursor: 'pointer',
                      background: discountUnit === u ? C.ink : 'transparent',
                      color: discountUnit === u ? C.onInk : C.ink2,
                      fontSize: 12.5, fontWeight: 700, fontFamily: 'inherit',
                    }}
                  >{u === 'BRL' ? 'R$' : '%'}</button>
                ))}
              </div>
              <input
                id="cx-discount"
                type="text"
                inputMode="decimal"
                value={discountInput}
                onChange={e => { setDiscountInput(e.target.value.replace(/[^\d,.]/g, '')); setDiscountError(null) }}
                onBlur={isMobile ? undefined : () => { void commitDiscount() }}
                onKeyDown={e => {
                  if (e.key !== 'Enter') return
                  if (isMobile) void commitDiscount().then(ok => { if (ok) setDiscountOpen(false) })
                  else e.currentTarget.blur()
                }}
                placeholder="0"
                aria-invalid={discountError ? true : undefined}
                style={{
                  width: isMobile ? 96 : 104, height: isMobile ? 40 : 36, boxSizing: 'border-box',
                  padding: '0 10px', borderRadius: 8, border: `1px solid ${C.line2}`,
                  textAlign: 'right', fontSize: 16, fontWeight: 700, color: C.ink,
                  fontFamily: C.display, fontVariantNumeric: 'tabular-nums', background: C.card,
                }}
              />
            </div>
            {presetsRow}
            {discountMessages}
          </div>
        )

        // Celular: o desconto e uma linha que so abre quando a pessoa toca.
        const discountRow = sale.items.length > 0 && (
          discountOpen || discountError ? discountEditor : (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8, minHeight: 52, flexShrink: 0,
              border: `1px solid ${C.line2}`, borderRadius: 12, background: C.card, padding: '4px 4px 4px 12px',
            }}>
              <span style={{ flex: 1, fontSize: 14, fontWeight: 600, color: C.ink }}>Desconto</span>
              {sale.discount > 0 && (
                <span style={{ fontSize: 14, fontWeight: 700, color: C.warn.text, fontVariantNumeric: 'tabular-nums' }}>
                  −{formatBRL(Math.min(sale.discount, sale.subtotal))}{discountPct && ` · ${discountPct}`}
                </span>
              )}
              <button
                type="button"
                onClick={() => setDiscountOpen(true)}
                style={{
                  height: 40, padding: '0 14px', borderRadius: 10, border: `1px solid ${C.line2}`,
                  background: C.card, color: C.ink, fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
                }}
              >{sale.discount > 0 ? 'Alterar' : 'Adicionar'}</button>
            </div>
          )
        )

        const totalCard = sale.items.length > 0 && (
          <div style={{
            background: C.ink, color: C.onInk, borderRadius: 14, padding: '14px 16px',
            display: 'flex', flexDirection: 'column', gap: 4, flexShrink: 0,
          }}>
            <div className="cx-row" style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
              <span style={{ color: C.onInkSoft }}>Subtotal</span>
              <span style={{ color: C.onInkSoft, fontVariantNumeric: 'tabular-nums' }}>{formatBRL(sale.subtotal)}</span>
            </div>
            {sale.discount > 0 && (
              <div className="cx-row" style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                <span style={{ color: C.onInk, fontWeight: 600 }}>Desconto{discountPct && ` · ${discountPct}`}</span>
                <span style={{ color: C.onInk, fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>−{formatBRL(Math.min(sale.discount, sale.subtotal))}</span>
              </div>
            )}
            <div className="cx-row" style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
              marginTop: 4, paddingTop: 8, borderTop: '1px solid rgba(255,255,255,0.14)',
            }}>
              <span style={{ color: C.onInk, fontSize: 12, fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase' }}>Total</span>
              <span style={{
                color: C.onInk, fontFamily: C.display, fontSize: 30, fontWeight: 700,
                letterSpacing: '-0.03em', lineHeight: 1, fontVariantNumeric: 'tabular-nums',
              }}>{formatBRL(sale.total)}</span>
            </div>
          </div>
        )

        const hints = (
          <>
            {missingProfItems.length > 0 && (
              <div role="status" style={{
                padding: '8px 12px', background: C.warn.bg, border: `1px solid ${C.warn.border}`,
                borderRadius: 10, fontSize: 12, color: C.warn.text,
              }}>
                {missingProfItems.length === 1
                  ? `Escolha o profissional de "${missingProfItems[0].name}" para cobrar.`
                  : `Escolha o profissional de: ${missingProfItems.map(it => it.name).join(', ')}.`}
              </div>
            )}
            {error && (
              <div role="alert" style={{
                padding: '8px 12px', background: C.bad.bg, border: `1px solid ${C.bad.border}`,
                borderRadius: 10, fontSize: 12, color: C.bad.text,
              }}>{error}</div>
            )}
          </>
        )

        const cancelConfirm = (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8, padding: 8, flexShrink: 0,
            border: `1px solid ${C.bad.border}`, background: C.bad.bg, borderRadius: 12,
          }}>
            <span style={{ flex: 1, fontSize: 13, fontWeight: 600, color: C.bad.text, paddingLeft: 4 }}>
              Cancelar esta venda?
            </span>
            <button type="button" onClick={() => setConfirmCancel(false)} disabled={cancelling} style={secondaryBtn}>Voltar</button>
            <button type="button" onClick={cancelSale} disabled={cancelling} style={{
              ...secondaryBtn, background: C.danger, color: C.onInk, border: 'none',
            }}>
              {cancelling ? <Loader2 size={14} className="cx-spin" /> : 'Cancelar venda'}
            </button>
          </div>
        )

        const payLabel = isFreeCheckout
          ? `Confirmar venda · ${formatBRL(0)}`
          : null

        if (isMobile) {
          return (
            <div className="cx-cart" style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0, fontFamily: C.body }}>
              <div style={{
                flex: 1, minHeight: 0, overflowY: 'auto', WebkitOverflowScrolling: 'touch', overscrollBehavior: 'contain',
                display: 'flex', flexDirection: 'column', gap: 10, padding: '12px 14px 16px',
              }}>
                {headBlock}
                {itemsBlock}
                {discountRow}
                {notesBlock}
                {sale.items.length > 0 && (confirmCancel ? cancelConfirm : (
                  <button
                    type="button"
                    onClick={() => setConfirmCancel(true)}
                    style={{
                      alignSelf: 'center', minHeight: 40, padding: '0 14px', border: 'none', background: 'transparent',
                      color: C.ink3, fontSize: 13, fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer',
                      display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0,
                    }}
                  >
                    <Trash2 size={14} /> Cancelar esta venda
                  </button>
                ))}
              </div>

              <div style={{
                flexShrink: 0, borderTop: `1px solid ${C.line}`, background: C.card,
                padding: '10px 14px', display: 'flex', flexDirection: 'column', gap: 8,
              }}>
                {hints}
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 11, fontWeight: 600, color: C.ink3 }}>
                      {itemCount} {itemCount === 1 ? 'item' : 'itens'} · total
                    </div>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                      <span style={{
                        fontFamily: C.display, fontSize: 24, fontWeight: 700, color: C.ink,
                        letterSpacing: '-0.02em', fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap',
                      }}>{formatBRL(sale.total)}</span>
                      {sale.discount > 0 && (
                        <span style={{ fontSize: 11, color: C.ink3, textDecoration: 'line-through', fontVariantNumeric: 'tabular-nums' }}>
                          {formatBRL(sale.subtotal)}
                        </span>
                      )}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => { void startCheckout() }}
                    disabled={!canCheckout || busy}
                    style={{
                      marginLeft: 'auto', minHeight: 52, padding: '0 22px', borderRadius: 14, border: 'none',
                      background: !canCheckout ? 'rgba(17,17,20,0.08)' : isFreeCheckout ? C.ok : C.ink,
                      color: !canCheckout ? C.ink3 : C.onInk,
                      fontSize: 16, fontWeight: 700, fontFamily: 'inherit', flexShrink: 0,
                      cursor: (!canCheckout || busy) ? 'not-allowed' : 'pointer',
                      display: 'flex', alignItems: 'center', gap: 6,
                    }}
                  >
                    {busy ? <Loader2 size={16} className="cx-spin" /> : isFreeCheckout ? <Check size={16} strokeWidth={2.6} /> : null}
                    {isFreeCheckout ? 'Confirmar' : <>Cobrar<ChevronRight size={17} strokeWidth={2.4} /></>}
                  </button>
                </div>
              </div>
            </div>
          )
        }

        return (
          <div className="cx-cart" style={{
            display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0, gap: 10, fontFamily: C.body,
          }}>
            {headBlock}
            <div style={{
              flex: 1, minHeight: 0, overflowY: 'auto', WebkitOverflowScrolling: 'touch',
              display: 'flex', flexDirection: 'column', gap: 8,
            }}>
              {itemsBlock}
              {notesBlock}
            </div>
            <div style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
              {discountEditor}
              {totalCard}
              {hints}
              {confirmCancel ? cancelConfirm : (
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    type="button"
                    onClick={() => setConfirmCancel(true)}
                    aria-label="Cancelar venda"
                    title="Cancelar venda"
                    style={{
                      width: 48, minHeight: 48, borderRadius: 12, border: `1px solid ${C.line2}`,
                      background: C.card, color: C.ink2, cursor: 'pointer', flexShrink: 0,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}
                  >
                    <Trash2 size={16} strokeWidth={2} />
                  </button>
                  <button
                    type="button"
                    onClick={() => { void startCheckout() }}
                    disabled={!canCheckout || busy}
                    style={{
                      flex: 1, minHeight: 48, borderRadius: 12, border: 'none',
                      background: !canCheckout ? 'rgba(17,17,20,0.08)' : isFreeCheckout ? C.ok : C.ink,
                      color: !canCheckout ? C.ink3 : C.onInk,
                      fontSize: 15, fontWeight: 700, fontFamily: 'inherit',
                      cursor: (!canCheckout || busy) ? 'not-allowed' : 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    }}
                  >
                    {busy
                      ? <Loader2 size={16} className="cx-spin" />
                      : isFreeCheckout ? <Check size={16} strokeWidth={2.6} /> : null}
                    {payLabel ?? <>Cobrar <span style={{ color: 'inherit', fontVariantNumeric: 'tabular-nums' }}>{formatBRL(sale.total)}</span><ChevronRight size={16} strokeWidth={2.4} /></>}
                  </button>
                </div>
              )}
            </div>
          </div>
        )
      })()}

      <style>{`
        @keyframes cx-spin { to { transform: rotate(360deg) } }
        .cx-spin { animation: cx-spin .8s linear infinite }
        .cx-cart .cx-row span { color: inherit }
        .cx-cart button:focus-visible, .cx-cart input:focus-visible, .cx-cart textarea:focus-visible {
          outline: 2px solid ${C.ink}; outline-offset: 2px;
        }
        @media (prefers-reduced-motion: reduce) { .cx-spin { animation: none } }
      `}</style>
    </>
  )
}

const secondaryBtn: CSSProperties = {
  minHeight: 40, padding: '0 14px', borderRadius: 10, border: `1px solid ${C.line2}`,
  background: C.card, color: C.ink, fontSize: 13, fontWeight: 700, cursor: 'pointer',
  fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center',
}

function BenefitButton({ icon, title, subtitle, onClick }: {
  icon: ReactNode; title: string; subtitle: string; onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', minHeight: 48,
        borderRadius: 12, border: `1px solid ${C.line2}`, background: C.card,
        cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit', flexShrink: 0,
      }}
    >
      <span style={{
        width: 30, height: 30, borderRadius: 8, background: C.ink, flexShrink: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>{icon}</span>
      <span style={{ flex: 1, minWidth: 0 }}>
        <span style={{ display: 'block', fontSize: 13, fontWeight: 700, color: C.ink }}>{title}</span>
        <span style={{ display: 'block', fontSize: 11, color: C.ink3, marginTop: 1 }}>{subtitle}</span>
      </span>
      <ChevronRight size={16} color={C.ink3} />
    </button>
  )
}
