'use client'
// src/app/dashboard/pacotes/components/CardDetailModal.tsx

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import {
  X, RotateCw, Loader2, AlertCircle, Package as PackageIcon,
  History, ArrowLeft, Minus, Plus, Check, Calendar,
} from 'lucide-react'
import dayjs from 'dayjs'

import api from '@/shared/lib/apiClient'
import CalendarPicker from '@/shared/components/CalendarPicker'
import { colors, typography, transitions, radius } from '@/shared/theme'
import { PackageCard } from '@/features/packages/types'
import {
  fmtBRL, fmtDate, fmtDateTime, STATUS_LABEL, STATUS_COLOR, formatCardNumber,
} from '@/features/packages/utils/format'

interface Props {
  cardId:   string
  isMobile: boolean
  onClose:  () => void
  onCanceled?: (cardId: string) => void
  onUsed?:  (cardId: string) => void
}

export default function CardDetailModal({ cardId, isMobile, onClose, onCanceled, onUsed }: Props) {
  const [card, setCard]     = useState<PackageCard | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]   = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)

  // Frente (QR) ou verso (info)
  const [flipped, setFlipped] = useState(false)

  // Telas: detalhe ou baixa manual
  const [mode, setMode] = useState<'detail' | 'use'>('detail')
  const [useQtys, setUseQtys] = useState<Record<string, number>>({})
  const [submitting, setSubmitting] = useState(false)

  // Edição de validade (reusa o calendário da agenda)
  const [editingValidity, setEditingValidity] = useState(false)
  const [savingValidity, setSavingValidity] = useState(false)

  // Cancelamento
  const [showCancelConfirm, setShowCancelConfirm] = useState(false)
  const [cancelReason, setCancelReason] = useState('')
  const [issueCN, setIssueCN] = useState(true)
  const [canceling, setCanceling] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 10)
    return () => clearTimeout(t)
  }, [])

  useEffect(() => {
    let cancelled = false

    // Defer setState pra escapar do "set-state-in-effect" do React Compiler
    const tLoad = setTimeout(() => {
      if (!cancelled) setLoading(true)
    }, 0)

    api.get(`/package-cards/${cardId}`)
      .then(res => {
        if (cancelled) return
        setCard(res.data?.data ?? null)
      })
      .catch(() => { if (!cancelled) setError('Erro ao carregar cartão') })
      .finally(() => { if (!cancelled) setLoading(false) })

    return () => {
      cancelled = true
      clearTimeout(tLoad)
    }
  }, [cardId])

  function handleClose() {
    setMounted(false)
    setTimeout(onClose, 200)
  }

  async function doCancel() {
    setCanceling(true)
    try {
      await api.post(`/package-cards/${cardId}/cancel`, {
        reason: cancelReason.trim() || undefined,
        issueCreditNote: issueCN,
      })
      onCanceled?.(cardId)
      handleClose()
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: string } } }
      setError(e.response?.data?.error ?? 'Erro ao cancelar')
      setCanceling(false)
    }
  }

  function openUse() {
    setError(null)
    setUseQtys({})
    setMode('use')
  }

  function setQty(serviceId: string, val: number, max: number) {
    const v = Math.max(0, Math.min(max, val))
    setUseQtys(prev => ({ ...prev, [serviceId]: v }))
  }

  async function confirmUse() {
    const entries = Object.entries(useQtys).filter(([, q]) => q > 0)
    if (entries.length === 0) return
    setSubmitting(true)
    setError(null)
    try {
      // Em série (não Promise.all): cada baixa é uma transação; evita corrida no status DEPLETED
      for (const [serviceId, quantity] of entries) {
        await api.post(`/package-cards/${cardId}/use`, {
          serviceId,
          quantity,
          notes: 'Baixa manual',
        })
      }
      const res = await api.get(`/package-cards/${cardId}`)
      setCard(res.data?.data ?? null)
      onUsed?.(cardId)
      setUseQtys({})
      setMode('detail')
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: string } } }
      setError(e.response?.data?.error ?? 'Erro ao registrar utilização')
    } finally {
      setSubmitting(false)
    }
  }

async function saveValidity(d: dayjs.Dayjs) {
    setSavingValidity(true)
    setError(null)
    try {
      await api.patch(`/package-cards/${cardId}/validity`, {
        validUntil: d.endOf('day').toISOString(),
      })
      const res = await api.get(`/package-cards/${cardId}`)
      setCard(res.data?.data ?? null)
      onUsed?.(cardId)
      setEditingValidity(false)
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: string } } }
      setError(e.response?.data?.error ?? 'Erro ao atualizar validade')
    } finally {
      setSavingValidity(false)
    }
  }

  async function clearValidity() {
    setSavingValidity(true)
    setError(null)
    try {
      await api.patch(`/package-cards/${cardId}/validity`, { validUntil: null })
      const res = await api.get(`/package-cards/${cardId}`)
      setCard(res.data?.data ?? null)
      onUsed?.(cardId)
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: string } } }
      setError(e.response?.data?.error ?? 'Erro ao atualizar validade')
    } finally {
      setSavingValidity(false)
    }
  }

  // QR Code via API pública
  function qrUrl(text: string, size = 240): string {
    return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&margin=2&data=${encodeURIComponent(text)}`
  }

  const statusC = card ? STATUS_COLOR[card.status] : { fg: '#000', bg: 'transparent' }
  const isCanceled = card?.status === 'CANCELED'
  const isExpired  = card?.status === 'EXPIRED'

  const totalRemaining = card?.balances?.reduce((s, b) => s + (b.initialQty - b.usedQty), 0) ?? 0
  const canUse = !!card && card.status === 'ACTIVE' && totalRemaining > 0
  const selectedTotal = Object.values(useQtys).reduce((s, q) => s + q, 0)

  const content = (
    <div
      onClick={handleClose}
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(0,0,0,0.5)',
        backdropFilter: 'blur(3px)',
        zIndex: 9998,
        display: 'flex',
        alignItems: isMobile ? 'flex-end' : 'center',
        justifyContent: 'center',
        opacity: mounted ? 1 : 0,
        transition: 'opacity 0.2s ease',
        fontFamily: typography.fontFamily,
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: '#fff',
          width: isMobile ? '100%' : 820,
          maxWidth: '100%',
          maxHeight: isMobile ? '94vh' : '90vh',
          borderRadius: isMobile ? '20px 20px 0 0' : radius.lg,
          overflow: 'hidden',
          display: 'flex', flexDirection: 'column',
          transform: mounted
            ? 'translateY(0)'
            : isMobile ? 'translateY(100%)' : 'scale(0.97)',
          transition: `transform 0.25s ${transitions.spring ?? 'cubic-bezier(0.34,1.56,0.64,1)'}`,
          boxShadow: '0 -8px 40px rgba(0,0,0,0.2)',
        }}
      >
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '16px 20px',
          borderBottom: `1px solid ${colors.gray.border}`,
          flexShrink: 0,
        }}>
          <button
            onClick={mode === 'use' ? () => setMode('detail') : handleClose}
            aria-label={mode === 'use' ? 'Voltar' : 'Fechar'}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              padding: 6, display: 'flex',
              WebkitTapHighlightColor: 'transparent',
            }}
          >
            {mode === 'use'
              ? <ArrowLeft size={20} color={colors.gray[700]} strokeWidth={2} />
              : <X size={20} color={colors.gray[700]} strokeWidth={2} />}
          </button>
          <h2 style={{
            flex: 1, textAlign: 'center',
            margin: 0,
            fontSize: 16, fontWeight: 700,
            color: colors.gray[900],
            paddingLeft: 32,  // compensa o botão
          }}>
            {mode === 'use' ? 'Utilizar' : (card?.packageName ?? 'Carregando…')}
          </h2>
          {card && mode === 'detail' ? (
            <span style={{
              padding: '3px 10px',
              borderRadius: 999,
              background: statusC.bg,
              color: statusC.fg,
              fontSize: 10,
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '.05em',
            }}>
              {STATUS_LABEL[card.status]}
            </span>
          ) : (
            <span style={{ width: 32, display: 'inline-block' }} />
          )}
        </div>

        {/* Body */}
        <div style={{
          flex: 1, overflowY: 'auto',
          WebkitOverflowScrolling: 'touch',
          padding: isMobile ? 16 : 22,
        }}>
          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
              <Loader2 size={26} style={{ animation: 'pkg-spin 0.8s linear infinite', color: colors.red.DEFAULT }} />
            </div>
          ) : !card ? (
            <div style={{ textAlign: 'center', padding: 40, color: colors.gray.dimText }}>
              {error ?? 'Cartão não encontrado'}
            </div>
          ) : mode === 'use' ? (
            /* ═══════ TELA: BAIXA MANUAL ═══════ */
            <div style={{ maxWidth: 560, margin: '0 auto' }}>
              <div style={{
                fontSize: 12, color: colors.gray.dimText,
                marginBottom: 14,
              }}>
                Escolha quantos créditos dar baixa. Isso desconta do saldo sem gerar venda.
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {(card.balances ?? []).map(b => {
                  const remaining = b.initialQty - b.usedQty
                  const isEmpty = remaining === 0
                  const qty = useQtys[b.serviceId] ?? 0
                  return (
                    <div key={b.id} style={{
                      background: colors.background.page,
                      border: `1px solid ${colors.gray.border}`,
                      borderRadius: 12,
                      padding: '12px 14px',
                      display: 'flex', alignItems: 'center', gap: 12,
                      position: 'relative', overflow: 'hidden',
                      opacity: isEmpty ? 0.55 : 1,
                    }}>
                      <div style={{
                        position: 'absolute', top: 0, left: 0, bottom: 0,
                        width: 3, background: b.service?.color ?? colors.red.DEFAULT,
                      }} />
                      <div style={{ flex: 1, minWidth: 0, paddingLeft: 6 }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: colors.gray[900] }}>
                          {b.serviceName}
                        </div>
                        <div style={{ fontSize: 10, color: colors.gray.dimText, marginTop: 2 }}>
                          {b.service?.duration ?? 0}min · Preço normal {fmtBRL(b.service?.price ?? b.unitPrice)}
                        </div>
                      </div>

                      <div style={{
                        fontSize: 13, fontWeight: 800,
                        color: isEmpty ? colors.gray.dimText : colors.gray[900],
                        fontVariantNumeric: 'tabular-nums',
                        marginRight: 4,
                      }}>
                        {remaining}<span style={{ color: colors.gray.dimText, fontSize: 10, fontWeight: 600 }}>/{b.initialQty}</span>
                      </div>

                      {/* Stepper */}
                      <div style={{
                        display: 'flex', alignItems: 'center', gap: 2,
                        background: '#fff',
                        border: `1px solid ${colors.gray.borderMd}`,
                        borderRadius: 9,
                        padding: 3,
                        flexShrink: 0,
                      }}>
                        <button
                          onClick={() => setQty(b.serviceId, qty - 1, remaining)}
                          disabled={isEmpty || qty <= 0 || submitting}
                          aria-label="Diminuir"
                          style={{
                            width: 30, height: 30, borderRadius: 7,
                            border: 'none', background: 'transparent',
                            cursor: (isEmpty || qty <= 0 || submitting) ? 'not-allowed' : 'pointer',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            opacity: (isEmpty || qty <= 0) ? 0.3 : 1,
                            color: colors.gray[700],
                            WebkitTapHighlightColor: 'transparent',
                          }}
                        >
                          <Minus size={13} strokeWidth={2.5} />
                        </button>
                        <span style={{
                          minWidth: 30, textAlign: 'center',
                          fontSize: 15, fontWeight: 800,
                          color: qty > 0 ? colors.red.DEFAULT : colors.gray[900],
                          fontVariantNumeric: 'tabular-nums',
                        }}>{qty}</span>
                        <button
                          onClick={() => setQty(b.serviceId, qty + 1, remaining)}
                          disabled={isEmpty || qty >= remaining || submitting}
                          aria-label="Aumentar"
                          style={{
                            width: 30, height: 30, borderRadius: 7,
                            border: 'none', background: 'transparent',
                            cursor: (isEmpty || qty >= remaining || submitting) ? 'not-allowed' : 'pointer',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            opacity: (isEmpty || qty >= remaining) ? 0.3 : 1,
                            color: colors.gray[700],
                            WebkitTapHighlightColor: 'transparent',
                          }}
                        >
                          <Plus size={13} strokeWidth={2.5} />
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>

              {error && (
                <div style={{
                  marginTop: 14,
                  padding: '8px 10px',
                  background: 'rgba(220,38,38,0.06)',
                  border: `1px solid ${colors.red.border}`,
                  borderRadius: 7,
                  fontSize: 11,
                  color: colors.red.DEFAULT,
                  display: 'flex', alignItems: 'center', gap: 6,
                }}>
                  <AlertCircle size={12} strokeWidth={2.4} />
                  {error}
                </div>
              )}

              {/* Ações */}
              <div style={{ display: 'flex', gap: 10, marginTop: 18 }}>
                <button
                  onClick={() => { setMode('detail'); setUseQtys({}); setError(null) }}
                  disabled={submitting}
                  style={{
                    flex: 1,
                    padding: 12,
                    borderRadius: 10,
                    border: `1px solid ${colors.gray.borderMd}`,
                    background: '#fff',
                    fontSize: 12, fontWeight: 700,
                    color: colors.gray[700],
                    cursor: submitting ? 'not-allowed' : 'pointer',
                    fontFamily: 'inherit',
                    letterSpacing: '.04em', textTransform: 'uppercase',
                    WebkitTapHighlightColor: 'transparent',
                  }}
                >Cancelar</button>
                <button
                  onClick={confirmUse}
                  disabled={selectedTotal === 0 || submitting}
                  style={{
                    flex: 2,
                    padding: 12,
                    borderRadius: 10,
                    border: 'none',
                    background: (selectedTotal === 0 || submitting)
                      ? 'rgba(0,0,0,0.07)'
                      : 'linear-gradient(135deg, #1e293b, #0f172a)',
                    color: (selectedTotal === 0 || submitting) ? colors.gray.dimText : '#fff',
                    fontSize: 12, fontWeight: 800,
                    cursor: (selectedTotal === 0 || submitting) ? 'not-allowed' : 'pointer',
                    fontFamily: 'inherit',
                    letterSpacing: '.05em', textTransform: 'uppercase',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
                    WebkitTapHighlightColor: 'transparent',
                  }}
                >
                  {submitting
                    ? <Loader2 size={13} style={{ animation: 'pkg-spin 0.8s linear infinite' }} />
                    : <Check size={13} strokeWidth={2.6} />}
                  {selectedTotal > 0 ? `Confirmar utilização · ${selectedTotal}` : 'Confirmar utilização'}
                </button>
              </div>
            </div>
          ) : (
            /* ═══════ TELA: DETALHE ═══════ */
            <div style={{
              display: 'grid',
              gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
              gap: isMobile ? 16 : 22,
            }}>
              {/* ── COLUNA 1: Cartão (frente/verso) + serviços inclusos ── */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {/* Cartão flip */}
                <div style={{
                  background: '#fff',
                  border: `1px solid ${colors.gray.border}`,
                  borderRadius: 14,
                  padding: 16,
                  position: 'relative',
                  minHeight: 280,
                }}>
                  {/* Botão flip */}
                  <button
                    onClick={() => setFlipped(f => !f)}
                    aria-label="Virar cartão"
                    style={{
                      position: 'absolute',
                      top: 12, right: 12,
                      width: 32, height: 32, borderRadius: 8,
                      border: `1px solid ${colors.gray.border}`,
                      background: '#fff',
                      cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      WebkitTapHighlightColor: 'transparent',
                    }}
                  >
                    <RotateCw size={14} color={colors.gray[700]} strokeWidth={2} />
                  </button>

                  {flipped ? (
                    /* ─── VERSO: dados ─── */
                    <div style={{ paddingTop: 8 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
                        <div>
                          <div style={{ fontSize: 9, fontWeight: 700, color: colors.gray.dimText, textTransform: 'uppercase', letterSpacing: '.07em' }}>
                            CARTÃO
                          </div>
                          <div style={{
                            fontSize: 14, fontWeight: 700, color: colors.gray[900],
                            fontVariantNumeric: 'tabular-nums', marginTop: 4,
                          }}>
                            {formatCardNumber(card.cardNumber)}
                          </div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: 9, fontWeight: 700, color: colors.gray.dimText, textTransform: 'uppercase', letterSpacing: '.07em' }}>
                            SALDO
                          </div>
                          <div style={{
                            fontSize: 22, fontWeight: 800, color: colors.red.DEFAULT,
                            fontVariantNumeric: 'tabular-nums', marginTop: 2, letterSpacing: '-0.02em',
                          }}>
                            {(card.balances?.reduce((s, b) => s + (b.initialQty - b.usedQty), 0) ?? 0)}
                            <span style={{ color: colors.gray.dimText, fontSize: 13, fontWeight: 600 }}>
                              /{(card.balances?.reduce((s, b) => s + b.initialQty, 0) ?? 0)}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                        <Info label="VÁLIDO DE"   value={fmtDate(card.validFrom)} />
                        <Info label="VÁLIDO ATÉ"  value={card.validUntil ? fmtDate(card.validUntil) : 'Nunca expira'} />
                        <Info label="UTILIZADO"   value={`${card.balances?.reduce((s, b) => s + b.usedQty, 0) ?? 0}/${card.balances?.reduce((s, b) => s + b.initialQty, 0) ?? 0}`} />
                        <Info label="PREÇO"       value={fmtBRL(card.totalPrice)} />
                      </div>

                      <div style={{ marginTop: 14, paddingTop: 14, borderTop: `1px solid ${colors.gray.border}` }}>
                        <div style={{ fontSize: 9, fontWeight: 700, color: colors.gray.dimText, textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: 4 }}>
                          PROPRIETÁRIO(A)
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div style={{
                            width: 32, height: 32, borderRadius: '50%',
                            background: colors.red.gradient,
                            color: '#fff',
                            fontSize: 12, fontWeight: 700,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                          }}>
                            {(card.client?.name ?? '?').split(' ').slice(0,2).map(w => w[0]).join('').toUpperCase()}
                          </div>
                          <div>
                            <div style={{ fontSize: 13, fontWeight: 700, color: colors.gray[900] }}>
                              {card.client?.name ?? '—'}
                            </div>
                            {card.client?.phone && (
                              <div style={{ fontSize: 11, color: colors.gray.dimText }}>
                                {card.client.phone}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      <div style={{
                        textAlign: 'center', marginTop: 12,
                        fontSize: 10, color: colors.gray.dimText,
                      }}>
                        Clique em ↻ pra ver o QR code
                      </div>
                    </div>
                  ) : (
                    /* ─── FRENTE: QR code ─── */
                    <div style={{
                      display: 'flex', flexDirection: 'column',
                      alignItems: 'center', justifyContent: 'center',
                      padding: '8px 0',
                    }}>
                      <div style={{
                        background: '#fff',
                        padding: 10,
                        borderRadius: 12,
                        border: `1px solid ${colors.gray.border}`,
                      }}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={qrUrl(card.cardNumber)}
                          alt={`QR ${card.cardNumber}`}
                          style={{ width: 200, height: 200, display: 'block' }}
                        />
                      </div>
                      <div style={{
                        marginTop: 14,
                        fontSize: 14,
                        fontWeight: 700,
                        color: colors.gray[900],
                        fontVariantNumeric: 'tabular-nums',
                        letterSpacing: '.04em',
                      }}>
                        {formatCardNumber(card.cardNumber)}
                      </div>
                      <button
                        onClick={() => navigator.clipboard.writeText(card.cardNumber)}
                        style={{
                          marginTop: 10,
                          padding: '6px 12px',
                          borderRadius: 7,
                          border: `1px solid ${colors.gray.border}`,
                          background: 'transparent',
                          fontSize: 10,
                          fontWeight: 700,
                          color: colors.gray[700],
                          cursor: 'pointer',
                          fontFamily: 'inherit',
                          letterSpacing: '.05em',
                          textTransform: 'uppercase',
                          WebkitTapHighlightColor: 'transparent',
                        }}
                      >
                        Copiar número
                      </button>
                    </div>
                  )}
                </div>

                {/* Serviços inclusos com saldo */}
                <div>
                  <div style={{
                    fontSize: 11, fontWeight: 700,
                    color: colors.gray.dimText,
                    textTransform: 'uppercase',
                    letterSpacing: '.07em',
                    marginBottom: 8,
                  }}>
                    Serviços inclusos
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {(card.balances ?? []).map(b => {
                      const remaining = b.initialQty - b.usedQty
                      const isEmpty = remaining === 0
                      return (
                        <div key={b.id} style={{
                          background: '#fff',
                          border: `1px solid ${colors.gray.border}`,
                          borderRadius: 11,
                          padding: '10px 12px',
                          display: 'flex', alignItems: 'center',
                          position: 'relative',
                          overflow: 'hidden',
                          opacity: isEmpty ? 0.55 : 1,
                        }}>
                          <div style={{
                            position: 'absolute', top: 0, left: 0, bottom: 0,
                            width: 3, background: b.service?.color ?? colors.red.DEFAULT,
                          }} />
                          <div style={{ flex: 1, minWidth: 0, paddingLeft: 6 }}>
                            <div style={{ fontSize: 13, fontWeight: 700, color: colors.gray[900] }}>
                              {b.serviceName}
                            </div>
                            <div style={{ fontSize: 10, color: colors.gray.dimText, marginTop: 2 }}>
                              {b.service?.duration ?? 0}min · Preço normal {fmtBRL(b.service?.price ?? b.unitPrice)}
                            </div>
                          </div>
                          <div style={{
                            fontSize: 15, fontWeight: 800,
                            color: isEmpty ? colors.gray.dimText : colors.gray[900],
                            fontVariantNumeric: 'tabular-nums',
                            letterSpacing: '-0.01em',
                          }}>
                            {remaining}<span style={{ color: colors.gray.dimText, fontSize: 11, fontWeight: 600 }}>/{b.initialQty}</span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>

              {/* ── COLUNA 2: Histórico ── */}
              <div>
                <div style={{
                  fontSize: 11, fontWeight: 700,
                  color: colors.gray.dimText,
                  textTransform: 'uppercase',
                  letterSpacing: '.07em',
                  marginBottom: 8,
                  display: 'flex', alignItems: 'center', gap: 6,
                }}>
                  <History size={11} strokeWidth={2.4} />
                  Histórico de uso ({card.uses?.length ?? 0})
                </div>

                {(card.uses?.length ?? 0) === 0 ? (
                  <div style={{
                    padding: '30px 16px',
                    textAlign: 'center',
                    background: colors.background.page,
                    borderRadius: 11,
                    border: `1px dashed ${colors.gray.borderMd}`,
                    color: colors.gray.dimText,
                    fontSize: 12,
                  }}>
                    Nenhum uso registrado ainda
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {card.uses!.map(u => (
                      <div key={u.id} style={{
                        background: colors.background.page,
                        borderRadius: 9,
                        padding: '9px 11px',
                        display: 'flex', alignItems: 'center', gap: 10,
                      }}>
                        <div style={{
                          width: 28, height: 28, borderRadius: 7,
                          background: 'rgba(22,163,74,0.10)',
                          color: '#15803d',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          flexShrink: 0,
                        }}>
                          <PackageIcon size={13} strokeWidth={2.2} />
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 12, fontWeight: 700, color: colors.gray[900] }}>
                            {u.service?.name ?? '—'}
                          </div>
                          <div style={{ fontSize: 10, color: colors.gray.dimText }}>
                            {fmtDateTime(u.createdAt)}
                            {u.professional?.name && ` · ${u.professional.name}`}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Editar validade (expiração) */}
                {!isCanceled && (
                  <div style={{ marginTop: 18, paddingTop: 14, borderTop: `1px dashed ${colors.gray.border}` }}>
                    <div style={{
                      fontSize: 11, fontWeight: 700, color: colors.gray.dimText,
                      textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: 8,
                      display: 'flex', alignItems: 'center', gap: 6,
                    }}>
                      <Calendar size={11} strokeWidth={2.4} />
                      Validade
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 14, fontWeight: 700, color: colors.gray[900], fontVariantNumeric: 'tabular-nums' }}>
                          {card.validUntil ? fmtDate(card.validUntil) : 'Nunca expira'}
                        </div>
                        <div style={{ fontSize: 10, color: colors.gray.dimText, marginTop: 1 }}>
                          Início {fmtDate(card.validFrom)}
                        </div>
                      </div>
                      <button
                        onClick={() => { setError(null); setEditingValidity(true) }}
                        disabled={savingValidity}
                        style={{
                          padding: '8px 14px', borderRadius: 9,
                          border: `1px solid ${colors.gray.borderMd}`,
                          background: '#fff',
                          fontSize: 11, fontWeight: 700, color: colors.gray[700],
                          cursor: savingValidity ? 'not-allowed' : 'pointer',
                          fontFamily: 'inherit', letterSpacing: '.04em', textTransform: 'uppercase',
                          display: 'flex', alignItems: 'center', gap: 6,
                          WebkitTapHighlightColor: 'transparent',
                        }}
                      >
                        {savingValidity
                          ? <Loader2 size={12} style={{ animation: 'pkg-spin 0.8s linear infinite' }} />
                          : <Calendar size={12} strokeWidth={2.2} />}
                        Editar
                      </button>
                    </div>
                    {card.validUntil && (
                      <button
                        onClick={clearValidity}
                        disabled={savingValidity}
                        style={{
                          marginTop: 8, background: 'none', border: 'none',
                          padding: 0, cursor: savingValidity ? 'not-allowed' : 'pointer',
                          fontSize: 11, fontWeight: 600, color: colors.gray.dimText,
                          fontFamily: 'inherit', textDecoration: 'underline',
                          WebkitTapHighlightColor: 'transparent',
                        }}
                      >
                        Remover validade (nunca expira)
                      </button>
                    )}
                  </div>
                )}

                {/* Cancelar */}
                {!isCanceled && !isExpired && (
                  <div style={{ marginTop: 18, paddingTop: 14, borderTop: `1px dashed ${colors.gray.border}` }}>
                    {showCancelConfirm ? (
                      <div style={{
                        padding: 12, background: 'rgba(220,38,38,0.04)',
                        border: `1px solid ${colors.red.border}`,
                        borderRadius: 10,
                      }}>
                        <div style={{
                          fontSize: 12, fontWeight: 700, color: colors.red.DEFAULT,
                          marginBottom: 8,
                        }}>
                          Cancelar este cartão?
                        </div>
                        <textarea
                          value={cancelReason}
                          onChange={e => setCancelReason(e.target.value)}
                          placeholder="Motivo (opcional)..."
                          rows={2}
                          style={{
                            width: '100%', boxSizing: 'border-box',
                            padding: '8px 10px',
                            borderRadius: 7,
                            border: `1px solid ${colors.gray.borderMd}`,
                            fontSize: 12, outline: 'none',
                            fontFamily: 'inherit',
                            resize: 'none',
                            marginBottom: 8,
                          }}
                        />
                        <label style={{
                          display: 'flex', alignItems: 'center', gap: 7,
                          fontSize: 12, color: colors.gray[700],
                          cursor: 'pointer', marginBottom: 10,
                        }}>
                          <input
                            type="checkbox"
                            checked={issueCN}
                            onChange={e => setIssueCN(e.target.checked)}
                          />
                          Emitir Nota de Crédito automaticamente
                        </label>
                        <div style={{ display: 'flex', gap: 7 }}>
                          <button
                            onClick={() => setShowCancelConfirm(false)}
                            style={{
                              flex: 1,
                              padding: 9,
                              borderRadius: 8,
                              border: `1px solid ${colors.gray.borderMd}`,
                              background: '#fff',
                              fontSize: 11, fontWeight: 700,
                              color: colors.gray[700],
                              cursor: 'pointer', fontFamily: 'inherit',
                              WebkitTapHighlightColor: 'transparent',
                            }}
                          >Voltar</button>
                          <button
                            onClick={doCancel}
                            disabled={canceling}
                            style={{
                              flex: 1,
                              padding: 9,
                              borderRadius: 8,
                              border: 'none',
                              background: canceling ? colors.gray.borderMd : colors.red.gradient,
                              color: '#fff',
                              fontSize: 11, fontWeight: 800,
                              cursor: canceling ? 'not-allowed' : 'pointer', fontFamily: 'inherit',
                              letterSpacing: '.04em', textTransform: 'uppercase',
                              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
                              WebkitTapHighlightColor: 'transparent',
                            }}
                          >
                            {canceling
                              ? <Loader2 size={11} style={{ animation: 'pkg-spin 0.8s linear infinite' }} />
                              : null}
                            Confirmar
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => setShowCancelConfirm(true)}
                        style={{
                          width: '100%',
                          padding: '10px 12px',
                          borderRadius: 9,
                          border: `1px solid ${colors.red.border}`,
                          background: 'transparent',
                          fontSize: 12, fontWeight: 700,
                          color: colors.red.DEFAULT,
                          cursor: 'pointer', fontFamily: 'inherit',
                          letterSpacing: '.04em', textTransform: 'uppercase',
                          WebkitTapHighlightColor: 'transparent',
                        }}
                      >
                        Cancelar cartão
                      </button>
                    )}
                  </div>
                )}

                {error && (
                  <div style={{
                    marginTop: 12,
                    padding: '8px 10px',
                    background: 'rgba(220,38,38,0.06)',
                    border: `1px solid ${colors.red.border}`,
                    borderRadius: 7,
                    fontSize: 11,
                    color: colors.red.DEFAULT,
                    display: 'flex', alignItems: 'center', gap: 6,
                  }}>
                    <AlertCircle size={12} strokeWidth={2.4} />
                    {error}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer: botão UTILIZAR (só no detalhe, cartão ativo com saldo) */}
        {!loading && card && mode === 'detail' && canUse && (
          <div style={{
            flexShrink: 0,
            padding: isMobile ? '12px 16px' : '14px 22px',
            borderTop: `1px solid ${colors.gray.border}`,
            background: '#fff',
          }}>
            <button
              onClick={openUse}
              style={{
                width: '100%',
                padding: 14,
                borderRadius: 12,
                border: 'none',
                background: 'linear-gradient(135deg, #1e293b, #0f172a)',
                color: '#fff',
                fontSize: 13, fontWeight: 800,
                cursor: 'pointer',
                fontFamily: 'inherit',
                letterSpacing: '.06em', textTransform: 'uppercase',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                boxShadow: '0 6px 20px rgba(15,23,42,0.28)',
                WebkitTapHighlightColor: 'transparent',
              }}
            >
              <Check size={15} strokeWidth={2.6} />
              Utilizar
            </button>
          </div>
        )}
      </div>

      {editingValidity && card && (
        <CalendarPicker
          date={card.validUntil ? dayjs(card.validUntil) : dayjs()}
          minDate={card.validFrom ? dayjs(card.validFrom) : undefined}
          onSelect={saveValidity}
          onClose={() => setEditingValidity(false)}
          isMobile={isMobile}
          showWeekJump={false}
        />
      )}

      <style>{`@keyframes pkg-spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )

  if (typeof document === 'undefined') return null
  return createPortal(content, document.body)
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div style={{
        fontSize: 9, fontWeight: 700, color: colors.gray.dimText,
        textTransform: 'uppercase', letterSpacing: '.07em',
      }}>
        {label}
      </div>
      <div style={{
        fontSize: 13, fontWeight: 700, color: colors.gray[900],
        marginTop: 3,
        fontVariantNumeric: 'tabular-nums',
      }}>
        {value}
      </div>
    </div>
  )
}
