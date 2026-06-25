'use client'
// src/app/dashboard/financeiro/comissoes/page.tsx

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import api from '@/shared/lib/apiClient'
import { colors, typography } from '@/shared/theme'
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

type Tab = 'pending' | 'history' | 'club'

// ─── EligiClub: comissões do clube (componentes de módulo, fora do render) ──
interface ClubCommItem { professionalId: string; professionalName: string; professionalAvatar: string | null; fichas: number; pct: number; amount: number }
interface ClubCommPeriod { periodKey: string; poolTotal: number; totalFichas: number; settledAt: string; paymentsCount: number; items: ClubCommItem[] }
interface ClubCommOwner { scope: 'owner'; totalAmount: number; periods: ClubCommPeriod[] }

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

function ClubPeriodCard({ p, isOpen, onToggle }: { p: ClubCommPeriod; isOpen: boolean; onToggle: () => void }) {
  return (
    <div style={{ background: '#fff', border: `0.5px solid ${colors.gray.border}`, borderRadius: 14, marginBottom: 10, boxShadow: '0 1px 3px rgba(0,0,0,0.04)', overflow: 'hidden' }}>
      <button onClick={onToggle} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 11, padding: '13px 16px', cursor: 'pointer', border: 'none', background: 'linear-gradient(135deg,#16161C,#0E0E12)', color: '#fff', fontFamily: 'inherit', textAlign: 'left' }}>
        <ChevronRight size={15} style={{ color: 'rgba(255,255,255,0.6)', flexShrink: 0, transform: isOpen ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s' }} />
        <span style={{ width: 28, height: 28, borderRadius: 8, background: 'rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <EligiClubIcon size={16} color="#F4F2EC" />
        </span>
        <div>
          <div style={{ fontSize: 13.5, fontWeight: 800 }}>{clubPeriodLabel(p.periodKey)}</div>
          <div style={{ fontSize: 10.5, color: 'rgba(255,255,255,0.55)', marginTop: 1 }}>
            <b style={{ color: '#FF6B6B' }}>{p.totalFichas}</b> fichas · {p.paymentsCount} mensalidade{p.paymentsCount !== 1 ? 's' : ''} · FECHADO
          </div>
        </div>
        <div style={{ marginLeft: 'auto', textAlign: 'right', flexShrink: 0 }}>
          <div style={{ fontSize: 15, fontWeight: 820, fontVariantNumeric: 'tabular-nums' }}>{clubFmtBRL(p.poolTotal)}</div>
          <div style={{ fontSize: 8, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '.06em' }}>Pote</div>
        </div>
      </button>
      {isOpen && p.items.map((it, idx) => (
        <div key={it.professionalId} style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '11px 16px', borderBottom: idx < p.items.length - 1 ? `0.5px solid ${colors.gray.border}` : 'none' }}>
          <ClubProfBubble id={it.professionalId} name={it.professionalName} avatar={it.professionalAvatar} size={32} />
          <div style={{ minWidth: 110 }}>
            <div style={{ fontSize: 13, fontWeight: 680, color: typography.color.primary }}>{it.professionalName}</div>
            <div style={{ fontSize: 10, color: typography.color.muted, marginTop: 1 }}>{it.fichas} fichas · {it.pct}%</div>
          </div>
          <div style={{ flex: 1, height: 6, borderRadius: 999, background: '#f0f0f3', overflow: 'hidden', margin: '0 6px' }}>
            <div style={{ width: `${it.pct}%`, height: '100%', borderRadius: 999, background: clubAvatarColors(it.professionalId)[1] }} />
          </div>
          <div style={{ fontSize: 13, fontWeight: 780, fontVariantNumeric: 'tabular-nums', flexShrink: 0, minWidth: 60, textAlign: 'right', color: typography.color.primary }}>{clubFmtBRL(it.amount)}</div>
        </div>
      ))}
    </div>
  )
}

function ClubCommissionsTab({ isMobile }: { isMobile: boolean }) {
  const [data, setData] = useState<ClubCommOwner | null>(null)
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState<Set<string>>(() => new Set<string>())
  const reqRef = useRef(0)

  const fetchData = useCallback(async () => {
    const token = ++reqRef.current
    try {
      const res = await api.get('/club-settlements/commissions')
      const d = (res.data?.data ?? null) as ClubCommOwner | null
      if (token !== reqRef.current) return
      setData(d)
      setOpen(d?.periods?.[0] ? new Set([d.periods[0].periodKey]) : new Set<string>())
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

  if (loading) return <div style={{ padding: 40, textAlign: 'center', color: typography.color.muted, fontSize: 13 }}>Carregando…</div>
  if (!data || data.periods.length === 0) return (
    <div style={{ background: '#fff', border: `0.5px solid ${colors.gray.border}`, borderRadius: 14, padding: '40px 24px', textAlign: 'center', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
      <div style={{ marginBottom: 10, display: 'flex', justifyContent: 'center' }}><EligiClubIcon size={30} color="#0E0E12" /></div>
      <div style={{ fontSize: 14, fontWeight: 600, color: typography.color.primary, marginBottom: 4 }}>Nenhum período de clube fechado</div>
      <div style={{ fontSize: 12, color: typography.color.muted }}>Os fechamentos do EligiClub aparecem aqui depois de rateados.</div>
    </div>
  )

  return (
    <div style={{ padding: isMobile ? '0 2px' : 0 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, color: typography.color.muted, textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 12, flexWrap: 'wrap' }}>
        <EligiClubIcon size={14} color="#0E0E12" /> Total rateado em clube ·
        <b style={{ fontSize: 15, color: typography.color.primary, textTransform: 'none', letterSpacing: 0 }}>{clubFmtBRL(data.totalAmount)}</b>
        em {data.periods.length} período{data.periods.length !== 1 ? 's' : ''}
      </div>
      {data.periods.map(p => (
        <ClubPeriodCard key={p.periodKey} p={p} isOpen={open.has(p.periodKey)} onToggle={() => toggle(p.periodKey)} />
      ))}
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

        {/* Conteúdo da aba */}
        {activeTab === 'pending' ? (
          <PendingCommissionsTab
            isMobile={isMobile}
            settings={settings}
            onOpenDetail={(id) => router.push(`/dashboard/financeiro/comissoes/${id}`)}
            onPayPayout={(p) => setShowPayModal(p)}
            refreshSignal={refreshSignal}
          />
        ) : activeTab === 'history' ? (
          <PayoutsHistoryTab
            isMobile={isMobile}
            onOpenDetail={(id) => router.push(`/dashboard/financeiro/comissoes/${id}`)}
            refreshSignal={refreshSignal}
          />
        ) : (
          <ClubCommissionsTab isMobile={isMobile} />
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
