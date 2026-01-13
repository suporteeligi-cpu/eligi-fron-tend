import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'

//import '@/styles/reset.css'
//import '@/styles/tokens.css'
import '@/styles/core.css'
//import '@/styles/themes.css'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: 'Eligi',
  description: 'Agendamento fácil: todos os tipos profissionais ao seu redor.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR">
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        {children}
      </body>
    </html>
  )
}
