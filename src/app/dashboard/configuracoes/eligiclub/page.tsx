"use client"
// src/app/dashboard/configuracoes/eligiclub/page.tsx
//
// ATIVAÇÃO DA COBRANÇA DO CLUBE (subconta Asaas White Label).
// O Eligi CRIA a conta de pagamentos do lojista via API — ele nunca sai do dashboard.
//
// Estados: (1) nao conectado -> formulario · (2) em analise -> enviar documentos
//          (3) aprovado -> cobrando + assinaturas aguardando pagamento · (4) isento
//
// Mobile-first: inputs 16px (sem zoom iOS), alvos >= 44px, mascaras ao vivo.
// React Compiler: subcomponentes em escopo de modulo.

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import {
  ChevronLeft, AlertCircle, Check, Download, Loader2, ShieldCheck, Link2, MessageCircle, Upload, FileText,
} from 'lucide-react'
import api from '@/shared/lib/apiClient'
import EligiClubIcon from '@/app/components/navigation/EligiClubIcon'
import { waLink, clubPaymentMessage } from '@/shared/utils/whatsapp'
import AsaasSeal, { AsaasSupportNote } from '@/shared/components/AsaasSeal'

// ── tipos ───────────────────────────────────────────────────────────────────
interface AccountOnboarding {
  connected: boolean
  accountId: string | null
  status: string
  approved: boolean
  general: string | null
  documentation: string | null
  commercialInfo: string | null
  onboardingUrl: string | null
  pendingDocs: string[]
  /** grupos que precisam de upload por aqui (sem onboardingUrl) */
  pendingDocIds?: { id: string; type: string }[]
  isento: boolean
}
interface PendingSub {
  id: string
  status: string
  value: number | null
  plan: { name: string; price: number } | null
  client: { name: string; phone: string | null } | null
}
interface PaymentLink {
  checkoutUrl: string | null
  mode: string
  status: string
  businessName: string
  clientName: string
  clientPhone: string | null
}
type CompanyType = 'MEI' | 'LIMITED'

// ── helpers ─────────────────────────────────────────────────────────────────
const DOC_LABEL: Record<string, string> = {
  IDENTIFICATION: 'Identificação (RG/CNH)',
  SELFIE: 'Selfie do titular',
  SOCIAL_CONTRACT: 'Contrato social',
  ENTREPRENEUR_REQUIREMENT: 'Requerimento de empresário',
  MINUTES_OF_ELECTION: 'Ata de eleição',
  CUSTOM: 'Documento adicional',
}
function docLabel(t: string): string {
  return DOC_LABEL[t] ?? t.replace(/_/g, ' ').toLowerCase()
}
function onlyDigits(v: string): string { return v.replace(/\D/g, '') }
function maskPhone(v: string): string {
  const d = onlyDigits(v).slice(0, 11)
  if (d.length <= 2) return d
  if (d.length <= 7) return `(${d.slice(0, 2)}) ${d.slice(2)}`
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`
}
function maskMoney(v: string): string {
  const d = onlyDigits(v)
  if (!d) return ''
  return (Number(d) / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}
function moneyToNumber(v: string): number { return Number(onlyDigits(v)) / 100 }
function brl(v: number): string {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

// ── upload de documento cadastral ──
const DOC_MAX_MB = 5
const DOC_ACCEPT = '.pdf,.jpg,.jpeg,.png'
const DOC_MIMES = ['application/pdf', 'image/jpeg', 'image/png']

/** Le o arquivo como data URL (base64) — formato que o back espera. */
function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader()
    r.onload = () => resolve(String(r.result))
    r.onerror = () => reject(new Error('Falha ao ler o arquivo'))
    r.readAsDataURL(file)
  })
}

// ── estilos ─────────────────────────────────────────────────────────────────
const CARD: React.CSSProperties = {
  background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(20px)',
  border: '1px solid rgba(0,0,0,0.07)', borderRadius: 15,
  boxShadow: '0 1px 6px rgba(0,0,0,0.04)', padding: 20,
}
const LABEL: React.CSSProperties = {
  fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 6, display: 'block',
}
const INPUT: React.CSSProperties = {
  width: '100%', padding: '13px 12px', border: '1px solid rgba(0,0,0,0.13)',
  borderRadius: 10, fontSize: 16, fontFamily: 'inherit', background: '#fff',
  marginBottom: 14, outline: 'none', WebkitAppearance: 'none',
}
const BTN: React.CSSProperties = {
  width: '100%', padding: 15, border: 'none', borderRadius: 11,
  background: 'linear-gradient(135deg,#dc2626,#b91c1c)', color: '#fff',
  fontSize: 15, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, minHeight: 50,
}
// O texto solto foi substituido pelo SELO OFICIAL (exigencia do playbook BaaS).
const ASAAS_HINT: React.CSSProperties = {
  fontSize: 10.5, color: 'rgba(0,0,0,0.35)', marginTop: 10, textAlign: 'center',
}
const MINI_BTN: React.CSSProperties = {
  flex: 1, minHeight: 44, padding: '10px 12px', borderRadius: 9,
  fontSize: 12.5, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
  border: '1px solid rgba(0,0,0,0.12)', background: '#fff', color: '#374151',
  textDecoration: 'none',
}

// ── subcomponentes ──────────────────────────────────────────────────────────
function Header({ onBack }: { onBack: () => void }) {
  return (
    <>
      <button onClick={onBack} style={{
        display: 'flex', alignItems: 'center', gap: 4, background: 'none', border: 'none',
        cursor: 'pointer', color: 'rgba(0,0,0,0.5)', fontSize: 13, marginBottom: 14,
        fontFamily: 'inherit', padding: '6px 0', minHeight: 40,
      }}>
        <ChevronLeft size={16} /> Configurações
      </button>
      <div style={{ display: 'flex', alignItems: 'center', gap: 11, marginBottom: 18 }}>
        <span style={{
          width: 42, height: 42, borderRadius: 12, background: '#0E0E12', flexShrink: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <EligiClubIcon size={21} color="#F4F2EC" />
        </span>
        <div>
          <h2 style={{ margin: 0, fontSize: 19, fontWeight: 700, letterSpacing: '-0.02em' }}>
            Cobrança do clube
          </h2>
          <div style={{ fontSize: 12.5, color: 'rgba(0,0,0,0.45)', marginTop: 2 }}>
            Mensalidades no cartão, automaticamente
          </div>
        </div>
      </div>
    </>
  )
}

function Banner({ tone, children }: { tone: 'amber' | 'red' | 'green'; children: React.ReactNode }) {
  const cfg = {
    amber: { bg: 'rgba(245,158,11,0.09)', bd: 'rgba(245,158,11,0.22)', fg: '#92600a' },
    red: { bg: 'rgba(220,38,38,0.08)', bd: 'rgba(220,38,38,0.2)', fg: '#b91c1c' },
    green: { bg: 'rgba(22,163,74,0.07)', bd: 'rgba(22,163,74,0.2)', fg: '#15803d' },
  }[tone]
  return (
    <div style={{
      display: 'flex', gap: 9, background: cfg.bg, border: `1px solid ${cfg.bd}`,
      borderRadius: 10, padding: '12px 14px', fontSize: 12.5, color: cfg.fg,
      lineHeight: 1.5, marginBottom: 16, alignItems: 'flex-start',
    }}>
      {tone === 'green' ? <Check size={15} style={{ flexShrink: 0, marginTop: 1 }} />
        : <AlertCircle size={15} style={{ flexShrink: 0, marginTop: 1 }} />}
      <span>{children}</span>
    </div>
  )
}

function StatusRow({ color, title, meta }: { color: string; title: string; meta: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
      <span style={{ width: 9, height: 9, borderRadius: '50%', background: color, flexShrink: 0 }} />
      <div>
        <div style={{ fontSize: 14, fontWeight: 600 }}>{title}</div>
        <div style={{ fontSize: 11.5, color: '#8a8a92', marginTop: 2 }}>{meta}</div>
      </div>
    </div>
  )
}

function Divider() {
  return <div style={{ height: 1, background: 'rgba(0,0,0,0.06)', margin: '16px 0' }} />
}

function SegOption({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} style={{
      flex: 1, padding: 13, minHeight: 48,
      border: `1px solid ${active ? '#dc2626' : 'rgba(0,0,0,0.13)'}`,
      borderRadius: 10, textAlign: 'center', fontSize: 13.5, fontWeight: 600,
      cursor: 'pointer', fontFamily: 'inherit',
      background: active ? 'rgba(220,38,38,0.06)' : '#fff',
      color: active ? '#dc2626' : '#111827', transition: 'all 0.15s ease',
    }}>
      {label}
    </button>
  )
}

/** Linha de assinatura aguardando pagamento: copiar link + enviar no WhatsApp. */
function PendingRow({
  sub, busy, copied, onCopy, onWhats,
}: {
  sub: PendingSub
  busy: boolean
  copied: boolean
  onCopy: (id: string) => void
  onWhats: (id: string) => void
}) {
  const price = sub.value ?? sub.plan?.price ?? 0
  return (
    <div style={{ padding: '14px 0', borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
      <div style={{ fontSize: 13.5, fontWeight: 600, color: '#1c1c1e' }}>
        {sub.client?.name ?? 'Cliente'}
      </div>
      <div style={{ fontSize: 11.5, color: '#8a8a92', marginTop: 2, marginBottom: 10 }}>
        {sub.plan?.name ?? 'Plano'} · {brl(price)}/mês
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <button onClick={() => onCopy(sub.id)} disabled={busy} style={{ ...MINI_BTN, opacity: busy ? 0.6 : 1 }}>
          {busy ? <Loader2 size={14} style={{ animation: 'eligi-spin 0.9s linear infinite' }} />
            : copied ? <Check size={14} color="#16a34a" /> : <Link2 size={14} />}
          {copied ? 'Copiado' : 'Copiar link'}
        </button>
        {sub.client?.phone && (
          <button onClick={() => onWhats(sub.id)} disabled={busy} style={{
            ...MINI_BTN, opacity: busy ? 0.6 : 1,
            border: '1px solid rgba(30,190,90,0.35)', background: 'rgba(30,190,90,0.07)', color: '#128c4a',
          }}>
            <MessageCircle size={14} /> WhatsApp
          </button>
        )}
      </div>
    </div>
  )
}

// ── página ──────────────────────────────────────────────────────────────────
export default function EligiClubCobrancaPage() {
  const router = useRouter()

  const [acc, setAcc] = useState<AccountOnboarding | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [companyType, setCompanyType] = useState<CompanyType>('MEI')
  const [mobilePhone, setMobilePhone] = useState('')
  // e-mail da conta de pagamentos. Vazio = usa o e-mail do dono.
  // Necessario quando o lojista JA tem conta Asaas (o e-mail e unico la).
  const [email, setEmail] = useState('')
  const [addressNumber, setAddressNumber] = useState('')
  const [province, setProvince] = useState('')
  const [income, setIncome] = useState('')

  const [pending, setPending] = useState<PendingSub[]>([])
  const [busyId, setBusyId] = useState<string | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [linkError, setLinkError] = useState<string | null>(null)

  // upload de documentos cadastrais (grupos sem onboardingUrl)
  const [uploadingId, setUploadingId] = useState<string | null>(null)
  const [docError, setDocError] = useState<string | null>(null)
  const [sentDocIds, setSentDocIds] = useState<string[]>([])
  const [refreshing, setRefreshing] = useState(false)
  const docInputs = useRef<Record<string, HTMLInputElement | null>>({})

  const load = useCallback(async () => {
    try {
      const res = await api.get('/club-subscriptions/asaas/account-status')
      const data = (res.data?.data ?? null) as AccountOnboarding | null
      setAcc(data)
      if (data?.approved) {
        try {
          const subs = await api.get('/club-subscriptions?status=PENDING')
          setPending(((subs.data?.data ?? []) as PendingSub[]).filter(s => s.status === 'PENDING'))
        } catch { setPending([]) }
      }
    } catch {
      setAcc(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { void load() }, [load])

  const activate = useCallback(async () => {
    if (onlyDigits(mobilePhone).length < 10) { setError('Informe um celular válido com DDD.'); return }
    if (email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError('E-mail inválido.'); return
    }
    if (!addressNumber.trim()) { setError('Informe o número do endereço.'); return }
    if (!province.trim()) { setError('Informe o bairro.'); return }
    const inc = moneyToNumber(income)
    if (!inc || inc <= 0) { setError('Informe o faturamento mensal aproximado.'); return }

    setSaving(true); setError(null)
    try {
      await api.post('/club-subscriptions/asaas/provision', {
        companyType, mobilePhone: onlyDigits(mobilePhone),
        addressNumber: addressNumber.trim(), province: province.trim(), incomeValue: inc,
        ...(email.trim() ? { email: email.trim() } : {}),
      })
      await load()
    } catch (e: unknown) {
      const res = (e as { response?: { data?: { error?: string; code?: string } } })?.response?.data
      setError(res?.error ?? 'Não foi possível ativar a cobrança. Tente novamente.')
      // e-mail ja usado no Asaas: leva o cursor direto pro campo que precisa mudar
      if (res?.code === 'ASAAS_EMAIL_IN_USE') {
        window.setTimeout(() => {
          document.getElementById('club-asaas-email')?.focus()
        }, 60)
      }
    } finally {
      setSaving(false)
    }
  }, [companyType, mobilePhone, addressNumber, province, income, email, load])

  /** Busca o link no Asaas (sob demanda) e devolve os dados da mensagem. */
  const fetchLink = useCallback(async (id: string): Promise<PaymentLink | null> => {
    setBusyId(id); setLinkError(null)
    try {
      const res = await api.get(`/club-subscriptions/${id}/payment-link`)
      const data = (res.data?.data ?? null) as PaymentLink | null
      if (!data?.checkoutUrl) {
        setLinkError('Link de pagamento indisponível para esta assinatura.')
        return null
      }
      return data
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { error?: string } } })?.response?.data?.error
      setLinkError(msg ?? 'Não foi possível obter o link.')
      return null
    } finally {
      setBusyId(null)
    }
  }, [])

  const handleCopy = useCallback(async (id: string) => {
    const data = await fetchLink(id)
    if (!data?.checkoutUrl) return
    try {
      await navigator.clipboard.writeText(data.checkoutUrl)
      setCopiedId(id)
      window.setTimeout(() => setCopiedId(null), 2200)
    } catch {
      setLinkError('Não foi possível copiar. Link: ' + data.checkoutUrl)
    }
  }, [fetchLink])

  const handleWhats = useCallback(async (id: string) => {
    const data = await fetchLink(id)
    if (!data?.checkoutUrl || !data.clientPhone) return
    const msg = clubPaymentMessage(data.clientName, data.businessName, data.checkoutUrl)
    window.open(waLink(data.clientPhone, msg), '_blank', 'noopener,noreferrer')
  }, [fetchLink])

  /** Valida no cliente antes de gastar request, converte e envia. */
  const handleDocFile = useCallback(async (docId: string, type: string, file: File | undefined) => {
    if (!file) return
    setDocError(null)

    if (!DOC_MIMES.includes(file.type)) {
      setDocError('Envie um arquivo PDF, JPG ou PNG.')
      return
    }
    if (file.size > DOC_MAX_MB * 1024 * 1024) {
      setDocError(`O arquivo deve ter no máximo ${DOC_MAX_MB} MB.`)
      return
    }

    setUploadingId(docId)
    try {
      const fileBase64 = await fileToBase64(file)
      await api.post(`/club-subscriptions/asaas/documents/${docId}`, {
        type, fileName: file.name, mimeType: file.type, fileBase64,
      })
      setSentDocIds(prev => [...prev, docId])
      await load() // o back ja invalidou o cache; reflete na hora
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { error?: string } } })?.response?.data?.error
      setDocError(msg ?? 'Não foi possível enviar o documento. Tente novamente.')
    } finally {
      setUploadingId(null)
    }
  }, [load])

  /** Botao "Atualizar situacao": consulta o Asaas ignorando o cache. */
  const refreshStatus = useCallback(async () => {
    setRefreshing(true)
    setDocError(null)
    try {
      const res = await api.get('/club-subscriptions/asaas/account-status?force=1')
      setAcc((res.data?.data ?? null) as AccountOnboarding | null)
    } catch {
      setDocError('Não foi possível atualizar agora. Tente novamente em instantes.')
    } finally {
      setRefreshing(false)
    }
  }, [])

  const goBack = useCallback(() => router.push('/dashboard/configuracoes'), [router])

  if (loading) {
    return <div style={{ padding: 40, textAlign: 'center', color: 'rgba(0,0,0,0.4)' }}>Carregando…</div>
  }

  const connected = !!acc?.connected
  const approved = !!acc?.approved
  const emAnalise = connected && !approved

  return (
    <div style={{ maxWidth: 540, fontFamily: '-apple-system,"SF Pro Display",system-ui,sans-serif' }}>
      <style>{`@keyframes eligi-spin { to { transform: rotate(360deg) } }`}</style>
      <Header onBack={goBack} />

      {acc?.isento && (
        <Banner tone="amber">
          <b>Modo teste</b> — as cobranças são simuladas e não geram pagamento real.
        </Banner>
      )}

      {/* ── 1: não conectado ── */}
      {!connected && (
        <div style={CARD}>
          <p style={{ fontSize: 12.5, color: 'rgba(0,0,0,0.5)', lineHeight: 1.55, marginBottom: 18 }}>
            Sua conta de pagamentos é aberta no <b>Asaas</b>, sem você sair do Eligi. Confirme alguns
            dados do seu negócio para começar.
          </p>

          {error && <Banner tone="red">{error}</Banner>}

          <label style={LABEL}>Tipo de empresa</label>
          <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
            <SegOption label="MEI" active={companyType === 'MEI'} onClick={() => setCompanyType('MEI')} />
            <SegOption label="LTDA / ME" active={companyType === 'LIMITED'} onClick={() => setCompanyType('LIMITED')} />
          </div>

          <label style={LABEL}>Celular do responsável</label>
          <input style={INPUT} value={mobilePhone} onChange={e => setMobilePhone(maskPhone(e.target.value))}
            placeholder="(11) 99999-9999" inputMode="numeric" autoComplete="tel" />

          <label style={LABEL}>
            E-mail da conta de pagamentos <span style={{ fontWeight: 400, color: '#9a9aa2' }}>(opcional)</span>
          </label>
          <input
            id="club-asaas-email"
            style={INPUT}
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="deixe em branco para usar o e-mail da sua conta"
            inputMode="email"
            autoComplete="email"
            type="email"
          />
          <div style={{ fontSize: 11, color: '#9a9aa2', margin: '-8px 0 14px', lineHeight: 1.45 }}>
            Se você já tem conta no Asaas, informe um e-mail diferente aqui — cada conta precisa
            de um e-mail próprio.
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            <div style={{ flex: 1 }}>
              <label style={LABEL}>Número</label>
              <input style={INPUT} value={addressNumber} onChange={e => setAddressNumber(e.target.value)}
                placeholder="123" inputMode="numeric" />
            </div>
            <div style={{ flex: 2 }}>
              <label style={LABEL}>Bairro</label>
              <input style={INPUT} value={province} onChange={e => setProvince(e.target.value)} placeholder="Centro" />
            </div>
          </div>

          <label style={LABEL}>Faturamento mensal aproximado</label>
          <input style={INPUT} value={income} onChange={e => setIncome(maskMoney(e.target.value))}
            placeholder="R$ 5.000,00" inputMode="numeric" />
          <div style={{ fontSize: 11, color: '#9a9aa2', margin: '-8px 0 16px', lineHeight: 1.45 }}>
            Exigido pelo provedor de pagamentos para a análise cadastral.
          </div>

          <button onClick={activate} disabled={saving} style={{ ...BTN, opacity: saving ? 0.65 : 1 }}>
            {saving && <Loader2 size={16} style={{ animation: 'eligi-spin 0.9s linear infinite' }} />}
            {saving ? 'Ativando…' : 'Ativar cobrança'}
          </button>
          <AsaasSeal variant="positivo" />
          <AsaasSupportNote />
        </div>
      )}

      {/* ── 2: em análise ── */}
      {emAnalise && (
        <div style={CARD}>
          <StatusRow color="#f59e0b" title="Conta em análise"
            meta="Aprovação em até 48h após o envio dos documentos" />
          <Divider />
          <Banner tone="amber">Para liberar a cobrança, envie seus documentos. Leva 2 minutos.</Banner>

          {docError && <Banner tone="red">{docError}</Banner>}

          {/* documentos que exigem upload por aqui (sem onboardingUrl) */}
          {(acc!.pendingDocIds ?? []).length > 0 && (
            <>
              <div style={{ fontSize: 12, color: '#555', marginBottom: 8 }}>
                Envie os documentos abaixo:
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
                {(acc!.pendingDocIds ?? []).map(d => {
                  const enviando = uploadingId === d.id
                  const enviado = sentDocIds.includes(d.id)
                  return (
                    <div key={d.id} style={{
                      display: 'flex', alignItems: 'center', gap: 10,
                      padding: '11px 13px', borderRadius: 10,
                      border: '1px solid rgba(0,0,0,0.09)', background: '#fff',
                    }}>
                      <FileText size={16} style={{ color: '#8a8a92', flexShrink: 0 }} />
                      <span style={{ flex: 1, fontSize: 12.5, fontWeight: 600, color: '#374151' }}>
                        {docLabel(d.type)}
                      </span>
                      <input
                        ref={el => { docInputs.current[d.id] = el }}
                        type="file"
                        accept={DOC_ACCEPT}
                        style={{ display: 'none' }}
                        onChange={e => {
                          void handleDocFile(d.id, d.type, e.target.files?.[0])
                          e.target.value = ''
                        }}
                      />
                      <button
                        onClick={() => docInputs.current[d.id]?.click()}
                        disabled={enviando}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 6,
                          minHeight: 40, padding: '8px 12px', borderRadius: 9,
                          fontSize: 12.5, fontWeight: 600, fontFamily: 'inherit',
                          cursor: enviando ? 'default' : 'pointer',
                          border: `1px solid ${enviado ? 'rgba(22,163,74,0.35)' : 'rgba(0,0,0,0.12)'}`,
                          background: enviado ? 'rgba(22,163,74,0.07)' : '#fff',
                          color: enviado ? '#15803d' : '#374151',
                          opacity: enviando ? 0.6 : 1, flexShrink: 0,
                        }}
                      >
                        {enviando
                          ? <Loader2 size={14} style={{ animation: 'eligi-spin 0.9s linear infinite' }} />
                          : enviado ? <Check size={14} /> : <Upload size={14} />}
                        {enviando ? 'Enviando…' : enviado ? 'Enviado' : 'Escolher'}
                      </button>
                    </div>
                  )
                })}
              </div>
              <div style={{ fontSize: 11, color: '#9a9aa2', margin: '-8px 0 16px', lineHeight: 1.45 }}>
                PDF, JPG ou PNG · até {DOC_MAX_MB} MB cada.
              </div>
            </>
          )}

          {false && acc!.pendingDocs.length > 0 && (
            <>
              <div style={{ fontSize: 12, color: '#555', marginBottom: 6 }}>Pendentes:</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 16 }}>
                {acc!.pendingDocs.map(d => (
                  <span key={d} style={{
                    fontSize: 11.5, background: 'rgba(0,0,0,0.05)', borderRadius: 20,
                    padding: '5px 11px', color: '#555',
                  }}>{docLabel(d)}</span>
                ))}
              </div>
            </>
          )}

          {acc!.onboardingUrl ? (
            <a href={acc!.onboardingUrl} target="_blank" rel="noopener noreferrer"
              style={{ ...BTN, background: '#0E0E12', textDecoration: 'none' }}>
              <Download size={16} /> Enviar documentos
            </a>
          ) : (
            <button
              onClick={() => void refreshStatus()}
              disabled={refreshing}
              style={{
                ...BTN, background: '#fff', color: '#374151',
                border: '1px solid rgba(0,0,0,0.12)', opacity: refreshing ? 0.65 : 1,
              }}
            >
              {refreshing && <Loader2 size={15} style={{ animation: 'eligi-spin 0.9s linear infinite' }} />}
              {refreshing ? 'Atualizando…' : 'Atualizar situação'}
            </button>
          )}
          <div style={ASAAS_HINT}>Você será direcionado ao ambiente seguro do Asaas</div>
          <AsaasSeal variant="positivo" />
          <AsaasSupportNote />
        </div>
      )}

      {/* ── 3: aprovado ── */}
      {approved && (
        <div style={CARD}>
          <StatusRow color="#16a34a" title="Cobrança ativa" meta="Conta de pagamentos aprovada" />
          <Divider />
          <Banner tone="green">
            As mensalidades do clube são cobradas automaticamente no cartão do cliente, todo mês.
          </Banner>

          {pending.length > 0 && (
            <>
              <Divider />
              <div style={{
                fontSize: 10.5, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase',
                color: 'rgba(0,0,0,0.35)', marginBottom: 4,
              }}>
                Aguardando pagamento ({pending.length})
              </div>
              <div style={{ fontSize: 11.5, color: '#8a8a92', marginBottom: 6 }}>
                Envie o link para o cliente cadastrar o cartão.
              </div>
              {linkError && <Banner tone="red">{linkError}</Banner>}
              {pending.map(s => (
                <PendingRow
                  key={s.id}
                  sub={s}
                  busy={busyId === s.id}
                  copied={copiedId === s.id}
                  onCopy={handleCopy}
                  onWhats={handleWhats}
                />
              ))}
            </>
          )}

          <div style={{
            display: 'flex', gap: 8, alignItems: 'center', marginTop: 16,
            fontSize: 11.5, color: 'rgba(0,0,0,0.4)',
          }}>
            <ShieldCheck size={14} style={{ flexShrink: 0 }} />
            <span>Os dados do cartão são tratados pelo Asaas — o Eligi nunca os armazena.</span>
          </div>
          <AsaasSeal variant="positivo" />
          <AsaasSupportNote />
        </div>
      )}
    </div>
  )
}
