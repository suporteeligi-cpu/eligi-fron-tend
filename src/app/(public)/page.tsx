// src/app/(public)/page.tsx
'use client'

import Image from 'next/image'
import Navbar from '../components/navbar/Navbar'
import Footer from '../components/footer/Footer'
import styles from './Home.module.css'

export default function HomePage() {
  return (
    <div className={styles.root}>
      <Navbar />

      <main className={styles.main}>
        {/* HERO */}
        <section className={styles.hero}>
          <div className={styles.heroCard}>
            {/* LOGO — troca via CSS / data-theme */}
            <div className={styles.logoWrapper}>
              <Image
                src="/images/logo.png"
                alt="ELIGI"
                width={88}
                height={88}
                priority
                className={styles.logoLight}
              />

              <Image
                src="/images/logo.branco.png"
                alt="ELIGI"
                width={88}
                height={88}
                priority
                className={styles.logoDark}
              />
            </div>

            <h1 className={styles.title}>
              Gerencie, cresça e transforme seu negócio.
            </h1>

            <p className={styles.subtitle}>
              Agendamentos, gestão, pagamentos e crescimento — tudo em um único
              ecossistema.
            </p>

            <div className={styles.actions}>
              <a href="/register" className={styles.primaryBtn}>
                Criar conta
              </a>
              <a href="/login" className={styles.secondaryBtn}>
                Entrar
              </a>
            </div>
          </div>
        </section>

        {/* DASHBOARD PREVIEW */}
        <section className={styles.preview}>
          <div className={styles.previewCard}>
            <h2 className={styles.sectionTitle}>
              Conheça o Dashboard ELIGI
            </h2>

            <p className={styles.sectionSubtitle}>
              Um painel claro, rápido e inteligente, inspirado no padrão Apple.
            </p>

            <div className={styles.miniGrid}>
              <div className={styles.miniCard}>
                <span className={styles.miniLabel}>Faturamento</span>
                <strong>R$ 12.450</strong>
              </div>

              <div className={styles.miniCard}>
                <span className={styles.miniLabel}>Agenda do dia</span>
                <strong>18 horários</strong>
              </div>

              <div className={styles.miniCard}>
                <span className={styles.miniLabel}>Ocupação</span>
                <strong>92%</strong>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
