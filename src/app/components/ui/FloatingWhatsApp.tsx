'use client'

import styles from './FloatingWhatsApp.module.css'

const PHONE = '+5511918579495'

export default function FloatingWhatsApp() {
  return (
    <a
      href={`https://wa.me/${PHONE}`}
      target="_blank"
      rel="noopener noreferrer"
      className={styles.whatsapp}
      aria-label="Falar com a equipe no WhatsApp"
      title="WhatsApp"
    >
      {/* WhatsApp official SVG path */}
      <svg viewBox="0 0 32 32" fill="none" aria-hidden>
        <path
          d="M19.1 17.6c-.3-.2-1.7-.8-2-.9-.3-.1-.5-.2-.7.2-.2.3-.8.9-1 1-.2 0-.4 0-.7-.2-.3-.2-1.2-.5-2.3-1.4-.9-.8-1.5-1.8-1.7-2.1-.2-.3 0-.5.2-.7.2-.2.3-.4.5-.6.2-.2.2-.3.3-.5.1-.2 0-.4 0-.6-.1-.2-.7-1.7-1-2.3-.3-.6-.5-.5-.7-.5h-.6c-.2 0-.6.1-.9.4-.3.3-1.1 1.1-1.1 2.6 0 1.5 1.1 3 1.2 3.2.1.2 2.2 3.4 5.3 4.8.7.3 1.3.5 1.7.6.7.2 1.4.2 1.9.1.6-.1 1.7-.7 2-1.4.3-.7.3-1.3.2-1.4-.1-.1-.3-.2-.6-.4z"
          fill="currentColor"
        />
        <path
          d="M16 3C9.4 3 4 8.3 4 14.8c0 2.4.7 4.6 2 6.6L4 29l7.8-2c1.9 1 4 1.6 6.2 1.6 6.6 0 12-5.3 12-11.8C30 8.3 24.6 3 16 3zm0 21.5c-2 0-3.9-.5-5.6-1.5l-.4-.2-4.6 1.2 1.2-4.4-.3-.4C5.2 17.5 4.6 15.5 4.6 13.5 4.6 9.6 9.8 4.6 16 4.6s11.4 5 11.4 10.2S22.2 24.5 16 24.5z"
          fill="currentColor"
        />
      </svg>
    </a>
  )
}