'use client'
// src/app/dashboard/components/OnlineBanner.tsx

import { Rocket } from 'lucide-react'
import { OnlineBookingsKPI } from '@/features/dashboard/types'

interface Props {
  data:     OnlineBookingsKPI
  isMobile: boolean
}

export default function OnlineBanner({ data, isMobile }: Props) {
  const growthText =
    data.monthGrowth == null
      ? 'novo'
      : data.monthGrowth > 0
        ? `↑ ${data.monthGrowth}%`
        : data.monthGrowth < 0
          ? `↓ ${Math.abs(data.monthGrowth)}%`
          : '—'

  const growthPositive = data.monthGrowth != null && data.monthGrowth > 0

  return (
    <div style={{
      display:      'flex',
      alignItems:   'center',
      gap:          12,
      background:   'rgba(99,102,241,0.08)',
      border:       '0.5px solid rgba(99,102,241,0.25)',
      borderRadius: 10,
      padding:      isMobile ? '10px 12px' : '12px 14px',
    }}>
      <div style={{
        width:          36,
        height:         36,
        borderRadius:   9,
        background:     'rgba(99,102,241,0.12)',
        display:        'flex',
        alignItems:     'center',
        justifyContent: 'center',
        flexShrink:     0,
      }}>
        <Rocket size={18} style={{ color: '#6366f1' }} />
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize:      10,
          textTransform: 'uppercase' as const,
          letterSpacing: '.06em',
          color:         '#7c7fdb',
          marginBottom:  2,
          fontWeight:    500,
        }}>
          Via link online
        </div>

        <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 22, fontWeight: 500, color: '#4f46e5', lineHeight: 1 }}>
            {data.today}
          </span>
          <span style={{
            fontSize:     10,
            background:   'rgba(99,102,241,0.15)',
            color:        '#4338ca',
            padding:      '1px 7px',
            borderRadius: 4,
            fontWeight:   500,
          }}>
            {data.todayPct}% hoje
          </span>
        </div>

        <div style={{ fontSize: 11, color: '#6366f1', marginTop: 3 }}>
          {data.month} este mês
          {data.monthGrowth != null && (
            <span style={{
              marginLeft: 6,
              color:      growthPositive ? '#16a34a' : '#dc2626',
              fontWeight: 500,
            }}>
              {growthText}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
