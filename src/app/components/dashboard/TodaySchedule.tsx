'use client'

import { useDashboardData } from '@/app/dashboard/useDashboardData'

export default function TodaySchedule() {
  const { data, loading } = useDashboardData()

  if (loading || !data) {
    return <div style={cardStyle}>Carregando...</div>
  }

  const appointments = data.todaySchedule || []

  if (!appointments.length) {
    return (
      <div style={cardStyle}>
        <div style={headerStyle}>
          <h3 style={titleStyle}>Agenda de Hoje</h3>
          <span style={subtitleStyle}>Nenhum atendimento hoje</span>
        </div>
      </div>
    )
  }

  return (
    <div style={cardStyle}>
      <div style={headerStyle}>
        <h3 style={titleStyle}>Agenda de Hoje</h3>
        <span style={subtitleStyle}>Próximos atendimentos</span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        {appointments.map((item, index) => (
          <div key={index} style={rowStyle}>
            <div style={timeStyle}>{item.time}</div>

            <div style={{ flex: 1 }}>
              <div style={clientStyle}>{item.client}</div>
              <div style={serviceStyle}>{item.service}</div>
            </div>

            <div style={barberStyle}>{item.professional}</div>
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

const rowStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '16px',
  padding: '12px',
  borderRadius: '12px',
  background: 'rgba(0,0,0,0.02)',
}

const timeStyle: React.CSSProperties = {
  fontWeight: 600,
  fontSize: '14px',
  width: '70px',
}

const clientStyle: React.CSSProperties = {
  fontSize: '14px',
  fontWeight: 500,
}

const serviceStyle: React.CSSProperties = {
  fontSize: '12px',
  opacity: 0.6,
}

const barberStyle: React.CSSProperties = {
  fontSize: '13px',
  fontWeight: 500,
  color: '#dc2626',
}
