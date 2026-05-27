'use client'
// src/app/dashboard/caixa/page.tsx

import { useState, useEffect, useCallback, useMemo } from 'react'
import { ShoppingCart, Receipt, TrendingUp, Loader2 } from 'lucide-react'

import api from '@/shared/lib/apiClient'
import { colors, typography, transitions } from '@/shared/theme'
import { useIsMobile } from '@/hooks/useIsMobile'
import { Sale, CatalogService, CatalogProduct, ProfLite, SaleItemType } from '@/features/sales/types'
import { useSalesSummary } from '@/features/sales/hooks/useSalesSummary'

import OpenSalesSwitcher from './components/OpenSalesSwitcher'
import CatalogPanel       from './components/CatalogPanel'
import CartPanel          from './components/CartPanel'
import ConfirmedSalesList from './components/ConfirmedSalesList'
import SalesSummaryCards  from './components/SalesSummaryCards'
import Toast, { ToastKind } from './components/Toast'

type Tab = 'open' | 'confirmed' | 'summary'

const TABS: { id: Tab; label: string; icon: typeof ShoppingCart }[] = [
  { id: 'open',      label: 'Vendas Abertas', icon: ShoppingCart },
  { id: 'confirmed', label: 'Confirmadas',    icon: Receipt      },
  { id: 'summary',   label: 'Resumo',         icon: TrendingUp   },
]

export default function CaixaPage() {
  const isMobile = useIsMobile(768)

  const [tab,             setTab]             = useState<Tab>('open')
  const [openSales,       setOpenSales]       = useState<Sale[]>([])
  const [activeSaleId,    setActiveSaleId]    = useState<string | null>(null)
  const [globalProfId,    setGlobalProfId]    = useState<string | null>(null)
  const [openLoading,     setOpenLoading]     = useState(true)
  const [creating,        setCreating]        = useState(false)
  const [confirmedRefresh, setConfirmedRefresh] = useState(0)

  // Catálogo
  const [services,        setServices]        = useState<CatalogService[]>([])
  const [products,        setProducts]        = useState<CatalogProduct[]>([])
  const [professionals,   setProfessionals]   = useState<ProfLite[]>([])
  const [catalogLoading,  setCatalogLoading]  = useState(true)

  // Toast
  const [toast, setToast] = useState<{ message: string; kind: ToastKind } | null>(null)

  // Summary
  const todayDate = useMemo(() => {
    const d = new Date()
    d.setHours(0, 0, 0, 0)
    return d.toISOString()
  }, [])
  const { summary, loading: summaryLoading, refetch: refetchSummary }
    = useSalesSummary({ dateFrom: todayDate })

  // ─── Carrega vendas OPEN ──────────────────────────────────────
  const fetchOpenSales = useCallback(async (signal?: AbortSignal) => {
    try {
      const res = await api.get('/sales', {
        signal,
        params: { status: 'OPEN', limit: 50 },
      })
      if (signal?.aborted) return
      const data = res.data?.data ?? res.data
      const list: Sale[] = Array.isArray(data) ? data : []
      setOpenSales(list)
      // Se não tem activeId mas tem vendas, seleciona primeira
      setActiveSaleId(prev => {
        if (prev && list.find(s => s.id === prev)) return prev
        return list[0]?.id ?? null
      })
    } catch {
      if (!signal?.aborted) setOpenSales([])
    } finally {
      if (!signal?.aborted) setOpenLoading(false)
    }
  }, [])

  // ─── Carrega catálogo ─────────────────────────────────────────
  const fetchCatalog = useCallback(async (signal?: AbortSignal) => {
    try {
      const [svcRes, prdRes, profRes] = await Promise.all([
        api.get('/services',  { signal }),
        api.get('/products',  { signal }),
        api.get('/equipe',    { signal }),
      ])
      if (signal?.aborted) return

      const svcData = svcRes.data?.data ?? svcRes.data
      const prdData = prdRes.data?.data ?? prdRes.data
      const profData = profRes.data?.data ?? profRes.data

      setServices(Array.isArray(svcData) ? svcData : svcData.services ?? [])
      setProducts(Array.isArray(prdData) ? prdData : prdData.products ?? [])
      setProfessionals(
        (Array.isArray(profData) ? profData : [])
          .filter((p: { id?: string; active?: boolean }) => p.id != null && p.active !== false)
          .map((p: { id: string; name: string; avatarUrl?: string | null }) => ({
            id: p.id, name: p.name, avatarUrl: p.avatarUrl ?? null,
          })),
      )
    } catch {
      if (!signal?.aborted) {
        setServices([])
        setProducts([])
        setProfessionals([])
      }
    } finally {
      if (!signal?.aborted) setCatalogLoading(false)
    }
  }, [])

  useEffect(() => {
    const ctrl = new AbortController()
    fetchOpenSales(ctrl.signal)
    fetchCatalog(ctrl.signal)
    return () => ctrl.abort()
  }, [fetchOpenSales, fetchCatalog])

  // ─── Handlers de venda ────────────────────────────────────────
  const activeSale = openSales.find(s => s.id === activeSaleId) ?? null

  async function createNewSale() {
    try {
      setCreating(true)
      const res = await api.post('/sales', {})
      const newSale: Sale = res.data?.data ?? res.data
      setOpenSales(prev => [newSale, ...prev])
      setActiveSaleId(newSale.id)
      setGlobalProfId(null)
    } catch {
      setToast({ message: 'Erro ao criar venda', kind: 'error' })
    } finally {
      setCreating(false)
    }
  }

  function updateSaleInList(updated: Sale) {
    setOpenSales(prev => prev.map(s => s.id === updated.id ? updated : s))
  }

  async function refetchActiveSale() {
    if (!activeSaleId) return
    try {
      const res = await api.get(`/sales/${activeSaleId}`)
      const data = res.data?.data ?? res.data
      updateSaleInList(data)
    } catch { /* silencioso */ }
  }

  async function addService(service: CatalogService) {
    if (!activeSaleId) {
      // Cria carrinho se não tiver
      try {
        const res = await api.post('/sales', {})
        const newSale: Sale = res.data?.data ?? res.data
        setOpenSales(prev => [newSale, ...prev])
        setActiveSaleId(newSale.id)
        await addItemToSale(newSale.id, {
          type: 'SERVICE',
          serviceId: service.id,
          professionalId: globalProfId,
        })
      } catch {
        setToast({ message: 'Erro ao criar venda', kind: 'error' })
      }
      return
    }
    await addItemToSale(activeSaleId, {
      type: 'SERVICE',
      serviceId: service.id,
      professionalId: globalProfId,
    })
  }

  async function addProduct(product: CatalogProduct) {
    if (!activeSaleId) {
      try {
        const res = await api.post('/sales', {})
        const newSale: Sale = res.data?.data ?? res.data
        setOpenSales(prev => [newSale, ...prev])
        setActiveSaleId(newSale.id)
        await addItemToSale(newSale.id, {
          type: 'PRODUCT',
          productId: product.id,
          professionalId: globalProfId,
        })
      } catch {
        setToast({ message: 'Erro ao criar venda', kind: 'error' })
      }
      return
    }
    await addItemToSale(activeSaleId, {
      type: 'PRODUCT',
      productId: product.id,
      professionalId: globalProfId,
    })
  }

  async function addItemToSale(saleId: string, item: {
    type: SaleItemType
    serviceId?: string
    productId?: string
    professionalId: string | null
  }) {
    try {
      await api.post(`/sales/${saleId}/items`, item)
      // Refetch a venda específica
      const res = await api.get(`/sales/${saleId}`)
      const data = res.data?.data ?? res.data
      setOpenSales(prev => prev.map(s => s.id === saleId ? data : s))
      setToast({ message: 'Item adicionado', kind: 'success' })
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: string } } }
      setToast({
        message: e.response?.data?.error ?? 'Erro ao adicionar item',
        kind: 'error',
      })
    }
  }

  async function applyGlobalProfToAllItems() {
    if (!activeSale || !globalProfId) return
    try {
      // Atualiza todos os itens em paralelo
      await Promise.all(
        activeSale.items.map(item =>
          api.patch(`/sales/${activeSale.id}/items/${item.id}`, {
            professionalId: globalProfId,
          }),
        ),
      )
      await refetchActiveSale()
      setToast({ message: 'Profissional aplicado a todos itens', kind: 'success' })
    } catch {
      setToast({ message: 'Erro ao aplicar profissional', kind: 'error' })
    }
  }

  function handleSaleClosed() {
    // Tira do array de OPEN, seleciona próxima
    if (!activeSaleId) return
    const idx = openSales.findIndex(s => s.id === activeSaleId)
    const remaining = openSales.filter(s => s.id !== activeSaleId)
    setOpenSales(remaining)
    if (remaining.length > 0) {
      const nextIdx = Math.min(idx, remaining.length - 1)
      setActiveSaleId(remaining[nextIdx].id)
    } else {
      setActiveSaleId(null)
    }
    setGlobalProfId(null)
    // Refresca confirmadas e summary
    setConfirmedRefresh(k => k + 1)
    refetchSummary()
  }

  // ─── Render ───────────────────────────────────────────────────
  return (
    <>
      <style>{`
        @keyframes pos-fade-up { from { opacity:0; transform:translateY(8px) } to { opacity:1; transform:translateY(0) } }
        @keyframes pos-spin    { to { transform: rotate(360deg) } }
      `}</style>

      {toast && (
        <Toast
          message={toast.message}
          kind={toast.kind}
          onClose={() => setToast(null)}
        />
      )}

      <div style={{
        padding: isMobile ? '0 12px' : 0,
        animation: 'pos-fade-up 380ms cubic-bezier(0.22, 1, 0.36, 1) both',
        fontFamily: typography.fontFamily,
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100%',
      }}>
        {/* Header */}
        <div style={{
          marginBottom: isMobile ? 14 : 18,
        }}>
          <h2 style={{
            fontSize: isMobile ? 22 : typography.scale['2xl'],
            fontWeight: 700,
            letterSpacing: '-0.025em',
            color: typography.color.primary,
            margin: 0,
            lineHeight: 1.2,
          }}>
            Caixa
          </h2>
          <p style={{ fontSize: 13, color: typography.color.muted, margin: '4px 0 0' }}>
            POS com vendas, pagamento misto e nota de crédito.
          </p>
        </div>

        {/* Tabs */}
        <div style={{
          display: 'flex',
          gap: 4,
          padding: 4,
          background: 'rgba(0,0,0,0.05)',
          borderRadius: 12,
          marginBottom: 18,
          flexShrink: 0,
        }}>
          {TABS.map(t => {
            const isActive = tab === t.id
            const Icon = t.icon
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                style={{
                  flex: 1,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                  padding: '10px 8px',
                  borderRadius: 9,
                  border: 'none',
                  background: isActive ? '#fff' : 'transparent',
                  cursor: 'pointer',
                  fontSize: 12,
                  fontWeight: isActive ? 700 : 600,
                  color: isActive ? colors.gray[900] : colors.gray.dimText,
                  boxShadow: isActive ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
                  transition: `all ${transitions.fast}`,
                  fontFamily: 'inherit',
                  whiteSpace: 'nowrap',
                  WebkitTapHighlightColor: 'transparent',
                }}
              >
                <Icon size={13} strokeWidth={2} color={isActive ? colors.red.DEFAULT : colors.gray.dimText} />
                {t.label}
                {t.id === 'open' && openSales.length > 0 && (
                  <span style={{
                    fontSize: 10, fontWeight: 700,
                    padding: '1px 5px',
                    borderRadius: 4,
                    background: colors.red.subtle,
                    color: colors.red.DEFAULT,
                    fontVariantNumeric: 'tabular-nums',
                  }}>{openSales.length}</span>
                )}
              </button>
            )
          })}
        </div>

        {/* Conteúdo das abas */}
        {tab === 'open' && (
          <OpenTab
            openSales={openSales}
            activeSale={activeSale}
            activeSaleId={activeSaleId}
            services={services}
            products={products}
            professionals={professionals}
            globalProfId={globalProfId}
            openLoading={openLoading}
            catalogLoading={catalogLoading}
            creating={creating}
            isMobile={isMobile}
            onSelectSale={setActiveSaleId}
            onCreateNew={createNewSale}
            onAddService={addService}
            onAddProduct={addProduct}
            onSaleUpdated={updateSaleInList}
            onSaleClosed={handleSaleClosed}
            onProfChange={setGlobalProfId}
            onApplyProfToAll={applyGlobalProfToAllItems}
          />
        )}

        {tab === 'confirmed' && (
          <ConfirmedSalesList refreshKey={confirmedRefresh} />
        )}

        {tab === 'summary' && (
          <SalesSummaryCards
            summary={summary}
            loading={summaryLoading}
            isMobile={isMobile}
          />
        )}
      </div>
    </>
  )
}

// ─── Aba "Vendas Abertas" (extraída pra organizar) ────────────────────
interface OpenTabProps {
  openSales:       Sale[]
  activeSale:      Sale | null
  activeSaleId:    string | null
  services:        CatalogService[]
  products:        CatalogProduct[]
  professionals:   ProfLite[]
  globalProfId:    string | null
  openLoading:     boolean
  catalogLoading:  boolean
  creating:        boolean
  isMobile:        boolean
  onSelectSale:    (id: string) => void
  onCreateNew:     () => void
  onAddService:    (s: CatalogService) => void
  onAddProduct:    (p: CatalogProduct) => void
  onSaleUpdated:   (s: Sale) => void
  onSaleClosed:    () => void
  onProfChange:    (id: string | null) => void
  onApplyProfToAll: () => void
}

function OpenTab(props: OpenTabProps) {
  if (props.openLoading) {
    return (
      <div style={{
        display: 'flex', justifyContent: 'center', alignItems: 'center',
        padding: 60,
      }}>
        <Loader2
          size={26}
          color={colors.red.DEFAULT}
          style={{ animation: 'pos-spin 0.8s linear infinite' }}
        />
      </div>
    )
  }

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: 12,
      flex: 1,
      minHeight: 0,
    }}>
      {/* Switcher de carrinhos */}
      {(props.openSales.length > 0 || props.creating) && (
        <OpenSalesSwitcher
          openSales={props.openSales}
          activeId={props.activeSaleId}
          onSelect={props.onSelectSale}
          onAdd={props.onCreateNew}
          loading={props.creating}
        />
      )}

      {props.openSales.length === 0 && !props.creating ? (
        <div style={{
          background: '#fff',
          borderRadius: 14,
          border: `1px solid ${colors.gray.border}`,
          padding: '48px 24px',
          textAlign: 'center',
          fontFamily: typography.fontFamily,
        }}>
          <ShoppingCart size={36} color={colors.gray.dimText} style={{ opacity: 0.3, marginBottom: 12 }} />
          <div style={{ fontSize: 15, fontWeight: 700, color: colors.gray[900], marginBottom: 4 }}>
            Nenhuma venda aberta
          </div>
          <div style={{ fontSize: 12, color: colors.gray.dimText, marginBottom: 20 }}>
            Comece uma nova venda pra adicionar serviços e produtos.
          </div>
          <button
            onClick={props.onCreateNew}
            disabled={props.creating}
            style={{
              padding: '11px 22px',
              borderRadius: 10,
              border: 'none',
              background: colors.red.gradient,
              color: '#fff',
              fontSize: 13,
              fontWeight: 700,
              cursor: props.creating ? 'not-allowed' : 'pointer',
              fontFamily: 'inherit',
              letterSpacing: '.04em',
              textTransform: 'uppercase',
              boxShadow: `0 4px 14px ${colors.red.glow}`,
            }}
          >
            + Nova venda
          </button>
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: props.isMobile ? '1fr' : 'minmax(0, 1fr) 380px',
          gap: 14,
          flex: 1,
          minHeight: 0,
          alignItems: 'stretch',
        }}>
          {/* Catálogo */}
          <div style={{
            background: '#fff',
            borderRadius: 14,
            border: `1px solid ${colors.gray.border}`,
            padding: 14,
            minHeight: props.isMobile ? 300 : 0,
            maxHeight: props.isMobile ? 400 : 'none',
            display: 'flex',
            flexDirection: 'column',
          }}>
            <CatalogPanel
              services={props.services}
              products={props.products}
              loading={props.catalogLoading}
              isMobile={props.isMobile}
              onAddService={props.onAddService}
              onAddProduct={props.onAddProduct}
            />
          </div>

          {/* Carrinho ativo */}
          <div style={{
            background: '#fff',
            borderRadius: 14,
            border: `1px solid ${colors.gray.border}`,
            padding: 14,
            display: 'flex',
            flexDirection: 'column',
            minHeight: props.isMobile ? 500 : 0,
          }}>
            {props.activeSale ? (
              <CartPanel
                sale={props.activeSale}
                professionals={props.professionals}
                globalProfId={props.globalProfId}
                isMobile={props.isMobile}
                onSaleUpdated={props.onSaleUpdated}
                onSaleClosed={props.onSaleClosed}
                onProfChange={props.onProfChange}
                onApplyProfToAll={props.onApplyProfToAll}
              />
            ) : (
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flex: 1,
                color: colors.gray.dimText,
                fontSize: 12,
                fontFamily: typography.fontFamily,
              }}>
                Selecione uma venda na barra acima
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
