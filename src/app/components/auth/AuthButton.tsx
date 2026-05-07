'use client'

import React from 'react'
import styles from './auth.module.css'

interface AuthButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  loading?: boolean
}

export function AuthButton({
  children,
  loading = false,
  disabled,
  type = 'button',
  ...rest
}: AuthButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      className={styles.button}
      aria-busy={loading}
      {...rest}
    >
      {loading ? (
        <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
          <svg
            width="16" height="16"
            viewBox="0 0 16 16"
            fill="none"
            style={{ animation: 'eligi-spin 0.75s linear infinite' }}
            aria-hidden
          >
            <circle cx="8" cy="8" r="6" stroke="rgba(255,255,255,0.30)" strokeWidth="2" />
            <path d="M8 2a6 6 0 0 1 6 6" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
          </svg>
          Carregando...
        </span>
      ) : children}

      <style>{`
        @keyframes eligi-spin { to { transform: rotate(360deg); } }
      `}</style>
    </button>
  )
}