'use client'
// src/app/dashboard/caixa/[id]/page.tsx

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import {
  ArrowLeft, Loader2, Package, Scissors, Users, FileX,
  CheckCircle, Calendar, Phone, Play
} from 'lucide-react'

import api from '@/shared/lib/apiClient'
import { colors, typography } from '@/shared/theme'
import { useIsMobile } from '@/hooks/useIsMobile'
import { Sale } from '@/features/sales/types'
import {
  formatBRL, formatDateTime, shortId,
  PAYMENT_METHOD_LABEL, PAYMENT_METHOD_ICON,
} from '@/features/sales/utils/format'

import CreditNoteModal from '../components/CreditNoteModal'
import Avatar          from '../components/Avatar'

export default function SaleDetailPage() {
  const router = useRouter()
  const params = useParams()
  const saleId = typeof params?.id === 'string' ? params.id : ''
  const isMobile = useIsMobile(768)

  const [sale,    setSale]    = useState<Sale | null>(null)
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState<string | null>(null)
  const [showNC,  setShowNC]  = useState(false)

  useEffect(() => {
    if (!saleId) return
    let cancelled = false
    api.get(`/sales/${saleId}`)
      .then(res => {
        if (cancelled) return
        const data = res.data?.data ?? res.data

        // GUARDA: Se Sale é OPEN, esta tela não é o lugar — redireciona pro POS principal
        if (data?.status === 'OPEN') {
          router.replace(`/dashboard/caixa?active=${saleId}`)
          return
        }

        setSale(data)
      })
      .catch(() => {
        if (!cancelled) setError('Venda não encontrada')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => { cancelled = true }
  }, [saleId, router])

  async function refetch() {
    try {
      const res = await api.get(`/sales/${saleId}`)
      const data = res.data?.data ?? res.data
      setSale(data)
    } catch { /* silencioso */ }
  }

  if (loading) {
    return (
      <div style={{
        display: 'flex', justifyContent: 'center', padding: 60,
      }}>
        <Loader2 size={26} color={colors.red.DEFAULT}
          style={{ animation: 'pos-spin 0.8s linear infinite' }} />
        <style>{`@keyframes pos-spin { to { transform: rotate(360deg) } }`}</style>
      </div>
    )
  }

  if (error || !sale) {
    return (
      <div style={{
        padding: '40px 24px',
        textAlign: 'center',
        fontFamily: typography.fontFamily,
      }}>
        <div style={{ fontSize: 14, color: colors.gray.dimText }}>
          {error ?? 'Venda não encontrada'}
        </div>
      </div>
    )
  }

  const totalCredit   = sale.creditNotes.reduce((s, n) => s + n.amount, 0)
  const isFullyAnnulled = sale.creditNotes.length > 0 && totalCredit >= sale.total - 0.01
  const hasCreditNote = sale.creditNotes.length > 0
  const isConfirmed = sale.status === 'CONFIRMED'

  return (
    <>
      {showNC && (
        <CreditNoteModal
          sale={sale}
          isMobile={isMobile}
          onClose={() => setShowNC(false)}
          onIssued={() => {
            setShowNC(false)
            refetch()
          }}
        />
      )}

      <div style={{
        padding: isMobile ? '0 12px' : 0,
        fontFamily: typography.fontFamily,
      }}>
        {/* Header com botão voltar */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 12,
          marginBottom: 18,
        }}>
          <button
            onClick={() => router.push('/dashboard/caixa')}
            aria-label="Voltar"
            style={{
              width: 36, height: 36, borderRadius: 9,
              border: `1px solid ${colors.gray.borderMd}`,
              background: '#fff',
              cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <ArrowLeft size={14} strokeWidth={2} />
          </button>
          <div>
            <h2 style={{
              fontSize: isMobile ? 18 : 22,
              fontWeight: 700,
              letterSpacing: '-0.025em',
              color: typography.color.primary,
              margin: 0,
              lineHeight: 1.2,
            }}>
              Venda #{shortId(sale.id)}
            </h2>
            <p style={{ fontSize: 12, color: typography.color.muted, margin: '2px 0 0' }}>
              {sale.confirmedAt && formatDateTime(sale.confirmedAt)}
            </p>
          </div>
          <div style={{ marginLeft: 'auto' }}>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 4,
              padding: '4px 10px',
              borderRadius: 6,
              background: isFullyAnnulled
                ? 'rgba(245,158,11,0.10)'
                : 'rgba(22,163,74,0.10)',
              border: `1px solid ${isFullyAnnulled
                ? 'rgba(245,158,11,0.25)'
                : 'rgba(22,163,74,0.20)'}`,
            }}>
              {isFullyAnnulled ? (
                <span style={{ fontSize: 10, fontWeight: 700, color: '#b45309' }}>ANULADA</span>
              ) : (
                <>
                  <CheckCircle size={10} color="#15803d" strokeWidth={2.5} />
                  <span style={{ fontSize: 10, fontWeight: 700, color: '#15803d' }}>
                    CONFIRMADA
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Cliente */}
        {(sale.clientName || sale.clientPhone) && (
          <div style={{
            background: '#fff',
            border: `1px solid ${colors.gray.border}`,
            borderRadius: 12,
            padding: '14px 16px',
            marginBottom: 14,
            display: 'flex', alignItems: 'center', gap: 12,
          }}>
            <Avatar name={sale.clientName || '—'} size={40} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{
                fontSize: 14, fontWeight: 700,
                color: colors.gray[900],
              }}>{sale.clientName}</div>
              {sale.clientPhone && (
                <div style={{
                  fontSize: 12, color: colors.gray.dimText, marginTop: 2,
                  display: 'flex', alignItems: 'center', gap: 4,
                }}>
                  <Phone size={11} />{sale.clientPhone}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Itens */}
        <div style={{
          background: '#fff',
          border: `1px solid ${colors.gray.border}`,
          borderRadius: 12,
          marginBottom: 14,
          overflow: 'hidden',
        }}>
          <div style={{
            padding: '10px 14px',
            fontSize: 10, fontWeight: 700,
            color: colors.gray.dimText,
            textTransform: 'uppercase',
            letterSpacing: '.07em',
            background: colors.background.page,
            borderBottom: `1px solid ${colors.gray.border}`,
          }}>
            Itens ({sale.items.length})
          </div>
          {sale.items.map((item, i) => {
            const Icon = item.type === 'PRODUCT' ? Package : Play
            const color = item.product?.color ?? item.service?.color ?? colors.red.DEFAULT
            return (
              <div key={item.id} style={{
                display: 'flex', alignItems: 'flex-start', gap: 10,
                padding: '12px 14px',
                borderBottom: i < sale.items.length - 1 ? `1px solid ${colors.gray.border}` : 'none',
              }}>
                <div style={{
                  width: 32, height: 32, borderRadius: 8,
                  background: item.product?.imageUrl ? '#fff' : color,
                  overflow: 'hidden',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0,
                }}>
                  {item.product?.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={item.product.imageUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <Icon size={14} color="#fff" strokeWidth={2} />
                  )}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontSize: 13, fontWeight: 700,
                    color: colors.gray[900],
                  }}>
                    {item.name}
                  </div>
                  <div style={{
                    fontSize: 11, color: colors.gray.dimText, marginTop: 2,
                    display: 'flex', flexWrap: 'wrap', gap: 5,
                  }}>
                    <span>{formatBRL(item.unitPrice)} × {item.quantity}</span>
                    {item.professional && (
                      <>
                        <span>·</span>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                          <Users size={9} />{item.professional.name}
                        </span>
                      </>
                    )}
                    {item.commissionAmount != null && item.commissionAmount > 0 && (
                      <>
                        <span>·</span>
                        <span style={{
                          color: '#b45309', fontWeight: 600,
                        }}>
                          comissão {formatBRL(item.commissionAmount)}
                        </span>
                      </>
                    )}
                  </div>
                </div>
                <div style={{
                  fontSize: 14, fontWeight: 700,
                  color: colors.gray[900],
                  fontVariantNumeric: 'tabular-nums',
                  flexShrink: 0,
                }}>
                  {formatBRL(item.total)}
                </div>
              </div>
            )
          })}

          {/* Totais */}
          <div style={{
            padding: '12px 14px',
            background: colors.background.page,
            borderTop: `2px solid ${colors.gray.border}`,
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: colors.gray.dimText, marginBottom: 3 }}>
              <span>Subtotal</span>
              <span style={{ fontVariantNumeric: 'tabular-nums' }}>{formatBRL(sale.subtotal)}</span>
            </div>
            {sale.discount > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: colors.gray.dimText, marginBottom: 3 }}>
                <span>Desconto</span>
                <span style={{ fontVariantNumeric: 'tabular-nums' }}>−{formatBRL(sale.discount)}</span>
              </div>
            )}
            <div style={{
              display: 'flex', justifyContent: 'space-between',
              fontSize: 16, fontWeight: 700,
              color: colors.gray[900],
              marginTop: 6, paddingTop: 6,
              borderTop: `1px solid ${colors.gray.border}`,
            }}>
              <span>Total</span>
              <span style={{ fontVariantNumeric: 'tabular-nums' }}>{formatBRL(sale.total)}</span>
            </div>
          </div>
        </div>

        {/* Pagamentos */}
        <div style={{
          background: '#fff',
          border: `1px solid ${colors.gray.border}`,
          borderRadius: 12,
          marginBottom: 14,
          overflow: 'hidden',
        }}>
          <div style={{
            padding: '10px 14px',
            fontSize: 10, fontWeight: 700,
            color: colors.gray.dimText,
            textTransform: 'uppercase',
            letterSpacing: '.07em',
            background: colors.background.page,
            borderBottom: `1px solid ${colors.gray.border}`,
          }}>
            Pagamentos ({sale.payments.length})
          </div>
          {sale.payments.map((payment, i) => {
            const Icon = PAYMENT_METHOD_ICON[payment.method]
            return (
              <div key={payment.id} style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '10px 14px',
                borderBottom: i < sale.payments.length - 1 ? `1px solid ${colors.gray.border}` : 'none',
              }}>
                <div style={{
                  width: 28, height: 28, borderRadius: 7,
                  background: colors.gray.hover,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0,
                }}>
                  <Icon size={13} color={colors.gray[700]} strokeWidth={2} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontSize: 12, fontWeight: 700,
                    color: colors.gray[900],
                  }}>
                    {PAYMENT_METHOD_LABEL[payment.method]}
                  </div>
                  {payment.reference && (
                    <div style={{
                      fontSize: 10, color: colors.gray.dimText,
                      fontFamily: 'ui-monospace, SFMono-Regular, monospace',
                    }}>
                      {payment.reference}
                    </div>
                  )}
                </div>
                <div style={{
                  fontSize: 13, fontWeight: 700,
                  color: colors.gray[900],
                  fontVariantNumeric: 'tabular-nums',
                  flexShrink: 0,
                }}>
                  {formatBRL(payment.amount)}
                </div>
              </div>
            )
          })}
        </div>

        {/* Notas de crédito */}
        {hasCreditNote && (
          <div style={{
            background: 'rgba(245,158,11,0.04)',
            border: '1px solid rgba(245,158,11,0.25)',
            borderRadius: 12,
            marginBottom: 14,
            overflow: 'hidden',
          }}>
            <div style={{
              padding: '10px 14px',
              fontSize: 10, fontWeight: 700,
              color: '#92400e',
              textTransform: 'uppercase',
              letterSpacing: '.07em',
              background: 'rgba(245,158,11,0.08)',
              borderBottom: '1px solid rgba(245,158,11,0.2)',
              display: 'flex', alignItems: 'center', gap: 6,
            }}>
              <FileX size={11} />
              Notas de crédito ({sale.creditNotes.length})
            </div>
            {sale.creditNotes.map((cn, i) => (
              <div key={cn.id} style={{
                padding: '10px 14px',
                borderBottom: i < sale.creditNotes.length - 1
                  ? '1px solid rgba(245,158,11,0.2)' : 'none',
              }}>
                <div style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
                  marginBottom: 4,
                }}>
                  <div style={{
                    fontSize: 12, fontWeight: 600,
                    color: colors.gray[900],
                    flex: 1, paddingRight: 8,
                  }}>
                    {cn.reason}
                  </div>
                  <div style={{
                    fontSize: 13, fontWeight: 700,
                    color: '#b45309',
                    fontVariantNumeric: 'tabular-nums',
                    flexShrink: 0,
                  }}>
                    −{formatBRL(cn.amount)}
                  </div>
                </div>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  fontSize: 10, color: colors.gray.dimText,
                }}>
                  <Calendar size={9} />
                  <span>{formatDateTime(cn.createdAt)}</span>
                  {cn.refundStock && (
                    <>
                      <span>·</span>
                      <span style={{ color: '#15803d', fontWeight: 600 }}>
                        Estoque devolvido
                      </span>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Notas */}
        {sale.notes && (
          <div style={{
            background: '#fff',
            border: `1px solid ${colors.gray.border}`,
            borderRadius: 12,
            padding: '12px 14px',
            marginBottom: 14,
          }}>
            <div style={{
              fontSize: 10, fontWeight: 700,
              color: colors.gray.dimText,
              textTransform: 'uppercase',
              letterSpacing: '.07em',
              marginBottom: 6,
            }}>Observações</div>
            <div style={{ fontSize: 13, color: colors.gray[700], lineHeight: 1.5 }}>
              {sale.notes}
            </div>
          </div>
        )}

        {/* Ação: emitir NC */}
        {isConfirmed && !isFullyAnnulled && (
          <button
            onClick={() => setShowNC(true)}
            style={{
              width: '100%',
              padding: '13px',
              borderRadius: 11,
              border: '1px solid rgba(245,158,11,0.30)',
              background: 'rgba(245,158,11,0.06)',
              color: '#b45309',
              fontSize: 13,
              fontWeight: 800,
              cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
              fontFamily: 'inherit',
              letterSpacing: '.04em',
              textTransform: 'uppercase',
              marginBottom: 14,
              WebkitTapHighlightColor: 'transparent',
            }}
          >
            <FileX size={14} strokeWidth={2.5} />
            Emitir nota de crédito
          </button>
        )}
      </div>
    </>
  )
}
