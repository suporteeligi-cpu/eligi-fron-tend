'use client'

import { useState } from 'react'
import styles from './FAQSection.module.css'

const FAQS = [
  {
    question: 'Qual valor mensal do aplicativo?',
    answer: <>A mensalidade do <strong>eligi</strong> é <strong>R$ 89,90</strong>. É cobrado <strong>R$ 10,00</strong> por membro adicional. Não há fidelidade: cancele quando quiser, sem multas.</>,
  },
  {
    question: 'Preciso de conhecimento técnico para usar o eligi?',
    answer: <>Não. O eligi foi desenvolvido para ser simples, intuitivo e rápido, mesmo para quem nunca usou um sistema. Em poucos minutos você organiza agenda, clientes e pagamentos.</>,
  },
  {
    question: 'O eligi funciona para quais tipos de negócio?',
    answer: <>O eligi atende barbearias, salões de beleza, estúdios, profissionais autônomos e estabelecimentos que precisam de agendamento, controle financeiro e gestão completa.</>,
  },
  {
    question: 'O sistema substitui o WhatsApp para agendamentos?',
    answer: <>Sim. Com o agendamento online automático, o eligi reduz drasticamente o volume de mensagens no WhatsApp, economizando tempo e evitando erros de marcação.</>,
  },
]

export default function FAQSection() {
  const [activeIndex, setActiveIndex] = useState<number | null>(0)

  function toggle(index: number) {
    setActiveIndex(prev => prev === index ? null : index)
  }

  return (
    <section className={styles.section}>
      <div className={styles.container}>
        <header className={styles.header}>
          <h2 className={styles.title}>
            Perguntas <strong>Frequentes</strong>
          </h2>
        </header>

        <div className={styles.list} role="list">
          {FAQS.map((faq, index) => {
            const isOpen = activeIndex === index
            return (
              <div
                key={index}
                className={`${styles.item}${isOpen ? ` ${styles.open}` : ''}`}
                role="listitem"
              >
                <button
                  className={styles.question}
                  onClick={() => toggle(index)}
                  aria-expanded={isOpen}
                >
                  <span>{faq.question}</span>
                  <span className={styles.icon} aria-hidden>+</span>
                </button>

                <div className={styles.answer} aria-hidden={!isOpen}>
                  <p>{faq.answer}</p>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}