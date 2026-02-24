'use client'

import { useDashboardData } from '@/app/dashboard/useDashboardData'

export default function TopBarbers() {
  const { data, loading } = useDashboardData()

  if (loading || !data) {
    return <div style={cardStyle}>Carregando...</div>
  }

  const barbers = data.topBarbers

  if (!barbers.length) {
    return (
      <div style={cardStyle}>
        <div style={headerStyle}>
          <h3 style={titleStyle}>Desempenho</h3>
          <span style={subtitleStyle}>Sem dados no período</span>
        </div>
      </div>
    )
  }

  const maxTotal = Math.max(...barbers.map(b => b.total))

  return (
    <div style={cardStyle}>
      <div style={headerStyle}>
        <h3 style={titleStyle}>Top Profissionais</h3>
        <span style={subtitleStyle}>Atendimentos concluídos</span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {barbers.map((barber, index) => (
          <div key={index}>
            <div style={rowHeader}>
              <span>{barber.name}</span>
              <span style={{ fontWeight: 600 }}>
                {barber.total}
              </span>
            </div>

            <div style={progressContainer}>
              <div
                style={{
                  ...progressBar,
                  width: `${(barber.total / maxTotal) * 100}%`,
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

const cardStyle: React.CSSProperties = {
  padding: '24px',
  borderRadius: '20px',
  background: 'rgba(255,255,255,0.75)',
  backdropFilter: 'blur(20px)',
  border: '1px solid rgba(255,255,255,0.6)',
  boxShadow: '0 10px 30px rgba(0,0,0,0.04)',
}

const headerStyle: React.CSSProperties = {
  marginBottom: '18px',
}

const titleStyle: React.CSSProperties = {
  fontSize: '16px',
  fontWeight: 600,
}

const subtitleStyle: React.CSSProperties = {
  fontSize: '13px',
  opacity: 0.6,
}

const rowHeader: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  marginBottom: '6px',
  fontSize: '14px',
}

const progressContainer: React.CSSProperties = {
  width: '100%',
  height: '8px',
  background: 'rgba(0,0,0,0.05)',
  borderRadius: '6px',
  overflow: 'hidden',
}

const progressBar: React.CSSProperties = {
  height: '100%',
  background: '#dc2626',
  borderRadius: '6px',
}
