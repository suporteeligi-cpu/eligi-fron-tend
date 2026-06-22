'use client'

import Image from 'next/image'
import Link from 'next/link'
import styles from './HeroSection.module.css'

export default function HeroSection() {
  return (
    <section className={styles.hero}>
      <div className={styles.background} />

      <div className={styles.container}>
        <div className={styles.content}>
          <span className={styles.badge}>O sistema que cuida do seu negócio de ponta a ponta</span>

          <h1 className={styles.title}>
            Gerencie, cresça e
            <br />
            <span className={styles.highlight}>transforme seu negócio</span>
          </h1>

          <p className={styles.subtitle}>
            Agenda, equipe, financeiro e link de agendamento online — tudo em um
            só ecossistema, simples e no seu controle.
          </p>

          <div className={styles.actions}>
            <Link href="/register" className={styles.primary}>
              Criar conta grátis
            </Link>
            <a href="#video" className={styles.secondary}>
              Ver demonstração
            </a>
          </div>
        </div>

        <div className={styles.visual}>
          <Image
            src="/images/hero-mockup.png"
            alt="Eligi no computador e no celular"
            width={2114}
            height={1447}
            priority
            className={styles.mockup}
          />
        </div>
      </div>
    </section>
  )
}
