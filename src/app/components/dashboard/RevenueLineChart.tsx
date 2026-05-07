'use client'

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts'

interface TooltipPayload {
  value?: number
}

interface CustomTooltipProps {
  active?: boolean
  payload?: TooltipPayload[]
  label?: string
}
import { useDashboard }     from '@/app/dashboard/DashboardContext'
import { useDashboardData } from '@/app/dashboard/useDashboardData'

/* ── Custom tooltip ── */
function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload?.length) return null
  return (
    <div style={{
      background: 'rgba(15,15,20,0.92)',
      backdropFilter: 'blur(12px)',
      border: '1px solid rgba(255,255,255,0.10)',
      borderRadius: '10px',
      padding: '8px 14px',
      fontSize: '13px',
      color: '#fff',
      boxShadow: '0 8px 24px rgba(0,0,0,0.25)',
    }}>
      <div style={{ color: 'rgba(255,255,255,0.50)', marginBottom: '2px', fontSize: '11px' }}>{label}</div>
      <div style={{ fontWeight: 700, color: '#f87171' }}>
        R$ {payload[0].value?.toFixed(2)}
      </div>
    </div>
  )
}

/* ── Skeleton ── */
function ChartSkeleton() {
  return (
    <div style={cardStyle}>
      <div style={{ height: '20px', width: '120px', borderRadius: '6px', background: 'rgba(0,0,0,0.06)', marginBottom: '8px' }} />
      <div style={{ height: '280px', borderRadius: '12px', background: 'rgba(0,0,0,0.04)', animation: 'eligi-pulse 1.4s ease-in-out infinite' }} />
      <style>{`@keyframes eligi-pulse { 0%,100%{opacity:1} 50%{opacity:.45} }`}</style>
    </div>
  )
}

export default function RevenueLineChart() {
  const { period }     = useDashboard()
  const { data, loading } = useDashboardData()

  if (loading) return <ChartSkeleton />

  const chartData = data?.revenueChart ?? []

  return (
    <div style={cardStyle}>
      <div style={headerStyle}>
        <div>
          <h3 style={titleStyle}>Receita</h3>
          <span style={subtitleStyle}>Período: {period}</span>
        </div>
        {chartData.length > 0 && (
          <div style={{
            fontSize: '13px', fontWeight: 600,
            color: '#dc2626',
            background: 'rgba(220,38,38,0.08)',
            border: '1px solid rgba(220,38,38,0.15)',
            padding: '4px 10px', borderRadius: '8px',
          }}>
            R$ {chartData.reduce((s, d) => s + (d.value ?? 0), 0).toFixed(2)}
          </div>
        )}
      </div>

      <div style={{ width: '100%', height: 280 }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="eligi-revenue-line" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%"   stopColor="#ef4444" />
                <stop offset="100%" stopColor="#dc2626" />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="4 4"
              stroke="rgba(0,0,0,0.06)"
              vertical={false}
            />
            <XAxis
              dataKey="label"
              stroke="transparent"
              tick={{ fill: '#9ca3af', fontSize: 12 }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              stroke="transparent"
              tick={{ fill: '#9ca3af', fontSize: 12 }}
              tickLine={false}
              axisLine={false}
              tickFormatter={v => `R$${v}`}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'rgba(220,38,38,0.15)', strokeWidth: 1 }} />
            <Line
              type="monotone"
              dataKey="value"
              stroke="url(#eligi-revenue-line)"
              strokeWidth={2.5}
              dot={{ r: 3, fill: '#dc2626', strokeWidth: 0 }}
              activeDot={{ r: 5, fill: '#dc2626', strokeWidth: 2, stroke: '#fff' }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

const cardStyle: React.CSSProperties = {
  background: 'rgba(255,255,255,0.72)',
  backdropFilter: 'blur(20px) saturate(160%)',
  WebkitBackdropFilter: 'blur(20px) saturate(160%)',
  borderRadius: '20px',
  padding: '24px',
  border: '1px solid rgba(255,255,255,0.60)',
  boxShadow: '0 2px 0 rgba(255,255,255,0.85) inset, 0 8px 28px rgba(0,0,0,0.06)',
}

const headerStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-start',
  marginBottom: '20px',
}

const titleStyle: React.CSSProperties = {
  fontSize: '16px',
  fontWeight: 700,
  letterSpacing: '-0.02em',
  color: 'var(--text-primary, #0f0f14)',
  margin: 0,
}

const subtitleStyle: React.CSSProperties = {
  fontSize: '12px',
  color: 'var(--text-muted, #9ca3af)',
  marginTop: '2px',
  display: 'block',
}