'use client'
// src/app/dashboard/financeiro/vendas/components/ExportButton.tsx

import { useState, useRef, useEffect } from 'react'
import { Download, FileSpreadsheet, FileText, Loader2, ChevronDown } from 'lucide-react'
import api from '@/shared/lib/apiClient'
import { colors, typography, radius, shadows } from '@/shared/theme'
import { SalesReportFilters, ExportRow } from '@/features/sales-report/types'
import { exportToCSV, exportToExcel, exportFilename } from '@/features/sales-report/utils'

interface Props {
  filters: SalesReportFilters
  disabled?: boolean
}

export default function ExportButton({ filters, disabled }: Props) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState<'csv' | 'xlsx' | null>(null)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  async function fetchExportRows(): Promise<ExportRow[]> {
    const params: Record<string, string> = {}
    if (filters.dateFrom)       params.dateFrom = filters.dateFrom
    if (filters.dateTo)         params.dateTo = filters.dateTo
    if (filters.status)         params.status = filters.status
    if (filters.professionalId) params.professionalId = filters.professionalId
    if (filters.method)         params.method = filters.method
    if (filters.clientSearch)   params.clientSearch = filters.clientSearch

    const res = await api.get('/sales/report/export', { params })
    return res.data?.data ?? []
  }

  async function handleExport(format: 'csv' | 'xlsx') {
    setLoading(format)
    setOpen(false)
    try {
      const rows = await fetchExportRows()
      if (rows.length === 0) {
        alert('Nenhuma venda para exportar com os filtros atuais.')
        return
      }
      const filename = exportFilename()
      if (format === 'csv') {
        exportToCSV(rows, filename)
      } else {
        await exportToExcel(rows, filename)
      }
    } catch {
      alert('Erro ao exportar. Tente novamente.')
    } finally {
      setLoading(null)
    }
  }

  const isLoading = loading !== null

  return (
    <div ref={ref} style={{ position: 'relative', fontFamily: typography.fontFamily }}>
      <button
        onClick={() => setOpen(o => !o)}
        disabled={disabled || isLoading}
        style={{
          display: 'flex', alignItems: 'center', gap: 6,
          padding: '8px 14px',
          borderRadius: radius.sm,
          border: 'none',
          background: disabled || isLoading ? colors.gray.borderMd : colors.red.gradient,
          color: '#fff',
          fontSize: typography.scale.sm,
          fontWeight: typography.weight.bold,
          cursor: disabled || isLoading ? 'not-allowed' : 'pointer',
          fontFamily: 'inherit',
          boxShadow: disabled || isLoading ? 'none' : shadows.redSm,
          WebkitTapHighlightColor: 'transparent',
        }}
      >
        {isLoading
          ? <Loader2 size={13} style={{ animation: 'pos-spin 0.8s linear infinite' }} />
          : <Download size={13} strokeWidth={2.4} />
        }
        {isLoading ? 'Exportando…' : 'Exportar'}
        {!isLoading && <ChevronDown size={12} strokeWidth={2.4} />}
        <style>{`@keyframes pos-spin { to { transform: rotate(360deg) } }`}</style>
      </button>

      {open && (
        <div style={{
          position: 'absolute',
          top: 'calc(100% + 4px)',
          right: 0,
          minWidth: 180,
          background: '#fff',
          border: `1px solid ${colors.gray.border}`,
          borderRadius: radius.sm,
          boxShadow: '0 8px 24px rgba(0,0,0,0.10)',
          zIndex: 100,
          overflow: 'hidden',
          padding: 4,
        }}>
          <ExportOption
            Icon={FileSpreadsheet}
            label="Excel (.xlsx)"
            sub="Abre no Excel/Sheets"
            onClick={() => handleExport('xlsx')}
          />
          <ExportOption
            Icon={FileText}
            label="CSV"
            sub="Texto separado por vírgula"
            onClick={() => handleExport('csv')}
          />
        </div>
      )}
    </div>
  )
}

function ExportOption({
  Icon, label, sub, onClick,
}: {
  Icon: React.ComponentType<{ size?: number; color?: string; strokeWidth?: number }>
  label: string
  sub: string
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      style={{
        width: '100%',
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '9px 10px',
        background: 'transparent',
        border: 'none',
        borderRadius: 7,
        cursor: 'pointer',
        textAlign: 'left',
        fontFamily: 'inherit',
        WebkitTapHighlightColor: 'transparent',
      }}
      onMouseEnter={e => { e.currentTarget.style.background = colors.gray.hover }}
      onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
    >
      <Icon size={16} color={colors.red.DEFAULT} strokeWidth={2} />
      <div>
        <div style={{
          fontSize: typography.scale.sm,
          fontWeight: typography.weight.semibold,
          color: typography.color.primary,
        }}>{label}</div>
        <div style={{ fontSize: 10, color: typography.color.muted }}>{sub}</div>
      </div>
    </button>
  )
}
