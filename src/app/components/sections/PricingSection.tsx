'use client'

import { useEffect, useRef } from 'react'
import styles from './PricingSection.module.css'

const WHATSAPP = 'https://wa.me/5511918579495'

const AUTONOMO_FEATURES = [
  'Agendamento online em tempo real',
  'Link público de agendamento para clientes',
  'Controle de disponibilidade de horários',
  'Cadastro e gestão de clientes',
  'Histórico completo de atendimentos',
  'Gestão de serviços com duração configurável',
  'Prevenção automática de conflitos de horário',
  'Agenda diária, semanal e mensal',
  'Operação 100% digital',
]

const ESTABELECIMENTO_FEATURES = [
  'Todos os recursos do plano Autônomo',
  'Gestão de múltiplos profissionais',
  'Agenda individual por profissional',
  'Acesso individual para cada colaborador',
  'Controle de atendimentos por profissional',
  'Visão geral da operação do negócio',
  'Padronização do fluxo de agendamentos',
]

export default function PricingSection() {
  const sectionRef = useRef<HTMLElement | null>(null)

  useEffect(() => {
    const el = sectionRef.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.classList.add(styles.visible)
          observer.disconnect()
        }
      },
      { threshold: 0.15 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return (
    <section ref={sectionRef} className={styles.section}>
      <div className={styles.container}>
        <header className={styles.header}>
          <span className={styles.badge}>Preços</span>
          <h2 className={styles.title}>Planos que cabem<br />no seu bolso</h2>
          <p className={styles.subtitle}>Comece com 7 dias grátis. Sem cartão de crédito.</p>
        </header>

        <div className={styles.grid}>
          {/* Autônomo */}
          <div className={styles.card}>
            <span className={styles.tag}>Popular</span>
            <h3 className={styles.plan}>Autônomo</h3>
            <p className={styles.description}>Ideal para profissionais que trabalham sozinhos</p>
            <div className={styles.price}>
              <span className={styles.currency}>R$</span>
              <strong>59,90</strong>
              <span className={styles.period}>/mês</span>
            </div>
            <ul className={styles.features}>
              {AUTONOMO_FEATURES.map(f => <li key={f}>{f}</li>)}
            </ul>
            <a href={WHATSAPP} target="_blank" rel="noopener noreferrer" className={styles.buttonOutline}>
              Começar teste grátis
            </a>
          </div>

          {/* Estabelecimento */}
          <div className={`${styles.card} ${styles.highlight}`}>
            <span className={styles.tagPrimary}>Melhor custo-benefício</span>
            <h3 className={styles.plan}>Estabelecimento</h3>
            <div className={styles.price}>
              <span className={styles.currency}>R$</span>
              <strong>99,90</strong>
              <span className={styles.period}>/mês</span>
            </div>
            <span className={styles.addon}>+ R$ 19,90 por profissional adicional (apartir do 3º)</span>
            <ul className={styles.features}>
              {ESTABELECIMENTO_FEATURES.map(f => <li key={f}>{f}</li>)}
            </ul>
            <a href={WHATSAPP} target="_blank" rel="noopener noreferrer" className={styles.buttonPrimary}>
              Começar teste grátis
            </a>
          </div>
        </div>
      </div>
    </section>
  )
}
