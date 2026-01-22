// src/app/components/sections/Ecosystem.tsx
'use client'

import styles from './Ecosystem.module.css'

const ITEMS = [
  {
    title: 'Agenda inteligente',
    description:
      'Agendamentos automáticos, controle de horários, prevenção de conflitos e visão clara do dia.'
  },
  {
    title: 'Gestão de equipe',
    description:
      'Controle de profissionais, comissões, desempenho e organização do time em um só lugar.'
  },
  {
    title: 'Clientes & relacionamento',
    description:
      'Histórico, recorrência, lembretes e fidelização integrados à rotina do negócio.'
  },
  {
    title: 'Financeiro & pagamentos',
    description:
      'Faturamento, repasses, visão financeira clara e integração com meios de pagamento.'
  },
  {
    title: 'Crescimento & anúncios',
    description:
      'Visibilidade para novos clientes e ferramentas para expandir sua presença.'
  },
  {
    title: 'Plataforma conectada',
    description:
      'Tudo funciona junto: agenda, equipe, clientes e financeiro em um ecossistema único.'
  }
]

export default function Ecosystem() {
  return (
    <section className={styles.section}>
      <div className={styles.container}>
        <header className={styles.header}>
          <span className={styles.kicker}>ECOSSISTEMA ELIGI</span>
          <h2 className={styles.title}>Tudo o que seu negócio precisa, em um só lugar</h2>
          <p className={styles.subtitle}>
            Inspirado nas melhores plataformas do mundo, o ELIGI conecta todas as áreas do seu
            negócio em uma experiência simples, fluida e inteligente.
          </p>
        </header>

        <div className={styles.grid}>
          {ITEMS.map(item => (
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
