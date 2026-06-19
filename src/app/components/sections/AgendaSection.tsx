'use client'

import { useEffect, useRef } from 'react'
import Image from 'next/image'
import styles from './AgendaSection.module.css'

const BENEFITS = [
  'Agendamento online que cai direto na sua agenda',
  'Seu dia inteiro em tempo real, de qualquer lugar',
  'Arraste, remarque e bloqueie horários em segundos',
]

export default function AgendaSection() {
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
      { threshold: 0.2 }
    )
    observer.observe(section)
    return () => observer.disconnect()
  }, [])

  return (
    <section ref={sectionRef} className={styles.agenda}>
      <div className={styles.container}>
        <div className={styles.content}>
          <div className={styles.badge}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
              <rect x="3" y="4" width="18" height="17" rx="3" stroke="currentColor" strokeWidth="1.8" />
              <line x1="3" y1="9" x2="21" y2="9" stroke="currentColor" strokeWidth="1.8" />
              <line x1="8" y1="2.5" x2="8" y2="6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
              <line x1="16" y1="2.5" x2="16" y2="6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
            <span>Agenda</span>
          </div>

          <h2 className={styles.title}>
            Chega de perder tempo com<br />ligações e mensagens
          </h2>

          <p className={styles.text}>
            Seus clientes agendam sozinhos, a qualquer hora. Você acompanha o dia
            em tempo real, organiza a rotina e trabalha com mais tranquilidade —
            mais comodidade para eles, mais controle para você.
          </p>

          <ul className={styles.benefits}>
            {BENEFITS.map(b => (
              <li key={b}>
                <span className={styles.check}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" aria-hidden>
                    <path d="M5 12.5l4.5 4.5L19 7.5" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
                {b}
              </li>
            ))}
          </ul>

          <a href="#video" className={styles.cta}>Ver demonstração</a>
        </div>

        <div className={styles.visual}>
          <Image
            src="/images/agenda-phone.png"
            alt="Agenda do eligi no celular"
            width={830}
            height={1482}
            className={styles.image}
            priority
          />
        </div>
      </div>
    </section>
  )
}
