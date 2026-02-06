'use client'

import Image from 'next/image'
import styles from './auth.module.css'

interface AuthCardProps {
  title: string
  subtitle?: string
  children: React.ReactNode
  loading?: boolean
}

export function AuthCard({
  title,
  subtitle,
  children,
  loading = false
}: AuthCardProps) {
  return (
    <div className={styles.wrapper}>
      <div
        className={`${styles.card} ${loading ? styles.loading : ''}`}
        aria-busy={loading}
      >
        {/* LOGO ELIGI */}
        <div className={styles.logoWrapper}>
          <Image
            src="/images/eligi.png"
            alt="Eligi"
            width={42}
            height={42}
            className={styles.logo}
            priority
          />
        </div>

        {/* TÍTULO */}
        <h1 className={styles.title}>{title}</h1>

        {/* SUBTÍTULO */}
        {subtitle && <p className={styles.subtitle}>{subtitle}</p>}

        {/* CONTEÚDO */}
        <div className={styles.content}>{children}</div>

        {/* LOADING OVERLAY */}
        {loading && (
          <div className={styles.loadingOverlay}>
            <div className={styles.spinner} />
          </div>
        )}
      </div>
    </div>
  )
}
