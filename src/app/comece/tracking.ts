/* =========================================
   @eligi:raiox-tracking
   Eventos do funil para Meta Pixel + GA4.

   Tudo e no-op quando o script nao carregou (env ausente, adblock, SSR).
   Analytics NUNCA pode derrubar o cadastro: cada chamada e protegida, e a
   falha vai pro console em dev e some em producao.
========================================= */

type PixelFn = (
  command: 'init' | 'track' | 'trackCustom',
  eventOrId: string,
  params?: Record<string, unknown>,
) => void

type GtagFn = (
  command: 'js' | 'config' | 'event',
  targetOrName: string | Date,
  params?: Record<string, unknown>,
) => void

declare global {
  interface Window {
    fbq?: PixelFn
    gtag?: GtagFn
    dataLayer?: unknown[]
  }
}

export interface Attribution {
  utm_source?: string
  utm_medium?: string
  utm_campaign?: string
  utm_content?: string
  utm_term?: string
  fbclid?: string
  referrer?: string
  landingVariant?: string
}

function safe(fn: () => void): void {
  if (typeof window === 'undefined') return
  try {
    fn()
  } catch (err) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn('[raiox-tracking]', err)
    }
  }
}

/** Evento padrao do Pixel (Lead, CompleteRegistration...). */
export function pixelStandard(event: string, params?: Record<string, unknown>): void {
  safe(() => {
    window.fbq?.('track', event, params)
  })
}

/** Evento custom do Pixel (quiz_start, quiz_step...). */
export function pixelCustom(event: string, params?: Record<string, unknown>): void {
  safe(() => {
    window.fbq?.('trackCustom', event, params)
  })
}

/** Evento GA4. */
export function ga4(event: string, params?: Record<string, unknown>): void {
  safe(() => {
    window.gtag?.('event', event, params)
  })
}

/**
 * Dispara no Pixel (custom) e no GA4 de uma vez, com a atribuicao junto.
 * Todo evento do funil carrega utm_* e segment — sem isso o Events Manager
 * mostra volume mas nao mostra QUAL criativo converteu.
 */
export function trackFunnel(
  event: string,
  attribution: Attribution,
  params: Record<string, unknown> = {},
): void {
  const payload = { ...attribution, ...params }
  pixelCustom(event, payload)
  ga4(event, payload)
}
