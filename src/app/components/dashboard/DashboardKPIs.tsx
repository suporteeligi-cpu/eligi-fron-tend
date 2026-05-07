'use client'

import { useDashboardData } from '@/app/dashboard/useDashboardData'

/* ── Skeleton ── */
function KPISkeleton() {
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
      gap: '16px',
    }}>
      {[0,1,2,3].map(i => (
        <div key={i} style={{
          height: '108px',
          borderRadius: '18px',
          background: 'rgba(0,0,0,0.04)',
          animation: 'eligi-pulse 1.4s ease-in-out infinite',
          animationDelay: `${i * 0.1}s`,
        }} />
      ))}
      <style>{`
        @keyframes eligi-pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.45; }
        }
      `}</style>
    </div>
  )
}

/* ── Metric card ── */
interface MetricCardProps {
  title: string
  value: string | number
  growth?: number
  icon?: string
}

function MetricCard({ title, value, growth, icon }: MetricCardProps) {
  const hasGrowth  = growth !== undefined
  const isPositive = hasGrowth && growth! > 0
  const isNegative = hasGrowth && growth! < 0
  const isNeutral  = hasGrowth && growth === 0

  const growthColor = isPositive ? '#16a34a' : isNegative ? '#dc2626' : '#9ca3af'
  const growthBg    = isPositive
    ? 'rgba(22,163,74,0.08)'
    : isNegative
    ? 'rgba(220,38,38,0.08)'
    : 'rgba(156,163,175,0.10)'

  return (
    <>
      <style>{`
        .eligi-kpi-card {
          background: rgba(255,255,255,0.72);
          backdrop-filter: blur(20px) saturate(160%);
          -webkit-backdrop-filter: blur(20px) saturate(160%);
          border-radius: 18px;
          padding: 20px 22px;
          border: 1px solid rgba(255,255,255,0.60);
          box-shadow:
            0 2px 0 rgba(255,255,255,0.85) inset,
            0 8px 24px rgba(0,0,0,0.06),
            0 2px 6px rgba(0,0,0,0.04);
          position: relative;
          overflow: hidden;
          transition: box-shadow 200ms ease, transform 200ms ease;
        }
        .eligi-kpi-card:hover {
          transform: translateY(-1px);
          box-shadow:
            0 2px 0 rgba(255,255,255,0.85) inset,
            0 12px 32px rgba(0,0,0,0.09),
            0 3px 8px rgba(0,0,0,0.05);
        }
        html.dark .eligi-kpi-card {
          background: rgba(22,22,30,0.72);
          border-color: rgba(255,255,255,0.07);
          box-shadow:
            0 2px 0 rgba(255,255,255,0.04) inset,
            0 8px 24px rgba(0,0,0,0.28),
            0 2px 6px rgba(0,0,0,0.20);
        }
      `}</style>

      <div className="eligi-kpi-card">
        {/* Top shine */}
        <div aria-hidden style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: '40%',
          background: 'linear-gradient(180deg, rgba(255,255,255,0.12) 0%, transparent 100%)',
          pointerEvents: 'none',
        }} />

        <div style={{
          fontSize: '12px',
          fontWeight: 600,
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
          color: 'var(--text-muted, #9ca3af)',
          marginBottom: '10px',
          position: 'relative',
        }}>
          {icon && <span style={{ marginRight: '6px' }}>{icon}</span>}
          {title}
        </div>

        <div style={{
          fontSize: '26px',
          fontWeight: 700,
          letterSpacing: '-0.03em',
          color: 'var(--text-primary, #0f0f14)',
          lineHeight: 1,
          position: 'relative',
        }}>
          {value}
        </div>

        {hasGrowth && (
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            marginTop: '10px',
            padding: '3px 8px',
            borderRadius: '6px',
            background: growthBg,
            fontSize: '12px',
            fontWeight: 600,
            color: growthColor,
            position: 'relative',
          }}>
            {isPositive && '↑'}
            {isNegative && '↓'}
            {isNeutral  && '→'}
            {Math.abs(growth!).toFixed(1)}%
          </div>
        )}
      </div>
    </>
  )
}

/* ── Main ── */
export default function DashboardKPIs() {
  const { data, loading } = useDashboardData()

  if (loading || !data) return <KPISkeleton />

  const { revenue, revenueGrowth, ticketAverage, attendanceRate, totalBookings } = data.kpis

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
      gap: '16px',
    }}>
      <MetricCard
        title="Receita"
        icon="💰"
        value={`R$ ${revenue.toFixed(2)}`}
        growth={revenueGrowth}
      />
      <MetricCard
        title="Ticket Médio"
        icon="🎯"
        value={`R$ ${ticketAverage.toFixed(2)}`}
      />
      <MetricCard
        title="Comparecimento"
        icon="📋"
        value={`${attendanceRate.toFixed(1)}%`}
      />
      <MetricCard
        title="Agendamentos"
        icon="📅"
        value={totalBookings}
      />
    </div>
  )
}