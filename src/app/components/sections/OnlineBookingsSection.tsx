'use client'

import { useEffect, useRef } from 'react'
import styles from './OnlineBookingsSection.module.css'

const KPIS = [
  { label: 'Agendamentos online',       value: '142',      badge: '↑ 100%' },
  { label: 'Receita online',            value: 'R$ 6.380', sub: '28% do faturamento' },
  { label: 'Novos clientes via link',   value: '87' },
  { label: 'Escolheram o profissional', value: '68%' },
]

const MONTHS = [
  { label: 'Jan', h: 22 },
  { label: 'Fev', h: 34 },
  { label: 'Mar', h: 46 },
  { label: 'Abr', h: 60 },
  { label: 'Mai', h: 80 },
  { label: 'Jun', h: 100 },
]

export default function OnlineBookingsSection() {
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
          <span className={styles.badge}>Canal online</span>
          <h2 className={styles.title}>
            Seu link trabalhando<br />24 horas por dia
          </h2>
          <p className={styles.text}>
            Enquanto você atende, seu link recebe agendamentos sozinho.
            Acompanhe o impacto do canal online — quantos clientes novos e
            quanto de faturamento ele traz — no mesmo painel do seu dashboard.
          </p>
          <a href="#video" className={styles.cta}>Ver demonstração</a>
        </div>

        <div className={styles.panel}>
          <span className={styles.panelHead}>Canal online · últimos 30 dias</span>

          <div className={styles.kpis}>
            {KPIS.map(k => (
              <div key={k.label} className={styles.kpi}>
                <span className={styles.kpiLabel}>{k.label}</span>
                <div className={styles.kpiValue}>
                  {k.value}
                  {k.badge && <span className={styles.up}>{k.badge}</span>}
                </div>
                {k.sub && <span className={styles.kpiSub}>{k.sub}</span>}
              </div>
            ))}
          </div>

          <div className={styles.card}>
            <span className={styles.cardTitle}>Agendamentos pelo link por mês</span>
            <div className={styles.bars}>
              {MONTHS.map((m, i) => (
                <div key={m.label} className={styles.barCol}>
                  <div
                    className={`${styles.bar}${i === MONTHS.length - 1 ? ` ${styles.barHi}` : ''}`}
                    style={{ height: `${m.h}%` }}
                  />
                </div>
              ))}
            </div>
            <div className={styles.months}>
              {MONTHS.map(m => <span key={m.label}>{m.label}</span>)}
            </div>
          </div>

          <div className={styles.card}>
            <span className={styles.cardTitle}>Origem dos agendamentos</span>
            <div className={styles.origem}>
              <div className={styles.origemOn} style={{ width: '58%' }} />
            </div>
            <div className={styles.legend}>
              <span><span className={styles.swOn} />Online · 142 (58%)</span>
              <span><span className={styles.swManual} />Manual · 104 (42%)</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
