'use client'
// src/app/dashboard/estoque/components/HistoryDrawer.tsx

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import {
  X, ArrowDownToLine, ArrowUpFromLine, Sliders, AlertOctagon, Package,
} from 'lucide-react'

import api from '@/shared/lib/apiClient'
import { colors, typography } from '@/shared/theme'
import { Product } from '@/features/products/types'
import { StockMovement, StockMovementType } from '@/features/stock/types'
import {
  MOVEMENT_TYPE_LABEL, MOVEMENT_TYPE_COLOR,
  movementDelta, formatDelta, formatRelative, formatBRL,
} from '@/features/stock/utils/format'

interface Props {
  product:  Product
  isMobile: boolean
  onClose:  () => void
}

const ICON_MAP: Record<StockMovementType, typeof ArrowDownToLine> = {
  IN:     ArrowDownToLine,
  OUT:    ArrowUpFromLine,
  ADJUST: Sliders,
  LOSS:   AlertOctagon,
}

export default function HistoryDrawer({ product, isMobile, onClose }: Props) {
  const [movements, setMovements] = useState<StockMovement[]>([])
  const [loading,   setLoading]   = useState(true)

  useEffect(() => {
    let cancelled = false
    api.get(`/products/${product.id}/movements`, { params: { limit: 50 } })
      .then(res => {
        if (cancelled) return
        const data = res.data?.data ?? res.data
        setMovements(Array.isArray(data) ? data : [])
        setLoading(false)
      })
      .catch(() => {
        if (!cancelled) {
          setMovements([])
          setLoading(false)
        }
      })
    return () => { cancelled = true }
  }, [product.id])

  if (typeof document === 'undefined') return null

  return createPortal(
    <>
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0,
          background: 'rgba(0,0,0,0.30)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          zIndex: 10998,
          animation: 'hd-fade 0.18s ease',
        }}
      />

      <div style={isMobile ? {
        position: 'fixed', bottom: 0, left: 0, right: 0,
        top: 'var(--navbar-h, 60px)',
        background: '#fafafa',
        borderRadius: '24px 24px 0 0',
        boxShadow: '0 -8px 40px rgba(0,0,0,0.18)',
        zIndex: 10999,
        display: 'flex', flexDirection: 'column',
        fontFamily: typography.fontFamily,
        animation: 'hd-up 0.30s cubic-bezier(0.34, 1.2, 0.64, 1)',
      } : {
        position: 'fixed', top: 0, right: 0, bottom: 0,
        width: 440, maxWidth: '94vw',
        background: '#fafafa',
        boxShadow: '-8px 0 40px rgba(0,0,0,0.15)',
        zIndex: 10999,
        display: 'flex', flexDirection: 'column',
        fontFamily: typography.fontFamily,
        animation: 'hd-slide 0.30s cubic-bezier(0.34, 1.2, 0.64, 1)',
      }}>
        <style>{`
          @keyframes hd-fade { from { opacity:0 } to { opacity:1 } }
          @keyframes hd-slide { from { transform: translateX(100%) } to { transform: translateX(0) } }
          @keyframes hd-up { from { transform: translateY(100%) } to { transform: translateY(0) } }
        `}</style>

        {isMobile && (
          <div aria-hidden style={{
            width: 40, height: 4, borderRadius: 2,
            background: 'rgba(0,0,0,0.12)',
            margin: '12px auto 0',
            flexShrink: 0,
          }} />
        )}

        {/* Header */}
        <div style={{
          padding: '16px 20px',
          borderBottom: `1px solid ${colors.gray.border}`,
          background: '#fff',
          flexShrink: 0,
          display: 'flex', alignItems: 'center', gap: 12,
        }}>
          {/* Thumb */}
          <div style={{
            width: 40, height: 40,
            borderRadius: 9,
            background: product.imageUrl ? '#fff' : (product.color ?? colors.red.DEFAULT),
            overflow: 'hidden',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
            boxShadow: '0 2px 6px rgba(0,0,0,0.08)',
          }}>
            {product.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={product.imageUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <Package size={18} color="#fff" strokeWidth={2} />
            )}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              fontSize: 11, fontWeight: 700,
              color: colors.gray.dimText,
              textTransform: 'uppercase',
              letterSpacing: '.06em',
              marginBottom: 2,
            }}>
              Histórico de movimentações
            </div>
            <div style={{
              fontSize: 15,
              fontWeight: 700,
              color: colors.gray[900],
              whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
              letterSpacing: '-0.01em',
            }}>
              {product.name}
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Fechar"
            style={{
              width: 30, height: 30, borderRadius: '50%',
              border: `1px solid ${colors.gray.borderMd}`,
              background: 'transparent',
              cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <X size={14} color={colors.gray.dimText} />
          </button>
        </div>

        {/* Lista */}
        <div style={{
          flex: 1, overflowY: 'auto',
          padding: '12px 16px 24px',
          WebkitOverflowScrolling: 'touch',
        }}>
          {loading ? (
            <div style={{
              padding: 40, textAlign: 'center',
              color: colors.gray.dimText, fontSize: 13,
            }}>
              Carregando histórico...
            </div>
          ) : movements.length === 0 ? (
            <div style={{
              padding: 40, textAlign: 'center',
              color: colors.gray.dimText, fontSize: 13,
            }}>
              Nenhuma movimentação registrada ainda.
            </div>
          ) : (
            movements.map((m, idx) => (
              <MovementCard
                key={m.id}
                movement={m}
                isFirst={idx === 0}
              />
            ))
          )}
        </div>
      </div>
    </>,
    document.body,
  )
}

function MovementCard({ movement, isFirst }: { movement: StockMovement; isFirst: boolean }) {
  const Icon  = ICON_MAP[movement.type]
  const color = MOVEMENT_TYPE_COLOR[movement.type]
  const delta = movementDelta(movement.type, movement.quantity, movement.stockBefore)

  return (
    <div style={{
      display: 'flex',
      gap: 12,
      padding: '12px 14px',
      background: '#fff',
      borderRadius: 12,
      marginBottom: 8,
      boxShadow: isFirst ? '0 2px 8px rgba(0,0,0,0.04)' : '0 1px 3px rgba(0,0,0,0.03)',
      border: `1px solid ${colors.gray.border}`,
    }}>
      <div style={{
        width: 36, height: 36, borderRadius: 9,
        background: color.bg,
        color: color.fg,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0,
      }}>
        <Icon size={16} strokeWidth={2.2} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 6,
          marginBottom: 2,
        }}>
          <span style={{
            fontSize: 13, fontWeight: 700,
            color: colors.gray[900],
          }}>
            {MOVEMENT_TYPE_LABEL[movement.type]}
          </span>
          <span style={{
            fontSize: 13, fontWeight: 700,
            color: color.fg,
            fontVariantNumeric: 'tabular-nums',
          }}>
            {formatDelta(delta)}
          </span>
        </div>
        <div style={{
          fontSize: 11,
          color: colors.gray.dimText,
          marginBottom: 4,
          display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap',
        }}>
          <span>{formatRelative(movement.createdAt)}</span>
          {movement.user?.name && (
            <>
              <span>·</span>
              <span>{movement.user.name}</span>
            </>
          )}
          <span>·</span>
          <span style={{ fontVariantNumeric: 'tabular-nums' }}>
            {movement.stockBefore} → {movement.stockAfter}
          </span>
        </div>
        {movement.reason && (
          <div style={{
            fontSize: 12,
            color: colors.gray[700],
            marginTop: 4,
            padding: '4px 8px',
            background: colors.background.page,
            borderRadius: 6,
            wordBreak: 'break-word',
          }}>
            {movement.reason}
          </div>
        )}
        {(movement.reference || movement.unitCost != null) && (
          <div style={{
            display: 'flex', gap: 10, marginTop: 6,
            fontSize: 11, color: colors.gray.dimText,
            flexWrap: 'wrap',
          }}>
            {movement.reference && (
              <span>Ref: <strong>{movement.reference}</strong></span>
            )}
            {movement.unitCost != null && (
              <span>Custo un.: <strong>{formatBRL(movement.unitCost)}</strong></span>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
