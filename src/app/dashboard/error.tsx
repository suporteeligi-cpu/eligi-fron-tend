'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'
import ErrorScreen from '@/app/components/errors/ErrorScreen'

interface DashboardErrorProps {
  error: Error & { digest?: string }
  reset: () => void
}

export default function DashboardError({ error, reset }: DashboardErrorProps) {
  const pathname = usePathname()

  useEffect(() => {
    console.error('[eligi] dashboard error boundary:', error)
  }, [error])

  return <ErrorScreen kind="error" route={pathname} digest={error.digest} onRetry={reset} />
}
