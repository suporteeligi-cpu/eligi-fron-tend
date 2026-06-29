'use client'

import Link from 'next/link'
import { useReveal } from './useReveal'
import styles from './ClosingCta.module.css'

export default function ClosingCta() {
  const ref = useReveal<HTMLElement>()
  return (
    <section ref={ref} className={`${styles.final} reveal-on`}>
      <div className={styles.glow} aria-hidden />
      <div className={styles.inner}>
        <h2 className={styles.title}>Comece hoje.<br />Seu negócio no ar em 5 minutos.</h2>
        <p className={styles.sub}>Junte agenda, caixa, equipe e agendamento online num sistema só.</p>
        <Link href="/register" className={styles.cta}>Criar minha conta grátis <span aria-hidden>→</span></Link>
        <p className={styles.micro}>7 dias grátis · sem cartão · cancele quando quiser</p>
      </div>
    </section>
  )
}
