'use client'

import styles from './AppleAuthButton.module.css'

interface Props {
  onClick: () => void
  loading?: boolean
  label?: string
}

// @eligi:apple-btn — Botao "Continuar com a Apple" (so no app de iPhone).
// Preto com o logo branco, como pedem as diretrizes de interface da Apple
// (Sign in with Apple: fundo preto/branco, mesmo tamanho dos outros botoes de
// login, nao pode ficar menor nem abaixo dos outros).
export function AppleAuthButton({ onClick, loading = false, label = 'Continuar com a Apple' }: Props) {
  return (
    <button type="button" className={styles.btn} onClick={onClick} disabled={loading}>
      <svg className={styles.icon} viewBox="0 0 17 20" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <path
          fill="currentColor"
          d="M14.04 10.63c-.02-2.2 1.8-3.26 1.88-3.31-1.03-1.5-2.62-1.7-3.18-1.73-1.35-.14-2.64.8-3.33.8-.69 0-1.74-.78-2.87-.76-1.47.02-2.83.86-3.59 2.18-1.53 2.66-.39 6.6 1.1 8.76.73 1.06 1.6 2.24 2.73 2.2 1.1-.04 1.51-.71 2.84-.71 1.32 0 1.7.71 2.86.69 1.18-.02 1.93-1.07 2.65-2.13.84-1.22 1.18-2.41 1.2-2.47-.03-.01-2.3-.88-2.32-3.5zM11.86 4.17c.6-.73 1.01-1.75.9-2.76-.87.04-1.92.58-2.54 1.31-.56.64-1.05 1.68-.92 2.67.97.08 1.96-.49 2.56-1.22z"
        />
      </svg>
      {loading ? 'Aguarde...' : label}
    </button>
  )
}
