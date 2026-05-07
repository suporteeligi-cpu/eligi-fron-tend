'use client'

import { useEffect, useRef } from 'react'
import styles from './DashboardMetricCard.module.css'

type Variant = 'green' | 'blue' | 'red' | 'purple'

interface DashboardMetricCardProps {
  label:   string
  value:   string
  meta:    string
  percent: string
  variant: Variant
}

const chartPaths: Record<Variant, string> = {
  green: 'M2 26 C12 20,22 28,32 22 S52 16,62 18 S82 24,92 14 S108 10,118 12',
  blue:  'M2 30 C14 18,26 20,38 24 S58 30,68 20 S88 12,98 18 S112 22,118 14',
  red:   'M2 22 C12 28,24 18,36 26 S56 34,66 22 S86 12,96 28 S110 20,118 24',
  purple:'M2 28 C14 24,26 16,38 18 S58 22,68 30 S88 34,98 20 S112 12,118 16',
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
    path.style.strokeDasharray  = `${length}`
    path.style.strokeDashoffset = `${length}`

    // Use rAF to avoid layout thrash and start animation after paint
    const id = requestAnimationFrame(() => {
      path.style.strokeDashoffset = '0'
    })
    return () => cancelAnimationFrame(id)
  }, [])

  return (
    <div className={`${styles.card} ${styles[variant]}`}>
      <span className={styles.label}>{label}</span>
      <div  className={styles.value}>{value}</div>
      <div  className={styles.meta}>{meta}</div>

      <svg
        viewBox="0 0 120 40"
        fill="none"
        className={styles.chart}
        aria-hidden
      >
        <path
          ref={pathRef}
          d={chartPaths[variant]}
          className={styles.line}
        />
      </svg>

      <span className={styles.percent}>{percent}</span>
    </div>
  )
}