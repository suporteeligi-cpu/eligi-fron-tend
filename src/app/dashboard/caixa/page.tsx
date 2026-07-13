'use client'
// src/app/dashboard/caixa/page.tsx

import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { ShoppingCart, Receipt, TrendingUp, Loader2, ChevronUp, Lock } from 'lucide-react'

import api from '@/shared/lib/apiClient'
import { colors, typography, transitions } from '@/shared/theme'
import { useIsMobile } from '@/hooks/useIsMobile'
import { useAuth } from '@/hooks/useAuth'
import {
  Sale, CatalogProduct, CatalogService, CatalogPackage, CatalogMembership, ProfLite, SaleItemType,
} from '@/features/sales/types'
import { useSalesSummary } from '@/features/sales/hooks/useSalesSummary'

import CatalogPanel       from './components/CatalogPanel'
import CatalogStrip       from './components/CatalogStrip'
import CartPanel          from './components/CartPanel'
import ConfirmedSalesList from './components/ConfirmedSalesList'
import SalesSummaryCards  from './components/SalesSummaryCards'
import OpenSalesCleanupModal from './components/OpenSalesCleanupModal'
import Toast, { ToastKind } from './components/Toast'

type Tab = 'open' | 'confirmed' | 'summary'

const TABS: { id: Tab; label: string; icon: typeof ShoppingCart }[] = [
  { id: 'open',      label: 'Vendas Abertas', icon: ShoppingCart },
  { id: 'confirmed', label: 'Confirmadas',    icon: Receipt      },
  { id: 'summary',   label: 'Resumo',         icon: TrendingUp   },
]

export default function CaixaPage() {
  const isMobile = useIsMobile(768)
  const router   = useRouter()
  const { user } = useAuth()
  const isCheckoutOnly = user?.role === 'STAFF' || user?.role === 'BASIC_STAFF'

  const [tab,             setTab]             = useState<Tab>('open')
  const [openSales,       setOpenSales]       = useState<Sale[]>([])
  const [activeSaleId,    setActiveSaleId]    = useState<string | null>(null)
  const [openLoading,     setOpenLoading]     = useState(true)
  const [creating,        setCreating]        = useState(false)
  const [confirmedRefresh, setConfirmedRefresh] = useState(0)

  // Modal de limpeza
  const [showCleanupModal, setShowCleanupModal] = useState(false)
  const [cleanupSales,     setCleanupSales]     = useState<Sale[]>([])
  const cleanupShownRef = useRef(false)

  // Catálogo
  const [products,        setProducts]        = useState<CatalogProduct[]>([])
  const [services,        setServices]        = useState<CatalogService[]>([])  // ⭐ Serviços (aba reinserida)
  const [packages,        setPackages]        = useState<CatalogPackage[]>([])  // ⭐ NOVO
  const [memberships,     setMemberships]     = useState<CatalogMembership[]>([])  // ⭐ Assinaturas
  const [professionals,   setProfessionals]   = useState<ProfLite[]>([])
  const [catalogLoading,  setCatalogLoading]  = useState(true)

  const [toast, setToast] = useState<{ message: string; kind: ToastKind } | null>(null)

  // Data do fechamento (default: hoje). Formato YYYY-MM-DD pra input date.
  const [summaryDate, setSummaryDate] = useState<string>(() => {
    const d = new Date()
    const off = d.getTimezoneOffset() * 60000
    return new Date(d.getTime() - off).toISOString().slice(0, 10)
  })

  // Range do dia inteiro (00:00 → 23:59:59 local) em ISO
  const { summaryFrom, summaryTo } = useMemo(() => {
    const from = new Date(`${summaryDate}T00:00:00`)
    const to   = new Date(`${summaryDate}T23:59:59.999`)
    return { summaryFrom: from.toISOString(), summaryTo: to.toISOString() }
  }, [summaryDate])

  const [summaryCategory, setSummaryCategory] = useState<SaleItemType | null>(null)

  const { summary, loading: summaryLoading, refetch: refetchSummary }
    = useSalesSummary({ dateFrom: summaryFrom, dateTo: summaryTo, itemType: summaryCategory ?? undefined }, !!user && !isCheckoutOnly)

  const [initialActive] = useState<string>(() => {
    if (typeof window === 'undefined') return ''
    const sp = new URLSearchParams(window.location.search)
    return sp.get('active') ?? ''
  })
  const initialActiveConsumedRef = useRef(false)

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

      const activeFromQuery = !initialActiveConsumedRef.current ? initialActive : ''

      setActiveSaleId(prev => {
        if (activeFromQuery && list.find(s => s.id === activeFromQuery)) {
          return activeFromQuery
        }
        if (prev && list.find(s => s.id === prev)) return prev
        return list[0]?.id ?? null
      })

      if (list.length > 1 && !cleanupShownRef.current) {
        cleanupShownRef.current = true
        setCleanupSales(list)
        setShowCleanupModal(true)
      }

      if (activeFromQuery) {
        initialActiveConsumedRef.current = true
        setTimeout(() => {
          router.replace('/dashboard/caixa', { scroll: false })
        }, 100)
      }
    } catch {
      if (!signal?.aborted) setOpenSales([])
    } finally {
      if (!signal?.aborted) setOpenLoading(false)
    }
  }, [router, initialActive])

  // ⭐ Carrega catálogo: services + products + packages + professionals
  const fetchCatalog = useCallback(async (signal?: AbortSignal) => {
    try {
      const [prdRes, pkgRes, memRes, profRes, svcRes] = await Promise.all([
        api.get('/products',         { signal }),
        api.get('/packages',         { params: { active: true }, signal }),  // ⭐ NOVO
        api.get('/memberships',      { params: { active: true }, signal }),  // ⭐ Assinaturas
        isCheckoutOnly ? Promise.resolve({ data: { data: [] } }) : api.get('/equipe',           { signal }),
        api.get('/services',         { signal }),  // ⭐ Serviços (aba reinserida)
      ])
      if (signal?.aborted) return

      const prdData  = prdRes.data?.data  ?? prdRes.data
      const pkgData  = pkgRes.data?.data  ?? pkgRes.data
      const memData  = memRes.data?.data  ?? memRes.data
      const profData = profRes.data?.data ?? profRes.data
      const svcData  = svcRes.data?.data  ?? svcRes.data

      setProducts(Array.isArray(prdData) ? prdData : prdData.products ?? [])
      setServices(Array.isArray(svcData) ? svcData : svcData.services ?? [])  // ⭐ Serviços
      setPackages(Array.isArray(pkgData) ? pkgData : [])  // ⭐ NOVO
      setMemberships(Array.isArray(memData) ? memData : [])  // ⭐ Assinaturas
      setProfessionals(
        (Array.isArray(profData) ? profData : [])
          .filter((p: { id?: string; active?: boolean }) => p.id != null && p.active !== false)
          .map((p: { id: string; name: string; avatarUrl?: string | null }) => ({
            id: p.id, name: p.name, avatarUrl: p.avatarUrl ?? null,
          })),
      )
    } catch {
      if (!signal?.aborted) {
        setProducts([])
        setServices([])
        setPackages([])
        setMemberships([])
        setProfessionals([])
      }
    } finally {
      if (!signal?.aborted) setCatalogLoading(false)
    }
  }, [isCheckoutOnly])

  useEffect(() => {
    const ctrl = new AbortController()
    fetchOpenSales(ctrl.signal)
    fetchCatalog(ctrl.signal)
    return () => ctrl.abort()
  }, [fetchOpenSales, fetchCatalog])

  const activeSale = openSales.find(s => s.id === activeSaleId) ?? null

  // @eligi:checkout-prof-list
  // Lista de profissionais visível no ProfPicker.
  // Owner/manager: lista completa (de /equipe). Checkout-only (STAFF/BASIC_STAFF):
  // apenas o próprio funcionário + os donos dos itens já presentes na venda (dedup),
  // pois o /equipe não é buscado para esses cargos. Sem request extra.
  const visibleProfessionals = useMemo<ProfLite[]>(() => {
    if (!isCheckoutOnly) return professionals
    const map = new Map<string, ProfLite>()
    if (user?.professionalId) {
      map.set(user.professionalId, {
        id: user.professionalId,
        name: user.name,
        avatarUrl: user.avatarUrl ?? null,
      })
    }
    for (const it of activeSale?.items ?? []) {
      if (it.professional) {
        map.set(it.professional.id, {
          id: it.professional.id,
          name: it.professional.name,
          avatarUrl: it.professional.avatarUrl ?? null,
        })
      }
    }
    return [...map.values()]
  }, [isCheckoutOnly, professionals, user, activeSale])

  async function createNewSale() {
    try {
      setCreating(true)
      const res = await api.post('/sales', {})
      const newSale: Sale = res.data?.data ?? res.data
      setOpenSales([newSale])
      setActiveSaleId(newSale.id)
    } catch {
      setToast({ message: 'Erro ao criar venda', kind: 'error' })
    } finally {
      setCreating(false)
    }
  }

  function updateSaleInList(updated: Sale) {
    setOpenSales(prev => prev.map(s => s.id === updated.id ? updated : s))
  }

  // Default de profissional p/ item avulso no caixa.
  // Prioridade: prof herdado do 1º SERVICE do carrinho → senão, se STAFF/BASIC_STAFF,
  // o próprio funcionário logado → senão null (owner/manager escolhem à mão).
  // Item vindo de booking de OUTRO prof já chega com professionalId próprio e não passa aqui.
  function resolveDefaultProfId(): string | null {
    const inherited = activeSale?.items.find(it => it.type === 'SERVICE' && it.professionalId)?.professionalId
    if (inherited) return inherited
    if (isCheckoutOnly && user?.professionalId) return user.professionalId
    return null
  }

  async function addProduct(product: CatalogProduct) {
    if (!activeSaleId) {
      try {
        const res = await api.post('/sales', {})
        const newSale: Sale = res.data?.data ?? res.data
        setOpenSales([newSale])
        setActiveSaleId(newSale.id)
        await addItemToSale(newSale.id, {
          type: 'PRODUCT',
          productId: product.id,
          professionalId: null,
        })
      } catch {
        setToast({ message: 'Erro ao criar venda', kind: 'error' })
      }
      return
    }
    await addItemToSale(activeSaleId, {
      type: 'PRODUCT',
      productId: product.id,
      professionalId: resolveDefaultProfId(),
    })
  }

  // ⭐ Serviços: adicionar ao carrinho (avulso) — herda prof do 1º serviço
  async function addService(svc: CatalogService) {
    if (!activeSaleId) {
      try {
        const res = await api.post('/sales', {})
        const newSale: Sale = res.data?.data ?? res.data
        setOpenSales([newSale])
        setActiveSaleId(newSale.id)
        await addItemToSale(newSale.id, {
          type: 'SERVICE',
          serviceId: svc.id,
          professionalId: null,
        })
      } catch {
        setToast({ message: 'Erro ao criar venda', kind: 'error' })
      }
      return
    }
    await addItemToSale(activeSaleId, {
      type: 'SERVICE',
      serviceId: svc.id,
      professionalId: resolveDefaultProfId(),
    })
  }

  // ⭐ NOVO: adicionar pacote ao carrinho
  async function addPackage(pkg: CatalogPackage) {
    if (!activeSaleId) {
      try {
        const res = await api.post('/sales', {})
        const newSale: Sale = res.data?.data ?? res.data
        setOpenSales([newSale])
        setActiveSaleId(newSale.id)
        await addItemToSale(newSale.id, {
          type: 'PACKAGE',
          packageId: pkg.id,
          professionalId: null,
        })
      } catch {
        setToast({ message: 'Erro ao criar venda', kind: 'error' })
      }
      return
    }
    await addItemToSale(activeSaleId, {
      type: 'PACKAGE',
      packageId: pkg.id,
      professionalId: resolveDefaultProfId(),
    })
  }

  // ⭐ Assinaturas: adicionar ao carrinho
  async function addMembership(mem: CatalogMembership) {
    if (!activeSaleId) {
      try {
        const res = await api.post('/sales', {})
        const newSale: Sale = res.data?.data ?? res.data
        setOpenSales([newSale])
        setActiveSaleId(newSale.id)
        await addItemToSale(newSale.id, {
          type: 'MEMBERSHIP',
          membershipId: mem.id,
          professionalId: null,
        })
      } catch {
        setToast({ message: 'Erro ao criar venda', kind: 'error' })
      }
      return
    }
    await addItemToSale(activeSaleId, {
      type: 'MEMBERSHIP',
      membershipId: mem.id,
      professionalId: resolveDefaultProfId(),
    })
  }

  async function addItemToSale(saleId: string, item: {
    type: SaleItemType
    serviceId?: string
    productId?: string
    packageId?: string             // ⭐ NOVO
    membershipId?: string          // ⭐ Assinaturas
    professionalId: string | null
  }) {
    try {
      await api.post(`/sales/${saleId}/items`, item)
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

  function handleSaleClosed() {
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
    setConfirmedRefresh(k => k + 1)
    refetchSummary()
  }

  async function handleCancelAllOpen() {
    try {
      await api.post('/sales/cancel-all-open')
      setOpenSales([])
      setActiveSaleId(null)
      setShowCleanupModal(false)
      setToast({ message: 'Vendas canceladas com sucesso', kind: 'success' })
    } catch {
      setToast({ message: 'Erro ao cancelar vendas', kind: 'error' })
    }
  }

  async function handleKeepOneCancelOthers(saleIdToKeep: string) {
    try {
      const toCancel = cleanupSales.filter(s => s.id !== saleIdToKeep)
      await Promise.all(
        toCancel.map(s => api.post(`/sales/${s.id}/cancel`)),
      )
      const kept = cleanupSales.find(s => s.id === saleIdToKeep)
      if (kept) {
        setOpenSales([kept])
        setActiveSaleId(saleIdToKeep)
      }
      setShowCleanupModal(false)
      setToast({
        message: `${toCancel.length} venda(s) cancelada(s), 1 mantida`,
        kind: 'success',
      })
    } catch {
      setToast({ message: 'Erro ao cancelar vendas', kind: 'error' })
    }
  }

  return (
    <>
      <style>{`
        @keyframes pos-fade-up { from { opacity:0; transform:translateY(8px) } to { opacity:1; transform:translateY(0) } }
        @keyframes pos-spin    { to { transform: rotate(360deg) } }
        @keyframes pos-slide-in { from { opacity:0; transform:translateX(12px) } to { opacity:1; transform:translateX(0) } }
      `}</style>

      {toast && (
        <Toast
          message={toast.message}
          kind={toast.kind}
          onClose={() => setToast(null)}
        />
      )}

      {showCleanupModal && !isCheckoutOnly && (
        <OpenSalesCleanupModal
          sales={cleanupSales}
          isMobile={isMobile}
          onCancelAll={handleCancelAllOpen}
          onKeepOne={handleKeepOneCancelOthers}
          onClose={() => setShowCleanupModal(false)}
        />
      )}

      <div style={{
        /* @eligi:caixa-mobile-height */
        /* @eligi:caixa-fullbleed */
        padding: 0,
        animation: 'pos-fade-up 380ms cubic-bezier(0.22, 1, 0.36, 1) both',
        fontFamily: typography.fontFamily,
        display: 'flex',
        flexDirection: 'column',
        ...(isMobile ? {
          height: 'calc(100dvh - var(--navbar-h, 104px) - var(--bottom-nav-h, 64px) - env(safe-area-inset-bottom))',
          overflow: 'hidden',
        } : {
          minHeight: '100%',
        }),
      }}>
        <div style={{ marginBottom: isMobile ? 14 : 18, padding: isMobile ? '0 14px' : 0 }}>
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
            POS com vendas, pagamento misto, pacotes e nota de crédito.
          </p>
        </div>

        <div style={{
          display: 'flex',
          gap: 4,
          padding: 4,
          background: 'rgba(0,0,0,0.05)',
          borderRadius: 12,
          margin: isMobile ? '0 14px 14px' : '0 0 18px',
          flexShrink: 0,
        }}>
          {TABS.map(t => {
            const isActive = tab === t.id
            const locked = isCheckoutOnly && t.id !== 'open'
            const Icon = locked ? Lock : t.icon
            return (
              <button
                key={t.id}
                onClick={() => { if (!locked) setTab(t.id) }}
                disabled={locked}
                title={locked ? 'Sem permissão' : undefined}
                style={{
                  flex: 1,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                  padding: '10px 8px',
                  borderRadius: 9,
                  border: 'none',
                  background: isActive ? '#fff' : 'transparent',
                  cursor: locked ? 'not-allowed' : 'pointer',
                  opacity: locked ? 0.45 : 1,
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

        {tab === 'open' && (
          <OpenTab
            openSales={openSales}
            activeSale={activeSale}
            products={products}
            services={services}            /* ⭐ Serviços */
            packages={packages}            /* ⭐ NOVO */
            memberships={memberships}      /* ⭐ Assinaturas */
            professionals={visibleProfessionals}
            openLoading={openLoading}
            catalogLoading={catalogLoading}
            creating={creating}
            isMobile={isMobile}
            onCreateNew={createNewSale}
            onAddProduct={addProduct}
            onAddService={addService}      /* ⭐ Serviços */
            onAddPackage={addPackage}      /* ⭐ NOVO */
            onAddMembership={addMembership} /* ⭐ Assinaturas */
            onSaleUpdated={updateSaleInList}
            onSaleClosed={handleSaleClosed}
          />
        )}

        {tab === 'confirmed' && !isCheckoutOnly && (
          <ConfirmedSalesList refreshKey={confirmedRefresh} />
        )}

        {tab === 'summary' && !isCheckoutOnly && (
          <SalesSummaryCards
            summary={summary}
            loading={summaryLoading}
            isMobile={isMobile}
            date={summaryDate}
            onDateChange={setSummaryDate}
            category={summaryCategory}
            onCategoryChange={setSummaryCategory}
          />
        )}
      </div>
    </>
  )
}

interface OpenTabProps {
  openSales:       Sale[]
  activeSale:      Sale | null
  products:        CatalogProduct[]
  services:        CatalogService[]      // ⭐ Serviços
  packages:        CatalogPackage[]      // ⭐ NOVO
  memberships:     CatalogMembership[]   // ⭐ Assinaturas
  professionals:   ProfLite[]
  openLoading:     boolean
  catalogLoading:  boolean
  creating:        boolean
  isMobile:        boolean
  onCreateNew:     () => void
  onAddProduct:    (p: CatalogProduct) => void
  onAddService:    (s: CatalogService) => void   // ⭐ Serviços
  onAddPackage:    (p: CatalogPackage) => void   // ⭐ NOVO
  onAddMembership: (m: CatalogMembership) => void // ⭐ Assinaturas
  onSaleUpdated:   (s: Sale) => void
  onSaleClosed:    () => void
}

function OpenTab(props: OpenTabProps) {
  const [catalogExpanded, setCatalogExpanded] = useState(false)
  // Colapsa a grade DEPOIS de adicionar (aguarda o async pra não perder o item).
  const addAndCollapse = <T,>(fn: (arg: T) => void | Promise<void>) => async (arg: T) => {
    await fn(arg)
    setCatalogExpanded(false)
  }


  if (props.openLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: 60 }}>
        <Loader2
          size={26}
          color={colors.red.DEFAULT}
          style={{ animation: 'pos-spin 0.8s linear infinite' }}
        />
      </div>
    )
  }

  if (props.openSales.length === 0 && !props.creating) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, flex: 1, minHeight: 0 }}>
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
            Comece uma nova venda pra adicionar serviços, produtos ou pacotes.
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
      </div>
    )
  }


  if (props.isMobile) {
    // @eligi:caixa-strip — Fatia 2: tira (colapsado) ↔ grade (expandido).
    return (
      <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, position: 'relative' }}>
        <div style={{
          background: '#fff',
          borderBottom: `1px solid ${colors.gray.border}`,
          padding: '10px 14px 12px',
          flexShrink: 0, minHeight: 0,
          maxHeight: catalogExpanded ? '58%' : undefined,
          display: 'flex', flexDirection: 'column',
        }}>
          {catalogExpanded ? (
            <>
              <button
                onClick={() => setCatalogExpanded(false)}
                style={{
                  flexShrink: 0, alignSelf: 'flex-end',
                  display: 'flex', alignItems: 'center', gap: 5,
                  background: 'transparent', border: 'none', cursor: 'pointer',
                  color: colors.gray.dimText, fontSize: 12, fontWeight: 700,
                  fontFamily: 'inherit', padding: '2px 4px 8px',
                  WebkitTapHighlightColor: 'transparent',
                }}
              >
                Recolher <ChevronUp size={15} strokeWidth={2.4} />
              </button>
              <CatalogPanel
                products={props.products}
                services={props.services}
                packages={props.packages}
                memberships={props.memberships}
                loading={props.catalogLoading}
                isMobile={props.isMobile}
                onAddProduct={addAndCollapse(props.onAddProduct)}
                onAddService={addAndCollapse(props.onAddService)}
                onAddPackage={addAndCollapse(props.onAddPackage)}
                onAddMembership={addAndCollapse(props.onAddMembership)}
              />
            </>
          ) : (
            <CatalogStrip
              products={props.products}
              services={props.services}
              packages={props.packages}
              memberships={props.memberships}
              loading={props.catalogLoading}
              onExpand={() => setCatalogExpanded(true)}
              onAddProduct={props.onAddProduct}
              onAddService={props.onAddService}
              onAddPackage={props.onAddPackage}
              onAddMembership={props.onAddMembership}
            />
          )}
        </div>
        <div style={{
          background: '#fff',
          padding: '10px 14px 0',
          flex: 1, minHeight: 0,
          display: 'flex', flexDirection: 'column',
        }}>
          {props.activeSale ? (
            <CartPanel
              sale={props.activeSale}
              professionals={props.professionals}
              isMobile={props.isMobile}
              onSaleUpdated={props.onSaleUpdated}
              onSaleClosed={props.onSaleClosed}
            />
          ) : (
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flex: 1, color: colors.gray.dimText, fontSize: 12,
            }}>
              Nenhuma venda ativa
            </div>
          )}
        </div>
      </div>
    )
  }

  // DESKTOP
  return (
    <div style={{
      display: 'flex', flexDirection: 'column',
      gap: 12, flex: 1, minHeight: 0,
    }}>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(0, 1fr) 380px',
        gap: 14,
        flex: 1, minHeight: 0,
        alignItems: 'stretch',
      }}>
        <div style={{
          background: '#fff',
          borderRadius: 14,
          border: `1px solid ${colors.gray.border}`,
          padding: 14,
          minHeight: 0,
          display: 'flex', flexDirection: 'column',
        }}>
          <CatalogPanel
            products={props.products}
            services={props.services}             /* ⭐ Serviços */
            packages={props.packages}             /* ⭐ NOVO */
            memberships={props.memberships}       /* ⭐ Assinaturas */
            loading={props.catalogLoading}
            isMobile={props.isMobile}
            onAddProduct={props.onAddProduct}
            onAddService={props.onAddService}     /* ⭐ Serviços */
            onAddPackage={props.onAddPackage}     /* ⭐ NOVO */
            onAddMembership={props.onAddMembership} /* ⭐ Assinaturas */
          />
        </div>

        <div style={{
          background: '#fff',
          borderRadius: 14,
          border: `1px solid ${colors.gray.border}`,
          padding: 14,
          display: 'flex', flexDirection: 'column',
          minHeight: 0,
        }}>
          {props.activeSale ? (
            <CartPanel
              sale={props.activeSale}
              professionals={props.professionals}
              isMobile={props.isMobile}
              onSaleUpdated={props.onSaleUpdated}
              onSaleClosed={props.onSaleClosed}
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
    </div>
  )
}
