'use client'
// src/features/sales/components/SaleReceiptModal.tsx
//
// Recibo pós-venda / comprovante. Lê de `Sale`. Modos:
//   - 'full': após confirmar a venda. Tem "Ir para a agenda" + auto-retorno (pausa ao perder foco).
//   - 'send': aberto pelo card de total do BookingViewPanel. Sem agenda, sem auto-retorno.
//
// Ações (fatia 2, contra o backend /sales/:id/receipt.*):
//   - Imprimir → abre o PDF (/receipt.pdf) em nova aba (print-perfeito).
//   - E-mail   → input editável (vazio = e-mail do cadastro), POST /receipt/email; 422 = sem e-mail.
//   - WhatsApp → navigator.share({files:[pdf]}) onde dá (mobile); senão o botão É "Baixar PDF".
// Feedback inline no rodapé (não usa o Toast do Caixa — o recibo abre de 2 lugares).

import { useEffect, useRef, useState, useCallback, type ReactNode, type CSSProperties } from 'react'
import { createPortal } from 'react-dom'
import { X, Check, Printer, MessageCircle, Mail, Download, Loader2, AlertCircle } from 'lucide-react'
import dayjs from 'dayjs'
import 'dayjs/locale/pt-br'
import utc from 'dayjs/plugin/utc'
import timezone from 'dayjs/plugin/timezone'

import api from '@/shared/lib/apiClient'
import { typography } from '@/shared/theme'
import { Sale } from '@/features/sales/types'
import { formatBRL, shortId, PAYMENT_METHOD_LABEL } from '@/features/sales/utils/format'

dayjs.extend(utc)
dayjs.extend(timezone)
dayjs.locale('pt-br')

const R = {
  surface:'#ffffff', ink:'#1c1c22', muted:'#8a8f9c', line:'#ececef',
  pago:'#00b80c', pagoBg:'rgba(0,184,12,0.10)', brand:'#dc2626', brand2:'#b91c1c',
  wa:'#1aa251', waBg:'rgba(37,211,102,0.12)', waBorder:'rgba(37,211,102,0.40)',
  fiscalBg:'rgba(255,159,10,0.12)', fiscalText:'#b45309', footBg:'#fafbfc',
  btnBg:'#f4f5f7', btnBorder:'#e2e4e9', btnInk:'#3a3f4c', err:'#dc2626',
} as const

interface Props {
  sale:          Sale
  mode:          'full' | 'send'
  isMobile:      boolean
  onClose:       () => void
  onGoToAgenda?: () => void
  autoReturn?:   boolean
  autoReturnMs?: number
}

const SECS_BANNER = 10
type Status = { kind: 'idle' | 'busy' | 'ok' | 'err'; msg?: string }

export default function SaleReceiptModal({
  sale, mode, isMobile, onClose, onGoToAgenda,
  autoReturn = true, autoReturnMs = 5 * 60_000,
}: Props) {
  const isFull = mode === 'full'
  const wantsTimer = isFull && autoReturn && !!onGoToAgenda
  const totalSecs = Math.max(SECS_BANNER, Math.round(autoReturnMs / 1000))

  const [secsLeft, setSecsLeft] = useState<number>(() => totalSecs)
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const pausedRef = useRef(false)

  const [emailOpen, setEmailOpen] = useState(false)
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<Status>({ kind: 'idle' })

  const stop = useCallback(() => {
    if (tickRef.current) { clearInterval(tickRef.current); tickRef.current = null }
  }, [])
  const reset = useCallback(() => { if (wantsTimer) setSecsLeft(totalSecs) }, [wantsTimer, totalSecs])

  useEffect(() => {
    if (!wantsTimer) return
    const onHidden = () => { pausedRef.current = document.hidden }
    const onBlur = () => { pausedRef.current = true }
    const onFocus = () => { pausedRef.current = false }
    document.addEventListener('visibilitychange', onHidden)
    window.addEventListener('blur', onBlur)
    window.addEventListener('focus', onFocus)
    tickRef.current = setInterval(() => {
      if (pausedRef.current) return
      setSecsLeft(prev => { if (prev <= 1) { stop(); onGoToAgenda?.(); return 0 } return prev - 1 })
    }, 1000)
    return () => {
      stop()
      document.removeEventListener('visibilitychange', onHidden)
      window.removeEventListener('blur', onBlur)
      window.removeEventListener('focus', onFocus)
    }
  }, [wantsTimer, stop, onGoToAgenda])

  // ── PDF helpers ───────────────────────────────────────────────────────────
  const fetchPdf = useCallback(async (): Promise<Blob> => {
    const res = await api.get(`/sales/${sale.id}/receipt.pdf`, { responseType: 'blob' })
    return res.data as Blob
  }, [sale.id])

  const handlePrint = useCallback(async () => {
    pausedRef.current = true
    const tab = window.open('', '_blank') // abre ANTES do await (evita bloqueio de pop-up)
    try {
      setStatus({ kind: 'busy', msg: 'Gerando PDF…' })
      const blob = await fetchPdf()
      const url = URL.createObjectURL(blob)
      if (tab) tab.location.href = url
      else window.open(url, '_blank')
      setStatus({ kind: 'idle' })
      setTimeout(() => URL.revokeObjectURL(url), 60_000)
    } catch {
      if (tab) tab.close()
      setStatus({ kind: 'err', msg: 'Não foi possível gerar o PDF' })
    } finally {
      pausedRef.current = false
    }
  }, [fetchPdf])

  const canShareFiles = useCallback((file: File) => {
    const nav = navigator as Navigator & { canShare?: (d: ShareData) => boolean }
    return typeof nav.canShare === 'function' && nav.canShare({ files: [file] })
  }, [])

  const handleWhatsapp = useCallback(async () => {
    pausedRef.current = true
    try {
      setStatus({ kind: 'busy', msg: 'Preparando recibo…' })
      const blob = await fetchPdf()
      const file = new File([blob], `recibo-${shortId(sale.id)}.pdf`, { type: 'application/pdf' })
      if (canShareFiles(file)) {
        const nav = navigator as Navigator & { share: (d: ShareData) => Promise<void> }
        await nav.share({ files: [file], title: `Recibo #${shortId(sale.id)}` })
        setStatus({ kind: 'idle' })
      } else {
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url; a.download = `recibo-${shortId(sale.id)}.pdf`
        document.body.appendChild(a); a.click(); a.remove()
        setTimeout(() => URL.revokeObjectURL(url), 60_000)
        setStatus({ kind: 'ok', msg: 'PDF baixado — anexe no WhatsApp' })
      }
    } catch (e) {
      const name = (e as { name?: string })?.name
      setStatus(name === 'AbortError' ? { kind: 'idle' } : { kind: 'err', msg: 'Não foi possível preparar o recibo' })
    } finally {
      pausedRef.current = false
    }
  }, [fetchPdf, sale.id, canShareFiles])

  const sendEmail = useCallback(async () => {
    pausedRef.current = true
    try {
      setStatus({ kind: 'busy', msg: 'Enviando…' })
      const body = email.trim() ? { email: email.trim() } : {}
      const res = await api.post(`/sales/${sale.id}/receipt/email`, body)
      const to = (res.data?.data?.to ?? res.data?.to) as string | undefined
      setStatus({ kind: 'ok', msg: to ? `Enviado para ${to}` : 'Recibo enviado' })
      setEmailOpen(false)
    } catch (e) {
      const st = (e as { response?: { status?: number } })?.response?.status
      if (st === 422) {
        setEmailOpen(true)
        setStatus({ kind: 'err', msg: 'Cliente sem e-mail — digite um abaixo' })
      } else {
        setStatus({ kind: 'err', msg: 'Falha ao enviar o e-mail' })
      }
    } finally {
      pausedRef.current = false
    }
  }, [email, sale.id])

  if (typeof document === 'undefined') return null

  // ── derivados ─────────────────────────────────────────────────────────────
  const clientName = sale.clientName ?? 'Cliente avulso'
  const clientPhone = sale.clientPhone ?? ''
  const dateRaw = sale.confirmedAt ?? sale.createdAt
  const dateLabel = dateRaw ? dayjs(dateRaw).tz('America/Sao_Paulo').format('DD MMM YYYY') : ''
  const showBanner = wantsTimer && secsLeft <= SECS_BANNER
  const busy = status.kind === 'busy'

  // WhatsApp vira "Baixar PDF" quando o device não compartilha arquivo (desktop)
  const probeFile = new File([new Blob()], 'p.pdf', { type: 'application/pdf' })
  const shareMode = canShareFiles(probeFile)

  const badge = (
    <span style={{ display:'inline-flex', alignItems:'center', gap:7, background:R.pagoBg, color:R.pago,
      fontWeight:700, fontSize:12.5, letterSpacing:'.06em', padding:'8px 14px', borderRadius:999 }}>
      <Check size={15} strokeWidth={3} /> PAGO
    </span>
  )

  const sbtn = (key:string, icon:ReactNode, label:string, onClick:()=>void, wa=false) => (
    <button key={key} onClick={onClick} disabled={busy}
      style={{ flex:1, minWidth:0, display:'flex', alignItems:'center', justifyContent:'center', gap:7,
        padding:'12px 10px', borderRadius:12,
        border:`1px solid ${wa ? R.waBorder : R.btnBorder}`, background:wa ? R.waBg : R.btnBg,
        color:wa ? R.wa : R.btnInk, fontSize:13, fontWeight:600, fontFamily:typography.fontFamily,
        cursor:busy ? 'not-allowed':'pointer', opacity:busy ? 0.6:1, WebkitTapHighlightColor:'transparent' }}>
      {icon}{label}
    </button>
  )

  const cardStyle: CSSProperties = isMobile
    ? { position:'fixed', inset:0, top:'var(--navbar-h, 104px)', background:R.surface, color:R.ink,
        borderRadius:'22px 22px 0 0', display:'flex', flexDirection:'column', zIndex:12000,
        fontFamily:typography.fontFamily, animation:'rcpt-up 0.30s cubic-bezier(0.34,1.2,0.64,1)' }
    : { position:'fixed', top:'50%', left:'50%', transform:'translate(-50%,-50%)',
        width:536, maxWidth:'calc(100vw - 36px)', maxHeight:'calc(100vh - 48px)',
        background:R.surface, color:R.ink, borderRadius:24, boxShadow:'0 50px 120px -30px rgba(0,0,0,0.45)',
        display:'flex', flexDirection:'column', overflow:'hidden', zIndex:12000,
        fontFamily:typography.fontFamily, animation:'rcpt-in 0.28s cubic-bezier(0.34,1.4,0.64,1)' }

  return createPortal(
    <>
      <style>{`
        @keyframes rcpt-in { from { opacity:0; transform: translate(-50%,-50%) scale(0.97) } to { opacity:1; transform: translate(-50%,-50%) scale(1) } }
        @keyframes rcpt-up { from { transform: translateY(100%) } to { transform: translateY(0) } }
        @keyframes rcpt-spin { to { transform: rotate(360deg) } }
      `}</style>

      <div onClick={onClose}
        style={{ position:'fixed', inset:0, background:'rgba(4,4,8,0.45)', backdropFilter:'blur(3px)', zIndex:11999 }} />

      <div style={cardStyle} onPointerDown={reset}>
        {isMobile && (
          <div style={{ display:'flex', justifyContent:'center', padding:'10px 0 2px', flexShrink:0 }}>
            <div style={{ width:40, height:4, borderRadius:2, background:'rgba(0,0,0,0.12)' }} />
          </div>
        )}

        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'18px 22px 0', flexShrink:0 }}>
          {badge}
          <button onClick={onClose} aria-label="Fechar"
            style={{ width:40, height:40, borderRadius:12, border:'none', background:'#f1f2f5', color:'#3a3f4c',
              display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer' }}>
            <X size={19} />
          </button>
        </div>

        <div style={{ padding:'6px 22px 18px', overflowY:'auto', flex:1 }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'baseline', marginTop:16 }}>
            <span style={{ fontWeight:700, fontSize:18 }}>Recibo #{shortId(sale.id)}</span>
            <span style={{ fontSize:13, color:R.muted }}>{dateLabel}</span>
          </div>
          <span style={{ display:'inline-block', fontSize:11, marginTop:9, padding:'3px 9px', borderRadius:7,
            background:R.fiscalBg, color:R.fiscalText, fontWeight:600 }}>
            Comprovante — não é nota fiscal
          </span>
          <div style={{ fontSize:14, marginTop:13 }}>
            <b style={{ fontWeight:600 }}>{clientName}</b>
            {clientPhone && <span style={{ color:R.muted }}> · {clientPhone}</span>}
          </div>

          <hr style={{ border:'none', borderTop:`1px solid ${R.line}`, margin:'16px 0' }} />

          <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
            {sale.items.map(it => {
              const covered = !!it.appliedPackageCardId || !!it.appliedMembershipCardId
              const coveredLabel = it.appliedMembershipCardId ? 'Coberto por assinatura' : 'Coberto por pacote'
              const prof = it.professional?.name
              return (
                <div key={it.id} style={{ display:'flex', justifyContent:'space-between', gap:14, alignItems:'flex-start' }}>
                  <div style={{ minWidth:0 }}>
                    <div style={{ fontSize:15, fontWeight:600, color:R.ink }}>{it.name}</div>
                    {prof && <div style={{ fontSize:12, color:R.muted, marginTop:4 }}>{prof}</div>}
                    {covered && <div style={{ fontSize:11.5, fontWeight:600, color:R.pago, marginTop:5 }}>{coveredLabel}</div>}
                  </div>
                  <div style={{ display:'flex', alignItems:'center', gap:12, whiteSpace:'nowrap' }}>
                    {it.quantity > 1 && <span style={{ fontSize:13, color:R.muted }}>x{it.quantity}</span>}
                    <span style={{ fontSize:15, fontWeight:600, color:R.ink, fontVariantNumeric:'tabular-nums' }}>{formatBRL(it.total)}</span>
                  </div>
                </div>
              )
            })}
          </div>

          <div style={{ marginTop:18 }}>
            {sale.discount > 0 && (
              <div style={{ display:'flex', justifyContent:'space-between', fontSize:13.5, padding:'5px 0', color:R.muted }}>
                <span>Subtotal</span><span style={{ fontVariantNumeric:'tabular-nums' }}>{formatBRL(sale.subtotal)}</span>
              </div>
            )}
            {sale.discount > 0 && (
              <div style={{ display:'flex', justifyContent:'space-between', fontSize:13.5, padding:'5px 0', color:R.muted }}>
                <span>Desconto</span><span style={{ fontVariantNumeric:'tabular-nums' }}>−{formatBRL(sale.discount)}</span>
              </div>
            )}
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'baseline', fontWeight:700, fontSize:21, paddingTop:12 }}>
              <span>Total</span>
              <span style={{ color:R.pago, fontVariantNumeric:'tabular-nums' }}>{formatBRL(sale.total)}</span>
            </div>
          </div>

          {sale.payments.length > 0 && (
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', fontSize:13,
              marginTop:16, paddingTop:14, borderTop:`1px solid ${R.line}` }}>
              <div>
                <span style={{ fontWeight:600, color:R.ink }}>Pago</span>
                <span style={{ color:R.muted }}> · {sale.payments.map(p => PAYMENT_METHOD_LABEL[p.method]).join(' + ')}</span>
                {sale.confirmedAt && (
                  <div style={{ color:R.muted, fontSize:12, marginTop:2 }}>
                    {dayjs(sale.confirmedAt).tz('America/Sao_Paulo').format('DD/MM/YYYY, HH:mm')}
                  </div>
                )}
              </div>
              {sale.payments.length > 1 && (
                <div style={{ textAlign:'right', display:'flex', flexDirection:'column', gap:2 }}>
                  {sale.payments.map(p => (
                    <span key={p.id} style={{ fontSize:12, color:R.muted, fontVariantNumeric:'tabular-nums' }}>
                      {PAYMENT_METHOD_LABEL[p.method]} {formatBRL(p.amount)}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <div style={{ flexShrink:0, borderTop:`1px solid ${R.line}`, background:R.footBg, padding:'14px 20px',
          paddingBottom: isMobile ? 'max(20px, env(safe-area-inset-bottom))' : 14,
          display:'flex', flexDirection:'column', gap:10 }}>

          {emailOpen && (
            <div style={{ display:'flex', gap:8 }}>
              <input
                type="email" value={email} onChange={e => setEmail(e.target.value)}
                placeholder="email@cliente.com (vazio = e-mail do cadastro)"
                style={{ flex:1, borderRadius:11, padding:'11px 13px', border:`1px solid ${R.btnBorder}`,
                  fontSize:14, outline:'none', fontFamily:typography.fontFamily, color:R.ink }} />
              <button onClick={sendEmail} disabled={busy}
                style={{ border:'none', borderRadius:11, padding:'0 18px', fontFamily:typography.fontFamily,
                  fontWeight:700, fontSize:13.5, color:'#fff', background:`linear-gradient(135deg, ${R.brand}, ${R.brand2})`,
                  cursor:busy ? 'not-allowed':'pointer', opacity:busy ? 0.6:1 }}>
                Enviar
              </button>
            </div>
          )}

          {status.kind !== 'idle' && (
            <div style={{ display:'flex', alignItems:'center', gap:7, fontSize:12.5, fontWeight:600,
              color: status.kind === 'err' ? R.err : status.kind === 'ok' ? R.pago : R.muted }}>
              {status.kind === 'busy' && <Loader2 size={14} style={{ animation:'rcpt-spin 0.8s linear infinite' }} />}
              {status.kind === 'ok'   && <Check size={14} strokeWidth={3} />}
              {status.kind === 'err'  && <AlertCircle size={14} strokeWidth={2.5} />}
              <span>{status.msg}</span>
            </div>
          )}

          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            {clientPhone && (shareMode
              ? sbtn('wa', <MessageCircle size={17} />, 'WhatsApp', handleWhatsapp, true)
              : sbtn('wa', <Download size={17} />, 'Baixar PDF', handleWhatsapp, true))}
            {sbtn('mail', <Mail size={17} />, 'E-mail', () => { setStatus({ kind:'idle' }); setEmailOpen(v => !v) })}
            {sbtn('print', <Printer size={17} />, 'Imprimir', handlePrint)}
            {isFull && (
              <button onClick={() => { stop(); onGoToAgenda?.() }}
                style={{ flexShrink:0, whiteSpace:'nowrap', border:'none', borderRadius:12, padding:'13px 22px',
                  fontFamily:typography.fontFamily, fontWeight:700, fontSize:14.5, color:'#fff',
                  background:`linear-gradient(135deg, ${R.brand}, ${R.brand2})`, cursor:'pointer',
                  boxShadow:`0 12px 26px -12px ${R.brand}` }}>
                Ir para a agenda
              </button>
            )}
          </div>
        </div>
      </div>

      {showBanner && (
        <div style={{ position:'fixed', right:24, bottom:24, zIndex:12001, background:'#22222c', color:'#fff',
          borderRadius:16, padding:'14px 16px', display:'flex', alignItems:'center', gap:13, maxWidth:340,
          boxShadow:'0 24px 60px -20px rgba(0,0,0,0.7)', fontFamily:typography.fontFamily }}>
          <div style={{ fontSize:13, lineHeight:1.35 }}>Voltando para a agenda<br /><b>em {secsLeft}s</b></div>
          <button onClick={reset}
            style={{ border:'none', background:'rgba(255,255,255,0.16)', color:'#fff', fontFamily:'inherit',
              fontWeight:700, fontSize:12.5, padding:'9px 13px', borderRadius:10, cursor:'pointer', whiteSpace:'nowrap' }}>
            Continuar aqui
          </button>
        </div>
      )}
    </>,
    document.body,
  )
}