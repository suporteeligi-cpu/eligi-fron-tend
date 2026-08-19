/* =========================================
   @eligi:raiox-analytics
   Meta Pixel + GA4, carregados SO na rota /comece.

   Montar isso no layout raiz colocaria script de terceiro em cima do
   dashboard inteiro — custo de banda e privacidade que a ferramenta de
   trabalho do lojista nao precisa pagar.

   Sem env definida, nada e renderizado. Sem erro, sem placeholder, sem
   console poluido: o funil roda igual, so nao mede.
========================================= */
'use client'

import Script from 'next/script'

const PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID
const GA4_ID = process.env.NEXT_PUBLIC_GA4_ID

export default function Analytics() {
  return (
    <>
      {PIXEL_ID ? (
        <Script id="eligi-meta-pixel" strategy="afterInteractive">
          {`!function(f,b,e,v,n,t,s)
{if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};
if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];
s.parentNode.insertBefore(t,s)}(window,document,'script',
'https://connect.facebook.net/en_US/fbevents.js');
fbq('init','${PIXEL_ID}');
fbq('track','PageView');`}
        </Script>
      ) : null}

      {GA4_ID ? (
        <>
          <Script
            id="eligi-ga4-src"
            strategy="afterInteractive"
            src={`https://www.googletagmanager.com/gtag/js?id=${GA4_ID}`}
          />
          <Script id="eligi-ga4-init" strategy="afterInteractive">
            {`window.dataLayer=window.dataLayer||[];
function gtag(){dataLayer.push(arguments);}
window.gtag=gtag;
gtag('js',new Date());
gtag('config','${GA4_ID}');`}
          </Script>
        </>
      ) : null}
    </>
  )
}
