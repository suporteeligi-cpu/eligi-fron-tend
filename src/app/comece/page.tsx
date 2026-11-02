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
import Analytics from './Analytics'
import QuizFlow from './QuizFlow'

/* @eligi:comece-fontes-v1 - a /comece usa as fontes da Identidade v1.0
   carregadas no layout raiz (Space Grotesk + Inter). DM Sans saiu.
   Os nomes --font-display/--font-body seguem valendo no
   Quiz.module.css; aqui eles so apontam para as variaveis do layout. */
const fontAlias = {
  '--font-display': 'var(--font-eligi-display)',
  '--font-body': 'var(--font-eligi-sans)',
} as React.CSSProperties

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
    <div style={fontAlias}>
      <Analytics />
      <QuizFlow />
    </div>
  )
}
