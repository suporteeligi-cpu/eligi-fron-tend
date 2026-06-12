'use client'

import { useEffect, useRef } from 'react'
import styles from './PublicLinkSection.module.css'

const STEPS = [
  { n: '1', title: 'Cliente acessa seu link', text: 'Sem instalar app, direto pelo navegador.' },
  { n: '2', title: 'Escolhe serviço e horário', text: 'Vê seus profissionais e a disponibilidade real.' },
  { n: '3', title: 'Cai direto na sua agenda', text: 'O agendamento aparece na hora, sem conflito.' },
]

export default function PublicLinkSection() {
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
      { threshold: 0.2 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return (
    <section ref={sectionRef} className={styles.section}>
      <div className={styles.container}>
        <div className={styles.content}>
          <span className={styles.badge}>Link público de agendamento</span>
          <h2 className={styles.title}>
            Seus clientes agendam sozinhos,<br />24 horas por dia
          </h2>
          <p className={styles.text}>
            Cada negócio ganha um link exclusivo. Você compartilha no Instagram,
            no WhatsApp ou na bio — e recebe agendamentos mesmo com a loja fechada,
            sem ocupar o seu tempo respondendo mensagens.
          </p>
          <a href="#video" className={styles.cta}>Ver como funciona</a>
        </div>

        <div className={styles.visual}>
          <div className={styles.card}>
            <div className={styles.urlBar}>
              <span className={styles.lock} aria-hidden>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
                  <rect x="5" y="11" width="14" height="9" rx="2" stroke="currentColor" strokeWidth="1.8" />
                  <path d="M8 11V8a4 4 0 018 0v3" stroke="currentColor" strokeWidth="1.8" />
                </svg>
              </span>
              <span className={styles.url}>app.eligi.com.br/<strong>sua-barbearia</strong></span>
            </div>

            <ul className={styles.steps}>
              {STEPS.map(step => (
                <li key={step.n} className={styles.step}>
                  <span className={styles.stepNum}>{step.n}</span>
                  <span className={styles.stepBody}>
                    <strong>{step.title}</strong>
                    <small>{step.text}</small>
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  )
}
