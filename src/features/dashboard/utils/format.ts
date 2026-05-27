// src/features/dashboard/utils/format.ts

export function fmtBRL(v: number): string {
  return `R$ ${v.toFixed(2).replace('.', ',')}`
}

/** Formato compacto pra KPIs grandes (R$ 4.200,00 → R$ 4,2k) */
export function fmtBRLCompact(v: number): string {
  if (v >= 1000) {
    const k = v / 1000
    return `R$ ${k.toFixed(k >= 10 ? 0 : 1).replace('.', ',')}k`
  }
  return `R$ ${Math.round(v)}`
}

export function fmtGrowth(growth: number | null): { text: string; positive: boolean | null } {
  if (growth == null) return { text: 'novo', positive: null }
  const sign     = growth > 0 ? '+' : ''
  const rounded  = Math.round(growth * 10) / 10
  const text     = `${sign}${rounded}%`
  return { text, positive: growth > 0 ? true : growth < 0 ? false : null }
}

export function fmtPercent(v: number): string {
  return `${Math.round(v)}%`
}

const WEEKDAYS_FULL = ['Domingo','Segunda','Terça','Quarta','Quinta','Sexta','Sábado']

export function todayFull(): string {
  const d = new Date()
  return `${WEEKDAYS_FULL[d.getDay()]}, ${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()}`
}

export function periodLabel(period: 'today' | '7d' | '30d'): string {
  if (period === 'today') return 'Hoje'
  if (period === '7d')    return 'Últimos 7 dias'
  return 'Últimos 30 dias'
}

export function periodCompareLabel(period: 'today' | '7d' | '30d'): string {
  if (period === 'today') return 'vs ontem'
  if (period === '7d')    return 'vs 7d anteriores'
  return 'vs 30d anteriores'
}
