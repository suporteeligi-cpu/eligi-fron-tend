'use client'
// src/app/dashboard/estoque/page.tsx

import { useState, useEffect, useCallback, useMemo } from 'react'
import { Search, X, PackageOpen } from 'lucide-react'

import api from '@/shared/lib/apiClient'
import { colors, typography } from '@/shared/theme'
import { useDeviceMode } from '@/features/agenda/hooks/useDeviceMode'
import { Product } from '@/features/products/types'
import { StockSummary } from '@/features/stock/types'
import { getStockStatus } from '@/features/stock/utils/format'

import StockSummaryCards from './components/StockSummaryCards'
import StockFilterTabs, { StockFilter } from './components/StockFilterTabs'
import StockProductRow   from './components/StockProductRow'
import MovementModal     from './components/MovementModal'
import HistoryDrawer     from './components/HistoryDrawer'
import Toast, { ToastKind } from './components/Toast'

export default function EstoquePage() {
  const mode = useDeviceMode()
  const isMobile = mode === 'mobile'

  const [products, setProducts] = useState<Product[]>([])
  const [summary,  setSummary]  = useState<StockSummary | null>(null)
  const [loading,  setLoading]  = useState(true)
  const [query,    setQuery]    = useState('')
  const [filter,   setFilter]   = useState<StockFilter>('all')

  const [movingProduct,    setMovingProduct]    = useState<Product | null>(null)
  const [viewingHistoryOf, setViewingHistoryOf] = useState<Product | null>(null)
  const [toast, setToast] = useState<{ message: string; kind: ToastKind } | null>(null)

  // ─── Fetch ─────────────────────────────────────────────────
  const fetchData = useCallback(async (signal?: AbortSignal) => {
    try {
      const [prodRes, sumRes] = await Promise.all([
        api.get('/products',              { signal }),
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

  // ─── Filtros ───────────────────────────────────────────────
  // Só mostra produtos com trackStock = true na página de estoque
  const tracked = useMemo(
    () => products.filter(p => p.trackStock),
    [products],
  )

  const counts = useMemo(() => {
    let low = 0, out = 0
    for (const p of tracked) {
      const s = getStockStatus(true, p.stock ?? 0, p.stockAlert)
      if (s === 'low') low++
      if (s === 'out') out++
    }
    return { all: tracked.length, low, out }
  }, [tracked])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    let result = tracked

    if (filter !== 'all') {
      result = result.filter(p => {
        const s = getStockStatus(true, p.stock ?? 0, p.stockAlert)
        return filter === 'low' ? s === 'low' : s === 'out'
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
  }, [tracked, query, filter])

  // ─── Handlers ──────────────────────────────────────────────
  function handleMovementSaved(updated: Product) {
    setProducts(prev => prev.map(p => p.id === updated.id ? updated : p))
    setToast({ message: 'Movimentação registrada', kind: 'success' })
    // Refetch summary pra atualizar KPIs
    api.get('/products/stock/summary')
      .then(res => setSummary(res.data?.data ?? res.data))
      .catch(() => {})
  }

  return (
    <>
      <style>{`
        @keyframes es-fade-up { from { opacity:0; transform:translateY(8px) } to { opacity:1; transform:translateY(0) } }
        @keyframes es-spin    { to { transform: rotate(360deg) } }
      `}</style>

      {movingProduct && (
        <MovementModal
          product={movingProduct}
          isMobile={isMobile}
          onSaved={handleMovementSaved}
          onClose={() => setMovingProduct(null)}
        />
      )}

      {viewingHistoryOf && (
        <HistoryDrawer
          product={viewingHistoryOf}
          isMobile={isMobile}
          onClose={() => setViewingHistoryOf(null)}
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
                  : `${tracked.length} produto${tracked.length !== 1 ? 's' : ''} com controle de estoque`
                }
              </p>
            )}
          </div>
        </div>

        {/* Cards de resumo */}
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
        ) : tracked.length === 0 ? (
          <EmptyState
            title="Nenhum produto com controle de estoque"
            subtitle="Habilite 'Controlar estoque' ao criar ou editar um produto em /produtos."
          />
        ) : filtered.length === 0 ? (
          <EmptyState
            title="Nenhum produto encontrado"
            subtitle={
              query ? 'Tente outro termo de busca.'
                    : filter === 'low' ? 'Nenhum produto com estoque baixo no momento.'
                    : 'Nenhum produto esgotado no momento.'
            }
          />
        ) : (
          <div style={{
            background: 'rgba(255,255,255,0.85)',
            backdropFilter: 'blur(20px) saturate(160%)',
            WebkitBackdropFilter: 'blur(20px) saturate(160%)',
            borderRadius: 14,
            border: '1px solid rgba(255,255,255,0.6)',
            boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
            overflow: 'hidden',
          }}>
            {filtered.map((p, i) => (
              <StockProductRow
                key={p.id}
                product={p}
                isMobile={isMobile}
                isLast={i === filtered.length - 1}
                onMove={() => setMovingProduct(p)}
                onHistory={() => setViewingHistoryOf(p)}
              />
            ))}
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

function EmptyState({ title, subtitle }: { title: string; subtitle: string }) {
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
      <div style={{ fontSize: 13, color: colors.gray.dimText, maxWidth: 320, margin: '0 auto' }}>
        {subtitle}
      </div>
    </div>
  )
}
