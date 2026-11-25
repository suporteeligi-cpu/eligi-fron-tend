'use client'
// src/app/dashboard/eligiclub/components/CobrarSheet.tsx
// @eligi:club-cobrar-sheet — folha de cobrar um membro do EligiClub (nov/2026).
//
// Saiu de dentro do ClubHojeTab para a ficha do membro e a aba Membros usarem a
// mesma folha. Pede ao back o link (fatura em aberto no cartao, Pix avulso no
// manual) e a mensagem pronta: POST /club-subscriptions/:id/cobrar.

import { useCallback, useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { AlertCircle, Check, Copy, Send, Smartphone, X } from 'lucide-react' // @eligi:cobrar-app-icon
import api from '@/shared/lib/apiClient'
import { waLink, waShareLink } from '@/shared/utils/whatsapp'

// ── contrato (espelha club.cobrar.ts do back) ────────────────────────────────
export type BillingState = 'EM_DIA' | 'VENCE_HOJE' | 'ATRASADO' | 'AGUARDANDO_1O' | 'CANCELADO'
export interface CobrarItem {
  subId: string; clientId: string; clientName: string; clientPhone: string | null
  planName: string; value: number | null; state: BillingState; manual: boolean
  dueDay: string | null; daysLate: number; cpfMissing: boolean; hasApp: boolean
  lastCharge: { at: string; kind: 'CARD_LINK' | 'PIX'; link: string | null } | null
}
export interface CobrarList { items: CobrarItem[]; canPix: boolean; totals: { hoje: number; atrasados: number; aguardando: number } }
interface CobrarResult {
  kind: 'CARD_LINK' | 'PIX'; link: string | null; whatsappText: string; clientPhone: string | null; reused: boolean
  /** @eligi:cobrar-app-notice — aviso no app Eligi Cliente. Ausente = back antigo. */
  appNotice?: 'SENT' | 'ALREADY' | 'NO_APP'
}

/** O minimo que a folha precisa: a ficha monta isso sem ter o item da fila. */
export interface CobrarTarget { subId: string; clientName: string; planName: string; value: number | null }

export const brl = (n: number) => n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

/** Rotulo da situacao de quem esta na fila. Mesmo texto na fila e na ficha. */
export function chargeChip(i: Pick<CobrarItem, 'state' | 'manual' | 'daysLate'>): { cls: string; text: string } {
  if (i.state === 'VENCE_HOJE') return { cls: 'c-hoje', text: 'Vence hoje' }
  if (i.state === 'AGUARDANDO_1O') return { cls: 'c-aguarda', text: 'Falta o 1º pagamento' }
  if (!i.manual) return { cls: 'c-cartao', text: 'Cartão não passou' }
  return { cls: 'c-atraso', text: `Atrasado ${i.daysLate} ${i.daysLate === 1 ? 'dia' : 'dias'}` }
}

const SHEET_CSS = `
.chs{position:fixed;inset:0;z-index:9998;display:flex;align-items:flex-end;justify-content:center;font-family:var(--font-sans);color:#111114}
.chs *{box-sizing:border-box}
.chs :where(span,div,b,p,small,strong){color:inherit}
.chs .bd{position:absolute;inset:0;background:rgba(17,17,20,.36);border:0}
.chs .pn{position:relative;z-index:9999;background:#fff;width:100%;max-height:calc(100dvh - 104px - 64px - env(safe-area-inset-bottom));margin-bottom:calc(64px + env(safe-area-inset-bottom));border-radius:22px 22px 0 0;padding:18px 16px 20px;overflow:auto;display:flex;flex-direction:column;gap:14px}
@media(min-width:1024px){.chs{align-items:center;padding-left:var(--sidebar-width,0px)}.chs .pn{width:480px;margin:0;border-radius:22px;max-height:80dvh;padding:22px}}
.chs .msg{white-space:pre-wrap;font-size:14px;line-height:1.45;background:#f5f5f7;border-radius:14px;padding:14px;color:#111114}
.chs .mono{font-family:var(--font-mono);font-size:11px;letter-spacing:.06em;text-transform:uppercase;font-weight:600;color:#5b5b63}
.chs .x{width:44px;height:44px;border-radius:12px;border:0;background:#f0f0f3;display:flex;align-items:center;justify-content:center;cursor:pointer}
.chs .err{display:flex;gap:10px;align-items:flex-start;background:#fffbeb;color:#92400e;border-radius:14px;padding:12px 14px;font-size:14px}
.chs .btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;min-height:44px;padding:0 16px;border-radius:12px;font:600 14px var(--font-sans);border:1px solid rgba(17,17,20,.12);background:#fff;color:#111114;cursor:pointer;text-decoration:none;-webkit-tap-highlight-color:transparent}
.chs .btn-ink{background:#111114;color:#fff;border-color:#111114}
.chs .btn-ink span{color:#fff}
@media (prefers-reduced-motion:no-preference){.chs .pn{animation:chs-up 220ms cubic-bezier(.22,1,.36,1) both}}
@keyframes chs-up{from{transform:translateY(16px);opacity:.6}to{transform:none;opacity:1}}
`

type SheetState =
  | { phase: 'loading' }
  | { phase: 'ok'; r: CobrarResult }
  | { phase: 'error'; message: string }

export default function CobrarSheet({ item, onClose, onDone }: { item: CobrarTarget; onClose: () => void; onDone: () => void }) {
  const [st, setSt] = useState<SheetState>({ phase: 'loading' })
  const [copied, setCopied] = useState<'msg' | 'link' | null>(null)

  useEffect(() => {
    let alive = true
    async function run() {
      try {
        const res = await api.post(`/club-subscriptions/${item.subId}/cobrar`)
        if (alive) setSt({ phase: 'ok', r: res.data?.data as CobrarResult })
      } catch (err) {
        const e = err as { response?: { data?: { error?: string; message?: string } } }
        const message = e.response?.data?.error ?? e.response?.data?.message ?? 'Não foi possível gerar a cobrança agora.'
        if (alive) setSt({ phase: 'error', message })
      }
    }
    void run()
    return () => { alive = false }
  }, [item.subId])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const copy = useCallback(async (what: 'msg' | 'link', text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(what)
    } catch {
      setCopied(null)
    }
  }, [])

  const r = st.phase === 'ok' ? st.r : null
  const phone = r?.clientPhone ?? null
  const wa = r ? (phone ? waLink(phone, r.whatsappText) : waShareLink(r.whatsappText)) : null

  if (typeof document === 'undefined') return null
  return createPortal(
    <div className="chs" role="dialog" aria-modal="true" aria-labelledby="chs-title">
      <style>{SHEET_CSS}</style>
      <button className="bd" aria-label="Fechar" onClick={onClose} />
      <div className="pn">
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="mono">Cobrar</div>
            <h3 id="chs-title" style={{ margin: '4px 0 0', fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 600, letterSpacing: '-.03em' }}>{item.clientName}</h3>
            <div style={{ fontSize: 13, color: '#5b5b63' }}>{item.planName}{item.value != null ? ` · ${brl(item.value)}` : ''}</div>
          </div>
          <button className="x" aria-label="Fechar" onClick={onClose}><X size={20} /></button>
        </div>

        {st.phase === 'loading' && <div style={{ fontSize: 14, color: '#5b5b63', padding: '18px 0' }}>Preparando a cobrança…</div>}

        {st.phase === 'error' && (
          <div className="err"><AlertCircle size={18} style={{ flexShrink: 0, marginTop: 1 }} /><span>{st.message}</span></div>
        )}

        {r && (
          <>
            <div style={{ fontSize: 14, color: '#4b4b52' }}>
              {r.link
                ? (r.kind === 'PIX'
                  ? (r.reused ? 'Este membro já tem um Pix em aberto. É o mesmo link.' : 'Pix gerado. Quando ele pagar, o plano renova sozinho.')
                  : 'Link da fatura em aberto. Ele paga com outro cartão ou pelo Pix.')
                : 'Sem link de pagamento: a mensagem pede para pagar aqui ou responder.'}
            </div>
            {/* @eligi:cobrar-app-linha */}
            {r.appNotice && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: 8, fontSize: 13.5, borderRadius: 12, padding: '9px 12px',
                background: r.appNotice === 'NO_APP' ? '#f4f4f6' : '#ecfdf5',
                color: r.appNotice === 'NO_APP' ? '#5b5b63' : '#0f6e56',
              }}>
                <Smartphone size={16} style={{ flexShrink: 0 }} />
                <span>
                  {r.appNotice === 'SENT' && 'Aviso enviado no app Eligi Cliente.'}
                  {r.appNotice === 'ALREADY' && 'O app já avisou este membro hoje.'}
                  {r.appNotice === 'NO_APP' && 'Sem o app Eligi Cliente: mande pelo WhatsApp.'}
                </span>
              </div>
            )}
            <div>
              <div className="mono" style={{ marginBottom: 6 }}>Mensagem</div>
              <div className="msg">{r.whatsappText}</div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {wa && (
                <a className="btn btn-ink" href={wa} target="_blank" rel="noopener noreferrer" onClick={onDone}>
                  <Send size={18} /><span>{phone ? 'Enviar no WhatsApp' : 'Escolher contato no WhatsApp'}</span>
                </a>
              )}
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn" style={{ flex: 1 }} onClick={() => void copy('msg', r.whatsappText)}>
                  {copied === 'msg' ? <Check size={18} /> : <Copy size={18} />}{copied === 'msg' ? 'Copiada' : 'Copiar mensagem'}
                </button>
                {r.link && (
                  <button className="btn" style={{ flex: 1 }} onClick={() => void copy('link', r.link ?? '')}>
                    {copied === 'link' ? <Check size={18} /> : <Copy size={18} />}{copied === 'link' ? 'Copiado' : 'Copiar link'}
                  </button>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>,
    document.body,
  )
}
