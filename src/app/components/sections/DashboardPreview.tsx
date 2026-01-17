'use client'

import { useEffect, useMemo, useState } from 'react'

/* ======================================================
   UTIL — CURVA SUAVE (GRÁFICOS)
====================================================== */
function buildSmoothPath(data: number[], w: number, h: number) {
  const max = Math.max(...data, 1)
  const step = w / (data.length - 1)

  const points = data.map((v, i) => ({
    x: i * step,
    y: h - (v / max) * h,
  }))

  let d = `M ${points[0].x} ${points[0].y}`

  for (let i = 1; i < points.length; i++) {
    const p = points[i - 1]
    const c = points[i]
    const cx = (p.x + c.x) / 2
    d += ` C ${cx} ${p.y}, ${cx} ${c.y}, ${c.x} ${c.y}`
  }

  return d
}

/* ======================================================
   UTIL — COUNT UP
====================================================== */
function useCountUp(value: number, duration = 900) {
  const [v, setV] = useState(0)

  useEffect(() => {
    let current = 0
    const step = Math.max(1, Math.floor(value / (duration / 16)))

    const i = setInterval(() => {
      current += step
      if (current >= value) {
        setV(value)
        clearInterval(i)
      } else {
        setV(current)
      }
    }, 16)

    return () => clearInterval(i)
  }, [value, duration])

  return v
}

/* ======================================================
   MAIN
====================================================== */
export default function DashboardPreview() {
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 1400)
    return () => clearTimeout(t)
  }, [])

  /* ===== DADOS (PLUGÁVEIS COM BACKEND) ===== */
  const revenue = [12, 18, 15, 22, 30, 28, 35]
  const bookings = [8, 12, 10, 14, 16, 20, 22]
  const clients = [40, 44, 48, 52, 56, 60, 64]
  const occupancy = 78

  return (
    <section className="dashboard-preview section-soft">
      <div className="container">

        {/* HEADER */}
        <div className="dashboard-header text-center">
          <span className="eyebrow">Dashboard</span>
          <h2 className="section-title">Conheça nossa dashboard</h2>
          <p className="section-description">
            Tudo o que importa na sua empresa, em um único painel inteligente.
          </p>
        </div>

        <div className="dashboard-mock glass">

          {/* CARDS PRINCIPAIS */}
          <div className="dashboard-top">
            <Metric
              loading={loading}
              label="Faturamento"
              value={18420}
              prefix="R$ "
              data={revenue}
            />

            <Metric
              loading={loading}
              label="Atendimentos hoje"
              value={26}
              data={bookings}
            />

            <Metric
              loading={loading}
              label="Clientes ativos"
              value={84}
              data={clients}
            />

            <Metric
              loading={loading}
              label="Ocupação"
              value={occupancy}
              suffix="%"
              data={[40, 55, 60, 70, 75, 78]}
            />
          </div>

          {/* GRID PRINCIPAL */}
          <div className="dashboard-main">

            {/* RECEITA */}
            <div className="dashboard-card dashboard-chart">
              <strong className="dashboard-card-title">
                Receita da semana
              </strong>

              {loading ? (
                <div className="skeleton-curve large" />
              ) : (
                <Chart data={revenue} />
              )}
            </div>

            {/* AGENDA VISUAL */}
            <div className="dashboard-card">
              <strong className="dashboard-card-title">
                Agenda de hoje
              </strong>

              <ul className="agenda-mini">
                <li><span>09:00</span> Corte</li>
                <li><span>10:30</span> Barba</li>
                <li><span>13:00</span> Corte + Barba</li>
                <li><span>15:00</span> Hidratação</li>
              </ul>

              <button className="dashboard-cta">
                Ver agenda
              </button>
            </div>

            {/* ÚLTIMOS AGENDAMENTOS */}
            <div className="dashboard-card">
              <strong className="dashboard-card-title">
                Últimos agendamentos
              </strong>

              <ul className="list-clean">
                <li>Lucas · Corte · 10:30</li>
                <li>Marcos · Barba · 11:00</li>
                <li>João · Corte · 11:30</li>
              </ul>

              <button className="dashboard-cta">
                Criar agendamento
              </button>
            </div>

            {/* RANKING */}
            <div className="dashboard-card">
              <strong className="dashboard-card-title">
                Ranking de profissionais
              </strong>

              <ol className="ranking">
                <li>Gil · 32 atendimentos</li>
                <li>Lucas · 27 atendimentos</li>
                <li>Rafael · 21 atendimentos</li>
              </ol>
            </div>

            {/* ALERTAS */}
            <div className="dashboard-card alert-card">
              <strong className="dashboard-card-title">
                Alertas inteligentes
              </strong>

              <ul className="alerts">
                <li className="alert warning">
                  ⚠ Horário ocioso às 16:00
                </li>
                <li className="alert info">
                  ℹ Ocupação em 78% hoje
                </li>
                <li className="alert danger">
                  ⛔ Cancelamento recente
                </li>
              </ul>

              <button className="dashboard-cta secondary">
                Ajustar horários
              </button>
            </div>

          </div>
        </div>
      </div>
    </section>
  )
}

/* ======================================================
   COMPONENTS
====================================================== */

function Metric({
  loading,
  label,
  value,
  data,
  prefix = '',
  suffix = '',
}: {
  loading: boolean
  label: string
  value: number
  data: number[]
  prefix?: string
  suffix?: string
}) {
  const trend = data[data.length - 1] - data[0]
  const trendClass =
    trend > 0 ? 'trend-up' : trend < 0 ? 'trend-down' : 'trend-flat'

  const animated = useCountUp(value)

  return (
    <div className={`metric-card ${trendClass}`}>
      <span className="metric-label">{label}</span>

      {loading ? (
        <div className="skeleton-curve" />
      ) : (
        <>
          <strong className="metric-value">
            {prefix}{animated}{suffix}
          </strong>

          <Sparkline data={data} trend={trendClass} />
        </>
      )}
    </div>
  )
}

function Sparkline({
  data,
  trend,
}: {
  data: number[]
  trend: 'trend-up' | 'trend-down' | 'trend-flat'
}) {
  const path = useMemo(
    () => buildSmoothPath(data, 100, 30),
    [data]
  )

  return (
    <svg
      className={`sparkline ${trend}`}
      viewBox="0 0 100 30"
      preserveAspectRatio="none"
    >
      <path
        d={path}
        fill="none"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  )
}

function Chart({ data }: { data: number[] }) {
  const path = useMemo(
    () => buildSmoothPath(data, 300, 120),
    [data]
  )

  return (
    <svg className="chart-svg" viewBox="0 0 300 120">
      <defs>
        <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="rgba(229,9,20,0.4)" />
          <stop offset="100%" stopColor="rgba(229,9,20,0)" />
        </linearGradient>
      </defs>

      <path
        d={`${path} L300 120 L0 120 Z`}
        fill="url(#areaGradient)"
      />

      <path
        d={path}
        fill="none"
        stroke="var(--eligi-red)"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
    </svg>
  )
}
