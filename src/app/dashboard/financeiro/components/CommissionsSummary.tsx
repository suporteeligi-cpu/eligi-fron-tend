'use client'
// src/app/dashboard/financeiro/components/CommissionsSummary.tsx

import { useState, useEffect } from 'react'
import { Loader2 } from 'lucide-react'
import api from '@/shared/lib/apiClient'
import { colors, typography, radius } from '@/shared/theme'
import { fmtBRL } from '@/features/payouts/utils/format'

interface Summary {
  pendingTotal:  number
  pendingProfs:  number
  paidThisMonth: number
  paidCount:     number
}

export default function CommissionsSummary() {
  const [data, setData]       = useState<Summary | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    async function fetchSummary() {
      try {
        // Início e fim do mês atual em ISO
        const now = new Date()
        const start = new Date(now.getFullYear(), now.getMonth(), 1)
        const end   = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)

        const [pendingRes, paidRes] = await Promise.all([
          api.get('/payouts/commissions/pending-summary'),
          api.get('/payouts', {
            params: {
              status:   'PAID',
              dateFrom: start.toISOString(),
              dateTo:   end.toISOString(),
              limit:    100,
            },
          }),
        ])

        if (cancelled) return

        const pendingData = pendingRes.data?.data ?? []
        const paidData    = paidRes.data?.data ?? []

        const pendingTotal = Array.isArray(pendingData)
          ? pendingData.reduce((s: number, p: { total: number }) => s + p.total, 0)
          : 0
        const paidThisMonth = Array.isArray(paidData)
          ? paidData.reduce((s: number, p: { totalAmount: number }) => s + p.totalAmount, 0)
          : 0

        setData({
          pendingTotal,
          pendingProfs:  Array.isArray(pendingData) ? pendingData.length : 0,
          paidThisMonth,
          paidCount:     Array.isArray(paidData) ? paidData.length : 0,
        })
      } catch {
        if (!cancelled) setData(null)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    fetchSummary()
    return () => { cancelled = true }
  }, [])

  if (loading) {
    return (
      <div style={{
        width: '100%',
        padding: '12px',
        background: colors.background.page,
        borderRadius: radius.sm,
        display: 'flex', justifyContent: 'center', alignItems: 'center',
        height: 56,
      }}>
        <Loader2 size={14} style={{ animation: 'spin 0.8s linear infinite', color: colors.gray.dimText }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      </div>
    )
  }

  if (!data) return null

  return (
    <div style={{
      width: '100%',
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: 6,
    }}>
      {/* Pendentes */}
      <div style={{
        padding: '10px 12px',
        background: data.pendingTotal > 0 ? 'rgba(217, 119, 6, 0.08)' : colors.background.page,
        border: `1px solid ${data.pendingTotal > 0 ? 'rgba(217, 119, 6, 0.2)' : colors.gray.border}`,
        borderRadius: radius.sm,
      }}>
        <div style={{
          fontSize: 9,
          fontWeight: typography.weight.bold,
          color: data.pendingTotal > 0 ? '#92400e' : typography.color.muted,
          textTransform: 'uppercase',
          letterSpacing: '.07em',
          marginBottom: 2,
        }}>
          A PAGAR
        </div>
        <div style={{
          fontSize: 15,
          fontWeight: typography.weight.bold,
          color: data.pendingTotal > 0 ? '#92400e' : typography.color.primary,
          fontVariantNumeric: 'tabular-nums',
          letterSpacing: '-0.01em',
          lineHeight: 1.1,
        }}>
          {fmtBRL(data.pendingTotal)}
        </div>
        <div style={{
          fontSize: 10,
          color: data.pendingTotal > 0 ? '#92400e' : typography.color.muted,
          opacity: 0.85,
          marginTop: 1,
        }}>
          {data.pendingProfs} prof{data.pendingProfs !== 1 ? 's' : ''}
        </div>
      </div>

      {/* Pagos no mês */}
      <div style={{
        padding: '10px 12px',
        background: data.paidThisMonth > 0 ? 'rgba(22,163,74,0.06)' : colors.background.page,
        border: `1px solid ${data.paidThisMonth > 0 ? 'rgba(22,163,74,0.2)' : colors.gray.border}`,
        borderRadius: radius.sm,
      }}>
        <div style={{
          fontSize: 9,
          fontWeight: typography.weight.bold,
          color: data.paidThisMonth > 0 ? '#15803d' : typography.color.muted,
          textTransform: 'uppercase',
          letterSpacing: '.07em',
          marginBottom: 2,
        }}>
          PAGO ESTE MÊS
        </div>
        <div style={{
          fontSize: 15,
          fontWeight: typography.weight.bold,
          color: data.paidThisMonth > 0 ? '#15803d' : typography.color.primary,
          fontVariantNumeric: 'tabular-nums',
          letterSpacing: '-0.01em',
          lineHeight: 1.1,
        }}>
          {fmtBRL(data.paidThisMonth)}
        </div>
        <div style={{
          fontSize: 10,
          color: data.paidThisMonth > 0 ? '#15803d' : typography.color.muted,
          opacity: 0.85,
          marginTop: 1,
        }}>
          {data.paidCount} pagamento{data.paidCount !== 1 ? 's' : ''}
        </div>
      </div>
    </div>
  )
}
