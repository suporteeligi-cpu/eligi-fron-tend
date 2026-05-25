'use client'
// src/app/dashboard/produtos/components/ProductsListDesktop.tsx

import { useMemo } from 'react'
import { Package } from 'lucide-react'
import { colors, typography } from '@/shared/theme'
import { Product } from '@/features/products/types'
import { groupByCategory } from '@/features/products/utils/format'
import ProductRow from './ProductRow'

interface Props {
  products: Product[]
  onSelect: (p: Product) => void
  onAdd:    () => void
  query:    string
}

export default function ProductsListDesktop({ products, onSelect, onAdd, query }: Props) {
  const groups = useMemo(() => {
    const map = groupByCategory(products)
    // Ordena categorias: "Sem categoria" no final
    return Array.from(map.entries()).sort(([a], [b]) => {
      if (a === 'Sem categoria') return 1
      if (b === 'Sem categoria') return -1
      return a.localeCompare(b)
    })
  }, [products])

  if (products.length === 0) {
    return <EmptyState query={query} onAdd={onAdd} />
  }

  return (
    <div style={{
      background: 'rgba(255,255,255,0.72)',
      backdropFilter: 'blur(20px) saturate(160%)',
      WebkitBackdropFilter: 'blur(20px) saturate(160%)',
      borderRadius: 16,
      border: '1px solid rgba(255,255,255,0.60)',
      boxShadow: '0 2px 0 rgba(255,255,255,0.85) inset, 0 8px 28px rgba(0,0,0,0.06)',
      overflow: 'hidden',
      fontFamily: typography.fontFamily,
    }}>
      {groups.map(([category, items], gi) => (
        <div key={category} style={{
          borderBottom: gi === groups.length - 1 ? 'none' : `1px solid ${colors.gray.border}`,
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
              onClick={() => onSelect(p)}
            />
          ))}
        </div>
      ))}
    </div>
  )
}

function EmptyState({ query, onAdd }: { query: string; onAdd: () => void }) {
  return (
    <div style={{
      textAlign: 'center',
      padding: '60px 24px',
      background: 'rgba(255,255,255,0.85)',
      borderRadius: 16,
      border: `1px solid ${colors.gray.border}`,
      fontFamily: typography.fontFamily,
    }}>
      <Package size={42} color={colors.gray.dimText} style={{ opacity: 0.3, marginBottom: 14 }} />
      <div style={{ fontSize: 16, fontWeight: 600, color: typography.color.primary, marginBottom: 4 }}>
        {query ? 'Nenhum produto encontrado' : 'Nenhum produto ainda'}
      </div>
      <div style={{ fontSize: 13, color: colors.gray.dimText, marginBottom: 20 }}>
        {query ? 'Tente outro termo de busca.' : 'Comece adicionando seu primeiro produto.'}
      </div>
      {!query && (
        <button
          onClick={onAdd}
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
          + Adicionar produto
        </button>
      )}
    </div>
  )
}
