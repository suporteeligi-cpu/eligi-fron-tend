'use client'

import Image from 'next/image'
import styles from './auth.module.css'

interface AuthCardProps {
  title: string
  subtitle?: string
  children: React.ReactNode
  loading?: boolean
  errorMessage?: string | null
  successMessage?: string | null
}

export function AuthCard({
  title,
  subtitle,
  children,
  loading = false,
  errorMessage,
  successMessage
}: AuthCardProps) {
  return (
    <div className={styles.wrapper}>
      <div
        className={`${styles.card} ${loading ? styles.loading : ''}`}
        aria-busy={loading}
      >
        {/* LOGO */}
        <div className={styles.logoWrapper}>
          <Image
            src="/images/globo-light.png"
            alt="Eligi"
            width={42}
            height={42}
            className={styles.logo}
            priority
          />
        </div>

        {/* TITLE */}
        <h1 className={styles.title}>{title}</h1>

        {/* SUBTITLE */}
        {subtitle && (
          <p className={styles.subtitle}>{subtitle}</p>
        )}

        {/* GLOBAL ERROR */}
        {errorMessage && (
          <div
            className={styles.errorBox}
            role="alert"
          >
            {errorMessage}
          </div>
        )}

        {/* GLOBAL SUCCESS */}
        {successMessage && (
          <div
            className={styles.successBox}
            role="status"
          >
            {successMessage}
          </div>
        )}

        {/* CONTENT */}
        <div className={styles.content}>
          {children}
        </div>

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
