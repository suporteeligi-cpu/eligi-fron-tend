'use client'
// src/app/dashboard/estoque/components/StockProductRow.tsx

import { Package, ChevronRight, History, Sliders } from 'lucide-react'
import { colors, transitions, typography } from '@/shared/theme'
import { Product } from '@/features/products/types'
import { getStockStatus, STATUS_COLOR_MAP } from '@/features/stock/utils/format'
import StockStatusBadge from './StockStatusBadge'

interface Props {
  product:  Product
  isMobile: boolean
  isLast?:  boolean
  onMove:   () => void
  onHistory: () => void
}

export default function StockProductRow({
  product, isMobile, isLast, onMove, onHistory,
}: Props) {
  const hasImage = !!product.imageUrl
  const dot      = product.color ?? colors.red.DEFAULT
  const status   = getStockStatus(
    product.trackStock ?? false,
    product.stock ?? 0,
    product.stockAlert,
  )
  const statusC = STATUS_COLOR_MAP[status]

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: isMobile ? 12 : 14,
      padding: isMobile ? '12px 14px' : '14px 16px',
      borderBottom: isLast ? 'none' : `1px solid ${colors.gray.border}`,
      background: 'transparent',
      transition: `background ${transitions.fast}`,
      fontFamily: typography.fontFamily,
    }}>
      {/* Thumb */}
      <div style={{
        width: isMobile ? 42 : 46,
        height: isMobile ? 42 : 46,
        borderRadius: 10,
        background: hasImage ? '#fff' : dot,
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center', justifyContent: 'center',
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
        </div>
      </div>

      {/* Saldo */}
      <div style={{
        display: 'flex', flexDirection: 'column',
        alignItems: 'flex-end',
        gap: 4,
        flexShrink: 0,
        minWidth: isMobile ? 80 : 110,
      }}>
        <div style={{
          fontSize: isMobile ? 16 : 18,
          fontWeight: 700,
          color: statusC.fg,
          fontVariantNumeric: 'tabular-nums',
          letterSpacing: '-0.02em',
          lineHeight: 1,
        }}>
          {product.stock ?? 0}
          <span style={{
            fontSize: 11,
            fontWeight: 500,
            color: colors.gray.dimText,
            marginLeft: 4,
          }}>
            un.
          </span>
        </div>
        <StockStatusBadge status={status} compact />
      </div>

      {/* Ações */}
      {!isMobile && (
        <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
          <button
            onClick={onHistory}
            aria-label="Histórico"
            title="Ver histórico"
            style={{
              width: 32, height: 32, borderRadius: 8,
              border: `1px solid ${colors.gray.borderMd}`,
              background: 'transparent',
              cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: colors.gray[700],
              transition: `all ${transitions.fast}`,
            }}
            onMouseEnter={e => {
              e.currentTarget.style.borderColor = colors.red.DEFAULT
              e.currentTarget.style.color = colors.red.DEFAULT
            }}
            onMouseLeave={e => {
              e.currentTarget.style.borderColor = colors.gray.borderMd
              e.currentTarget.style.color = colors.gray[700]
            }}
          >
            <History size={13} strokeWidth={2} />
          </button>
          <button
            onClick={onMove}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '7px 14px',
              borderRadius: 8,
              border: 'none',
              background: colors.red.gradient,
              color: '#fff',
              fontSize: 12,
              fontWeight: 700,
              cursor: 'pointer',
              boxShadow: `0 2px 8px ${colors.red.glow}`,
              fontFamily: 'inherit',
            }}
          >
            <Sliders size={12} strokeWidth={2.5} />
            Movimentar
          </button>
        </div>
      )}

      {isMobile && (
        <button
          onClick={onMove}
          aria-label="Movimentar"
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: 4,
            display: 'flex',
            color: colors.gray.dimText,
            flexShrink: 0,
            WebkitTapHighlightColor: 'transparent',
          }}
        >
          <ChevronRight size={18} strokeWidth={2} />
        </button>
      )}
    </div>
  )
}
