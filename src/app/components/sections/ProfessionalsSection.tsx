'use client'

import { useEffect, useRef } from 'react'
import Image from 'next/image'
import styles from './ProfessionalsSection.module.css'

export default function ProfessionalsSection() {
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
    <section ref={sectionRef} className={styles.section}>
      <div className={styles.container}>
        {/* TEXTO (ESQUERDA) */}
        <div className={styles.content}>
          <div className={styles.badge}>
            <svg
              className={styles.icon}
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
            >
              <circle
                cx="12"
                cy="8"
                r="4"
                stroke="currentColor"
                strokeWidth="1.8"
              />
              <path
                d="M4 20
                   C4 15, 20 15, 20 20"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
              />
            </svg>

            <span>Profissionais</span>
          </div>

          <h2 className={styles.title}>
            Profissionais realizados,
            <br />
            clientes encantados.
          </h2>

          <p className={styles.text}>
            Com o agendamento inteligente do Eligi, seu cliente reserva um
            horário em segundos e você ganha total controle da sua agenda.
            <strong> Praticidade que gera satisfação.</strong>
          </p>
        </div>

        {/* IMAGEM (DIREITA) */}
        <div className={styles.visual}>
          <Image
            src="/images/professionals-preview.jpg"
            alt="Profissionais ELIGI"
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
