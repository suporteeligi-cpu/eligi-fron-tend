'use client'

import { useEffect, useRef } from 'react'
import styles from './StatisticsSection.module.css'
import TrendChart from '../ui/TrendChart'

export default function StatisticsSection() {
  const sectionRef = useRef<HTMLElement | null>(null)

  useEffect(() => {
    const section = sectionRef.current
    if (!section) return
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { section.classList.add(styles.visible); observer.disconnect() } },
      { threshold: 0.2 }
    )
    observer.observe(section)
    return () => observer.disconnect()
  }, [])

  return (
    <section ref={sectionRef} className={styles.stats}>
      <div className={styles.container}>
        <div className={styles.visual}>
          <TrendChart
            label="Agendamentos"
            value="104"
            sub="Este mês"
            percent="+14,88%"
            variant="green"
          />
        </div>

        <div className={styles.content}>
          <div className={styles.badge}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
              <line x1="4" y1="20" x2="20" y2="20" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
              <rect x="6"  y="11" width="3" height="7"  rx="1" stroke="currentColor" strokeWidth="1.8" />
              <rect x="11" y="7"  width="3" height="11" rx="1" stroke="currentColor" strokeWidth="1.8" />
              <rect x="16" y="4"  width="3" height="14" rx="1" stroke="currentColor" strokeWidth="1.8" />
            </svg>
            <span>Estatísticas</span>
          </div>

          <h2 className={styles.title}>Como anda o seu negócio?</h2>

          <p className={styles.text}>
            Visualize seu faturamento e o comportamento dos clientes em tempo real.
            Tudo o que você precisa para crescer com estratégia, decisões mais
            inteligentes e controle total do seu negócio.
          </p>
        </div>
      </div>
    </section>
  )
}