'use client'

import { useRouter } from 'next/navigation'
import { ReactNode } from 'react'

interface AuthGuardProps {
  children: ReactNode
}

export default function AuthGuard({ children }: AuthGuardProps) {
  const router = useRouter()

  const isAuthenticated = true // depois vem token / session

  if (!isAuthenticated) {
    router.replace('/login')
    return null
  }

  return <>{children}</>
}
