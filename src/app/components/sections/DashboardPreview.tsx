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
      ([entry]) => { if (entry.isIntersecting) { section.classList.add(styles.visible); observer.disconnect() } },
      { threshold: 0.15 }
    )
    observer.observe(section)
    return () => observer.disconnect()
  }, [])

  return (
    <section ref={sectionRef} className={styles.section}>
      <div className={styles.container}>
        <header className={styles.header}>
          <span className={styles.kicker}>Dashboard</span>
          <h2 className={styles.title}>Controle total, em tempo real</h2>
          <p className={styles.subtitle}>
            Visualize agenda, faturamento, ocupação e desempenho do time em um
            painel claro, rápido e pensado para decisões diárias.
          </p>
        </header>

        <div className={styles.board}>
          <div className={styles.cards}>
            <DashboardMetricCard label="Faturamento"   value="R$ 12.480" meta="Últimos 7 dias" percent="+14,88%" variant="green" />
            <DashboardMetricCard label="Agenda hoje"   value="18"         meta="Horários"       percent="+4%"     variant="blue"  />
            <DashboardMetricCard label="Ocupação"      value="27%"        meta="Média semanal"  percent="-5,67%"  variant="red"   />
          </div>

          <div className={styles.bottom}>
            <div className={styles.largeCard}>
              <h4>Desempenho por serviço</h4>
              <div className={styles.fakeBars}>
                <span className={styles.barBlue}   title="Corte" />
                <span className={styles.barRed}    title="Barba" />
                <span className={styles.barPurple} title="Combo" />
                <span className={styles.barGreen}  title="Outros" />
              </div>
            </div>

            <div className={styles.sideCard}>
              <h4>Próximos horários</h4>
              <ul>
                <li><span className={styles.dotGreen}  />Corte · 10:00</li>
                <li><span className={styles.dotBlue}   />Barba · 11:30</li>
                <li><span className={styles.dotPurple} />Combo · 14:00</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}