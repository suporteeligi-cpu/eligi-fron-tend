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