// src/shared/utils/appFiles.ts
// @eligi:app-files
// Arquivos (PDF, XML, planilha, QR) DENTRO do app iOS/Android do Eligi (casca).
//
// No app a pagina roda num WebView, onde nao existe aba nova, link com `download`
// nem PDF dentro de <iframe> (Android). O app novo recebe o arquivo pronto pela
// ponte do WebView e abre no leitor do celular ou no menu de compartilhar.
//
// So vale quando o app avisa que sabe receber (`__ELIGI_APP__.files === true`).
// App antigo, ou navegador: devolve false e quem chamou segue o caminho de antes.

import { eligiApp } from './eligiApp'

/** 'open' = leitor do celular (ver o PDF) · 'share' = menu de compartilhar/salvar. */
export type AppFileAction = 'open' | 'share'

/** Teto do arquivo entregue ao app. O app recusa acima disso. */
export const APP_FILE_MAX_BYTES = 15 * 1024 * 1024

interface AppBridge {
  __ELIGI_APP__?: { files?: unknown }
  ReactNativeWebView?: { postMessage(message: string): void }
}

/** O app aberto sabe receber arquivos. Sempre chamar no cliente (handler/efeito). */
export function appReceivesFiles(): boolean {
  if (typeof window === 'undefined' || !eligiApp()) return false
  const w = window as Window & AppBridge
  return w.__ELIGI_APP__?.files === true && typeof w.ReactNativeWebView?.postMessage === 'function'
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = String(reader.result ?? '')
      const comma = result.indexOf(',')
      resolve(comma >= 0 ? result.slice(comma + 1) : result)
    }
    reader.onerror = () => reject(reader.error ?? new Error('Falha ao ler o arquivo'))
    reader.readAsDataURL(blob)
  })
}

/**
 * Entrega o arquivo ao app. Devolve false quando nao esta no app (ou o arquivo
 * passa do teto); ai quem chamou faz o caminho do navegador.
 */
export async function sendFileToApp(blob: Blob, filename: string, action: AppFileAction): Promise<boolean> {
  if (!appReceivesFiles() || blob.size > APP_FILE_MAX_BYTES) return false
  const base64 = await blobToBase64(blob)
  const w = window as Window & AppBridge
  w.ReactNativeWebView?.postMessage(JSON.stringify({ type: 'eligi-file', action, filename, base64 }))
  return true
}
