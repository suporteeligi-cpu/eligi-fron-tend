'use client'
// src/app/dashboard/components/BillingGuard.tsx
// A trava real e o backend (billingGate -> 402). Esta tela e so UX.

import { ReactNode, useState, useEffect, useCallback } from 'react'
import api from '@/shared/lib/apiClient'

type Plan = 'AUTONOMO' | 'ESTABELECIMENTO'

interface AccessState {
  status: string
  blocked: boolean
  trialDaysLeft: number
}

const REASONS: Record<string, { title: string; sub: string; cta: string }> = {
  BLOCKED_TRIAL_EXPIRED: {
    title: 'Seu periodo de teste terminou',
    sub: 'Escolha um plano pra continuar gerenciando sua agenda, equipe e caixa.',
    cta: 'Assinar',
  },
  BLOCKED_PAST_DUE: {
    title: 'Pagamento em atraso',
    sub: 'Seus dados estao salvos. Regularize a assinatura pra desbloquear o acesso.',
    cta: 'Regularizar',
  },
  BLOCKED_CANCELED: {
    title: 'Assinatura cancelada',
    sub: 'Reative sua assinatura pra voltar a usar o Eligi.',
    cta: 'Reativar',
  },
}

export default function BillingGuard({ children }: { children: ReactNode }) {
  const [blocked, setBlocked] = useState(false)
  const [reason, setReason] = useState('BLOCKED_TRIAL_EXPIRED')

  const check = useCallback(async () => {
    try {
      const res = await api.get<{ data: AccessState }>('/billing/access')
      const st = res.data?.data
      setBlocked(!!st?.blocked)
      if (st?.blocked && REASONS[st.status]) setReason(st.status)
    } catch {
      // silencioso — se vier 402, o interceptor dispara o evento abaixo
    }
  }, [])

  useEffect(() => {
    const t = setTimeout(() => { check() }, 0)
    return () => clearTimeout(t)
  }, [check])

  useEffect(() => {
    function onBlocked(e: Event) {
      const detail = (e as CustomEvent).detail as { code?: string } | undefined
      setBlocked(true)
      if (detail?.code && REASONS[detail.code]) setReason(detail.code)
    }
    window.addEventListener('billing:blocked', onBlocked)
    return () => window.removeEventListener('billing:blocked', onBlocked)
  }, [])

  return (
    <>
      {children}
      {blocked && <BlockOverlay reason={reason} onResolved={check} />}
    </>
  )
}

function BlockOverlay({ reason, onResolved }: { reason: string; onResolved: () => void }) {
  const r = REASONS[reason] ?? REASONS.BLOCKED_TRIAL_EXPIRED
  const [doc, setDoc] = useState('')
  const [submitting, setSubmitting] = useState<Plan | null>(null)
  const [err, setErr] = useState('')

  async function subscribe(plan: Plan) {
    const digits = doc.replace(/\D/g, '')
    if (digits.length !== 11 && digits.length !== 14) {
      setErr('Informe um CPF ou CNPJ valido.')
      return
    }
    setErr('')
    setSubmitting(plan)
    try {
      const res = await api.post<{ data: { status: string; checkoutUrl: string | null } }>(
        '/billing/subscribe',
        { plan, billingType: 'UNDEFINED', cpfCnpj: digits },
      )
      const data = res.data?.data
      if (data?.checkoutUrl) {
        window.location.href = data.checkoutUrl
        return
      }
      onResolved()
    } catch (e) {
      const msg = (e as { response?: { data?: { error?: { message?: string } } } })
        ?.response?.data?.error?.message
      setErr(msg ?? 'Nao foi possivel criar a assinatura.')
    } finally {
      setSubmitting(null)
    }
  }

  async function logout() {
    try { await api.post('/auth/logout') } catch { /* ignora */ }
    window.location.href = '/login'
  }

  const busy = submitting !== null

  return (
    <div style={overlay}>
      <div style={modal}>
        <p style={titleStyle}>{r.title}</p>
        <p style={subStyle}>{r.sub}</p>

        <input
          value={doc}
          onChange={(e) => setDoc(e.target.value)}
          placeholder="CPF ou CNPJ"
          inputMode="numeric"
          maxLength={18}
          style={inputStyle}
        />

        <div style={plansRow}>
          <div style={planCard}>
            <p style={planName}>Autonomo</p>
            <p style={planPrice}>R$&nbsp;59,90<span style={planPer}>/mes</span></p>
            <p style={planDesc}>So voce. Agenda unica, caixa, clientes e link publico.</p>
            <button style={btnGhost} disabled={busy} onClick={() => subscribe('AUTONOMO')}>
              {submitting === 'AUTONOMO' ? 'Aguarde...' : r.cta}
            </button>
          </div>

          <div style={{ ...planCard, border: '2px solid #dc2626' }}>
            <span style={badge}>Completo</span>
            <p style={planName}>Estabelecimento</p>
            <p style={planPrice}>R$&nbsp;99,90<span style={planPer}>/mes</span></p>
            <p style={planDesc}>Equipe ate 3 inclusos + todos os modulos.</p>
            <button style={btnRed} disabled={busy} onClick={() => subscribe('ESTABELECIMENTO')}>
              {submitting === 'ESTABELECIMENTO' ? 'Aguarde...' : r.cta}
            </button>
          </div>
        </div>

        {err && <p style={errStyle}>{err}</p>}

        <button onClick={logout} style={signOut} disabled={busy}>Sair da conta</button>
      </div>
    </div>
  )
}

const overlay: React.CSSProperties = {
  position: 'fixed', inset: 0, zIndex: 999999,
  background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(2px)',
  WebkitBackdropFilter: 'blur(2px)',
  display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
}
const modal: React.CSSProperties = {
  background: '#ffffff', borderRadius: 16, padding: '32px 28px',
  maxWidth: 560, width: '100%', textAlign: 'center',
  boxShadow: '0 20px 60px rgba(0,0,0,0.25)',
}
const titleStyle: React.CSSProperties = { fontSize: 20, fontWeight: 600, margin: '0 0 8px', color: '#18181b' }
const subStyle: React.CSSProperties = { fontSize: 14, color: '#71717a', margin: '0 0 20px', lineHeight: 1.6 }
const inputStyle: React.CSSProperties = {
  width: '100%', boxSizing: 'border-box', padding: '11px 14px', marginBottom: 16,
  border: '0.5px solid rgba(0,0,0,0.2)', borderRadius: 10, fontSize: 14, outline: 'none',
}
const plansRow: React.CSSProperties = { display: 'flex', gap: 12, textAlign: 'left', flexWrap: 'wrap' }
const planCard: React.CSSProperties = {
  flex: '1 1 200px', position: 'relative', background: '#ffffff',
  border: '0.5px solid rgba(0,0,0,0.12)', borderRadius: 12, padding: 20,
}
const planName: React.CSSProperties = { fontSize: 14, fontWeight: 600, margin: '0 0 4px', color: '#18181b' }
const planPrice: React.CSSProperties = { fontSize: 24, fontWeight: 600, margin: '0 0 10px', color: '#18181b' }
const planPer: React.CSSProperties = { fontSize: 13, fontWeight: 400, color: '#71717a' }
const planDesc: React.CSSProperties = { fontSize: 13, color: '#71717a', lineHeight: 1.5, margin: '0 0 16px' }
const badge: React.CSSProperties = {
  position: 'absolute', top: -10, left: 20, background: '#dc2626', color: '#ffffff',
  fontSize: 12, fontWeight: 600, padding: '3px 10px', borderRadius: 8,
}
const btnGhost: React.CSSProperties = {
  width: '100%', background: 'transparent', color: '#18181b',
  border: '0.5px solid rgba(0,0,0,0.2)', borderRadius: 8, padding: '10px 0',
  fontSize: 14, fontWeight: 600, cursor: 'pointer',
}
const btnRed: React.CSSProperties = {
  width: '100%', background: '#dc2626', color: '#ffffff', border: 'none',
  borderRadius: 8, padding: '10px 0', fontSize: 14, fontWeight: 600, cursor: 'pointer',
}
const errStyle: React.CSSProperties = { color: '#dc2626', fontSize: 13, margin: '14px 0 0' }
const signOut: React.CSSProperties = {
  marginTop: 18, background: 'none', border: 'none', color: '#a1a1aa',
  fontSize: 13, cursor: 'pointer', textDecoration: 'underline',
}