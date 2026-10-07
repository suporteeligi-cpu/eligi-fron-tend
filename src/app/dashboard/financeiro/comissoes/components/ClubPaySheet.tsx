'use client'
// src/app/dashboard/financeiro/comissoes/components/ClubPaySheet.tsx
// @eligi:club-pay-sheet — baixa da parte de UM profissional no fechamento do pote.
// Mesmo padrao do MarkAsPaidModal (meio + observacao), mais a data: o dono costuma
// registrar um PIX que ja fez. Parte ja paga abre os detalhes e permite desfazer.

import { useEffect, useState, type CSSProperties } from 'react'
import { X, Loader2, CheckCircle2, AlertTriangle } from 'lucide-react'
import api from '@/shared/lib/apiClient'
import { colors, typography, inkLight } from '@/shared/theme'

export interface ClubPayItem {
  itemId: string
  professionalName: string
  fichas: number
  amount: number
  paidAt: string | null
  paidVia: string | null
  paidNote: string | null
}

interface Props {
  settlementId: string
  periodKey: string
  periodLabel: string
  item: ClubPayItem
  isMobile: boolean
  onClose: () => void
  onDone: () => void
}

type Method = 'PIX' | 'CASH' | 'TRANSFER' | 'OTHER'
const METHODS: Array<{ value: Method; label: string }> = [
  { value: 'PIX', label: 'PIX' },
  { value: 'CASH', label: 'Dinheiro' },
  { value: 'TRANSFER', label: 'Transferência' },
  { value: 'OTHER', label: 'Outros' },
]
export const CLUB_PAY_METHOD_LABEL: Record<string, string> = {
  PIX: 'PIX', CASH: 'Dinheiro', TRANSFER: 'Transferência', OTHER: 'Outros',
}

// "Hoje" em Sao Paulo (UTC-3 fixo), calculado uma vez no carregamento do modulo:
// Date.now() no render viola a pureza do React Compiler.
const HOJE = new Date(Date.now() - 3 * 3600_000).toISOString().slice(0, 10)

function brl(v: number) {
  return (v ?? 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}
/** paidAt chega como meio-dia UTC: o dia do ISO e o dia do pagamento. */
export function clubPaidDay(iso: string) {
  return `${iso.slice(8, 10)}/${iso.slice(5, 7)}/${iso.slice(0, 4)}`
}

const lbl: CSSProperties = {
  fontSize: 10.5, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase',
  color: typography.color.muted, marginBottom: 6,
}
const field: CSSProperties = {
  width: '100%', minHeight: 44, borderRadius: 10, border: `1px solid ${colors.gray.border}`,
  padding: '0 12px', fontSize: 16, fontFamily: 'inherit', color: typography.color.primary,
  background: '#fff', boxSizing: 'border-box',
}

export default function ClubPaySheet({ settlementId, periodKey, periodLabel, item, isMobile, onClose, onDone }: Props) {
  const paid = !!item.paidAt
  const [method, setMethod] = useState<Method>('PIX')
  const [day, setDay] = useState(HOJE)
  const [note, setNote] = useState('')
  const [saving, setSaving] = useState(false)
  const [confirmUndo, setConfirmUndo] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const minDay = `${periodKey}-01`

  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => { document.body.style.overflow = prev; window.removeEventListener('keydown', onKey) }
  }, [onClose])

  function apiError(err: unknown, fallback: string) {
    const e = err as { response?: { data?: { error?: string } } }
    return e.response?.data?.error ?? fallback
  }

  async function pay() {
    if (!day || day > HOJE || day < minDay) {
      setError('Escolha um dia entre o mês do fechamento e hoje.')
      return
    }
    setError(null); setSaving(true)
    try {
      await api.post(`/club-settlements/${settlementId}/items/${item.itemId}/pay`, {
        method, paidAt: day, note: note.trim() || undefined,
      })
      onDone()
    } catch (err) {
      setError(apiError(err, 'Não foi possível registrar o pagamento. Tente de novo.'))
      setSaving(false)
    }
  }

  async function undo() {
    setError(null); setSaving(true)
    try {
      await api.delete(`/club-settlements/${settlementId}/items/${item.itemId}/pay`)
      onDone()
    } catch (err) {
      setError(apiError(err, 'Não foi possível desfazer. Tente de novo.'))
      setSaving(false)
    }
  }

  const sheet: CSSProperties = isMobile
    ? { position: 'fixed', left: 0, right: 0, bottom: 0, maxHeight: '92vh', borderTopLeftRadius: 18, borderTopRightRadius: 18,
        paddingBottom: 'env(safe-area-inset-bottom, 0px)' }
    : { position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '92%', maxWidth: 440, maxHeight: '90vh', borderRadius: 18 }

  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 1000 }} />
      <div role="dialog" aria-modal="true" aria-label={`Pagamento de ${item.professionalName}`} style={{
        ...sheet, background: '#fff', zIndex: 1001, fontFamily: typography.fontFamily,
        display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 -8px 30px rgba(17,17,20,.14)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '16px 18px', borderBottom: `1px solid ${colors.gray.border}` }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: typography.color.primary }}>
              {paid ? 'Pagamento registrado' : 'Dar baixa'} · {item.professionalName}
            </div>
            <div style={{ fontSize: 12, color: typography.color.muted, marginTop: 2 }}>
              {periodLabel} · {item.fichas} fichas
            </div>
          </div>
          <button onClick={onClose} aria-label="Fechar" style={{
            width: 36, height: 36, borderRadius: '50%', border: `1px solid ${colors.gray.border}`, background: '#fff',
            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}><X size={14} color={colors.gray.dimText} /></button>
        </div>

        <div style={{ padding: 18, display: 'flex', flexDirection: 'column', gap: 14, overflowY: 'auto' }}>
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 10,
            background: '#fafafb', borderRadius: 12, padding: '12px 14px', fontSize: 13, color: typography.color.secondary,
          }}>
            <span>Parte do rateio</span>
            <b style={{ fontSize: 18, color: typography.color.primary, fontVariantNumeric: 'tabular-nums' }}>{brl(item.amount)}</b>
          </div>

          {paid ? (
            <>
              <div style={{
                display: 'flex', gap: 10, alignItems: 'flex-start', borderRadius: 12, padding: '12px 14px',
                background: inkLight.ok.bg, border: `1px solid ${inkLight.ok.border}`, color: inkLight.ok.text, fontSize: 13, lineHeight: 1.5,
              }}>
                <CheckCircle2 size={16} style={{ flexShrink: 0, marginTop: 1 }} />
                <span>
                  Pago em <b>{clubPaidDay(item.paidAt!)}</b>
                  {item.paidVia ? <> via <b>{CLUB_PAY_METHOD_LABEL[item.paidVia] ?? item.paidVia}</b></> : null}
                  {item.paidNote ? <><br />{item.paidNote}</> : null}
                </span>
              </div>
              {confirmUndo ? (
                <div style={{
                  display: 'flex', flexDirection: 'column', gap: 10, borderRadius: 12, padding: '12px 14px',
                  background: inkLight.warn.bg, border: `1px solid ${inkLight.warn.border}`, color: inkLight.warn.text, fontSize: 13, lineHeight: 1.5,
                }}>
                  <span style={{ display: 'flex', gap: 8 }}>
                    <AlertTriangle size={15} style={{ flexShrink: 0, marginTop: 2 }} />
                    A parte de {item.professionalName} volta para “a pagar” e a despesa volta para a data do fechamento.
                  </span>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <button onClick={undo} disabled={saving} style={btn(true, saving)}>
                      {saving ? <Loader2 size={15} style={{ animation: 'cps-spin 1s linear infinite' }} /> : 'Desfazer baixa'}
                    </button>
                    <button onClick={() => setConfirmUndo(false)} disabled={saving} style={btn(false, saving)}>Manter</button>
                  </div>
                </div>
              ) : (
                <button onClick={() => setConfirmUndo(true)} style={{ ...btn(false, false), alignSelf: 'flex-start' }}>
                  Registrei por engano, desfazer
                </button>
              )}
            </>
          ) : (
            <>
              <div>
                <div style={lbl}>Como pagou</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0,1fr))', gap: 6 }}>
                  {METHODS.map((m) => (
                    <button key={m.value} type="button" onClick={() => setMethod(m.value)} aria-pressed={method === m.value} style={{
                      minHeight: 44, borderRadius: 10, cursor: 'pointer', fontFamily: 'inherit', fontSize: 12.5, fontWeight: 600,
                      border: `1px solid ${method === m.value ? typography.color.primary : colors.gray.border}`,
                      background: method === m.value ? '#f3f3f5' : '#fff', color: typography.color.primary, padding: '0 4px',
                    }}>{m.label}</button>
                  ))}
                </div>
              </div>
              <div>
                <label htmlFor="cps-day" style={{ ...lbl, display: 'block' }}>Dia do pagamento</label>
                <input id="cps-day" type="date" value={day} min={minDay} max={HOJE}
                  onChange={(e) => setDay(e.target.value)} style={field} />
              </div>
              <div>
                <label htmlFor="cps-note" style={{ ...lbl, display: 'block' }}>Observação (opcional)</label>
                <input id="cps-note" type="text" value={note} maxLength={200} placeholder="Ex.: PIX para a chave dele"
                  onChange={(e) => setNote(e.target.value)} style={field} />
              </div>
            </>
          )}

          {error && (
            <div role="alert" style={{
              display: 'flex', gap: 8, fontSize: 13, lineHeight: 1.5, borderRadius: 12, padding: '10px 12px',
              background: inkLight.bad.bg, border: `1px solid ${inkLight.bad.border}`, color: inkLight.bad.text,
            }}><AlertTriangle size={15} style={{ flexShrink: 0, marginTop: 2 }} />{error}</div>
          )}
        </div>

        {!paid && (
          <div style={{ padding: '12px 18px 16px', borderTop: `1px solid ${colors.gray.border}` }}>
            <button onClick={pay} disabled={saving} style={{ ...btn(true, saving), width: '100%', minHeight: 48, fontSize: 15 }}>
              {saving ? <Loader2 size={16} style={{ animation: 'cps-spin 1s linear infinite' }} /> : `Confirmar pagamento de ${brl(item.amount)}`}
            </button>
          </div>
        )}
      </div>
      <style>{'@keyframes cps-spin { to { transform: rotate(360deg) } }'}</style>
    </>
  )
}

function btn(primary: boolean, disabled: boolean): CSSProperties {
  return {
    minHeight: 44, padding: '0 16px', borderRadius: 12, cursor: disabled ? 'default' : 'pointer',
    fontFamily: 'inherit', fontSize: 14, fontWeight: 600, display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
    border: `1px solid ${primary ? colors.red.DEFAULT : colors.gray.border}`,
    background: primary ? colors.red.DEFAULT : '#fff', color: primary ? '#fff' : typography.color.primary,
    opacity: disabled ? 0.6 : 1,
  }
}
