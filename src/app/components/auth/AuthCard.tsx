'use client'

import styles from './auth.module.css'

interface AuthCardProps {
  title: string
  subtitle?: string
  children: React.ReactNode
}

export function AuthCard({ title, subtitle, children }: AuthCardProps) {
  return (
    <div className={styles.wrapper}>
      <div className={styles.card}>
        {/* LOGO ELIGI */}
        <div className={styles.logoWrapper}>
          <img
            src="/images/globo-light.png"
            alt="Eligi"
            className={styles.logo}
            draggable={false}
          />
        </div>

        {/* TÍTULO */}
        <h1 className={styles.title}>{title}</h1>

        {/* SUBTÍTULO */}
        {subtitle && <p className={styles.subtitle}>{subtitle}</p>}

        {/* CONTEÚDO */}
        <div className={styles.content}>{children}</div>
      </div>
    </div>
  )
}
