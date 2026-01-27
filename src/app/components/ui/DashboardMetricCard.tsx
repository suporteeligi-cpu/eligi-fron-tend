'use client'

import { useEffect, useRef } from 'react'
import styles from './DashboardMetricCard.module.css'

type Variant = 'green' | 'blue' | 'red' | 'purple'

interface DashboardMetricCardProps {
  label: string
  value: string
  meta: string
  percent: string
  variant: Variant
}

export default function DashboardMetricCard({
  label,
  value,
  meta,
  percent,
  variant,
}: DashboardMetricCardProps) {
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
    <div className={`${styles.card} ${styles[variant]}`}>
      <span className={styles.label}>{label}</span>

      <div className={styles.value}>{value}</div>
      <div className={styles.meta}>{meta}</div>

      <svg
        viewBox="0 0 120 40"
        fill="none"
        className={styles.chart}
        aria-hidden
      >
        <path
          ref={pathRef}
          d="M2 30
             C15 20, 30 22, 45 18
             S75 14, 95 10
             S110 8, 118 6"
          className={styles.line}
        />
      </svg>

      <span className={styles.percent}>{percent}</span>
    </div>
  )
}
