'use client'
// src/app/dashboard/financeiro/comissoes/page.tsx

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import api from '@/shared/lib/apiClient'
import { colors, typography, inkLight } from '@/shared/theme' // @eligi:club-baixa-ink
import { useDeviceMode } from '@/features/agenda/hooks/useDeviceMode'
import { PayoutSettings, PayoutListItem } from '@/features/payouts/types'
import { useAuth } from '@/hooks/useAuth'
import { ChevronRight } from 'lucide-react'
import EligiClubIcon from '@/app/components/navigation/EligiClubIcon'
import MyCommissionsView from './components/MyCommissionsView'

import PayoutSettingsCard    from './components/PayoutSettingsCard'
import PayoutSettingsModal   from './components/PayoutSettingsModal'
import PendingCommissionsTab from './components/PendingCommissionsTab'
import PayoutsHistoryTab     from './components/PayoutsHistoryTab'
import MarkAsPaidModal       from './components/MarkAsPaidModal'
import ClubPaySheet, { CLUB_PAY_METHOD_LABEL, clubPaidDay } from './components/ClubPaySheet' // @eligi:club-baixa-import
import {
  ProfChips, PeriodPicker, DEFAULT_PERIOD, periodRange, periodKeyMatches, periodText,
  TypeChips, type FilterProf, type PeriodFilter, type TypeFilter,
} from './components/CommissionFilters' // @eligi:comm-filtro-import

type Tab = 'pending' | 'history' | 'club'

// ─── EligiClub: comissões do clube (componentes de módulo, fora do render) ──
// @eligi:club-baixa-types — ids e estado do pagamento vem do back (club-pote-baixa).
interface ClubCommItem { itemId: string; professionalId: string; professionalName: string; professionalAvatar: string | null; fichas: number; pct: number; amount: number; paidAt: string | null; paidVia: string | null; paidNote: string | null }
interface ClubCommPeriod { settlementId: string; periodKey: string; poolTotal: number; totalFichas: number; settledAt: string; paymentsCount: number; items: ClubCommItem[] }
interface ClubCommOwner { scope: 'owner'; totalAmount: number; totalUnpaid?: number; periods: ClubCommPeriod[] }

function clubFmtBRL(v: number) { return `R$ ${(v ?? 0).toFixed(2).replace('.', ',')}` }
function clubPeriodLabel(periodKey: string) {
  const [y, m] = periodKey.split('-')
  const months = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro']
  return `${months[Number(m) - 1] ?? m} ${y}`
}
const CLUB_AVATARS: [string, string][] = [['#F87171', '#DC2626'], ['#60A5FA', '#2563EB'], ['#34D399', '#059669'], ['#FBBF24', '#D97706'], ['#A78BFA', '#7C3AED']]
function clubAvatarColors(seed: string): [string, string] { let h = 0; for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0; return CLUB_AVATARS[h % CLUB_AVATARS.length] }
function clubIsPhoto(u?: string | null) { return !!u && (u.startsWith('http') || u.startsWith('data:') || u.startsWith('/')) }

function ClubProfBubble({ id, name, avatar, size }: { id: string; name: string; avatar: string | null; size: number }) {
  const common: React.CSSProperties = { width: size, height: size, borderRadius: '50%', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', color: '#fff', fontSize: Math.round(size * 0.38), fontWeight: 760 }
  if (clubIsPhoto(avatar)) return <span style={common}><img src={avatar!} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /></span>
  const [a, b] = clubAvatarColors(id)
  return <span style={{ ...common, background: `linear-gradient(135deg,${a},${b})` }}>{(name ?? '?').slice(0, 1)}</span>
}

// @eligi:club-baixa-card — direcao A: selo Pago ou botao Dar baixa em cada linha.
// So o primeiro pendente do mes fica vermelho: um vermelho por bloco.
function ClubPeriodCard({ p, isOpen, onToggle, onOpenItem }: {
  p: ClubCommPeriod; isOpen: boolean; onToggle: () => void; onOpenItem: (it: ClubCommItem) => void
}) {
  const firstPending = p.items.find((it) => !it.paidAt)?.itemId
  const paidCount = p.items.filter((it) => !!it.paidAt).length
  const status = paidCount === p.items.length ? 'TODOS PAGOS' : `${paidCount} DE ${p.items.length} PAGOS`
  return (
    <div style={{ background: '#fff', border: `0.5px solid ${colors.gray.border}`, borderRadius: 14, marginBottom: 10, boxShadow: '0 1px 3px rgba(0,0,0,0.04)', overflow: 'hidden' }}>
      <button onClick={onToggle} aria-expanded={isOpen} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 11, padding: '13px 16px', cursor: 'pointer', border: 'none', background: 'linear-gradient(135deg,#16161C,#0E0E12)', color: '#fff', fontFamily: 'inherit', textAlign: 'left' }}>
        <ChevronRight size={15} style={{ color: 'rgba(255,255,255,0.6)', flexShrink: 0, transform: isOpen ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s' }} />
        <span style={{ width: 28, height: 28, borderRadius: 8, background: 'rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <EligiClubIcon size={16} color="#F4F2EC" />
        </span>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 13.5, fontWeight: 800 }}>{clubPeriodLabel(p.periodKey)}</div>
          <div style={{ fontSize: 10.5, color: 'rgba(255,255,255,0.55)', marginTop: 1 }}>
            <b style={{ color: '#FF6B6B' }}>{p.totalFichas}</b> fichas · {status}
          </div>
        </div>
        <div style={{ marginLeft: 'auto', textAlign: 'right', flexShrink: 0 }}>
          <div style={{ fontSize: 15, fontWeight: 820, fontVariantNumeric: 'tabular-nums' }}>{clubFmtBRL(p.poolTotal)}</div>
          <div style={{ fontSize: 8, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '.06em' }}>Pote</div>
        </div>
      </button>
      {isOpen && p.items.map((it, idx) => {
        const paid = !!it.paidAt
        const primary = it.itemId === firstPending
        return (
          <div key={it.itemId} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 14px', borderBottom: idx < p.items.length - 1 ? `0.5px solid ${colors.gray.border}` : 'none' }}>
            <ClubProfBubble id={it.professionalId} name={it.professionalName} avatar={it.professionalAvatar} size={32} />
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 680, color: typography.color.primary, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{it.professionalName}</div>
              <div style={{ fontSize: 10.5, color: paid ? inkLight.ok.text : typography.color.muted, marginTop: 1 }}>
                {paid
                  ? `Pago ${clubPaidDay(it.paidAt!).slice(0, 5)}${it.paidVia ? ` · ${CLUB_PAY_METHOD_LABEL[it.paidVia] ?? it.paidVia}` : ''}`
                  : `${it.fichas} fichas · ${it.pct}%`}
              </div>
            </div>
            <div style={{ fontSize: 13, fontWeight: 780, fontVariantNumeric: 'tabular-nums', flexShrink: 0, textAlign: 'right', color: typography.color.primary }}>{clubFmtBRL(it.amount)}</div>
            {paid ? (
              <button onClick={() => onOpenItem(it)} aria-label={`Ver pagamento de ${it.professionalName}`} style={{
                minHeight: 36, padding: '0 10px', borderRadius: 10, cursor: 'pointer', fontFamily: 'inherit', flexShrink: 0,
                fontSize: 11.5, fontWeight: 700, background: inkLight.ok.bg, color: inkLight.ok.text, border: `1px solid ${inkLight.ok.border}`,
              }}>Pago</button>
            ) : (
              <button onClick={() => onOpenItem(it)} style={{
                minHeight: 36, padding: '0 12px', borderRadius: 10, cursor: 'pointer', fontFamily: 'inherit', flexShrink: 0,
                fontSize: 12.5, fontWeight: 600,
                background: primary ? colors.red.DEFAULT : '#fff', color: primary ? '#fff' : typography.color.primary,
                border: `1px solid ${primary ? colors.red.DEFAULT : colors.gray.border}`,
              }}>Dar baixa</button>
            )}
          </div>
        )
      })}
    </div>
  )
}

// @eligi:comm-filtro-clube — o filtro corta os MESES (periodKey) e as LINHAS
// (professionalId). O pote do mes continua o total real: e o mesmo dinheiro
// para a equipe inteira, nao muda com quem esta sendo olhado.
function ClubCommissionsTab({ isMobile, professionalId, period }: { isMobile: boolean; professionalId: string | null; period: PeriodFilter }) {
  const [data, setData] = useState<ClubCommOwner | null>(null)
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState<Set<string>>(() => new Set<string>())
  const [paying, setPaying] = useState<{ p: ClubCommPeriod; it: ClubCommItem } | null>(null)
  const reqRef = useRef(0)

  const fetchData = useCallback(async () => {
    const token = ++reqRef.current
    try {
      const res = await api.get('/club-settlements/commissions')
      const d = (res.data?.data ?? null) as ClubCommOwner | null
      if (token !== reqRef.current) return
      setData(d)
      // Depois de uma baixa o recarregamento nao fecha o mes que o dono esta olhando.
      setOpen((prev) => prev.size > 0 ? prev : (d?.periods?.[0] ? new Set([d.periods[0].periodKey]) : new Set<string>()))
    } catch {
      if (token === reqRef.current) setData(null)
    } finally {
      if (token === reqRef.current) setLoading(false)
    }
  }, [])

  useEffect(() => { void fetchData() }, [fetchData])

  const toggle = useCallback((k: string) => {
    setOpen(prev => { const next = new Set(prev); if (next.has(k)) next.delete(k); else next.add(k); return next })
  }, [])
  const closeSheet = useCallback(() => setPaying(null), [])
  const onPaid = useCallback(() => { setPaying(null); void fetchData() }, [fetchData])

  if (loading) return <div style={{ padding: 40, textAlign: 'center', color: typography.color.muted, fontSize: 13 }}>Carregando…</div>
  if (!data || data.periods.length === 0) return (
    <div style={{ background: '#fff', border: `0.5px solid ${colors.gray.border}`, borderRadius: 14, padding: '40px 24px', textAlign: 'center', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
      <div style={{ marginBottom: 10, display: 'flex', justifyContent: 'center' }}><EligiClubIcon size={30} color="#0E0E12" /></div>
      <div style={{ fontSize: 14, fontWeight: 600, color: typography.color.primary, marginBottom: 4 }}>Nenhum período de clube fechado</div>
      <div style={{ fontSize: 12, color: typography.color.muted }}>Os fechamentos do EligiClub aparecem aqui depois de rateados.</div>
    </div>
  )

  const periods = data.periods
    .filter((p) => periodKeyMatches(period, p.periodKey))
    .map((p) => (professionalId ? { ...p, items: p.items.filter((it) => it.professionalId === professionalId) } : p))
    .filter((p) => p.items.length > 0)
  const totalAmount = periods.reduce((s, p) => s + p.items.reduce((t, it) => t + it.amount, 0), 0)
  const unpaid = periods.reduce((s, p) => s + p.items.reduce((t, it) => t + (it.paidAt ? 0 : it.amount), 0), 0)
  if (periods.length === 0) return (
    <div style={{ background: '#fff', border: `0.5px solid ${colors.gray.border}`, borderRadius: 14, padding: '40px 24px', textAlign: 'center', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
      <div style={{ marginBottom: 10, display: 'flex', justifyContent: 'center' }}><EligiClubIcon size={30} color="#0E0E12" /></div>
      <div style={{ fontSize: 14, fontWeight: 600, color: typography.color.primary, marginBottom: 4 }}>
        {professionalId ? 'Nenhuma ficha desse profissional' : 'Nenhum fechamento'} em {periodText(period)}
      </div>
      <div style={{ fontSize: 12, color: typography.color.muted }}>Troque o período ou o profissional para ver outros meses.</div>
    </div>
  )
  return (
    <div style={{ padding: isMobile ? '0 2px' : 0 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, color: typography.color.muted, textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 12, flexWrap: 'wrap' }}>
        <EligiClubIcon size={14} color="#0E0E12" /> Total rateado em clube ·
        <b style={{ fontSize: 15, color: typography.color.primary, textTransform: 'none', letterSpacing: 0 }}>{clubFmtBRL(totalAmount)}</b>
        em {periods.length} período{periods.length !== 1 ? 's' : ''}
        {unpaid > 0 && (
          <span style={{ textTransform: 'none', letterSpacing: 0, fontSize: 12, fontWeight: 700, color: inkLight.warn.text, background: inkLight.warn.bg, border: `1px solid ${inkLight.warn.border}`, borderRadius: 8, padding: '2px 8px' }}>
            {clubFmtBRL(unpaid)} a pagar
          </span>
        )}
      </div>
      {periods.map(p => (
        <ClubPeriodCard key={p.periodKey} p={p} isOpen={open.has(p.periodKey)} onToggle={() => toggle(p.periodKey)}
          onOpenItem={(it) => setPaying({ p, it })} />
      ))}
      {paying && (
        <ClubPaySheet
          settlementId={paying.p.settlementId}
          periodKey={paying.p.periodKey}
          periodLabel={clubPeriodLabel(paying.p.periodKey)}
          item={paying.it}
          isMobile={isMobile}
          onClose={closeSheet}
          onDone={onPaid}
        />
      )}
    </div>
  )
}

export default function ComissoesPage() {
  const { user } = useAuth()
  const router   = useRouter()
  const mode     = useDeviceMode()
  const isMobile = mode === 'mobile'

  const [settings, setSettings]               = useState<PayoutSettings | null>(null)
  const [settingsLoading, setSettingsLoading] = useState(true)
  const [showSettingsModal, setShowSettingsModal] = useState(false)
  const [showPayModal, setShowPayModal]       = useState<PayoutListItem | null>(null)
  const [activeTab, setActiveTab]             = useState<Tab>('pending')
  const [refreshSignal, setRefreshSignal]     = useState(0)
  // @eligi:comm-filtro-estado — vale para as tres abas e sobrevive a troca de aba.
  const [profFilter, setProfFilter]           = useState<string | null>(null)
  const [period, setPeriod]                   = useState<PeriodFilter>(DEFAULT_PERIOD)
  const [filterProfs, setFilterProfs]         = useState<FilterProf[]>([])
  const [typeFilter, setTypeFilter]           = useState<TypeFilter>('all') // @eligi:comm-filtro2-estado

  const fetchSettings = useCallback(async () => {
    try {
      const res = await api.get('/payouts/settings')
      const data = res.data?.data ?? null
      setSettings(data)
    } catch {
      setSettings(null)
    } finally {
      setSettingsLoading(false)
    }
  }, [])

  useEffect(() => { fetchSettings() }, [fetchSettings])

  // Profissionais ATIVOS para os chips. Pagamento de quem saiu continua em "Todos".
  // Funcionario (MyCommissionsView) nao usa e levaria 403: so dono e gerente buscam.
  const canFilter = Boolean(user && !['STAFF', 'BASIC_STAFF', 'RECEPTIONIST'].includes(user.role))
  useEffect(() => {
    if (!canFilter) return
    let cancelled = false
    api.get('/equipe')
      .then((res) => {
        const raw = res.data?.data ?? res.data ?? []
        const list: unknown[] = Array.isArray(raw) ? raw : []
        const profs = list
          .filter((p): p is { id: string; name: string; avatarUrl?: string | null; active?: boolean } =>
            typeof p === 'object' && p !== null && typeof (p as { id?: unknown }).id === 'string' && typeof (p as { name?: unknown }).name === 'string')
          .map((p) => ({ id: p.id, name: p.name, avatarUrl: p.avatarUrl ?? null, active: p.active !== false }))
          // Ativos primeiro; quem saiu vai para o fim da faixa (sort estavel mantem a ordem por nome).
          .sort((a, b) => Number(b.active) - Number(a.active))
        if (!cancelled) setFilterProfs(profs)
      })
      .catch(() => { if (!cancelled) setFilterProfs([]) })
    return () => { cancelled = true }
  }, [canFilter])

  const { dateFrom, dateTo } = periodRange(period)

  function bumpRefresh() {
    setRefreshSignal(n => n + 1)
  }

  const staffRoles = ['STAFF', 'BASIC_STAFF', 'RECEPTIONIST']
  const isStaff = Boolean(user && staffRoles.includes(user.role))

  return (
    <>
      <style>{`
        @keyframes fadeUp{from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)}}
      `}</style>

      {/* Funcionários: visão somente leitura das próprias comissões */}
      {isStaff && <MyCommissionsView isMobile={isMobile} />}

      {/* Owner/Manager: visão completa */}
      {!isStaff && <>

      {/* Modal de config */}
      {showSettingsModal && (
        <PayoutSettingsModal
          settings={settings}
          isMobile={isMobile}
          onClose={() => setShowSettingsModal(false)}
          onSaved={(s) => {
            setSettings(s)
            setShowSettingsModal(false)
            bumpRefresh()
          }}
        />
      )}

      {/* Modal marcar como pago */}
      {showPayModal && (
        <MarkAsPaidModal
          payout={showPayModal}
          isMobile={isMobile}
          onClose={() => setShowPayModal(null)}
          onPaid={() => {
            setShowPayModal(null)
            bumpRefresh()
          }}
        />
      )}

      <div style={{
        maxWidth: 900,
        padding: isMobile ? '0 12px' : 0,
        animation: 'fadeUp 0.3s ease',
        fontFamily: typography.fontFamily,
      }}>
        {/* Header */}
        <div style={{ marginBottom: 16 }}>
          <button
            onClick={() => router.push('/dashboard/financeiro')}
            style={{
              background: 'transparent',
              border: 'none',
              color: typography.color.muted,
              fontSize: typography.scale.sm,
              cursor: 'pointer',
              padding: 0,
              marginBottom: 6,
              fontFamily: 'inherit',
            }}
          >
            ← Financeiro
          </button>
          <h1 style={{
            fontSize: isMobile ? 24 : 28,
            fontWeight: typography.weight.bold,
            color: typography.color.primary,
            margin: 0,
            letterSpacing: '-0.02em',
          }}>
            Comissões
          </h1>
          <p style={{
            fontSize: typography.scale.base,
            color: typography.color.muted,
            marginTop: 4, marginBottom: 0,
          }}>
            Pagamentos de comissões à equipe
          </p>
        </div>

        {/* Card de config */}
        <PayoutSettingsCard
          settings={settings}
          loading={settingsLoading}
          onClick={() => setShowSettingsModal(true)}
        />

        <ProfChips profs={filterProfs} value={profFilter} onChange={setProfFilter} />

        {/* Abas */}
        <div style={{
          display: 'flex',
          gap: 6,
          marginBottom: 16,
          borderBottom: `1px solid ${colors.gray.border}`,
        }}>
          <TabButton
            label="Pendentes"
            active={activeTab === 'pending'}
            onClick={() => setActiveTab('pending')}
          />
          <TabButton
            label="Histórico de pagos"
            active={activeTab === 'history'}
            onClick={() => setActiveTab('history')}
          />
          <TabButton
            label="Clube"
            active={activeTab === 'club'}
            onClick={() => setActiveTab('club')}
          />
        </div>

        {activeTab === 'pending' ? (
          <div style={{ fontSize: typography.scale.xs, color: typography.color.muted, marginBottom: 12 }}>
            Pendentes mostra o período em aberto, por isso não tem filtro de mês.
          </div>
        ) : (
          <PeriodPicker value={period} onChange={setPeriod} />
        )}
        {/* Clube nao tem tipo: o pote e todo de assinatura. */}
        {activeTab !== 'club' && <TypeChips value={typeFilter} onChange={setTypeFilter} />}

        {/* Conteúdo da aba */}
        {activeTab === 'pending' ? (
          <PendingCommissionsTab
            isMobile={isMobile}
            settings={settings}
            onOpenDetail={(id) => router.push(`/dashboard/financeiro/comissoes/${id}`)}
            onPayPayout={(p) => setShowPayModal(p)}
            refreshSignal={refreshSignal}
            professionalId={profFilter}
            typeFilter={typeFilter}
          />
        ) : activeTab === 'history' ? (
          <PayoutsHistoryTab
            isMobile={isMobile}
            onOpenDetail={(id) => router.push(`/dashboard/financeiro/comissoes/${id}`)}
            refreshSignal={refreshSignal}
            professionalId={profFilter}
            dateFrom={dateFrom}
            dateTo={dateTo}
            periodText={periodText(period)}
            typeFilter={typeFilter}
          />
        ) : (
          <ClubCommissionsTab isMobile={isMobile} professionalId={profFilter} period={period} />
        )}
      </div>
      </>}
    </>
  )
}

function TabButton({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '10px 14px',
        marginBottom: -1,
        border: 'none',
        background: 'transparent',
        cursor: 'pointer',
        fontFamily: 'inherit',
        fontSize: typography.scale.base,
        fontWeight: typography.weight.semibold,
        color: active ? colors.red.DEFAULT : typography.color.muted,
        borderBottom: `2px solid ${active ? colors.red.DEFAULT : 'transparent'}`,
        transition: 'all 0.15s ease',
        WebkitTapHighlightColor: 'transparent',
      }}
    >
      {label}
    </button>
  )
}
