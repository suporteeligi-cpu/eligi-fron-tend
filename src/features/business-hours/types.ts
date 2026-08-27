// src/features/business-hours/types.ts
// @eligi:business-hours-types
//
// Horario de funcionamento do estabelecimento. weekday segue a convencao do
// JS Date: 0 = domingo ... 6 = sabado, igual ao que GET /business-hours devolve.

export interface HourSlot {
  weekday:   number
  open:      boolean
  startTime: string
  endTime:   string
}

export const DAY_NAMES = [
  'Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira',
  'Quinta-feira', 'Sexta-feira', 'Sábado',
] as const

export const DAY_SHORT = ['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB'] as const

/** Passo do stepper. 15 min cobre o que os salons usam sem virar maratona de cliques. */
export const STEP_MINUTES = 15

/** 'HH:mm' -> minutos desde a meia-noite. Retorna NaN em entrada invalida. */
export function toMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number)
  if (Number.isNaN(h) || Number.isNaN(m)) return Number.NaN
  return h * 60 + m
}

/** minutos -> 'HH:mm', com volta ao inicio do dia (0..1439). */
export function toTime(minutes: number): string {
  const total = ((minutes % 1440) + 1440) % 1440
  const h = Math.floor(total / 60)
  const m = total % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

export function shiftTime(time: string, delta: number): string {
  const base = toMinutes(time)
  if (Number.isNaN(base)) return time
  return toTime(base + delta)
}

/** Duracao do dia em minutos. Zero quando o intervalo e invalido. */
export function slotMinutes(slot: HourSlot): number {
  if (!slot.open) return 0
  const diff = toMinutes(slot.endTime) - toMinutes(slot.startTime)
  return Number.isNaN(diff) || diff <= 0 ? 0 : diff
}

/** 10h, 9h30 ou 45m. Traco quando nao ha duracao valida. */
export function durationLabel(minutes: number): string {
  if (minutes <= 0) return '—'
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  if (h > 0 && m > 0) return `${h}h${m}`
  if (h > 0) return `${h}h`
  return `${m}m`
}

export function isSlotInvalid(slot: HourSlot): boolean {
  if (!slot.open) return false
  const start = toMinutes(slot.startTime)
  const end   = toMinutes(slot.endTime)
  return Number.isNaN(start) || Number.isNaN(end) || start >= end
}

export function weeklyMinutes(slots: HourSlot[]): number {
  return slots.reduce((sum, slot) => sum + slotMinutes(slot), 0)
}
