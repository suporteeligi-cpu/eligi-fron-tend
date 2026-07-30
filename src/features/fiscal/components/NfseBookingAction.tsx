// src/features/fiscal/components/NfseBookingAction.tsx
'use client'

import { useCallback, useEffect, useState } from 'react'
import type { CSSProperties } from 'react'
import { ReceiptText, FileDown, Loader2 } from 'lucide-react'
import api from '@/shared/lib/apiClient'
import { colors, typography, inkLight } from '@/shared/theme'
import type { NfseEmission } from '../types'
import { apiErrorMessage } from '../utils'

// Depois disso, avisamos que a competência é a do atendimento.
// NÃO bloqueia: a obrigação de emitir é do lojista; travar a UI só o
// empurraria pro portal do governo.
const COMPETENCE_WARN_DAYS = 7

const menuItemStyle: CSSProperties = {
  width: '100%',
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  padding: '14px 18px',
  border: 'none',
  background: 'transparent',
  cursor: 'pointer',
  textAlign: 'left',
  fontSize: 14,
  fontWeight: 600,
  fontFamily: typography.fontFamily,
  transition: 'background 0.12s',
}

/** Compacto, alinhado à direita — vive no card de Total, junto do "Ver recibo". */
const inlineStyle: CSSProperties = {
  marginTop: 8,
  fontSize: 11,
  fontWeight: 700,
  fontFamily: typography.fontFamily,
  color: colors.red.DEFAULT,
  background: 'none',
  border: 'none',
  padding: 0,
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'flex-end',
  gap: 5,
  width: '100%',
}

interface Props {
  saleId: string
  /** confirmação da venda = data do atendimento (competência do ISS) */
  saleConfirmedAt: string | null
  variant?: 'menu' | 'inline'
  onBeforeAction?: () => void
}

type Phase = 'loading' | 'hidden' | 'none' | 'has'

export default function NfseBookingAction({
  saleId,
  saleConfirmedAt,
  variant = 'menu',
  onBeforeAction,
}: Props) {
  const [phase, setPhase] = useState<Phase>('loading')
  const [emission, setEmission] = useState<NfseEmission | null>(null)
  const [busy, setBusy] = useState(false)
  const [downloading, setDownloading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [tick, setTick] = useState(0)

  const inline = variant === 'inline'

  useEffect(() => {
    let alive = true
    api
      .get<NfseEmission | ''>(`/fiscal/sales/${saleId}/emission`)
      .then((res) => {
        if (!alive) return
        // 204 → axios entrega string vazia
        if (!res.data || typeof res.data !== 'object') {
          setEmission(null)
          setPhase('none')
          return
        }
        setEmission(res.data)
        setPhase('has')
      })
      .catch(() => {
        // 403 (cargo sem permissão) / 400 (módulo inativo) → some.
        // Permissão mora no BACK; o front não duplica a lista de cargos.
        if (alive) setPhase('hidden')
      })
    return () => {
      alive = false
    }
  }, [saleId, tick])

  const emit = useCallback(() => {
    if (busy) return

    const days = saleConfirmedAt
      ? Math.floor((Date.now() - new Date(saleConfirmedAt).getTime()) / 86_400_000)
      : 0

    if (days > COMPETENCE_WARN_DAYS) {
      const dataAtendimento = saleConfirmedAt
        ? new Date(saleConfirmedAt).toLocaleDateString('pt-BR')
        : 'a data do atendimento'
      const ok = window.confirm(
        `Este atendimento foi em ${dataAtendimento} (${days} dias atrás).\n\n` +
          'A nota será emitida com a competência do atendimento, não a de hoje. ' +
          'Confirme com seu contador se isso afeta a apuração do mês.\n\nEmitir mesmo assim?',
      )
      if (!ok) return
    }

    setBusy(true)
    setError(null)
    onBeforeAction?.()
    api
      .post(`/fiscal/sales/${saleId}/emit`)
      .then(() => setTick((t) => t + 1))
      .catch((err: unknown) => setError(apiErrorMessage(err)))
      .finally(() => setBusy(false))
  }, [busy, saleConfirmedAt, saleId, onBeforeAction])

  // Download via axios (não window.open): herda a baseURL do apiClient e
  // manda o cookie (withCredentials). URL montada na mão abriria 401 numa
  // aba em branco e dependeria de env no client.
  const downloadXml = useCallback(() => {
    if (!emission || downloading) return
    setDownloading(true)
    setError(null)
    api
      .get<Blob>(`/fiscal/emissions/${emission.id}/xml`, { responseType: 'blob' })
      .then((res) => {
        const url = URL.createObjectURL(res.data)
        const a = document.createElement('a')
        a.href = url
        a.download = `NFSe-${emission.nfseNumber ?? emission.id}.xml`
        document.body.appendChild(a)
        a.click()
        a.remove()
        URL.revokeObjectURL(url)
      })
      .catch((err: unknown) => setError(apiErrorMessage(err)))
      .finally(() => setDownloading(false))
  }, [emission, downloading])

  if (phase === 'loading' || phase === 'hidden') return null

  // ── já tem nota: status + XML ──
  if (phase === 'has' && emission) {
    const done = emission.status === 'AUTHORIZED'
    const failed = emission.status === 'REJECTED'
    const tone = done ? inkLight.ok : failed ? inkLight.bad : inkLight.warn
    const label = done
      ? `NFS-e nº ${emission.nfseNumber ?? '—'}`
      : failed
        ? 'Nota rejeitada'
        : 'Nota em processamento…'

    if (inline) {
      return (
        <div style={{ marginTop: 8, textAlign: 'right' }}>
          <div
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: tone.text,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-end',
              gap: 5,
            }}
          >
            <ReceiptText size={12} strokeWidth={2} />
            {label}
          </div>
          {done && (
            <button onClick={downloadXml} disabled={downloading} style={inlineStyle}>
              <FileDown size={12} strokeWidth={2} />
              {downloading ? 'Baixando…' : 'Baixar XML'}
            </button>
          )}
          {failed && emission.errorMessage && (
            <div style={{ fontSize: 10.5, color: inkLight.faint, marginTop: 3, lineHeight: 1.35 }}>
              {emission.errorMessage}
            </div>
          )}
          {error && (
            <div style={{ fontSize: 10.5, color: inkLight.bad.text, marginTop: 3 }}>{error}</div>
          )}
        </div>
      )
    }

    return (
      <div style={{ padding: '12px 18px', borderTop: '1px solid rgba(0,0,0,0.06)' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 9,
            fontSize: 13,
            fontWeight: 600,
            color: tone.text,
          }}
        >
          <ReceiptText size={14} strokeWidth={2} />
          {label}
        </div>
        {done && (
          <button
            onClick={downloadXml}
            disabled={downloading}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              fontSize: 12,
              fontWeight: 600,
              color: colors.red.DEFAULT,
              background: 'none',
              border: 'none',
              padding: 0,
              marginTop: 8,
              cursor: downloading ? 'wait' : 'pointer',
              fontFamily: typography.fontFamily,
            }}
          >
            <FileDown size={13} strokeWidth={2} />
            {downloading ? 'Baixando…' : 'Baixar XML da nota'}
          </button>
        )}
        {failed && emission.errorMessage && (
          <div style={{ fontSize: 11.5, color: inkLight.faint, marginTop: 4, lineHeight: 1.4 }}>
            {emission.errorMessage}
          </div>
        )}
      </div>
    )
  }

  // ── sem nota: emitir ──
  if (inline) {
    return (
      <div style={{ textAlign: 'right' }}>
        <button onClick={emit} disabled={busy} style={inlineStyle}>
          {busy ? (
            <Loader2 size={12} strokeWidth={2} style={{ animation: 'spin 0.8s linear infinite' }} />
          ) : (
            <ReceiptText size={12} strokeWidth={2} />
          )}
          {busy ? 'Emitindo…' : 'Emitir nota fiscal ›'}
        </button>
        {error && (
          <div style={{ fontSize: 10.5, color: inkLight.bad.text, marginTop: 3, lineHeight: 1.35 }}>
            {error}
          </div>
        )}
      </div>
    )
  }

  return (
    <>
      <button
        className="bvp-drop-item"
        onClick={emit}
        disabled={busy}
        style={{ ...menuItemStyle, color: inkLight.strong }}
      >
        {busy ? (
          <Loader2 size={14} strokeWidth={2} style={{ animation: 'spin 0.8s linear infinite' }} />
        ) : (
          <ReceiptText size={14} strokeWidth={2} />
        )}
        {busy ? 'Emitindo…' : 'Emitir nota fiscal'}
      </button>
      {error && (
        <div style={{ padding: '0 18px 10px', fontSize: 11.5, color: inkLight.bad.text, lineHeight: 1.4 }}>
          {error}
        </div>
      )}
    </>
  )
}
