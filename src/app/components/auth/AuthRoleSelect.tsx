'use client'

import styles from './auth.module.css'

interface AuthRoleSelectProps {
  value: 'BUSINESS_OWNER' | 'AFFILIATE'
  onChange: (value: 'BUSINESS_OWNER' | 'AFFILIATE') => void
}

export function AuthRoleSelect({ value, onChange }: AuthRoleSelectProps) {
  return (
    <div className={styles.field}>
      <label className={styles.label}>Tipo de conta</label>

      <div className={styles.roleGroup}>
        <button
          type="button"
          className={`${styles.roleButton} ${
            value === 'BUSINESS_OWNER' ? styles.active : ''
          }`}
          onClick={() => onChange('BUSINESS_OWNER')}
        >
          Empresarial
        </button>

        <button
          type="button"
          className={`${styles.roleButton} ${
            value === 'AFFILIATE' ? styles.active : ''
          }`}
          onClick={() => onChange('AFFILIATE')}
        >
          Afiliado
        </button>
      </div>
    </div>
  )
}
