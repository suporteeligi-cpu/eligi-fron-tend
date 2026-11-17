// src/app/dashboard/financeiro/comissoes/components/owner/tcFormat.ts
// @eligi:tcf-format — contas puras dos comparativos da equipe. Nada le relogio.

import { brl } from '../my/mcFormat'
import type { TcMetric, TcStats } from './tcTypes'

export function metricValue(s: TcStats, m: TcMetric): number | null {
  const v = s[m.key] as number | null
  return v == null ? null : v
}

/** "R$ 1.234,50" | "142" | "64%" | "—" */
export function fmtMetric(v: number | null, m: TcMetric): string {
  if (v == null) return '—'
  if (m.kind === 'money') return `R$ ${brl(v)}`
  if (m.kind === 'pct') return `${Math.round(v)}%`
  return String(Math.round(v))
}

export interface Delta {
  /** variacao em % (para % e diferenca em pontos) */
  text: string
  /** true = melhorou, false = piorou, null = igual ou sem base */
  good: boolean | null
  /** valor usado para ordenar "o que mais caiu" (negativo = piorou) */
  score: number
}

/**
 * Variacao do valor `v` contra a referencia `ref`. Indicador em % compara em
 * pontos ("+4 pts"); os outros em % ("+18%"). "Faltas": cair e bom.
 */
export function delta(v: number | null, ref: number | null, m: TcMetric): Delta | null {
  if (v == null || ref == null) return null
  const sign = m.better === 'up' ? 1 : -1
  if (m.kind === 'pct') {
    const d = Math.round(v - ref)
    return { text: `${d > 0 ? '+' : d < 0 ? '−' : ''}${Math.abs(d)} pts`, good: d === 0 ? null : d * sign > 0, score: d * sign }
  }
  if (ref === 0) {
    if (v === 0) return { text: '0%', good: null, score: 0 }
    return { text: 'novo', good: v * sign > 0, score: v * sign > 0 ? 100 : -100 }
  }
  const p = Math.round(((v - ref) / Math.abs(ref)) * 100)
  return { text: `${p > 0 ? '+' : p < 0 ? '−' : ''}${Math.abs(p)}%`, good: p === 0 ? null : p * sign > 0, score: p * sign }
}

export interface Verdict {
  improved: number
  compared: number
  /** indicador que mais piorou (null = nenhum piorou) */
  worst: TcMetric | null
}

export function verdict(focus: TcStats, ref: TcStats, metrics: TcMetric[]): Verdict {
  let improved = 0
  let compared = 0
  let worst: { m: TcMetric; score: number } | null = null
  for (const m of metrics) {
    const d = delta(metricValue(focus, m), metricValue(ref, m), m)
    if (!d || d.good == null) continue
    compared++
    if (d.good) improved++
    else if (!worst || d.score < worst.score) worst = { m, score: d.score }
  }
  return { improved, compared, worst: worst?.m ?? null }
}

/** Soma da comissao por semana do mes (dias 1-7, 8-14, ...). */
export function weeks(daily: number[]): number[] {
  const out: number[] = []
  for (let i = 0; i < daily.length; i += 7) out.push(daily.slice(i, i + 7).reduce((t, v) => t + v, 0))
  return out
}

/**
 * Forca de 0 a 1 de um valor dentro da equipe naquele indicador (1 = melhor).
 * Usada para a cor da celula da matriz; o melhor tambem leva estrela, nunca so cor.
 */
export function strength(v: number | null, all: Array<number | null>, m: TcMetric): number {
  if (v == null) return 0
  const vals = all.filter((x): x is number => x != null)
  if (vals.length === 0) return 0
  if (m.better === 'up') {
    const max = Math.max(...vals)
    return max > 0 ? v / max : 0
  }
  const min = Math.min(...vals)
  if (v === 0) return 1
  return min / v
}

export function isBest(v: number | null, all: Array<number | null>, m: TcMetric): boolean {
  const vals = all.filter((x): x is number => x != null)
  if (v == null || vals.length < 2) return false
  const best = m.better === 'up' ? Math.max(...vals) : Math.min(...vals)
  if (m.better === 'up' && best === 0) return false
  return v === best
}

export function firstName(name: string): string {
  return name.trim().split(/\s+/)[0] || name
}
