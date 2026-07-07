'use client'

import { useEffect } from 'react'
import ErrorScreen from '@/app/components/errors/ErrorScreen'

interface GlobalErrorProps {
  error: Error & { digest?: string }
  reset: () => void
}

export default function GlobalError({ error, reset }: GlobalErrorProps) {
  useEffect(() => {
    console.error('[eligi] global error boundary:', error)
  }, [error])

  // global-error SUBSTITUI o root layout — precisa declarar html/body próprios.
  return (
    <html lang="pt-BR">
      <body style={{ margin: 0, background: '#08080c' }}>
        <ErrorScreen kind="error" digest={error.digest} onRetry={reset} fullPage />
      </body>
    </html>
  )
}
