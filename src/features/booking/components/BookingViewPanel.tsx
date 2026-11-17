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
// - jun/2026: bump de legibilidade (nome cliente 18, serviço/data 15, meta 13)

import { useState, useEffect, useCallback, useRef } from 'react'
import { createPortal } from 'react-dom'
import {
  X, AlertTriangle, CheckCircle, Ban, EyeOff, MoreHorizontal, Pencil, // @eligi:bvp-c-icons
  ShoppingBag, Receipt, Loader2, AlertCircle, Plus, Star /* @eligi:plan-intent-bvp-icon */, Repeat /* @eligi:series-bvp-icon */ } from 'lucide-react'
import { useRouter } from 'next/navigation'
import api from '@/shared/lib/apiClient'
import { AgendaBooking } from '@/features/agenda/types'
import { colors, typography } from '@/shared/theme'
import { useIsMobile } from '@/hooks/useIsMobile'
import { useAgendaStore, type PrefillItem } from '@/features/agenda/hooks/useAgendaStore'
import { Sale } from '@/features/sales/types'
import SaleReceiptModal from '@/features/sales/components/SaleReceiptModal'
import NfseBookingAction from '@/features/fiscal/components/NfseBookingAction' // @eligi:nfse-booking-action
import SeriesInfoCard from './SeriesInfoCard' // @eligi:series-bvp-import
import SeriesAdjustMenu from './SeriesAdjustMenu' // @eligi:series-adjust-bvp-import
import { useAuth } from '@/hooks/useAuth'
import { waLink, bookingConfirmationMessage } from '@/shared/utils/whatsapp' // @eligi:bvp-wa-shared-import
import {
  blocksFromSettings,
  useConfirmMessageSettings,
  type ConfirmMessagePayload,
} from '@/features/booking/hooks/useConfirmMessageSettings' // @eligi:confirmsg-bvp-import
import dayjs from 'dayjs'
import 'dayjs/locale/pt-br'
import utc from 'dayjs/plugin/utc'
import timezone from 'dayjs/plugin/timezone'
import { photoBackground } from '@/shared/utils/clientPhoto' // @eligi:client-photo
import BookingNoteCard from './BookingNoteCard' // @eligi:booking-note-bvp-import

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
  clientPhoneMasked?: boolean
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
    avatarUrl?: string | null
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
  productIntents?: ProductIntent[]
  planIntent?:     PlanIntent | null // @eligi:plan-intent-bvp-field
  seriesId?:       string | null     // @eligi:series-bvp-field
  seriesIndex?:    number | null
  internalNote?:   string | null     // @eligi:booking-note-bvp-field — undefined = back antigo (nao mostra)
}

interface ProductIntent {
  id:        string
  productId: string
  name:      string
  unitPrice: number
  quantity:  number
  total:     number
  converted: boolean
}

/* Produtos escolhidos pelo cliente na vitrine do link publico.
   Vive FORA do IIFE de servicos: vale em modo lista e em modo single.
   Azul = veio do link (mesma cor do foguete); ambar continua sendo
   "entrou no caixa" no bloco de servicos avulsos. */
function ProductIntentsCard({ items }: { items: ProductIntent[] }) {
  if (items.length === 0) return null

  return (
    <div style={{
      background: '#fff',
      borderRadius: 18,
      overflow: 'hidden',
      boxShadow: '0 2px 16px rgba(0,0,0,0.06)',
      border: '1px solid rgba(0,0,0,0.06)',
    }}>
      <div style={{
        padding: '14px 18px 10px',
        display: 'flex', alignItems: 'center', gap: 8,
      }}>
        <span style={{
          fontSize: 11, fontWeight: 700,
          color: colors.gray.dimText,
          textTransform: 'uppercase',
          letterSpacing: '.07em',
        }}>Produtos</span>
        <span style={{
          fontSize: 9, fontWeight: 700,
          color: '#1d4ed8',
          background: 'rgba(37,99,235,0.10)',
          border: '1px solid rgba(37,99,235,0.22)',
          padding: '1px 6px', borderRadius: 5,
          letterSpacing: '.04em', textTransform: 'uppercase',
        }}>do link online</span>
      </div>

      {items.map((p) => (
        <div key={p.id} style={{
          padding: '12px 18px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10,
          borderTop: '1px solid rgba(0,0,0,0.06)',
        }}>
          <div style={{ minWidth: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{
              fontSize: 12, fontWeight: 800,
              color: colors.gray.dimText,
              fontVariantNumeric: 'tabular-nums', flexShrink: 0,
            }}>{p.quantity}x</span>
            <span style={{
              fontSize: 15, fontWeight: 700, color: '#0f0f14',
              letterSpacing: '-0.01em',
              whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
            }}>{p.name}</span>
          </div>
          <span style={{
            fontSize: 14, fontWeight: 800, color: '#0f0f14',
            fontVariantNumeric: 'tabular-nums', flexShrink: 0,
          }}>
            R$ {p.total.toFixed(2).replace('.',',')}
          </span>
        </div>
      ))}
    </div>
  )
}

// @eligi:plan-intent-bvp-card
interface PlanIntent {
  id:     string
  kind:   'CLUB' | 'MEMBERSHIP' | 'PACKAGE'
  planId: string
  name:   string
  price:  number
  status: 'PENDING' | 'CONVERTED' | 'DROPPED'
}

const PLAN_KIND_LABEL: Record<PlanIntent['kind'], string> = {
  CLUB:       'Clube',
  MEMBERSHIP: 'Assinatura',
  PACKAGE:    'Pacote',
}

const PLAN_STATUS_LABEL: Record<PlanIntent['status'], string> = {
  PENDING:   'Quer fechar',
  CONVERTED: 'Fechado no caixa',
  DROPPED:   'Não fechou',
}

/* Cliente tocou "Agendar com este plano" no link publico. NAO e venda: e a
   deixa para oferecer o plano no checkout. Estrela ambar = mesmo selo da
   agenda. Preco = o do momento do agendamento (snapshot do servidor). */
function PlanIntentCard({ intent }: { intent: PlanIntent | null }) {
  if (!intent) return null
  const pending = intent.status === 'PENDING'

  return (
    <div style={{
      background: '#fff',
      borderRadius: 18,
      padding: '14px 18px',
      boxShadow: '0 2px 16px rgba(0,0,0,0.06)',
      border: '1px solid rgba(0,0,0,0.06)',
      display: 'flex', alignItems: 'center', gap: 12,
    }}>
      <div aria-hidden style={{
        width: 36, height: 36, borderRadius: 12, flexShrink: 0,
        background: 'rgba(245,158,11,0.12)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <Star size={18} color="#f59e0b" fill="#f59e0b" strokeWidth={2.2} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '.06em', textTransform: 'uppercase', color: '#475569' }}>
          {PLAN_STATUS_LABEL[intent.status]} · {PLAN_KIND_LABEL[intent.kind]}
        </div>
        <div style={{ fontSize: 15, fontWeight: 700, color: '#0f0f14', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {intent.name}
        </div>
        {pending && (
          <div style={{ fontSize: 12.5, color: '#475569', marginTop: 2 }}>
            Escolheu no link de agendamento. Ofereça no checkout.
          </div>
        )}
      </div>
      <span style={{ fontSize: 14, fontWeight: 800, color: '#0f0f14', fontVariantNumeric: 'tabular-nums', flexShrink: 0 }}>
        R$ {intent.price.toFixed(2).replace('.', ',')}{intent.kind === 'CLUB' ? '/mês' : ''}
      </span>
    </div>
  )
}

interface GroupItem {
  id:     string
  startAt: string
  endAt:   string
  status:  BookingStatus
  seriesId?:    string | null  // @eligi:series-group-type (GET /bookings/:id ja devolve)
  seriesIndex?: number | null
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
  /** @eligi:series-adjust-bvp-props — para "mudar este e os proximos" trocar o profissional. */
  professionals?: { id: string; name: string }[]
}

const NO_PROFS: { id: string; name: string }[] = []

function getInitials(n: string) {
  return n.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase()
}
function fmtPhone(p: string) {
  const d = p.replace(/\D/g,'')
  if (d.length === 11) return `(${d.slice(0,2)}) ${d.slice(2,7)}-${d.slice(7)}`
  if (d.length === 10) return `(${d.slice(0,2)}) ${d.slice(2,6)}-${d.slice(6)}`
  return p
}
// @eligi:bvp-confirm-text
/**
 * Texto pre-preenchido do botao de WhatsApp.
 *
 * SO CONFIRMED recebe texto. Mandar "seu horario esta confirmado" num
 * booking cancelado, no-show ou ja finalizado seria constrangedor — nesses
 * estados o botao volta ao comportamento antigo (abre a conversa vazia).
 *
 * Funcao pura de modulo: nao le relogio (so d.startAt), entao pode ser
 * chamada no render sem violar react-hooks/purity.
 */
// @eligi:confirmsg-bvp-build
function buildConfirmText(
  d: BookingDetail,
  s: string,
  cfg: ConfirmMessagePayload | null,
): string | undefined {
  if (s !== 'CONFIRMED') return undefined

  const start = dayjs(d.startAt).tz('America/Sao_Paulo')
  const dateLabel = start.format('dddd, DD/MM').replace(/^\w/, c => c.toUpperCase())
  const timeLabel = start.format('HH:mm')

  const withProf = d.professional?.name ? ` com ${d.professional.name}` : ''
  const siblings = (d.groupItems ?? []).filter(gi => gi.status === 'CONFIRMED').length
  const others = siblings > 1 ? siblings - 1 : 0
  const extra = others > 0
    ? ` e mais ${others} ${others === 1 ? 'serviço' : 'serviços'}`
    : ''

  // cfg null = ainda carregando ou rede caiu: a mensagem sai so com os blocos
  // fixos, que e o comportamento anterior a esta feature. O botao nunca quebra.
  const price = typeof d.service.price === 'number'
    ? d.service.price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
    : null

  return bookingConfirmationMessage({
    clientName:   d.clientName,
    dateLabel,
    timeLabel,
    serviceLabel: `${d.service.name}${withProf}${extra}`,
    blocks: cfg ? blocksFromSettings(cfg.settings, cfg.business, { price }) : undefined,
  })
}

// @eligi:bvp-tone — cor do cartao por estado (as mesmas do painel antigo, em tom
// fechado: texto branco passa AA). Vermelho aqui e estado, nao acao.
const TONE: Record<BookingStatus, { label: string; bg: string; icon: typeof CheckCircle }> = {
  CONFIRMED: { label: 'Confirmado', bg: '#14532d', icon: CheckCircle },
  COMPLETED: { label: 'Pago',       bg: '#1e293b', icon: Receipt },
  CANCELED:  { label: 'Cancelado',  bg: '#991b1b', icon: Ban },
  NO_SHOW:   { label: 'Não veio',   bg: '#92400e', icon: EyeOff },
}
const TZ        = 'America/Sao_Paulo'
const INK       = '#111114'
const INK2      = '#4b4b52'
const INK3      = '#6b6b73'
const LINE      = 'rgba(17,17,20,.08)'
const GREEN_INK = '#0f6e56'
const AMBER     = '#b45309'

function brl(v: number): string {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}
/** Valor com centavos menores (padrao das telas novas). */
function Money({ value, muted }: { value: number; muted?: boolean }) {
  const [int, cents] = value.toFixed(2).split('.')
  const intLabel = Number(int).toLocaleString('pt-BR')
  return (
    <span className="bvp-disp" style={{ fontSize: 24, fontWeight: 600, letterSpacing: '-0.03em', color: muted ? INK3 : INK }}>
      R$ {intLabel}<span style={{ fontSize: 14, color: INK3 }}>,{cents}</span>
    </span>
  )
}
function menuItem(color: string): React.CSSProperties {
  return {
    width: '100%', minHeight: 48, display: 'flex', alignItems: 'center', gap: 10, padding: '0 16px',
    border: 'none', borderBottom: '1px solid rgba(17,17,20,0.06)', background: 'transparent', cursor: 'pointer',
    textAlign: 'left', color, fontSize: 15, fontWeight: 600, fontFamily: typography.fontFamily,
  }
}
function btn2(grow: boolean): React.CSSProperties {
  return {
    ...(grow ? { flex: 1 } : {}), height: 52, padding: '0 18px', borderRadius: 14,
    border: '1px solid rgba(17,17,20,.12)', background: '#fff', color: INK, fontSize: 16, fontWeight: 600,
    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
    fontFamily: typography.fontFamily,
  }
}

// ─── ConfirmModal interno ─────────────────────────────────────────────────────
function ConfirmModal({
  title, body, confirmLabel, danger, onConfirm, onCancel,
}: {
  title: string
  body: string
  confirmLabel: string
  danger?: boolean
  onConfirm: () => void | Promise<void>
  onCancel: () => void
}) {
  // @eligi:bvp-confirm-once — tres toques rapidos no "Sim, cancelar" mandavam
  // tres pedidos (16/11/2026). O ref barra no mesmo quadro; o estado mostra.
  const busyRef = useRef(false)
  const [busy, setBusy] = useState(false)
  function confirmar() {
    if (busyRef.current) return
    busyRef.current = true
    setBusy(true)
    void Promise.resolve(onConfirm()).finally(() => {
      busyRef.current = false
      setBusy(false)
    })
  }
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
        <button onClick={confirmar} disabled={busy} aria-busy={busy} style={{
          width: '100%', padding: '14px', marginBottom: 10, opacity: busy ? 0.6 : 1,
          background: danger ? colors.red.gradient : 'linear-gradient(135deg,#475569,#334155)',
          color: '#fff', border: 'none', borderRadius: 14,
          fontWeight: 700, fontSize: 14, cursor: busy ? 'default' : 'pointer',
          letterSpacing: '.06em', textTransform: 'uppercase' as const,
          boxShadow: danger ? `0 6px 20px rgba(220,38,38,0.3)` : '0 6px 20px rgba(71,85,105,0.25)',
        }}>
          {busy ? 'Aguarde…' : confirmLabel}
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
export default function BookingViewPanel({ booking, date, open, onClose, professionals = NO_PROFS /* @eligi:series-adjust-bvp-arg */ }: Props) {
  const router   = useRouter()
  const isMobile = useIsMobile()
  const { removeBooking, updateBooking, openAddService } = useAgendaStore()
  const dateStr  = dayjs(date).format('YYYY-MM-DD')

  const [detail,    setDetail]    = useState<BookingDetail | null>(null)
  const [loading,   setLoading]   = useState(true)
  const [showAlter, setShowAlter] = useState(false)
  const [confirm,   setConfirm]   = useState<'cancel' | 'noshow' | 'cancelSeries' /* @eligi:series-bvp-confirm */ | 'skipDay' | 'stopSeries' /* @eligi:series-adjust-bvp-confirm */ | null>(null)
  const [seriesVersion, setSeriesVersion] = useState(0)
  // @eligi:series-adjust-bvp-state — menu da serie. So dono/gerente: as rotas
  // /bookings/series sao managerOrAbove; os outros cargos editam so o dia.
  const [seriesMenu, setSeriesMenu] = useState<'edit' | 'full' | null>(null)
  const { user: authUser } = useAuth()
  const canManageSeries = authUser?.role === 'BUSINESS_OWNER' || authUser?.role === 'MANAGER'
  // @eligi:series-group-anchor — a ocorrencia da serie e a "dona" do grupo:
  // clicar no corte adicionado ao lado age sobre a serie do mesmo jeito que
  // clicar no card da serie. Preferimos a CONFIRMED.
  const seriesAnchor: { id: string; seriesId: string; seriesIndex: number | null; startAt: string; endAt: string; professionalId: string; status: BookingStatus } | null = (() => {
    if (!detail) return null
    if (detail.seriesId) {
      return {
        id: detail.id, seriesId: detail.seriesId, seriesIndex: detail.seriesIndex ?? null,
        startAt: detail.startAt, endAt: detail.endAt,
        professionalId: detail.professionalId ?? booking.professionalId ?? '', status: detail.status,
      }
    }
    const items = detail.groupItems ?? []
    const gi = items.find(g => g.seriesId && g.status === 'CONFIRMED') ?? items.find(g => g.seriesId)
    if (!gi || !gi.seriesId) return null
    return {
      id: gi.id, seriesId: gi.seriesId, seriesIndex: gi.seriesIndex ?? null,
      startAt: gi.startAt, endAt: gi.endAt, professionalId: gi.professional?.id ?? '', status: gi.status,
    }
  })()
  const [saving,    setSaving]    = useState(false)
  const [error,     setError]     = useState<string | null>(null)
  const [creatingSale, setCreatingSale] = useState(false)
  const [receiptSale, setReceiptSale] = useState<Sale | null>(null)
  const [loadingReceipt, setLoadingReceipt] = useState(false)
  const msgCfg = useConfirmMessageSettings() // @eligi:confirmsg-bvp-state

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
      const e = err as { response?: { data?: { error?: string; code?: string } } }
      // @eligi:bvp-already-canceled — outra aba ou outra pessoa ja cancelou: o
      // resultado e o mesmo que o pedido, entao fecha como sucesso.
      if (e.response?.data?.code === 'BOOKING_ALREADY_CANCELED') {
        removeBooking(dateStr, bookingId)
        setConfirm(null)
        onClose()
        return
      }
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
      const e = err as { response?: { data?: { error?: string; code?: string } } }
      if (e.response?.data?.code === 'BOOKING_ALREADY_NO_SHOW') { // @eligi:bvp-already-noshow
        updateBooking(dateStr, { ...booking, status: 'NO_SHOW' })
        setDetail(prev => prev ? { ...prev, status: 'NO_SHOW' } : prev)
        setConfirm(null)
        setSaving(false)
        return
      }
      setError(e.response?.data?.error ?? 'Erro ao marcar não compareceu')
      setSaving(false)
    }
  }

  // @eligi:series-bvp-cancel — este e os proximos (so CONFIRMED futuro e sem
  // pagamento; o back devolve em keptIds o que ficou por ter dinheiro).
  async function handleCancelSeries() {
    const seriesId = seriesAnchor?.seriesId // @eligi:series-group-cancel
    const fromId = seriesAnchor?.id
    if (!seriesId || !fromId) return
    try {
      setSaving(true)
      setError(null)
      const res = await api.post(`/bookings/series/${seriesId}/cancel`, { fromBookingId: fromId }) // @eligi:series-group-fromcancel
      const out = (res.data?.data ?? res.data) as { canceledIds?: string[]; keptIds?: string[] }
      for (const id of out.canceledIds ?? []) removeBooking(dateStr, id)
      setConfirm(null)
      setSaving(false)
      const kept = out.keptIds?.length ?? 0
      if (kept > 0) {
        setSeriesVersion(v => v + 1)
        setError(`${kept} ${kept === 1 ? 'agendamento com pagamento ficou' : 'agendamentos com pagamento ficaram'} de fora. Cancele pelo caixa, se for o caso.`)
        return
      }
      onClose()
    } catch (err: unknown) {
      const e = err as { response?: { status?: number; data?: { error?: string } } }
      setConfirm(null)
      setError(e.response?.status === 403
        ? 'Só o dono ou o gerente pode encerrar a série.'
        : (e.response?.data?.error ?? 'Erro ao cancelar a série'))
      setSaving(false)
    }
  }

  // @eligi:series-adjust-bvp-stop — "parar de repetir": este fica, os proximos saem.
  async function handleStopSeries() {
    const seriesId = seriesAnchor?.seriesId // @eligi:series-group-stop
    const fromId = seriesAnchor?.id
    if (!seriesId || !fromId) return
    try {
      setSaving(true)
      setError(null)
      const res = await api.post(`/bookings/series/${seriesId}/cancel`, { fromBookingId: fromId, keepFrom: true }) // @eligi:series-group-fromstop
      const out = (res.data?.data ?? res.data) as { canceledIds?: string[]; keptIds?: string[] }
      for (const id of out.canceledIds ?? []) removeBooking(dateStr, id)
      setConfirm(null)
      setSaving(false)
      setSeriesVersion(v => v + 1)
      const kept = out.keptIds?.length ?? 0
      if (kept > 0) {
        setError(`A série parou. ${kept} ${kept === 1 ? 'data com pagamento ficou' : 'datas com pagamento ficaram'} na agenda. Cancele pelo caixa, se for o caso.`)
      }
    } catch (err: unknown) {
      const e = err as { response?: { status?: number; data?: { error?: string } } }
      setConfirm(null)
      setError(e.response?.status === 403
        ? 'Só o dono ou o gerente pode encerrar a série.'
        : (e.response?.data?.error ?? 'Erro ao parar a série'))
      setSaving(false)
    }
  }

  // Editar uma ocorrencia da serie SEMPRE pergunta: so neste dia ou os proximos.
  function handleEditClick() {
    if (seriesAnchor && canManageSeries) { // @eligi:series-group-edit
      setSeriesMenu('edit')
      return
    }
    handleAddService()
  }

  // @eligi:series-group-skip — "pular este dia" cancela a OCORRENCIA DA SERIE,
  // mesmo quando o painel foi aberto pelo servico extra do grupo.
  async function handleSkipSeriesDay() {
    const targetId = seriesAnchor?.id
    if (!targetId) return
    if (targetId === bookingId) { await handleCancel(); return }
    try {
      setSaving(true)
      setError(null)
      await api.patch(`/bookings/${targetId}/cancel`)
      removeBooking(dateStr, targetId)
      setConfirm(null)
      setSaving(false)
      await fetchDetail()
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: string } } }
      setConfirm(null)
      setError(e.response?.data?.error ?? 'Erro ao pular este dia')
      setSaving(false)
    }
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

  async function openReceipt() {
    if (!detail?.sale || loadingReceipt) return
    const saleId = detail.sale.id
    try {
      setLoadingReceipt(true)
      const res = await api.get(`/sales/${saleId}`)
      setReceiptSale(res.data?.data ?? res.data)
    } catch {
      onClose()
      router.push(`/dashboard/caixa/${saleId}`)
    } finally {
      setLoadingReceipt(false)
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
  const showAnticipated = isConfirmed && !bookingEnded && !hasOpenSale

  const isGroup    = !!(detail?.groupItems && detail.groupItems.length > 1)
  const extras     = detail?.extraServices ?? []
  const products     = detail?.productIntents ?? []
  const productsTotal = products.reduce((s, p) => s + p.total, 0)
  const price     = detail?.service.price ?? 0
  const displayTotal = detail?.sale ? detail.sale.total : ((isGroup ? (detail?.groupTotal ?? 0) : price) + productsTotal)

  // @eligi:bvp-c-final — direcao C final (16/11/2026): cartao com a cor do
  // estado, servicos como recibo com o traco da cor do servico, nota da equipe.
  const tone       = TONE[status as BookingStatus] ?? TONE.CONFIRMED
  const ToneIcon   = tone.icon
  const isPaidSale = isCompleted && !!detail?.sale?.confirmedAt
  const toneLabel  = status === 'COMPLETED' && !isPaidSale ? 'Finalizado' : tone.label
  const rows: GroupItem[] = detail
    ? ((detail.groupItems?.length ?? 0) > 0
        ? (detail.groupItems ?? [])
        : [{ id: detail.id, startAt: detail.startAt, endAt: detail.endAt, status: detail.status, service: detail.service, professional: detail.professional ?? null }])
    : []
  const spanStart = rows.length ? dayjs(rows[0].startAt).tz(TZ).format('HH:mm') : bookingStart
  const spanEnd   = rows.length
    ? rows.reduce((m, r) => (dayjs(r.endAt).isAfter(dayjs(m)) ? r.endAt : m), rows[0].endAt)
    : null
  const spanEndLabel = spanEnd ? dayjs(spanEnd).tz(TZ).format('HH:mm') : bookingEnd
  const dayShort = bookingStartDt.format('ddd, DD MMM').replace('.', '').replace(/^\w/, c => c.toUpperCase())
  const paidAt   = detail?.sale?.confirmedAt ? dayjs(detail.sale.confirmedAt).tz(TZ) : null
  const subLine = [
    dayShort,
    status === 'CONFIRMED'
      ? (hasOpenSale ? 'checkout em aberto' : (booking.fromOnline ? 'pelo link' : null))
      : status === 'COMPLETED'
        ? (paidAt ? `pago ${paidAt.isSame(bookingStartDt, 'day') ? 'às' : `em ${paidAt.format('DD/MM')} às`} ${paidAt.format('HH:mm')}` : null)
        : status === 'CANCELED' ? 'não ocupa a agenda' : 'marcado como não veio',
  ].filter(Boolean).join(' · ')
  const showTotals = price > 0 || isGroup || !!detail?.sale || products.length > 0 || extras.length > 0
  const totalTone = isPaidSale
    ? { label: 'Pago', color: GREEN_INK }
    : hasOpenSale
      ? { label: 'Checkout em aberto', color: AMBER }
      : status === 'CANCELED' || status === 'NO_SHOW'
        ? { label: 'Não cobrado', color: status === 'NO_SHOW' ? AMBER : INK3 }
        : { label: 'Total previsto', color: INK2 }
  const totalMuted = (status === 'CANCELED' || status === 'NO_SHOW') && !detail?.sale
  const displayClientName = detail?.clientName ?? clientName
  const avatarBg = photoBackground(detail?.client?.avatarUrl)
  const canEditServices = isConfirmed && !hasOpenSale

  const panel = (
    <>
      {receiptSale && (
        <SaleReceiptModal
          sale={receiptSale}
          mode="send"
          isMobile={isMobile}
          onClose={() => setReceiptSale(null)}
        />
      )}
      <style>{`
        @keyframes bvp-sheetIn { from { transform: translateX(100%); opacity: 0 } to { transform: translateX(0); opacity: 1 } }
        @keyframes bvp-sheetUp { from { transform: translateY(100%) } to { transform: translateY(0) } }
        @keyframes bvp-spin    { to { transform: rotate(360deg) } }
        .bvp-ghost-dark:hover { background: rgba(255,255,255,0.24) !important }
        .bvp-drop-item:hover { background: rgba(17,17,20,0.04) !important }
        .bvp-btn2:hover { background: #f5f5f7 !important }
        .bvp-btn1:hover:not(:disabled) { background: #26262c !important }
        @keyframes bvp-waRing { 0% { box-shadow: 0 0 0 0 rgba(255,255,255,0.55) } 70% { box-shadow: 0 0 0 9px rgba(255,255,255,0) } 100% { box-shadow: 0 0 0 0 rgba(255,255,255,0) } }
        .bvp-wa-pulse { animation: bvp-waRing 2.1s ease-out 3 }
        .bvp-wa:active { transform: scale(0.92) }
        .bvp-mono { font-family: ${typography.fontFamilyMono}; }
        .bvp-disp { font-family: ${typography.fontFamilyDisplay}; font-variant-numeric: tabular-nums; }
        @media (prefers-reduced-motion: reduce) { .bvp-wa-pulse { animation: none } }
        @media (max-width: 379px) { .bvp-antecip { display: none } }
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
      {confirm === 'cancelSeries' && ( /* @eligi:series-bvp-modal */
        <ConfirmModal
          title="Cancelar este e os próximos?"
          body="Este horário e as próximas datas da série serão cancelados e a série termina aqui. Datas já atendidas ou pagas não mudam."
          confirmLabel="Sim, cancelar"
          danger
          onConfirm={handleCancelSeries}
          onCancel={() => setConfirm(null)}
        />
      )}
      {confirm === 'skipDay' && ( /* @eligi:series-adjust-bvp-modals */
        <ConfirmModal
          title="Pular este dia?"
          body="Só este horário sai da agenda. As próximas datas da série continuam. Se houver checkout em aberto, ele também será cancelado."
          confirmLabel="Sim, pular"
          danger
          onConfirm={handleSkipSeriesDay /* @eligi:series-group-callskip */}
          onCancel={() => setConfirm(null)}
        />
      )}
      {confirm === 'stopSeries' && (
        <ConfirmModal
          title="Parar de repetir?"
          body="Este agendamento continua. As próximas datas da série são canceladas e ela termina aqui. Datas já pagas não mudam."
          confirmLabel="Sim, parar"
          danger
          onConfirm={handleStopSeries}
          onCancel={() => setConfirm(null)}
        />
      )}
      {seriesMenu && seriesAnchor && ( /* @eligi:series-group-menu */
        <SeriesAdjustMenu
          variant={seriesMenu}
          seriesId={seriesAnchor.seriesId}
          bookingId={seriesAnchor.id}
          startAt={seriesAnchor.startAt}
          endAt={seriesAnchor.endAt}
          professionalId={seriesAnchor.professionalId}
          professionals={professionals}
          isMobile={isMobile}
          onClose={() => setSeriesMenu(null)}
          onEditOnlyThis={handleAddService}
          onSkipThis={() => setConfirm('skipDay')}
          onStopRepeat={() => setConfirm('stopSeries')}
          onCancelFromHere={() => setConfirm('cancelSeries')}
          onMoved={() => { setSeriesMenu(null); onClose() }}
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
      <div role="dialog" aria-modal="true" aria-label={`Agendamento de ${displayClientName}`} style={{
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
              width: 468,
              animation: 'bvp-sheetIn 0.26s cubic-bezier(0.25,0.46,0.45,0.94)',
            }
        ),
        background: '#f8f8fa',
        boxShadow: isMobile ? '0 -16px 60px rgba(0,0,0,0.16)' : '-16px 0 60px rgba(0,0,0,0.12)',
        zIndex: 9995,
        display: 'flex', flexDirection: 'column',
        fontFamily: typography.fontFamily,
        color: INK,
        overflow: 'hidden',
      }}>
        {isMobile && (
          <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 10, paddingBottom: 2, flexShrink: 0 }}>
            <div style={{ width: 36, height: 4, borderRadius: 2, background: 'rgba(0,0,0,0.14)' }}/>
          </div>
        )}

        {/* ── CARTAO DO HORARIO (cor = estado) ── */}
        <div style={{
          margin: isMobile ? '8px 16px 0' : '16px 20px 0',
          background: tone.bg,
          borderRadius: 20,
          padding: 16,
          color: '#fff',
          flexShrink: 0,
          transition: 'background 0.25s',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: 7, height: 32, padding: '0 12px 0 10px', flexShrink: 0, whiteSpace: 'nowrap',
              borderRadius: 999, background: 'rgba(255,255,255,0.16)', color: '#fff', fontSize: 15, fontWeight: 600,
            }}>
              <ToneIcon size={16} strokeWidth={2.4} aria-hidden/>
              {toneLabel}
            </span>
            {showAnticipated && (
              <span className="bvp-mono bvp-antecip" style={{
                fontSize: 11, letterSpacing: '.06em', color: 'rgba(255,255,255,0.85)',
                border: '1px solid rgba(255,255,255,0.3)', borderRadius: 6, padding: '3px 7px',
              }}>ANTECIPADO</span>
            )}
            <span style={{ flex: 1 }}/>
            {isConfirmed && (
              <div style={{ position: 'relative' }}>
                <button type="button" className="bvp-ghost-dark" aria-label="Mais ações" aria-expanded={showAlter}
                  onClick={() => setShowAlter(v => !v)}
                  style={{ width: 44, height: 44, flexShrink: 0, borderRadius: 12, border: 'none', background: 'rgba(255,255,255,0.14)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                  <MoreHorizontal size={20} strokeWidth={2.2}/>
                </button>
                {showAlter && (
                  <>
                    <div onClick={() => setShowAlter(false)} style={{ position: 'fixed', inset: 0, zIndex: 9996 }}/>
                    <div role="menu" style={{
                      position: 'absolute', top: 'calc(100% + 8px)', right: 0, width: 252,
                      background: '#fff', borderRadius: 16, boxShadow: '0 20px 60px rgba(0,0,0,0.18)',
                      zIndex: 9997, overflow: 'hidden', border: '1px solid rgba(17,17,20,0.06)',
                    }}>
                      {bookingEnded && (
                        <button type="button" role="menuitem" className="bvp-drop-item"
                          onClick={() => { setShowAlter(false); setConfirm('noshow') }}
                          style={menuItem(INK)}>
                          <EyeOff size={16} strokeWidth={2}/>
                          Cliente não compareceu
                        </button>
                      )}
                      {seriesAnchor && canManageSeries && ( /* @eligi:series-bvp-menu @eligi:series-adjust-bvp-menugate @eligi:series-group-alter */
                        <button type="button" role="menuitem" className="bvp-drop-item"
                          onClick={() => { setShowAlter(false); setConfirm('cancelSeries') }}
                          style={menuItem(colors.red.DEFAULT)}>
                          <Repeat size={16} strokeWidth={2}/>
                          Cancelar este e os próximos
                        </button>
                      )}
                      <button type="button" role="menuitem" className="bvp-drop-item"
                        onClick={() => { setShowAlter(false); setConfirm('cancel') }}
                        style={{ ...menuItem(colors.red.DEFAULT), borderBottom: 'none' }}>
                        <Ban size={16} strokeWidth={2}/>
                        Cancelar agendamento
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}
            <button type="button" className="bvp-ghost-dark" aria-label="Fechar" onClick={onClose}
              style={{ width: 44, height: 44, flexShrink: 0, borderRadius: 12, border: 'none', background: 'rgba(255,255,255,0.14)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
              <X size={19} strokeWidth={2.2}/>
            </button>
          </div>

          <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.78)', marginTop: 10 }}>{subLine}</div>
          <div className="bvp-disp" style={{
            fontSize: 36, fontWeight: 600, letterSpacing: '-0.04em', lineHeight: 1.1, marginTop: 2, color: '#fff',
            textDecoration: status === 'CANCELED' ? 'line-through' : 'none',
            textDecorationColor: 'rgba(255,255,255,0.55)',
          }}>
            {spanStart} – {spanEndLabel}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 12 }}>
            <div aria-hidden style={{
              width: 40, height: 40, borderRadius: 12, flexShrink: 0, overflow: 'hidden',
              background: 'rgba(255,255,255,0.16)', color: '#fff', fontWeight: 600, fontSize: 15,
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: typography.fontFamilyDisplay,
            }}>
              {avatarBg
                ? <span style={{ width: '100%', height: '100%', background: avatarBg }}/>
                : getInitials(displayClientName)}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 16, fontWeight: 600, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {displayClientName}
              </div>
              {detail?.clientPhone ? (
                <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.78)', fontVariantNumeric: 'tabular-nums' }}>
                  {fmtPhone(detail.clientPhone)}
                </div>
              ) : detail?.clientPhoneMasked ? (
                <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', letterSpacing: '0.12em' }}>••••••••</div>
              ) : null}
            </div>
            {detail?.clientPhone && (
              <a
                href={waLink(detail.clientPhone, buildConfirmText(detail, status, msgCfg))}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                aria-label="Abrir conversa no WhatsApp"
                className={`bvp-wa${status === 'CANCELED' ? '' : ' bvp-wa-pulse'}`}
                style={{
                  width: 44, height: 44, borderRadius: 12, background: '#fff', flexShrink: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: '#1ebe5a', textDecoration: 'none', WebkitTapHighlightColor: 'transparent',
                }}
              >
                <svg width={22} height={22} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                  <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2 22l5.25-1.38a9.9 9.9 0 0 0 4.79 1.22h.01c5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.82 9.82 0 0 0 12.04 2Zm5.8 14.06c-.25.69-1.45 1.32-1.99 1.4-.51.08-1.16.11-1.87-.12-.43-.14-.99-.32-1.7-.63-2.99-1.29-4.94-4.3-5.09-4.5-.15-.2-1.22-1.62-1.22-3.09 0-1.47.77-2.19 1.04-2.49.27-.3.59-.37.79-.37.2 0 .39 0 .57.01.18.01.43-.07.67.51.25.6.84 2.07.91 2.22.07.15.12.32.02.52-.1.2-.15.32-.3.5-.15.18-.31.4-.45.53-.15.15-.3.31-.13.6.17.3.76 1.25 1.63 2.03 1.12 1 2.07 1.31 2.37 1.46.3.15.47.12.64-.07.17-.2.74-.86.94-1.16.2-.3.4-.25.67-.15.27.1 1.71.81 2 .96.3.15.5.22.57.35.07.12.07.72-.18 1.41Z"/>
                </svg>
              </a>
            )}
          </div>
        </div>

        {/* ── CORPO ── */}
        <div style={{
          flex: 1, overflowY: 'auto',
          padding: isMobile ? '12px 16px 16px' : '12px 20px 20px',
          display: 'flex', flexDirection: 'column', gap: 12,
        }}>
          {loading ? (
            <div aria-busy="true" style={{ display: 'flex', flexDirection: 'column', gap: 10, paddingTop: 4 }}>
              {[72, 72, 52].map((h, i) => (
                <div key={i} style={{ height: h, borderRadius: 16, background: 'linear-gradient(90deg,#ececf0,#f4f4f7,#ececf0)', backgroundSize: '200% 100%', animation: 'bvp-shimmer 1.2s linear infinite' }}/>
              ))}
              <style>{`@keyframes bvp-shimmer{from{background-position:200% 0}to{background-position:-200% 0}}`}</style>
            </div>
          ) : (
            <>
              {error && (
                <div role="alert" style={{
                  padding: '10px 12px', background: 'rgba(220,38,38,0.06)', border: `1px solid ${colors.red.border}`,
                  borderRadius: 12, fontSize: 14, color: '#b91c1c', display: 'flex', alignItems: 'center', gap: 8,
                }}>
                  <AlertCircle size={16} strokeWidth={2}/>
                  {error}
                </div>
              )}

              {seriesAnchor && ( /* @eligi:series-bvp-card @eligi:series-group-card */
                <SeriesInfoCard
                  seriesId={seriesAnchor.seriesId}
                  seriesIndex={seriesAnchor.seriesIndex}
                  bookingId={seriesAnchor.id}
                  version={seriesVersion}
                  onAdjust={canManageSeries && seriesAnchor.status === 'CONFIRMED' /* @eligi:series-adjust-bvp-card */ ? () => setSeriesMenu('full') : undefined}
                />
              )}

              {/* Servicos como recibo; o traco e a cor do servico na agenda */}
              <div style={{ background: '#fff', borderRadius: 16, padding: '4px 14px', boxShadow: `inset 0 0 0 1px ${LINE}` }}>
                {rows.map(it => {
                  const s = dayjs(it.startAt).tz(TZ).format('HH:mm')
                  const e = dayjs(it.endAt).tz(TZ).format('HH:mm')
                  const p = it.service.price ?? 0
                  return (
                    <div key={it.id} style={{
                      display: 'flex', alignItems: 'center', gap: 10, padding: '11px 0',
                      borderBottom: `1px dashed ${LINE}`, opacity: status === 'CANCELED' ? 0.55 : 1,
                    }}>
                      <span aria-hidden style={{ width: 4, alignSelf: 'stretch', minHeight: 36, borderRadius: 2, background: it.service.color ?? colors.gray.borderMd, flexShrink: 0 }}/>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 15, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{it.service.name}</div>
                        <div style={{ fontSize: 13, color: INK2, marginTop: 1 }}>
                          <span className="bvp-mono" style={{ fontVariantNumeric: 'tabular-nums' }}>{s}–{e}</span>
                          {it.professional?.name ? ` · ${it.professional.name}` : ''}
                        </div>
                      </div>
                      {p > 0 && <span className="bvp-disp" style={{ fontSize: 15, fontWeight: 600, flexShrink: 0 }}>{brl(p)}</span>}
                    </div>
                  )
                })}
                {extras.map(ex => (
                  <div key={ex.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 0', borderBottom: `1px dashed ${LINE}` }}>
                    <span aria-hidden style={{ width: 4, alignSelf: 'stretch', minHeight: 36, borderRadius: 2, background: colors.gray.borderMd, flexShrink: 0 }}/>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 15, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{ex.name}</div>
                      <div style={{ fontSize: 13, color: INK2, marginTop: 1, display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span className="bvp-mono" style={{ fontSize: 11, letterSpacing: '.04em', color: AMBER, background: '#fffbeb', border: '1px solid rgba(180,83,9,0.2)', padding: '1px 6px', borderRadius: 5 }}>NO CAIXA</span>
                        {ex.professional?.name ?? ''}
                      </div>
                    </div>
                    {ex.price > 0 && <span className="bvp-disp" style={{ fontSize: 15, fontWeight: 600, flexShrink: 0 }}>{brl(ex.price)}</span>}
                  </div>
                ))}
                {showTotals ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 0 10px', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 14, fontWeight: 600, color: totalTone.color }}>{totalTone.label}</span>
                    <span style={{ flex: 1 }}/>
                    <Money value={displayTotal} muted={totalMuted}/>
                    {isPaidSale && detail?.sale?.id && (
                      <div style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 12, flexWrap: 'wrap' }}>
                        {/* @eligi:nfse-booking-total — a nota vive aqui (atendimento pago vira COMPLETED). */}
                        <NfseBookingAction saleId={detail.sale.id} saleConfirmedAt={detail.sale.confirmedAt ?? null} variant="inline"/>
                        <button type="button" onClick={openReceipt} disabled={loadingReceipt}
                          style={{ height: 40, padding: '0 4px', border: 'none', background: 'transparent', color: INK, fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: typography.fontFamily, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                          {loadingReceipt ? <Loader2 size={15} style={{ animation: 'bvp-spin 0.8s linear infinite' }}/> : <Receipt size={15}/>}
                          Ver recibo
                        </button>
                      </div>
                    )}
                  </div>
                ) : <div style={{ height: 6 }}/>}
              </div>

              {canEditServices && (
                <button type="button" onClick={handleEditClick /* @eligi:series-adjust-bvp-edit */}
                  style={{ alignSelf: 'flex-start', height: 44, padding: '0 6px', border: 'none', background: 'transparent', color: INK, fontSize: 14, fontWeight: 600, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6, fontFamily: typography.fontFamily }}>
                  <Plus size={17} strokeWidth={2.2}/>
                  Somar ou editar serviço
                </button>
              )}

              <PlanIntentCard intent={detail?.planIntent ?? null} /> {/* @eligi:plan-intent-bvp-render */}
              <ProductIntentsCard items={products} />
              {detail && detail.internalNote !== undefined && ( /* @eligi:booking-note-bvp-render */
                <BookingNoteCard
                  bookingId={detail.id}
                  note={detail.internalNote}
                  onSaved={note => setDetail(prev => prev ? { ...prev, internalNote: note } : prev)}
                />
              )}
            </>
          )}
        </div>

        {/* ── RODAPE ── */}
        {!loading && (isConfirmed || isCompleted) && (
          <div style={{
            padding: isMobile ? '12px 16px max(16px,env(safe-area-inset-bottom))' : '12px 20px 20px',
            borderTop: `1px solid ${LINE}`, background: '#fff', flexShrink: 0, display: 'flex', gap: 8,
          }}>
            {isCompleted ? (
              <button type="button" className="bvp-btn2" onClick={handleViewSale} disabled={!detail?.sale} style={btn2(true)}>
                <Receipt size={18} strokeWidth={2}/>
                Ver venda
              </button>
            ) : (
              <>
                {canEditServices && (
                  <button type="button" className="bvp-btn2" onClick={handleEditClick} style={btn2(false)}>
                    <Pencil size={17} strokeWidth={2}/>
                    Editar
                  </button>
                )}
                <button type="button" className="bvp-btn1" onClick={handleCheckout} disabled={creatingSale}
                  style={{
                    flex: 1, height: 52, borderRadius: 14, border: 'none',
                    background: creatingSale ? '#4b4b52' : INK, color: '#fff',
                    fontSize: 16, fontWeight: 600, cursor: creatingSale ? 'default' : 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontFamily: typography.fontFamily,
                  }}>
                  {creatingSale
                    ? <><Loader2 size={18} style={{ animation: 'bvp-spin 0.8s linear infinite' }}/>Abrindo…</>
                    : <><ShoppingBag size={18} strokeWidth={2}/>{hasOpenSale ? 'Continuar checkout' : 'Checkout'}</>}
                </button>
              </>
            )}
          </div>
        )}

        {saving && (
          <div aria-busy="true" style={{ position: 'absolute', inset: 0, background: 'rgba(255,255,255,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 5 }}>
            <Loader2 size={22} color={INK} style={{ animation: 'bvp-spin 0.8s linear infinite' }}/>
          </div>
        )}
      </div>
    </>
  )

  return createPortal(panel, document.body)
}
