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
  const carouselRef = useRef<HTMLDivElement | null>(null)

  /* reveal */
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

  /* carrossel infinito + drag */
  useEffect(() => {
    const carousel = carouselRef.current
    if (!carousel) return

    let isDown = false
    let startX = 0
    let scrollLeft = 0

    const pause = () =>
      carousel.style.animationPlayState = 'paused'
    const play = () =>
      carousel.style.animationPlayState = 'running'

    const getX = (e: MouseEvent | TouchEvent) =>
      'touches' in e ? e.touches[0].pageX : e.pageX

    const down = (e: MouseEvent | TouchEvent) => {
      isDown = true
      pause()
      startX = getX(e)
      scrollLeft = carousel.scrollLeft
      carousel.classList.add(styles.grabbing)
    }

    const move = (e: MouseEvent | TouchEvent) => {
      if (!isDown) return
      const x = getX(e)
      const walk = startX - x
      carousel.scrollLeft = scrollLeft + walk
    }

    const up = () => {
      isDown = false
      carousel.classList.remove(styles.grabbing)
    }

    carousel.addEventListener('mousedown', down)
    carousel.addEventListener('mousemove', move)
    carousel.addEventListener('mouseup', up)
    carousel.addEventListener('mouseleave', up)

    carousel.addEventListener('touchstart', down, { passive: true })
    carousel.addEventListener('touchmove', move, { passive: true })
    carousel.addEventListener('touchend', up)

    carousel.addEventListener('mouseenter', pause)
    carousel.addEventListener('mouseleave', play)

    return () => {
      carousel.removeEventListener('mousedown', down)
      carousel.removeEventListener('mousemove', move)
      carousel.removeEventListener('mouseup', up)
      carousel.removeEventListener('mouseleave', up)

      carousel.removeEventListener('touchstart', down)
      carousel.removeEventListener('touchmove', move)
      carousel.removeEventListener('touchend', up)

      carousel.removeEventListener('mouseenter', pause)
      carousel.removeEventListener('mouseleave', play)
    }
  }, [])

  return (
    <section ref={sectionRef} className={styles.section}>
      <div className={styles.container}>
        <div className={styles.content}>
          <div className={styles.badge}>Profissionais</div>

          <h2 className={styles.title}>
            Profissionais realizados,
            <br />
            clientes encantados.
          </h2>

          <p className={styles.text}>
            Agendamento inteligente, experiência fluida e controle total da
            agenda.
          </p>
        </div>

        <div className={styles.visual}>
          <div ref={carouselRef} className={styles.carousel}>
            {[...images, ...images].map((src, i) => (
              <div key={i} className={styles.card}>
                <Image
                  src={src}
                  alt="Profissional"
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
