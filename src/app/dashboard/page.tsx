'use client'
// src/app/dashboard/page.tsx
// Dashboard v2.2 — layout Mock 3: hero assimétrico + KPI online

import { useState, useEffect, useCallback } from 'react'
import { Loader2, Link2, Users, AlertTriangle } from 'lucide-react'
import api from '@/shared/lib/apiClient'
import { colors, typography } from '@/shared/theme'
import { useDeviceMode } from '@/features/agenda/hooks/useDeviceMode'
import {
  DashboardOverview,
  DashboardPeriod,
  TodayScheduleItem,
  TopProfessional,
} from '@/features/dashboard/types'
import {
  fmtBRL,
  fmtBRLCompact,
  fmtGrowth,
  todayFull,
  periodCompareLabel,
} from '@/features/dashboard/utils/format'

import RevenueSparkline     from './components/RevenueSparkline'
import TopProfessionalsCard from './components/TopProfessionalsCard'
import TodayScheduleCard    from './components/TodayScheduleCard'
import AlertsCard           from './components/AlertsCard'
import PeriodSelector       from './components/PeriodSelector'
import OnlineBanner         from './components/OnlineBanner'

// ─── helpers locais ────────────────────────────────────────────────────────

function MetaDivider() {
  return (
    <div style={{
      width:      1,
      height:     28,
      background: 'rgba(0,0,0,0.08)',
      flexShrink: 0,
    }} />
  )
}

interface MetaItemProps {
  label: string
  value: string
  accent?: string
}
function MetaItem({ label, value, accent }: MetaItemProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <span style={{
        fontSize:   14,
        fontWeight: typography.weight.bold,
        color:      accent ?? typography.color.primary,
      }}>
        {value}
      </span>
      <span style={{ fontSize: 11, color: typography.color.muted }}>
        {label}
      </span>
    </div>
  )
}

function FlatKPI({
  label, value, note, noteColor, icon,
}: {
  label:      string
  value:      string
  note:       string
  noteColor?: string
  icon:       React.ReactNode
}) {
  return (
    <div style={{
      background:   'var(--surface-2)',
      borderRadius: 10,
      padding:      '14px 16px',
      display:      'flex',
      flexDirection: 'column',
      gap:          4,
    }}>
      <div style={{
        display:    'flex',
        alignItems: 'center',
        gap:        6,
        fontSize:   10,
        textTransform: 'uppercase',
        letterSpacing: '.06em',
        color:      typography.color.muted,
        marginBottom: 2,
      }}>
        {icon}
        {label}
      </div>
      <div style={{
        fontSize:   16,
        fontWeight: typography.weight.bold,
        color:      typography.color.primary,
        lineHeight: 1.2,
      }}>
        {value}
      </div>
      <div style={{ fontSize: 11, color: noteColor ?? typography.color.muted }}>
        {note}
      </div>
    </div>
  )
}

// ─── component principal ───────────────────────────────────────────────────

export default function DashboardPage() {
  const mode     = useDeviceMode()
  const isMobile = mode === 'mobile'

  const [period, setPeriod]   = useState<DashboardPeriod>('today')
  const [data, setData]       = useState<DashboardOverview | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState<string | null>(null)

  const fetchData = useCallback(async (p: DashboardPeriod) => {
    try {
      setError(null)
      const res = await api.get('/dashboard/overview', { params: { period: p } })
      setData(res.data)
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } }
      setError(e.response?.data?.message ?? 'Erro ao carregar dashboard')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchData(period) }, [fetchData, period])

  // receita do mês — sempre exibe independente do period selecionado
  const monthRevenue = data?.kpis.revenue ?? 0
  const revenueGrowthFmt = data ? fmtGrowth(data.kpis.revenueGrowth) : null

  return (
    <>
      <style>{`
        @keyframes fadeUp  { from { opacity:0;transform:translateY(8px) } to { opacity:1;transform:translateY(0) } }
        @keyframes pos-spin { to { transform:rotate(360deg) } }
        .dash-surface {
          background: var(--surface-1, #fff);
          border:     0.5px solid var(--border-subtle, rgba(0,0,0,0.08));
          border-radius: 12px;
        }
      `}</style>

      <div style={{
        maxWidth:   1100,
        padding:    isMobile ? '0 12px' : 0,
        animation:  'fadeUp 0.3s ease',
        fontFamily: typography.fontFamily,
      }}>
        {/* ── Header ── */}
        <div style={{
          display:        'flex',
          alignItems:     isMobile ? 'flex-start' : 'center',
          justifyContent: 'space-between',
          flexDirection:  isMobile ? 'column' : 'row',
          gap:            12,
          marginBottom:   20,
        }}>
          <div>
            <h1 style={{
              fontSize:      isMobile ? 20 : 22,
              fontWeight:    typography.weight.bold,
              color:         typography.color.primary,
              margin:        0,
              letterSpacing: '-.02em',
            }}>
              Visão geral
            </h1>
            <p style={{
              fontSize:  typography.scale.sm,
              color:     typography.color.muted,
              marginTop: 2,
              marginBottom: 0,
              textTransform: 'capitalize',
            }}>
              {todayFull()}
            </p>
          </div>
          <PeriodSelector value={period} onChange={setPeriod} />
        </div>

        {/* ── Loading ── */}
        {loading || !data ? (
          <div style={{
            display: 'flex', justifyContent: 'center',
            alignItems: 'center', padding: 80,
          }}>
            <Loader2 size={28} style={{
              animation: 'pos-spin 0.8s linear infinite',
              color:     colors.red.DEFAULT,
            }} />
          </div>
        ) : error ? (
          <div style={{
            padding:      '16px 20px',
            background:   'rgba(220,38,38,0.06)',
            border:       `1px solid ${colors.red.border}`,
            borderRadius: 11,
            color:        colors.red.DEFAULT,
            fontSize:     typography.scale.sm,
            textAlign:    'center',
          }}>
            {error}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>

            {/* ── Hero row ── */}
            <div style={{
              display:             'grid',
              gridTemplateColumns: isMobile ? '1fr' : 'minmax(0,2fr) minmax(0,1fr)',
              gap:                 10,
            }}>
              {/* Hero — receita */}
              <div className="dash-surface" style={{ padding: isMobile ? '18px 20px' : '22px 26px' }}>
                <div style={{
                  fontSize:      11,
                  textTransform: 'uppercase',
                  letterSpacing: '.07em',
                  color:         typography.color.muted,
                  marginBottom:  6,
                }}>
                  {period === 'today'
                    ? 'Receita do mês'
                    : period === '7d'
                      ? 'Receita — últimos 7 dias'
                      : 'Receita — últimos 30 dias'}
                </div>
                <div style={{
                  fontSize:      isMobile ? 30 : 38,
                  fontWeight:    typography.weight.bold,
                  color:         typography.color.primary,
                  lineHeight:    1,
                  marginBottom:  16,
                  letterSpacing: '-.02em',
                }}>
                  {fmtBRL(monthRevenue)}
                </div>
                <div style={{
                  display:       'flex',
                  alignItems:    'center',
                  gap:           isMobile ? 12 : 20,
                  flexWrap:      'wrap',
                  paddingTop:    14,
                  borderTop:     '0.5px solid var(--border-subtle, rgba(0,0,0,0.08))',
                }}>
                  {revenueGrowthFmt && (
                    <>
                      <MetaItem
                        label={periodCompareLabel(period)}
                        value={revenueGrowthFmt.text}
                        accent={
                          revenueGrowthFmt.positive === true  ? '#16a34a' :
                          revenueGrowthFmt.positive === false ? '#dc2626' :
                          undefined
                        }
                      />
                      <MetaDivider />
                    </>
                  )}
                  <MetaItem
                    label="ticket médio"
                    value={isMobile ? fmtBRLCompact(data.kpis.ticketAverage) : fmtBRL(data.kpis.ticketAverage)}
                  />
                  <MetaDivider />
                  <MetaItem
                    label="agendamentos"
                    value={String(data.kpis.totalBookings)}
                  />
                  {data.kpis.tomorrowBookings > 0 && (
                    <>
                      <MetaDivider />
                      <MetaItem
                        label="amanhã"
                        value={String(data.kpis.tomorrowBookings)}
                      />
                    </>
                  )}
                </div>
              </div>

              {/* Side — agenda + online banner */}
              <div className="dash-surface" style={{
                padding:        isMobile ? '18px 20px' : '20px 22px',
                display:        'flex',
                flexDirection:  'column',
                gap:            0,
              }}>
                <div style={{
                  marginBottom:  14,
                  paddingBottom: 14,
                  borderBottom:  '0.5px solid var(--border-subtle, rgba(0,0,0,0.08))',
                }}>
                  <div style={{
                    fontSize:      11,
                    textTransform: 'uppercase',
                    letterSpacing: '.07em',
                    color:         typography.color.muted,
                    marginBottom:  4,
                  }}>
                    Agendamentos hoje
                  </div>
                  <div style={{
                    fontSize:   28,
                    fontWeight: typography.weight.bold,
                    color:      typography.color.primary,
                    lineHeight: 1,
                  }}>
                    {data.kpis.totalBookings}
                  </div>
                  {data.kpis.tomorrowBookings > 0 && (
                    <div style={{ fontSize: 12, color: typography.color.muted, marginTop: 4 }}>
                      {data.kpis.tomorrowBookings} agendados amanhã
                    </div>
                  )}
                </div>

                <OnlineBanner data={data.kpis.onlineBookings} isMobile={isMobile} />
              </div>
            </div>

            {/* ── Faixa de KPIs secundários ── */}
            <div style={{
              display:             'grid',
              gridTemplateColumns: isMobile ? 'repeat(2,1fr)' : 'repeat(4,minmax(0,1fr))',
              gap:                 10,
            }}>
              <FlatKPI
                label="Ocupação hoje"
                value={`${Math.round(data.kpis.attendanceRate)}%`}
                note="taxa de presença"
                icon={<Users size={12} />}
              />
              <FlatKPI
                label="Ticket médio"
                value={isMobile ? fmtBRLCompact(data.kpis.ticketAverage) : fmtBRL(data.kpis.ticketAverage)}
                note="por venda no período"
                icon={<span style={{ fontSize: 12 }}>R$</span>}
              />
              <FlatKPI
                label="Comissões pend."
                value={fmtBRLCompact(data.alerts.pendingCommissions.total)}
                note={`${data.alerts.pendingCommissions.professionals} profissional(is)`}
                noteColor={data.alerts.pendingCommissions.total > 0 ? '#d97706' : undefined}
                icon={<AlertTriangle size={12} />}
              />
              <FlatKPI
                label="Sem profissional"
                value={String(data.alerts.unassignedBookings.count)}
                note="agendamentos abertos"
                noteColor={data.alerts.unassignedBookings.count > 0 ? '#dc2626' : undefined}
                icon={<Link2 size={12} />}
              />
            </div>

            {/* ── Sparkline + Top profissionais ── */}
            <div style={{
              display:             'grid',
              gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
              gap:                 10,
            }}>
              <RevenueSparkline data={data.revenueChart} isMobile={isMobile} />
              <TopProfessionalsCard professionals={data.topProfessionals as TopProfessional[]} />
            </div>

            {/* ── Agenda hoje + Alertas ── */}
            <div style={{
              display:             'grid',
              gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
              gap:                 10,
            }}>
              <TodayScheduleCard items={data.todaySchedule as TodayScheduleItem[]} />
              <AlertsCard alerts={data.alerts} />
            </div>

          </div>
        )}
      </div>
    </>
  )
}
