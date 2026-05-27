'use client'
// src/app/dashboard/caixa/components/CartItemRow.tsx

import { Minus, Plus, Trash2, Scissors, Package, Users } from 'lucide-react'
import { colors, typography, transitions } from '@/shared/theme'
import { SaleItem, ProfLite } from '@/features/sales/types'
import { formatBRL } from '@/features/sales/utils/format'
import ProfPicker from './ProfPicker'

interface Props {
  item:           SaleItem
  professionals:  ProfLite[]
  globalProfId:   string | null  // o prof global do carrinho
  isMobile:       boolean
  onChangeQty:    (newQty: number) => void
  onChangeProf:   (profId: string | null) => void
  onRemove:       () => void
  disabled?:      boolean
}

export default function CartItemRow({
  item, professionals, globalProfId, isMobile,
  onChangeQty, onChangeProf, onRemove, disabled,
}: Props) {
  const Icon = item.type === 'PRODUCT' ? Package : Scissors
  const color = item.product?.color ?? item.service?.color ?? colors.red.DEFAULT

  // Detecta override (prof do item != global do carrinho)
  const isOverride = item.professionalId != null &&
                     globalProfId != null &&
                     item.professionalId !== globalProfId

  return (
    <div style={{
      padding: '12px 14px',
      background: '#fff',
      borderRadius: 11,
      border: `1px solid ${colors.gray.border}`,
      fontFamily: typography.fontFamily,
      display: 'flex',
      flexDirection: 'column',
      gap: 8,
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
        {/* Thumb */}
        <div style={{
          width: 36, height: 36, borderRadius: 8,
          background: item.product?.imageUrl ? '#fff' : color,
          overflow: 'hidden',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
        }}>
          {item.product?.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={item.product.imageUrl}
              alt={item.name}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          ) : (
            <Icon size={16} color="#fff" strokeWidth={2} />
          )}
        </div>

        {/* Info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontSize: 13, fontWeight: 700,
            color: colors.gray[900],
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          }}>
            {item.name}
          </div>
          <div style={{
            fontSize: 11,
            color: colors.gray.dimText,
            marginTop: 1,
            display: 'flex', alignItems: 'center', gap: 6,
          }}>
            <span>{formatBRL(item.unitPrice)} {item.quantity > 1 && `× ${item.quantity}`}</span>
          </div>
        </div>

        {/* Total + remove */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-end',
          gap: 4,
          flexShrink: 0,
        }}>
          <div style={{
            fontSize: 14,
            fontWeight: 700,
            color: colors.gray[900],
            fontVariantNumeric: 'tabular-nums',
          }}>
            {formatBRL(item.total)}
          </div>
          <button
            onClick={onRemove}
            disabled={disabled}
            aria-label="Remover"
            style={{
              width: 24, height: 24, borderRadius: 6,
              border: `1px solid ${colors.gray.borderMd}`,
              background: 'transparent',
              cursor: disabled ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: colors.gray.dimText,
              transition: `all ${transitions.fast}`,
              opacity: disabled ? 0.4 : 1,
              WebkitTapHighlightColor: 'transparent',
            }}
            onMouseEnter={e => {
              if (disabled) return
              e.currentTarget.style.borderColor = colors.red.DEFAULT
              e.currentTarget.style.color = colors.red.DEFAULT
            }}
            onMouseLeave={e => {
              e.currentTarget.style.borderColor = colors.gray.borderMd
              e.currentTarget.style.color = colors.gray.dimText
            }}
          >
            <Trash2 size={11} strokeWidth={2} />
          </button>
        </div>
      </div>

      {/* Linha inferior: qty + prof */}
      <div style={{
        display: 'flex',
        gap: 8,
        alignItems: 'center',
        paddingTop: 8,
        borderTop: `1px dashed ${colors.gray.border}`,
        flexDirection: isMobile ? 'column' : 'row',
      }}>
        {/* Qty stepper */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          background: colors.background.page,
          border: `1px solid ${colors.gray.borderMd}`,
          borderRadius: 8,
          padding: 2,
          flexShrink: 0,
          width: isMobile ? '100%' : 'auto',
          justifyContent: isMobile ? 'center' : 'flex-start',
        }}>
          <button
            onClick={() => item.quantity > 1 && onChangeQty(item.quantity - 1)}
            disabled={disabled || item.quantity <= 1}
            aria-label="Diminuir"
            style={{
              width: 26, height: 26, borderRadius: 6,
              border: 'none',
              background: 'transparent',
              cursor: (disabled || item.quantity <= 1) ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              opacity: (disabled || item.quantity <= 1) ? 0.3 : 1,
              color: colors.gray[700],
              WebkitTapHighlightColor: 'transparent',
            }}
          >
            <Minus size={11} strokeWidth={2.5} />
          </button>
          <span style={{
            minWidth: 28,
            textAlign: 'center',
            fontSize: 13,
            fontWeight: 700,
            color: colors.gray[900],
            fontVariantNumeric: 'tabular-nums',
          }}>
            {item.quantity}
          </span>
          <button
            onClick={() => onChangeQty(item.quantity + 1)}
            disabled={disabled}
            aria-label="Aumentar"
            style={{
              width: 26, height: 26, borderRadius: 6,
              border: 'none',
              background: 'transparent',
              cursor: disabled ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: colors.gray[700],
              WebkitTapHighlightColor: 'transparent',
            }}
          >
            <Plus size={11} strokeWidth={2.5} />
          </button>
        </div>

        {/* Prof picker */}
        <div style={{ flex: 1, minWidth: 0, width: '100%' }}>
          <ProfPicker
            professionals={professionals}
            value={item.professionalId ?? null}
            onChange={onChangeProf}
            label="Profissional do item"
            disabled={disabled}
            compact
          />
        </div>

        {isOverride && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 4,
            padding: '3px 7px',
            background: 'rgba(245,158,11,0.10)',
            border: '1px solid rgba(245,158,11,0.25)',
            borderRadius: 6,
            fontSize: 9,
            fontWeight: 700,
            color: '#b45309',
            letterSpacing: '.04em',
            textTransform: 'uppercase',
            flexShrink: 0,
            whiteSpace: 'nowrap',
          }}>
            <Users size={9} strokeWidth={2.5} />
            Override
          </div>
        )}
      </div>
    </div>
  )
}
