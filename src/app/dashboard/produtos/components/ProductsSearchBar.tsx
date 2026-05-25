'use client'
// src/app/dashboard/produtos/components/ProductsSearchBar.tsx

import { Search, X } from 'lucide-react'
import { colors, typography } from '@/shared/theme'

interface Props {
  value:    string
  onChange: (q: string) => void
  isMobile: boolean
}

export default function ProductsSearchBar({ value, onChange, isMobile }: Props) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 8,
      padding: '10px 14px',
      borderRadius: 12,
      background: 'rgba(255,255,255,0.85)',
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      border: `1px solid ${colors.gray.borderMd}`,
      marginBottom: 14,
      fontFamily: typography.fontFamily,
    }}>
      <Search size={14} color={colors.gray.dimText} strokeWidth={2} />
      <input
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={isMobile ? 'Buscar produto...' : 'Buscar por nome, categoria, SKU ou código de barras...'}
        inputMode="search"
        style={{
          flex: 1, border: 'none', outline: 'none',
          fontSize: 14, background: 'transparent',
          color: colors.gray[900],
          fontFamily: 'inherit',
          minWidth: 0,
        }}
      />
      {value && (
        <button
          onClick={() => onChange('')}
          aria-label="Limpar"
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            padding: 4, display: 'flex',
            WebkitTapHighlightColor: 'transparent',
          }}
        >
          <X size={13} color={colors.gray.dimText} />
        </button>
      )}
    </div>
  )
}
