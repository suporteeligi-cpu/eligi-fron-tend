'use client'
// src/app/dashboard/financeiro/comissoes/components/PayoutsHistoryTab.tsx

import { useState, useEffect, useCallback, useRef } from 'react'
import { Loader2, Archive } from 'lucide-react'
import api from '@/shared/lib/apiClient'
import { colors, typography, radius } from '@/shared/theme'
import { PayoutListItem } from '@/features/payouts/types'
import { fmtBRL } from '@/features/payouts/utils/format'
import PayoutCard from './PayoutCard'

// @eligi:comm-filtro-historico — profissional e periodo filtram no servidor.
// O periodo usa a data de pagamento do periodo (Payout.scheduledFor), que e o
// campo que GET /payouts filtra com dateFrom/dateTo.
const HISTORY_LIMIT = 200 // teto da API (listPayouts limita em 200)

interface Props {
  isMobile: boolean
  onOpenDetail: (payoutId: string) => void
  refreshSignal: number
  professionalId: string | null
  dateFrom: string
  dateTo: string
  periodText: string
}

export default function PayoutsHistoryTab({ isMobile, onOpenDetail, refreshSignal, professionalId, dateFrom, dateTo, periodText }: Props) {
  const [payouts, setPayouts] = useState<PayoutListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState<string | null>(null)
  const reqRef = useRef(0)

  const fetchAll = useCallback(async () => {
    // Trocar o filtro rapido nao pode deixar uma resposta antiga pintar a lista.
    const token = ++reqRef.current
    try {
      const res = await api.get('/payouts', {
        params: { status: 'PAID', limit: HISTORY_LIMIT, dateFrom, dateTo, ...(professionalId ? { professionalId } : {}) },
      })
      if (token !== reqRef.current) return
      const data = res.data?.data ?? []
      setPayouts(Array.isArray(data) ? data : [])
      setError(null)
    } catch (err: unknown) {
      if (token !== reqRef.current) return
      const e = err as { response?: { data?: { error?: string } } }
      setError(e.response?.data?.error ?? 'Erro ao carregar histórico')
    } finally {
      if (token === reqRef.current) setLoading(false)
    }
  }, [professionalId, dateFrom, dateTo])

  useEffect(() => {
    void fetchAll()
  }, [fetchAll, refreshSignal])

  const filtered = professionalId !== null

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
          {filtered ? 'Nenhum pagamento desse profissional' : 'Nenhum pagamento'} em {periodText}
        </div>
        <div style={{
          fontSize: typography.scale.base,
          color: typography.color.muted,
        }}>
          Troque o período ou o profissional para ver outros pagamentos.
        </div>
        {error && (
          <div style={{ marginTop: 12, fontSize: typography.scale.sm, color: colors.red.DEFAULT }}>{error}</div>
        )}
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
            {payouts.length} pagamento{payouts.length !== 1 ? 's' : ''} · {periodText}
          </div>
        </div>
      </div>

      {payouts.length >= HISTORY_LIMIT && (
        <div style={{
          padding: '10px 12px', borderRadius: radius.sm, fontSize: typography.scale.sm,
          color: '#b45309', background: '#fffbeb', border: '1px solid rgba(180,83,9,0.25)',
        }}>
          Mostrando os {HISTORY_LIMIT} pagamentos mais recentes. Escolha um mês ou um profissional para ver o resto.
        </div>
      )}

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
