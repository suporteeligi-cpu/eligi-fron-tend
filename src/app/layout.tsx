import type { Metadata } from 'next'
import { Providers } from './providers'
import { GoogleOAuthProvider } from '@react-oauth/google'
import '../styles/globals.css'

export const metadata: Metadata = {
  title: 'ELIGI',
  description: 'Sistema inteligente para negócios',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR">
      {/*
        O body recebe o gradient mesh e o glass token system via globals.css.
        Nenhum estilo inline — tudo vive nas CSS vars.
      */}
      <body>
        <GoogleOAuthProvider
          clientId={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!}
        >
          <Providers>{children}</Providers>
        </GoogleOAuthProvider>
      </body>
    </html>
  )
}