// src/shared/constants/publicUrl.ts
// @eligi:msgtpl-url-const
//
// Fonte unica do endereco publico de agendamento.
//
// DIVIDA CONHECIDA: ShareProfileModal.tsx e AppNavbar.tsx ainda montam essa
// URL na mao. A migracao dos dois nao entrou aqui de proposito (exige ler os
// arquivos por dentro); esta registrada como fatia separada.

/** Host do link publico. Sem protocolo — util para exibir "app.eligi.com.br/slug". */
export const PUBLIC_APP_HOST = 'app.eligi.com.br'

/** URL completa do link publico de um estabelecimento. */
export function publicBookingUrl(slug: string): string {
  return `https://${PUBLIC_APP_HOST}/${slug}`
}

/** Versao curta, para exibir em tela (sem https://). */
export function publicBookingLabel(slug: string): string {
  return `${PUBLIC_APP_HOST}/${slug}`
}
