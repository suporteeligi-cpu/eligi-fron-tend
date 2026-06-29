'use client'

import { useReveal } from './useReveal'
import styles from './GuaranteeStrip.module.css'

export default function GuaranteeStrip() {
  const ref = useReveal<HTMLDivElement>()
  return (
    <div ref={ref} className={`${styles.strip} reveal-on`}>
      <div className={styles.inner}>
        <span className={styles.item}>
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M20 6L9 17l-5-5" /></svg>
          Sem cartão de crédito
        </span>
        <span className={styles.sep} aria-hidden />
        <span className={styles.item}>
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M20 6L9 17l-5-5" /></svg>
          Cancele quando quiser
        </span>
        <span className={styles.sep} aria-hidden />
        <span className={styles.item}>
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><rect x="5" y="11" width="14" height="10" rx="2" /><path d="M8 11V7a4 4 0 0 1 8 0v4" /></svg>
          Seus dados protegidos (LGPD)
        </span>
      </div>
    </div>
  )
}
