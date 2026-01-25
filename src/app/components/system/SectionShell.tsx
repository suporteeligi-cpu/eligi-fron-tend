// src/app/components/system/SectionShell.tsx
'use client'

import { ReactNode } from 'react'
import styles from './SectionShell.module.css'

interface SectionShellProps {
  children: ReactNode
  variant?: 'default' | 'soft' | 'elevated'
}

export default function SectionShell({
  children,
  variant = 'default'
}: SectionShellProps) {
  return (
    <section className={`${styles.section} ${styles[variant]}`}>
      <div className={styles.container}>{children}</div>
    </section>
  )
}
