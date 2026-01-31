'use client'

import { useEffect, useRef } from 'react'
import styles from './Ecosystem.module.css'

const ITEMS = [
  {
    title: 'Agenda inteligente',
    description:
      'Agendamentos automáticos, controle de horários, prevenção de conflitos e visão clara do dia.',
    icon: 'calendar',
    color: 'blue',
  },
  {
    title: 'Gestão de equipe',
    description:
      'Controle de profissionais, comissões, desempenho e organização do time em um só lugar.',
    icon: 'users',
    color: 'green',
  },
  {
    title: 'Clientes & relacionamento',
    description:
      'Histórico, recorrência, lembretes e fidelização integrados à rotina do negócio.',
    icon: 'heart',
    color: 'red',
  },
  {
    title: 'Financeiro & pagamentos',
    description:
      'Faturamento, repasses, visão financeira clara e integração com meios de pagamento.',
    icon: 'credit',
    color: 'purple',
  },
  {
    title: 'Crescimento & anúncios',
    description:
      'Visibilidade para novos clientes e ferramentas para expandir sua presença.',
    icon: 'trend',
    color: 'orange',
  },
  {
    title: 'Plataforma conectada',
    description:
      'Tudo funciona junto: agenda, equipe, clientes e financeiro em um ecossistema único.',
    icon: 'layers',
    color: 'teal',
  },
]

function Icon({ name }: { name: string }) {
  switch (name) {
    case 'calendar':
      return (
        <svg viewBox="0 0 24 24" fill="none">
          <rect x="3" y="5" width="18" height="16" rx="3" stroke="currentColor" strokeWidth="1.8" />
          <line x1="3" y1="9" x2="21" y2="9" stroke="currentColor" strokeWidth="1.8" />
        </svg>
      )
    case 'users':
      return (
        <svg viewBox="0 0 24 24" fill="none">
          <circle cx="8" cy="8" r="3" stroke="currentColor" strokeWidth="1.8" />
          <circle cx="16" cy="8" r="3" stroke="currentColor" strokeWidth="1.8" />
          <path d="M2 20c0-4 12-4 12 0" stroke="currentColor" strokeWidth="1.8" />
          <path d="M10 20c0-3 10-3 10 0" stroke="currentColor" strokeWidth="1.8" />
        </svg>
      )
    case 'heart':
      return (
        <svg viewBox="0 0 24 24" fill="none">
          <path
            d="M12 20s-7-4.5-7-9a4 4 0 017-2 4 4 0 017 2c0 4.5-7 9-7 9z"
            stroke="currentColor"
            strokeWidth="1.8"
          />
        </svg>
      )
    case 'credit':
      return (
        <svg viewBox="0 0 24 24" fill="none">
          <rect x="3" y="6" width="18" height="12" rx="3" stroke="currentColor" strokeWidth="1.8" />
          <line x1="3" y1="10" x2="21" y2="10" stroke="currentColor" strokeWidth="1.8" />
        </svg>
      )
    case 'trend':
      return (
        <svg viewBox="0 0 24 24" fill="none">
          <path d="M3 17l6-6 4 4 7-7" stroke="currentColor" strokeWidth="1.8" />
          <path d="M14 2h7v7" stroke="currentColor" strokeWidth="1.8" />
        </svg>
      )
    case 'layers':
      return (
        <svg viewBox="0 0 24 24" fill="none">
          <polygon points="12 2 22 8 12 14 2 8 12 2" stroke="currentColor" strokeWidth="1.8" />
          <polygon points="12 10 22 16 12 22 2 16 12 10" stroke="currentColor" strokeWidth="1.8" />
        </svg>
      )
    default:
      return null
  }
}

export default function Ecosystem() {
  const sectionRef = useRef<HTMLElement | null>(null)

  useEffect(() => {
    const section = sectionRef.current
    if (!section) return

    section.classList.add(styles.visible)

    const carousel = section.querySelector(`.${styles.carousel}`) as HTMLElement
    const track = section.querySelector(`.${styles.track}`) as HTMLElement
    if (!carousel || !track) return

    let isDown = false
    let startX = 0
    let scrollLeft = 0

    const getX = (e: MouseEvent | TouchEvent) =>
      'touches' in e ? e.touches[0].pageX : e.pageX

    const onDown = (e: MouseEvent | TouchEvent) => {
      isDown = true
      track.style.animationPlayState = 'paused'
      startX = getX(e)
      scrollLeft = carousel.scrollLeft
    }

    const onMove = (e: MouseEvent | TouchEvent) => {
      if (!isDown) return
      const walk = getX(e) - startX
      carousel.scrollLeft = scrollLeft - walk
    }

    const onUp = () => {
      isDown = false
    }

    carousel.addEventListener('mousedown', onDown)
    carousel.addEventListener('mousemove', onMove)
    carousel.addEventListener('mouseup', onUp)
    carousel.addEventListener('mouseleave', onUp)

    carousel.addEventListener('touchstart', onDown, { passive: true })
    carousel.addEventListener('touchmove', onMove, { passive: true })
    carousel.addEventListener('touchend', onUp)

    return () => {
      carousel.removeEventListener('mousedown', onDown)
      carousel.removeEventListener('mousemove', onMove)
      carousel.removeEventListener('mouseup', onUp)
      carousel.removeEventListener('mouseleave', onUp)

      carousel.removeEventListener('touchstart', onDown)
      carousel.removeEventListener('touchmove', onMove)
      carousel.removeEventListener('touchend', onUp)
    }
  }, [])

  return (
    <section ref={sectionRef} className={styles.section}>
      <div className={styles.container}>
        <header className={styles.header}>
          <span className={styles.kicker}>ECOSSISTEMA ELIGI</span>
          <h2 className={styles.title}>
            Tudo o que seu negócio precisa,
            <br />
            em um só lugar
          </h2>
          <p className={styles.subtitle}>
            Inspirado nas melhores plataformas do mundo, o ELIGI conecta todas as
            áreas do seu negócio em uma experiência simples, fluida e
            inteligente.
          </p>
        </header>

        <div className={styles.carousel}>
          <div className={styles.track}>
            {[...ITEMS, ...ITEMS].map((item, index) => (
              <div
                key={`${item.title}-${index}`}
                className={`${styles.card} ${styles[item.color]}`}
              >
                <div className={styles.iconWrap}>
                  <Icon name={item.icon} />
                </div>

                <h3 className={styles.cardTitle}>{item.title}</h3>
                <p className={styles.cardDescription}>{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
