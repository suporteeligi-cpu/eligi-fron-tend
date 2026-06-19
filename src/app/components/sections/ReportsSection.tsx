'use client'

import { useEffect, useRef } from 'react'
import styles from './ReportsSection.module.css'

const KPIS = [
  { label: 'Agendamentos', value: '318',        badge: '↑ 100%' },
  { label: 'Receita',      value: 'R$ 48.200',  badge: '↑ 100%' },
  { label: 'Clientes',     value: '1.840',      sub: '156 novos' },
  { label: 'Online (link)',value: '22%',        sub: 'do faturamento', accent: true },
]

const REVENUE_TYPES = [
  { name: 'Assinaturas', pct: 58, value: 'R$ 28.000', color: '#f59e0b' },
  { name: 'Pacotes',     pct: 22, value: 'R$ 10.600', color: '#dc2626' },
  { name: 'Serviços',    pct: 15, value: 'R$ 7.200',  color: '#3b82f6' },
  { name: 'Produtos',    pct: 5,  value: 'R$ 2.400',  color: '#8b5cf6' },
]

export default function ReportsSection() {
  const sectionRef = useRef<HTMLElement | null>(null)

  useEffect(() => {
    const el = sectionRef.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.classList.add(styles.visible)
          observer.disconnect()
        }
      },
      { threshold: 0.15 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return (
    <section ref={sectionRef} className={styles.section}>
      <div className={styles.container}>
        <div className={styles.content}>
          <span className={styles.badge}>Estatísticas e relatórios</span>
          <h2 className={styles.title}>
            Decisões com base em<br />números, não no achismo
          </h2>
          <p className={styles.text}>
            Receita, agendamentos, clientes, fluxo de caixa e desempenho do time —
            em relatórios claros que mostram pra onde o seu negócio está indo, mês a mês.
          </p>
          <a href="#video" className={styles.cta}>Ver demonstração</a>
        </div>

        <div className={styles.panel}>
          <span className={styles.panelHead}>Estatísticas · Jun 2026</span>

          <div className={styles.kpis}>
            {KPIS.map(k => (
              <div key={k.label} className={styles.kpi}>
                <span className={`${styles.kpiLabel}${k.accent ? ` ${styles.kpiLabelAccent}` : ''}`}>{k.label}</span>
                <div className={styles.kpiValue}>
                  {k.value}
                  {k.badge && <span className={styles.up}>{k.badge}</span>}
                </div>
                {k.sub && <span className={styles.kpiSub}>{k.sub}</span>}
              </div>
            ))}
          </div>

          <div className={styles.card}>
            <span className={styles.cardTitle}>Receita</span>
            <svg className={styles.chart} viewBox="0 0 300 84" preserveAspectRatio="none" aria-hidden="true">
              <path d="M2,76 C40,74 72,72 112,62 C150,52 168,28 188,16 L188,82 L2,82 Z" fill="#10B981" fillOpacity="0.12" />
              <path d="M2,76 C40,74 72,72 112,62 C150,52 168,28 188,16" fill="none" stroke="#10B981" strokeWidth="2.5" />
              <path d="M188,16 C206,30 222,44 250,48 C272,51 290,50 298,50" fill="none" stroke="#10B981" strokeWidth="2.5" strokeDasharray="3 4" />
            </svg>
            <div className={styles.months}>
              <span>Fev</span><span>Abr</span><span>Jun</span><span>Ago</span><span>Out</span><span>Dez</span>
            </div>
          </div>

          <div className={styles.card}>
            <span className={styles.cardTitle}>Receita por tipo de venda</span>
            <div className={styles.stack}>
              {REVENUE_TYPES.map(t => (
                <div key={t.name} style={{ width: `${t.pct}%`, background: t.color }} />
              ))}
            </div>
            {REVENUE_TYPES.map(t => (
              <div key={t.name} className={styles.legRow}>
                <span className={styles.dot} style={{ background: t.color }} />
                <span className={styles.legName}>{t.name}</span>
                <span className={styles.legPct}>{t.pct}%</span>
                <span className={styles.legVal}>{t.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
