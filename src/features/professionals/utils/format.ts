// src/features/professionals/utils/format.ts

import { CommissionType } from '../types'

/** Iniciais (até 2 letras) */
export function getInitials(name: string): string {
  return name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase()
}

/** Duração em minutos → "30min", "1h", "1h 30min" */
export function fmtDuration(min: number): string {
  if (min < 60) return `${min}min`
  if (min % 60 === 0) return `${min / 60}h`
  return `${Math.floor(min / 60)}h ${min % 60}min`
}

/** Preço em BRL ou string vazia */
export function fmtPrice(p?: number | null): string {
  if (p == null) return ''
  return `R$ ${p.toFixed(2).replace('.', ',')}`
}

/** Formata valor de comissão pra exibição.
 *  PERCENT: "50%"
 *  FIXED:   "R$ 30,00"
 */
export function fmtCommission(type: CommissionType | null | undefined, value: number | null | undefined): string {
  if (type == null || value == null) return ''
  if (type === 'PERCENT') return `${value % 1 === 0 ? value.toFixed(0) : value.toFixed(1)}%`
  return `R$ ${value.toFixed(2).replace('.', ',')}`
}

/** Gera horários no formato HH:MM com step de 30min (0-24h) */
export function generateTimeOptions(): string[] {
  const opts: string[] = []
  for (let h = 0; h < 24; h++) {
    for (let m = 0; m < 60; m += 30) {
      opts.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`)
    }
  }
  return opts
}
