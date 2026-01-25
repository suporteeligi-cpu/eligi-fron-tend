// src/app/components/hero/HeroEmotional.tsx
'use client'

import Link from 'next/link'
import Image from 'next/image'
import styles from './HeroEmotional.module.css'

export default function HeroEmotional() {
  return (
    <section className={styles.hero}>
      <div className={styles.glassBackground} />

      <div className={styles.container}>
        <div className={styles.content}>
          <Image
            src="/images/globo-light.png"
            alt="ELIGI"
            width={92}
            height={92}
            priority
          />

          <h1 className={styles.title}>
            Você já trabalha demais.
            <br />
            <span>Agora deixe o sistema trabalhar por você.</span>
          </h1>

          <p className={styles.subtitle}>
            Mais agendamentos. Menos faltas. Mais controle do seu negócio —
            sem complicação, sem esforço extra.
          </p>

          <div className={styles.benefits}>
            <span>Mais agendamentos</span>
            <span>Menos no-show</span>
            <span>Negócio organizado</span>
          </div>

          <div className={styles.actions}>
            <Link href="/register" className={styles.primary}>Começar agora</Link>
            <Link href="/login" className={styles.secondary}>Já uso o ELIGI</Link>
          </div>
        </div>
      </div>
    </section>
  )
}
