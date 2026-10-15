// src/shared/utils/eligiApp.ts
// O painel aberto DENTRO do app iOS/Android do Eligi (repo eligi-mobile, "casca").
// O app avisa por dois sinais: `window.__ELIGI_APP__ = { platform, version }`, injetado
// antes da pagina, e `EligiApp/<versao> (<ios|android>)` no fim do user agent.
// Uso: esconder o que nao cabe no app (convite para instalar o app; no iPhone, o
// pagamento do plano, por regra da Apple). Sempre chamar no cliente (efeito/handler).

export interface EligiAppInfo {
  platform: 'ios' | 'android'
  version:  string
}

const UA_RE = /EligiApp\/([\w.-]+) \((ios|android)\)/

export function eligiApp(): EligiAppInfo | null {
  if (typeof window === 'undefined') return null
  const injected = (window as Window & { __ELIGI_APP__?: Partial<EligiAppInfo> }).__ELIGI_APP__
  if (injected && (injected.platform === 'ios' || injected.platform === 'android')) {
    return { platform: injected.platform, version: String(injected.version ?? '') }
  }
  const m = UA_RE.exec(navigator.userAgent || '')
  if (m) return { platform: m[2] as EligiAppInfo['platform'], version: m[1] ?? '' }
  return null
}
