'use client'
// src/app/dashboard/financeiro/comissoes/components/PayoutsHistoryTab.tsx

import { useState, useEffect, useCallback } from 'react'
import { Loader2, Archive } from 'lucide-react'
import api from '@/shared/lib/apiClient'
import { colors, typography, radius } from '@/shared/theme'
import { PayoutListItem } from '@/features/payouts/types'
import { fmtBRL } from '@/features/payouts/utils/format'
import PayoutCard from './PayoutCard'

interface Props {
  isMobile: boolean
  onOpenDetail: (payoutId: string) => void
  refreshSignal: number
}

export default function PayoutsHistoryTab({ isMobile, onOpenDetail, refreshSignal }: Props) {
  const [payouts, setPayouts] = useState<PayoutListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState<string | null>(null)

  const fetchAll = useCallback(async () => {
    try {
      setError(null)
      const res = await api.get('/payouts', { params: { status: 'PAID', limit: 100 } })
      const data = res.data?.data ?? []
      setPayouts(Array.isArray(data) ? data : [])
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: string } } }
      setError(e.response?.data?.error ?? 'Erro ao carregar histórico')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchAll()
  }, [fetchAll, refreshSignal])

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
        <Loader2 size={28} style={{ animation: 'pos-spin 0.8s linear infinite', color: colors.red.DEFAULT }} />
        <style>{`@keyframes pos-spin { to { transform: rotate(360deg) } }`}</style>
      </div>
    )
  }

  if (payouts.length === 0) {
    return (
      <div style={{
        textAlign: 'center',
        padding: isMobile ? '48px 24px' : '64px 32px',
        background: '#fff',
        border: `1px solid ${colors.gray.border}`,
        borderRadius: radius.xl,
        fontFamily: typography.fontFamily,
      }}>
        <Archive size={40} color={colors.gray.dimTextLight} strokeWidth={1.5} style={{ marginBottom: 12 }} />
        <div style={{
          fontSize: typography.scale.lg,
          fontWeight: typography.weight.semibold,
          color: typography.color.primary,
          marginBottom: 6,
        }}>
          Histórico vazio
        </div>
        <div style={{
          fontSize: typography.scale.base,
          color: typography.color.muted,
        }}>
          Pagamentos confirmados aparecerão aqui
        </div>
      </div>
    )
  }

  const totalPaid = payouts.reduce((s, p) => s + p.totalAmount, 0)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, fontFamily: typography.fontFamily }}>
      <div style={{
        padding: '12px 14px',
        background: 'rgba(22,163,74,0.06)',
        border: '1px solid rgba(22,163,74,0.2)',
        borderRadius: radius.md,
        display: 'flex', alignItems: 'center', gap: 12,
      }}>
        <div style={{
          width: 36, height: 36, borderRadius: '50%',
          background: 'linear-gradient(135deg, #16a34a, #15803d)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
        }}>
          <Archive size={16} color="#fff" strokeWidth={2.2} />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{
            fontSize: 10,
            fontWeight: typography.weight.bold,
            color: '#15803d',
            textTransform: 'uppercase',
            letterSpacing: '.07em',
          }}>
            TOTAL PAGO
          </div>
          <div style={{
            fontSize: 18,
            fontWeight: typography.weight.bold,
            color: '#15803d',
            fontVariantNumeric: 'tabular-nums',
            letterSpacing: '-0.01em',
            lineHeight: 1.1,
          }}>
            {fmtBRL(totalPaid)}
          </div>
          <div style={{
            fontSize: typography.scale.xs,
            color: '#15803d',
            opacity: 0.7,
          }}>
            {payouts.length} pagamento{payouts.length !== 1 ? 's' : ''}
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {payouts.map(p => (
          <PayoutCard
            key={p.id}
            payout={p}
            onClick={() => onOpenDetail(p.id)}
          />
        ))}
      </div>

      {error && (
        <div style={{
          padding: '10px 12px',
          background: 'rgba(220,38,38,0.08)',
          border: `1px solid ${colors.red.border}`,
          borderRadius: radius.sm,
          fontSize: typography.scale.sm,
          color: colors.red.DEFAULT,
        }}>
          {error}
        </div>
      )}
    </div>
  )
}
