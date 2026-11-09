// src/shared/utils/appApple.ts
// @eligi:app-apple
// "Entrar com a Apple" DENTRO do app de iPhone do Eligi (casca, repo eligi-mobile).
//
// Diretriz 4.8 da App Store: app que oferece Google precisa oferecer Apple. Mesmo
// desenho do Google (appGoogle.ts): a pagina pede pela ponte, o app abre o login
// nativo da Apple e devolve { identityToken, nonce, fullName } para ESTA pagina,
// que chama POST /auth/apple. Os cookies da sessao nascem aqui.
//
// So vale quando o app avisa que sabe (`__ELIGI_APP__.apple === true`, so iPhone
// a partir da 1.0.3). No navegador e no Android: appSupportsApple() = false.

import { eligiApp } from './eligiApp'

export type AppleMode = 'login' | 'register'

export interface AppleCredential {
  identityToken: string
  nonce:         string
  fullName:      string | null
  /** Uso unico, 5 min. O back troca pelo token que cancela o acesso na exclusao. @eligi:app-apple-code */
  authorizationCode?: string
}

interface AppleBridge {
  __ELIGI_APP__?: { apple?: unknown }
  ReactNativeWebView?: { postMessage(message: string): void }
  __eligiAppleResult?: (r: Partial<AppleCredential> & { error?: string }) => void
}

const TIMEOUT_MS = 120_000

export function appSupportsApple(): boolean {
  if (typeof window === 'undefined' || eligiApp()?.platform !== 'ios') return false
  const w = window as Window & AppleBridge
  return w.__ELIGI_APP__?.apple === true && typeof w.ReactNativeWebView?.postMessage === 'function'
}

/**
 * Pede o login com a Apple ao app. Devolve a credencial, ou null se a pessoa
 * fechou a janela da Apple. Lanca em erro.
 */
export function nativeAppleCredential(mode: AppleMode): Promise<AppleCredential | null> {
  const w = window as Window & AppleBridge
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      w.__eligiAppleResult = undefined
      reject(new Error('apple_timeout'))
    }, TIMEOUT_MS)
    w.__eligiAppleResult = (r) => {
      clearTimeout(timer)
      w.__eligiAppleResult = undefined
      if (typeof r.identityToken === 'string' && typeof r.nonce === 'string') {
        resolve({
          identityToken: r.identityToken,
          nonce: r.nonce,
          fullName: r.fullName ?? null,
          ...(typeof r.authorizationCode === 'string' && r.authorizationCode ? { authorizationCode: r.authorizationCode } : {}),
        })
      } else if (r.error === 'cancelled') {
        resolve(null)
      } else {
        reject(new Error(r.error ?? 'apple_failed'))
      }
    }
    w.ReactNativeWebView?.postMessage(JSON.stringify({ type: 'eligi-apple', mode }))
  })
}
