'use client'
// src/app/dashboard/components/BillingGuard.tsx
//
// Tela de bloqueio (planos sobre o dashboard esmaecido) quando a assinatura
// esta inativa. A trava real e o backend (billingGate -> 402); isto e so UX.

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
  VOLUNTARY: {
    title: 'Assine o Eligi',
    sub: 'Garanta o acesso a sua agenda, equipe e caixa sem interrupcao. Pagamento por boleto ou Pix.',
    cta: 'Assinar',
  },
}

type ProfLite = { id: string; name: string; role?: string | null; avatarUrl?: string | null }
type SeatGate =
  | { kind: 'SELECT'; plan: Plan; professionals: ProfLite[] }
  | { kind: 'CONFIRM'; plan: Plan; activeCount: number; value: number; extras: number; extraPrice: number }

/** Le um 409 de seat na assinatura (sem any). */
function readSeatGate(err: unknown, plan: Plan): SeatGate | null {
  if (typeof err !== 'object' || err === null) return null
  const resp = (err as { response?: unknown }).response
  if (typeof resp !== 'object' || resp === null) return null
  const r = resp as { status?: number; data?: unknown }
  if (r.status !== 409) return null
  if (typeof r.data !== 'object' || r.data === null) return null
  const b = r.data as { error?: { code?: string }; data?: Record<string, unknown> }
  const code = b.error?.code
  const d = b.data ?? {}
  if (code === 'SEAT_SELECTION_REQUIRED') {
    const profs = Array.isArray(d.professionals) ? (d.professionals as ProfLite[]) : []
    return { kind: 'SELECT', plan, professionals: profs }
  }
  if (code === 'SEAT_VALUE_CONFIRM') {
    return {
      kind: 'CONFIRM', plan,
      activeCount: Number(d.activeCount ?? 0),
      value: Number(d.value ?? 0),
      extras: Number(d.extras ?? 0),
      extraPrice: Number(d.extraPrice ?? 19.9),
    }
  }
  return null
}

export default function BillingGuard({ children }: { children: ReactNode }) {
  const [blocked, setBlocked] = useState(false)
  const [reason, setReason] = useState('VOLUNTARY')

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
      setReason(detail?.code && REASONS[detail.code] ? detail.code : 'VOLUNTARY')
    }
    window.addEventListener('billing:blocked', onBlocked)
    return () => window.removeEventListener('billing:blocked', onBlocked)
  }, [])

  return (
    <>
      {children}
      {blocked && <BlockOverlay reason={reason} onResolved={check} onClose={() => setBlocked(false)} />}
    </>
  )
}

function BlockOverlay({ reason, onResolved, onClose }: { reason: string; onResolved: () => void; onClose: () => void }) {
  const r = REASONS[reason] ?? REASONS.BLOCKED_TRIAL_EXPIRED
  const [doc, setDoc] = useState('')
  const [accepted, setAccepted] = useState(false)
  const [submitting, setSubmitting] = useState<Plan | null>(null)
  const [err, setErr] = useState('')
  const [seatGate, setSeatGate] = useState<SeatGate | null>(null)
  const [keepId, setKeepId] = useState<string | null>(null)

  async function subscribe(plan: Plan, extra?: { keepProfessionalIds?: string[]; acceptBilling?: boolean }) {
    const digits = doc.replace(/\D/g, '')
    if (digits.length !== 11 && digits.length !== 14) {
      setErr('Informe um CPF ou CNPJ valido.')
      return
    }
    if (!accepted) {
      setErr('Aceite os Termos de Planos e Assinatura para continuar.')
      return
    }
    setErr('')
    setSubmitting(plan)
    try {
      const res = await api.post<{ data: { status: string; checkoutUrl: string | null } }>(
        '/billing/subscribe',
        { plan, cpfCnpj: digits, acceptedTerms: true, ...extra },
      )
      const data = res.data?.data
      if (data?.checkoutUrl) {
        window.location.href = data.checkoutUrl
        return
      }
      setSeatGate(null)
      onResolved()
    } catch (e) {
      const gate = readSeatGate(e, plan)
      if (gate) {
        setSeatGate(gate)
        setErr('')
        return
      }
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
    <>
    <div style={overlay}>
      <div style={modal}>
        {reason === 'VOLUNTARY' && (
          <button onClick={onClose} aria-label="Fechar" style={closeBtn}>×</button>
        )}
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

        <label style={termsRow}>
          <input
            type="checkbox"
            checked={accepted}
            onChange={(e) => setAccepted(e.target.checked)}
            style={{ marginTop: 2 }}
          />
          <span style={termsText}>
            Li e aceito os{' '}
            <a href="/termos-plano" target="_blank" rel="noopener noreferrer" style={termsLink}>
              Termos de Planos e Assinatura
            </a>
            . O pagamento e por boleto ou Pix; a cobranca se repete todo mes ate o cancelamento.
          </span>
        </label>

        <div style={plansRow}>
          <div style={planCard}>
            <p style={planName}>Autonomo</p>
            <p style={planPrice}>R$&nbsp;59,90<span style={planPer}>/mes</span></p>
            <p style={planDesc}>So voce. Agenda unica, caixa, clientes e link publico.</p>
            <button style={btnGhost} disabled={busy || !accepted} onClick={() => subscribe('AUTONOMO')}>
              {submitting === 'AUTONOMO' ? 'Aguarde...' : r.cta}
            </button>
          </div>

          <div style={{ ...planCard, border: '2px solid #dc2626' }}>
            <span style={badge}>Completo</span>
            <p style={planName}>Estabelecimento</p>
            <p style={planPrice}>R$&nbsp;99,90<span style={planPer}>/mes</span></p>
            <p style={planDesc}>Equipe ate 3 inclusos + todos os modulos.</p>
            <button style={btnRed} disabled={busy || !accepted} onClick={() => subscribe('ESTABELECIMENTO')}>
              {submitting === 'ESTABELECIMENTO' ? 'Aguarde...' : r.cta}
            </button>
          </div>
        </div>

        {err && <p style={errStyle}>{err}</p>}

        <button onClick={logout} style={signOut} disabled={busy}>Sair da conta</button>
      </div>
    </div>

      {seatGate && (
        <div style={{ ...overlay, zIndex: 1000000 }}>
          <div style={{ ...modal, maxWidth: 440 }}>
            {seatGate.kind === 'SELECT' ? (
              <>
                <p style={titleStyle}>Escolha quem continua</p>
                <p style={subStyle}>
                  O plano Autonomo cobre 1 profissional. Selecione quem fica ativo — os demais serao
                  desativados (dados preservados; da pra reativar ao mudar de plano).
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, textAlign: 'left', marginBottom: 16 }}>
                  {seatGate.professionals.map((p) => (
                    <label
                      key={p.id}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px',
                        border: keepId === p.id ? '1px solid #dc2626' : '1px solid rgba(0,0,0,0.12)',
                        borderRadius: 10, cursor: 'pointer',
                      }}
                    >
                      <input type="radio" name="keep" checked={keepId === p.id} onChange={() => setKeepId(p.id)} />
                      <span style={{ fontSize: 14, color: '#18181b' }}>
                        {p.name}{p.role ? <span style={{ color: '#71717a' }}> · {p.role}</span> : null}
                      </span>
                    </label>
                  ))}
                </div>
                <button style={btnRed} disabled={busy || !keepId} onClick={() => keepId && subscribe(seatGate.plan, { keepProfessionalIds: [keepId] })}>
                  {busy ? 'Aguarde...' : 'Confirmar e assinar'}
                </button>
              </>
            ) : (
              <>
                <p style={titleStyle}>Confirmar valor</p>
                <p style={subStyle}>
                  Voce tem {seatGate.activeCount} profissionais ativos. O Estabelecimento inclui 3; os {seatGate.extras}
                  {' '}extra(s) custam R$&nbsp;{seatGate.extraPrice.toFixed(2).replace('.', ',')}/mes cada. Total:{' '}
                  <strong>R$&nbsp;{seatGate.value.toFixed(2).replace('.', ',')}/mes</strong>.
                </p>
                <button style={btnRed} disabled={busy} onClick={() => subscribe(seatGate.plan, { acceptBilling: true })}>
                  {busy ? 'Aguarde...' : 'Confirmar e assinar'}
                </button>
              </>
            )}
            <button onClick={() => setSeatGate(null)} style={signOut} disabled={busy}>Voltar</button>
          </div>
        </div>
      )}
    </>
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
  position: 'relative',
  maxWidth: 560, width: '100%', textAlign: 'center',
  boxShadow: '0 20px 60px rgba(0,0,0,0.25)',
}
const titleStyle: React.CSSProperties = { fontSize: 20, fontWeight: 600, margin: '0 0 8px', color: '#18181b' }
const subStyle: React.CSSProperties = { fontSize: 14, color: '#71717a', margin: '0 0 20px', lineHeight: 1.6 }
const inputStyle: React.CSSProperties = {
  width: '100%', boxSizing: 'border-box', padding: '11px 14px', marginBottom: 14,
  border: '0.5px solid rgba(0,0,0,0.2)', borderRadius: 10, fontSize: 14, outline: 'none',
}
const termsRow: React.CSSProperties = {
  display: 'flex', gap: 8, alignItems: 'flex-start', textAlign: 'left',
  marginBottom: 16, cursor: 'pointer',
}
const termsText: React.CSSProperties = { fontSize: 12.5, color: '#52525b', lineHeight: 1.5 }
const termsLink: React.CSSProperties = { color: '#dc2626', textDecoration: 'underline' }
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
const closeBtn: React.CSSProperties = {
  position: 'absolute', top: 12, right: 14, width: 30, height: 30,
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  background: 'none', border: 'none', borderRadius: 8,
  fontSize: 22, lineHeight: 1, color: '#a1a1aa', cursor: 'pointer',
}
