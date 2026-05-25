'use client'
// src/app/dashboard/produtos/components/ProductRow.tsx

import { Package, ChevronRight } from 'lucide-react'
import { colors, transitions } from '@/shared/theme'
import { Product } from '@/features/products/types'
import { formatPrice } from '@/features/products/utils/format'

interface Props {
  product:  Product
  isMobile: boolean
  isLast?:  boolean
  onClick:  () => void
}

export default function ProductRow({ product, isMobile, isLast, onClick }: Props) {
  const hasImage = !!product.imageUrl
  const dot      = product.color ?? colors.red.DEFAULT

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
      }}
      onMouseEnter={e => (e.currentTarget.style.background = colors.gray.hover)}
      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
      onTouchStart={e => (e.currentTarget.style.background = colors.red.subtle)}
      onTouchEnd={e => (e.currentTarget.style.background = 'transparent')}
    >
      {/* Thumb (foto ou cor com ícone) */}
      <div style={{
        width: isMobile ? 42 : 46,
        height: isMobile ? 42 : 46,
        borderRadius: 10,
        background: hasImage ? '#fff' : dot,
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
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

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: isMobile ? 14 : 14,
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
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
        }}>
          {product.category && (
            <span>{product.category}</span>
          )}
          {product.sku && (
            <>
              {product.category && <span>·</span>}
              <span style={{ fontVariantNumeric: 'tabular-nums' }}>{product.sku}</span>
            </>
          )}
          {!product.active && (
            <span style={{
              fontSize: 9, fontWeight: 700,
              color: colors.gray.dimText,
              background: colors.background.page,
              border: `1px solid ${colors.gray.borderMd}`,
              borderRadius: 4, padding: '1px 5px',
              letterSpacing: '.04em',
              marginLeft: 'auto',
            }}>INATIVO</span>
          )}
        </div>
      </div>

      {/* Preço */}
      <div style={{
        fontSize: isMobile ? 14 : 14,
        fontWeight: 700,
        color: colors.gray[900],
        fontVariantNumeric: 'tabular-nums',
        flexShrink: 0,
        letterSpacing: '-0.01em',
      }}>
        {formatPrice(product.price)}
      </div>

      {isMobile && (
        <ChevronRight size={15} color={colors.gray.dimText} strokeWidth={2} />
      )}
    </button>
  )
}
