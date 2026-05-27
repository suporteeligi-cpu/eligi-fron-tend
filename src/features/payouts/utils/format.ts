// src/features/payouts/utils/format.ts
import { PayoutFrequency, PayoutMethod, PayoutStatus } from '../types'

const WEEKDAYS = [
  'Domingo', 'Segunda', 'Terça', 'Quarta',
  'Quinta', 'Sexta', 'Sábado',
] as const

/** "WEEKLY" + weekday=2 → "Semanal · toda terça" */
export function freqLabel(
  freq: PayoutFrequency,
  weekday: number | null,
  monthDay: number | null,
): string {
  if (freq === 'WEEKLY') {
    const wd = weekday != null ? WEEKDAYS[weekday] : ''
    return `Semanal · toda ${wd?.toLowerCase()}-feira`
  }
  if (freq === 'BIWEEKLY') {
    const wd = weekday != null ? WEEKDAYS[weekday] : ''
    return `Quinzenal · ${wd?.toLowerCase()}`
  }
  if (freq === 'MONTHLY') {
    const d = monthDay ?? 1
    return `Mensal · todo dia ${d}`
  }
  return ''
}

export function freqShortLabel(freq: PayoutFrequency): string {
  if (freq === 'WEEKLY')   return 'Semanal'
  if (freq === 'BIWEEKLY') return 'Quinzenal'
  if (freq === 'MONTHLY')  return 'Mensal'
  return ''
}

export function methodLabel(method: PayoutMethod | null | undefined): string {
  if (!method) return '—'
  if (method === 'PIX')       return 'PIX'
  if (method === 'CASH')      return 'Dinheiro'
  if (method === 'TRANSFER')  return 'Transferência'
  return 'Outros'
}

export function statusLabel(status: PayoutStatus): string {
  if (status === 'PENDING')  return 'Pendente'
  if (status === 'PAID')     return 'Pago'
  if (status === 'CANCELED') return 'Cancelado'
  return status
}

/**
 * Formata um período em PT-BR.
 * Ex: 01/05/2026 → 14/05/2026 → "01–14 de mai/2026"
 *     01/04/2026 → 14/05/2026 → "01/abr – 14/mai/2026"
 *     01/01/2025 → 14/05/2026 → "01/jan/2025 – 14/mai/2026"
 */
export function fmtPayoutPeriod(startISO: string, endISO: string): string {
  const s = new Date(startISO)
  const e = new Date(endISO)

  const months = [
    'jan', 'fev', 'mar', 'abr', 'mai', 'jun',
    'jul', 'ago', 'set', 'out', 'nov', 'dez',
  ]

  const sDay = s.getDate()
  const eDay = e.getDate()
  const sMonth = months[s.getMonth()]
  const eMonth = months[e.getMonth()]
  const sYear = s.getFullYear()
  const eYear = e.getFullYear()

  if (sYear === eYear && sMonth === eMonth) {
    return `${String(sDay).padStart(2,'0')}–${String(eDay).padStart(2,'0')} de ${sMonth}/${eYear}`
  }
  if (sYear === eYear) {
    return `${String(sDay).padStart(2,'0')}/${sMonth} – ${String(eDay).padStart(2,'0')}/${eMonth}/${eYear}`
  }
  return `${String(sDay).padStart(2,'0')}/${sMonth}/${sYear} – ${String(eDay).padStart(2,'0')}/${eMonth}/${eYear}`
}

export function fmtDateBR(iso: string | null): string {
  if (!iso) return '—'
  const d = new Date(iso)
  return d.toLocaleDateString('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
  })
}

export function fmtDateTimeBR(iso: string | null): string {
  if (!iso) return '—'
  const d = new Date(iso)
  return d.toLocaleString('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

export function fmtBRL(v: number): string {
  return `R$ ${v.toFixed(2).replace('.', ',')}`
}

/** Conta dias entre uma data e hoje. Útil pra "X dias acumulados". */
export function daysSince(iso: string | null): number {
  if (!iso) return 0
  const past = new Date(iso).getTime()
  const now = Date.now()
  return Math.max(0, Math.floor((now - past) / (1000 * 60 * 60 * 24)))
}
