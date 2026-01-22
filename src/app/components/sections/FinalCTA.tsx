// src/app/components/sections/FinalCTA.tsx
'use client'

import Link from 'next/link'
import styles from './FinalCTA.module.css'

export default function FinalCTA() {
  return (
    <section className={styles.section}>
      <div className={styles.container}>
        <div className={styles.card}>
          <h2 className={styles.title}>Pronto para simplificar sua gestão?</h2>
          <p className={styles.subtitle}>
            Comece agora e tenha controle total do seu negócio em uma plataforma clara,
            rápida e pensada para o dia a dia.
          </p>

          <div className={styles.actions}>
            <Link href="/register" className={styles.primary}>Criar conta gratuitamente</Link>
            <Link href="/login" className={styles.secondary}>Já tenho conta</Link>
          </div>
        </div>
      </div>
    </section>
  )
}
