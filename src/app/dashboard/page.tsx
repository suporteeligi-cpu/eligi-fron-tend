'use client'
// src/app/dashboard/page.tsx

import { useState, useEffect, useCallback } from 'react'
import { DollarSign, CalendarDays, Receipt, Activity, Loader2 } from 'lucide-react'
import api from '@/shared/lib/apiClient'
import { colors, typography } from '@/shared/theme'
import { useDeviceMode } from '@/features/agenda/hooks/useDeviceMode'
import {
  DashboardOverview, DashboardPeriod,
} from '@/features/dashboard/types'
import {
  fmtBRL, fmtBRLCompact, fmtGrowth, fmtPercent, todayFull, periodCompareLabel,
} from '@/features/dashboard/utils/format'

import KpiCard               from './components/KpiCard'
import RevenueSparkline      from './components/RevenueSparkline'
import TopProfessionalsCard  from './components/TopProfessionalsCard'
import TodayScheduleCard     from './components/TodayScheduleCard'
import AlertsCard            from './components/AlertsCard'
import PeriodSelector        from './components/PeriodSelector'

export default function DashboardPage() {
  const mode     = useDeviceMode()
  const isMobile = mode === 'mobile'

  const [period, setPeriod] = useState<DashboardPeriod>('today')
  const [data, setData]     = useState<DashboardOverview | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]   = useState<string | null>(null)

  const fetchData = useCallback(async (p: DashboardPeriod) => {
    try {
      setError(null)
      const res = await api.get('/dashboard/overview', { params: { period: p } })
      const payload = res.data
      setData(payload)
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } }
      setError(e.response?.data?.message ?? 'Erro ao carregar dashboard')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchData(period) }, [fetchData, period])

  return (
    <>
      <style>{`
        @keyframes fadeUp { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes pos-spin { to { transform: rotate(360deg); } }
      `}</style>

      <div style={{
        maxWidth: 1100,
        padding: isMobile ? '0 12px' : 0,
        animation: 'fadeUp 0.3s ease',
        fontFamily: typography.fontFamily,
      }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: isMobile ? 'flex-start' : 'center',
          justifyContent: 'space-between',
          gap: 12,
          flexDirection: isMobile ? 'column' : 'row',
          marginBottom: 18,
        }}>
          <div>
            <h1 style={{
              fontSize: isMobile ? 22 : 26,
              fontWeight: typography.weight.bold,
              color: typography.color.primary,
              margin: 0,
              letterSpacing: '-0.02em',
            }}>
              Visão geral
            </h1>
            <p style={{
              fontSize: typography.scale.sm,
              color: typography.color.muted,
              marginTop: 2, marginBottom: 0,
              textTransform: 'capitalize',
            }}>
              {todayFull()}
            </p>
          </div>
          <PeriodSelector value={period} onChange={setPeriod} />
        </div>

        {loading || !data ? (
          <div style={{
            display: 'flex', justifyContent: 'center', alignItems: 'center',
            padding: 80,
          }}>
            <Loader2 size={28} style={{ animation: 'pos-spin 0.8s linear infinite', color: colors.red.DEFAULT }} />
          </div>
        ) : error ? (
          <div style={{
            padding: '16px 20px',
            background: 'rgba(220,38,38,0.06)',
            border: `1px solid ${colors.red.border}`,
            borderRadius: 11,
            color: colors.red.DEFAULT,
            fontSize: typography.scale.sm,
            textAlign: 'center',
          }}>
            {error}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {/* KPIs */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(4, 1fr)',
              gap: 10,
            }}>
              <KpiCard
                label="RECEITA"
                value={isMobile ? fmtBRLCompact(data.kpis.revenue) : fmtBRL(data.kpis.revenue)}
                growth={fmtGrowth(data.kpis.revenueGrowth)}
                subtitle={periodCompareLabel(period)}
                Icon={DollarSign}
                gradient="linear-gradient(135deg, #dc2626, #b91c1c)"
              />
              <KpiCard
                label="AGENDAMENTOS"
                value={String(data.kpis.totalBookings)}
                subtitle={data.kpis.tomorrowBookings > 0
                  ? `${data.kpis.tomorrowBookings} amanhã`
                  : 'no período'
                }
                Icon={CalendarDays}
                gradient="linear-gradient(135deg, #0891b2, #0e7490)"
              />
              <KpiCard
                label="TICKET MÉDIO"
                value={isMobile ? fmtBRLCompact(data.kpis.ticketAverage) : fmtBRL(data.kpis.ticketAverage)}
                subtitle="por venda"
                Icon={Receipt}
                gradient="linear-gradient(135deg, #7c3aed, #6d28d9)"
              />
              <KpiCard
                label="OCUPAÇÃO"
                value={fmtPercent(data.kpis.attendanceRate)}
                subtitle="taxa de presença"
                Icon={Activity}
                gradient="linear-gradient(135deg, #16a34a, #15803d)"
              />
            </div>

            {/* Grid principal: receita + topProfs + agenda + alertas */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
              gap: 10,
            }}>
              <RevenueSparkline data={data.revenueChart} isMobile={isMobile} />
              <TopProfessionalsCard professionals={data.topProfessionals} />
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
              gap: 10,
            }}>
              <TodayScheduleCard items={data.todaySchedule} />
              <AlertsCard alerts={data.alerts} />
            </div>
          </div>
        )}
      </div>
    </>
  )
}
