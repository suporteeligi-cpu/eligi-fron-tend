'use client'
// src/app/dashboard/equipe/components/ProfSidebar.tsx

import { Search, X, UserCog } from 'lucide-react'
import { colors, typography, transitions } from '@/shared/theme'
import { Professional } from '@/features/professionals/types'
import Avatar from './Avatar'

interface Props {
  professionals:  Professional[]
  selected:       Professional | null
  query:          string
  onQueryChange:  (q: string) => void
  onSelect:       (p: Professional) => void
  loading:        boolean
}

export default function ProfSidebar({
  professionals, selected, query, onQueryChange, onSelect, loading,
}: Props) {
  return (
    <div style={{
      borderRight: `1px solid ${colors.gray.border}`,
      display: 'flex', flexDirection: 'column',
      background: 'rgba(255,255,255,0.65)',
      overflow: 'hidden',
      height: '100%',
    }}>
      {/* Busca */}
      <div style={{
        padding: '12px 14px',
        borderBottom: `1px solid ${colors.gray.border}`,
        flexShrink: 0,
      }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 7,
          padding: '7px 11px',
          borderRadius: 9,
          background: colors.background.page,
          border: `1px solid ${colors.gray.borderMd}`,
        }}>
          <Search size={13} color={colors.gray.dimText} strokeWidth={2} />
          <input
            value={query}
            onChange={e => onQueryChange(e.target.value)}
            placeholder="Buscar..."
            style={{
              flex: 1, border: 'none', outline: 'none',
              fontSize: 13, background: 'transparent',
              color: colors.gray[900],
              fontFamily: typography.fontFamily,
              minWidth: 0,
            }}
          />
          {query && (
            <button
              onClick={() => onQueryChange('')}
              aria-label="Limpar busca"
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                padding: 0, display: 'flex', flexShrink: 0,
              }}
            >
              <X size={12} color={colors.gray.dimText} />
            </button>
          )}
        </div>
      </div>

      {/* Lista */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {loading ? (
          <div style={{
            padding: '40px 16px', textAlign: 'center',
            color: colors.gray.dimText, fontSize: 13,
          }}>
            Carregando...
          </div>
        ) : professionals.length === 0 ? (
          <div style={{ padding: '40px 16px', textAlign: 'center' }}>
            <UserCog size={24} color={colors.gray.dimText} style={{ opacity: 0.25, marginBottom: 10 }} />
            <div style={{ fontSize: 12, color: colors.gray.dimText }}>
              {query ? `Nada para "${query}"` : 'Nenhum profissional'}
            </div>
          </div>
        ) : (
          <div style={{ padding: '6px 8px' }}>
            {professionals.map(p => {
              const isSelected = selected?.id === p.id
              return (
                <button
                  key={p.id}
                  onClick={() => onSelect(p)}
                  style={{
                    width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                    padding: '8px 10px',
                    border: 'none',
                    textAlign: 'left', cursor: 'pointer',
                    background: isSelected ? 'rgba(255,255,255,0.95)' : 'transparent',
                    borderRadius: 9,
                    borderLeft: isSelected ? `3px solid ${colors.red.DEFAULT}` : '3px solid transparent',
                    transition: `all ${transitions.fast}`,
                    marginBottom: 2,
                    boxShadow: isSelected ? '0 2px 8px rgba(0,0,0,0.04)' : 'none',
                    WebkitTapHighlightColor: 'transparent',
                  }}
                  onMouseEnter={e => {
                    if (!isSelected) e.currentTarget.style.background = 'rgba(255,255,255,0.5)'
                  }}
                  onMouseLeave={e => {
                    if (!isSelected) e.currentTarget.style.background = 'transparent'
                  }}
                >
                  <Avatar name={p.name} size={32} url={p.avatarUrl} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontSize: 13,
                      fontWeight: 600,
                      color: isSelected ? colors.red.DEFAULT : colors.gray[900],
                      whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                      letterSpacing: '-0.01em',
                    }}>
                      {p.name}
                    </div>
                    <div style={{
                      fontSize: 11,
                      color: colors.gray.dimText,
                      marginTop: 1,
                      whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                    }}>
                      {p.role ?? 'Profissional'}
                    </div>
                  </div>
                  {!p.active && (
                    <span style={{
                      fontSize: 9, fontWeight: 700,
                      color: colors.gray.dimText,
                      background: colors.background.page,
                      border: `1px solid ${colors.gray.borderMd}`,
                      borderRadius: 4, padding: '1px 5px',
                      flexShrink: 0,
                    }}>OFF</span>
                  )}
                </button>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
