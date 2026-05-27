'use client'
// src/app/dashboard/financeiro/comissoes/components/PendingCommissionsTab.tsx

import { useState, useEffect, useCallback } from 'react'
import { Loader2, Sparkles, AlertCircle, Briefcase, Package, Calendar } from 'lucide-react'
import api from '@/shared/lib/apiClient'
import { colors, typography, radius, shadows } from '@/shared/theme'
import { PendingProfessional, PayoutListItem, PayoutSettings } from '@/features/payouts/types'
import { fmtBRL, daysSince } from '@/features/payouts/utils/format'
import PayoutCard from './PayoutCard'

interface Props {
  isMobile: boolean
  settings: PayoutSettings | null
  onOpenDetail: (payoutId: string) => void
  onPayPayout:  (payout: PayoutListItem) => void
  refreshSignal: number
}

export default function PendingCommissionsTab({
  isMobile, settings, onOpenDetail, onPayPayout, refreshSignal,
}: Props) {
  const [pendingSummary, setPendingSummary] = useState<PendingProfessional[]>([])
  const [pendingPayouts, setPendingPayouts] = useState<PayoutListItem[]>([])
  const [loading, setLoading]               = useState(true)
  const [generating, setGenerating]         = useState(false)
  const [error, setError]                   = useState<string | null>(null)
  const [generateMsg, setGenerateMsg]       = useState<string | null>(null)

  const fetchAll = useCallback(async () => {
    try {
      setError(null)
      const [summaryRes, payoutsRes] = await Promise.all([
        api.get('/payouts/commissions/pending-summary'),
        api.get('/payouts', { params: { status: 'PENDING', limit: 100 } }),
      ])
      const summaryData = summaryRes.data?.data ?? []
      const payoutsData = payoutsRes.data?.data ?? []
      setPendingSummary(Array.isArray(summaryData) ? summaryData : [])
      setPendingPayouts(Array.isArray(payoutsData) ? payoutsData : [])
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: string } } }
      setError(e.response?.data?.error ?? 'Erro ao carregar')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchAll()
  }, [fetchAll, refreshSignal])

  async function generate() {
    setGenerateMsg(null)
    setError(null)
    setGenerating(true)
    try {
      const res = await api.post('/payouts/generate')
      const data = res.data?.data
      if (data?.generated > 0) {
        setGenerateMsg(`${data.generated} pagamento(s) gerado(s) com sucesso!`)
      } else {
        setGenerateMsg('Nenhum pagamento foi gerado (aguarde o próximo período agendado).')
      }
      await fetchAll()
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: string } } }
      setError(e.response?.data?.error ?? 'Erro ao gerar pagamentos')
    } finally {
      setGenerating(false)
    }
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
        <Loader2 size={28} style={{ animation: 'pos-spin 0.8s linear infinite', color: colors.red.DEFAULT }} />
        <style>{`@keyframes pos-spin { to { transform: rotate(360deg) } }`}</style>
      </div>
    )
  }

  const totalPendingFromSummary = pendingSummary.reduce((s, p) => s + p.total, 0)
  const hasAnything = pendingSummary.length > 0 || pendingPayouts.length > 0

  if (!hasAnything) {
    return (
      <div style={{
        textAlign: 'center',
        padding: isMobile ? '48px 24px' : '64px 32px',
        background: '#fff',
        border: `1px solid ${colors.gray.border}`,
        borderRadius: radius.xl,
        fontFamily: typography.fontFamily,
      }}>
        <div style={{ fontSize: 44, marginBottom: 12 }}>🎉</div>
        <div style={{
          fontSize: typography.scale.lg,
          fontWeight: typography.weight.semibold,
          color: typography.color.primary,
          marginBottom: 6,
        }}>
          Nenhuma comissão pendente
        </div>
        <div style={{
          fontSize: typography.scale.base,
          color: typography.color.muted,
        }}>
          Todas as comissões da equipe já foram pagas. 👏
        </div>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18, fontFamily: typography.fontFamily }}>
      {/* Resumo agregado de pendentes (sem payout ainda) */}
      {pendingSummary.length > 0 && (
        <div style={{
          background: 'linear-gradient(135deg, #fefce8, #fef3c7)',
          border: '1px solid rgba(217, 119, 6, 0.25)',
          borderRadius: radius.lg,
          padding: '14px 16px',
        }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            marginBottom: 10,
          }}>
            <AlertCircle size={15} color="#b45309" strokeWidth={2.2} />
            <div style={{
              fontSize: typography.scale.sm,
              fontWeight: typography.weight.bold,
              color: '#92400e',
              textTransform: 'uppercase',
              letterSpacing: '.05em',
            }}>
              Comissões a serem agrupadas
            </div>
          </div>

          <div style={{
            fontSize: 24,
            fontWeight: typography.weight.bold,
            color: '#92400e',
            fontVariantNumeric: 'tabular-nums',
            letterSpacing: '-0.02em',
            lineHeight: 1,
            marginBottom: 4,
          }}>
            {fmtBRL(totalPendingFromSummary)}
          </div>
          <div style={{
            fontSize: typography.scale.sm,
            color: '#92400e',
            opacity: 0.85,
            marginBottom: 14,
          }}>
            De {pendingSummary.length} profissional{pendingSummary.length !== 1 ? 'is' : ''} ·{' '}
            {pendingSummary.reduce((s, p) => s + p.itemsCount, 0)} itens
          </div>

          {/* Mini lista de profs */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 12 }}>
            {pendingSummary.slice(0, 5).map(p => (
              <div key={p.professional.id} style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '8px 10px',
                background: 'rgba(255,255,255,0.6)',
                borderRadius: radius.sm,
              }}>
                <div style={{
                  width: 26, height: 26, borderRadius: '50%',
                  background: colors.red.gradient,
                  color: '#fff',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 10,
                  fontWeight: typography.weight.bold,
                  flexShrink: 0,
                }}>
                  {p.professional.name.split(' ').slice(0,2).map(w => w[0] ?? '').join('').toUpperCase() || '?'}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontSize: typography.scale.sm,
                    fontWeight: typography.weight.semibold,
                    color: typography.color.primary,
                    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                  }}>
                    {p.professional.name}
                  </div>
                  <div style={{
                    fontSize: 10,
                    color: typography.color.muted,
                    display: 'flex', gap: 8,
                  }}>
                    {p.serviceTotal > 0 && (
                      <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                        <Briefcase size={9} /> {fmtBRL(p.serviceTotal)}
                      </span>
                    )}
                    {p.productTotal > 0 && (
                      <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                        <Package size={9} /> {fmtBRL(p.productTotal)}
                      </span>
                    )}
                    {p.oldestEarnedAt && (
                      <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                        <Calendar size={9} /> {daysSince(p.oldestEarnedAt)}d
                      </span>
                    )}
                  </div>
                </div>
                <div style={{
                  fontSize: typography.scale.sm,
                  fontWeight: typography.weight.bold,
                  color: '#92400e',
                  fontVariantNumeric: 'tabular-nums',
                  flexShrink: 0,
                }}>
                  {fmtBRL(p.total)}
                </div>
              </div>
            ))}
            {pendingSummary.length > 5 && (
              <div style={{
                fontSize: typography.scale.xs,
                color: '#92400e',
                opacity: 0.7,
                textAlign: 'center',
                paddingTop: 4,
              }}>
                + {pendingSummary.length - 5} profissional(is)
              </div>
            )}
          </div>

          {/* CTA */}
          {settings?.enabled ? (
            <button
              onClick={generate}
              disabled={generating}
              style={{
                width: '100%',
                padding: '11px',
                borderRadius: radius.sm,
                border: 'none',
                background: generating ? colors.gray.dimTextLight : 'linear-gradient(135deg, #b45309, #92400e)',
                color: '#fff',
                fontSize: typography.scale.sm,
                fontWeight: typography.weight.bold,
                cursor: generating ? 'not-allowed' : 'pointer',
                fontFamily: 'inherit',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                boxShadow: shadows.sm,
                WebkitTapHighlightColor: 'transparent',
              }}
            >
              {generating
                ? <Loader2 size={13} style={{ animation: 'pos-spin 0.8s linear infinite' }} />
                : <Sparkles size={13} strokeWidth={2.4} />
              }
              {generating ? 'Gerando…' : 'Gerar pagamentos agora'}
            </button>
          ) : (
            <div style={{
              padding: '10px 12px',
              background: 'rgba(255,255,255,0.6)',
              border: '1px solid rgba(217, 119, 6, 0.25)',
              borderRadius: radius.sm,
              fontSize: typography.scale.sm,
              color: '#92400e',
              textAlign: 'center',
            }}>
              ⚠️ Ative o sistema na configuração para gerar pagamentos
            </div>
          )}

          {generateMsg && (
            <div style={{
              marginTop: 10,
              padding: '8px 12px',
              background: 'rgba(255,255,255,0.7)',
              borderRadius: radius.sm,
              fontSize: typography.scale.sm,
              color: '#92400e',
              textAlign: 'center',
            }}>
              {generateMsg}
            </div>
          )}

          <style>{`@keyframes pos-spin { to { transform: rotate(360deg) } }`}</style>
        </div>
      )}

      {/* Payouts PENDING já gerados */}
      {pendingPayouts.length > 0 && (
        <div>
          <div style={{
            fontSize: typography.scale.xs,
            fontWeight: typography.weight.bold,
            color: typography.color.muted,
            textTransform: 'uppercase',
            letterSpacing: '.07em',
            marginBottom: 10,
          }}>
            Pagamentos pendentes ({pendingPayouts.length})
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {pendingPayouts.map(p => (
              <PayoutCard
                key={p.id}
                payout={p}
                onClick={() => onOpenDetail(p.id)}
                onPay={() => onPayPayout(p)}
              />
            ))}
          </div>
        </div>
      )}

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
