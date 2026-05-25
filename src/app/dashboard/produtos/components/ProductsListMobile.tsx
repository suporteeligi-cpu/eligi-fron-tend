'use client'
// src/app/dashboard/produtos/components/ProductsListMobile.tsx

import { Package } from 'lucide-react'
import { colors, typography } from '@/shared/theme'
import { Product } from '@/features/products/types'
import ProductRow from './ProductRow'

interface Props {
  products: Product[]
  onSelect: (p: Product) => void
  onAdd:    () => void
  query:    string
}

export default function ProductsListMobile({ products, onSelect, onAdd, query }: Props) {
  if (products.length === 0) {
    return <EmptyState query={query} onAdd={onAdd} />
  }

  return (
    <div style={{
      background: 'rgba(255,255,255,0.85)',
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      borderRadius: 16,
      border: `1px solid ${colors.gray.border}`,
      boxShadow: '0 2px 12px rgba(0,0,0,0.05)',
      overflow: 'hidden',
    }}>
      {products.map((p, i) => (
        <ProductRow
          key={p.id}
          product={p}
          isMobile
          isLast={i === products.length - 1}
          onClick={() => onSelect(p)}
        />
      ))}
    </div>
  )
}

function EmptyState({ query, onAdd }: { query: string; onAdd: () => void }) {
  return (
    <div style={{
      textAlign: 'center',
      padding: '50px 24px',
      background: 'rgba(255,255,255,0.85)',
      borderRadius: 16,
      border: `1px solid ${colors.gray.border}`,
      fontFamily: typography.fontFamily,
    }}>
      <Package size={36} color={colors.gray.dimText} style={{ opacity: 0.3, marginBottom: 12 }} />
      <div style={{ fontSize: 15, fontWeight: 600, color: typography.color.primary, marginBottom: 4 }}>
        {query ? 'Nenhum produto' : 'Nenhum produto ainda'}
      </div>
      <div style={{ fontSize: 13, color: colors.gray.dimText, marginBottom: 18 }}>
        {query ? 'Tente outro termo.' : 'Adicione seu primeiro produto.'}
      </div>
      {!query && (
        <button
          onClick={onAdd}
          style={{
            padding: '10px 20px',
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
          + Adicionar produto
        </button>
      )}
    </div>
  )
}
