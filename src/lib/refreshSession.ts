/* =========================================
   @eligi:refresh-session-ssot
   RENOVACAO DE SESSAO — FONTE UNICA.

   Existiam tres estados de refresh independentes na mesma pagina
   (apiClient, api e auth.api). Em producao isso apareceu como dois
   POST /auth/refresh 200 em 195ms, e a janela entre eles era o 401
   transitorio que o useAuth lia como sessao morta.

   Este modulo NAO importa apiClient nem api: importar fecharia um
   ciclo de modulos e inFlight poderia nascer undefined.

   baseURL: mesmo fallback do apiClient. O do lib/api cai pra
   localhost:3333, mas quem manda no auth sempre foi o apiClient —
   alinhar aqui mantem o refresh no mesmo host do login.
========================================= */
import axios from 'axios'

const baseURL: string =
  process.env.NEXT_PUBLIC_API_URL ||
  'https://api.eligi.com.br'

let inFlight: Promise<void> | null = null

/**
 * Renova a sessao. Chamadas simultaneas compartilham a MESMA promise:
 * um POST por expiracao de access token, nao um por consumidor.
 * Resolve = Session viva no banco. Rejeita = sessao morta de verdade.
 */
export function refreshSession(): Promise<void> {
  if (!inFlight) {
    inFlight = axios
      .post(`${baseURL}/auth/refresh`, {}, { withCredentials: true })
      .then(() => undefined)
      .finally(() => { inFlight = null })
  }
  return inFlight
}
