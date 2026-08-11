// src/features/fiscal/ui.ts
// Tokens da central de Notas Fiscais (direção "Instrumento").
// Premium minimalista: hairlines, peso 600, tracking apertado, cor escassa.
import type { CSSProperties } from 'react'

export const ink = {
  strong: '#08080b',
  mid: 'rgba(8,8,11,0.62)',
  faint: 'rgba(8,8,11,0.38)',
  hair: 'rgba(0,0,0,0.055)',
  hair2: 'rgba(0,0,0,0.09)',
} as const

export const tone = {
  red: '#dc2626',
  green: '#0f7a5f',
  amber: '#b06a00',
  blue: '#1d4ed8',
  violet: '#6d28d9',
} as const

/** Paleta do donut — ordem fixa para o gráfico e a legenda não divergirem. */
export const SERIES = [tone.red, tone.violet, tone.blue, tone.green, tone.amber, '#64748b'] as const

export const card: CSSProperties = {
  background: '#fff',
  border: `0.5px solid ${ink.hair}`,
  borderRadius: 20,
  boxShadow: '0 1px 2px rgba(0,0,0,0.03), 0 8px 24px -12px rgba(0,0,0,0.06)',
}

export const label: CSSProperties = {
  fontSize: 11,
  fontWeight: 500,
  letterSpacing: '0.04em',
  textTransform: 'uppercase',
  color: ink.faint,
}

export const body: CSSProperties = {
  fontSize: 13.5,
  color: ink.mid,
  lineHeight: 1.55,
  letterSpacing: '-0.005em',
}

export const h2: CSSProperties = { fontSize: 19, fontWeight: 600, letterSpacing: '-0.025em', color: ink.strong }
export const h3: CSSProperties = { fontSize: 15, fontWeight: 600, letterSpacing: '-0.015em', color: ink.strong }

/** Números: sempre tabular, sempre tracking apertado. */
export const numeric: CSSProperties = { fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.03em' }

export const btn: CSSProperties = {
  background: '#fff',
  border: `0.5px solid ${ink.hair2}`,
  color: ink.strong,
  fontSize: 12.5,
  fontWeight: 500,
  padding: '9px 16px',
  borderRadius: 10,
  cursor: 'pointer',
  fontFamily: 'inherit',
  letterSpacing: '-0.01em',
}

export const brl = (v: number) =>
  v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

/** Valor grande com centavos discretos: R$ 505 (grande) + ,00 (menor, cinza) */
export function splitBRL(v: number): { int: string; cents: string } {
  const s = Math.abs(v).toFixed(2)
  const [i, c] = s.split('.')
  return { int: Number(i).toLocaleString('pt-BR'), cents: `,${c}` }
}

export const compact = (v: number) =>
  v >= 1_000_000
    ? `${(v / 1_000_000).toLocaleString('pt-BR', { maximumFractionDigits: 1 })} mi`
    : v >= 1000
      ? `${Math.round(v / 1000)} mil`
      : String(Math.round(v))

export const MONTHS = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'] as const
