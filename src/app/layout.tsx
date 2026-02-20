import type { Metadata } from 'next'
import { Providers } from './providers'
import { GoogleOAuthProvider } from '@react-oauth/google'
import '../styles/globals.css'

export const metadata: Metadata = {
  title: 'ELIGI',
  description: 'Sistema inteligente para negócios'
}

export default function RootLayout({
  children
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR">
      <body>
        <Providers>
          {children}
        </Providers>
        <GoogleOAuthProvider
          clientId={
            process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!
          }
        >
          {children}
        </GoogleOAuthProvider>
      </body>
    </html>
  )
}
