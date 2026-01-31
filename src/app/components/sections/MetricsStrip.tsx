'use client'

import { useEffect, useRef } from 'react'
import styles from './MetricsStrip.module.css'

function animateValue(
  el: HTMLElement,
  start: number,
  end: number,
  duration: number,
  suffix = ''
) {
  let startTime: number | null = null

  function step(timestamp: number) {
    if (!startTime) startTime = timestamp
    const progress = Math.min((timestamp - startTime) / duration, 1)
    const value = start + (end - start) * progress

    el.textContent =
      (end % 1 === 0
        ? Math.floor(value).toLocaleString('pt-BR')
        : value.toFixed(1)) + suffix

    if (progress < 1) {
      requestAnimationFrame(step)
    }
  }

  requestAnimationFrame(step)
}

export default function MetricsStrip() {
  const sectionRef = useRef<HTMLElement | null>(null)
  const animated = useRef(false)

  useEffect(() => {
    const section = sectionRef.current
    if (!section) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !animated.current) {
          animated.current = true

          animateValue(
            section.querySelector('[data-metric="agendamentos"]')!,
            0,
            3.5,
            900,
            'x'
          )

          animateValue(
            section.querySelector('[data-metric="faltas"]')!,
            0,
            80,
            900,
            '%'
          )

          animateValue(
            section.querySelector('[data-metric="gestao"]')!,
            0,
            5,
            900,
            'x'
          )

          animateValue(
            section.querySelector('[data-metric="confianca"]')!,
            0,
            100,
            1000,
            '+'
          )

          observer.disconnect()
        }
      },
      { threshold: 0.4 }
    )

    observer.observe(section)

    return () => observer.disconnect()
  }, [])

  return (
    <section ref={sectionRef} className={styles.strip}>
      <div className={styles.container}>
        <div className={styles.metric}>
          <strong data-metric="agendamentos">0x</strong>
          <span>mais agendamentos</span>
        </div>

        <div className={styles.metric}>
          <strong data-metric="faltas">0%</strong>
          <span>menos faltas</span>
        </div>

        <div className={styles.metric}>
          <strong data-metric="gestao">0x</strong>
          <span>menos tempo na gestão</span>
        </div>

        <div className={styles.metric}>
          <strong data-metric="confianca">0+</strong>
          <span>profissionais confiam no ELIGI</span>
        </div>
      </div>
    </section>
  )
}
