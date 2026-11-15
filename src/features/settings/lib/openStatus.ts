// src/features/settings/lib/openStatus.ts
// @eligi:open-status
// "Aberto agora / Fechado · abre ..." da previa do perfil. Copia de
// front-end-public/src/lib/hours.ts (computeStatus): a previa precisa dizer o
// mesmo que o link. Mudou la, muda aqui.

export interface OpenHour {
  weekday: number
  startTime: string
  endTime: string
}

export interface OpenStatus {
  open: boolean
  label: string
  sub: string
}

const WEEKDAY_FULL: Record<number, string> = {
  0: 'domingo', 1: 'segunda', 2: 'terça', 3: 'quarta', 4: 'quinta', 5: 'sexta', 6: 'sábado',
}

function toMin(t: string): number {
  const [h, m] = t.split(':').map((n) => parseInt(n, 10))
  return (h || 0) * 60 + (m || 0)
}

function nowInTz(tz: string, now: Date): { weekday: number; minutes: number } {
  try {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: tz, weekday: 'short', hour: '2-digit', minute: '2-digit', hour12: false,
    }).formatToParts(now)
    const map: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 }
    let wd = 0, h = 0, m = 0
    for (const p of parts) {
      if (p.type === 'weekday') wd = map[p.value] ?? 0
      else if (p.type === 'hour') h = parseInt(p.value, 10) % 24
      else if (p.type === 'minute') m = parseInt(p.value, 10)
    }
    return { weekday: wd, minutes: h * 60 + m }
  } catch {
    return { weekday: now.getDay(), minutes: now.getHours() * 60 + now.getMinutes() }
  }
}

/** `now` vem de quem chama: a funcao nao le relogio (pura). */
export function openStatus(hours: OpenHour[], tz: string, now: Date): OpenStatus | null {
  if (!hours || hours.length === 0) return null
  const { weekday, minutes } = nowInTz(tz, now)
  const byDay = (d: number) => hours.find((h) => h.weekday === d) ?? null

  const todayH = byDay(weekday)
  if (todayH && minutes >= toMin(todayH.startTime) && minutes < toMin(todayH.endTime)) {
    return { open: true, label: 'Aberto agora', sub: `Hoje · ${todayH.startTime}–${todayH.endTime} · fecha às ${todayH.endTime}` }
  }
  for (let i = 0; i < 7; i++) {
    const d = (weekday + i) % 7
    const dh = byDay(d)
    if (!dh) continue
    if (i === 0) {
      if (minutes < toMin(dh.startTime)) return { open: false, label: 'Fechado', sub: `Abre hoje às ${dh.startTime}` }
      continue
    }
    const when = i === 1 ? 'amanhã' : WEEKDAY_FULL[d]
    return { open: false, label: 'Fechado', sub: `Abre ${when} às ${dh.startTime}` }
  }
  return { open: false, label: 'Fechado', sub: '' }
}
