'use client'
// src/app/dashboard/clientes/components/ClientsSearchBar.tsx

import { Search, X, ArrowUpDown } from 'lucide-react'
import { colors, typography, radius } from '@/shared/theme'

const ORDER_OPTIONS = [
  { value: 'createdAt:desc', label: 'Mais recentes'     },
  { value: 'createdAt:asc',  label: 'Mais antigos'      },
  { value: 'name:asc',       label: 'Nome A–Z'          },
  { value: 'name:desc',      label: 'Nome Z–A'          },
  { value: 'bookings:desc',  label: 'Mais agendamentos' },
] as const

interface Props {
  search:    string
  setSearch: (v: string) => void
  sort:      string
  setSort:   (v: string) => void
  isMobile:  boolean
}

export default function ClientsSearchBar({ search, setSearch, sort, setSort, isMobile }: Props) {
  return (
    <>
      <style>{`
        .csb-input{
          width: 100%;
          padding: ${isMobile ? '10px 14px 10px 36px' : '10px 14px 10px 38px'};
          border-radius: ${radius.sm}px;
          border: 1px solid ${colors.gray.borderMd};
          background: ${colors.background.surface};
          font-size: ${typography.scale.base}px;
          outline: none;
          box-sizing: border-box;
          font-family: ${typography.fontFamily};
          color: ${typography.color.primary};
          transition: border-color 0.15s ease, box-shadow 0.15s ease;
        }
        .csb-input:focus{
          border-color: ${colors.red.borderHover};
          box-shadow: 0 0 0 3px ${colors.red.focusRing};
        }
        .csb-sel{
          padding: ${isMobile ? '10px 26px 10px 30px' : '10px 26px 10px 30px'};
          border-radius: ${radius.sm}px;
          border: 1px solid ${colors.gray.borderMd};
          background: ${colors.background.surface};
          font-size: ${typography.scale.sm}px;
          font-weight: ${typography.weight.semibold};
          cursor: pointer;
          color: ${typography.color.secondary};
          outline: none;
          appearance: none;
          font-family: ${typography.fontFamily};
          width: 100%;
        }
        .csb-sel:focus{
          border-color: ${colors.red.borderHover};
          box-shadow: 0 0 0 3px ${colors.red.focusRing};
        }
      `}</style>

      <div style={{
        display: 'flex',
        flexDirection: isMobile ? 'column' : 'row',
        gap: isMobile ? 8 : 10,
        marginBottom: isMobile ? 12 : 20,
      }}>
        {/* Busca */}
        <div style={{ flex: 1, position: 'relative', minWidth: 0 }}>
          <Search
            size={15}
            color={colors.gray.dimText}
            style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}
          />
          <input
            className="csb-input"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={isMobile ? 'Buscar nome ou telefone' : 'Buscar por nome ou telefone...'}
            inputMode="search"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              aria-label="Limpar busca"
              style={{
                position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
                background: 'none', border: 'none', cursor: 'pointer', display: 'flex',
                padding: 4,
                WebkitTapHighlightColor: 'transparent',
              }}
            >
              <X size={14} color={colors.gray.dimText} />
            </button>
          )}
        </div>

        {/* Sort */}
        <div style={{ position: 'relative', flexShrink: 0, width: isMobile ? '100%' : 'auto' }}>
          <ArrowUpDown
            size={13}
            color={colors.gray.dimText}
            style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}
          />
          <select className="csb-sel" value={sort} onChange={e => setSort(e.target.value)}>
            {ORDER_OPTIONS.map(o => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
          <div style={{
            position: 'absolute', right: 10, top: '50%',
            transform: 'translateY(-50%)',
            pointerEvents: 'none', fontSize: 10, color: colors.gray.dimText,
          }}>▾</div>
        </div>
      </div>
    </>
  )
}
