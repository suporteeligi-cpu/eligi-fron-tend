// src/app/layout.tsx
import '../styles/globals.css'

export const metadata = {
  title: 'Eligi Business',
  description: 'Plataforma inteligente de Agendamentos e Gestão.',
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
