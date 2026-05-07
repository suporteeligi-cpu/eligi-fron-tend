'use client'

import { useEffect, useRef } from 'react'
import styles from './TrendChart.module.css'

type Variant = 'green' | 'red' | 'blue' | 'purple'

interface TrendChartProps {
  label?:   string
  value?:   string | number
  sub?:     string
  percent?: string
  variant?: Variant
  path?:    string
}

const DEFAULT_PATH =
  'M5 60 C25 40,45 45,65 35 S105 25,125 30 S165 20,195 10'

export default function TrendChart({
  label   = 'Agendamentos',
  value   = '104',
  sub     = 'Este mês',
  percent = '+14,88%',
  variant = 'green',
  path    = DEFAULT_PATH,
}: TrendChartProps) {
  const pathRef = useRef<SVGPathElement | null>(null)

  useEffect(() => {
    const el = pathRef.current
    if (!el) return

    const length = el.getTotalLength()
    el.style.strokeDasharray  = `${length}`
    el.style.strokeDashoffset = `${length}`

    const id = requestAnimationFrame(() => {
      el.style.strokeDashoffset = '0'
    })
    return () => cancelAnimationFrame(id)
  }, [])

  return (
    <div className={`${styles.card} ${styles[variant]}`}>
      <div className={styles.header}>
        <span className={styles.label}>{label}</span>
      </div>

      <div className={styles.body}>
        <div className={styles.value}>{value}</div>
        <div className={styles.sub}>{sub}</div>
      </div>

      <div className={styles.chart}>
        <svg
          viewBox="0 0 200 80"
          fill="none"
          className={styles.chartSvg}
          aria-hidden
        >
          <path
            ref={pathRef}
            d={path}
            className={styles.line}
          />
        </svg>
      </div>

      <div className={styles.footer}>
        <span className={styles.percent}>{percent}</span>
      </div>
    </div>
  )
}