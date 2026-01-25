// src/app/layout.tsx
import '../styles/globals.css'

export const metadata = {
  title: 'ELIGI',
  description: 'Plataforma inteligente para barbearias e salões',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  )
}
