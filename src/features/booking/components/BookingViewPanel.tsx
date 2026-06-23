'use client'
// src/features/booking/components/BookingViewPanel.tsx
//
// Painel de visualização de booking — Fase 6.3 refator:
// - Busca via GET /bookings/:id (não mais /payments/booking/:id)
// - Botão CHECKOUT → POST /sales/from-booking + redireciona pra /caixa/[saleId]
// - Botão Editar → openEdit do store (abre SideCheckoutPanel em modo edit)
// - Botão Cancelar → PATCH /bookings/:id/cancel (já existia)
// - Botão No-show → PATCH /bookings/:id/no-show (novo)
// - Se booking é COMPLETED: mostra link "Ver venda" pra /caixa/[saleId]
// - Detecta Sale OPEN linkada → muda label CHECKOUT pra "CONTINUAR CHECKOUT"

import { useState, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import {
  X, Clock, User, Calendar, AlertTriangle, CheckCircle, Ban, Phone,
  Edit3, ShoppingBag, Receipt, ChevronDown, Loader2, AlertCircle, Plus } from 'lucide-react'
import { useRouter } from 'next/navigation'
import api from '@/shared/lib/apiClient'
import { AgendaBooking } from '@/features/agenda/types'
import { colors, typography } from '@/shared/theme'
import { useIsMobile } from '@/hooks/useIsMobile'
import { useAgendaStore, type PrefillItem } from '@/features/agenda/hooks/useAgendaStore'
import dayjs from 'dayjs'
import 'dayjs/locale/pt-br'
import utc from 'dayjs/plugin/utc'
import timezone from 'dayjs/plugin/timezone'

dayjs.extend(utc)
dayjs.extend(timezone)
dayjs.locale('pt-br')

type BookingStatus = 'CONFIRMED' | 'COMPLETED' | 'CANCELED' | 'NO_SHOW'
type SaleStatus    = 'OPEN' | 'CONFIRMED' | 'CANCELED'

interface BookingDetail {
  id:             string
  status:         BookingStatus
  startAt:        string
  endAt:          string
  clientName:     string
  clientPhone?:   string | null
  clientEmail?:   string | null
  serviceId:      string
  professionalId?: string | null
  service: {
    id:       string
    name:     string
    price:    number | null
    color:    string | null
    duration: number
  }
  professional?: {
    id:       string
    name:     string
    avatarUrl?: string | null
  } | null
  client?: {
    id:    string
    name:  string
    phone: string
  } | null
  sale?: {
    id:          string
    status:      SaleStatus
    total:       number
    confirmedAt: string | null
  } | null
  groupItems?: GroupItem[]
  groupTotal?: number
  extraServices?: { id: string; name: string; price: number; professional?: { id: string; name: string } | null }[]
}

interface GroupItem {
  id:     string
  startAt: string
  endAt:   string
  status:  BookingStatus
  service: {
    id:       string
    name:     string
    price:    number | null
    color:    string | null
    duration: number
  }
  professional?: {
    id:   string
    name: string
  } | null
}

interface Props {
  booking: AgendaBooking
  date:    Date
  open:    boolean
  onClose: () => void
}

function getInitials(n: string) {
  return n.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase()
}
function fmtPhone(p: string) {
  const d = p.replace(/\D/g,'')
  if (d.length === 11) return `(${d.slice(0,2)}) ${d.slice(2,7)}-${d.slice(7)}`
  if (d.length === 10) return `(${d.slice(0,2)}) ${d.slice(2,6)}-${d.slice(6)}`
  return p
}
function waLink(p: string) {
  let d = p.replace(/\D/g, '')
  if (d.length <= 11) d = `55${d}` // nacional (DDD+numero) -> adiciona DDI Brasil
  return `https://wa.me/${d}`
}

const STATUS_CFG: Record<BookingStatus, { label: string; gradient: string; icon: typeof CheckCircle }> = {
  CONFIRMED: { label: 'CONFIRMADO', gradient: 'linear-gradient(135deg,#16a34a,#15803d)', icon: CheckCircle },
  COMPLETED: { label: 'FINALIZADO', gradient: 'linear-gradient(135deg,#1e293b,#0f172a)', icon: Receipt },
  CANCELED:  { label: 'CANCELADO',  gradient: 'linear-gradient(135deg,#dc2626,#b91c1c)', icon: Ban },
  NO_SHOW:   { label: 'NÃO COMPARECEU', gradient: 'linear-gradient(135deg,#b45309,#92400e)', icon: AlertTriangle },
}

// ─── ConfirmModal interno ─────────────────────────────────────────────────────
function ConfirmModal({
  title, body, confirmLabel, danger, onConfirm, onCancel,
}: {
  title: string
  body: string
  confirmLabel: string
  danger?: boolean
  onConfirm: () => void
  onCancel: () => void
}) {
  if (typeof document === 'undefined') return null
  return createPortal(
    <>
      <div onClick={onCancel} style={{
        position: 'fixed', inset: 0,
        background: 'rgba(0,0,0,0.4)',
        backdropFilter: 'blur(12px)',
        zIndex: 10998,
      }}/>
      <div style={{
        position: 'fixed', top: '50%', left: '50%',
        transform: 'translate(-50%,-50%)',
        width: 340, maxWidth: '88vw',
        background: '#fff',
        borderRadius: 24,
        boxShadow: '0 40px 80px rgba(0,0,0,0.22)',
        zIndex: 10999,
        padding: '32px 24px 24px',
        textAlign: 'center',
        fontFamily: typography.fontFamily,
        animation: 'bvp-cmIn 0.24s cubic-bezier(0.34,1.56,0.64,1)',
      }}>
        <style>{`
          @keyframes bvp-cmIn { from { opacity:0; transform: translate(-50%,-50%) scale(0.90) } to { opacity:1; transform: translate(-50%,-50%) scale(1) } }
        `}</style>
        <div style={{
          width: 52, height: 52, borderRadius: '50%',
          background: danger ? 'rgba(220,38,38,0.08)' : 'rgba(71,85,105,0.08)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 16px',
        }}>
          <AlertTriangle size={24} color={danger ? colors.red.DEFAULT : '#475569'}/>
        </div>
        <h3 style={{ margin: '0 0 8px', fontSize: 18, fontWeight: 800, color: '#0f0f14', letterSpacing: '-0.03em' }}>
          {title}
        </h3>
        <p style={{ margin: '0 0 24px', fontSize: 14, color: colors.gray.dimText, lineHeight: 1.6 }}>
          {body}
        </p>
        <button onClick={onConfirm} style={{
          width: '100%', padding: '14px', marginBottom: 10,
          background: danger ? colors.red.gradient : 'linear-gradient(135deg,#475569,#334155)',
          color: '#fff', border: 'none', borderRadius: 14,
          fontWeight: 700, fontSize: 14, cursor: 'pointer',
          letterSpacing: '.06em', textTransform: 'uppercase' as const,
          boxShadow: danger ? `0 6px 20px rgba(220,38,38,0.3)` : '0 6px 20px rgba(71,85,105,0.25)',
        }}>
          {confirmLabel}
        </button>
        <button onClick={onCancel} style={{
          width: '100%', padding: '13px',
          background: 'rgba(0,0,0,0.04)', border: 'none',
          borderRadius: 14, fontSize: 14, cursor: 'pointer',
          color: colors.gray.dimText, fontWeight: 600,
        }}>
          Cancelar
        </button>
      </div>
    </>,
    document.body,
  )
}

// ─── BookingViewPanel ─────────────────────────────────────────────────────────
export default function BookingViewPanel({ booking, date, open, onClose }: Props) {
  const router   = useRouter()
  const isMobile = useIsMobile()
  const { removeBooking, openEdit, updateBooking, openAddService } = useAgendaStore()
  const dateStr  = dayjs(date).format('YYYY-MM-DD')

  const [detail,    setDetail]    = useState<BookingDetail | null>(null)
  const [loading,   setLoading]   = useState(true)
  const [showAlter, setShowAlter] = useState(false)
  const [confirm,   setConfirm]   = useState<'cancel' | 'noshow' | null>(null)
  const [saving,    setSaving]    = useState(false)
  const [error,     setError]     = useState<string | null>(null)
  const [creatingSale, setCreatingSale] = useState(false)

  const bookingId    = booking.id
  const bookingStart = booking.start
  const bookingEnd   = booking.end
  const clientName   = booking.clientName
  const serviceName  = booking.serviceName
  const serviceColor = booking.serviceColor
  const status0      = booking.status

  // ─── Fetch detalhe via GET /bookings/:id ───────────────────────────────────
  const fetchDetail = useCallback(async (signal?: AbortSignal) => {
    try {
      const res = await api.get(`/bookings/${bookingId}`, { signal })
      if (signal?.aborted) return
      const data = res.data?.data ?? res.data
      setDetail(data)
    } catch {
      if (signal?.aborted) return
      // Fallback: monta detalhe básico a partir do AgendaBooking
      setDetail({
        id: bookingId,
        status: status0 as BookingStatus,
        startAt: dayjs.tz(`${dateStr} ${bookingStart}`, 'America/Sao_Paulo').toISOString(),
        endAt:   dayjs.tz(`${dateStr} ${bookingEnd}`,   'America/Sao_Paulo').toISOString(),
        clientName,
        serviceId: '',
        service: { id: '', name: serviceName, price: null, color: serviceColor ?? null, duration: 0 },
      })
    } finally {
      if (!signal?.aborted) setLoading(false)
    }
  }, [bookingId, dateStr, bookingStart, bookingEnd, clientName, serviceName, serviceColor, status0])

  useEffect(() => {
    if (!open || !bookingId) return
    const ctrl = new AbortController()
    const tLoad = setTimeout(() => setLoading(true), 0)
    fetchDetail(ctrl.signal)
    return () => {
      ctrl.abort()
      clearTimeout(tLoad)
    }
  }, [open, bookingId, fetchDetail])

  // ─── Ações ─────────────────────────────────────────────────────────────────
  async function handleCancel() {
    try {
      setSaving(true)
      setError(null)
      await api.patch(`/bookings/${bookingId}/cancel`)
      removeBooking(dateStr, bookingId)
      setConfirm(null)
      onClose()
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: string } } }
      setError(e.response?.data?.error ?? 'Erro ao cancelar')
      setSaving(false)
    }
  }

  async function handleNoShow() {
    try {
      setSaving(true)
      setError(null)
      const res = await api.patch(`/bookings/${bookingId}/no-show`)
      const updated = res.data?.data ?? res.data
      // Atualiza no store (não remove — só muda status)
      updateBooking(dateStr, {
        ...booking,
        status: 'NO_SHOW',
      })
      setDetail(prev => prev ? { ...prev, status: 'NO_SHOW' } : prev)
      setConfirm(null)
      // Não fecha — usuário pode querer ver o resultado
      setSaving(false)
      // Evita warning de var não usada
      void updated
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: string } } }
      setError(e.response?.data?.error ?? 'Erro ao marcar não compareceu')
      setSaving(false)
    }
  }

  function handleEdit() {
    onClose()
    // Pequeno delay pra animação de fechar terminar antes de abrir o SideCheckoutPanel
    setTimeout(() => {
      openEdit(booking)
    }, 200)
  }

  function handleAddService() {
    // Abre o editor de grupo: serviços CONFIRMED já no agendamento (editáveis)
    // + permite adicionar novos. Save faz diff (PATCH existentes / add-to-group novos).
    const client = detail?.client
      ? { id: detail.client.id, name: detail.client.name, phone: detail.client.phone ?? '' }
      : null
    const refId = bookingId
    const startT = bookingStart
    const profId = detail?.professionalId ?? booking.professionalId ?? ''

    // Monta os itens existentes do grupo (só CONFIRMED — finalizados ficam de fora).
    const source = detail?.groupItems && detail.groupItems.length > 0
      ? detail.groupItems
      : (detail ? [{
          id: detail.id, startAt: detail.startAt, endAt: detail.endAt, status: detail.status,
          service: detail.service, professional: detail.professional ?? null,
        }] : [])

    const items: PrefillItem[] = source
      .filter(gi => gi.status === 'CONFIRMED')
      .map(gi => ({
        bookingId:   gi.id,
        serviceId:   gi.service.id,
        serviceName: gi.service.name,
        duration:    gi.service.duration,
        price:       gi.service.price ?? undefined,
        startTime:   dayjs(gi.startAt).tz('America/Sao_Paulo').format('HH:mm'),
        endTime:     dayjs(gi.endAt).tz('America/Sao_Paulo').format('HH:mm'),
        profId:      gi.professional?.id ?? '',
      }))

    onClose()
    setTimeout(() => {
      openAddService(refId, startT, profId, client, items)
    }, 200)
  }

  async function handleCheckout() {
    if (!detail) return
    setError(null)

    // Se já tem Sale OPEN linkada, vai pro POS ativo (carrinho editável)
    if (detail.sale?.status === 'OPEN') {
      onClose()
      router.push(`/dashboard/caixa?active=${detail.sale.id}`)
      return
    }

    // Se Sale já está CONFIRMED, vai pra detalhe da venda paga (read-only)
    if (detail.sale?.status === 'CONFIRMED') {
      onClose()
      router.push(`/dashboard/caixa/${detail.sale.id}`)
      return
    }

    // Senão, cria Sale OPEN a partir do booking e vai pro POS ativo
    try {
      setCreatingSale(true)
      const res = await api.post('/sales/from-booking', { bookingId })
      const newSale = res.data?.data ?? res.data
      onClose()
      router.push(`/dashboard/caixa?active=${newSale.id}`)
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: string } } }
      setError(e.response?.data?.error ?? 'Erro ao iniciar checkout')
      setCreatingSale(false)
    }
  }

  function handleViewSale() {
    if (!detail?.sale) return
    onClose()
    // VER VENDA → sempre vai pra detalhe da venda (que se for OPEN auto-redireciona pro POS)
    router.push(`/dashboard/caixa/${detail.sale.id}`)
  }

  if (!open || typeof document === 'undefined') return null

  // ─── Render ────────────────────────────────────────────────────────────────
  const status     = detail?.status ?? booking.status as BookingStatus
  const cfg        = STATUS_CFG[status as BookingStatus] ?? STATUS_CFG.CONFIRMED
  const StatusIcon = cfg.icon

  const isConfirmed = status === 'CONFIRMED'
  const isCompleted = status === 'COMPLETED'

  // É data passada? (pra decidir se "Não compareceu" faz sentido)
  const now           = dayjs().tz('America/Sao_Paulo')
  const bookingStartDt = detail?.startAt
    ? dayjs(detail.startAt).tz('America/Sao_Paulo')
    : dayjs.tz(`${dateStr} ${bookingStart}`, 'America/Sao_Paulo')
  const bookingEnded  = bookingStartDt.isBefore(now)

  // Sale info
  const hasOpenSale     = detail?.sale?.status === 'OPEN'
  const checkoutLabel   = hasOpenSale ? 'CONTINUAR CHECKOUT' : 'CHECKOUT'
  const showAnticipated = isConfirmed && !bookingEnded && !hasOpenSale

  const isGroup    = !!(detail?.groupItems && detail.groupItems.length > 1)
  const extras     = detail?.extraServices ?? []
  const price     = detail?.service.price ?? 0
  const displayTotal = detail?.sale ? detail.sale.total : (isGroup ? (detail?.groupTotal ?? 0) : price)
  const profName  = detail?.professional?.name
  const dateLabel = dayjs(detail?.startAt ?? `${dateStr}T${bookingStart}:00`)
    .tz('America/Sao_Paulo').format('ddd, DD [de] MMM [de] YYYY').replace(/^\w/, c => c.toUpperCase())

  const panel = (
    <>
      <style>{`
        @keyframes bvp-sheetIn { from { transform: translateX(100%); opacity: 0 } to { transform: translateX(0); opacity: 1 } }
        @keyframes bvp-sheetUp { from { transform: translateY(100%) } to { transform: translateY(0) } }
        @keyframes bvp-spin    { to { transform: rotate(360deg) } }
        .bvp-alter-btn:hover { background: rgba(255,255,255,0.28) !important }
        .bvp-drop-item:hover { background: rgba(0,0,0,0.04) !important }
        @keyframes bvp-waRing { 0% { box-shadow: 0 0 0 0 rgba(37,211,102,0.5) } 70% { box-shadow: 0 0 0 9px rgba(37,211,102,0) } 100% { box-shadow: 0 0 0 0 rgba(37,211,102,0) } }
        .bvp-wa-pulse { animation: bvp-waRing 2.1s ease-out 3 }
        .bvp-wa:active { transform: scale(0.92) }
        @media (prefers-reduced-motion: reduce) { .bvp-wa-pulse { animation: none } }
      `}</style>

      {confirm === 'cancel' && (
        <ConfirmModal
          title="Cancelar agendamento?"
          body="O horário ficará disponível novamente. Se houver checkout em aberto, ele também será cancelado."
          confirmLabel="Sim, cancelar"
          danger
          onConfirm={handleCancel}
          onCancel={() => setConfirm(null)}
        />
      )}
      {confirm === 'noshow' && (
        <ConfirmModal
          title="Cliente não compareceu?"
          body="O agendamento será marcado como NÃO COMPARECEU."
          confirmLabel="Confirmar"
          onConfirm={handleNoShow}
          onCancel={() => setConfirm(null)}
        />
      )}

      <div onClick={onClose} style={{
        position: 'fixed', inset: 0, zIndex: 9994,
        background: 'rgba(0,0,0,0.18)',
        backdropFilter: 'blur(4px)',
      }}/>

      <div style={{
        position: 'fixed',
        ...(isMobile
          ? {
              left: 0, right: 0, bottom: 0,
              height: '92dvh',
              borderRadius: '22px 22px 0 0',
              animation: 'bvp-sheetUp 0.30s cubic-bezier(0.32,0.72,0,1)',
            }
          : {
              top: 0, right: 0, bottom: 0,
              width: 420,
              animation: 'bvp-sheetIn 0.26s cubic-bezier(0.25,0.46,0.45,0.94)',
            }
        ),
        background: '#f8f8fa',
        boxShadow: isMobile ? '0 -16px 60px rgba(0,0,0,0.16)' : '-16px 0 60px rgba(0,0,0,0.12)',
        zIndex: 9995,
        display: 'flex', flexDirection: 'column',
        fontFamily: typography.fontFamily,
        overflow: 'hidden',
      }}>

        {isMobile && (
          <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 12, paddingBottom: 4, flexShrink: 0 }}>
            <div style={{ width: 36, height: 4, borderRadius: 2, background: 'rgba(0,0,0,0.14)' }}/>
          </div>
        )}

        {/* ── HEADER STATUS ── */}
        <div style={{
          background: cfg.gradient,
          padding: isMobile ? '16px 20px 20px' : '20px 24px 24px',
          flexShrink: 0,
          position: 'relative',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
              <StatusIcon size={15} color="#fff" strokeWidth={2.5}/>
              <span style={{ color: 'rgba(255,255,255,0.95)', fontWeight: 800, fontSize: 12, letterSpacing: '.1em' }}>
                {cfg.label}
              </span>
              {showAnticipated && (
                <span style={{
                  marginLeft: 4,
                  fontSize: 9, fontWeight: 700,
                  color: 'rgba(255,255,255,0.85)',
                  background: 'rgba(255,255,255,0.18)',
                  padding: '2px 7px',
                  borderRadius: 5,
                  letterSpacing: '.06em',
                  border: '1px solid rgba(255,255,255,0.25)',
                  backdropFilter: 'blur(4px)',
                }}>
                  ANTECIPADO
                </span>
              )}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {isConfirmed && (
                <div style={{ position: 'relative' }}>
                  <button
                    className="bvp-alter-btn"
                    onClick={() => setShowAlter(v => !v)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 5,
                      padding: '6px 12px',
                      borderRadius: 10,
                      border: '1.5px solid rgba(255,255,255,0.3)',
                      background: 'rgba(255,255,255,0.15)',
                      color: '#fff',
                      fontSize: 12, fontWeight: 700,
                      cursor: 'pointer',
                      letterSpacing: '.06em',
                      backdropFilter: 'blur(8px)',
                      transition: 'background 0.15s',
                    }}
                  >
                    ALTERAR <ChevronDown size={12} strokeWidth={2.5}/>
                  </button>
                  {showAlter && (
                    <>
                      <div onClick={() => setShowAlter(false)}
                        style={{ position: 'fixed', inset: 0, zIndex: 9996 }}/>
                      <div style={{
                        position: 'absolute', top: 'calc(100% + 8px)', right: 0,
                        width: 240,
                        background: '#fff',
                        borderRadius: 16,
                        boxShadow: '0 20px 60px rgba(0,0,0,0.18)',
                        zIndex: 9997,
                        overflow: 'hidden',
                        border: '1px solid rgba(0,0,0,0.06)',
                      }}>
                        <button className="bvp-drop-item"
                          onClick={() => { setShowAlter(false); handleEdit() }}
                          style={{
                            width: '100%',
                            display: 'flex', alignItems: 'center', gap: 10,
                            padding: '14px 18px',
                            border: 'none',
                            borderBottom: '1px solid rgba(0,0,0,0.06)',
                            background: 'transparent',
                            cursor: 'pointer', textAlign: 'left',
                            color: '#0f0f14',
                            fontSize: 14, fontWeight: 600,
                            fontFamily: typography.fontFamily,
                            transition: 'background 0.12s',
                          }}
                          disabled={hasOpenSale}
                        >
                          <Edit3 size={14} strokeWidth={2}/>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div>Editar agendamento</div>
                            {hasOpenSale && (
                              <div style={{ fontSize: 10, color: colors.gray.dimText, fontWeight: 500, marginTop: 2 }}>
                                Cancele o checkout primeiro
                              </div>
                            )}
                          </div>
                        </button>
                        {bookingEnded && (
                          <button className="bvp-drop-item"
                            onClick={() => { setShowAlter(false); setConfirm('noshow') }}
                            style={{
                              width: '100%',
                              display: 'flex', alignItems: 'center', gap: 10,
                              padding: '14px 18px',
                              border: 'none',
                              borderBottom: '1px solid rgba(0,0,0,0.06)',
                              background: 'transparent',
                              cursor: 'pointer', textAlign: 'left',
                              color: '#374151',
                              fontSize: 14, fontWeight: 600,
                              fontFamily: typography.fontFamily,
                              transition: 'background 0.12s',
                            }}
                          >
                            <User size={14} strokeWidth={2}/>
                            Cliente não compareceu
                          </button>
                        )}
                        <button className="bvp-drop-item"
                          onClick={() => { setShowAlter(false); setConfirm('cancel') }}
                          style={{
                            width: '100%',
                            display: 'flex', alignItems: 'center', gap: 10,
                            padding: '14px 18px',
                            border: 'none',
                            background: 'transparent',
                            cursor: 'pointer', textAlign: 'left',
                            color: colors.red.DEFAULT,
                            fontSize: 14, fontWeight: 600,
                            fontFamily: typography.fontFamily,
                            transition: 'background 0.12s',
                          }}
                        >
                          <Ban size={14} strokeWidth={2}/>
                          Cancelar agendamento
                        </button>
                      </div>
                    </>
                  )}
                </div>
              )}
              <button onClick={onClose} style={{
                width: 30, height: 30, borderRadius: '50%',
                border: '1.5px solid rgba(255,255,255,0.3)',
                background: 'rgba(255,255,255,0.15)',
                cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                backdropFilter: 'blur(8px)',
              }}>
                <X size={14} color="#fff" strokeWidth={2.5}/>
              </button>
            </div>
          </div>

          {/* Cliente */}
          {!loading && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{
                width: 48, height: 48, borderRadius: '50%',
                background: 'rgba(255,255,255,0.22)',
                backdropFilter: 'blur(8px)',
                border: '2px solid rgba(255,255,255,0.35)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
                fontSize: 15, fontWeight: 800,
                color: '#fff',
                letterSpacing: '-0.02em',
              }}>
                {getInitials(detail?.clientName ?? clientName)}
              </div>
              <div>
                <div style={{ fontSize: 17, fontWeight: 800, color: '#fff', letterSpacing: '-0.02em', lineHeight: 1.2 }}>
                  {detail?.clientName ?? clientName}
                </div>
                {detail?.clientPhone && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 3 }}>
                    <Phone size={11} color="rgba(255,255,255,0.7)" strokeWidth={2}/>
                    <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.80)', fontVariantNumeric: 'tabular-nums' }}>
                      {fmtPhone(detail.clientPhone)}
                    </span>
                  </div>
                )}
              </div>
              {detail?.clientPhone && (
                <a
                  href={waLink(detail.clientPhone)}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  aria-label="Abrir conversa no WhatsApp"
                  className={`bvp-wa${status === 'CANCELED' ? '' : ' bvp-wa-pulse'}`}
                  style={{
                    marginLeft: 'auto',
                    width: 46, height: 46, borderRadius: '50%',
                    background: '#fff', flexShrink: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: '0 4px 14px rgba(0,0,0,0.18)',
                    color: '#1ebe5a', textDecoration: 'none',
                    WebkitTapHighlightColor: 'transparent',
                  }}
                >
                  <svg width={24} height={24} viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2 22l5.25-1.38a9.9 9.9 0 0 0 4.79 1.22h.01c5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.82 9.82 0 0 0 12.04 2Zm5.8 14.06c-.25.69-1.45 1.32-1.99 1.4-.51.08-1.16.11-1.87-.12-.43-.14-.99-.32-1.7-.63-2.99-1.29-4.94-4.3-5.09-4.5-.15-.2-1.22-1.62-1.22-3.09 0-1.47.77-2.19 1.04-2.49.27-.3.59-.37.79-.37.2 0 .39 0 .57.01.18.01.43-.07.67.51.25.6.84 2.07.91 2.22.07.15.12.32.02.52-.1.2-.15.32-.3.5-.15.18-.31.4-.45.53-.15.15-.3.31-.13.6.17.3.76 1.25 1.63 2.03 1.12 1 2.07 1.31 2.37 1.46.3.15.47.12.64-.07.17-.2.74-.86.94-1.16.2-.3.4-.25.67-.15.27.1 1.71.81 2 .96.3.15.5.22.57.35.07.12.07.72-.18 1.41Z"/>
                  </svg>
                </a>
              )}
            </div>
          )}
        </div>

        {/* ── BODY ── */}
        <div style={{
          flex: 1, overflowY: 'auto',
          padding: isMobile ? '16px' : '20px',
          display: 'flex', flexDirection: 'column', gap: 12,
        }}>
          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flex: 1, paddingTop: 60 }}>
              <div style={{
                width: 32, height: 32, borderRadius: '50%',
                border: `3px solid ${colors.red.subtle}`,
                borderTopColor: colors.red.DEFAULT,
                animation: 'bvp-spin 0.8s linear infinite',
              }}/>
            </div>
          ) : (
            <>
              {error && (
                <div style={{
                  padding: '10px 12px',
                  background: 'rgba(220,38,38,0.06)',
                  border: `1px solid ${colors.red.border}`,
                  borderRadius: 9,
                  fontSize: 12,
                  color: colors.red.DEFAULT,
                  display: 'flex', alignItems: 'center', gap: 6,
                }}>
                  <AlertCircle size={13} strokeWidth={2}/>
                  {error}
                </div>
              )}

              {/* Card de serviços — lista o grupo quando há múltiplos (estilo Booksy) */}
              {(() => {
                const group = detail && ((detail.groupItems?.length ?? 0) > 1 || extras.length > 0)
                  ? (detail.groupItems ?? [])
                  : null

                if (group) {
                  // ── MODO GRUPO: vários serviços do mesmo agendamento ──
                  return (
                    <div style={{
                      background: '#fff',
                      borderRadius: 18,
                      overflow: 'hidden',
                      boxShadow: '0 2px 16px rgba(0,0,0,0.06)',
                      border: '1px solid rgba(0,0,0,0.06)',
                    }}>
                      {/* Data do grupo */}
                      <div style={{
                        padding: '14px 18px',
                        display: 'flex', alignItems: 'center', gap: 12,
                        borderBottom: '1px solid rgba(0,0,0,0.06)',
                      }}>
                        <div style={{
                          width: 36, height: 36, borderRadius: 10,
                          background: colors.red.subtle,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          flexShrink: 0,
                        }}>
                          <Calendar size={16} color={colors.red.DEFAULT} strokeWidth={2}/>
                        </div>
                        <div>
                          <div style={{ fontSize: 14, fontWeight: 700, color: '#0f0f14' }}>{dateLabel}</div>
                          <div style={{ fontSize: 12, color: colors.gray.dimText, marginTop: 2 }}>
                            {group.length + extras.length} serviços
                          </div>
                        </div>
                      </div>

                      {/* Lista de serviços */}
                      {group.map((it, gi) => {
                        const itStart = dayjs(it.startAt).tz('America/Sao_Paulo').format('HH:mm')
                        const itEnd   = dayjs(it.endAt).tz('America/Sao_Paulo').format('HH:mm')
                        const itPrice = it.service.price ?? 0
                        return (
                          <div key={it.id} style={{
                            padding: '14px 18px',
                            display: 'flex', alignItems: 'flex-start', gap: 10,
                            borderBottom: gi < group.length - 1 ? '1px solid rgba(0,0,0,0.05)' : 'none',
                          }}>
                            <div style={{
                              width: 4, height: 40, borderRadius: 2,
                              background: it.service.color ?? colors.red.DEFAULT,
                              flexShrink: 0,
                            }}/>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{
                                display: 'flex', justifyContent: 'space-between',
                                alignItems: 'baseline', gap: 8,
                              }}>
                                <span style={{
                                  fontSize: 14, fontWeight: 700, color: '#0f0f14',
                                  letterSpacing: '-0.01em',
                                  whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                                }}>
                                  {it.service.name}
                                </span>
                                {itPrice > 0 && (
                                  <span style={{
                                    fontSize: 14, fontWeight: 800, color: '#0f0f14',
                                    fontVariantNumeric: 'tabular-nums', flexShrink: 0,
                                  }}>
                                    R$ {itPrice.toFixed(2).replace('.',',')}
                                  </span>
                                )}
                              </div>
                              <div style={{
                                display: 'flex', alignItems: 'center', gap: 6,
                                marginTop: 3, fontSize: 12, color: colors.gray.dimText,
                                fontVariantNumeric: 'tabular-nums',
                              }}>
                                <Clock size={11} color={colors.gray.dimText} strokeWidth={2}/>
                                {itStart}–{itEnd}
                                {it.professional?.name && (
                                  <>
                                    <span style={{ opacity: 0.4 }}>·</span>
                                    {it.professional.name}
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                        )
                      })}
                      {extras.map((ex) => (
                        <div key={ex.id} style={{
                          padding: '14px 18px',
                          display: 'flex', alignItems: 'flex-start', gap: 10,
                          borderTop: '1px solid rgba(0,0,0,0.05)',
                          background: 'rgba(0,0,0,0.015)',
                        }}>
                          <div style={{
                            width: 4, height: 40, borderRadius: 2,
                            background: colors.gray.borderMd,
                            flexShrink: 0,
                          }}/>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{
                              display: 'flex', justifyContent: 'space-between',
                              alignItems: 'baseline', gap: 8,
                            }}>
                              <span style={{
                                fontSize: 14, fontWeight: 700, color: '#0f0f14',
                                letterSpacing: '-0.01em',
                                whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                              }}>
                                {ex.name}
                              </span>
                              {ex.price > 0 && (
                                <span style={{
                                  fontSize: 14, fontWeight: 800, color: '#0f0f14',
                                  fontVariantNumeric: 'tabular-nums', flexShrink: 0,
                                }}>
                                  R$ {ex.price.toFixed(2).replace('.',',')}
                                </span>
                              )}
                            </div>
                            <div style={{
                              display: 'flex', alignItems: 'center', gap: 6,
                              marginTop: 3, fontSize: 12, color: colors.gray.dimText,
                            }}>
                              <span style={{
                                fontSize: 9, fontWeight: 700,
                                color: '#b45309',
                                background: 'rgba(245,158,11,0.12)',
                                border: '1px solid rgba(245,158,11,0.25)',
                                padding: '1px 6px', borderRadius: 5,
                                letterSpacing: '.04em', textTransform: 'uppercase',
                              }}>
                                no caixa
                              </span>
                              {ex.professional?.name && (
                                <>
                                  <span style={{ opacity: 0.4 }}>·</span>
                                  {ex.professional.name}
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )
                }

                // ── MODO SINGLE: 1 serviço (layout original) ──
                return (
                  <div style={{
                    background: '#fff',
                    borderRadius: 18,
                    overflow: 'hidden',
                    boxShadow: '0 2px 16px rgba(0,0,0,0.06)',
                    border: '1px solid rgba(0,0,0,0.06)',
                  }}>
                    {/* Serviço */}
                    <div style={{
                      padding: '16px 18px',
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      borderBottom: '1px solid rgba(0,0,0,0.06)',
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                        <div style={{
                          width: 4, height: 40, borderRadius: 2,
                          background: detail?.service.color ?? colors.red.DEFAULT,
                          flexShrink: 0,
                        }}/>
                        <div style={{ minWidth: 0 }}>
                          <div style={{
                            fontSize: 15, fontWeight: 700,
                            color: '#0f0f14',
                            letterSpacing: '-0.01em',
                            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                          }}>
                            {detail?.service.name ?? serviceName}
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 3 }}>
                            <Clock size={11} color={colors.gray.dimText} strokeWidth={2}/>
                            <span style={{ fontSize: 12, color: colors.gray.dimText }}>
                              {detail?.service.duration ? `${detail.service.duration}min` : `${bookingStart}–${bookingEnd}`}
                            </span>
                          </div>
                        </div>
                      </div>
                      {price > 0 && (
                        <span style={{
                          fontSize: 17, fontWeight: 800,
                          color: '#0f0f14',
                          fontVariantNumeric: 'tabular-nums',
                          flexShrink: 0, marginLeft: 12,
                        }}>
                          R$ {price.toFixed(2).replace('.',',')}
                        </span>
                      )}
                    </div>

                    {/* Horário */}
                    <div style={{
                      padding: '14px 18px',
                      display: 'flex', alignItems: 'center', gap: 12,
                      borderBottom: profName ? '1px solid rgba(0,0,0,0.06)' : 'none',
                    }}>
                      <div style={{
                        width: 36, height: 36, borderRadius: 10,
                        background: colors.red.subtle,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        flexShrink: 0,
                      }}>
                        <Calendar size={16} color={colors.red.DEFAULT} strokeWidth={2}/>
                      </div>
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 700, color: '#0f0f14' }}>{dateLabel}</div>
                        <div style={{
                          fontSize: 13, color: colors.gray.dimText, marginTop: 2,
                          fontVariantNumeric: 'tabular-nums',
                        }}>
                          {bookingStart} – {bookingEnd}
                        </div>
                      </div>
                    </div>

                    {/* Profissional */}
                    {profName && (
                      <div style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{
                          width: 36, height: 36, borderRadius: 10,
                          background: 'rgba(71,85,105,0.08)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          flexShrink: 0,
                        }}>
                          <User size={16} color="#475569" strokeWidth={2}/>
                        </div>
                        <div>
                          <div style={{
                            fontSize: 11, fontWeight: 700,
                            color: colors.gray.dimText,
                            textTransform: 'uppercase',
                            letterSpacing: '.07em',
                            marginBottom: 2,
                          }}>Profissional</div>
                          <div style={{ fontSize: 14, fontWeight: 600, color: '#0f0f14' }}>{profName}</div>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })()}

              {/* Adicionar serviço ao grupo — só em CONFIRMED e não pago */}
              {isConfirmed && !hasOpenSale && (
                <button
                  onClick={handleAddService}
                  style={{
                    width: '100%',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    padding: '13px',
                    borderRadius: 14,
                    border: `1.5px dashed ${colors.red.border}`,
                    background: colors.red.subtle,
                    color: colors.red.DEFAULT,
                    fontSize: 13, fontWeight: 700,
                    cursor: 'pointer',
                    letterSpacing: '.04em',
                    fontFamily: typography.fontFamily,
                    WebkitTapHighlightColor: 'transparent',
                  }}
                >
                  <Plus size={15} strokeWidth={2.5}/>
                  ADICIONAR MAIS SERVIÇOS
                </button>
              )}

              {/* Card total + status de venda */}
              {(price > 0 || isGroup || !!detail?.sale) && (
                <div style={{
                  background: '#fff',
                  borderRadius: 18,
                  padding: '18px',
                  boxShadow: '0 2px 16px rgba(0,0,0,0.06)',
                  border: '1px solid rgba(0,0,0,0.06)',
                }}>
                  <div style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  }}>
                    <div>
                      <div style={{
                        fontSize: 11, fontWeight: 700,
                        color: colors.gray.dimText,
                        textTransform: 'uppercase',
                        letterSpacing: '.07em',
                        marginBottom: 4,
                      }}>Total</div>
                      <div style={{
                        fontSize: 26, fontWeight: 800,
                        color: '#0f0f14',
                        fontVariantNumeric: 'tabular-nums',
                        letterSpacing: '-0.03em',
                      }}>
                        R$ {displayTotal.toFixed(2).replace('.',',')}
                      </div>
                    </div>
                    {isCompleted && detail?.sale?.confirmedAt ? (
                      <div style={{ textAlign: 'right' }}>
                        <div style={{
                          fontSize: 11, fontWeight: 700,
                          color: colors.gray.dimText,
                          textTransform: 'uppercase',
                          letterSpacing: '.07em',
                          marginBottom: 4,
                        }}>Pago em</div>
                        <div style={{
                          fontSize: 13, fontWeight: 700,
                          color: '#15803d',
                          fontVariantNumeric: 'tabular-nums',
                        }}>
                          {dayjs(detail.sale.confirmedAt).tz('America/Sao_Paulo').format('DD/MM HH:mm')}
                        </div>
                      </div>
                    ) : hasOpenSale ? (
                      <div style={{ textAlign: 'right' }}>
                        <div style={{
                          fontSize: 11, fontWeight: 700,
                          color: '#b45309',
                          textTransform: 'uppercase',
                          letterSpacing: '.07em',
                          marginBottom: 4,
                        }}>Checkout em aberto</div>
                        <div style={{
                          fontSize: 13, fontWeight: 700,
                          color: '#b45309',
                        }}>
                          aguardando pagamento
                        </div>
                      </div>
                    ) : (
                      <div style={{ textAlign: 'right' }}>
                        <div style={{
                          fontSize: 11, fontWeight: 700,
                          color: colors.gray.dimText,
                          textTransform: 'uppercase',
                          letterSpacing: '.07em',
                          marginBottom: 4,
                        }}>A ser pago</div>
                        <div style={{
                          fontSize: 26, fontWeight: 800,
                          color: colors.red.DEFAULT,
                          fontVariantNumeric: 'tabular-nums',
                          letterSpacing: '-0.03em',
                        }}>
                          R$ {displayTotal.toFixed(2).replace('.',',')}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* ── FOOTER ── */}
        {!loading && (
          <div style={{
            padding: isMobile ? `14px 20px max(20px,env(safe-area-inset-bottom))` : '16px 24px',
            borderTop: '1px solid rgba(0,0,0,0.07)',
            background: '#fff',
            flexShrink: 0,
            display: 'flex',
            gap: 10,
          }}>
            {isCompleted ? (
              <>
                <button onClick={onClose} style={{
                  flex: 1, padding: '14px',
                  borderRadius: 14,
                  border: '1.5px solid rgba(0,0,0,0.10)',
                  background: 'transparent',
                  fontSize: 13, fontWeight: 700,
                  cursor: 'pointer',
                  color: '#374151',
                  letterSpacing: '.04em',
                  fontFamily: typography.fontFamily,
                }}>
                  FECHAR
                </button>
                <button onClick={handleViewSale} style={{
                  flex: 2, padding: '14px',
                  borderRadius: 14,
                  border: 'none',
                  background: 'linear-gradient(135deg,#1e293b,#0f172a)',
                  color: '#fff',
                  fontSize: 13, fontWeight: 800,
                  cursor: 'pointer',
                  letterSpacing: '.06em',
                  textTransform: 'uppercase' as const,
                  boxShadow: '0 6px 20px rgba(15,23,42,0.3)',
                  fontFamily: typography.fontFamily,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                }}>
                  <Receipt size={14} strokeWidth={2.5}/>
                  VER VENDA →
                </button>
              </>
            ) : isConfirmed ? (
              <>
                <button onClick={onClose} style={{
                  flex: 1, padding: '14px',
                  borderRadius: 14,
                  border: '1.5px solid rgba(0,0,0,0.10)',
                  background: 'transparent',
                  fontSize: 13, fontWeight: 700,
                  cursor: 'pointer',
                  color: '#374151',
                  letterSpacing: '.04em',
                  fontFamily: typography.fontFamily,
                }}>
                  FECHAR
                </button>
                <button
                  onClick={handleCheckout}
                  disabled={creatingSale}
                  style={{
                    flex: 2, padding: '14px',
                    borderRadius: 14,
                    border: 'none',
                    background: creatingSale
                      ? 'rgba(0,0,0,0.07)'
                      : 'linear-gradient(135deg,#1e293b,#0f172a)',
                    color: creatingSale ? colors.gray.dimText : '#fff',
                    fontSize: 13, fontWeight: 800,
                    cursor: creatingSale ? 'not-allowed' : 'pointer',
                    letterSpacing: '.06em',
                    textTransform: 'uppercase' as const,
                    boxShadow: creatingSale ? 'none' : '0 6px 20px rgba(15,23,42,0.3)',
                    fontFamily: typography.fontFamily,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  }}>
                  {creatingSale ? (
                    <>
                      <Loader2 size={14} style={{ animation: 'bvp-spin 0.8s linear infinite' }}/>
                      ABRINDO...
                    </>
                  ) : (
                    <>
                      <ShoppingBag size={14} strokeWidth={2.5}/>
                      {checkoutLabel} →
                    </>
                  )}
                </button>
              </>
            ) : (
              <button onClick={onClose} style={{
                flex: 1, padding: '14px',
                borderRadius: 14,
                border: '1.5px solid rgba(0,0,0,0.10)',
                background: 'transparent',
                fontSize: 13, fontWeight: 700,
                cursor: 'pointer',
                color: '#374151',
                letterSpacing: '.04em',
                fontFamily: typography.fontFamily,
              }}>
                FECHAR
              </button>
            )}
            {saving && (
              <div style={{
                position: 'absolute', inset: 0,
                background: 'rgba(255,255,255,0.7)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Loader2 size={20} color={colors.red.DEFAULT} style={{ animation: 'bvp-spin 0.8s linear infinite' }}/>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  )

  return createPortal(panel, document.body)
}
