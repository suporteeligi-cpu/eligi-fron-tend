'use client'

const mockData = {
  revenueToday: 2450,
  revenueMonth: 38900,
  ticket: 72,
  attendanceRate: 94,
  appointmentsToday: 18,
}

export default function DashboardKPIs() {
  return (
    <div style={grid}>
      <MetricCard title="Faturamento Hoje" value={`R$ ${mockData.revenueToday}`} />
      <MetricCard title="Faturamento Mês" value={`R$ ${mockData.revenueMonth}`} />
      <MetricCard title="Ticket Médio" value={`R$ ${mockData.ticket}`} />
      <MetricCard title="Comparecimento" value={`${mockData.attendanceRate}%`} />
      <MetricCard title="Agendamentos Hoje" value={mockData.appointmentsToday} />
    </div>
  )
}

interface MetricCardProps {
  title: string
  value: string | number
}

function MetricCard({ title, value }: MetricCardProps) {
  return (
    <div style={card}>
      <span style={label}>{title}</span>
      <span style={valueStyle}>{value}</span>
    </div>
  )
}

const grid: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(5, 1fr)',
  gap: '20px',
}

const card: React.CSSProperties = {
  padding: '20px',
  borderRadius: '20px',
  background: 'rgba(255,255,255,0.75)',
  backdropFilter: 'blur(20px)',
  border: '1px solid rgba(255,255,255,0.6)',
  boxShadow: '0 10px 30px rgba(0,0,0,0.04)',
  display: 'flex',
  flexDirection: 'column',
  gap: '6px',
}

const label: React.CSSProperties = {
  fontSize: '13px',
  opacity: 0.6,
}

const valueStyle: React.CSSProperties = {
  fontSize: '24px',
  fontWeight: 700,
}