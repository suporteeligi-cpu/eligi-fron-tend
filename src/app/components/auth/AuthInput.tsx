'use client'

import styles from './auth.module.css'
import React from 'react'

interface AuthInputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string
}

export function AuthInput({ label, ...props }: AuthInputProps) {
  return (
    <div className={styles.field}>
      <label className={styles.label}>{label}</label>
      <input className={styles.input} {...props} />
    </div>
  )
}
