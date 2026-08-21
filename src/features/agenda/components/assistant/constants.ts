// src/features/agenda/components/assistant/constants.ts
// Constantes do Assistente Eligi (orbe da agenda).

/** Estados do orbe. `thinking`/`speaking` sao acionados pela camada de IA (fase 2). */
export type AssistantState = 'idle' | 'listening' | 'thinking' | 'speaking'

/**
 * Faixa de z-index propria. O launcher monta via portal no <body>, fora do
 * stacking context da pagina da agenda (que e position:fixed com zIndex:1),
 * entao estes valores sao absolutos em relacao ao documento.
 */
export const ASSISTANT_Z = {
  fab:   9000,
  scrim: 9100,
  sheet: 9200,
} as const

/** Chave de persistencia da posicao do botao flutuante. */
export const FAB_STORAGE_KEY = 'eligi-assistant-fab'

export const FAB_SIZE = 56
/** Margem minima entre o botao e as bordas da viewport. */
export const FAB_MARGIN = 14
/** Deslocamento acima do qual o gesto vira arraste (e nao toque). */
export const FAB_DRAG_THRESHOLD_PX = 6
/** Faixa vertical util, em fracao da altura da viewport. Evita navbar e bottom-nav. */
export const FAB_Y_MIN_RATIO = 0.18
export const FAB_Y_MAX_RATIO = 0.86
/** Posicao inicial quando nao ha nada salvo. */
export const FAB_DEFAULT_Y_RATIO = 0.72

/** Largura maxima do painel. No desktop ele fica centralizado nesta largura. */
export const SHEET_MAX_WIDTH = 560

/** Globo Eligi usado como fonte das particulas e como icone do botao. */
export const GLOBE_SRC = '/assistant-globe.png'

/**
 * Fallback de texto. Nunca aparece com o microfone funcionando; so e exibido
 * quando getUserMedia falha (permissao negada, sem dispositivo, contexto
 * inseguro). Trocar para false remove o fallback por completo.
 */
export const SHOW_TEXT_FALLBACK = true

export const STATE_LABEL: Record<AssistantState, string> = {
  idle:      'Toque para falar',
  listening: 'Escutando...',
  thinking:  'Pensando...',
  speaking:  'Respondendo',
}

/** Motivos de indisponibilidade do microfone, em linguagem de usuario. */
export type MicError = 'denied' | 'unavailable' | 'insecure'

export const MIC_ERROR_LABEL: Record<MicError, string> = {
  denied:      'Microfone bloqueado no navegador',
  unavailable: 'Nenhum microfone encontrado',
  insecure:    'O microfone exige conexao segura',
}
