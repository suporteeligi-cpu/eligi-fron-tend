// src/features/agenda/utils/contrast.ts
// Decide a "tinta" (cor de texto) ideal sobre o fundo colorido de um serviço,
// pra garantir leitura nítida tanto em cores escuras quanto claras.

function expand(hex: string): string {
  let c = hex.trim().replace(/^#/, '')
  if (c.length === 3) c = c.split('').map((x) => x + x).join('')
  return c
}

function srgbToLinear(channel: number): number {
  const x = channel / 255
  return x <= 0.03928 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4)
}

/** Luminância relativa (WCAG) — 0 (preto) a 1 (branco). */
export function relativeLuminance(hex: string): number {
  const c = expand(hex)
  if (c.length < 6) return 1
  const r = parseInt(c.slice(0, 2), 16)
  const g = parseInt(c.slice(2, 4), 16)
  const b = parseInt(c.slice(4, 6), 16)
  if (Number.isNaN(r) || Number.isNaN(g) || Number.isNaN(b)) return 1
  return 0.2126 * srgbToLinear(r) + 0.7152 * srgbToLinear(g) + 0.0722 * srgbToLinear(b)
}

export interface CardInk {
  primary:   string  // nome / horário forte
  secondary: string  // serviço / horário atenuado
  faint:     string  // detalhes (duração, separadores)
  isDark:    boolean // true = tinta escura sobre fundo claro
}

const WHITE_INK: CardInk = {
  primary:   '#fff',
  secondary: 'rgba(255,255,255,0.90)',
  faint:     'rgba(255,255,255,0.55)',
  isDark:    false,
}

const DARK_INK: CardInk = {
  primary:   '#1c1c1e',
  secondary: 'rgba(0,0,0,0.62)',
  faint:     'rgba(0,0,0,0.34)',
  isDark:    true,
}

// Acima deste limiar de luminância o fundo é "claro" → usar tinta escura.
const LIGHT_BG_THRESHOLD = 0.42

/**
 * Retorna a tinta ideal para o fundo. Sem cor válida (fallback de tema,
 * NO_SHOW) → branco, que é seguro sobre os gradientes escuros do tema.
 */
export function inkFor(serviceColor?: string | null): CardInk {
  if (!serviceColor) return WHITE_INK
  const hex = expand(serviceColor)
  if (!/^[0-9a-fA-F]{6,8}$/.test(hex)) return WHITE_INK
  return relativeLuminance(serviceColor) > LIGHT_BG_THRESHOLD ? DARK_INK : WHITE_INK
}

/* ─── Estilo de card da agenda (clássico × clean) ────────────────────────
   'classic' = fundo saturado atual (gradiente da cor do serviço).
   'clean'   = estilo Fresha: fundo pastel derivado da MESMA cor + faixa
   lateral na cor crua. 100% derivado — nada novo pra cadastrar no serviço. */

export type AgendaCardStyle = 'classic' | 'clean'

/** Mistura com branco que define o pastel (decisão de produto — mockup, 86%). */
export const PASTEL_MIX = 0.86

// Acima deste limiar de luminância a cor crua é clara demais pra faixa:
// escurece pra faixa não sumir sobre o próprio pastel (piso de croma).
const STRIP_LUMA_FLOOR = 0.72
const STRIP_DARKEN = 0.42

function hexChannels(hex: string): [number, number, number] | null {
  const c = expand(hex)
  if (!/^[0-9a-fA-F]{6,8}$/.test(c)) return null
  const r = parseInt(c.slice(0, 2), 16)
  const g = parseInt(c.slice(2, 4), 16)
  const b = parseInt(c.slice(4, 6), 16)
  if (Number.isNaN(r) || Number.isNaN(g) || Number.isNaN(b)) return null
  return [r, g, b]
}

function channelsToHex(rgb: [number, number, number]): string {
  return '#' + rgb
    .map((v) => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, '0'))
    .join('')
}

/** Versão pastel da cor do serviço (mistura com branco). Inválida → cinza-gelo. */
export function pastelOf(serviceColor?: string | null, mix: number = PASTEL_MIX): string {
  if (!serviceColor) return '#f4f4f6'
  const rgb = hexChannels(serviceColor)
  if (!rgb) return '#f4f4f6'
  return channelsToHex([
    rgb[0] + (255 - rgb[0]) * mix,
    rgb[1] + (255 - rgb[1]) * mix,
    rgb[2] + (255 - rgb[2]) * mix,
  ])
}

/** Cor da faixa lateral do clean: a cor crua, escurecida quando já é clara. */
export function stripOf(serviceColor?: string | null): string {
  if (!serviceColor) return 'rgba(0,0,0,0.28)'
  const rgb = hexChannels(serviceColor)
  if (!rgb) return 'rgba(0,0,0,0.28)'
  if (relativeLuminance(serviceColor) <= STRIP_LUMA_FLOOR) return serviceColor
  return channelsToHex([
    rgb[0] * (1 - STRIP_DARKEN),
    rgb[1] * (1 - STRIP_DARKEN),
    rgb[2] * (1 - STRIP_DARKEN),
  ])
}

/** Tinta do modo clean — fundo pastel é sempre claro → tinta sempre escura. */
export function inkForPastel(): CardInk {
  return DARK_INK
}
