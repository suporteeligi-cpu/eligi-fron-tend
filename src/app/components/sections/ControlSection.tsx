// src/app/components/sections/ControlSection.tsx
'use client'

import styles from './ControlSection.module.css'

const CONTROLS = [
  {
    title: 'Agenda sempre sob controle',
    description:
      'Seus horários organizados automaticamente, sem mensagens, sem confusão e sem retrabalho.'
  },
  {
    title: 'Lembretes que funcionam',
    description:
      'Clientes avisados no momento certo, menos faltas e mais previsibilidade no dia a dia.'
  },
  {
    title: 'Gestão simples e clara',
    description:
      'Tudo o que você precisa ver, em um só lugar, sem telas complicadas ou excesso de informação.'
  }
]

export default function ControlSection() {
  return (
    <section className={styles.section}>
      <div className={styles.container}>
        <header className={styles.header}>
          <h2 className={styles.title}>
            Controle sem esforço.
            <br />
            <span>Organização que acontece sozinha.</span>
          </h2>
          <p className={styles.subtitle}>
            O ELIGI cuida da rotina do seu negócio para que você possa focar no atendimento
            e no crescimento — sem precisar aprender nada complicado.
          </p>
        </header>

        <div className={styles.grid}>
          {CONTROLS.map(item => (
            <div key={item.title} className={styles.card}>
              <h3 className={styles.cardTitle}>{item.title}</h3>
              <p className={styles.cardDescription}>{item.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
