'use client'

import React from 'react'
import styles from './AuthInput.module.css'

interface AuthInputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string
  value: string
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
}

export function AuthInput({
  label,
  value,
  onChange,
  ...props
}: AuthInputProps) {
  function handleClear() {
    const event = {
      target: { value: '' }
    } as React.ChangeEvent<HTMLInputElement>

    onChange(event)
  }

  return (
    <div className={styles.authInput}>
      <label className={styles.label}>{label}</label>

      <div className={styles.inputWrapper}>
        <input
          className={styles.input}
          value={value}
          onChange={onChange}
          {...props}
        />

        {value && (
          <button
            type="button"
            className={styles.clearButton}
            onClick={handleClear}
            aria-label="Limpar campo"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden="true"
            >
              <path
                d="M7 7L17 17M17 7L7 17"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </button>
        )}
      </div>
    </div>
  )
}
