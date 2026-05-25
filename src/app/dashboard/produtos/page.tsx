'use client'
// src/app/dashboard/produtos/page.tsx

import { useState, useEffect, useCallback, useMemo } from 'react'

import api from '@/shared/lib/apiClient'
import { typography } from '@/shared/theme'
import { useDeviceMode } from '@/features/agenda/hooks/useDeviceMode'
import { Product } from '@/features/products/types'
import { extractCategories } from '@/features/products/utils/format'

import ProductsHeader      from './components/ProductsHeader'
import ProductsSearchBar   from './components/ProductsSearchBar'
import ProductsListDesktop from './components/ProductsListDesktop'
import ProductsListMobile  from './components/ProductsListMobile'
import ProductModal        from './components/ProductModal'
import Toast, { ToastKind } from './components/Toast'

export default function ProdutosPage() {
  const mode = useDeviceMode()
  const isMobile = mode === 'mobile'

  const [products, setProducts] = useState<Product[]>([])
  const [loading,  setLoading]  = useState(true)
  const [query,    setQuery]    = useState('')
  const [modalProduct, setModalProduct] = useState<Product | null>(null)
  const [modalOpen,    setModalOpen]    = useState(false)
  const [toast, setToast] = useState<{ message: string; kind: ToastKind } | null>(null)

  // ─── Fetch ──────────────────────────────────────────────────────
  const fetchData = useCallback(async (signal?: AbortSignal) => {
    try {
      const res = await api.get('/products', { signal })
      if (signal?.aborted) return
      const data = res.data?.data ?? res.data
      setProducts(Array.isArray(data) ? data : data.products ?? [])
    } catch {
      if (!signal?.aborted) setProducts([])
    } finally {
      if (!signal?.aborted) setLoading(false)
    }
  }, [])

  useEffect(() => {
    const ctrl = new AbortController()
    fetchData(ctrl.signal)
    return () => ctrl.abort()
  }, [fetchData])

  // ─── Filtros ────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return products
    return products.filter(p =>
      p.name.toLowerCase().includes(q) ||
      (p.category ?? '').toLowerCase().includes(q) ||
      (p.sku ?? '').toLowerCase().includes(q) ||
      (p.barcode ?? '').toLowerCase().includes(q),
    )
  }, [products, query])

  const categories = useMemo(() => extractCategories(products), [products])

  // ─── Handlers ───────────────────────────────────────────────────
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
      if (exists) {
        return prev.map(p => p.id === saved.id ? saved : p)
      }
      return [...prev, saved]
    })
    setToast({
      message: modalProduct ? 'Produto atualizado' : 'Produto criado',
      kind: 'success',
    })
  }

  function handleDeleted(id: string) {
    setProducts(prev => prev.filter(p => p.id !== id))
    setToast({ message: 'Produto apagado', kind: 'success' })
  }

  function handleCloseModal() {
    setModalOpen(false)
    // Pequeno delay pra animação fechar antes de limpar (evita flicker)
    setTimeout(() => setModalProduct(null), 250)
  }

  return (
    <>
      <style>{`
        @keyframes pr-fade-up { from { opacity:0; transform:translateY(8px) } to { opacity:1; transform:translateY(0) } }
      `}</style>

      {modalOpen && (
        <ProductModal
          product={modalProduct}
          isMobile={isMobile}
          categories={categories}
          onSaved={handleSaved}
          onDeleted={handleDeleted}
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
        animation: 'pr-fade-up 380ms cubic-bezier(0.22, 1, 0.36, 1) both',
        fontFamily: typography.fontFamily,
      }}>
        <ProductsHeader
          count={products.length}
          loading={loading}
          isMobile={isMobile}
          onAdd={handleAdd}
        />

        <ProductsSearchBar
          value={query}
          onChange={setQuery}
          isMobile={isMobile}
        />

        {loading ? (
          <LoadingSkeleton />
        ) : isMobile ? (
          <ProductsListMobile
            products={filtered}
            onSelect={handleEdit}
            onAdd={handleAdd}
            query={query}
          />
        ) : (
          <ProductsListDesktop
            products={filtered}
            onSelect={handleEdit}
            onAdd={handleAdd}
            query={query}
          />
        )}
      </div>
    </>
  )
}

function LoadingSkeleton() {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: 48 }}>
      <div style={{
        width: 28, height: 28, borderRadius: '50%',
        border: '3px solid rgba(220,38,38,0.15)',
        borderTopColor: '#dc2626',
        animation: 'eq-spin 0.8s linear infinite',
      }} />
      <style>{`
        @keyframes eq-spin { to { transform: rotate(360deg) } }
      `}</style>
    </div>
  )
}
