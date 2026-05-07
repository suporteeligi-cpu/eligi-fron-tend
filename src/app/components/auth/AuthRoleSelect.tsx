'use client'

import styles from './auth.module.css'

type Role = 'BUSINESS_OWNER' | 'AFFILIATE'

interface AuthRoleSelectProps {
  value: Role
  onChange: (value: Role) => void
  disabled?: boolean
}

const ROLES: { value: Role; label: string; description: string }[] = [
  { value: 'BUSINESS_OWNER', label: 'Empresarial', description: 'Dono de barbearia ou salão' },
  { value: 'AFFILIATE',      label: 'Afiliado',    description: 'Parceiro ou revendedor'     },
]

export function AuthRoleSelect({ value, onChange, disabled = false }: AuthRoleSelectProps) {
  return (
    <div className={styles.field}>
      <label className={styles.label}>Tipo de conta</label>

      <div className={styles.roleGroup} role="group" aria-label="Tipo de conta">
        {ROLES.map(role => (
          <button
            key={role.value}
            type="button"
            className={`${styles.roleButton}${value === role.value ? ` ${styles.active}` : ''}`}
            onClick={() => !disabled && onChange(role.value)}
            aria-pressed={value === role.value}
            aria-label={`${role.label} — ${role.description}`}
            disabled={disabled}
            title={role.description}
          >
            {role.label}
          </button>
        ))}
      </div>
    </div>
  )
}