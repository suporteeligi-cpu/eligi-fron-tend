'use client'

import { useState } from 'react'
import styles from './FAQSection.module.css'

const faqs = [
  {
    question: 'Qual valor mensal do aplicativo?',
    answer: (
      <>
        A mensalidade do <strong>ELIGI</strong> é <strong>R$ 89,90</strong>.
        <br />
        É cobrado <strong>R$ 10,00</strong> por membro adicional.
        <br />
        <br />
        Não há fidelidade atrelada ao app: você pode cancelar quando quiser,
        sem multas.
      </>
    ),
  },
  {
    question: 'Preciso de conhecimento técnico para usar o ELIGI?',
    answer: (
      <>
        Não. O ELIGI foi desenvolvido para ser simples, intuitivo e rápido,
        mesmo para quem nunca usou um sistema.
        <br />
        <br />
        Em poucos minutos você consegue organizar agenda, clientes e
        pagamentos.
      </>
    ),
  },
  {
    question: 'O ELIGI funciona para quais tipos de negócio?',
    answer: (
      <>
        O ELIGI atende barbearias, salões de beleza, estúdios, profissionais
        autônomos e estabelecimentos que precisam de agendamento, controle
        financeiro e gestão completa em um só lugar.
      </>
    ),
  },
  {
    question: 'O sistema substitui o WhatsApp para agendamentos?',
    answer: (
      <>
        Sim. Com o agendamento on-line automático, o ELIGI reduz drasticamente
        o volume de mensagens no WhatsApp, economizando tempo e evitando erros
        de marcação.
      </>
    ),
  },
]

export default function FAQSection() {
  const [activeIndex, setActiveIndex] = useState<number | null>(0)

  function toggle(index: number) {
    setActiveIndex(prev => (prev === index ? null : index))
  }

  return (
    <section className={styles.section}>
      <div className={styles.container}>
        <header className={styles.header}>
          <h2 className={styles.title}>
            Perguntas <strong>Frequentes</strong>
          </h2>
        </header>

        <div className={styles.list}>
          {faqs.map((faq, index) => {
            const isOpen = activeIndex === index

            return (
              <div
                key={index}
                className={`${styles.item} ${
                  isOpen ? styles.open : ''
                }`}
              >
                <button
                  className={styles.question}
                  onClick={() => toggle(index)}
                >
                  <span>{faq.question}</span>
                  <span className={styles.icon}>
                    {isOpen ? '−' : '+'}
                  </span>
                </button>

                <div className={styles.answer}>
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
