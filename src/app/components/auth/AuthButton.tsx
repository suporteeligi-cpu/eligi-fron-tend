'use client'

import React from 'react'
import styles from './auth.module.css'

interface AuthButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  loading?: boolean
}

export function AuthButton({
  children,
  loading = false,
  disabled,
  type,
  ...rest
}: AuthButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      className={styles.button}
      {...rest}
    >
      {loading ? 'Carregando...' : children}
    </button>
  )
}
