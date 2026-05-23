// src/features/agenda/utils/layout.ts

import { AgendaBooking } from '../types'
import { toMinutes } from './time'

/**
 * Calcula posicionamento horizontal de bookings sobrepostos.
 * Retorna {col, totalCols} para cada booking.id — divide em N colunas
 * o mais "denso" grupo de sobreposições.
 */
export function computeOverlapLayout(bookings: AgendaBooking[]): Map<string, { col: number; totalCols: number }> {
  const result = new Map<string, { col: number; totalCols: number }>()
  const sorted = [...bookings].sort((a, b) => toMinutes(a.start) - toMinutes(b.start))
  const groups: AgendaBooking[][] = []

  for (const b of sorted) {
    let placed = false
    for (const g of groups) {
      const overlaps = g.some(x => toMinutes(b.start) < toMinutes(x.end) && toMinutes(b.end) > toMinutes(x.start))
      if (overlaps) {
        g.push(b)
        placed = true
        break
      }
    }
    if (!placed) groups.push([b])
  }

  for (const g of groups) {
    g.forEach((b, col) => result.set(b.id, { col, totalCols: g.length }))
  }
  return result
}

/**
 * Calcula as zonas fora do horário de funcionamento para overlay visual.
 * Retorna {preH, postTop, postH, closed} em px.
 */
export function computeOffHoursOverlay(opts: {
  workingHours: { open: boolean; startTime: string; endTime: string } | undefined
  startMin:     number
  endHour:      number
  totalH:       number
  pxPerMin:     number
}): { preH: number; postTop: number; postH: number; closed: boolean } {
  const { workingHours, startMin, endHour, totalH, pxPerMin } = opts
  const closed = !!workingHours && !workingHours.open
  const wStart = workingHours?.open ? toMinutes(workingHours.startTime) : startMin
  const wEnd   = workingHours?.open ? toMinutes(workingHours.endTime)   : endHour * 60
  const preH    = Math.max(0, (wStart - startMin) * pxPerMin)
  const postTop = Math.max(0, (wEnd   - startMin) * pxPerMin)
  const postH   = Math.max(0, totalH - postTop)
  return { preH, postTop, postH, closed }
}

/**
 * Deduplica bookings por id mantendo a primeira ocorrência.
 */
export function uniqueBookings(bookings: AgendaBooking[]): AgendaBooking[] {
  const seen = new Set<string>()
  return bookings.filter(b => {
    if (seen.has(b.id)) return false
    seen.add(b.id)
    return true
  })
}
