import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: {
    default: 'ELIGI — Sistema inteligente para negócios da beleza',
    template:
      'Agenda, pagamentos, equipe e métricas em um único sistema profissional.',
  },
  description:
    'ELIGI é um sistema inteligente para barbearias e salões de beleza. Agenda, equipe, clientes, pagamentos e métricas em um único painel.',
  keywords: [
    'sistema para barbearia',
    'sistema para salão de beleza',
    'agenda online barbearia',
    'software para salão',
    'gestão de barbearia',
  ],
  authors: [{ name: 'ELIGI' }],
  creator: 'ELIGI',
  metadataBase: new URL('https://eligi.com.br'),
  openGraph: {
    title: 'ELIGI — Sistema inteligente para negócios da beleza',
    description:
      'Agenda, pagamentos, equipe e métricas em um único sistema profissional.',
    url: 'https://eligi.com.br',
    siteName: 'ELIGI',
    locale: 'pt_BR',
    type: 'website',
  },
  robots: {
    index: true,
    follow: true,
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR">
      <body>
        {children}

        {/* 🔥 Portal root global (AuthSheet, Modals, Toasts, etc.) */}
        <div id="portal-root" />
      </body>
    </html>
  )
}
