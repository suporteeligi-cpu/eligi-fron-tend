'use client'

import { useDashboardData } from '@/app/dashboard/useDashboardData'

/* ── Skeleton ── */
function TopBarbersSkeleton() {
  return (
    <div style={cardStyle}>
      <style>{`@keyframes eligi-pulse { 0%,100%{opacity:1} 50%{opacity:.45} }`}</style>
      {[0,1,2].map(i => (
        <div key={i} style={{
          height: '48px', borderRadius: '10px',
          background: 'rgba(0,0,0,0.04)',
          animation: 'eligi-pulse 1.4s ease-in-out infinite',
          animationDelay: `${i * 0.12}s`,
          marginBottom: i < 2 ? '12px' : 0,
        }} />
      ))}
    </div>
  )
}

/* ── Medal colors ── */
const MEDALS = ['🥇', '🥈', '🥉']

/* ── Main ── */
export default function TopBarbers() {
  const { data, loading } = useDashboardData()

  if (loading || !data) return <TopBarbersSkeleton />

  const barbers  = data.topBarbers
  const maxTotal = barbers.length ? Math.max(...barbers.map(b => b.total)) : 1

  return (
    <div style={cardStyle}>
      <div style={headerStyle}>
        <div>
          <h3 style={titleStyle}>Top Profissionais</h3>
          <span style={subtitleStyle}>Atendimentos concluídos no período</span>
        </div>
      </div>

      {!barbers.length ? (
        <div style={{
          padding: '24px 0',
          textAlign: 'center',
          color: 'var(--text-muted, #9ca3af)',
          fontSize: '14px',
        }}>
          Sem dados no período selecionado.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {barbers.map((barber, index) => {
            const pct = maxTotal > 0 ? (barber.total / maxTotal) * 100 : 0
            return (
              <div key={index}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '6px',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {index < 3 && (
                      <span style={{ fontSize: '16px', lineHeight: 1 }}>{MEDALS[index]}</span>
                    )}
                    <span style={{
                      fontSize: '14px',
                      fontWeight: 500,
                      color: 'var(--text-primary, #0f0f14)',
                    }}>
                      {barber.name}
                    </span>
                  </div>
                  <span style={{
                    fontSize: '13px',
                    fontWeight: 700,
                    color: index === 0 ? '#dc2626' : 'var(--text-primary, #374151)',
                    background: index === 0 ? 'rgba(220,38,38,0.08)' : 'rgba(0,0,0,0.04)',
                    padding: '2px 8px',
                    borderRadius: '6px',
                  }}>
                    {barber.total}
                  </span>
                </div>

                {/* Progress bar */}
                <div style={{
                  width: '100%',
                  height: '6px',
                  background: 'rgba(0,0,0,0.06)',
                  borderRadius: '999px',
                  overflow: 'hidden',
                }}>
                  <div style={{
                    height: '100%',
                    width: `${pct}%`,
                    background: index === 0
                      ? 'linear-gradient(90deg, #ef4444, #dc2626)'
                      : 'linear-gradient(90deg, #9ca3af, #6b7280)',
                    borderRadius: '999px',
                    transition: 'width 600ms cubic-bezier(.4,0,.2,1)',
                    boxShadow: index === 0 ? '0 0 8px rgba(220,38,38,0.35)' : 'none',
                  }} />
                </div>
              </div>
            )
          })}
        </div>
      )}
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