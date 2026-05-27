'use client'
// src/app/dashboard/caixa/components/ConfirmedSalesList.tsx

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Receipt, ChevronRight, CheckCircle, FileX } from 'lucide-react'

import api from '@/shared/lib/apiClient'
import { colors, typography, transitions } from '@/shared/theme'
import { Sale } from '@/features/sales/types'
import { formatBRL, formatTimeOnly, shortId } from '@/features/sales/utils/format'
import Avatar from './Avatar'

interface Props {
  refreshKey: number     // incrementa pra forçar refetch
}

export default function ConfirmedSalesList({ refreshKey }: Props) {
  const router = useRouter()
  const [sales,   setSales]   = useState<Sale[]>([])
  const [loading, setLoading] = useState(true)

  const fetchSales = useCallback(async (signal?: AbortSignal) => {
    try {
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const res = await api.get('/sales', {
        signal,
        params: {
          status:   'CONFIRMED',
          dateFrom: today.toISOString(),
          limit:    100,
        },
      })
      if (signal?.aborted) return
      const data = res.data?.data ?? res.data
      setSales(Array.isArray(data) ? data : [])
    } catch {
      if (!signal?.aborted) setSales([])
    } finally {
      if (!signal?.aborted) setLoading(false)
    }
  }, [])

  useEffect(() => {
    const ctrl = new AbortController()
    fetchSales(ctrl.signal)
    return () => ctrl.abort()
  }, [fetchSales, refreshKey])

  if (loading) {
    return (
      <div style={{
        display: 'flex', justifyContent: 'center',
        padding: 60,
      }}>
        <div style={{
          width: 26, height: 26, borderRadius: '50%',
          border: '3px solid rgba(220,38,38,0.15)',
          borderTopColor: colors.red.DEFAULT,
          animation: 'pos-spin 0.8s linear infinite',
        }} />
        <style>{`@keyframes pos-spin { to { transform: rotate(360deg) } }`}</style>
      </div>
    )
  }

  if (sales.length === 0) {
    return (
      <div style={{
        background: '#fff',
        borderRadius: 14,
        border: `1px solid ${colors.gray.border}`,
        padding: '48px 24px',
        textAlign: 'center',
        fontFamily: typography.fontFamily,
      }}>
        <Receipt size={36} color={colors.gray.dimText} style={{ opacity: 0.3, marginBottom: 12 }} />
        <div style={{ fontSize: 15, fontWeight: 700, color: colors.gray[900], marginBottom: 4 }}>
          Nenhuma venda confirmada hoje
        </div>
        <div style={{ fontSize: 12, color: colors.gray.dimText }}>
          Vendas que você fechar hoje aparecerão aqui.
        </div>
      </div>
    )
  }

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', gap: 8,
      fontFamily: typography.fontFamily,
    }}>
      {sales.map(sale => {
        const hasCreditNote = sale.creditNotes.length > 0
        const totalCredit   = sale.creditNotes.reduce((s, n) => s + n.amount, 0)
        const isFullyAnnulled = totalCredit >= sale.total - 0.01

        return (
          <button
            key={sale.id}
            onClick={() => router.push(`/dashboard/caixa/${sale.id}`)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: '12px 14px',
              background: '#fff',
              border: `1px solid ${colors.gray.border}`,
              borderRadius: 12,
              cursor: 'pointer',
              textAlign: 'left',
              fontFamily: 'inherit',
              transition: `all ${transitions.fast}`,
              opacity: isFullyAnnulled ? 0.6 : 1,
              WebkitTapHighlightColor: 'transparent',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.borderColor = colors.red.border
              e.currentTarget.style.boxShadow = '0 4px 14px rgba(0,0,0,0.06)'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.borderColor = colors.gray.border
              e.currentTarget.style.boxShadow = 'none'
            }}
          >
            <Avatar name={sale.clientName || '—'} size={36} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 6,
                marginBottom: 2,
              }}>
                <span style={{
                  fontSize: 13, fontWeight: 700,
                  color: colors.gray[900],
                  whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                  maxWidth: 200,
                }}>
                  {sale.clientName || 'Venda balcão'}
                </span>
                <span style={{
                  fontSize: 9, fontWeight: 700,
                  color: colors.gray.dimText,
                  fontVariantNumeric: 'tabular-nums',
                  padding: '1px 5px',
                  background: colors.background.page,
                  borderRadius: 4,
                }}>#{shortId(sale.id)}</span>
              </div>
              <div style={{
                fontSize: 11,
                color: colors.gray.dimText,
                display: 'flex', alignItems: 'center', gap: 5, flexWrap: 'wrap',
              }}>
                <span>
                  {sale.confirmedAt && formatTimeOnly(sale.confirmedAt)}
                </span>
                <span>·</span>
                <span>{sale.items.length} item{sale.items.length !== 1 ? 's' : ''}</span>
                {sale.payments.length > 1 && (
                  <>
                    <span>·</span>
                    <span>{sale.payments.length} pagamentos</span>
                  </>
                )}
                {hasCreditNote && (
                  <span style={{
                    display: 'inline-flex', alignItems: 'center', gap: 3,
                    color: '#b45309',
                    fontWeight: 600,
                  }}>
                    <FileX size={10} />
                    NC {formatBRL(totalCredit)}
                  </span>
                )}
              </div>
            </div>
            <div style={{
              textAlign: 'right',
              flexShrink: 0,
            }}>
              <div style={{
                fontSize: 14,
                fontWeight: 700,
                color: colors.gray[900],
                fontVariantNumeric: 'tabular-nums',
                textDecoration: isFullyAnnulled ? 'line-through' : 'none',
              }}>
                {formatBRL(sale.total)}
              </div>
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: 3,
                padding: '1px 6px', marginTop: 3,
                borderRadius: 4,
                background: isFullyAnnulled
                  ? 'rgba(245,158,11,0.10)'
                  : 'rgba(22,163,74,0.08)',
                border: `1px solid ${isFullyAnnulled
                  ? 'rgba(245,158,11,0.25)'
                  : 'rgba(22,163,74,0.20)'}`,
              }}>
                {isFullyAnnulled ? (
                  <span style={{ fontSize: 9, fontWeight: 700, color: '#b45309' }}>
                    ANULADA
                  </span>
                ) : (
                  <>
                    <CheckCircle size={9} color="#15803d" strokeWidth={2.5} />
                    <span style={{ fontSize: 9, fontWeight: 700, color: '#15803d' }}>
                      CONFIRMADA
                    </span>
                  </>
                )}
              </div>
            </div>
            <ChevronRight size={14} color={colors.gray.dimText} />
          </button>
        )
      })}
    </div>
  )
}
