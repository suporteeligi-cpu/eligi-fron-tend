// src/features/dashboard/utils/format.ts

// @eligi:money-intl
// Separador de milhar via Intl: `toFixed(2).replace('.', ',')` produzia
// "R$ 14950,00" — num painel financeiro o olho tropeca no numero sem ponto.
// Escopo desta correcao: SO o dashboard. Existem outras 12 copias de fmtBRL
// no repo (expenses, payouts, sales-report, checkout, eligiclub, packages,
// assinatura) com tres contratos diferentes — consolidar tudo e refactor
// proprio, nao carona de fatia de UI.
const BRL = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })

export function fmtBRL(v: number): string {
  return BRL.format(v)
}

/** Formato compacto pra KPIs grandes (R$ 4.200,00 → R$ 4,2k) */
export function fmtBRLCompact(v: number): string {
  if (v >= 1000) {
    const k = v / 1000
    return `R$ ${k.toFixed(k >= 10 ? 0 : 1).replace('.', ',')}k`
  }
  return BRL.format(v)
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
