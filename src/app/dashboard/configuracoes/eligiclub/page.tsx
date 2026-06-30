'use client'
// src/app/dashboard/configuracoes/eligiclub/page.tsx

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronLeft, User, RefreshCw, Wallet, Scissors, ChevronRight, Bell, Pencil } from 'lucide-react'
import api from '@/shared/lib/apiClient'
import EligiClubIcon from '@/app/components/navigation/EligiClubIcon'

interface AsaasStatus { connected: boolean; env: string | null; connectedAt: string | null; isento: boolean }
type Env = 'sandbox' | 'production'

function fmtDate(iso: string | null) {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' })
}

function ConfirmProdModal({ onConfirm, onCancel }: { onConfirm: () => void; onCancel: () => void }) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: 20 }} onClick={onCancel}>
      <div style={{ background: '#fff', borderRadius: 16, padding: 24, maxWidth: 380, width: '100%' }} onClick={e => e.stopPropagation()}>
        <div style={{ fontSize: 17, fontWeight: 700, marginBottom: 8 }}>Conectar em produção?</div>
        <div style={{ fontSize: 13.5, color: 'rgba(0,0,0,0.6)', lineHeight: 1.6, marginBottom: 20 }}>
          Isso vai habilitar <b>cobranças reais</b> dos seus clientes. As mensalidades do clube passarão a ser cobradas de verdade pela sua conta Asaas.
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={onCancel} style={{ flex: 1, padding: 12, borderRadius: 11, border: '1px solid rgba(0,0,0,0.12)', background: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>Cancelar</button>
          <button onClick={onConfirm} style={{ flex: 1, padding: 12, borderRadius: 11, border: 'none', background: 'linear-gradient(135deg,#dc2626,#b91c1c)', color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>Conectar</button>
        </div>
      </div>
    </div>
  )
}

// Tela "em desenvolvimento" — mostrada a quem NAO esta isento do clube (lojista comum).
// Fora do render (regra do React Compiler).
function ClubEmDesenvolvimento() {
  const steps = [
    { Icon: User,      t: 'O cliente assina',    d: 'Escolhe um plano e vira assinante do seu negócio' },
    { Icon: RefreshCw, t: 'Paga a mensalidade',  d: 'Cobrança automática todo mês, sem correr atrás' },
    { Icon: Wallet,    t: 'Vira um pote',        d: 'Parte da mensalidade é separada pra equipe' },
    { Icon: Scissors,  t: 'Rateia pra equipe',   d: 'Dividido entre os profissionais conforme os atendimentos' },
  ]
  return (
    <div style={{ maxWidth: 520, fontFamily: '-apple-system,system-ui,sans-serif' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
        <span style={{ width: 42, height: 42, borderRadius: 12, background: '#0E0E12', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <EligiClubIcon size={22} color="#F4F2EC" />
        </span>
        <div>
          <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, letterSpacing: '-0.02em' }}>EligiClub</h2>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 10.5, fontWeight: 600, color: '#92600a', background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.25)', borderRadius: 20, padding: '3px 9px', marginTop: 7 }}>
            <Pencil size={11} /> Em desenvolvimento
          </span>
        </div>
      </div>
      <p style={{ fontSize: 13, color: 'rgba(0,0,0,0.5)', lineHeight: 1.55, margin: '16px 0 26px', maxWidth: 440 }}>
        O clube de assinatura do seu negócio está sendo construído. Em breve seus clientes poderão assinar um plano mensal — uma renda recorrente, parte revertida pra sua equipe.
      </p>
      <div style={{ background: 'rgba(255,255,255,0.8)', backdropFilter: 'blur(20px)', border: '1px solid rgba(0,0,0,0.06)', borderRadius: 16, padding: '8px 0' }}>
        {steps.map((s, idx) => (
          <div key={s.t} style={{ display: 'flex', gap: 14, alignItems: 'center', padding: '16px 22px', borderBottom: idx < steps.length - 1 ? '1px solid rgba(0,0,0,0.04)' : 'none' }}>
            <span style={{ color: '#6b7280', flexShrink: 0, display: 'flex' }}><s.Icon size={20} strokeWidth={1.7} /></span>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13.5, fontWeight: 600, color: '#1c1c1e' }}>{s.t}</div>
              <div style={{ fontSize: 12, color: 'rgba(0,0,0,0.45)', lineHeight: 1.45, marginTop: 2 }}>{s.d}</div>
            </div>
            {idx < steps.length - 1 && (
              <span style={{ color: 'rgba(0,0,0,0.18)', flexShrink: 0, display: 'flex' }}><ChevronRight size={16} /></span>
            )}
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'rgba(0,0,0,0.4)', marginTop: 20, lineHeight: 1.5 }}>
        <span style={{ color: 'rgba(0,0,0,0.3)', flexShrink: 0, display: 'flex' }}><Bell size={14} /></span>
        Avisaremos assim que estiver disponível. Nenhuma ação é necessária agora.
      </div>
    </div>
  )
}

export default function EligiClubAsaasPage() {
  const router = useRouter()
  const [status, setStatus] = useState<AsaasStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [apiKey, setApiKey] = useState('')
  const [env, setEnv] = useState<Env>('sandbox')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [editing, setEditing] = useState(false)
  const [confirmProd, setConfirmProd] = useState(false)

  const loadStatus = useCallback(async () => {
    try {
      const res = await api.get('/club-subscriptions/asaas/status')
      setStatus((res.data?.data ?? null) as AsaasStatus | null)
    } catch {
      setStatus(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { void loadStatus() }, [loadStatus])

  const doConnect = useCallback(async () => {
    setConfirmProd(false)
    setSaving(true)
    setError(null)
    try {
      await api.post('/club-subscriptions/asaas/connect', { apiKey: apiKey.trim(), env })
      setApiKey('')
      setEditing(false)
      await loadStatus()
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { error?: string } } })?.response?.data?.error
      setError(msg ?? 'Não foi possível conectar. Tente novamente.')
    } finally {
      setSaving(false)
    }
  }, [apiKey, env, loadStatus])

  const handleConnect = useCallback(() => {
    if (!apiKey.trim()) { setError('Cole a API key do Asaas.'); return }
    if (env === 'production') { setConfirmProd(true); return }
    void doConnect()
  }, [apiKey, env, doConnect])

  if (loading) return <div style={{ padding: 40, textAlign: 'center', color: 'rgba(0,0,0,0.4)' }}>Carregando…</div>

  // Gate: enquanto o EligiClub esta em desenvolvimento, so contas isentas (modo teste)
  // veem a tela funcional. Lojista comum (isento=false) ve a tela "em desenvolvimento".
  if (!status?.isento) return <ClubEmDesenvolvimento />

  const connected = status?.connected && !editing

  return (
    <div style={{ maxWidth: 560, fontFamily: '-apple-system,system-ui,sans-serif' }}>
      <button onClick={() => router.push('/dashboard/configuracoes')} style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(0,0,0,0.5)', fontSize: 13, marginBottom: 16, fontFamily: 'inherit' }}>
        <ChevronLeft size={16} /> Configurações
      </button>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <span style={{ width: 44, height: 44, borderRadius: 12, background: '#0E0E12', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <EligiClubIcon size={22} color="#F4F2EC" />
        </span>
        <div>
          <h2 style={{ margin: 0, fontSize: 22, fontWeight: 700, letterSpacing: '-0.025em' }}>EligiClub — Cobrança recorrente</h2>
          <p style={{ margin: '4px 0 0', fontSize: 14, color: 'rgba(0,0,0,0.45)' }}>Conecte sua conta Asaas para cobrar as mensalidades do clube automaticamente.</p>
        </div>
      </div>

      <div style={{ background: 'rgba(255,255,255,0.88)', backdropFilter: 'blur(20px)', border: '1px solid rgba(0,0,0,0.07)', borderRadius: 14, boxShadow: '0 1px 6px rgba(0,0,0,0.04)', padding: 22 }}>
        {status?.isento && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.25)', borderRadius: 10, padding: '11px 14px', fontSize: 12.5, color: '#92600a', marginBottom: 18 }}>
            ⚠️ Conta em <b>modo teste</b> — as cobranças são simuladas (não cobram de verdade).
          </div>
        )}

        {connected ? (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#16a34a', flexShrink: 0 }} />
              <div>
                <div style={{ fontSize: 14, fontWeight: 600 }}>Conectado ✓</div>
                <div style={{ fontSize: 12, color: '#8a8a92', marginTop: 2 }}>
                  {status?.env === 'production' ? 'Produção' : 'Sandbox'} · desde {fmtDate(status?.connectedAt ?? null)}
                </div>
              </div>
            </div>
            <div style={{ height: 1, background: 'rgba(0,0,0,0.06)', margin: '20px 0' }} />
            <div style={{ fontSize: 13, color: '#444', lineHeight: 1.6 }}>
              As mensalidades do clube agora são cobradas automaticamente pelo Asaas na sua conta.
            </div>
            <span onClick={() => { setEditing(true); setError(null) }} style={{ fontSize: 12.5, color: '#dc2626', fontWeight: 600, cursor: 'pointer', marginTop: 14, display: 'inline-block' }}>
              Trocar a chave →
            </span>
          </>
        ) : (
          <>
            {error && (
              <div style={{ background: 'rgba(220,38,38,0.08)', border: '1px solid rgba(220,38,38,0.2)', borderRadius: 10, padding: '11px 14px', fontSize: 12.5, color: '#b91c1c', marginBottom: 16 }}>
                ⚠️ {error}
              </div>
            )}
            <label style={{ fontSize: 12.5, fontWeight: 600, color: '#374151', marginBottom: 6, display: 'block' }}>API key do Asaas</label>
            <input
              type="password"
              value={apiKey}
              onChange={e => setApiKey(e.target.value)}
              placeholder="$aact_prod_••••"
              style={{ width: '100%', padding: '11px 13px', border: `1px solid ${error ? '#dc2626' : 'rgba(0,0,0,0.14)'}`, borderRadius: 10, fontSize: 13.5, fontFamily: 'inherit', background: '#fff', marginBottom: 8 }}
            />
            <div style={{ fontSize: 11.5, color: '#9a9aa2', marginBottom: 16, lineHeight: 1.5 }}>
              Pegue em: painel Asaas → Configurações → Integrações → Chave de API. Sua key é criptografada antes de ser salva.
            </div>
            <label style={{ fontSize: 12.5, fontWeight: 600, color: '#374151', marginBottom: 6, display: 'block' }}>Ambiente</label>
            <div style={{ display: 'flex', gap: 8, marginBottom: 18 }}>
              {(['sandbox', 'production'] as Env[]).map(opt => (
                <button key={opt} onClick={() => setEnv(opt)} style={{ flex: 1, padding: 11, border: `1px solid ${env === opt ? '#dc2626' : 'rgba(0,0,0,0.14)'}`, borderRadius: 10, textAlign: 'center', fontSize: 13, fontWeight: 600, cursor: 'pointer', background: env === opt ? 'rgba(220,38,38,0.06)' : '#fff', color: env === opt ? '#dc2626' : '#111', fontFamily: 'inherit' }}>
                  {opt === 'sandbox' ? 'Sandbox (teste)' : 'Produção (real)'}
                </button>
              ))}
            </div>
            <button onClick={handleConnect} disabled={saving} style={{ width: '100%', padding: 13, border: 'none', borderRadius: 11, background: 'linear-gradient(135deg,#dc2626,#b91c1c)', color: '#fff', fontSize: 14, fontWeight: 600, cursor: saving ? 'default' : 'pointer', opacity: saving ? 0.6 : 1, fontFamily: 'inherit' }}>
              {saving ? 'Testando…' : 'Testar e conectar'}
            </button>
          </>
        )}
      </div>

      {confirmProd && <ConfirmProdModal onConfirm={doConnect} onCancel={() => setConfirmProd(false)} />}
    </div>
  )
}
