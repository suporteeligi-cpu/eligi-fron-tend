'use client'

import { useDashboardData } from '@/app/dashboard/useDashboardData'

export default function DashboardKPIs() {
  const { data, loading } = useDashboardData()

  if (loading || !data) {
    return <div>Carregando...</div>
  }

  const {
    revenue,
    revenueGrowth,
    ticketAverage,
    attendanceRate,
    totalBookings
  } = data.kpis

  return (
    <div style={container}>
      <MetricCard
        title="Receita"
        value={`R$ ${revenue.toFixed(2)}`}
        growth={revenueGrowth}
      />

      <MetricCard
        title="Ticket Médio"
        value={`R$ ${ticketAverage.toFixed(2)}`}
      />

      <MetricCard
        title="Comparecimento"
        value={`${attendanceRate.toFixed(1)}%`}
      />

      <MetricCard
        title="Agendamentos"
        value={totalBookings}
      />
    </div>
  )
}

interface MetricCardProps {
  title: string
  value: string | number
  growth?: number
}

function MetricCard({ title, value, growth }: MetricCardProps) {
  const isPositive = growth !== undefined && growth > 0
  const isNegative = growth !== undefined && growth < 0

  return (
    <div style={card}>
      <div style={titleStyle}>{title}</div>
      <div style={valueStyle}>{value}</div>

      {growth !== undefined && (
        <div
          style={{
            ...growthStyle,
            color: isPositive
              ? '#16a34a'
              : isNegative
              ? '#dc2626'
              : '#9ca3af'
          }}
        >
          {isPositive && '▲ '}
          {isNegative && '▼ '}
          {growth.toFixed(1)}%
        </div>
      )}
    </div>
  )
}

const container: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
  gap: '16px',
}

const card: React.CSSProperties = {
  background: 'rgba(255,255,255,0.6)',
  backdropFilter: 'blur(20px)',
  borderRadius: '16px',
  padding: '20px',
  border: '1px solid rgba(255,255,255,0.3)',
}

const titleStyle: React.CSSProperties = {
  fontSize: '14px',
  opacity: 0.6,
}

const valueStyle: React.CSSProperties = {
  fontSize: '22px',
  fontWeight: 600,
  marginTop: '6px',
}

const growthStyle: React.CSSProperties = {
  marginTop: '8px',
  fontSize: '14px',
  fontWeight: 500,
}
