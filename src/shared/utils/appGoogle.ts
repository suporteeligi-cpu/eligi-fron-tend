// src/shared/utils/appGoogle.ts
// @eligi:app-google
// "Entrar com Google" DENTRO do app iOS/Android do Eligi (casca).
//
// O Google bloqueia login em WebView (erro 403 disallowed_useragent). No app novo
// quem faz o login e a parte nativa: a pagina pede pela ponte, o app abre a
// escolha de conta do celular e devolve o idToken para ESTA pagina. A pagina
// segue o caminho de sempre (POST /auth/google), entao os cookies nascem aqui.
//
// So vale quando o app avisa que sabe (`__ELIGI_APP__.google === true`). App
// antigo, ou navegador: appSupportsGoogle() = false e o botao segue como antes.

import { eligiApp } from './eligiApp'

interface GoogleBridge {
  __ELIGI_APP__?: { google?: unknown }
  ReactNativeWebView?: { postMessage(message: string): void }
  __eligiGoogleResult?: (r: { idToken?: string; error?: string }) => void
}

const TIMEOUT_MS = 120_000

export function appSupportsGoogle(): boolean {
  if (typeof window === 'undefined' || !eligiApp()) return false
  const w = window as Window & GoogleBridge
  return w.__ELIGI_APP__?.google === true && typeof w.ReactNativeWebView?.postMessage === 'function'
}

/**
 * Pede o login com Google ao app. Devolve o idToken, ou null se a pessoa
 * fechou a escolha de conta. Lanca em erro (sem Play Services, sem rede...).
 */
export function nativeGoogleIdToken(webClientId: string): Promise<string | null> {
  const w = window as Window & GoogleBridge
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      w.__eligiGoogleResult = undefined
      reject(new Error('google_timeout'))
    }, TIMEOUT_MS)
    w.__eligiGoogleResult = (r) => {
      clearTimeout(timer)
      w.__eligiGoogleResult = undefined
      if (r.idToken) resolve(r.idToken)
      else if (r.error === 'cancelled') resolve(null)
      else reject(new Error(r.error ?? 'google_failed'))
    }
    w.ReactNativeWebView?.postMessage(JSON.stringify({ type: 'eligi-google', webClientId }))
  })
}
