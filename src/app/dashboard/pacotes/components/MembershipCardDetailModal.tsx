'use client'
// src/app/dashboard/pacotes/components/MembershipCardDetailModal.tsx

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import {
  X, Loader2, AlertCircle, History, RefreshCw, Infinity as InfinityIcon, Rocket,
} from 'lucide-react'

import api from '@/shared/lib/apiClient'
import { colors, typography } from '@/shared/theme'
import { MembershipCard } from '@/features/memberships/types'
import {
  fmtBRL, fmtDate, fmtDateTime, formatCardNumber, M_STATUS_LABEL, M_STATUS_COLOR,
} from '@/features/memberships/format'

interface Props {
  cardId:     string
  isMobile:   boolean
  onClose:    () => void
  onCanceled: (cardId: string) => void
}

export default function MembershipCardDetailModal({ cardId, isMobile, onClose, onCanceled }: Props) {
  const [card, setCard]       = useState<MembershipCard | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)

  const [showCancelConfirm, setShowCancelConfirm] = useState(false)
  const [cancelReason, setCancelReason] = useState('')
  const [issueCN, setIssueCN] = useState(false)
  const [canceling, setCanceling] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 10)
    return () => clearTimeout(t)
  }, [])

  useEffect(() => {
    let cancelled = false
    const t = setTimeout(() => { if (!cancelled) setLoading(true) }, 0)
    api.get(`/membership-cards/${cardId}`)
      .then(res => {
        if (cancelled) return
        setCard(res.data?.data ?? res.data)
      })
      .catch(() => { if (!cancelled) setError('Assinatura não encontrada') })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true; clearTimeout(t) }
  }, [cardId])

  function handleClose() {
    setMounted(false)
    setTimeout(onClose, 200)
  }

  async function doCancel() {
    setCanceling(true)
    setError(null)
    try {
      await api.post(`/membership-cards/${cardId}/cancel`, {
        reason: cancelReason.trim() || undefined,
        issueCreditNote: issueCN,
      })
      onCanceled(cardId)
      handleClose()
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: string } } }
      setError(e.response?.data?.error ?? 'Erro ao cancelar')
      setCanceling(false)
    }
  }

  const statusC   = card ? M_STATUS_COLOR[card.status] : M_STATUS_COLOR.ACTIVE
  const isCanceled = card?.status === 'CANCELED'
  const isExpired  = card?.status === 'EXPIRED'
  const coveredServices = card?.plan?.services ?? []

  const content = (
    <div
      onClick={handleClose}
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(3px)',
        zIndex: 9998, display: 'flex',
        alignItems: isMobile ? 'flex-end' : 'center', justifyContent: 'center',
        opacity: mounted ? 1 : 0, transition: 'opacity 0.2s ease',
        fontFamily: typography.fontFamily,
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: '#fff', width: isMobile ? '100%' : 520, maxWidth: '100%',
          maxHeight: isMobile ? '90vh' : '85vh',
          borderRadius: isMobile ? '20px 20px 0 0' : 16,
          overflow: 'hidden', display: 'flex', flexDirection: 'column',
          transform: mounted ? 'translateY(0)' : isMobile ? 'translateY(100%)' : 'scale(0.97)',
          transition: `transform 0.25s cubic-bezier(0.34,1.56,0.64,1)`,
          boxShadow: '0 -8px 40px rgba(0,0,0,0.2)',
        }}
      >
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '16px 20px', borderBottom: `1px solid ${colors.gray.border}`, flexShrink: 0,
        }}>
          <button onClick={handleClose} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 6, display: 'flex', WebkitTapHighlightColor: 'transparent' }}>
            <X size={20} color={colors.gray[700]} strokeWidth={2} />
          </button>
          <h2 style={{ flex: 1, textAlign: 'center', margin: 0, fontSize: 16, fontWeight: 700, color: colors.gray[900], paddingLeft: 32 }}>
            {card?.planName ?? 'Carregando…'}
          </h2>
          {card && (
            <span style={{ padding: '3px 10px', borderRadius: 999, background: statusC.bg, color: statusC.fg, fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.05em' }}>
              {M_STATUS_LABEL[card.status]}
            </span>
          )}
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch', padding: isMobile ? 16 : 22 }}>
          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
              <Loader2 size={26} style={{ animation: 'pkg-spin 0.8s linear infinite', color: colors.red.DEFAULT }} />
            </div>
          ) : !card ? (
            <div style={{ textAlign: 'center', padding: 40, color: colors.gray.dimText }}>
              {error ?? 'Assinatura não encontrada'}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Cartão: validade + dados */}
              <div style={{ background: '#fff', border: `1px solid ${colors.gray.border}`, borderRadius: 14, padding: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11, fontWeight: 700, color: '#15803d', background: 'rgba(22,163,74,0.10)', padding: '3px 9px', borderRadius: 999 }}>
                    <InfinityIcon size={12} strokeWidth={2.4} /> Ilimitada
                  </span>
                  {card.recurring && (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11, fontWeight: 700, color: '#6D28D9', background: 'rgba(124,58,237,0.10)', padding: '3px 9px', borderRadius: 999 }}>
                      <RefreshCw size={12} strokeWidth={2.4} /> Recorrente
                    </span>
                  )}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <Info label="CARTÃO"     value={formatCardNumber(card.cardNumber)} />
                  <Info label="PREÇO"      value={fmtBRL(card.totalPrice)} />
                  <Info label="VÁLIDO DE"  value={fmtDate(card.validFrom)} />
                  <Info label="VÁLIDO ATÉ" value={card.validUntil ? fmtDate(card.validUntil) : 'Nunca expira'} />
                </div>
                <div style={{ marginTop: 14, paddingTop: 14, borderTop: `1px solid ${colors.gray.border}` }}>
                  <div style={{ fontSize: 9, fontWeight: 700, color: colors.gray.dimText, textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: 4 }}>
                    PROPRIETÁRIO(A)
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 32, height: 32, borderRadius: '50%', background: colors.red.gradient, color: '#fff', fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {(card.client?.name ?? '?').split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase()}
                    </div>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: colors.gray[900] }}>{card.client?.name ?? '—'}</div>
                      {card.client?.phone && <div style={{ fontSize: 11, color: colors.gray.dimText }}>{card.client.phone}</div>}
                    </div>
                  </div>
                </div>
              </div>

              {/* Cobertura */}
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: colors.gray.dimText, textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: 8 }}>
                  Serviços cobertos
                </div>
                {card.plan?.allServices ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 14px', background: colors.background.page, borderRadius: 11, fontSize: 13, fontWeight: 600, color: colors.gray[900] }}>
                    <Rocket size={15} color={colors.red.DEFAULT} strokeWidth={2.2} />
                    Todos os serviços do negócio
                  </div>
                ) : coveredServices.length === 0 ? (
                  <div style={{ padding: '16px', textAlign: 'center', background: colors.background.page, borderRadius: 11, color: colors.gray.dimText, fontSize: 12 }}>
                    Nenhum serviço configurado
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
                    {coveredServices.map(s => (
                      <span key={s.serviceId} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 11px', borderRadius: 999, background: '#fff', border: `1px solid ${colors.gray.border}`, fontSize: 12, fontWeight: 600, color: colors.gray[900] }}>
                        <span style={{ width: 7, height: 7, borderRadius: '50%', background: s.service?.color ?? colors.red.DEFAULT }} />
                        {s.service?.name ?? 'Serviço'}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Histórico */}
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: colors.gray.dimText, textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <History size={11} strokeWidth={2.4} />
                  Histórico de uso ({card.uses?.length ?? 0})
                </div>
                {(card.uses?.length ?? 0) === 0 ? (
                  <div style={{ padding: '24px 16px', textAlign: 'center', background: colors.background.page, borderRadius: 11, border: `1px dashed ${colors.gray.borderMd}`, color: colors.gray.dimText, fontSize: 12 }}>
                    Nenhum uso registrado ainda
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {card.uses!.map(u => (
                      <div key={u.id} style={{ background: colors.background.page, borderRadius: 9, padding: '9px 11px', display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 28, height: 28, borderRadius: 7, background: 'rgba(22,163,74,0.10)', color: '#15803d', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <InfinityIcon size={13} strokeWidth={2.2} />
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 12, fontWeight: 700, color: colors.gray[900] }}>{u.service?.name ?? '—'}</div>
                          <div style={{ fontSize: 10, color: colors.gray.dimText }}>
                            {fmtDateTime(u.createdAt)}{u.professional?.name && ` · ${u.professional.name}`}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Cancelar */}
              {!isCanceled && !isExpired && (
                <div style={{ paddingTop: 4 }}>
                  {showCancelConfirm ? (
                    <div style={{ padding: 12, background: 'rgba(220,38,38,0.04)', border: `1px solid ${colors.red.border}`, borderRadius: 10 }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: colors.red.DEFAULT, marginBottom: 8 }}>Cancelar esta assinatura?</div>
                      <textarea
                        value={cancelReason}
                        onChange={e => setCancelReason(e.target.value)}
                        placeholder="Motivo (opcional)..."
                        rows={2}
                        style={{ width: '100%', boxSizing: 'border-box', padding: '8px 10px', borderRadius: 7, border: `1px solid ${colors.gray.borderMd}`, fontSize: 12, outline: 'none', fontFamily: 'inherit', resize: 'none', marginBottom: 8 }}
                      />
                      <label style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 12, color: colors.gray[700], cursor: 'pointer', marginBottom: 10 }}>
                        <input type="checkbox" checked={issueCN} onChange={e => setIssueCN(e.target.checked)} />
                        Emitir Nota de Crédito automaticamente
                      </label>
                      <div style={{ display: 'flex', gap: 7 }}>
                        <button onClick={() => setShowCancelConfirm(false)} style={{ flex: 1, padding: 9, borderRadius: 8, border: `1px solid ${colors.gray.borderMd}`, background: '#fff', fontSize: 11, fontWeight: 700, color: colors.gray[700], cursor: 'pointer', fontFamily: 'inherit', WebkitTapHighlightColor: 'transparent' }}>Voltar</button>
                        <button
                          onClick={doCancel}
                          disabled={canceling}
                          style={{ flex: 1, padding: 9, borderRadius: 8, border: 'none', background: canceling ? colors.gray.borderMd : colors.red.gradient, color: '#fff', fontSize: 11, fontWeight: 800, cursor: canceling ? 'not-allowed' : 'pointer', fontFamily: 'inherit', letterSpacing: '.04em', textTransform: 'uppercase', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, WebkitTapHighlightColor: 'transparent' }}
                        >
                          {canceling ? <Loader2 size={11} style={{ animation: 'pkg-spin 0.8s linear infinite' }} /> : null}
                          Confirmar
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => setShowCancelConfirm(true)}
                      style={{ width: '100%', padding: '10px 12px', borderRadius: 9, border: `1px solid ${colors.red.border}`, background: 'transparent', fontSize: 12, fontWeight: 700, color: colors.red.DEFAULT, cursor: 'pointer', fontFamily: 'inherit', letterSpacing: '.04em', textTransform: 'uppercase', WebkitTapHighlightColor: 'transparent' }}
                    >
                      Cancelar assinatura
                    </button>
                  )}
                </div>
              )}

              {error && (
                <div style={{ padding: '8px 10px', background: 'rgba(220,38,38,0.06)', border: `1px solid ${colors.red.border}`, borderRadius: 7, fontSize: 11, color: colors.red.DEFAULT, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <AlertCircle size={12} strokeWidth={2.4} />
                  {error}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <style>{`@keyframes pkg-spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )

  if (typeof document === 'undefined') return null
  return createPortal(content, document.body)
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div style={{ fontSize: 9, fontWeight: 700, color: colors.gray.dimText, textTransform: 'uppercase', letterSpacing: '.07em' }}>{label}</div>
      <div style={{ fontSize: 13, fontWeight: 700, color: colors.gray[900], marginTop: 3, fontVariantNumeric: 'tabular-nums' }}>{value}</div>
    </div>
  )
}
