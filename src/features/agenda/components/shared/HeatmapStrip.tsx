'use client'
// src/features/agenda/components/shared/HeatmapStrip.tsx
// Strip de coluna recolhida: ocupação do dia em faixas de 30min (rampa do vermelho eligi).

import { useMemo } from 'react'
import { colors } from '@/shared/theme'
import { toMinutes } from '../../utils/time'
import { AgendaBooking } from '../../types'

interface Props {
  bookings: AgendaBooking[]
  startMin: number
  endHour:  number
  totalH:   number
  pxPerMin: number
}

const BAND = 30 // minutos por faixa

export default function HeatmapStrip({ bookings, startMin, endHour, totalH, pxPerMin }: Props) {
  const bands = useMemo(() => {
    const endMin = endHour * 60
    const n = Math.max(1, Math.ceil((endMin - startMin) / BAND))
    const occ = new Array(n).fill(0) as number[]
    for (const b of bookings) {
      const s = toMinutes(b.start)
      const e = toMinutes(b.end)
      for (let i = 0; i < n; i++) {
        const bandStart = startMin + i * BAND
        const bandEnd   = bandStart + BAND
        const overlap = Math.min(e, bandEnd) - Math.max(s, bandStart)
        if (overlap > 0) occ[i] += overlap
      }
    }
    return occ.map(mins => Math.max(0, Math.min(1, mins / BAND)))
  }, [bookings, startMin, endHour])

  return (
    <div style={{ position: 'absolute', inset: 0, height: totalH, display: 'flex', flexDirection: 'column' }}>
      {bands.map((intensity, i) => (
        <div key={i} style={{
          height: BAND * pxPerMin,
          background: intensity === 0
            ? 'rgba(0,0,0,0.03)'
            : `rgba(220,38,38,${0.12 + intensity * 0.6})`,
          borderTop: `1px solid ${colors.gray.border}`,
        }} />
      ))}
    </div>
  )
}
