'use client'

import React, { useId } from 'react'
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
          type={type}
          value={value}
          placeholder={placeholder}
          required={required}
          disabled={disabled}
          autoComplete={autoComplete}
          aria-invalid={!!error}
          aria-describedby={error ? `${id}-error` : undefined}
          onChange={handleChange}
        />

        {value && !disabled && (
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