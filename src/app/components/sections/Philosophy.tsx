// src/app/components/sections/Philosophy.tsx
'use client'

import styles from './Philosophy.module.css'

export default function Philosophy() {
  return (
    <section className={styles.section}>
      <div className={styles.container}>
        <span className={styles.kicker}>FILOSOFIA</span>
        <h2 className={styles.title}>Menos ruído. Mais controle.</h2>
        <p className={styles.text}>
          O ELIGI nasce para simplificar decisões diárias. Acreditamos que tecnologia boa é aquela
          que desaparece no uso — deixando você focar no atendimento, no time e no crescimento do
          negócio.
        </p>
        <p className={styles.text}>
          Nada de telas confusas, relatórios inúteis ou processos engessados. Tudo no ELIGI existe
          para trabalhar junto, de forma clara, previsível e elegante.
        </p>
      </div>
    </section>
  )
}
