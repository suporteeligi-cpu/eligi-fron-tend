'use client'

import React, { useId, useState } from 'react'
import styles from './AuthInput.module.css'

interface AuthInputProps {
  label: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
  type?: string
  error?: string
  required?: boolean
  disabled?: boolean
  autoComplete?: string
}

export function AuthInput({
  label,
  value,
  onChange,
  placeholder,
  type = 'text',
  error,
  required = false,
  disabled = false,
  autoComplete,
}: AuthInputProps) {
  const id = useId()
  const [revealed, setRevealed] = useState(false)

  const isPassword    = type === 'password'
  const effectiveType = isPassword && revealed ? 'text' : type
  const showButton    = !!value && !disabled

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (disabled) return
    onChange(e.target.value)
  }

  function handleClear() {
    if (disabled) return
    onChange('')
  }

  return (
    <div className={styles.authInput}>
      <label htmlFor={id} className={styles.label}>
        {label}
        {required && <span aria-hidden style={{ color: '#dc2626', marginLeft: '2px' }}>*</span>}
      </label>

      <div className={styles.inputWrapper}>
        <input
          id={id}
          className={`${styles.input}${error ? ` ${styles.inputError}` : ''}`}
          type={effectiveType}
          value={value}
          placeholder={placeholder}
          required={required}
          disabled={disabled}
          autoComplete={autoComplete}
          aria-invalid={!!error}
          aria-describedby={error ? `${id}-error` : undefined}
          onChange={handleChange}
        />

        {showButton && isPassword && (
          <button
            type="button"
            className={styles.clearButton}
            onClick={() => setRevealed((v) => !v)}
            aria-label={revealed ? 'Ocultar senha' : 'Mostrar senha'}
            aria-pressed={revealed}
          >
            {revealed ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
                <path
                  d="M3 3l18 18M10.6 10.6a2 2 0 0 0 2.8 2.8M9.4 5.2A9.7 9.7 0 0 1 12 5c5 0 9 4.5 9 7a12 12 0 0 1-2.2 3M6 6.1A12.7 12.7 0 0 0 3 12c0 2.5 4 7 9 7a9.7 9.7 0 0 0 3.9-.8"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
                <path
                  d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7-10-7-10-7z"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <circle cx="12" cy="12" r="2.6" stroke="currentColor" strokeWidth="1.8" />
              </svg>
            )}
          </button>
        )}

        {showButton && !isPassword && (
          <button
            type="button"
            className={styles.clearButton}
            onClick={handleClear}
            aria-label={`Limpar campo ${label}`}
            tabIndex={-1}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path
                d="M7 7L17 17M17 7L7 17"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
              />
            </svg>
          </button>
        )}
      </div>

      {error && (
        <span id={`${id}-error`} className={styles.errorMessage} role="alert">
          {error}
        </span>
      )}
    </div>
  )
}
