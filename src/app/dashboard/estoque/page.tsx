'use client'
// src/app/dashboard/estoque/page.tsx
//
// Página unificada: lista TODOS os produtos do negócio.
// Produtos com trackStock=true mostram badge de status + saldo.
// Produtos sem controle de estoque aparecem normalmente, sem badge.
//
// Modal de produto tem 2 tabs: "Dados" e "Estoque".

import { useState, useEffect, useCallback, useMemo } from 'react'
import { Search, X, PackageOpen, Plus } from 'lucide-react'

import api from '@/shared/lib/apiClient'
import { colors, typography } from '@/shared/theme'
import { useDeviceMode } from '@/features/agenda/hooks/useDeviceMode'
import { Product } from '@/features/products/types'
import { StockSummary } from '@/features/stock/types'
import { getStockStatus } from '@/features/stock/utils/format'
import { extractCategories, groupByCategory } from '@/features/products/utils/format'

import StockSummaryCards from './components/StockSummaryCards'
import StockFilterTabs, { StockFilter } from './components/StockFilterTabs'
import ProductRow from './components/ProductRow'
import ProductModal from './components/ProductModal'
import Toast, { ToastKind } from './components/Toast'

export default function EstoquePage() {
  const mode = useDeviceMode()
  const isMobile = mode === 'mobile'

  const [products, setProducts] = useState<Product[]>([])
  const [summary,  setSummary]  = useState<StockSummary | null>(null)
  const [loading,  setLoading]  = useState(true)
  const [query,    setQuery]    = useState('')
  const [filter,   setFilter]   = useState<StockFilter>('all')

  const [modalProduct, setModalProduct] = useState<Product | null>(null)
  const [modalOpen,    setModalOpen]    = useState(false)
  const [toast, setToast] = useState<{ message: string; kind: ToastKind } | null>(null)

  // ─── Fetch ─────────────────────────────────────────────────
  const fetchData = useCallback(async (signal?: AbortSignal) => {
    try {
      const [prodRes, sumRes] = await Promise.all([
        api.get('/products',               { signal }),
        api.get('/products/stock/summary', { signal }),
      ])
      if (signal?.aborted) return
      const prodData = prodRes.data?.data ?? prodRes.data
      const sumData  = sumRes.data?.data  ?? sumRes.data
      setProducts(Array.isArray(prodData) ? prodData : prodData.products ?? [])
      setSummary(sumData ?? null)
    } catch {
      if (!signal?.aborted) {
        setProducts([])
        setSummary(null)
      }
    } finally {
      if (!signal?.aborted) setLoading(false)
    }
  }, [])

  useEffect(() => {
    const ctrl = new AbortController()
    fetchData(ctrl.signal)
    return () => ctrl.abort()
  }, [fetchData])

  // Refetch summary helper (chamado depois de movimentações)
  const refetchSummary = useCallback(() => {
    api.get('/products/stock/summary')
      .then(res => setSummary(res.data?.data ?? res.data))
      .catch(() => {})
  }, [])

  // ─── Filtros e counts ──────────────────────────────────────
  const counts = useMemo(() => {
    let inStock = 0, low = 0, out = 0, untracked = 0
    for (const p of products) {
      const s = getStockStatus(p.trackStock ?? false, p.stock ?? 0, p.stockAlert)
      if (s === 'ok')        inStock++
      else if (s === 'low')  low++
      else if (s === 'out')  out++
      else                   untracked++
    }
    return { all: products.length, inStock, low, out, untracked }
  }, [products])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    let result = products

    if (filter !== 'all') {
      result = result.filter(p => {
        const s = getStockStatus(p.trackStock ?? false, p.stock ?? 0, p.stockAlert)
        switch (filter) {
          case 'inStock':   return s === 'ok'
          case 'low':       return s === 'low'
          case 'out':       return s === 'out'
          case 'untracked': return s === 'untracked'
          default:          return true
        }
      })
    }

    if (q) {
      result = result.filter(p =>
        p.name.toLowerCase().includes(q) ||
        (p.category ?? '').toLowerCase().includes(q) ||
        (p.sku ?? '').toLowerCase().includes(q) ||
        (p.barcode ?? '').toLowerCase().includes(q),
      )
    }
    return result
  }, [products, query, filter])

  const categories = useMemo(() => extractCategories(products), [products])

  const grouped = useMemo(() => {
    const map = groupByCategory(filtered)
    return Array.from(map.entries()).sort(([a], [b]) => {
      if (a === 'Sem categoria') return 1
      if (b === 'Sem categoria') return -1
      return a.localeCompare(b)
    })
  }, [filtered])

  // ─── Handlers ──────────────────────────────────────────────
  function handleAdd() {
    setModalProduct(null)
    setModalOpen(true)
  }

  function handleEdit(p: Product) {
    setModalProduct(p)
    setModalOpen(true)
  }

  function handleSaved(saved: Product) {
    setProducts(prev => {
      const exists = prev.find(p => p.id === saved.id)
      if (exists) return prev.map(p => p.id === saved.id ? saved : p)
      return [...prev, saved]
    })
    setToast({
      message: modalProduct ? 'Produto atualizado' : 'Produto criado',
      kind: 'success',
    })
    refetchSummary()
  }

  function handleDeleted(id: string) {
    setProducts(prev => prev.filter(p => p.id !== id))
    setToast({ message: 'Produto apagado', kind: 'success' })
    refetchSummary()
  }

  function handleStockMoved(updated: Product) {
    setProducts(prev => prev.map(p => p.id === updated.id ? updated : p))
    setToast({ message: 'Movimentação registrada', kind: 'success' })
    refetchSummary()
  }

  function handleCloseModal() {
    setModalOpen(false)
    setTimeout(() => setModalProduct(null), 250)
  }

  return (
    <>
      <style>{`
        @keyframes es-fade-up { from { opacity:0; transform:translateY(8px) } to { opacity:1; transform:translateY(0) } }
        @keyframes es-spin    { to { transform: rotate(360deg) } }
      `}</style>

      {modalOpen && (
        <ProductModal
          product={modalProduct}
          isMobile={isMobile}
          categories={categories}
          onSaved={handleSaved}
          onDeleted={handleDeleted}
          onStockMoved={handleStockMoved}
          onClose={handleCloseModal}
        />
      )}

      {toast && (
        <Toast
          message={toast.message}
          kind={toast.kind}
          onClose={() => setToast(null)}
        />
      )}

      <div style={{
        padding: isMobile ? '0 12px' : 0,
        animation: 'es-fade-up 380ms cubic-bezier(0.22, 1, 0.36, 1) both',
        fontFamily: typography.fontFamily,
      }}>
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between',
          marginBottom: isMobile ? 14 : 18,
          gap: 12,
        }}>
          <div style={{ minWidth: 0 }}>
            <h2 style={{
              fontSize: isMobile ? 22 : typography.scale['2xl'],
              fontWeight: 700,
              letterSpacing: '-0.025em',
              color: typography.color.primary,
              margin: 0,
              lineHeight: 1.2,
            }}>
              Estoque
            </h2>
            {!isMobile && (
              <p style={{ fontSize: 14, color: typography.color.muted, margin: '4px 0 0' }}>
                {loading
                  ? 'Carregando...'
                  : `${products.length} produto${products.length !== 1 ? 's' : ''} cadastrado${products.length !== 1 ? 's' : ''}`
                }
              </p>
            )}
          </div>

          <button
            onClick={handleAdd}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: isMobile ? '9px 14px' : '9px 18px',
              borderRadius: 12,
              border: 'none',
              background: colors.red.gradient,
              color: '#fff',
              fontSize: 13,
              fontWeight: 700,
              cursor: 'pointer',
              boxShadow: `0 4px 14px ${colors.red.glow}`,
              letterSpacing: '.02em',
              flexShrink: 0,
              WebkitTapHighlightColor: 'transparent',
              fontFamily: 'inherit',
            }}
          >
            <Plus size={15} strokeWidth={2.5} />
            {isMobile ? 'Novo' : 'Adicionar'}
          </button>
        </div>

        {/* KPIs */}
        <StockSummaryCards
          summary={summary}
          loading={loading}
          isMobile={isMobile}
        />

        {/* Filtros */}
        <StockFilterTabs
          current={filter}
          onChange={setFilter}
          counts={counts}
        />

        {/* Busca */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '10px 14px',
          borderRadius: 12,
          background: 'rgba(255,255,255,0.85)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: `1px solid ${colors.gray.borderMd}`,
          marginBottom: 12,
        }}>
          <Search size={14} color={colors.gray.dimText} strokeWidth={2} />
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder={isMobile ? 'Buscar produto...' : 'Buscar por nome, categoria, SKU ou código de barras...'}
            inputMode="search"
            style={{
              flex: 1, border: 'none', outline: 'none',
              fontSize: 14, background: 'transparent',
              color: colors.gray[900],
              fontFamily: 'inherit',
              minWidth: 0,
            }}
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              aria-label="Limpar"
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                padding: 4, display: 'flex',
                WebkitTapHighlightColor: 'transparent',
              }}
            >
              <X size={13} color={colors.gray.dimText} />
            </button>
          )}
        </div>

        {/* Lista */}
        {loading ? (
          <LoadingState />
        ) : products.length === 0 ? (
          <EmptyState
            title="Nenhum produto cadastrado"
            subtitle="Comece adicionando seu primeiro produto. Você pode controlar estoque ou só ter o cadastro."
            ctaLabel="+ Adicionar produto"
            onCta={handleAdd}
          />
        ) : filtered.length === 0 ? (
          <EmptyState
            title="Nenhum produto encontrado"
            subtitle={
              query
                ? `Não há produtos correspondendo a "${query}".`
                : 'Tente outro filtro acima.'
            }
          />
        ) : (
          <div style={{
            background: 'rgba(255,255,255,0.72)',
            backdropFilter: 'blur(20px) saturate(160%)',
            WebkitBackdropFilter: 'blur(20px) saturate(160%)',
            borderRadius: 16,
            border: '1px solid rgba(255,255,255,0.60)',
            boxShadow: '0 2px 0 rgba(255,255,255,0.85) inset, 0 8px 28px rgba(0,0,0,0.06)',
            overflow: 'hidden',
          }}>
            {isMobile ? (
              // Mobile: lista flat
              filtered.map((p, i) => (
                <ProductRow
                  key={p.id}
                  product={p}
                  isMobile
                  isLast={i === filtered.length - 1}
                  onClick={() => handleEdit(p)}
                />
              ))
            ) : (
              // Desktop: agrupado por categoria
              grouped.map(([category, items], gi) => (
                <div key={category} style={{
                  borderBottom: gi === grouped.length - 1 ? 'none' : `1px solid ${colors.gray.border}`,
                }}>
                  <div style={{
                    padding: '12px 16px 8px',
                    fontSize: 10, fontWeight: 700,
                    color: colors.gray.dimText,
                    textTransform: 'uppercase',
                    letterSpacing: '.08em',
                    background: 'rgba(255,255,255,0.5)',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  }}>
                    <span>{category}</span>
                    <span style={{
                      fontSize: 10, fontWeight: 700,
                      padding: '2px 7px',
                      background: colors.gray.hover,
                      borderRadius: 6,
                      fontVariantNumeric: 'tabular-nums',
                    }}>{items.length}</span>
                  </div>
                  {items.map((p, i) => (
                    <ProductRow
                      key={p.id}
                      product={p}
                      isMobile={false}
                      isLast={i === items.length - 1}
                      onClick={() => handleEdit(p)}
                    />
                  ))}
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </>
  )
}

function LoadingState() {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: 48 }}>
      <div style={{
        width: 28, height: 28, borderRadius: '50%',
        border: '3px solid rgba(220,38,38,0.15)',
        borderTopColor: '#dc2626',
        animation: 'es-spin 0.8s linear infinite',
      }} />
    </div>
  )
}

function EmptyState({
  title, subtitle, ctaLabel, onCta,
}: {
  title:     string
  subtitle:  string
  ctaLabel?: string
  onCta?:    () => void
}) {
  return (
    <div style={{
      textAlign: 'center',
      padding: '50px 24px',
      background: 'rgba(255,255,255,0.85)',
      borderRadius: 14,
      border: `1px solid ${colors.gray.border}`,
    }}>
      <PackageOpen size={36} color={colors.gray.dimText} style={{ opacity: 0.3, marginBottom: 12 }} />
      <div style={{ fontSize: 15, fontWeight: 600, color: typography.color.primary, marginBottom: 4 }}>
        {title}
      </div>
      <div style={{
        fontSize: 13, color: colors.gray.dimText, maxWidth: 360, margin: '0 auto',
        marginBottom: ctaLabel ? 20 : 0,
      }}>
        {subtitle}
      </div>
      {ctaLabel && onCta && (
        <button
          onClick={onCta}
          style={{
            padding: '11px 22px',
            borderRadius: 10,
            background: colors.red.gradient,
            color: '#fff', border: 'none',
            fontWeight: 600,
            cursor: 'pointer',
            fontSize: 14,
            boxShadow: `0 3px 10px ${colors.red.glow}`,
            fontFamily: 'inherit',
          }}
        >
          {ctaLabel}
        </button>
      )}
    </div>
  )
}
