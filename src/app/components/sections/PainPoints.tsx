// src/app/components/sections/PainPoints.tsx
'use client'

import styles from './PainPoints.module.css'

const PAINS = [
  {
    pain: 'Agenda desorganizada',
    relief: 'Agenda online sempre atualizada'
  },
  {
    pain: 'Clientes faltando sem avisar',
    relief: 'Lembretes automáticos que reduzem no-show'
  },
  {
    pain: 'Muito tempo perdido em mensagens',
    relief: 'Agendamentos feitos sozinhos, 24h por dia'
  }
]

export default function PainPoints() {
  return (
    <section className={styles.section}>
      <div className={styles.container}>
        <header className={styles.header}>
          <h2 className={styles.title}>
            Menos improviso no dia a dia.
            <br />
            <span>Mais previsibilidade no seu negócio.</span>
          </h2>
          <p className={styles.subtitle}>
            O ELIGI resolve os problemas que mais roubam seu tempo e energia —
            sem você precisar aprender nada complicado.
          </p>
        </header>

        <div className={styles.list}>
          {PAINS.map(item => (
            <div key={item.pain} className={styles.item}>
              <div className={styles.pain}>{item.pain}</div>
              <div className={styles.arrow}>→</div>
              <div className={styles.relief}>{item.relief}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
