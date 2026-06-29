'use client'

import { PASSWORD_RULES } from '@/lib/passwordRules'
import styles from './PasswordChecklist.module.css'

interface Props {
  password: string
}

export function PasswordChecklist({ password }: Props) {
  return (
    <ul className={styles.list}>
      {PASSWORD_RULES.map((rule) => {
        const ok = rule.test(password)
        return (
          <li key={rule.id} className={`${styles.item}${ok ? ` ${styles.ok}` : ''}`}>
            <span className={styles.icon} aria-hidden>{ok ? '✓' : '○'}</span>
            <span>{rule.label}</span>
          </li>
        )
      })}
    </ul>
  )
}
