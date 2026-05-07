'use client'

import Image from 'next/image'
import { useEffect, useRef, useState } from 'react'
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
  successMessage,
}: AuthCardProps) {
  // Shake animation when a new error arrives
  const [shaking, setShaking]     = useState(false)
  const prevError                  = useRef<string | null | undefined>(null)

  useEffect(() => {
    if (errorMessage && errorMessage !== prevError.current) {
      prevError.current = errorMessage
      // Defer setState to avoid synchronous call inside effect body
      const t1 = setTimeout(() => setShaking(true), 0)
      const t2 = setTimeout(() => setShaking(false), 400)
      return () => { clearTimeout(t1); clearTimeout(t2) }
    }
  }, [errorMessage])

  const cardClass = [
    styles.card,
    loading  ? styles.loading : '',
    shaking  ? styles.shake   : '',
  ].filter(Boolean).join(' ')

  return (
    <div className={styles.wrapper}>
      <div className={cardClass} aria-busy={loading}>

        {/* Logo */}
        <div className={styles.logoWrapper}>
          <Image
            src="/images/globo-light.png"
            alt="Eligi"
            width={44}
            height={44}
            className={styles.logo}
            priority
            style={{ height: 'auto' }}
          />
        </div>

        {/* Title */}
        <h1 className={styles.title}>{title}</h1>

        {/* Subtitle */}
        {subtitle && (
          <p className={styles.subtitle}>{subtitle}</p>
        )}

        {/* Error */}
        {errorMessage && (
          <div className={styles.errorBox} role="alert" aria-live="assertive">
            {errorMessage}
          </div>
        )}

        {/* Success */}
        {successMessage && (
          <div className={styles.successBox} role="status" aria-live="polite">
            {successMessage}
          </div>
        )}

        {/* Content */}
        <div className={styles.content}>
          {children}
        </div>

        {/* Loading overlay */}
        {loading && (
          <div className={styles.loadingOverlay} aria-hidden>
            <div className={styles.spinner} />
          </div>
        )}
      </div>
    </div>
  )
}