/* =========================================
   @eligi:raiox-page
   Rota publica /comece — destino dos anuncios.

   Server component: carrega as fontes e a metadata, e delega o quiz inteiro
   pro client. Assim o HTML inicial ja chega com o wordmark e a tipografia
   corretos, sem flash de fonte no 4G do lojista.

   next/font em vez de <link> do Google: elimina CLS e evita o
   @next/next/no-page-custom-font, que barraria o lint.
========================================= */
import type { Metadata } from 'next'
import { DM_Sans, Space_Grotesk } from 'next/font/google'
import Analytics from './Analytics'
import QuizFlow from './QuizFlow'

const display = Space_Grotesk({
  subsets: ['latin'],
  weight: ['500', '700'],
  variable: '--font-display',
  display: 'swap',
})

const body = DM_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-body',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Raio-X do seu negócio',
  description:
    'Descubra em 1 minuto quanto você perde por mês com faltas — e saia com sua agenda online pronta.',
  robots: { index: false, follow: false },
  openGraph: {
    title: 'Quanto você perde por mês com faltas?',
    description:
      'Responda 7 perguntas e receba o raio-x do seu negócio. No fim, sua agenda já sai montada.',
    url: 'https://www.eligi.com.br/comece',
    siteName: 'Eligi',
    locale: 'pt_BR',
    type: 'website',
  },
}

export default function ComecePage() {
  return (
    <div className={display.variable + ' ' + body.variable}>
      <Analytics />
      <QuizFlow />
    </div>
  )
}
