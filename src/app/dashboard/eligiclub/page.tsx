'use client'
// src/app/dashboard/eligiclub/page.tsx
//
// EligiClub — clube de assinatura recorrente com rateio por fichas.
// 3 abas: Planos (/club) · Membros (/club-subscriptions) · Fechamento (/club-settlements).
//
// LOTE 1: leitura das 3 abas + fechar período + histórico.
//   "Novo plano" e "Assinar membro" chegam nos lotes 2 e 3 (dependem dos
//   endpoints de serviços e clientes). Por ora abrem um toast "em breve".
//
// Padrão espelhado do dashboard/pacotes: inline styles + tokens de @/shared/theme,
// sem Tailwind. React Compiler: indicador de aba e count-up via mutação de DOM
// em useLayoutEffect/useEffect (nunca setState por frame).

import { useState, useEffect, useCallback, useMemo, useRef, useLayoutEffect } from 'react'
import {
  Search, X, Plus, ChevronRight, ChevronLeft, Loader2, Layers, Users, PiggyBank,
  Coins, CheckCircle2, CalendarClock, Hash, type LucideIcon,
} from 'lucide-react'

import api from '@/shared/lib/apiClient'
import { colors, typography, transitions } from '@/shared/theme'
import { useDeviceMode } from '@/features/agenda/hooks/useDeviceMode'
import EligiClubIcon from '@/app/components/navigation/EligiClubIcon'
import ClubPlanEditorModal from './components/ClubPlanEditorModal'
import ClubSubscriptionModal from './components/ClubSubscriptionModal'

// ═══════════════════════════════════════════════════════════════════════════
// Tipos (espelham os includes do back-end)
// ═══════════════════════════════════════════════════════════════════════════
type SubStatus = 'PENDING' | 'ACTIVE' | 'PAST_DUE' | 'CANCELED'

interface PlanServiceRef {
  serviceId: string
  service: { id: string; name: string; duration: number; price: number; color: string | null }
}
interface ClubPlan {
  id: string
  name: string
  description: string | null
  price: number
  staffSharePct: number
  active: boolean
  color: string | null
  services: PlanServiceRef[]
  _count?: { subscriptions: number }
}
interface ClubSubscription {
  id: string
  status: SubStatus
  value: number | null
  billingType: string | null
  startedAt: string | null
  currentPeriodEnd: string | null
  canceledAt: string | null
  plan: { id: string; name: string; price: number; staffSharePct: number; color: string | null }
  client: { id: string; name: string; phone: string | null }
  payments?: { id: string; amount: number; periodKey: string; method: string | null; paidAt: string | null }[]
  _count?: { payments: number; fichas: number }
}
interface SettlementItem {
  professionalId: string
  professionalName: string
  fichas: number
  pct: number
  amount: number
}
interface SettlementPreview {
  periodKey: string
  poolTotal: number
  totalFichas: number
  paymentsCount: number
  alreadySettled: boolean
  items: SettlementItem[]
}
interface ClubSettlementRow {
  id: string
  periodKey: string
  poolTotal: number
  totalFichas: number
  settledAt: string | null
  _count?: { items: number }
}

// ═══════════════════════════════════════════════════════════════════════════
// Helpers
// ═══════════════════════════════════════════════════════════════════════════
const fmtBRL = (n: number) => n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
const fmtDate = (iso?: string | null) =>
  iso ? new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }) : '—'

// 'YYYY-MM' do mês em São Paulo
function spMonthKey(d: Date = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo', year: 'numeric', month: '2-digit' }).format(d)
}
function monthLabel(key: string): string {
  const [y, m] = key.split('-').map(Number)
  const s = new Date(y, m - 1, 1).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
  return s.charAt(0).toUpperCase() + s.slice(1)
}
function shiftMonth(key: string, delta: number): string {
  const [y, m] = key.split('-').map(Number)
  const d = new Date(y, m - 1 + delta, 1)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}
function initials(name?: string): string {
  if (!name) return '?'
  const parts = name.trim().split(/\s+/)
  return ((parts[0]?.[0] ?? '') + (parts.length > 1 ? parts[parts.length - 1][0] : '')).toUpperCase()
}
// cor estável a partir de um id (avatares de membros)
const AVATARS: [string, string][] = [
  ['#F87171', '#DC2626'], ['#A78BFA', '#7C3AED'], ['#60A5FA', '#2563EB'],
  ['#34D399', '#059669'], ['#FBBF24', '#D97706'], ['#F472B6', '#DB2777'],
]
function avatarGrad(seed: string): string {
  let h = 0
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0
  const [a, b] = AVATARS[h % AVATARS.length]
  return `linear-gradient(135deg,${a},${b})`
}

const SUB_STATUS: Record<SubStatus, { label: string; fg: string; bg: string }> = {
  ACTIVE:   { label: 'Ativo',     fg: '#15803D', bg: 'rgba(22,163,74,.12)' },
  PAST_DUE: { label: 'Vencido',   fg: '#B45309', bg: 'rgba(245,158,11,.15)' },
  PENDING:  { label: 'Pendente',  fg: '#6B7280', bg: 'rgba(17,17,20,.06)' },
  CANCELED: { label: 'Cancelado', fg: '#9AA1AC', bg: 'rgba(17,17,20,.05)' },
}

type Tab = 'planos' | 'membros' | 'fechamento'
const TABS: { id: Tab; label: string; Icon: LucideIcon }[] = [
  { id: 'planos',     label: 'Planos',     Icon: Layers },
  { id: 'membros',    label: 'Membros',    Icon: Users },
  { id: 'fechamento', label: 'Fechamento', Icon: PiggyBank },
]

// ═══════════════════════════════════════════════════════════════════════════
// Página
// ═══════════════════════════════════════════════════════════════════════════
export default function EligiClubPage() {
  const mode = useDeviceMode()
  const isMobile = mode === 'mobile'

  const [tab, setTab] = useState<Tab>('planos')
  const [toast, setToast] = useState<string | null>(null)

  // toast auto-dismiss
  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 2600)
    return () => clearTimeout(t)
  }, [toast])

  // indicador deslizante das abas (mutação de DOM — React Compiler safe)
  const tabsRef = useRef<HTMLDivElement>(null)
  const indRef = useRef<HTMLDivElement>(null)
  const positionInd = useCallback(() => {
    const wrap = tabsRef.current
    const ind = indRef.current
    if (!wrap || !ind) return
    const active = wrap.querySelector<HTMLButtonElement>(`[data-tab="${tab}"]`)
    if (!active) return
    ind.style.width = `${active.offsetWidth}px`
    ind.style.transform = `translateX(${active.offsetLeft - 4}px)`
  }, [tab])
  useLayoutEffect(() => { positionInd() }, [positionInd, isMobile])
  useEffect(() => {
    const onResize = () => positionInd()
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [positionInd])

  return (
    <>
      <style>{`
        @keyframes club-fade-up { from { opacity:0; transform:translateY(8px) } to { opacity:1; transform:translateY(0) } }
        @keyframes club-panel   { from { opacity:0; transform:translateY(6px) } to { opacity:1; transform:translateY(0) } }
        @keyframes club-spin     { to { transform: rotate(360deg) } }
        @keyframes club-sheen    { 0% { transform:translateX(-120%) } 55%,100% { transform:translateX(120%) } }
        .ec-pote-meta { color: rgba(255,255,255,0.92) !important; -webkit-text-fill-color: rgba(255,255,255,0.92) !important; }
        .ec-pote-meta b { color: #FF6B6B !important; -webkit-text-fill-color: #FF6B6B !important; }
        @keyframes club-pulse    { 0% { box-shadow:0 0 0 0 ${colors.red.glow} } 70% { box-shadow:0 0 0 12px transparent } 100% { box-shadow:0 0 0 0 transparent } }
      `}</style>

      {toast && <Toast message={toast} onClose={() => setToast(null)} />}

      <div style={{
        padding: isMobile ? '0 12px' : 0,
        animation: 'club-fade-up 380ms cubic-bezier(0.22,1,0.36,1) both',
        fontFamily: typography.fontFamily,
      }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: isMobile ? 14 : 18 }}>
          <div style={{ minWidth: 0 }}>
            <h2 style={{ fontSize: isMobile ? 22 : typography.scale['2xl'], fontWeight: 700, letterSpacing: '-0.025em', color: typography.color.primary, margin: 0, lineHeight: 1.2, display: 'flex', alignItems: 'center', gap: 11 }}>
              <span style={{ width: 34, height: 34, borderRadius: 11, background: '#0E0E12', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 0 0 1px ${colors.gray.borderMd}, 0 6px 18px rgba(0,0,0,0.12)`, flexShrink: 0 }}>
                <EligiClubIcon size={22} color="#F4F2EC" />
              </span>
              EligiClub
            </h2>
            {!isMobile && (
              <p style={{ fontSize: 14, color: typography.color.muted, margin: '6px 0 0', maxWidth: 460, lineHeight: 1.5 }}>
                Clube de assinatura recorrente. Parte da mensalidade é lucro da casa; o restante forma um pote rateado entre os profissionais por fichas.
              </p>
            )}
          </div>
          <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: '.08em', color: colors.red.DEFAULT, background: 'rgba(225,29,42,0.10)', padding: '4px 9px', borderRadius: 999, flexShrink: 0 }}>NOVO</span>
        </div>

        {/* Abas */}
        <div ref={tabsRef} style={{ position: 'relative', display: 'flex', gap: 4, padding: 4, background: 'rgba(255,255,255,0.65)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', borderRadius: 13, border: `1px solid ${colors.gray.border}`, marginBottom: 16 }}>
          <div ref={indRef} style={{ position: 'absolute', top: 4, bottom: 4, left: 0, width: 0, borderRadius: 10, background: '#fff', boxShadow: '0 1px 5px rgba(0,0,0,0.09)', transition: 'transform .32s cubic-bezier(.5,1.3,.5,1), width .32s cubic-bezier(.5,1.3,.5,1)', pointerEvents: 'none' }} />
          {TABS.map(({ id, label, Icon }) => {
            const on = tab === id
            const isFech = id === 'fechamento'
            return (
              <button key={id} data-tab={id} onClick={() => setTab(id)}
                style={{ flex: 1, position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, padding: '10px 8px', border: 'none', borderRadius: 10, background: 'transparent', cursor: 'pointer', fontFamily: 'inherit', fontSize: 13, fontWeight: on ? 700 : 600, letterSpacing: '-0.01em', color: on ? (isFech ? colors.red.DEFAULT : colors.gray[900]) : colors.gray.dimText, transition: `color ${transitions.fast}`, WebkitTapHighlightColor: 'transparent' }}>
                <Icon size={15} strokeWidth={2.2} />{label}
              </button>
            )
          })}
        </div>

        {tab === 'planos' && <PlanosTab isMobile={isMobile} onToast={setToast} />}
        {tab === 'membros' && <MembrosTab isMobile={isMobile} onToast={setToast} />}
        {tab === 'fechamento' && <FechamentoTab onToast={setToast} />}
      </div>
    </>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
// ABA: Planos
// ═══════════════════════════════════════════════════════════════════════════
function PlanosTab({ isMobile, onToast }: { isMobile: boolean; onToast: (m: string) => void }) {
  const [plans, setPlans] = useState<ClubPlan[]>([])
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<ClubPlan | null>(null)
  function handleAdd() { setEditing(null); setModalOpen(true) }
  function handleEdit(p: ClubPlan) { setEditing(p); setModalOpen(true) }
  function handleSaved(saved: ClubPlan) {
    setPlans(prev => {
      const exists = prev.find(p => p.id === saved.id)
      return exists ? prev.map(p => p.id === saved.id ? saved : p) : [saved, ...prev]
    })
    onToast(editing ? 'Plano atualizado' : 'Plano criado')
  }
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')

  const fetchData = useCallback(async (signal?: AbortSignal) => {
    try {
      const res = await api.get('/club', { signal })
      if (signal?.aborted) return
      const payload = res.data?.data ?? res.data
      setPlans(Array.isArray(payload) ? payload : [])
    } catch {
      if (!signal?.aborted) setPlans([])
    } finally {
      if (!signal?.aborted) setLoading(false)
    }
  }, [])

  useEffect(() => {
    const ctrl = new AbortController()
    fetchData(ctrl.signal)
    return () => ctrl.abort()
  }, [fetchData])

  const filtered = useMemo(() => {
    if (!query.trim()) return plans
    const q = query.trim().toLowerCase()
    return plans.filter(p => p.name.toLowerCase().includes(q) || (p.description ?? '').toLowerCase().includes(q))
  }, [plans, query])

  return (
    <section style={{ animation: 'club-panel .4s cubic-bezier(.22,1,.36,1) both' }}>
      {modalOpen && (
        <ClubPlanEditorModal
          plan={editing}
          isMobile={isMobile}
          onSaved={handleSaved}
          onClose={() => { setModalOpen(false); setTimeout(() => setEditing(null), 200) }}
        />
      )}

      <div style={{ display: 'flex', gap: 8, marginBottom: 13 }}>
        <SearchBox query={query} setQuery={setQuery} placeholder="Buscar plano de clube..." flex />
        <AddButton label={isMobile ? 'Novo' : 'Novo plano'} onClick={handleAdd} />
      </div>

      {loading ? <LoadingState /> : plans.length === 0 ? (
        <EmptyState icon={<Layers size={34} />} title="Nenhum plano de clube" subtitle="Crie planos de assinatura recorrente para fidelizar clientes e gerar um pote mensal para a equipe." />
      ) : filtered.length === 0 ? (
        <EmptyState icon={<Search size={34} />} title="Nenhum plano encontrado" subtitle={`Nada corresponde a "${query}".`} />
      ) : (
        <ListShell>
          {filtered.map((p, i) => <PlanRow key={p.id} plan={p} isMobile={isMobile} isLast={i === filtered.length - 1} onClick={() => handleEdit(p)} />)}
        </ListShell>
      )}
    </section>
  )
}

function PlanRow({ plan, isMobile, isLast, onClick }: { plan: ClubPlan; isMobile: boolean; isLast: boolean; onClick: () => void }) {
  const grad = plan.color ?? colors.red.gradient
  const subs = plan._count?.subscriptions ?? 0
  const svc = plan.services?.length ?? 0
  return (
    <RowShell isMobile={isMobile} isLast={isLast} onClick={onClick} accent={grad}
      avatar={<span style={avaStyle(grad, isMobile)}><EligiClubIcon size={isMobile ? 22 : 24} color="#fff" /></span>}
      trailing={<div style={{ textAlign: 'right', flexShrink: 0 }}>
        <div style={{ fontSize: 15, fontWeight: 820, color: colors.gray[900], letterSpacing: '-0.02em', fontVariantNumeric: 'tabular-nums' }}>{fmtBRL(plan.price)}</div>
        <div style={{ fontSize: 10, color: colors.gray.dimText, fontWeight: 600 }}>/mês</div>
      </div>}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
        <span style={{ fontSize: 14, fontWeight: 700, color: colors.gray[900], letterSpacing: '-0.01em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{plan.name}</span>
        <span style={{ fontSize: 9.5, fontWeight: 800, letterSpacing: '.04em', color: colors.red.DEFAULT, background: 'rgba(225,29,42,0.10)', borderRadius: 6, padding: '2px 7px', flexShrink: 0 }}>{plan.staffSharePct}% RATEIO</span>
        {!plan.active && <InactiveTag />}
      </div>
      <div style={{ fontSize: 11.5, color: colors.gray.dimText, display: 'flex', alignItems: 'center', gap: 7, flexWrap: 'wrap' }}>
        <span>{svc} serviço{svc !== 1 ? 's' : ''}</span><Dot /><span>mensal</span>
        {subs > 0 && <><Dot /><span>{subs} membro{subs !== 1 ? 's' : ''}</span></>}
      </div>
    </RowShell>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
// ABA: Membros
// ═══════════════════════════════════════════════════════════════════════════
function MembrosTab({ isMobile, onToast }: { isMobile: boolean; onToast: (m: string) => void }) {
  const [subs, setSubs] = useState<ClubSubscription[]>([])
  const [modalOpen, setModalOpen] = useState(false)
  function handleSaved(sub: ClubSubscription) {
    setSubs(prev => [sub, ...prev])
    onToast('Membro assinado')
  }
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')

  const fetchData = useCallback(async (signal?: AbortSignal) => {
    try {
      const res = await api.get('/club-subscriptions', { signal })
      if (signal?.aborted) return
      const payload = res.data?.data ?? res.data
      setSubs(Array.isArray(payload) ? payload : [])
    } catch {
      if (!signal?.aborted) setSubs([])
    } finally {
      if (!signal?.aborted) setLoading(false)
    }
  }, [])

  useEffect(() => {
    const ctrl = new AbortController()
    fetchData(ctrl.signal)
    return () => ctrl.abort()
  }, [fetchData])

  const stats = useMemo(() => {
    const active = subs.filter(s => s.status === 'ACTIVE')
    const mrr = active.reduce((acc, s) => acc + (s.value ?? s.plan.price ?? 0), 0)
    return { activeCount: active.length, mrr, total: subs.length }
  }, [subs])

  const filtered = useMemo(() => {
    if (!query.trim()) return subs
    const q = query.trim().toLowerCase()
    return subs.filter(s => s.client.name.toLowerCase().includes(q) || s.plan.name.toLowerCase().includes(q))
  }, [subs, query])

  return (
    <section style={{ animation: 'club-panel .4s cubic-bezier(.22,1,.36,1) both' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10, marginBottom: 14 }}>
        <StatCard k="Membros ativos" v={String(stats.activeCount)} />
        <StatCard k="Receita recorrente" v={fmtBRL(stats.mrr)} red />
        <StatCard k="Total de assinaturas" v={String(stats.total)} />
      </div>

      {modalOpen && (
        <ClubSubscriptionModal
          isMobile={isMobile}
          onSaved={handleSaved}
          onClose={() => setModalOpen(false)}
        />
      )}

      <div style={{ display: 'flex', gap: 8, marginBottom: 13 }}>
        <SearchBox query={query} setQuery={setQuery} placeholder="Buscar membro..." flex />
        <AddButton label={isMobile ? 'Assinar' : 'Assinar membro'} onClick={() => setModalOpen(true)} />
      </div>

      {loading ? <LoadingState /> : subs.length === 0 ? (
        <EmptyState icon={<Users size={34} />} title="Nenhum membro ainda" subtitle="Assine um cliente em um plano de clube para começar a gerar receita recorrente e fichas." />
      ) : filtered.length === 0 ? (
        <EmptyState icon={<Search size={34} />} title="Nenhum membro encontrado" subtitle={`Nada corresponde a "${query}".`} />
      ) : (
        <ListShell>
          {filtered.map((s, i) => <MemberRow key={s.id} sub={s} isMobile={isMobile} isLast={i === filtered.length - 1} onClick={() => onToast('Detalhe do membro chega no próximo lote 🚧')} />)}
        </ListShell>
      )}
    </section>
  )
}

function MemberRow({ sub, isMobile, isLast, onClick }: { sub: ClubSubscription; isMobile: boolean; isLast: boolean; onClick: () => void }) {
  const st = SUB_STATUS[sub.status]
  const fichas = sub._count?.fichas ?? 0
  const dateInfo = sub.status === 'PAST_DUE'
    ? `venceu ${fmtDate(sub.currentPeriodEnd)}`
    : sub.currentPeriodEnd ? `próx. cobrança ${fmtDate(sub.currentPeriodEnd)}` : 'sem cobrança'
  return (
    <RowShell isMobile={isMobile} isLast={isLast} onClick={onClick}
      avatar={<span style={{ width: 42, height: 42, borderRadius: '50%', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 760, color: '#fff', letterSpacing: '-0.02em', background: avatarGrad(sub.client.id) }}>{initials(sub.client.name)}</span>}
      trailing={<div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4, flexShrink: 0, minWidth: isMobile ? 70 : 86 }}>
        <StatusPill {...st} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, fontWeight: 700, color: colors.gray[700] }}>
          <Hash size={11} strokeWidth={2.4} /><span style={{ fontVariantNumeric: 'tabular-nums' }}>{fichas}</span>
        </div>
        <div style={{ fontSize: 9, color: colors.gray.dimText, textTransform: 'uppercase', letterSpacing: '.05em' }}>Fichas</div>
      </div>}>
      <div style={{ fontSize: 14, fontWeight: 700, color: colors.gray[900], letterSpacing: '-0.01em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{sub.client.name}</div>
      <div style={{ fontSize: 11.5, color: colors.gray.dimText, marginTop: 2, display: 'flex', alignItems: 'center', gap: 7, flexWrap: 'wrap' }}>
        <span>{sub.plan.name}</span><Dot /><span>{dateInfo}</span>
      </div>
    </RowShell>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
// ABA: Fechamento (peça central — pote + rateio)
// ═══════════════════════════════════════════════════════════════════════════
function FechamentoTab({ onToast }: { onToast: (m: string) => void }) {
  const [periodKey, setPeriodKey] = useState<string>(() => spMonthKey())
  const [preview, setPreview] = useState<SettlementPreview | null>(null)
  const [loading, setLoading] = useState(true)
  const [closing, setClosing] = useState(false)
  const [history, setHistory] = useState<ClubSettlementRow[]>([])

  const loadPreview = useCallback(async (key: string, signal?: AbortSignal) => {
    try {
      const res = await api.get('/club-settlements/preview', { params: { periodKey: key }, signal })
      if (signal?.aborted) return
      const payload = (res.data?.data ?? res.data) as SettlementPreview
      setPreview(payload ?? null)
    } catch {
      if (!signal?.aborted) setPreview(null)
    } finally {
      if (!signal?.aborted) setLoading(false)
    }
  }, [])

  const loadHistory = useCallback(async (signal?: AbortSignal) => {
    try {
      const res = await api.get('/club-settlements', { signal })
      if (signal?.aborted) return
      const payload = res.data?.data ?? res.data
      setHistory(Array.isArray(payload) ? payload : [])
    } catch {
      if (!signal?.aborted) setHistory([])
    }
  }, [])

  useEffect(() => {
    const ctrl = new AbortController()
    loadPreview(periodKey, ctrl.signal)
    return () => ctrl.abort()
  }, [periodKey, loadPreview])

  useEffect(() => {
    const ctrl = new AbortController()
    loadHistory(ctrl.signal)
    return () => ctrl.abort()
  }, [loadHistory])

  const handleClose = useCallback(async () => {
    if (closing || !preview) return
    setClosing(true)
    try {
      await api.post('/club-settlements', { periodKey })
      onToast('Período fechado — saída gerada no Caixa por profissional ✓')
      await loadPreview(periodKey)
      await loadHistory()
    } catch (err: unknown) {
      const msg = (err && typeof err === 'object' && 'response' in err)
        ? ((err as { response?: { data?: { error?: string } } }).response?.data?.error ?? 'Não foi possível fechar')
        : 'Não foi possível fechar'
      onToast(msg)
    } finally {
      setClosing(false)
    }
  }, [closing, preview, periodKey, onToast, loadPreview, loadHistory])

  const canClose = !!preview && !preview.alreadySettled && preview.totalFichas > 0 && !closing
  const isFuture = periodKey >= spMonthKey()

  return (
    <section style={{ animation: 'club-panel .4s cubic-bezier(.22,1,.36,1) both' }}>
      {/* seletor de mês */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 18, marginBottom: 16 }}>
        <PeriodArrow dir="prev" onClick={() => setPeriodKey(k => shiftMonth(k, -1))} />
        <div style={{ fontSize: 15, fontWeight: 740, letterSpacing: '-0.02em', minWidth: 160, textAlign: 'center', color: colors.gray[900] }}>{monthLabel(periodKey)}</div>
        <PeriodArrow dir="next" onClick={() => setPeriodKey(k => shiftMonth(k, +1))} disabled={isFuture} />
      </div>

      {loading ? <LoadingState /> : (
        <>
          <PotePanel preview={preview} />
          <RateioPanel preview={preview} />
          <ClosePanel preview={preview} canClose={canClose} closing={closing} onClose={handleClose} />
          <HistoryList rows={history} currentKey={periodKey} onPick={setPeriodKey} />
        </>
      )}
    </section>
  )
}

function PotePanel({ preview }: { preview: SettlementPreview | null }) {
  const numRef = useRef<HTMLDivElement>(null)
  const target = preview?.poolTotal ?? 0

  // count-up por mutação de DOM (sem setState por frame)
  useEffect(() => {
    const el = numRef.current
    if (!el) return
    let raf = 0
    const t0 = performance.now()
    const dur = 900
    const step = (t: number) => {
      const k = Math.min(1, (t - t0) / dur)
      const e = 1 - Math.pow(1 - k, 3)
      el.textContent = fmtBRL(target * e)
      if (k < 1) raf = requestAnimationFrame(step)
    }
    raf = requestAnimationFrame(step)
    return () => cancelAnimationFrame(raf)
  }, [target])

  return (
    <div style={{ position: 'relative', overflow: 'hidden', borderRadius: 20, padding: '26px 26px 24px', marginBottom: 16, background: 'linear-gradient(135deg,#16161C 0%,#0E0E12 100%)', color: '#fff', boxShadow: '0 18px 48px rgba(255, 255, 255, 0.28), 0 0 0 1px rgba(255,255,255,0.04) inset' }}>
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(115deg,transparent 30%,rgba(255,255,255,0.10) 48%,transparent 62%)', transform: 'translateX(-120%)', animation: 'club-sheen 3.6s ease-in-out 1s infinite', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', right: -20, top: '50%', transform: 'translateY(-50%)', width: 220, height: 220, opacity: 0.06, pointerEvents: 'none' }}>
        <EligiClubIcon size={220} color="#fff" />
      </div>
      <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '.14em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.55)', position: 'relative' }}>Pote do período</div>
      <div ref={numRef} style={{ fontSize: 46, fontWeight: 820, letterSpacing: '-0.035em', margin: '6px 0 4px', fontVariantNumeric: 'tabular-nums', position: 'relative', background: 'linear-gradient(135deg,#fff 0%,#FFD9D6 120%)', WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent' }}>{fmtBRL(0)}</div>
      <div style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.92)', position: 'relative', display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        <span className="ec-pote-meta"><b style={{ color: '#FF6B6B', fontWeight: 700 }}>{preview?.totalFichas ?? 0}</b> fichas acumuladas</span>
        <span style={{ width: 3, height: 3, borderRadius: '50%', background: 'rgba(255,255,255,0.4)' }} />
        <span className="ec-pote-meta"><b style={{ color: '#FF6B6B', fontWeight: 700 }}>{preview?.paymentsCount ?? 0}</b> mensalidade{(preview?.paymentsCount ?? 0) !== 1 ? 's' : ''}</span>
        {preview?.alreadySettled && (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 10, fontWeight: 800, letterSpacing: '.04em', color: '#34D399', background: 'rgba(52,211,153,0.12)', borderRadius: 6, padding: '2px 8px' }}>
            <CheckCircle2 size={11} strokeWidth={2.6} />FECHADO
          </span>
        )}
      </div>
    </div>
  )
}

function RateioPanel({ preview }: { preview: SettlementPreview | null }) {
  const barsRef = useRef<Record<string, HTMLDivElement | null>>({})
  const items = useMemo(() => preview?.items ?? [], [preview])

  // anima largura das barras por mutação de DOM
  useLayoutEffect(() => {
    for (const it of items) {
      const el = barsRef.current[it.professionalId]
      if (el) { el.style.width = '0%'; requestAnimationFrame(() => { el.style.width = `${it.pct}%` }) }
    }
  }, [items])

  if (items.length === 0) {
    return (
      <div style={{ background: 'rgba(255,255,255,0.72)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.6)', borderRadius: 18, padding: '28px 20px', textAlign: 'center', boxShadow: '0 10px 30px rgba(0,0,0,0.06)' }}>
        <Coins size={30} color={colors.gray.dimText} style={{ opacity: 0.35, marginBottom: 10 }} />
        <div style={{ fontSize: 14, fontWeight: 650, color: typography.color.primary }}>Nenhuma ficha neste período</div>
        <div style={{ fontSize: 12.5, color: colors.gray.dimText, marginTop: 4, maxWidth: 360, marginLeft: 'auto', marginRight: 'auto' }}>As fichas aparecem quando serviços cobertos por um plano de clube são finalizados no Caixa.</div>
      </div>
    )
  }

  return (
    <div style={{ background: 'rgba(255,255,255,0.72)', backdropFilter: 'blur(20px) saturate(160%)', WebkitBackdropFilter: 'blur(20px) saturate(160%)', border: '1px solid rgba(255,255,255,0.6)', borderRadius: 18, padding: '18px 20px', boxShadow: '0 10px 30px rgba(0,0,0,0.06)' }}>
      <h3 style={{ margin: '0 0 4px', fontSize: 14, fontWeight: 740, letterSpacing: '-0.02em', color: colors.gray[900] }}>Rateio entre profissionais</h3>
      <p style={{ margin: '0 0 16px', fontSize: 11.5, color: colors.gray.dimText }}>Cada profissional recebe a fração de fichas que acumulou no período.</p>
      {items.map((it, i) => (
        <div key={it.professionalId} style={{ display: 'flex', alignItems: 'center', gap: 13, padding: '11px 0', borderBottom: i === items.length - 1 ? 'none' : `1px solid ${colors.gray.border}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 11, width: 168, flexShrink: 0, minWidth: 0 }}>
            <span style={{ width: 34, height: 34, borderRadius: '50%', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 760, color: '#fff', background: avatarGrad(it.professionalId) }}>{initials(it.professionalName)}</span>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 680, letterSpacing: '-0.01em', color: colors.gray[900], whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{it.professionalName}</div>
              <div style={{ fontSize: 10.5, color: colors.gray.dimText, marginTop: 1 }}>{it.fichas} ficha{it.fichas !== 1 ? 's' : ''}</div>
            </div>
          </div>
          <div style={{ flex: 1, height: 9, borderRadius: 999, background: 'rgba(17,17,20,0.06)', overflow: 'hidden', minWidth: 40 }}>
            <div ref={el => { barsRef.current[it.professionalId] = el }} style={{ height: '100%', width: '0%', borderRadius: 999, background: colors.red.gradient, transition: 'width 1s cubic-bezier(.3,1,.4,1)' }} />
          </div>
          <div style={{ width: 116, flexShrink: 0, textAlign: 'right' }}>
            <div style={{ fontSize: 13, fontWeight: 800, letterSpacing: '-0.02em', color: colors.gray[900], fontVariantNumeric: 'tabular-nums' }}>{it.pct.toFixed(1).replace('.', ',')}%</div>
            <div style={{ fontSize: 11, color: typography.color.muted, fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>{fmtBRL(it.amount)}</div>
          </div>
        </div>
      ))}
    </div>
  )
}

function ClosePanel({ preview, canClose, closing, onClose }: { preview: SettlementPreview | null; canClose: boolean; closing: boolean; onClose: () => void }) {
  const settled = preview?.alreadySettled
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 14, marginTop: 18, padding: '16px 18px', borderRadius: 16, background: settled ? 'rgba(22,163,74,0.06)' : 'linear-gradient(135deg,rgba(225,29,42,0.07),rgba(225,29,42,0.03))', border: `1px solid ${settled ? 'rgba(22,163,74,0.18)' : 'rgba(225,29,42,0.12)'}`, flexWrap: 'wrap' }}>
      <div style={{ fontSize: 11.5, color: typography.color.muted, lineHeight: 1.5, maxWidth: 340, minWidth: 200 }}>
        {settled
          ? <>Este período já foi <b style={{ color: colors.gray[900] }}>fechado</b>. As fichas foram liquidadas e a saída por profissional já está no Caixa.</>
          : <>Ao fechar, as fichas viram <b style={{ color: colors.gray[900] }}>liquidadas</b> e o sistema cria <b style={{ color: colors.gray[900] }}>uma saída no Caixa por profissional</b>. Confira antes — nada é gravado até confirmar.</>}
      </div>
      <button disabled={!canClose} onClick={onClose}
        style={{ position: 'relative', overflow: 'hidden', display: 'flex', alignItems: 'center', gap: 8, padding: '12px 22px', border: 'none', borderRadius: 12, cursor: canClose ? 'pointer' : 'not-allowed', background: canClose ? colors.red.gradient : 'rgba(17,17,20,0.12)', color: canClose ? '#fff' : colors.gray.dimText, fontFamily: 'inherit', fontSize: 13.5, fontWeight: 760, letterSpacing: '.01em', boxShadow: canClose ? `0 6px 18px ${colors.red.glow}` : 'none', whiteSpace: 'nowrap', transition: `all ${transitions.fast}`, WebkitTapHighlightColor: 'transparent' }}>
        {closing ? <Loader2 size={16} style={{ animation: 'club-spin .8s linear infinite' }} /> : <CheckCircle2 size={16} strokeWidth={2.4} />}
        {settled ? 'Período fechado' : closing ? 'Fechando...' : 'Fechar período'}
      </button>
    </div>
  )
}

function HistoryList({ rows, currentKey, onPick }: { rows: ClubSettlementRow[]; currentKey: string; onPick: (k: string) => void }) {
  if (rows.length === 0) return null
  return (
    <div style={{ marginTop: 22 }}>
      <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: '.03em', textTransform: 'uppercase', color: colors.gray.dimText, marginBottom: 10, paddingLeft: 2 }}>Fechamentos anteriores</div>
      <ListShell>
        {rows.map((r, i) => (
          <button key={r.id} onClick={() => onPick(r.periodKey)}
            style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 13, padding: '13px 16px', border: 'none', borderBottom: i === rows.length - 1 ? 'none' : `1px solid ${colors.gray.border}`, background: r.periodKey === currentKey ? 'rgba(225,29,42,0.04)' : 'transparent', cursor: 'pointer', textAlign: 'left', fontFamily: typography.fontFamily, transition: `background ${transitions.fast}`, WebkitTapHighlightColor: 'transparent' }}>
            <span style={{ width: 38, height: 38, borderRadius: 10, background: 'rgba(17,17,20,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <CalendarClock size={18} color={colors.gray[700]} strokeWidth={2} />
            </span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13.5, fontWeight: 700, color: colors.gray[900], letterSpacing: '-0.01em' }}>{monthLabel(r.periodKey)}</div>
              <div style={{ fontSize: 11, color: colors.gray.dimText, marginTop: 2 }}>{r.totalFichas} fichas · {r._count?.items ?? 0} profissionais · {r.settledAt ? `fechado ${fmtDate(r.settledAt)}` : ''}</div>
            </div>
            <div style={{ fontSize: 14, fontWeight: 800, color: colors.gray[900], fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.02em', flexShrink: 0 }}>{fmtBRL(r.poolTotal)}</div>
            <ChevronRight size={15} color={colors.gray.dimText} strokeWidth={2} style={{ flexShrink: 0 }} />
          </button>
        ))}
      </ListShell>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
// Componentes compartilhados
// ═══════════════════════════════════════════════════════════════════════════
function avaStyle(grad: string, isMobile: boolean): React.CSSProperties {
  return { width: isMobile ? 42 : 46, height: isMobile ? 42 : 46, borderRadius: 10, background: grad, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: `0 2px 8px ${colors.red.glow}` }
}

function RowShell({ children, trailing, avatar, accent, isMobile, isLast, onClick }: { children: React.ReactNode; trailing?: React.ReactNode; avatar: React.ReactNode; accent?: string; isMobile: boolean; isLast: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick}
      style={{ position: 'relative', width: '100%', display: 'flex', alignItems: 'center', gap: isMobile ? 12 : 14, padding: isMobile ? '14px 14px' : '14px 16px', border: 'none', borderBottom: isLast ? 'none' : `1px solid ${colors.gray.border}`, background: 'transparent', cursor: 'pointer', textAlign: 'left', transition: `background ${transitions.fast}`, WebkitTapHighlightColor: 'transparent', fontFamily: typography.fontFamily }}
      onMouseEnter={e => (e.currentTarget.style.background = colors.gray.hover)}
      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
      {accent && <span style={{ position: 'absolute', left: 0, top: 10, bottom: 10, width: 3, borderRadius: '0 3px 3px 0', background: accent, opacity: 0.9 }} />}
      {avatar}
      <div style={{ flex: 1, minWidth: 0 }}>{children}</div>
      {trailing}
      <ChevronRight size={15} color={colors.gray.dimText} strokeWidth={2} style={{ flexShrink: 0 }} />
    </button>
  )
}

function ListShell({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ background: 'rgba(255,255,255,0.72)', backdropFilter: 'blur(20px) saturate(160%)', WebkitBackdropFilter: 'blur(20px) saturate(160%)', borderRadius: 16, border: '1px solid rgba(255,255,255,0.60)', boxShadow: '0 2px 0 rgba(255,255,255,0.85) inset, 0 8px 28px rgba(0,0,0,0.06)', overflow: 'hidden' }}>
      {children}
    </div>
  )
}

function StatCard({ k, v, red }: { k: string; v: string; red?: boolean }) {
  return (
    <div style={{ background: 'rgba(255,255,255,0.72)', backdropFilter: 'blur(14px)', WebkitBackdropFilter: 'blur(14px)', border: `1px solid ${colors.gray.border}`, borderRadius: 14, padding: '14px 16px' }}>
      <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: '.04em', textTransform: 'uppercase', color: colors.gray.dimText }}>{k}</div>
      <div style={{ fontSize: 21, fontWeight: 800, letterSpacing: '-0.03em', marginTop: 5, fontVariantNumeric: 'tabular-nums', background: red ? colors.red.gradient : 'linear-gradient(135deg,#18181B,#3f3f46)', WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent' }}>{v}</div>
    </div>
  )
}

function SearchBox({ query, setQuery, placeholder, flex }: { query: string; setQuery: (v: string) => void; placeholder: string; flex?: boolean }) {
  return (
    <div style={{ flex: flex ? 1 : undefined, display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', borderRadius: 12, background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', border: `1px solid ${colors.gray.borderMd}` }}>
      <Search size={14} color={colors.gray.dimText} strokeWidth={2} />
      <input value={query} onChange={e => setQuery(e.target.value)} placeholder={placeholder} inputMode="search"
        style={{ flex: 1, border: 'none', outline: 'none', fontSize: 14, background: 'transparent', color: colors.gray[900], fontFamily: 'inherit', minWidth: 0 }} />
      {query && (
        <button onClick={() => setQuery('')} aria-label="Limpar" style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, display: 'flex', WebkitTapHighlightColor: 'transparent' }}>
          <X size={13} color={colors.gray.dimText} />
        </button>
      )}
    </div>
  )
}

function AddButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button onClick={onClick}
      style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 18px', borderRadius: 12, border: 'none', background: colors.red.gradient, color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', boxShadow: `0 4px 14px ${colors.red.glow}`, letterSpacing: '.02em', flexShrink: 0, WebkitTapHighlightColor: 'transparent', fontFamily: 'inherit' }}>
      <Plus size={15} strokeWidth={2.5} />{label}
    </button>
  )
}

function PeriodArrow({ dir, onClick, disabled }: { dir: 'prev' | 'next'; onClick: () => void; disabled?: boolean }) {
  return (
    <button onClick={onClick} disabled={disabled} aria-label={dir === 'prev' ? 'Mês anterior' : 'Próximo mês'}
      style={{ width: 32, height: 32, borderRadius: 10, border: `1px solid ${colors.gray.borderMd}`, background: '#fff', cursor: disabled ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: disabled ? 0.4 : 1, transition: `all ${transitions.fast}`, WebkitTapHighlightColor: 'transparent' }}>
      {dir === 'prev' ? <ChevronLeft size={15} color={colors.gray[900]} strokeWidth={2.2} /> : <ChevronRight size={15} color={colors.gray[900]} strokeWidth={2.2} />}
    </button>
  )
}

function StatusPill({ label, fg, bg }: { label: string; fg: string; bg: string }) {
  return <span style={{ padding: '3px 9px', borderRadius: 999, background: bg, color: fg, fontSize: 9.5, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.05em' }}>{label}</span>
}

function InactiveTag() {
  return <span style={{ fontSize: 9, fontWeight: 700, color: colors.gray.dimText, background: colors.background.page, border: `1px solid ${colors.gray.borderMd}`, borderRadius: 4, padding: '1px 5px', letterSpacing: '.04em', flexShrink: 0 }}>INATIVO</span>
}

function Dot() {
  return <span style={{ width: 3, height: 3, borderRadius: '50%', background: colors.gray.dimText, flexShrink: 0 }} />
}

function LoadingState() {
  return <div style={{ display: 'flex', justifyContent: 'center', padding: 48 }}><Loader2 size={26} style={{ animation: 'club-spin 0.8s linear infinite', color: colors.red.DEFAULT }} /></div>
}

function EmptyState({ icon, title, subtitle }: { icon: React.ReactNode; title: string; subtitle: string }) {
  return (
    <div style={{ textAlign: 'center', padding: '50px 24px', background: 'rgba(255,255,255,0.85)', borderRadius: 14, border: `1px solid ${colors.gray.border}` }}>
      <div style={{ color: colors.gray.dimText, opacity: 0.3, marginBottom: 12, display: 'flex', justifyContent: 'center' }}>{icon}</div>
      <div style={{ fontSize: 15, fontWeight: 600, color: typography.color.primary, marginBottom: 4 }}>{title}</div>
      <div style={{ fontSize: 13, color: colors.gray.dimText, maxWidth: 360, margin: '0 auto' }}>{subtitle}</div>
    </div>
  )
}

function Toast({ message, onClose }: { message: string; onClose: () => void }) {
  return (
    <div onClick={onClose}
      style={{ position: 'fixed', bottom: 'calc(24px + env(safe-area-inset-bottom))', left: '50%', transform: 'translateX(-50%)', zIndex: 10999, display: 'flex', alignItems: 'center', gap: 8, padding: '12px 18px', borderRadius: 12, background: 'rgba(20,20,26,0.94)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', color: '#fff', fontSize: 13, fontWeight: 600, fontFamily: typography.fontFamily, boxShadow: '0 10px 30px rgba(0,0,0,0.3)', cursor: 'pointer', maxWidth: '90vw', animation: 'club-fade-up 240ms cubic-bezier(.22,1,.36,1) both' }}>
      {message}
    </div>
  )
}
