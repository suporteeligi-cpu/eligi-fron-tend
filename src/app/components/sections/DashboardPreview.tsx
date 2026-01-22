// src/app/components/sections/DashboardPreview.tsx
'use client'

import styles from './DashboardPreview.module.css'

export default function DashboardPreview() {
  return (
    <section className={styles.section}>
      <div className={styles.container}>
        <header className={styles.header}>
          <span className={styles.kicker}>DASHBOARD</span>
          <h2 className={styles.title}>Controle total, em tempo real</h2>
          <p className={styles.subtitle}>
            Visualize agenda, faturamento, ocupação e desempenho do time em um painel claro,
            rápido e pensado para decisões diárias.
          </p>
        </header>

        <div className={styles.board}>
          <div className={styles.cards}>
            <div className={styles.card}>
              <span className={styles.cardLabel}>Faturamento</span>
              <strong className={styles.cardValue}>R$ 12.480</strong>
              <span className={styles.cardMeta}>Últimos 7 dias</span>
            </div>

            <div className={styles.card}>
              <span className={styles.cardLabel}>Agenda de hoje</span>
              <strong className={styles.cardValue}>18 horários</strong>
              <span className={styles.cardMeta}>3 disponíveis</span>
            </div>

            <div className={styles.card}>
              <span className={styles.cardLabel}>Ocupação</span>
              <strong className={styles.cardValue}>82%</strong>
              <span className={styles.cardMeta}>Média semanal</span>
            </div>

            <div className={styles.card}>
              <span className={styles.cardLabel}>Clientes ativos</span>
              <strong className={styles.cardValue}>246</strong>
              <span className={styles.cardMeta}>Últimos 30 dias</span>
            </div>
          </div>

          <div className={styles.placeholder}>
            <div className={styles.fakeChart} />
            <div className={styles.fakeList}>
              <div />
              <div />
              <div />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
