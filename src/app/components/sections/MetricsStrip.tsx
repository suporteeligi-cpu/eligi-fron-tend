'use client'

import { useEffect, useRef } from 'react'
import styles from './MetricsStrip.module.css'

interface Metric {
  key:    string
  end:    number
  suffix: string
  label:  string
}

const METRICS: Metric[] = [
  { key: 'agendamentos', end: 3.5, suffix: 'x', label: 'mais agendamentos'            },
  { key: 'faltas',       end: 80,  suffix: '%', label: 'menos faltas'                 },
  { key: 'gestao',       end: 5,   suffix: 'x', label: 'menos tempo na gestão'        },
  { key: 'confianca',    end: 100, suffix: '+', label: 'profissionais confiam no eligi'},
]

function animateValue(el: HTMLElement, end: number, duration: number, suffix: string) {
  const isDecimal = end % 1 !== 0
  let startTime: number | null = null

  function step(timestamp: number) {
    if (!startTime) startTime = timestamp
    const progress = Math.min((timestamp - startTime) / duration, 1)
    const value    = end * progress
    el.textContent = (isDecimal ? value.toFixed(1) : Math.floor(value).toLocaleString('pt-BR')) + suffix
    if (progress < 1) requestAnimationFrame(step)
  }

  requestAnimationFrame(step)
}

export default function MetricsStrip() {
  const sectionRef = useRef<HTMLElement | null>(null)
  const animated   = useRef(false)

  useEffect(() => {
    const section = sectionRef.current
    if (!section) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !animated.current) {
          animated.current = true
          section.classList.add(styles.visible)

          METRICS.forEach(({ key, end, suffix }) => {
            const el = section.querySelector<HTMLElement>(`[data-metric="${key}"]`)
            if (el) animateValue(el, end, 1000, suffix)
          })

          observer.disconnect()
        }
      },
      { threshold: 0.35 }
    )

    observer.observe(section)
    return () => observer.disconnect()
  }, [])

  return (
    <section ref={sectionRef} className={styles.strip}>
      <div className={styles.container}>
        {METRICS.map(({ key, suffix, label }) => (
          <div key={key} className={styles.metric}>
            <strong data-metric={key}>0{suffix}</strong>
            <span>{label}</span>
          </div>
        ))}
      </div>
    </section>
  )
}