'use client'

import { useDashboard } from '@/app/dashboard/DashboardContext'

export default function DashboardHeader() {
  const { period, setPeriod } = useDashboard()

  return (
    <div style={container}>
      <div>
        <h2 style={title}>Visão Geral</h2>
        <p style={subtitle}>
          Acompanhe o crescimento do seu negócio em tempo real.
        </p>
      </div>

      <div style={filters}>
        <FilterButton
          active={period === 'today'}
          onClick={() => setPeriod('today')}
        >
          Hoje
        </FilterButton>

        <FilterButton
          active={period === '7d'}
          onClick={() => setPeriod('7d')}
        >
          7 dias
        </FilterButton>

        <FilterButton
          active={period === '30d'}
          onClick={() => setPeriod('30d')}
        >
          30 dias
        </FilterButton>
      </div>
    </div>
  )
}

interface FilterButtonProps {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}

function FilterButton({
  active,
  onClick,
  children,
}: FilterButtonProps) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '6px 14px',
        borderRadius: '8px',
        border: active ? '1px solid #dc2626' : '1px solid #e5e7eb',
        background: active ? 'rgba(220,38,38,0.08)' : '#fff',
        cursor: 'pointer',
        fontSize: '13px',
        fontWeight: active ? 600 : 500,
        color: active ? '#dc2626' : '#374151',
        transition: 'all 150ms ease',
      }}
    >
      {children}
    </button>
  )
}

const container: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
}

const title: React.CSSProperties = {
  fontSize: '22px',
  fontWeight: 600,
}

const subtitle: React.CSSProperties = {
  fontSize: '14px',
  opacity: 0.6,
}

const filters: React.CSSProperties = {
  display: 'flex',
  gap: '8px',
}