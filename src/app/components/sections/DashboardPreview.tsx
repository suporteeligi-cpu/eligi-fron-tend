'use client'

import { useEffect, useState } from 'react'

export default function DashboardPreview() {
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 1400)
    return () => clearTimeout(timer)
  }, [])

  return (
    <section className="dashboard-preview section-soft">
      <div className="container">
        {/* HEADER */}
        <div className="dashboard-header text-center">
          <span className="eyebrow">Painel de Controle</span>
          <h2 className="section-title">Sua empresa em tempo real</h2>
          <p className="section-description">
            Métricas, agenda e desempenho organizados em um único painel.
          </p>
        </div>

        <div className="dashboard-mock glass">
          {/* TOP METRICS */}
          <div className="dashboard-top">
            <MetricCard
              loading={loading}
              label="Faturamento"
              value="R$ 18.420"
              sub="Últimos 7 dias"
            />

            <MetricCard
              loading={loading}
              label="Atendimentos"
              value="126"
              sub="Semana atual"
            />

            <MetricCard
              loading={loading}
              label="Clientes ativos"
              value="84"
              sub="Recorrentes"
            />
          </div>

          {/* MAIN */}
          <div className="dashboard-main">
            {/* CHART */}
            <div className="dashboard-card dashboard-chart">
              <strong className="dashboard-card-title">
                Receita diária
              </strong>

              {loading ? (
                <div className="skeleton-chart" />
              ) : (
                <>
                  <svg
                    className="chart-svg"
                    viewBox="0 0 300 120"
                    preserveAspectRatio="none"
                  >
                    <defs>
                      <linearGradient
                        id="areaGradient"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop offset="0%" stopColor="rgba(229,9,20,0.45)" />
                        <stop offset="100%" stopColor="rgba(229,9,20,0)" />
                      </linearGradient>
                    </defs>

                    <path
                      d="
                        M0 90
                        C30 60, 60 70, 90 55
                        S150 40, 180 55
                        S240 30, 300 45
                        L300 120
                        L0 120
                        Z
                      "
                      fill="url(#areaGradient)"
                    />

                    <path
                      d="
                        M0 90
                        C30 60, 60 70, 90 55
                        S150 40, 180 55
                        S240 30, 300 45
                      "
                      fill="none"
                      stroke="var(--eligi-red)"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                    />
                  </svg>

                  <div className="chart-labels">
                    <span>Seg</span><span>Ter</span><span>Qua</span>
                    <span>Qui</span><span>Sex</span><span>Sáb</span><span>Dom</span>
                  </div>
                </>
              )}
            </div>

            {/* AGENDA */}
            <div className="dashboard-card">
              <strong className="dashboard-card-title">
                Agenda de hoje
              </strong>

              {loading ? (
                <SkeletonList />
              ) : (
                <ul className="agenda-list">
                  <li><span>09:00</span> Corte masculino</li>
                  <li><span>10:30</span> Barba premium</li>
                  <li><span>13:00</span> Corte + Barba</li>
                  <li><span>15:00</span> Hidratação</li>
                </ul>
              )}
            </div>

            {/* TEAM */}
            <div className="dashboard-card">
              <strong className="dashboard-card-title">
                Equipe
              </strong>

              {loading ? (
                <SkeletonList />
              ) : (
                <ul className="team-list">
                  <li><span className="status online" /> Gil · Atendendo</li>
                  <li><span className="status idle" /> Lucas · Livre</li>
                  <li><span className="status busy" /> Rafael · Pausa</li>
                </ul>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

/* ===================== SUB COMPONENTS ===================== */

function MetricCard({
  loading,
  label,
  value,
  sub,
}: {
  loading: boolean
  label: string
  value: string
  sub: string
}) {
  return (
    <div className="metric-card">
      <span className="metric-label">{label}</span>

      {loading ? (
        <>
          <div className="skeleton-line lg" />
          <div className="skeleton-line sm" />
        </>
      ) : (
        <>
          <strong className="metric-value">{value}</strong>
          <Sparkline />
          <span className="metric-sub">{sub}</span>
        </>
      )}
    </div>
  )
}

function Sparkline() {
  return (
    <svg
      className="sparkline"
      viewBox="0 0 100 30"
      preserveAspectRatio="none"
    >
      {/* Linha curva suave, mesma linguagem do gráfico principal */}
      <path
        d="
          M0 22
          C10 18, 20 20, 30 16
          S50 10, 60 14
          S80 8, 100 12
        "
        fill="none"
        stroke="var(--eligi-red)"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}


function SkeletonList() {
  return (
    <div className="skeleton-list">
      <div className="skeleton-line" />
      <div className="skeleton-line" />
      <div className="skeleton-line" />
    </div>
  )
}
