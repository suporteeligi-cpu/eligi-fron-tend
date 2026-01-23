// src/app/components/hero/HeroSection.tsx
'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useState } from 'react'
import styles from './HeroSection.module.css'

export default function HeroSection() {
  const [theme] = useState<'light' | 'dark'>(() => {
    if (typeof document === 'undefined') return 'light'

    return (
      (document.documentElement.getAttribute('data-theme') as
        | 'light'
        | 'dark') ?? 'light'
    )
  })

  return (
    <section className={styles.hero}>
      <div className={styles.background} />

      <div className={styles.container}>
        <div className={styles.content}>
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
            Gestão inteligente para
            <span className={styles.highlight}> barbearias e salões</span>
          </h1>

          <p className={styles.subtitle}>
            Agendamentos, profissionais, pagamentos, crescimento e controle —
            tudo em uma plataforma simples, rápida e elegante.
          </p>

          <div className={styles.actions}>
            <Link href="/register" className={styles.primary}>
              Criar conta
            </Link>
            <Link href="/login" className={styles.secondary}>
              Entrar
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
