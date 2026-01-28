'use client'

import Image from 'next/image'
import styles from './HeroSection.module.css'

export default function HeroSection() {
  return (
    <section className={styles.hero}>
      <div className={styles.background} />

      <div className={styles.container}>
        <div className={styles.content}>
          {/* LOGO — PROTAGONISTA */}
          <div className={styles.logoWrapper}>
            <Image
              src="/images/logo.png"
              alt="ELIGI"
              width={220}
              height={220}
              priority
              className={styles.logo}
            />
          </div>

          {/* TÍTULO — QUASE COLADO */}
          <h1 className={styles.title}>
            Gerencie, cresça e
            <br />
            <span className={styles.highlight}>
              transforme seu negócio
            </span>
          </h1>

          <p className={styles.subtitle}>
            Agendamentos, gestão, pagamentos e crescimento — tudo em um único
            ecossistema inteligente para o seu negócio.
          </p>

          <div className={styles.actions}>
            <a href="/register" className={styles.primary}>
              Criar conta
            </a>
            <a href="/login" className={styles.secondary}>
              Entrar
            </a>
          </div>
        </div>
      </div>
    </section>
  )
}
