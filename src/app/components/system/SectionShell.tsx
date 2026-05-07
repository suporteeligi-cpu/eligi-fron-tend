import { ReactNode } from 'react'
import styles from './SectionShell.module.css'

type Variant = 'default' | 'soft' | 'elevated'

interface SectionShellProps {
  children:  ReactNode
  variant?:  Variant
  id?:       string
  className?: string
}

export default function SectionShell({
  children,
  variant   = 'default',
  id,
  className,
}: SectionShellProps) {
  return (
    <section
      id={id}
      className={[styles.section, styles[variant], className].filter(Boolean).join(' ')}
    >
      <div className={styles.container}>
        {children}
      </div>
    </section>
  )
}