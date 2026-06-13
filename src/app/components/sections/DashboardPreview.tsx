'use client'

import { useEffect, useRef } from 'react'
import Image from 'next/image'
import styles from './DashboardPreview.module.css'

export default function DashboardPreview() {
  const sectionRef = useRef<HTMLElement | null>(null)

  useEffect(() => {
    const section = sectionRef.current
    if (!section) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          section.classList.add(styles.visible)
          observer.disconnect()
        }
      },
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

        <div className={styles.frame}>
          <Image
            src="/images/dashboard-preview.png"
            alt="Painel do eligi — visão geral"
            width={1920}
            height={1022}
            className={styles.image}
          />
        </div>
      </div>
    </section>
  )
}
