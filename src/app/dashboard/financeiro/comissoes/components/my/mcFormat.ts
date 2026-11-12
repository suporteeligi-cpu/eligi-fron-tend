// src/app/dashboard/financeiro/comissoes/components/my/mcFormat.ts
// @eligi:mc-d-format — formatacao e contas puras da tela "Minhas comissoes"
// (direcao D "Central", nov/2026). Nada aqui le relogio: quem precisa do
// "agora" recebe o instante em que o dado chegou (loadedAt).

export const TZ = 'America/Sao_Paulo'

export const MONTHS = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez']
export const WEEKDAYS = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb']

/** 1234.5 -> "1.234,50" */
export function brl(v: number): string {
  return (v ?? 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

/** "R$ 1.234" e ",50" separados (centavos em corpo menor) */
export function brlParts(v: number): { int: string; cents: string } {
  const [int, cents = '00'] = brl(v).split(',')
  return { int, cents }
}

/** "YYYY-MM-DD" do instante no fuso de Sao Paulo */
export function dayKeySP(d: Date | string | number): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(d))
}

/** "YYYY-MM" do instante no fuso de Sao Paulo */
export function monthKeySP(d: Date | string | number): string {
  return dayKeySP(d).slice(0, 7)
}

/** dia da semana (0=dom) de uma chave "YYYY-MM-DD" */
export function weekdayOfKey(key: string): number {
  return new Date(`${key}T12:00:00Z`).getUTCDay()
}

export function addDaysKey(key: string, n: number): string {
  const d = new Date(`${key}T12:00:00Z`)
  d.setUTCDate(d.getUTCDate() + n)
  return d.toISOString().slice(0, 10)
}

export function daysBetweenKeys(a: string, b: string): number {
  return Math.round((Date.parse(`${b}T12:00:00Z`) - Date.parse(`${a}T12:00:00Z`)) / 86_400_000)
}

/** "12 nov" */
export function shortDate(key: string): string {
  const [, m, d] = key.split('-').map(Number)
  return `${d} ${MONTHS[m - 1]}`
}

/** "qui, 12 nov" */
export function weekdayDate(key: string): string {
  return `${WEEKDAYS[weekdayOfKey(key)]}, ${shortDate(key)}`
}

/** "02–05 nov" | "28 out – 02 nov" (intervalo de chaves, ja no fuso) */
export function rangeLabel(startKey: string, endKey: string): string {
  const [, sm, sd] = startKey.split('-').map(Number)
  const [, em, ed] = endKey.split('-').map(Number)
  const p = (n: number) => String(n).padStart(2, '0')
  if (startKey === endKey) return `${p(sd)} ${MONTHS[sm - 1]}`
  if (sm === em) return `${p(sd)}–${p(ed)} ${MONTHS[em - 1]}`
  return `${p(sd)} ${MONTHS[sm - 1]} – ${p(ed)} ${MONTHS[em - 1]}`
}

/** "fev 2024" */
export function monthLabel(key: string): string {
  const [y, m] = key.split('-').map(Number)
  return `${MONTHS[m - 1]} ${y}`
}

export function shiftMonth(key: string, n: number): string {
  const [y, m] = key.split('-').map(Number)
  const t = y * 12 + (m - 1) + n
  return `${Math.floor(t / 12)}-${String((t % 12) + 1).padStart(2, '0')}`
}

/** variacao percentual inteira; null quando a base e zero */
export function pctDelta(base: number, value: number): number | null {
  if (!base) return null
  return Math.round(((value - base) / base) * 100)
}

export interface TrackInfo {
  /** quantidade de dias do periodo */
  n: number
  /** indice do dia de hoje (−1 antes do periodo, n depois dele) */
  todayIdx: number
  startKey: string
  endKey: string
  /** dias que faltam ate o fim (0 = ultimo dia); null quando ja fechou */
  left: number | null
}

/** andamento do periodo, a partir do instante em que o dado chegou */
export function periodTrack(periodStart: string, periodEnd: string, loadedAt: number): TrackInfo {
  const startKey = dayKeySP(periodStart)
  const endKey = dayKeySP(periodEnd)
  const n = Math.max(1, daysBetweenKeys(startKey, endKey) + 1)
  const todayKey = dayKeySP(loadedAt)
  const todayIdx = daysBetweenKeys(startKey, todayKey)
  const left = todayIdx >= 0 && todayIdx < n ? n - 1 - todayIdx : null
  return { n, todayIdx, startKey, endKey, left }
}
