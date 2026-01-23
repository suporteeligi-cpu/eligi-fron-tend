// src/app/(public)/page.tsx
'use client'

import Image from 'next/image'
import { useState } from 'react'
import Navbar from '../components/navbar/Navbar'
import Footer from '../components/footer/Footer'
import styles from './Home.module.css'

export default function HomePage() {
  const [theme] = useState<'light' | 'dark'>(() => {
    if (typeof document === 'undefined') return 'light'

    return (
      (document.documentElement.getAttribute('data-theme') as
        | 'light'
        | 'dark') ?? 'light'
    )
  })

  return (
    <div className={styles.root}>
      <Navbar />

      <main className={styles.main}>
        <section className={styles.hero}>
          <div className={styles.heroCard}>
            <Image
              src={
                theme === 'dark'
                  ? '/images/globo-dark.png'
                  : '/images/globo-light.png'
              }
              alt="ELIGI"
              width={96}
              height={96}
              priority
            />

            <h1 className={styles.title}>
              O sistema inteligente para barbearias e salões
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

        <section className={styles.preview}>
          <div className={styles.previewCard}>
            <h2 className={styles.sectionTitle}>
              Conheça o Dashboard ELIGI
            </h2>

            <p className={styles.sectionSubtitle}>
              Um painel claro, rápido e inteligente, inspirado no padrão Apple.
            </p>

            <div className={styles.miniGrid}>
              <div className={styles.miniCard}>Faturamento</div>
              <div className={styles.miniCard}>Agenda do Dia</div>
              <div className={styles.miniCard}>Ocupação</div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
