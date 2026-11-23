// src/features/vacations/api.ts
// @eligi:vac-fe-api — Modo Ferias no painel: tipos, chamadas e datas.
// Contrato do back: /vacations (dono e gerente), ver @eligi:doc-vac no CLAUDE.md.
// Datas sao puras ("YYYY-MM-DD") no fuso do negocio e as duas pontas contam.
import api from '@/shared/lib/apiClient'

export type Vacation = {
  id: string
  professionalId: string
  startDate: string
  endDate: string
  days: number
  returnDate: string
}

export type VacationList = { today: string; upcoming: Vacation[]; past: Vacation[] }

export type VacationConflict = {
  bookingId: string
  startAt: string
  clientName: string
  serviceName: string
  extraServices: number
}

export type VacationOverlap = {
  professionalId: string
  professionalName: string
  startDate: string
  endDate: string
  shared: { startDate: string; endDate: string }
}

export type VacationPreview = {
  today: string
  error: string | null
  message: string | null
  days?: number
  returnDate?: string
  conflicts: VacationConflict[]
  overlaps: VacationOverlap[]
}

export type VacationRange = { professionalId: string; startDate: string; endDate: string }

/** Mesmo teto do back (VACATION_MAX_DAYS). */
export const VACATION_MAX_DAYS = 90
export const DURATIONS = [7, 10, 15, 30] as const

type Envelope<T> = { data?: T } & T

function unwrap<T>(body: Envelope<T>): T {
  return (body.data ?? body) as T
}

export function fetchVacations(professionalId: string): Promise<VacationList> {
  return api
    .get('/vacations', { params: { professionalId } })
    .then((r) => unwrap<VacationList>(r.data))
}

export function previewVacation(body: VacationRange & { excludeId?: string }): Promise<VacationPreview> {
  return api.post('/vacations/preview', body).then((r) => unwrap<VacationPreview>(r.data))
}

export function saveVacation(body: VacationRange, id: string | null): Promise<Vacation> {
  const req = id ? api.put(`/vacations/${id}`, body) : api.post('/vacations', body)
  return req.then((r) => unwrap<Vacation>(r.data))
}

export function deleteVacation(id: string): Promise<void> {
  return api.delete(`/vacations/${id}`).then(() => undefined)
}

/* ── erros ──────────────────────────────────────────────────────────────── */

type ErrBody = { code?: string; message?: string; error?: string; conflicts?: VacationConflict[] }

export function errorBody(e: unknown): { status: number | null; body: ErrBody } {
  const r = (e as { response?: { status?: number; data?: ErrBody } })?.response
  return { status: r?.status ?? null, body: r?.data ?? {} }
}

/** Mensagem para a pessoa. Nunca o texto cru do servidor quando ele nao vier. */
export function errorMessage(e: unknown, fallback: string): string {
  const { status, body } = errorBody(e)
  if (status === null) return 'Sem conexão. Confira a internet e tente de novo.'
  if (status === 403) return 'Só o dono e o gerente mexem nas férias.'
  return body.message ?? body.error ?? fallback
}

/* ── datas puras ────────────────────────────────────────────────────────── */

function utc(d: string): Date {
  return new Date(`${d}T12:00:00Z`)
}

export function addDays(d: string, n: number): string {
  return new Date(utc(d).getTime() + n * 86_400_000).toISOString().slice(0, 10)
}

export function daysInclusive(a: string, b: string): number {
  return Math.round((utc(b).getTime() - utc(a).getTime()) / 86_400_000) + 1
}

const MONTH = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short', timeZone: 'UTC' })
const WEEK = new Intl.DateTimeFormat('pt-BR', { weekday: 'short', timeZone: 'UTC' })
const WEEK_LONG = new Intl.DateTimeFormat('pt-BR', { weekday: 'long', timeZone: 'UTC' })
const YEAR = new Intl.DateTimeFormat('pt-BR', { year: 'numeric', timeZone: 'UTC' })

/** "02 jan" */
export function dayMonth(d: string): string {
  return MONTH.format(utc(d)).replace('.', '').replace(' de ', ' ')
}

/** "dd/mm" */
export function ddmm(d: string): string {
  return `${d.slice(8, 10)}/${d.slice(5, 7)}`
}

/** "sáb, 02/01" */
export function weekDdmm(d: string): string {
  return `${WEEK.format(utc(d)).replace('.', '')}, ${ddmm(d)}`
}

/** "sábado" */
export function weekday(d: string): string {
  return WEEK_LONG.format(utc(d))
}

/** "02 jan – 16 jan" (+ ano quando nao e o de hoje). */
export function rangeLabel(a: string, b: string, today: string): string {
  const yr = a.slice(0, 4) !== today.slice(0, 4) || b.slice(0, 4) !== today.slice(0, 4)
  const base = `${dayMonth(a)} – ${dayMonth(b)}`
  return yr ? `${base} ${YEAR.format(utc(b))}` : base
}

/** Horario de um conflito no fuso do negocio: "sáb 02/01 · 10:00". */
export function conflictWhen(iso: string, tz = 'America/Sao_Paulo'): string {
  const d = new Date(iso)
  const w = new Intl.DateTimeFormat('pt-BR', { weekday: 'short', timeZone: tz }).format(d).replace('.', '')
  const dm = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', timeZone: tz }).format(d)
  const hm = new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: tz }).format(d)
  return `${w} ${dm} · ${hm}`
}

/** Dia local (fuso do negocio) de um horario: "YYYY-MM-DD". */
export function localDay(iso: string, tz = 'America/Sao_Paulo'): string {
  const p = new Intl.DateTimeFormat('en-CA', { year: 'numeric', month: '2-digit', day: '2-digit', timeZone: tz }).formatToParts(new Date(iso))
  const g = (t: string) => p.find((x) => x.type === t)?.value ?? ''
  return `${g('year')}-${g('month')}-${g('day')}`
}
