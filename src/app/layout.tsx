import type { Metadata, Viewport } from 'next'
import { Providers } from './providers'
import '../styles/globals.css'

export const viewport: Viewport = {
  themeColor:       '#dc2626',
  width:            'device-width',
  initialScale:     1,
  maximumScale:     1,
  userScalable:     false,
}

export const metadata: Metadata = {
  title: {
    default:  'Eligi — Sistema para Barbearias',
    template: '%s | Eligi',
  },
  description:    'Sistema inteligente de agendamento e gestão para barbearias e salões.',
  applicationName:'Eligi',
  authors:        [{ name: 'Eligi' }],
  keywords:       ['barbearia', 'agendamento', 'salão', 'gestão', 'eligi'],
  creator:        'Eligi',
  publisher:      'Eligi',

  // Open Graph
  openGraph: {
    type:        'website',
    siteName:    'Eligi',
    title:       'Eligi — Sistemas',
    description: 'Sistema inteligente de agendamento e gestão.',
    url:         'https://eligi.com.br',
    locale:      'pt_BR',
    images: [{
      url:    'https://eligi.com.br/og-image.png',
      width:  1200,
      height: 630,
      alt:    'Eligi',
    }],
  },

  // Twitter / X
  twitter: {
    card:        'summary_large_image',
    title:       'Eligi — Sistemas',
    description: 'Sistema inteligente de agendamento e gestão.',
    images:      ['https://eligi.com.br/og-image.png'],
  },

  // PWA / Manifest
  manifest: '/manifest.json',

  // Apple
  appleWebApp: {
    capable:       true,
    statusBarStyle:'black-translucent',
    title:         'Eligi',
    startupImage: [
      // iPhone 15 Pro Max
      { url:'/icons/splash-1290x2796.png', media:'(device-width: 430px) and (device-height: 932px) and (-webkit-device-pixel-ratio: 3)' },
      // iPhone 14 Pro
      { url:'/icons/splash-1179x2556.png', media:'(device-width: 393px) and (device-height: 852px) and (-webkit-device-pixel-ratio: 3)' },
      // iPhone 14
      { url:'/icons/splash-1170x2532.png', media:'(device-width: 390px) and (device-height: 844px) and (-webkit-device-pixel-ratio: 3)' },
      // iPhone SE
      { url:'/icons/splash-750x1334.png',  media:'(device-width: 375px) and (device-height: 667px) and (-webkit-device-pixel-ratio: 2)' },
      // iPad Pro 12.9"
      { url:'/icons/splash-2048x2732.png', media:'(device-width: 1024px) and (device-height: 1366px) and (-webkit-device-pixel-ratio: 2)' },
    ],
  },

  // Ícones
  icons: {
    icon: [
      { url:'/icons/icon-32x32.png',   sizes:'32x32',   type:'image/png' },
      { url:'/icons/icon-96x96.png',   sizes:'96x96',   type:'image/png' },
      { url:'/icons/icon-192x192.png', sizes:'192x192', type:'image/png' },
    ],
    apple: [
      { url:'/icons/apple-touch-icon.png',        sizes:'180x180' },
      { url:'/icons/apple-touch-icon-152x152.png', sizes:'152x152' },
      { url:'/icons/apple-touch-icon-120x120.png', sizes:'120x120' },
      { url:'/icons/apple-touch-icon-76x76.png',   sizes:'76x76'  },
    ],
    shortcut: '/icons/icon-192x192.png',
  },

  robots: {
    index:  true,
    follow: true,
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <head>
        {/* Apple Touch Icon — fallback explícito */}
        <link rel="apple-touch-icon" sizes="180x180" href="/icons/apple-touch-icon.png" />
        <link rel="apple-touch-icon" sizes="152x152" href="/icons/apple-touch-icon-152x152.png" />
        <link rel="apple-touch-icon" sizes="120x120" href="/icons/apple-touch-icon-120x120.png" />
        <link rel="apple-touch-icon" sizes="76x76"   href="/icons/apple-touch-icon-76x76.png" />

        {/* Favicon */}
        <link rel="icon" type="image/png" sizes="32x32"   href="/icons/icon-32x32.png" />
        <link rel="icon" type="image/png" sizes="96x96"   href="/icons/icon-96x96.png" />
        <link rel="icon" type="image/png" sizes="192x192" href="/icons/icon-192x192.png" />

        {/* PWA */}
        <link rel="manifest" href="/manifest.json" />
        <meta name="mobile-web-app-capable"      content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title"  content="Eligi" />
        <meta name="msapplication-TileColor"     content="#dc2626" />
        <meta name="msapplication-TileImage"     content="/icons/icon-144x144.png" />
      </head>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
