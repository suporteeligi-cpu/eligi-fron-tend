'use client'
// src/app/dashboard/caixa/components/OpenSalesSwitcher.tsx
//
// Barra horizontal com abas de vendas OPEN (uma por carrinho ativo).
// Igual abas Booksy: cada carrinho fica "aberto" e pode trocar entre eles.

import { Plus, ShoppingCart } from 'lucide-react'
import { colors, typography, transitions } from '@/shared/theme'
import { Sale } from '@/features/sales/types'
import { formatBRL, shortId } from '@/features/sales/utils/format'

interface Props {
  openSales:    Sale[]
  activeId:     string | null
  onSelect:     (id: string) => void
  onAdd:        () => void
  loading:      boolean
}

export default function OpenSalesSwitcher({
  openSales, activeId, onSelect, onAdd, loading,
}: Props) {
  return (
    <div style={{
      display: 'flex',
      gap: 6,
      padding: '4px',
      background: colors.background.page,
      borderRadius: 12,
      border: `1px solid ${colors.gray.border}`,
      overflowX: 'auto',
      WebkitOverflowScrolling: 'touch',
      fontFamily: typography.fontFamily,
    }}>
      {openSales.map(sale => {
        const isActive = activeId === sale.id
        const label = sale.clientName?.split(' ')[0] || `#${shortId(sale.id)}`
        const itemsCount = sale.items.length

        return (
          <button
            key={sale.id}
            onClick={() => onSelect(sale.id)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '8px 14px',
              borderRadius: 9,
              border: 'none',
              background: isActive ? '#fff' : 'transparent',
              cursor: 'pointer',
              fontFamily: 'inherit',
              transition: `all ${transitions.fast}`,
              boxShadow: isActive ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
              flexShrink: 0,
              WebkitTapHighlightColor: 'transparent',
            }}
          >
            <ShoppingCart
              size={12}
              color={isActive ? colors.red.DEFAULT : colors.gray.dimText}
              strokeWidth={2}
            />
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-start',
              gap: 1,
              minWidth: 0,
            }}>
              <span style={{
                fontSize: 12,
                fontWeight: isActive ? 700 : 600,
                color: isActive ? colors.gray[900] : colors.gray.dimText,
                whiteSpace: 'nowrap',
                maxWidth: 100,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}>
                {label}
              </span>
              <span style={{
                fontSize: 10,
                color: colors.gray.dimText,
                fontVariantNumeric: 'tabular-nums',
                whiteSpace: 'nowrap',
              }}>
                {itemsCount > 0 ? `${itemsCount} item${itemsCount !== 1 ? 's' : ''} · ${formatBRL(sale.total)}` : 'vazio'}
              </span>
            </div>
          </button>
        )
      })}

      <button
        onClick={onAdd}
        disabled={loading}
        aria-label="Nova venda"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 5,
          padding: '8px 12px',
          borderRadius: 9,
          border: `1px dashed ${colors.gray.borderMd}`,
          background: 'transparent',
          cursor: loading ? 'not-allowed' : 'pointer',
          fontFamily: 'inherit',
          color: colors.gray[700],
          flexShrink: 0,
          fontSize: 12,
          fontWeight: 700,
          letterSpacing: '.04em',
          textTransform: 'uppercase',
          opacity: loading ? 0.5 : 1,
          WebkitTapHighlightColor: 'transparent',
        }}
      >
        <Plus size={12} strokeWidth={2.5} />
        Nova
      </button>
    </div>
  )
}
