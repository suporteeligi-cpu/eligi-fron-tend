'use client'

import React from 'react'
import styles from './AuthInput.module.css'

interface AuthInputProps {
  label: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
  type?: string
  error?: string
  required?: boolean
  disabled?: boolean // ✅ ADIÇÃO NECESSÁRIA
}

export function AuthInput({
  label,
  value,
  onChange,
  placeholder,
  type = 'text',
  error,
  required = false,
  disabled = false
}: AuthInputProps) {
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
      <label className={styles.label}>
        {label}
        {required && ' *'}
      </label>

      <div className={styles.inputWrapper}>
        <input
          className={`${styles.input} ${
            error ? styles.inputError : ''
          }`}
          type={type}
          value={value}
          placeholder={placeholder}
          required={required}
          disabled={disabled} // ✅ APLICADO
          onChange={handleChange}
        />

        {value && !disabled && (
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

      {error && <span className={styles.error}>{error}</span>}
    </div>
  )
}
