'use client'

import { useEffect, useRef } from 'react'
import styles from './VideoSection.module.css'

const YOUTUBE_ID = 'GiDvjJwu5mk'

export default function VideoSection() {
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
    <section id="video" ref={sectionRef} className={styles.section}>
      <div className={styles.container}>
        <header className={styles.header}>
          <span className={styles.kicker}>Demonstração</span>
          <h2 className={styles.title}>Veja o eligi em ação</h2>
        </header>

        <div className={styles.frame}>
          <iframe
            className={styles.iframe}
            src={`https://www.youtube.com/embed/${YOUTUBE_ID}?rel=0`}
            title="Demonstração eligi"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            loading="lazy"
          />
        </div>
      </div>
    </section>
  )
}
