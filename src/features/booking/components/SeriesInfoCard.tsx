'use client'
// src/features/booking/components/SeriesInfoCard.tsx
// @eligi:series-info-card
//
// Faixa "Agendamento recorrente" no painel do agendamento. Le a serie em
// GET /bookings/series/:id (Owner/Manager). Quem nao tem permissao (403) ve
// so o rotulo, sem as datas: a serie existe, os detalhes sao do gestor.

import { useEffect, useState } from 'react'
import { Repeat } from 'lucide-react'
import dayjs from 'dayjs'
import 'dayjs/locale/pt-br'
import utc from 'dayjs/plugin/utc'
import timezone from 'dayjs/plugin/timezone'
import api from '@/shared/lib/apiClient'
import { colors, typography } from '@/shared/theme'

dayjs.extend(utc)
dayjs.extend(timezone)

interface SeriesItem {
  bookingId:   string
  seriesIndex: number | null
  startAt:     string
  status:      'CONFIRMED' | 'COMPLETED' | 'CANCELED' | 'NO_SHOW'
}

interface SeriesDetail {
  id:            string
  intervalWeeks: number
  plannedCount:  number
  endedAt:       string | null
  items:         SeriesItem[]
}

interface Props {
  seriesId:    string
  seriesIndex: number | null
  bookingId:   string
  /** Muda quando a serie e alterada no painel: forca nova leitura. */
  version:     number
}

export default function SeriesInfoCard({ seriesId, seriesIndex, bookingId, version }: Props) {
  const [series, setSeries] = useState<SeriesDetail | null>(null)
  const [denied, setDenied] = useState(false)

  useEffect(() => {
    let cancelled = false
    api.get(`/bookings/series/${seriesId}`)
      .then(res => { if (!cancelled) { setSeries((res.data?.data ?? res.data) as SeriesDetail); setDenied(false) } })
      .catch((e: { response?: { status?: number } }) => {
        if (cancelled) return
        if (e.response?.status === 403) setDenied(true)
        else console.error('[SeriesInfoCard] GET /bookings/series falhou', { seriesId, status: e.response?.status })
      })
    return () => { cancelled = true }
  }, [seriesId, version])

  const interval = series?.intervalWeeks ?? null
  const freq = interval == null ? null : interval === 1 ? 'Toda semana' : `A cada ${interval} semanas`
  const pos  = seriesIndex != null && series ? `${seriesIndex + 1} de ${series.plannedCount}` : null
  const next = (series?.items ?? [])
    .filter(it => it.status === 'CONFIRMED' && it.bookingId !== bookingId && dayjs(it.startAt).isAfter(dayjs()))
    .slice(0, 3)

  return (
    <div style={{ background: '#fff', borderRadius: 18, border: '1px solid rgba(0,0,0,0.06)', boxShadow: '0 2px 16px rgba(0,0,0,0.06)', padding: '14px 18px', fontFamily: typography.fontFamily }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ width: 36, height: 36, borderRadius: 10, background: colors.slate.subtle, border: `1px solid ${colors.slate.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Repeat size={16} color={colors.slate.dark} strokeWidth={2.2} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: '#0f0f14' }}>Agendamento recorrente</div>
          <div style={{ fontSize: 13, color: colors.gray[700], marginTop: 2 }}>
            {denied
              ? 'Detalhes da série com o dono ou o gerente'
              : series
                ? [freq, pos, series.endedAt ? 'série encerrada' : null].filter(Boolean).join(' · ')
                : 'Carregando a série...'}
          </div>
        </div>
      </div>
      {next.length > 0 && (
        <div style={{ marginTop: 10, paddingTop: 10, borderTop: '1px solid rgba(0,0,0,0.06)' }}>
          <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: '.05em', textTransform: 'uppercase', color: colors.gray[700], marginBottom: 6 }}>Próximas</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {next.map(it => (
              <span key={it.bookingId} style={{ fontSize: 13, fontWeight: 600, color: colors.gray[900], padding: '4px 9px', borderRadius: 8, background: colors.background.page, fontVariantNumeric: 'tabular-nums', textTransform: 'capitalize' }}>
                {dayjs(it.startAt).tz('America/Sao_Paulo').locale('pt-br').format('ddd DD/MM')}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
