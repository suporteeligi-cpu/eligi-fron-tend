'use client'
// src/app/dashboard/servicos/components/ServicesSearchBar.tsx

import { Search, X } from 'lucide-react'
import { colors, typography, radius, shadows } from '@/shared/theme'

interface Props {
  search:    string
  setSearch: (v: string) => void
  isMobile:  boolean
}

export default function ServicesSearchBar({ search, setSearch, isMobile }: Props) {
  return (
    <>
      <style>{`
        .svc-search-input{
          width: 100%;
          padding: 11px 14px 11px 38px;
          border-radius: ${radius.md}px;
          border: 1px solid ${colors.gray.borderMd};
          background: ${colors.background.surface};
          font-size: ${typography.scale.base}px;
          outline: none;
          box-sizing: border-box;
          font-family: ${typography.fontFamily};
          color: ${typography.color.primary};
          box-shadow: ${shadows.sm};
          transition: border-color 0.15s ease, box-shadow 0.15s ease;
        }
        .svc-search-input:focus{
          border-color: ${colors.red.borderHover};
          box-shadow: ${shadows.sm}, 0 0 0 3px ${colors.red.focusRing};
        }
      `}</style>

      <div style={{ position: 'relative', marginBottom: isMobile ? 12 : 20 }}>
        <Search
          size={15}
          color={colors.gray.dimText}
          style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}
        />
        <input
          className="svc-search-input"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder={isMobile ? 'Pesquisar serviços...' : 'Pesquisar serviços...'}
          inputMode="search"
        />
        {search && (
          <button
            onClick={() => setSearch('')}
            aria-label="Limpar busca"
            style={{
              position: 'absolute', right: 12, top: '50%',
              transform: 'translateY(-50%)',
              background: 'none', border: 'none', cursor: 'pointer',
              display: 'flex', alignItems: 'center',
              padding: 4,
              WebkitTapHighlightColor: 'transparent',
            }}
          >
            <X size={14} color={colors.gray.dimText} />
          </button>
        )}
      </div>
    </>
  )
}
