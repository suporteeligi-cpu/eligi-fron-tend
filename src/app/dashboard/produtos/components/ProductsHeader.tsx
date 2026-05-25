'use client'
// src/app/dashboard/produtos/components/ProductsHeader.tsx

import { Plus } from 'lucide-react'
import { colors, typography } from '@/shared/theme'

interface Props {
  count:      number
  loading:    boolean
  isMobile:   boolean
  onAdd:      () => void
}

export default function ProductsHeader({ count, loading, isMobile, onAdd }: Props) {
  return (
    <div style={{
      display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between',
      marginBottom: isMobile ? 14 : 20,
      gap: 12,
      fontFamily: typography.fontFamily,
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
          Produtos
        </h2>
        {!isMobile && (
          <p style={{ fontSize: 14, color: typography.color.muted, margin: '4px 0 0' }}>
            {loading
              ? 'Carregando...'
              : `${count} produto${count !== 1 ? 's' : ''}`
            }
          </p>
        )}
      </div>

      <button
        onClick={onAdd}
        style={{
          display: 'flex', alignItems: 'center', gap: 6,
          padding: isMobile ? '9px 14px' : '9px 18px',
          borderRadius: 12,
          border: 'none',
          background: colors.red.gradient,
          color: '#fff',
          fontSize: 13,
          fontWeight: 700,
          cursor: 'pointer',
          boxShadow: `0 4px 14px ${colors.red.glow}`,
          letterSpacing: '.02em',
          flexShrink: 0,
          WebkitTapHighlightColor: 'transparent',
          fontFamily: 'inherit',
        }}
      >
        <Plus size={15} strokeWidth={2.5} />
        {isMobile ? 'Novo' : 'Adicionar'}
      </button>
    </div>
  )
}
