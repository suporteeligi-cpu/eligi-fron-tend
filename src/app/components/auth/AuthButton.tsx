'use client'

import styles from './auth.module.css'

interface AuthButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  loading?: boolean
}

export function AuthButton({
  loading,
  children,
  ...props
}: AuthButtonProps) {
  return (
    <button
      className={styles.button}
      disabled={loading || props.disabled}
      {...props}
    >
      {loading ? 'Aguarde…' : children}
    </button>
  )
}
