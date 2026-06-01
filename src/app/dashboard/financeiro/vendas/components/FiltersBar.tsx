'use client'
// src/app/dashboard/financeiro/vendas/components/FiltersBar.tsx

import { useState, useEffect } from 'react'
import { Search, X } from 'lucide-react'
import api from '@/shared/lib/apiClient'
import { colors, typography, radius } from '@/shared/theme'
import { SalesReportFilters, SaleReportStatus, PaymentMethod, SaleItemType } from '@/features/sales-report/types'

interface ProfLite { id: string; name: string }

interface Props {
  filters:   SalesReportFilters
  onChange:  (f: Partial<SalesReportFilters>) => void
  isMobile:  boolean
}

const STATUS_OPTS: Array<{ value: SaleReportStatus | ''; label: string }> = [
  { value: '',          label: 'Todas' },
  { value: 'CONFIRMED', label: 'Confirmadas' },
  { value: 'CANCELED',  label: 'Canceladas' },
]

const METHOD_OPTS: Array<{ value: PaymentMethod | ''; label: string }> = [
  { value: '',         label: 'Todos métodos' },
  { value: 'CASH',     label: 'Dinheiro' },
  { value: 'PIX',      label: 'PIX' },
  { value: 'CREDIT',   label: 'Crédito' },
  { value: 'DEBIT',    label: 'Débito' },
  { value: 'TRANSFER', label: 'Transferência' },
  { value: 'OTHER',    label: 'Outros' },
]
const ITEM_TYPE_OPTS: Array<{ value: SaleItemType | ''; label: string }> = [
  { value: '',        label: 'Todas categorias' },
  { value: 'SERVICE', label: 'Serviços' },
  { value: 'PRODUCT', label: 'Produtos' },
  { value: 'PACKAGE', label: 'Pacotes' },
]

export default function FiltersBar({ filters, onChange, isMobile }: Props) {
  const [professionals, setProfessionals] = useState<ProfLite[]>([])
  const [clientInput, setClientInput] = useState(filters.clientSearch ?? '')

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const res = await api.get('/equipe')
        const data = res.data?.data ?? res.data ?? []
        const list = Array.isArray(data) ? data : (data.professionals ?? [])
        if (!cancelled) {
          setProfessionals(list.map((p: { id: string; name: string }) => ({ id: p.id, name: p.name })))
        }
      } catch {
        if (!cancelled) setProfessionals([])
      }
    }
    load()
    return () => { cancelled = true }
  }, [])

  // Debounce client search
  useEffect(() => {
    const t = setTimeout(() => {
      if (clientInput !== (filters.clientSearch ?? '')) {
        onChange({ clientSearch: clientInput || undefined, page: 1 })
      }
    }, 400)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clientInput])

  const selectStyle: React.CSSProperties = {
    padding: '8px 10px',
    borderRadius: radius.sm,
    border: `1px solid ${colors.gray.borderMd}`,
    fontSize: typography.scale.sm,
    fontFamily: typography.fontFamily,
    color: typography.color.primary,
    background: '#fff',
    outline: 'none',
    cursor: 'pointer',
    minWidth: 0,
  }

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: 8,
      marginBottom: 16,
      fontFamily: typography.fontFamily,
    }}>
      {/* Linha 1: datas */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? '1fr 1fr' : 'auto auto 1fr',
        gap: 8,
        alignItems: 'center',
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          <label style={miniLabel}>De</label>
          <input
            type="date"
            value={filters.dateFrom ?? ''}
            onChange={e => onChange({ dateFrom: e.target.value || undefined, page: 1 })}
            style={selectStyle}
          />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          <label style={miniLabel}>Até</label>
          <input
            type="date"
            value={filters.dateTo ?? ''}
            onChange={e => onChange({ dateTo: e.target.value || undefined, page: 1 })}
            style={selectStyle}
          />
        </div>
        {!isMobile && <div />}
      </div>

      {/* Linha 2: selects + busca cliente */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? '1fr 1fr' : 'auto auto auto auto 1fr',
        gap: 8,
        alignItems: 'center',
      }}>
        <select
          value={filters.status ?? ''}
          onChange={e => onChange({ status: (e.target.value || undefined) as SaleReportStatus | undefined, page: 1 })}
          style={selectStyle}
        >
          {STATUS_OPTS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>

        <select
          value={filters.method ?? ''}
          onChange={e => onChange({ method: (e.target.value || undefined) as PaymentMethod | undefined, page: 1 })}
          style={selectStyle}
        >
          {METHOD_OPTS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <select
          value={filters.itemType ?? ''}
          onChange={e => onChange({ itemType: (e.target.value || undefined) as SaleItemType | undefined, page: 1 })}
          style={selectStyle}
        >
          {ITEM_TYPE_OPTS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>

        <select
          value={filters.professionalId ?? ''}
          onChange={e => onChange({ professionalId: e.target.value || undefined, page: 1 })}
          style={selectStyle}
        >
          <option value="">Todos profissionais</option>
          {professionals.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>

        {/* Busca cliente */}
        <div style={{
          position: 'relative',
          gridColumn: isMobile ? '1 / -1' : 'auto',
        }}>
          <Search
            size={13}
            color={colors.gray.dimText}
            style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)' }}
          />
          <input
            type="text"
            value={clientInput}
            onChange={e => setClientInput(e.target.value)}
            placeholder="Buscar cliente..."
            style={{
              ...selectStyle,
              width: '100%',
              boxSizing: 'border-box',
              paddingLeft: 28,
              paddingRight: clientInput ? 28 : 10,
              cursor: 'text',
            }}
          />
          {clientInput && (
            <button
              onClick={() => setClientInput('')}
              style={{
                position: 'absolute', right: 6, top: '50%', transform: 'translateY(-50%)',
                background: 'transparent', border: 'none', cursor: 'pointer',
                padding: 2, display: 'flex',
              }}
            >
              <X size={13} color={colors.gray.dimText} />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

const miniLabel: React.CSSProperties = {
  fontSize: 9,
  fontWeight: 700,
  color: 'rgba(0,0,0,0.40)',
  textTransform: 'uppercase',
  letterSpacing: '.06em',
  paddingLeft: 2,
}
