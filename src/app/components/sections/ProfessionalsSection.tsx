'use client'

import { useEffect, useRef } from 'react'
import Image from 'next/image'
import styles from './ProfessionalsSection.module.css'

const images = [
  '/images/professional-1.jpg',
  '/images/professional-2.png',
  '/images/professional-3.png',
  '/images/professional-4.png',
  '/images/professional-5.png'
]

export default function ProfessionalsSection() {
  const sectionRef = useRef<HTMLElement | null>(null)
  const trackRef = useRef<HTMLDivElement | null>(null)

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

  useEffect(() => {
    const track = trackRef.current
    if (!track) return

    let isDown = false
    let startX = 0
    let scrollLeft = 0

    const updateActive = () => {
      const cards = Array.from(track.children) as HTMLElement[]
      const center = track.scrollLeft + track.offsetWidth / 2

      cards.forEach(card => {
        const cardCenter =
          card.offsetLeft + card.offsetWidth / 2
        const distance = Math.abs(center - cardCenter)

        card.classList.remove(styles.active, styles.side)

        if (distance < card.offsetWidth * 0.6) {
          card.classList.add(styles.active)
        } else {
          card.classList.add(styles.side)
        }
      })
    }

    const start = (x: number) => {
      isDown = true
      startX = x
      scrollLeft = track.scrollLeft
      track.classList.add(styles.grabbing)
    }

    const move = (x: number) => {
      if (!isDown) return
      const walk = (startX - x) * 1.15
      track.scrollLeft = scrollLeft + walk
      updateActive()
    }

    const end = () => {
      isDown = false
      track.classList.remove(styles.grabbing)
    }

    track.addEventListener('scroll', updateActive)

    track.addEventListener('mousedown', e => start(e.pageX))
    track.addEventListener('mousemove', e => move(e.pageX))
    track.addEventListener('mouseup', end)
    track.addEventListener('mouseleave', end)

    track.addEventListener('touchstart', e => start(e.touches[0].pageX))
    track.addEventListener('touchmove', e => move(e.touches[0].pageX))
    track.addEventListener('touchend', end)

    updateActive()

    return () => {
      track.removeEventListener('scroll', updateActive)
    }
  }, [])

  return (
    <section ref={sectionRef} className={styles.section}>
      <div className={styles.container}>
        {/* TEXTO */}
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
                d="M4 20 C4 15, 20 15, 20 20"
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

        {/* ROLETINHA PREMIUM */}
        <div className={styles.visual}>
          <div ref={trackRef} className={styles.carousel}>
            {[...images, ...images].map((src, index) => (
              <div key={index} className={styles.card}>
                <Image
                  src={src}
                  alt="Profissional ELIGI"
                  width={420}
                  height={760}
                  className={styles.image}
                  draggable={false}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
