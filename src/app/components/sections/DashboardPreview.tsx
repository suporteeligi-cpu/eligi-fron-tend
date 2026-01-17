export default function DashboardPreview() {
  return (
    <section className="dashboard-preview section-soft">
      <div className="container">
        <div className="dashboard-header">
          <span className="eyebrow">Painel de Controle</span>
          <h2 className="section-title">Sua empresa em tempo real</h2>
          <p className="section-description">
            Métricas, agenda e desempenho organizados em um único painel.
          </p>
        </div>

        <div className="dashboard-mock glass">
          {/* TOP METRICS */}
          <div className="dashboard-top">
            <div className="metric-card">
              <span className="metric-label">Faturamento</span>
              <strong className="metric-value">R$ 18.420</strong>
              <span className="metric-sub">Últimos 7 dias</span>
            </div>

            <div className="metric-card">
              <span className="metric-label">Atendimentos</span>
              <strong className="metric-value">126</strong>
              <span className="metric-sub">Semana atual</span>
            </div>

            <div className="metric-card">
              <span className="metric-label">Clientes ativos</span>
              <strong className="metric-value">84</strong>
              <span className="metric-sub">Recorrentes</span>
            </div>
          </div>

          {/* MAIN DASHBOARD */}
          <div className="dashboard-main">
            {/* GRAPH */}
            <div className="dashboard-card dashboard-chart">
              <strong>Receita diária</strong>

              <svg
                className="chart-svg"
                viewBox="0 0 300 120"
                preserveAspectRatio="none"
              >
                <defs>
                  <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="rgba(229,9,20,0.45)" />
                    <stop offset="100%" stopColor="rgba(229,9,20,0)" />
                  </linearGradient>
                </defs>

                {/* Area */}
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

                {/* Line */}
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
                <span>Seg</span>
                <span>Ter</span>
                <span>Qua</span>
                <span>Qui</span>
                <span>Sex</span>
                <span>Sáb</span>
                <span>Dom</span>
              </div>
            </div>

            {/* AGENDA */}
            <div className="dashboard-card">
              <strong>Agenda de hoje</strong>
              <ul className="agenda-list">
                <li><span>09:00</span> Corte masculino</li>
                <li><span>10:30</span> Barba premium</li>
                <li><span>13:00</span> Corte + Barba</li>
                <li><span>15:00</span> Hidratação</li>
              </ul>
            </div>

            {/* TEAM */}
            <div className="dashboard-card">
              <strong>Equipe</strong>
              <ul className="team-list">
                <li><span className="status online" /> Gil · Atendendo</li>
                <li><span className="status idle" /> Lucas · Livre</li>
                <li><span className="status busy" /> Rafael · Pausa</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
