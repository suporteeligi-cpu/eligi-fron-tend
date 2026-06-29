'use client'
// src/features/sales/components/SaleReceiptModal.tsx
//
// Recibo pós-venda / comprovante. Lê de `Sale` (items + payments + totais).
// Dois modos:
//   - 'full': aberto após confirmar a venda (PaymentModal). Tem "Ir para a agenda"
//             + auto-retorno por inatividade (pausa quando a aba perde o foco).
//   - 'send': aberto pelo card de total do BookingViewPanel. Sem botão de agenda,
//             sem auto-retorno (não há destino "agenda"). X volta pro chamador.
//
// PR1: ações = WhatsApp + Imprimir. E-mail entra no PR2 (prop enableEmail).
// Tema CLARO (decisão Eli). Sem Tailwind — inline-style + tokens.

import { useEffect, useRef, useState, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { X, Check, Printer, MessageCircle, Mail } from 'lucide-react'
import dayjs from 'dayjs'
import 'dayjs/locale/pt-br'
import utc from 'dayjs/plugin/utc'
import timezone from 'dayjs/plugin/timezone'

import { typography } from '@/shared/theme'
import { Sale } from '@/features/sales/types'
import { formatBRL, shortId, PAYMENT_METHOD_LABEL } from '@/features/sales/utils/format'

dayjs.extend(utc)
dayjs.extend(timezone)
dayjs.locale('pt-br')

// ── tokens locais (CLARO) ──────────────────────────────────────────────────
const R = {
  surface:    '#ffffff',
  ink:        '#1c1c22',
  muted:      '#8a8f9c',
  faint:      '#9aa0ad',
  line:       '#ececef',
  pago:       '#00b80c',
  pagoBg:     'rgba(0,184,12,0.10)',
  brand:      '#dc2626',
  brand2:     '#b91c1c',
  wa:         '#1aa251',
  waBg:       'rgba(37,211,102,0.12)',
  waBorder:   'rgba(37,211,102,0.40)',
  fiscalBg:   'rgba(255,159,10,0.12)',
  fiscalText: '#b45309',
  footBg:     '#fafbfc',
  btnBg:      '#f4f5f7',
  btnBorder:  '#e2e4e9',
  btnInk:     '#3a3f4c',
} as const

// nacional (DDD+numero) -> adiciona DDI Brasil. (dívida: extrair p/ util compartilhada)
function waLink(p: string) {
  let d = (p || '').replace(/\D/g, '')
  if (!d) return ''
  if (d.length <= 11) d = `55${d}`
  return `https://wa.me/${d}`
}

interface BusinessHeader {
  name?:    string | null
  address?: string | null
}

interface Props {
  sale:        Sale
  mode:        'full' | 'send'
  isMobile:    boolean
  business?:   BusinessHeader | null   // cabeçalho "Gil Barber · Rua…" — opcional no PR1
  onClose:     () => void              // 'send': volta pro painel · 'full': fecha
  onGoToAgenda?: () => void            // só 'full'
  enableEmail?: boolean                // PR2 (default false)
  autoReturn?:  boolean                // só 'full' (default true)
  autoReturnMs?: number                // default 5min
}

const SECS_BANNER = 10  // mostra o aviso nos últimos N segundos

export default function SaleReceiptModal({
  sale, mode, isMobile, business, onClose, onGoToAgenda,
  enableEmail = false, autoReturn = true, autoReturnMs = 5 * 60_000,
}: Props) {
  const isFull = mode === 'full'
  const wantsTimer = isFull && autoReturn && !!onGoToAgenda

  const totalSecs = Math.max(SECS_BANNER, Math.round(autoReturnMs / 1000))
  const [secsLeft, setSecsLeft] = useState<number>(() => totalSecs)
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const pausedRef = useRef(false)

  const stop = useCallback(() => {
    if (tickRef.current) { clearInterval(tickRef.current); tickRef.current = null }
  }, [])

  const reset = useCallback(() => {
    if (!wantsTimer) return
    setSecsLeft(totalSecs)
  }, [wantsTimer, totalSecs])

  // Timer de auto-retorno (só modo full). Pausa quando a aba perde o foco
  // (Alt+Tab pro WhatsApp Web / diálogo de impressão) — trava de desktop.
  useEffect(() => {
    if (!wantsTimer) return

    const onHidden = () => { pausedRef.current = document.hidden }
    const onBlur   = () => { pausedRef.current = true }
    const onFocus  = () => { pausedRef.current = false }
    document.addEventListener('visibilitychange', onHidden)
    window.addEventListener('blur', onBlur)
    window.addEventListener('focus', onFocus)

    tickRef.current = setInterval(() => {
      if (pausedRef.current) return
      setSecsLeft(prev => {
        if (prev <= 1) { stop(); onGoToAgenda?.(); return 0 }
        return prev - 1
      })
    }, 1000)

    return () => {
      stop()
      document.removeEventListener('visibilitychange', onHidden)
      window.removeEventListener('blur', onBlur)
      window.removeEventListener('focus', onFocus)
    }
  }, [wantsTimer, stop, onGoToAgenda])

  const handlePrint = useCallback(() => {
    pausedRef.current = true               // não auto-retornar durante a impressão
    if (typeof window !== 'undefined') window.print()
    pausedRef.current = false
  }, [])

  if (typeof document === 'undefined') return null

  // ── dados derivados do Sale ───────────────────────────────────────────────
  const clientName  = sale.client?.name ?? sale.clientName ?? 'Cliente avulso'
  const clientPhone = sale.client?.phone ?? sale.clientPhone ?? ''
  const dateLabel   = sale.confirmedAt
    ? dayjs(sale.confirmedAt).tz('America/Sao_Paulo').format('DD MMM YYYY')
    : dayjs(sale.createdAt).tz('America/Sao_Paulo').format('DD MMM YYYY')

  const showBanner = wantsTimer && secsLeft <= SECS_BANNER

  // ── blocos ────────────────────────────────────────────────────────────────
  const badge = (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 7,
      background: R.pagoBg, color: R.pago,
      fontWeight: 700, fontSize: 12.5, letterSpacing: '.06em',
      padding: '8px 14px', borderRadius: 999,
    }}>
      <Check size={15} strokeWidth={3} /> PAGO
    </span>
  )

  const items = (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {sale.items.map(it => {
        const covered = !!it.appliedPackageCard || !!it.appliedMembershipCard
        const coveredLabel = it.appliedMembershipCard ? 'Coberto por assinatura' : 'Coberto por pacote'
        const prof = it.professional?.name
        return (
          <div key={it.id} style={{ display: 'flex', justifyContent: 'space-between', gap: 14, alignItems: 'flex-start' }}>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 15, fontWeight: 600, color: R.ink }}>{it.name}</div>
              {prof && (
                <div style={{ fontSize: 12, color: R.muted, marginTop: 4 }}>{prof}</div>
              )}
              {covered && (
                <div style={{ fontSize: 11.5, fontWeight: 600, color: R.pago, marginTop: 5 }}>✓ {coveredLabel}</div>
              )}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, whiteSpace: 'nowrap' }}>
              {it.quantity > 1 && <span style={{ fontSize: 13, color: R.muted }}>x{it.quantity}</span>}
              <span style={{ fontSize: 15, fontWeight: 600, color: R.ink, fontVariantNumeric: 'tabular-nums' }}>
                {formatBRL(it.total)}
              </span>
            </div>
          </div>
        )
      })}
    </div>
  )

  const paymentsLine = sale.payments.length > 0 && (
    <div style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
      fontSize: 13, marginTop: 16, paddingTop: 14, borderTop: `1px solid ${R.line}`,
    }}>
      <div>
        <span style={{ fontWeight: 600, color: R.ink }}>Pago</span>
        <span style={{ color: R.muted }}>
          {' · '}{sale.payments.map(p => PAYMENT_METHOD_LABEL[p.method]).join(' + ')}
        </span>
        {sale.confirmedAt && (
          <div style={{ color: R.muted, fontSize: 12, marginTop: 2 }}>
            {dayjs(sale.confirmedAt).tz('America/Sao_Paulo').format('DD/MM/YYYY, HH:mm')}
          </div>
        )}
      </div>
      {sale.payments.length > 1 && (
        <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', gap: 2 }}>
          {sale.payments.map(p => (
            <span key={p.id} style={{ fontSize: 12, color: R.muted, fontVariantNumeric: 'tabular-nums' }}>
              {PAYMENT_METHOD_LABEL[p.method]} {formatBRL(p.amount)}
            </span>
          ))}
        </div>
      )}
    </div>
  )

  const sbtn = (key: string, icon: React.ReactNode, label: string, onClick: () => void, wa = false) => (
    <button
      key={key}
      onClick={onClick}
      style={{
        flex: 1, minWidth: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
        padding: '12px 10px', borderRadius: 12,
        border: `1px solid ${wa ? R.waBorder : R.btnBorder}`,
        background: wa ? R.waBg : R.btnBg,
        color: wa ? R.wa : R.btnInk,
        fontSize: 13, fontWeight: 600, fontFamily: typography.fontFamily,
        cursor: 'pointer', WebkitTapHighlightColor: 'transparent',
      }}
    >
      {icon}{label}
    </button>
  )

  const actions = (
    <>
      {clientPhone && sbtn('wa',
        <MessageCircle size={17} />, 'WhatsApp',
        () => { const l = waLink(clientPhone); if (l) window.open(l, '_blank', 'noopener') }, true)}
      {enableEmail && sbtn('mail', <Mail size={17} />, 'E-mail', () => { /* PR2 */ })}
      {sbtn('print', <Printer size={17} />, 'Imprimir', handlePrint)}
      {isFull && (
        <button
          onClick={() => { stop(); onGoToAgenda?.() }}
          style={{
            flexShrink: 0, whiteSpace: 'nowrap', border: 'none', borderRadius: 12,
            padding: '13px 22px',
            fontFamily: typography.fontFamily, fontWeight: 700, fontSize: 14.5, color: '#fff',
            background: `linear-gradient(135deg, ${R.brand}, ${R.brand2})`,
            cursor: 'pointer', boxShadow: `0 12px 26px -12px ${R.brand}`,
          }}
        >
          Ir para a agenda
        </button>
      )}
    </>
  )

  // ── shell (mobile = sheet full-screen · desktop = modal central) ───────────
  const cardStyle: React.CSSProperties = isMobile
    ? {
        position: 'fixed', inset: 0, top: 'var(--navbar-h, 104px)',
        background: R.surface, color: R.ink,
        borderRadius: '22px 22px 0 0',
        display: 'flex', flexDirection: 'column',
        zIndex: 12000, fontFamily: typography.fontFamily,
        animation: 'rcpt-up 0.30s cubic-bezier(0.34,1.2,0.64,1)',
      }
    : {
        position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
        width: 536, maxWidth: 'calc(100vw - 36px)', maxHeight: 'calc(100vh - 48px)',
        background: R.surface, color: R.ink, borderRadius: 24,
        boxShadow: '0 50px 120px -30px rgba(0,0,0,0.45)',
        display: 'flex', flexDirection: 'column', overflow: 'hidden',
        zIndex: 12000, fontFamily: typography.fontFamily,
        animation: 'rcpt-in 0.28s cubic-bezier(0.34,1.4,0.64,1)',
      }

  return createPortal(
    <>
      <style>{`
        @keyframes rcpt-in { from { opacity:0; transform: translate(-50%,-50%) scale(0.97) } to { opacity:1; transform: translate(-50%,-50%) scale(1) } }
        @keyframes rcpt-up { from { transform: translateY(100%) } to { transform: translateY(0) } }
        @media print {
          .rcpt-overlay, .rcpt-foot, .rcpt-toast { display: none !important }
          .rcpt-card { position: static !important; transform: none !important; box-shadow: none !important; max-height: none !important; width: auto !important }
        }
      `}</style>

      <div
        className="rcpt-overlay"
        onClick={onClose}
        style={{ position: 'fixed', inset: 0, background: 'rgba(4,4,8,0.45)', backdropFilter: 'blur(3px)', zIndex: 11999 }}
      />

      <div className="rcpt-card" style={cardStyle} onPointerDown={reset}>
        {isMobile && (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '10px 0 2px', flexShrink: 0 }}>
            <div style={{ width: 40, height: 4, borderRadius: 2, background: 'rgba(0,0,0,0.12)' }} />
          </div>
        )}

        {/* top */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 22px 0', flexShrink: 0 }}>
          {badge}
          <button
            onClick={onClose}
            aria-label="Fechar"
            style={{ width: 40, height: 40, borderRadius: 12, border: 'none', background: '#f1f2f5', color: '#3a3f4c', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
          >
            <X size={19} />
          </button>
        </div>

        {/* body */}
        <div style={{ padding: '6px 22px 18px', overflowY: 'auto', flex: 1 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginTop: 16 }}>
            <span style={{ fontWeight: 700, fontSize: 18 }}>Recibo #{shortId(sale.id)}</span>
            <span style={{ fontSize: 13, color: R.muted }}>{dateLabel}</span>
          </div>

          <span style={{ display: 'inline-block', fontSize: 11, marginTop: 9, padding: '3px 9px', borderRadius: 7, background: R.fiscalBg, color: R.fiscalText, fontWeight: 600 }}>
            Comprovante — não é nota fiscal
          </span>

          <div style={{ fontSize: 14, marginTop: 13 }}>
            <b style={{ fontWeight: 600 }}>{clientName}</b>
            {clientPhone && <span style={{ color: R.muted }}> · {clientPhone}</span>}
          </div>
          {business?.name && (
            <div style={{ fontSize: 12.5, color: R.muted, marginTop: 5 }}>
              {business.name}{business.address ? ` · ${business.address}` : ''}
            </div>
          )}

          <hr style={{ border: 'none', borderTop: `1px solid ${R.line}`, margin: '16px 0' }} />

          {items}

          <div style={{ marginTop: 18 }}>
            {sale.discount > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13.5, padding: '5px 0', color: R.muted }}>
                <span>Subtotal</span><span style={{ fontVariantNumeric: 'tabular-nums' }}>{formatBRL(sale.subtotal)}</span>
              </div>
            )}
            {sale.discount > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13.5, padding: '5px 0', color: R.muted }}>
                <span>Desconto</span><span style={{ fontVariantNumeric: 'tabular-nums' }}>−{formatBRL(sale.discount)}</span>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', fontWeight: 700, fontSize: 21, paddingTop: 12 }}>
              <span>Total</span>
              <span style={{ color: R.pago, fontVariantNumeric: 'tabular-nums' }}>{formatBRL(sale.total)}</span>
            </div>
          </div>

          {paymentsLine}
        </div>

        {/* footer */}
        <div className="rcpt-foot" style={{ flexShrink: 0, borderTop: `1px solid ${R.line}`, background: R.footBg, padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 10, paddingBottom: isMobile ? 'max(20px, env(safe-area-inset-bottom))' : 16 }}>
          {actions}
        </div>
      </div>

      {/* toast de auto-retorno (só full, últimos segundos) */}
      {showBanner && (
        <div className="rcpt-toast" style={{
          position: 'fixed', right: 24, bottom: 24, zIndex: 12001,
          background: '#22222c', color: '#fff', borderRadius: 16, padding: '14px 16px',
          display: 'flex', alignItems: 'center', gap: 13, maxWidth: 340,
          boxShadow: '0 24px 60px -20px rgba(0,0,0,0.7)', fontFamily: typography.fontFamily,
        }}>
          <div style={{ fontSize: 13, lineHeight: 1.35 }}>
            Voltando para a agenda<br /><b>em {secsLeft}s</b>
          </div>
          <button
            onClick={reset}
            style={{ border: 'none', background: 'rgba(255,255,255,0.16)', color: '#fff', fontFamily: 'inherit', fontWeight: 700, fontSize: 12.5, padding: '9px 13px', borderRadius: 10, cursor: 'pointer', whiteSpace: 'nowrap' }}
          >
            Continuar aqui
          </button>
        </div>
      )}
    </>,
    document.body,
  )
}
