// src/features/extended-hours/api.ts
// @eligi:xh-fe-api — Modo Dezembro: contrato com GET/PUT /extended-hours e
// contas de data pura ("YYYY-MM-DD"). O "hoje" vem SEMPRE do back (dto.today):
// Date.now() no render quebra a pureza do React Compiler e erra o fuso.
import api from '@/shared/lib/apiClient'

export type XhRule = {
  active: boolean
  startDate: string
  endDate: string
  limitTime: string
  professionalIds: string[]
  openLinkUntilEnd: boolean
}

export type XhProfessional = { id: string; name: string; avatarUrl: string | null; closesAt: string | null }

export type XhDto = {
  config: (XhRule & { activatedAt: string | null }) | null
  defaults: { startDate: string; endDate: string; limitTime: string }
  professionals: XhProfessional[]
  baseMaxFutureDays: number
  today: string
  linkCoversEnd: boolean
}

/** O link publico mostra no maximo 90 dias (front-end-public). */
export const LINK_MAX_DAYS = 90
/** Mesmo teto do back (XH_MAX_PERIOD_DAYS). */
export const XH_MAX_PERIOD_DAYS = 92
/** A pilula aparece a partir de ~45 dias antes do periodo padrao. */
export const XH_SEASON_LEAD_DAYS = 45

function unwrap<T>(r: { data?: { data?: T } | T }): T {
  const d = r.data as { data?: T } | undefined
  return (d && typeof d === 'object' && 'data' in d ? d.data : r.data) as T
}

export function fetchXh(): Promise<XhDto> {
  return api.get('/extended-hours').then((r) => unwrap<XhDto>(r))
}

export function saveXh(rule: XhRule): Promise<XhDto> {
  return api.put('/extended-hours', rule).then((r) => unwrap<XhDto>(r))
}

/** Mensagem do back (422 com o motivo) ou texto padrao. */
export function errorText(e: unknown): string {
  const data = (e as { response?: { data?: { message?: string; error?: string } } })?.response?.data
  return data?.message || data?.error || 'Não salvou. Tente de novo.'
}

/** Status HTTP de um erro do axios (ou null). */
export function errorStatus(e: unknown): number | null {
  const s = (e as { response?: { status?: number } })?.response?.status
  return typeof s === 'number' ? s : null
}

const toUtc = (d: string) => {
  const [y, m, day] = d.split('-').map(Number)
  return Date.UTC(y, m - 1, day)
}

/** Dias de calendario entre duas datas puras (b - a). */
export function daysBetween(a: string, b: string): number {
  return Math.round((toUtc(b) - toUtc(a)) / 86_400_000)
}

export function addDays(d: string, n: number): string {
  return new Date(toUtc(d) + n * 86_400_000).toISOString().slice(0, 10)
}

/** "2026-12-31" -> "31/12" */
export function ddmm(d: string): string {
  return `${d.slice(8, 10)}/${d.slice(5, 7)}`
}

export function hhmmToMin(t: string): number {
  const [h, m] = t.split(':').map(Number)
  return h * 60 + m
}

export function minToHhmm(m: number): string {
  return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`
}

/** Dias que o link mostra hoje pela regra do lojista (valor antigo 365 vale 90). */
export function linkDays(base: number): number {
  return Math.min(base, LINK_MAX_DAYS)
}

/** A regra do lojista ja alcanca o ultimo dia do periodo? */
export function linkCovers(dto: Pick<XhDto, 'baseMaxFutureDays' | 'today'>, endDate: string): boolean {
  return daysBetween(dto.today, endDate) <= linkDays(dto.baseMaxFutureDays)
}

/** O modo esta ligado e o periodo ainda nao acabou? */
export function isRunning(dto: XhDto): boolean {
  return !!dto.config?.active && dto.today <= dto.config.endDate
}

/** Epoca de mostrar o convite (pilula pulsando) na agenda. */
export function inSeason(dto: XhDto): boolean {
  return dto.today <= dto.defaults.endDate && daysBetween(dto.today, dto.defaults.startDate) <= XH_SEASON_LEAD_DAYS
}

export function initials(name: string): string {
  const p = name.trim().split(/\s+/)
  return ((p[0]?.[0] ?? '') + (p.length > 1 ? p[p.length - 1][0] : (p[0]?.[1] ?? ''))).toUpperCase()
}

/** Foto valida para <img> (URL https ou imagem embutida legada); resto vira iniciais. */
export function avatarSrc(url: string | null): string | null {
  return url && /^(https:\/\/|data:image\/)/.test(url) ? url : null
}
