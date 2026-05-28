'use client'
// src/app/dashboard/financeiro/vendas/page.tsx

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Loader2, ShoppingCart } from 'lucide-react'
import api from '@/shared/lib/apiClient'
import { colors, typography, radius } from '@/shared/theme'
import { useDeviceMode } from '@/features/agenda/hooks/useDeviceMode'
import { SalesReportResponse, SalesReportFilters } from '@/features/sales-report/types'

import SummaryBar    from './components/SummaryBar'
import FiltersBar    from './components/FiltersBar'
import SaleRow       from './components/SaleRow'
import ExportButton  from './components/ExportButton'

export default function VendasPage() {
  const router   = useRouter()
  const mode     = useDeviceMode()
  const isMobile = mode === 'mobile'

  const [filters, setFilters] = useState<SalesReportFilters>({ page: 1 })
  const [data, setData]       = useState<SalesReportResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState<string | null>(null)

  const fetchReport = useCallback(async (f: SalesReportFilters) => {
    try {
      setError(null)
      setLoading(true)
      const params: Record<string, string | number> = {}
      if (f.dateFrom)       params.dateFrom = f.dateFrom
      if (f.dateTo)         params.dateTo = f.dateTo
      if (f.status)         params.status = f.status
      if (f.professionalId) params.professionalId = f.professionalId
      if (f.method)         params.method = f.method
      if (f.clientSearch)   params.clientSearch = f.clientSearch
      params.page = f.page ?? 1

      const res = await api.get('/sales/report', { params })
      setData(res.data?.data ?? null)
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: string } } }
      setError(e.response?.data?.error ?? 'Erro ao carregar vendas')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchReport(filters) }, [fetchReport, filters])

  function updateFilters(patch: Partial<SalesReportFilters>) {
    setFilters(prev => ({ ...prev, ...patch }))
  }

  const rows = data?.rows ?? []
  const pagination = data?.pagination

  return (
    <>
      <style>{`
        @keyframes fadeUp { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes pos-spin { to { transform: rotate(360deg); } }
        .pg-btn {
          padding: 7px 14px;
          border-radius: ${radius.sm}px;
          border: 1px solid ${colors.gray.borderMd};
          background: #fff;
          font-size: ${typography.scale.sm}px;
          font-weight: 600;
          cursor: pointer;
          color: ${colors.gray[700]};
        }
        .pg-btn:disabled { opacity: 0.35; cursor: not-allowed; }
      `}</style>

      <div style={{
        maxWidth: 900,
        padding: isMobile ? '0 12px' : 0,
        animation: 'fadeUp 0.3s ease',
        fontFamily: typography.fontFamily,
      }}>
        {/* Header */}
        <button
          onClick={() => router.push('/dashboard/financeiro')}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            background: 'transparent', border: 'none',
            color: typography.color.muted,
            fontSize: typography.scale.sm,
            cursor: 'pointer', padding: 0, marginBottom: 8,
            fontFamily: 'inherit',
          }}
        >
          <ArrowLeft size={13} />
          Financeiro
        </button>

        <div style={{
          display: 'flex',
          alignItems: isMobile ? 'flex-start' : 'center',
          justifyContent: 'space-between',
          gap: 12,
          flexDirection: isMobile ? 'column' : 'row',
          marginBottom: 18,
        }}>
          <div>
            <h1 style={{
              fontSize: isMobile ? 22 : 26,
              fontWeight: typography.weight.bold,
              color: typography.color.primary,
              margin: 0, letterSpacing: '-0.02em',
            }}>
              Vendas
            </h1>
            <p style={{
              fontSize: typography.scale.sm,
              color: typography.color.muted,
              marginTop: 2, marginBottom: 0,
            }}>
              Histórico completo de vendas e receita
            </p>
          </div>
          <ExportButton filters={filters} disabled={rows.length === 0} />
        </div>

        {/* Filtros */}
        <FiltersBar filters={filters} onChange={updateFilters} isMobile={isMobile} />

        {/* Resumo */}
        {data && <SummaryBar summary={data.summary} isMobile={isMobile} />}

        {/* Lista */}
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
            <Loader2 size={26} style={{ animation: 'pos-spin 0.8s linear infinite', color: colors.red.DEFAULT }} />
          </div>
        ) : error ? (
          <div style={{
            padding: '14px 16px',
            background: 'rgba(220,38,38,0.06)',
            border: `1px solid ${colors.red.border}`,
            borderRadius: radius.md,
            color: colors.red.DEFAULT,
            fontSize: typography.scale.sm,
            textAlign: 'center',
          }}>
            {error}
          </div>
        ) : rows.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: isMobile ? '40px 24px' : '56px 32px',
            background: '#fff',
            border: `1px solid ${colors.gray.border}`,
            borderRadius: radius.xl,
          }}>
            <ShoppingCart size={36} color={colors.gray.dimTextLight} strokeWidth={1.5} style={{ marginBottom: 12 }} />
            <div style={{
              fontSize: typography.scale.lg,
              fontWeight: typography.weight.semibold,
              color: typography.color.primary,
              marginBottom: 6,
            }}>
              Nenhuma venda encontrada
            </div>
            <div style={{ fontSize: typography.scale.base, color: typography.color.muted }}>
              Ajuste os filtros ou registre vendas no caixa
            </div>
          </div>
        ) : (
          <>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {rows.map(sale => (
                <SaleRow key={sale.id} sale={sale} isMobile={isMobile} />
              ))}
            </div>

            {/* Paginação */}
            {pagination && pagination.pages > 1 && (
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                marginTop: 16, gap: 8, flexWrap: 'wrap',
              }}>
                <span style={{ fontSize: typography.scale.sm, color: typography.color.muted }}>
                  {(pagination.page - 1) * pagination.limit + 1}–
                  {Math.min(pagination.page * pagination.limit, pagination.total)} de {pagination.total}
                </span>
                <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                  <button
                    className="pg-btn"
                    disabled={pagination.page <= 1}
                    onClick={() => updateFilters({ page: pagination.page - 1 })}
                  >
                    ← Anterior
                  </button>
                  <span style={{ padding: '7px 12px', fontSize: typography.scale.sm, color: typography.color.muted }}>
                    {pagination.page} / {pagination.pages}
                  </span>
                  <button
                    className="pg-btn"
                    disabled={pagination.page >= pagination.pages}
                    onClick={() => updateFilters({ page: pagination.page + 1 })}
                  >
                    Próxima →
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </>
  )
}
