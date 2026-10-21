'use client'
// src/features/account/DeletionScheduledNotice.tsx
// @eligi:account-deletion-notice
// Conteudo do bloqueio BLOCKED_ARCHIVED (BillingGuard).
// - Exclusao pedida pelo dono e ainda no prazo: dias que faltam + "Cancelar exclusao".
// - Qualquer outro arquivamento (Brain, equipe, prazo ja vencido): o texto de
//   conta encerrada + botao do suporte no WhatsApp.
// GET /auth/account/deletion fica fora do billingGate (/auth), entao responde
// mesmo com o negocio arquivado.

import { useEffect, useState } from 'react'
import { MessageCircle } from 'lucide-react'
import {
  type DeletionStatus, cancelAccountDeletion, daysLeft, errorMessage,
  fetchDeletionStatus, formatDay, supportLink,
} from './accountDeletion'

const INK = '#111114'

const btnInk: React.CSSProperties = {
  width: '100%', minHeight: 48, border: 0, borderRadius: 14, background: INK, color: '#fff',
  fontSize: 15, fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer',
  display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8,
  textDecoration: 'none', boxSizing: 'border-box',
}
const btnGhost: React.CSSProperties = {
  display: 'block', width: '100%', marginTop: 10, minHeight: 44, background: 'none', border: 'none',
  fontSize: 14, color: '#8a8a93', cursor: 'pointer', fontFamily: 'inherit',
}
const pill: React.CSSProperties = {
  display: 'inline-block', fontSize: 12, fontWeight: 600, letterSpacing: '.04em',
  padding: '4px 10px', borderRadius: 999, background: '#fffbeb', color: '#b45309',
  border: '1px solid rgba(180,83,9,.2)', marginBottom: 14,
}
const bigNum: React.CSSProperties = {
  fontFamily: 'var(--font-eligi-display), system-ui, sans-serif', fontSize: 52, fontWeight: 600,
  letterSpacing: '-.04em', lineHeight: 1, margin: '0 0 6px', color: INK, fontVariantNumeric: 'tabular-nums',
}
const titleStyle: React.CSSProperties = { fontSize: 20, fontWeight: 600, margin: '0 0 8px', color: '#18181b' }
const subStyle: React.CSSProperties = { fontSize: 14, color: '#71717a', margin: '0 0 20px', lineHeight: 1.6 }
const errStyle: React.CSSProperties = { fontSize: 13, color: '#b91c1c', margin: '0 0 12px', lineHeight: 1.45 }

/** Agora, lido uma vez quando o status chega (fora do render). */
interface Loaded { status: DeletionStatus | null; nowMs: number }

export default function DeletionScheduledNotice({ title, sub, onLogout }: {
  title: string
  sub: string
  onLogout: () => void
}) {
  const [data, setData] = useState<Loaded | null>(null)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  useEffect(() => {
    let alive = true
    const run = async () => {
      let status: DeletionStatus | null = null
      try { status = await fetchDeletionStatus() } catch { status = null }
      if (alive) setData({ status, nowMs: Date.now() })
    }
    void run()
    return () => { alive = false }
  }, [])

  async function cancel() {
    if (busy) return
    setBusy(true)
    setErr(null)
    try {
      await cancelAccountDeletion()
      window.location.href = '/dashboard'
    } catch (e) {
      setErr(errorMessage(e, 'Não foi possível cancelar agora. Tente de novo ou fale com o suporte.'))
      setBusy(false)
    }
  }

  if (data === null) {
    return <p style={{ ...subStyle, margin: 0 }}>Carregando…</p>
  }

  const pending = data.status?.pending ?? null
  if (pending && pending.canCancel) {
    const days = daysLeft(pending.scheduledFor, data.nowMs)
    return (
      <>
        <span style={pill}>Exclusão marcada</span>
        <p style={bigNum}>{days} {days === 1 ? 'dia' : 'dias'}</p>
        <p style={subStyle}>
          A conta será apagada em {formatDay(pending.scheduledFor)}. Até lá os dados continuam
          guardados e você pode desistir.
        </p>
        {err && <p style={errStyle} role="alert">{err}</p>}
        <button type="button" style={btnInk} onClick={cancel} disabled={busy}>
          {busy ? 'Cancelando…' : 'Cancelar exclusão'}
        </button>
        <button type="button" style={btnGhost} onClick={onLogout}>Sair</button>
      </>
    )
  }

  return (
    <>
      <p style={titleStyle}>{title}</p>
      <p style={subStyle}>{sub}</p>
      <a
        style={btnInk}
        href={supportLink('Olá! Minha conta no Eligi aparece como encerrada e preciso de ajuda.')}
        target="_blank" rel="noopener noreferrer"
      >
        <MessageCircle size={18} /> Falar com o suporte
      </a>
      <button type="button" style={btnGhost} onClick={onLogout}>Sair</button>
    </>
  )
}
