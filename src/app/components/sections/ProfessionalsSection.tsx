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
    let lastX = 0
    let velocity = 0
    let raf: number

    const cards = Array.from(track.children) as HTMLElement[]
    const cardWidth = cards[0].offsetWidth + 32

    const update = () => {
      const center = track.scrollLeft + track.offsetWidth / 2

      cards.forEach(card => {
        const cardCenter = card.offsetLeft + card.offsetWidth / 2
        const distance = center - cardCenter
        const abs = Math.abs(distance)

        const max = track.offsetWidth / 2
        const ratio = Math.min(abs / max, 1)

        const scale = 1 - ratio * 0.25
        const opacity = 1 - ratio * 0.6
        const z = -ratio * 120

        card.style.transform = `
          translateX(${distance * -0.04}px)
          scale(${scale})
          translateZ(${z}px)
        `
        card.style.opacity = `${opacity}`
        card.style.zIndex = `${100 - Math.floor(ratio * 100)}`
      })

      // LOOP INFINITO
      if (track.scrollLeft <= cardWidth) {
        track.scrollLeft += cardWidth * images.length
      } else if (
        track.scrollLeft >=
        cardWidth * (images.length * 2)
      ) {
        track.scrollLeft -= cardWidth * images.length
      }
    }

    const momentum = () => {
      track.scrollLeft += velocity
      velocity *= 0.94
      update()
      if (Math.abs(velocity) > 0.1) {
        raf = requestAnimationFrame(momentum)
      }
    }

    const start = (x: number) => {
      isDown = true
      lastX = x
      velocity = 0
      cancelAnimationFrame(raf)
      track.classList.add(styles.grabbing)
    }

    const move = (x: number) => {
      if (!isDown) return
      const delta = lastX - x
      track.scrollLeft += delta
      velocity = delta
      lastX = x
      update()
    }

    const end = () => {
      isDown = false
      track.classList.remove(styles.grabbing)
      raf = requestAnimationFrame(momentum)
    }

    track.addEventListener('mousedown', e => start(e.pageX))
    track.addEventListener('mousemove', e => move(e.pageX))
    track.addEventListener('mouseup', end)
    track.addEventListener('mouseleave', end)

    track.addEventListener('touchstart', e =>
      start(e.touches[0].pageX)
    )
    track.addEventListener('touchmove', e =>
      move(e.touches[0].pageX)
    )
    track.addEventListener('touchend', end)

    track.scrollLeft = cardWidth * images.length
    update()

    return () => cancelAnimationFrame(raf)
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
          <div ref={trackRef} className={styles.carousel}>
            {[...images, ...images, ...images].map((src, i) => (
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
