'use client'

import { ReactNode } from 'react'
import { GoogleOAuthProvider } from '@react-oauth/google'

type ProvidersProps = {
  children: ReactNode
}

export function Providers({
  children
}: ProvidersProps) {
  return (
    <GoogleOAuthProvider
      clientId={
        process.env
          .NEXT_PUBLIC_GOOGLE_CLIENT_ID!
      }
    >
      {children}
    </GoogleOAuthProvider>
  )
}
