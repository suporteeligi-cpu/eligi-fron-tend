'use client'

import { useEffect, useRef } from 'react'
import styles from './Ecosystem.module.css'

const ITEMS = [
  { title: 'Agenda inteligente',         description: 'Agendamentos, controle de horários, prevenção de conflitos e visão clara do dia.', icon: 'calendar', color: 'blue'   },
  { title: 'Caixa & financeiro',         description: 'Vendas no caixa, faturamento, comissões e visão financeira em tempo real.',         icon: 'credit',   color: 'purple' },
  { title: 'Gestão de equipe',           description: 'Profissionais, horários, comissões e desempenho do time em um só lugar.',           icon: 'users',    color: 'green'  },
  { title: 'Clientes & fidelização',     description: 'Histórico, recorrência e relacionamento integrados à rotina do negócio.',           icon: 'heart',    color: 'red'    },
  { title: 'Estoque',                    description: 'Controle de produtos, entradas e saídas com histórico de movimentações.',           icon: 'box',      color: 'orange' },
  { title: 'Pacotes',                    description: 'Crie pacotes de serviços e acompanhe o saldo de cada cliente.',                      icon: 'package',  color: 'teal'   },
  { title: 'Link público de agendamento',description: 'Seus clientes agendam sozinhos, a qualquer hora, pelo seu link exclusivo.',         icon: 'globe',    color: 'blue'   },
  { title: 'Serviços',                   description: 'Catálogo com duração, preço, cor e profissionais por serviço.',                      icon: 'scissors', color: 'purple' },
]

function Icon({ name }: { name: string }) {
  const props = { viewBox: '0 0 24 24', fill: 'none', 'aria-hidden': true as const }
  switch (name) {
    case 'calendar': return <svg {...props}><rect x="3" y="5" width="18" height="16" rx="3" stroke="currentColor" strokeWidth="1.8"/><line x1="3" y1="9" x2="21" y2="9" stroke="currentColor" strokeWidth="1.8"/></svg>
    case 'users':    return <svg {...props}><circle cx="8" cy="8" r="3" stroke="currentColor" strokeWidth="1.8"/><circle cx="16" cy="8" r="3" stroke="currentColor" strokeWidth="1.8"/><path d="M2 20c0-4 12-4 12 0" stroke="currentColor" strokeWidth="1.8"/><path d="M10 20c0-3 10-3 10 0" stroke="currentColor" strokeWidth="1.8"/></svg>
    case 'heart':    return <svg {...props}><path d="M12 20s-7-4.5-7-9a4 4 0 017-2 4 4 0 017 2c0 4.5-7 9-7 9z" stroke="currentColor" strokeWidth="1.8"/></svg>
    case 'credit':   return <svg {...props}><rect x="3" y="6" width="18" height="12" rx="3" stroke="currentColor" strokeWidth="1.8"/><line x1="3" y1="10" x2="21" y2="10" stroke="currentColor" strokeWidth="1.8"/></svg>
    case 'box':      return <svg {...props}><path d="M12 2 3 7v10l9 5 9-5V7l-9-5z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/><path d="M3 7l9 5 9-5M12 12v10" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/></svg>
    case 'package':  return <svg {...props}><rect x="3" y="7" width="18" height="13" rx="2" stroke="currentColor" strokeWidth="1.8"/><path d="M3 11h18M9 7V4h6v3" stroke="currentColor" strokeWidth="1.8"/></svg>
    case 'globe':    return <svg {...props}><circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8"/><path d="M3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18" stroke="currentColor" strokeWidth="1.8"/></svg>
    case 'scissors': return <svg {...props}><circle cx="6" cy="6" r="2.5" stroke="currentColor" strokeWidth="1.8"/><circle cx="6" cy="18" r="2.5" stroke="currentColor" strokeWidth="1.8"/><path d="M8 8l12 8M8 16 20 8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>
    default:         return null
  }
}

export default function Ecosystem() {
  const sectionRef = useRef<HTMLElement | null>(null)

  useEffect(() => {
    const section = sectionRef.current
    if (!section) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          section.classList.add(styles.visible)
          observer.disconnect()
        }
      },
      { threshold: 0.15 }
    )
    observer.observe(section)
    return () => observer.disconnect()
  }, [])

  return (
    <section ref={sectionRef} className={styles.section}>
      <div className={styles.container}>
        <header className={styles.header}>
          <span className={styles.kicker}>Ecossistema eligi</span>
          <h2 className={styles.title}>
            Tudo o que seu negócio precisa, em um só lugar
          </h2>
          <p className={styles.subtitle}>
            Agenda, equipe, clientes, financeiro e link público conectados em uma
            experiência simples, fluida e inteligente.
          </p>
        </header>

        <div className={styles.grid}>
          {ITEMS.map(item => (
            <div key={item.title} className={`${styles.card} ${styles[item.color]}`}>
              <div className={styles.iconWrap}><Icon name={item.icon} /></div>
              <h3 className={styles.cardTitle}>{item.title}</h3>
              <p className={styles.cardDescription}>{item.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
