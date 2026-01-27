'use client'

import { useEffect, useRef } from 'react'
import styles from './TrendChart.module.css'

export default function TrendChart() {
  const pathRef = useRef<SVGPathElement | null>(null)

  useEffect(() => {
    const path = pathRef.current
    if (!path) return

    const length = path.getTotalLength()

    path.style.strokeDasharray = `${length}`
    path.style.strokeDashoffset = `${length}`

    requestAnimationFrame(() => {
      path.style.strokeDashoffset = '0'
    })
  }, [])

  return (
    <div className={styles.card}>
      {/* HEADER */}
      <div className={styles.header}>
        <span className={styles.label}>AGENDAMENTOS</span>
      </div>

      {/* BODY */}
      <div className={styles.body}>
        <div className={styles.value}>104</div>
        <div className={styles.sub}>Este mês</div>
      </div>

      {/* CHART */}
      <div className={styles.chart}>
        <svg
          viewBox="0 0 200 80"
          fill="none"
          className={styles.chartSvg}
          aria-hidden="true"
        >
          <path
            ref={pathRef}
            d="M5 60
               C25 40, 45 45, 65 35
               S105 25, 125 30
               S165 20, 195 10"
            className={styles.line}
          />
        </svg>
      </div>

      {/* FOOTER */}
      <div className={styles.footer}>
        <span className={styles.percent}>+14,88%</span>
      </div>
    </div>
  )
}
