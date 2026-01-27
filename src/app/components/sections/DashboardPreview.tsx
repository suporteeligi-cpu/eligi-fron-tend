'use client'

import { useEffect, useRef } from 'react'
import styles from './DashboardPreview.module.css'
import DashboardMetricCard from '../ui/DashboardMetricCard'

export default function DashboardPreview() {
  const sectionRef = useRef<HTMLElement | null>(null)

  useEffect(() => {
    const section = sectionRef.current
    if (!section) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          section.classList.add(styles.visible)
        }
      },
      { threshold: 0.25 }
    )

    observer.observe(section)
    return () => observer.disconnect()
  }, [])

  return (
    <section ref={sectionRef} className={styles.section}>
      <div className={styles.container}>
        {/* HEADER */}
        <header className={styles.header}>
          <span className={styles.kicker}>DASHBOARD</span>
          <h2 className={styles.title}>Controle total, em tempo real</h2>
          <p className={styles.subtitle}>
            Visualize agenda, faturamento, ocupação e desempenho do time em um
            painel claro, rápido e pensado para decisões diárias.
          </p>
        </header>

        <div className={styles.board}>
          {/* CARDS SUPERIORES (DASHBOARD REAL) */}
          <div className={styles.cards}>
            <DashboardMetricCard
              label="FATURAMENTO"
              value="R$ 12.480"
              meta="Últimos 7 dias"
              percent="+14,88%"
              variant="green"
            />

            <DashboardMetricCard
              label="AGENDA DE HOJE"
              value="18"
              meta="Horários"
              percent="+4%"
              variant="blue"
            />

            <DashboardMetricCard
              label="OCUPAÇÃO"
              value="82%"
              meta="Média semanal"
              percent="-5,67%"
              variant="red"
            />
          </div>

          {/* BLOCO INFERIOR */}
          <div className={styles.bottom}>
            <div className={styles.largeCard}>
              <h4>Desempenho por serviço</h4>

              <div className={styles.fakeBars}>
                <span className={styles.barBlue} />
                <span className={styles.barRed} />
                <span className={styles.barPurple} />
                <span className={styles.barGreen} />
              </div>
            </div>

            <div className={styles.sideCard}>
              <h4>Agenda</h4>
              <ul>
                <li>
                  <span className={styles.dotGreen} />
                  Corte • 10:00
                </li>
                <li>
                  <span className={styles.dotBlue} />
                  Barba • 11:30
                </li>
                <li>
                  <span className={styles.dotPurple} />
                  Combo • 14:00
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
