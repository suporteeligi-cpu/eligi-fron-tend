'use client'

import { useEffect, useRef } from 'react'
import Image from 'next/image'
import styles from './AgendaSection.module.css'

export default function AgendaSection() {
  const sectionRef = useRef<HTMLElement | null>(null)

  useEffect(() => {
    const section = sectionRef.current
    if (!section) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          section.classList.add(styles.visible)
        }
      },
      { threshold: 0.25 }
    )

    observer.observe(section)

    return () => observer.disconnect()
  }, [])

  return (
    <section ref={sectionRef} className={styles.agenda}>
      <div className={styles.container}>
        {/* TEXTO (ESQUERDA) */}
        <div className={styles.content}>
          <div className={styles.badge}>
            {/* ÍCONE SVG – CALENDÁRIO */}
            <svg
              className={styles.icon}
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
            >
              <rect
                x="3"
                y="4"
                width="18"
                height="17"
                rx="3"
                stroke="currentColor"
                strokeWidth="1.8"
              />
              <line
                x1="3"
                y1="9"
                x2="21"
                y2="9"
                stroke="currentColor"
                strokeWidth="1.8"
              />
              <line
                x1="8"
                y1="2.5"
                x2="8"
                y2="6"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
              />
              <line
                x1="16"
                y1="2.5"
                x2="16"
                y2="6"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
              />
            </svg>

            <span>Agenda</span>
          </div>

          <h2 className={styles.title}>
            Chega de perder tempo com ligações e mensagens
          </h2>

          <p className={styles.text}>
            Seus clientes agendam sozinhos, a qualquer hora do dia.
            Enquanto isso, você acompanha sua agenda em tempo real,
            organiza sua rotina e trabalha com mais tranquilidade.
            <strong>
              {' '}
              Mais comodidade para eles, mais controle para você.
            </strong>
          </p>
        </div>

        {/* IMAGEM (DIREITA) */}
        <div className={styles.visual}>
          <Image
            src="/images/agenda-preview.png"
            alt="Agenda ELIGI"
            width={420}
            height={760}
            className={styles.image}
            priority
          />
        </div>
      </div>
    </section>
  )
}
