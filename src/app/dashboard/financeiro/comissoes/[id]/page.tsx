'use client'
// src/app/dashboard/financeiro/comissoes/[id]/page.tsx

import { useState, useEffect, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import {
  ArrowLeft, Loader2, CheckCircle2, Clock, XCircle, Briefcase, Package,
  Receipt, User, Calendar,
} from 'lucide-react'
import api from '@/shared/lib/apiClient'
import { colors, typography, radius, shadows } from '@/shared/theme'
import { useDeviceMode } from '@/features/agenda/hooks/useDeviceMode'
import { PayoutDetail } from '@/features/payouts/types'
import {
  fmtBRL, fmtPayoutPeriod, fmtDateTimeBR, methodLabel, statusLabel,
} from '@/features/payouts/utils/format'
import MarkAsPaidModal from '../components/MarkAsPaidModal'

const STATUS_CFG = {
  PENDING:  { bg: 'rgba(220,38,38,0.06)',   color: colors.red.DEFAULT,    border: colors.red.border,        Icon: Clock        },
  PAID:     { bg: 'rgba(22,163,74,0.06)',   color: '#16a34a',             border: 'rgba(22,163,74,0.25)',   Icon: CheckCircle2 },
  CANCELED: { bg: 'rgba(0,0,0,0.04)',       color: colors.gray.dimText,   border: colors.gray.border,       Icon: XCircle      },
} as const

export default function PayoutDetailPage() {
  const router = useRouter()
  const params = useParams<{ id: string }>()
  const mode   = useDeviceMode()
  const isMobile = mode === 'mobile'

  const [payout, setPayout]   = useState<PayoutDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState<string | null>(null)
  const [showPayModal, setShowPayModal] = useState(false)
  const [cancelling, setCancelling]     = useState(false)

  const fetchPayout = useCallback(async () => {
    if (!params?.id) return
    try {
      setError(null)
      const res = await api.get(`/payouts/${params.id}`)
      const data = res.data?.data
      setPayout(data)
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: string } } }
      setError(e.response?.data?.error ?? 'Erro ao carregar pagamento')
    } finally {
      setLoading(false)
    }
  }, [params?.id])

  useEffect(() => { fetchPayout() }, [fetchPayout])

  async function cancel() {
    if (!payout) return
    if (!window.confirm('Cancelar este pagamento? As comissões voltarão para pendentes.')) return
    setCancelling(true)
    try {
      await api.post(`/payouts/${payout.id}/cancel`)
      router.push('/dashboard/financeiro/comissoes')
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: string } } }
      setError(e.response?.data?.error ?? 'Erro ao cancelar')
      setCancelling(false)
    }
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: 80 }}>
        <Loader2 size={28} style={{ animation: 'pos-spin 0.8s linear infinite', color: colors.red.DEFAULT }} />
        <style>{`@keyframes pos-spin { to { transform: rotate(360deg) } }`}</style>
      </div>
    )
  }

  if (error || !payout) {
    return (
      <div style={{
        maxWidth: 600,
        padding: isMobile ? 20 : 40,
        textAlign: 'center',
        fontFamily: typography.fontFamily,
      }}>
        <div style={{ fontSize: 40, marginBottom: 12 }}>😕</div>
        <div style={{
          fontSize: typography.scale.lg,
          fontWeight: typography.weight.semibold,
          color: typography.color.primary,
          marginBottom: 8,
        }}>
          {error ?? 'Pagamento não encontrado'}
        </div>
        <button
          onClick={() => router.push('/dashboard/financeiro/comissoes')}
          style={{
            padding: '10px 18px',
            borderRadius: radius.sm,
            background: colors.red.gradient,
            color: '#fff', border: 'none',
            cursor: 'pointer',
            fontFamily: 'inherit',
            fontSize: typography.scale.sm,
            fontWeight: typography.weight.semibold,
          }}
        >
          Voltar
        </button>
      </div>
    )
  }

  const cfg = STATUS_CFG[payout.status]
  const initials = payout.professional.name
    .split(' ').slice(0,2).map(w => w[0] ?? '').join('').toUpperCase() || '?'

  const serviceItems = payout.items.filter(i => i.type === 'SERVICE')
  const productItems = payout.items.filter(i => i.type === 'PRODUCT')

  return (
    <>
      {showPayModal && (
        <MarkAsPaidModal
          payout={payout}
          isMobile={isMobile}
          onClose={() => setShowPayModal(false)}
          onPaid={() => {
            setShowPayModal(false)
            fetchPayout()
          }}
        />
      )}

      <div style={{
        maxWidth: 900,
        padding: isMobile ? '0 12px' : 0,
        fontFamily: typography.fontFamily,
      }}>
        {/* Header com voltar */}
        <button
          onClick={() => router.push('/dashboard/financeiro/comissoes')}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            background: 'transparent',
            border: 'none',
            color: typography.color.muted,
            fontSize: typography.scale.sm,
            cursor: 'pointer',
            padding: 0,
            marginBottom: 12,
            fontFamily: 'inherit',
          }}
        >
          <ArrowLeft size={14} />
          Voltar
        </button>

        {/* Card hero */}
        <div style={{
          background: '#fff',
          border: `1px solid ${colors.gray.border}`,
          borderRadius: radius.xl,
          padding: isMobile ? 18 : 24,
          marginBottom: 16,
          boxShadow: shadows.sm,
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 14,
            marginBottom: 16,
          }}>
            <div style={{
              width: 50, height: 50, borderRadius: '50%',
              background: colors.red.gradient,
              color: '#fff',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 18,
              fontWeight: typography.weight.bold,
              flexShrink: 0,
            }}>
              {initials}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{
                fontSize: isMobile ? 18 : 22,
                fontWeight: typography.weight.bold,
                color: typography.color.primary,
                letterSpacing: '-0.01em',
              }}>
                {payout.professional.name}
              </div>
              <div style={{
                fontSize: typography.scale.sm,
                color: typography.color.muted,
                marginTop: 2,
                display: 'flex', alignItems: 'center', gap: 6,
              }}>
                <Calendar size={12} />
                {fmtPayoutPeriod(payout.periodStart, payout.periodEnd)}
              </div>
            </div>
            <div style={{
              padding: '5px 12px',
              borderRadius: radius.full,
              background: cfg.bg,
              border: `1px solid ${cfg.border}`,
              fontSize: 11,
              fontWeight: typography.weight.bold,
              color: cfg.color,
              letterSpacing: '.04em',
              textTransform: 'uppercase',
              display: 'flex', alignItems: 'center', gap: 5,
              flexShrink: 0,
            }}>
              <cfg.Icon size={12} strokeWidth={2.4} />
              {statusLabel(payout.status)}
            </div>
          </div>

          {/* Total grande */}
          <div style={{
            padding: '16px 18px',
            background: 'linear-gradient(135deg, #1e293b, #0f172a)',
            borderRadius: radius.md,
            color: '#fff',
          }}>
            <div style={{
              fontSize: 10,
              fontWeight: typography.weight.bold,
              color: 'rgba(255,255,255,0.65)',
              textTransform: 'uppercase',
              letterSpacing: '.08em',
              marginBottom: 4,
            }}>
              VALOR TOTAL
            </div>
            <div style={{
              color: '#fff',
              fontSize: 32,
              fontWeight: typography.weight.bold,
              fontVariantNumeric: 'tabular-nums',
              letterSpacing: '-0.02em',
              lineHeight: 1,
            }}>
              {fmtBRL(payout.totalAmount)}
            </div>
            <div style={{
              marginTop: 10,
              paddingTop: 10,
              borderTop: '1px solid rgba(255,255,255,0.15)',
              display: 'flex',
              gap: 18, flexWrap: 'wrap',
              fontSize: typography.scale.sm,
              color: 'rgba(255,255,255,0.7)',
            }}>
              {payout.serviceAmount > 0 && (
                <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Briefcase size={12} />
                  Serviços: <strong style={{ color: '#fff' }}>{fmtBRL(payout.serviceAmount)}</strong>
                </span>
              )}
              {payout.productAmount > 0 && (
                <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Package size={12} />
                  Produtos: <strong style={{ color: '#fff' }}>{fmtBRL(payout.productAmount)}</strong>
                </span>
              )}
              <span style={{ marginLeft: 'auto' }}>
                {payout.itemsCount} {payout.itemsCount === 1 ? 'item' : 'itens'}
              </span>
            </div>
          </div>

          {/* Info de pagamento (se PAID) */}
          {payout.status === 'PAID' && (
            <div style={{
              marginTop: 14,
              padding: '12px 14px',
              background: 'rgba(22,163,74,0.06)',
              border: '1px solid rgba(22,163,74,0.2)',
              borderRadius: radius.md,
            }}>
              <div style={{
                fontSize: 10,
                fontWeight: typography.weight.bold,
                color: '#15803d',
                textTransform: 'uppercase',
                letterSpacing: '.07em',
                marginBottom: 4,
              }}>
                PAGAMENTO REGISTRADO
              </div>
              <div style={{
                fontSize: typography.scale.base,
                fontWeight: typography.weight.semibold,
                color: '#15803d',
              }}>
                {fmtDateTimeBR(payout.paidAt)} · {methodLabel(payout.paidVia)}
              </div>
              {payout.paidNote && (
                <div style={{
                  fontSize: typography.scale.sm,
                  color: '#15803d',
                  marginTop: 4,
                  fontStyle: 'italic',
                }}>
                  &ldquo;{payout.paidNote}&rdquo;
                </div>
              )}
            </div>
          )}

          {/* Ações (só PENDING) */}
          {payout.status === 'PENDING' && (
            <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
              <button
                onClick={cancel}
                disabled={cancelling}
                style={{
                  padding: '12px 16px',
                  borderRadius: radius.sm,
                  border: `1px solid ${colors.gray.borderMd}`,
                  background: '#fff',
                  color: typography.color.primary,
                  fontSize: typography.scale.sm,
                  fontWeight: typography.weight.semibold,
                  cursor: cancelling ? 'not-allowed' : 'pointer',
                  fontFamily: 'inherit',
                  display: 'flex', alignItems: 'center', gap: 6,
                  WebkitTapHighlightColor: 'transparent',
                }}
              >
                {cancelling && <Loader2 size={13} style={{ animation: 'pos-spin 0.8s linear infinite' }} />}
                Cancelar
              </button>
              <button
                onClick={() => setShowPayModal(true)}
                style={{
                  flex: 1,
                  padding: '12px 16px',
                  borderRadius: radius.sm,
                  border: 'none',
                  background: 'linear-gradient(135deg, #16a34a, #15803d)',
                  color: '#fff',
                  fontSize: typography.scale.sm,
                  fontWeight: typography.weight.bold,
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                  boxShadow: '0 6px 18px rgba(22,163,74,0.32)',
                  WebkitTapHighlightColor: 'transparent',
                }}
              >
                <CheckCircle2 size={14} strokeWidth={2.4} />
                Marcar como pago
              </button>
            </div>
          )}

          <style>{`@keyframes pos-spin { to { transform: rotate(360deg) } }`}</style>
        </div>

        {/* Lista de itens */}
        {serviceItems.length > 0 && (
          <ItemsSection title="Serviços" items={serviceItems} Icon={Briefcase} />
        )}
        {productItems.length > 0 && (
          <ItemsSection title="Produtos" items={productItems} Icon={Package} />
        )}
      </div>
    </>
  )
}

function ItemsSection({
  title, items, Icon,
}: {
  title: string
  items: PayoutDetail['items']
  Icon:  React.ComponentType<{ size?: number; color?: string; strokeWidth?: number }>
}) {
  const total = items.reduce((s, i) => s + i.amount, 0)

  return (
    <div style={{ marginBottom: 16, fontFamily: typography.fontFamily }}>
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 4px',
        marginBottom: 8,
      }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 6,
          fontSize: typography.scale.xs,
          fontWeight: typography.weight.bold,
          color: typography.color.muted,
          textTransform: 'uppercase',
          letterSpacing: '.07em',
        }}>
          <Icon size={12} strokeWidth={2.4} />
          {title} ({items.length})
        </div>
        <div style={{
          fontSize: typography.scale.sm,
          fontWeight: typography.weight.bold,
          color: typography.color.primary,
          fontVariantNumeric: 'tabular-nums',
        }}>
          {fmtBRL(total)}
        </div>
      </div>

      <div style={{
        background: '#fff',
        border: `1px solid ${colors.gray.border}`,
        borderRadius: radius.lg,
        overflow: 'hidden',
      }}>
        {items.map((it, idx) => (
          <div key={it.id} style={{
            padding: '11px 14px',
            display: 'flex', alignItems: 'center', gap: 12,
            borderBottom: idx === items.length - 1 ? 'none' : `1px solid ${colors.gray.border}`,
          }}>
            <div style={{
              width: 28, height: 28, borderRadius: '50%',
              background: colors.background.page,
              border: `1px solid ${colors.gray.border}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}>
              <Receipt size={12} color={colors.gray.dimText} strokeWidth={2.2} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{
                fontSize: typography.scale.sm,
                fontWeight: typography.weight.semibold,
                color: typography.color.primary,
                whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
              }}>
                {it.saleItem.name}
              </div>
              <div style={{
                fontSize: 10,
                color: typography.color.muted,
                display: 'flex', alignItems: 'center', gap: 6,
                marginTop: 1,
              }}>
                {it.saleItem.sale.clientName && (
                  <>
                    <User size={9} />
                    <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {it.saleItem.sale.clientName}
                    </span>
                    <span style={{ color: colors.gray.dimTextLight }}>·</span>
                  </>
                )}
                {fmtDateTimeBR(it.earnedAt)}
              </div>
            </div>
            <div style={{
              fontSize: typography.scale.sm,
              fontWeight: typography.weight.bold,
              color: colors.red.DEFAULT,
              fontVariantNumeric: 'tabular-nums',
              flexShrink: 0,
            }}>
              {fmtBRL(it.amount)}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
