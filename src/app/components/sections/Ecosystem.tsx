'use client'

import { useEffect, useRef } from 'react'
import styles from './Ecosystem.module.css'

const ITEMS = [
  { title: 'Agenda inteligente',      description: 'Agendamentos automáticos, controle de horários, prevenção de conflitos e visão clara do dia.',                                        icon: 'calendar', color: 'blue'   },
  { title: 'Gestão de equipe',        description: 'Controle de profissionais, comissões, desempenho e organização do time em um só lugar.',                                              icon: 'users',    color: 'green'  },
  { title: 'Clientes & fidelização',  description: 'Histórico, recorrência, lembretes e fidelização integrados à rotina do negócio.',                                                    icon: 'heart',    color: 'red'    },
  { title: 'Financeiro & pagamentos', description: 'Faturamento, repasses, visão financeira clara e integração com meios de pagamento.',                                                  icon: 'credit',   color: 'purple' },
  { title: 'Crescimento & anúncios',  description: 'Visibilidade para novos clientes e ferramentas para expandir sua presença digital.',                                                  icon: 'trend',    color: 'orange' },
  { title: 'Plataforma conectada',    description: 'Tudo funciona junto: agenda, equipe, clientes e financeiro em um ecossistema único.',                                                 icon: 'layers',   color: 'teal'   },
]

function Icon({ name }: { name: string }) {
  const props = { viewBox: '0 0 24 24', fill: 'none', 'aria-hidden': true as const }
  switch (name) {
    case 'calendar': return <svg {...props}><rect x="3" y="5" width="18" height="16" rx="3" stroke="currentColor" strokeWidth="1.8"/><line x1="3" y1="9" x2="21" y2="9" stroke="currentColor" strokeWidth="1.8"/></svg>
    case 'users':    return <svg {...props}><circle cx="8" cy="8" r="3" stroke="currentColor" strokeWidth="1.8"/><circle cx="16" cy="8" r="3" stroke="currentColor" strokeWidth="1.8"/><path d="M2 20c0-4 12-4 12 0" stroke="currentColor" strokeWidth="1.8"/><path d="M10 20c0-3 10-3 10 0" stroke="currentColor" strokeWidth="1.8"/></svg>
    case 'heart':    return <svg {...props}><path d="M12 20s-7-4.5-7-9a4 4 0 017-2 4 4 0 017 2c0 4.5-7 9-7 9z" stroke="currentColor" strokeWidth="1.8"/></svg>
    case 'credit':   return <svg {...props}><rect x="3" y="6" width="18" height="12" rx="3" stroke="currentColor" strokeWidth="1.8"/><line x1="3" y1="10" x2="21" y2="10" stroke="currentColor" strokeWidth="1.8"/></svg>
    case 'trend':    return <svg {...props}><path d="M3 17l6-6 4 4 7-7" stroke="currentColor" strokeWidth="1.8"/><path d="M14 2h7v7" stroke="currentColor" strokeWidth="1.8"/></svg>
    case 'layers':   return <svg {...props}><polygon points="12 2 22 8 12 14 2 8 12 2" stroke="currentColor" strokeWidth="1.8"/><polygon points="12 10 22 16 12 22 2 16 12 10" stroke="currentColor" strokeWidth="1.8"/></svg>
    default:         return null
  }
}

export default function Ecosystem() {
  const sectionRef  = useRef<HTMLElement | null>(null)
  const carouselRef = useRef<HTMLDivElement | null>(null)
  const trackRef    = useRef<HTMLDivElement | null>(null)

  // Reveal
  useEffect(() => {
    const section = sectionRef.current
    if (!section) return
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { section.classList.add(styles.visible); observer.disconnect() } },
      { threshold: 0.15 }
    )
    observer.observe(section)
    return () => observer.disconnect()
  }, [])

  // Drag scroll
  useEffect(() => {
    const carousel = carouselRef.current
    const track    = trackRef.current
    if (!carousel || !track) return

    let isDown = false, startX = 0, scrollLeft = 0

    const getX = (e: MouseEvent | TouchEvent) => 'touches' in e ? e.touches[0].pageX : e.pageX

    const onDown = (e: MouseEvent | TouchEvent) => {
      isDown = true
      track.style.animationPlayState = 'paused'
      startX = getX(e)
      scrollLeft = carousel.scrollLeft
    }
    const onMove = (e: MouseEvent | TouchEvent) => {
      if (!isDown) return
      carousel.scrollLeft = scrollLeft - (getX(e) - startX)
    }
    const onUp = () => { isDown = false }

    carousel.addEventListener('mousedown',  onDown)
    carousel.addEventListener('mousemove',  onMove)
    carousel.addEventListener('mouseup',    onUp)
    carousel.addEventListener('mouseleave', onUp)
    carousel.addEventListener('touchstart', onDown, { passive: true })
    carousel.addEventListener('touchmove',  onMove, { passive: true })
    carousel.addEventListener('touchend',   onUp)

    return () => {
      carousel.removeEventListener('mousedown',  onDown)
      carousel.removeEventListener('mousemove',  onMove)
      carousel.removeEventListener('mouseup',    onUp)
      carousel.removeEventListener('mouseleave', onUp)
      carousel.removeEventListener('touchstart', onDown)
      carousel.removeEventListener('touchmove',  onMove)
      carousel.removeEventListener('touchend',   onUp)
    }
  }, [])

  return (
    <section ref={sectionRef} className={styles.section}>
      <div className={styles.container}>
        <header className={styles.header}>
          <span className={styles.kicker}>Ecossistema eligi</span>
          <h2 className={styles.title}>
            Tudo o que seu negócio precisa,<br />em um só lugar
          </h2>
          <p className={styles.subtitle}>
            Inspirado nas melhores plataformas do mundo, o eligi conecta todas as
            áreas do seu negócio em uma experiência simples, fluida e inteligente.
          </p>
        </header>

        <div ref={carouselRef} className={styles.carousel}>
          <div ref={trackRef} className={styles.track}>
            {[...ITEMS, ...ITEMS].map((item, i) => (
              <div key={`${item.title}-${i}`} className={`${styles.card} ${styles[item.color]}`}>
                <div className={styles.iconWrap}><Icon name={item.icon} /></div>
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