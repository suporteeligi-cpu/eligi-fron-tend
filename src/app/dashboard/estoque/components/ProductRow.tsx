'use client'
// src/app/dashboard/estoque/components/ProductRow.tsx
//
// Linha unificada do estoque.
// - Sempre mostra: thumb, nome, categoria/SKU, preço
// - Se trackStock=true: badge de status + saldo do lado do preço

import { Package, ChevronRight } from 'lucide-react'
import { colors, transitions, typography } from '@/shared/theme'
import { Product } from '@/features/products/types'
import { formatPrice } from '@/features/products/utils/format'
import { getStockStatus, STATUS_COLOR_MAP } from '@/features/stock/utils/format'

interface Props {
  product:  Product
  isMobile: boolean
  isLast?:  boolean
  onClick:  () => void
}

export default function ProductRow({ product, isMobile, isLast, onClick }: Props) {
  const hasImage = !!product.imageUrl
  const dot      = product.color ?? colors.red.DEFAULT
  const tracking = product.trackStock ?? false
  const status   = getStockStatus(tracking, product.stock ?? 0, product.stockAlert)
  const statusC  = STATUS_COLOR_MAP[status]

  return (
    <button
      onClick={onClick}
      style={{
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        gap: isMobile ? 12 : 14,
        padding: isMobile ? '12px 14px' : '12px 16px',
        border: 'none',
        borderBottom: isLast ? 'none' : `1px solid ${colors.gray.border}`,
        background: 'transparent',
        cursor: 'pointer',
        textAlign: 'left',
        transition: `background ${transitions.fast}`,
        WebkitTapHighlightColor: 'transparent',
        fontFamily: typography.fontFamily,
      }}
      onMouseEnter={e => (e.currentTarget.style.background = colors.gray.hover)}
      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
      onTouchStart={e => (e.currentTarget.style.background = colors.red.subtle)}
      onTouchEnd={e => (e.currentTarget.style.background = 'transparent')}
    >
      {/* Thumb */}
      <div style={{
        width: isMobile ? 42 : 46,
        height: isMobile ? 42 : 46,
        borderRadius: 10,
        background: hasImage ? '#fff' : dot,
        overflow: 'hidden',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0,
        boxShadow: hasImage
          ? '0 2px 6px rgba(0,0,0,0.08)'
          : `0 2px 8px ${dot}40`,
      }}>
        {hasImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={product.imageUrl!}
            alt={product.name}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        ) : (
          <Package size={isMobile ? 18 : 20} color="#fff" strokeWidth={2} />
        )}
      </div>

      {/* Info principal */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: 14,
          fontWeight: 600,
          color: colors.gray[900],
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          letterSpacing: '-0.01em',
        }}>
          {product.name}
        </div>
        <div style={{
          fontSize: 11,
          color: colors.gray.dimText,
          marginTop: 2,
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          flexWrap: 'wrap',
        }}>
          {product.category && <span>{product.category}</span>}
          {product.sku && (
            <>
              {product.category && <span>·</span>}
              <span style={{ fontVariantNumeric: 'tabular-nums' }}>{product.sku}</span>
            </>
          )}
          {!product.active && (
            <>
              <span>·</span>
              <span style={{
                fontSize: 9, fontWeight: 700,
                color: colors.gray.dimText,
                background: colors.background.page,
                border: `1px solid ${colors.gray.borderMd}`,
                borderRadius: 4, padding: '1px 5px',
                letterSpacing: '.04em',
              }}>INATIVO</span>
            </>
          )}
        </div>
      </div>

      {/* Coluna direita: preço + (saldo se tracking) */}
      <div style={{
        display: 'flex', flexDirection: 'column',
        alignItems: 'flex-end',
        gap: 4,
        flexShrink: 0,
        minWidth: 80,
      }}>
        <div style={{
          fontSize: 14,
          fontWeight: 700,
          color: colors.gray[900],
          fontVariantNumeric: 'tabular-nums',
          letterSpacing: '-0.01em',
          lineHeight: 1,
        }}>
          {formatPrice(product.price)}
        </div>

        {tracking && (
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 5,
            padding: '2px 7px',
            borderRadius: 999,
            background: statusC.bg,
            border: `1px solid ${statusC.border}`,
            color: statusC.fg,
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: '.02em',
            whiteSpace: 'nowrap',
            fontVariantNumeric: 'tabular-nums',
          }}>
            <span style={{
              width: 5, height: 5, borderRadius: '50%',
              background: statusC.fg,
              opacity: 0.85,
            }} />
            {product.stock ?? 0} un.
          </span>
        )}
      </div>

      {isMobile && (
        <ChevronRight size={15} color={colors.gray.dimText} strokeWidth={2} />
      )}
    </button>
  )
}
