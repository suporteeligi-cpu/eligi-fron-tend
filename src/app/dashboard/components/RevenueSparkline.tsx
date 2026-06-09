'use client'
// src/app/dashboard/components/RevenueSparkline.tsx

import { useEffect, useRef } from 'react'
import { TrendingUp } from 'lucide-react'
import { colors, typography, radius, shadows } from '@/shared/theme'
import { RevenueChartPoint } from '@/features/dashboard/types'
import { fmtBRL } from '@/features/dashboard/utils/format'

interface Props {
  data:     RevenueChartPoint[]
  isMobile: boolean
}

declare global {
  interface Window {
    Chart: any // eslint-disable-line @typescript-eslint/no-explicit-any
  }
}

const CDN = 'https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.js'

function loadChartJs(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (window.Chart) { resolve(); return }
    const s = document.createElement('script')
    s.src   = CDN
    s.onload  = () => resolve()
    s.onerror = () => reject(new Error('Chart.js failed to load'))
    document.head.appendChild(s)
  })
}

export default function RevenueSparkline({ data }: Props) {
  const canvasRef  = useRef<HTMLCanvasElement>(null)
  const chartRef   = useRef<any>(null)         // eslint-disable-line @typescript-eslint/no-explicit-any

  const total = data.reduce((s, d) => s + d.value, 0)

  useEffect(() => {
    let cancelled = false

    loadChartJs().then(() => {
      if (cancelled || !canvasRef.current) return

      // destrói instância anterior se existir
      if (chartRef.current) {
        chartRef.current.destroy()
        chartRef.current = null
      }

      const isDark = matchMedia('(prefers-color-scheme: dark)').matches
      const lineC  = colors.red.DEFAULT
      const labelC = isDark ? 'rgba(255,255,255,0.40)' : 'rgba(0,0,0,0.35)'

      chartRef.current = new window.Chart(canvasRef.current, {
        type: 'line',
        data: {
          labels:   data.map(d => d.label),
          datasets: [{
            data:                 data.map(d => d.value),
            borderColor:          lineC,
            borderWidth:          2,
            pointRadius:          3,
            pointBackgroundColor: '#fff',
            pointBorderColor:     lineC,
            pointBorderWidth:     2,
            pointHoverRadius:     5,
            tension:              0.35,
            fill:                 true,
            backgroundColor:      isDark
              ? 'rgba(220,38,38,0.10)'
              : 'rgba(220,38,38,0.07)',
          }],
        },
        options: {
          responsive:          true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            tooltip: {
              callbacks: {
                label: (c: { parsed: { y: number } }) => `R$ ${Math.round(c.parsed.y).toLocaleString('pt-BR')}`,
              },
              backgroundColor: isDark ? '#1e1e1e' : '#fff',
              borderColor:     isDark ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.10)',
              borderWidth:     0.5,
              titleColor:      isDark ? '#fff' : '#111',
              bodyColor:       lineC,
              padding:         8,
              cornerRadius:    6,
            },
          },
          scales: {
            x: {
              grid:   { display: false },
              border: { display: false },
              ticks:  {
                font:     { size: 10 },
                color:    labelC,
                maxRotation: 0,
              },
            },
            y: {
              display: false,
              grid:    { display: false },
            },
          },
        },
      })
    }).catch(console.error)

    return () => {
      cancelled = true
      chartRef.current?.destroy()
      chartRef.current = null
    }
  }, [data])

  return (
    <div style={{
      background:   '#fff',
      border:       `0.5px solid ${colors.gray.borderMd}`,
      borderLeft:   `2.5px solid ${colors.red.DEFAULT}`,
      borderRadius: radius.lg,
      boxShadow:    shadows.sm,
      padding:      '16px 20px',
      fontFamily:   typography.fontFamily,
      display:      'flex',
      flexDirection: 'column',
      gap:          14,
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{
          width:          24,
          height:         24,
          borderRadius:   7,
          background:     colors.red.gradient,
          display:        'flex',
          alignItems:     'center',
          justifyContent: 'center',
        }}>
          <TrendingUp size={12} color="#fff" strokeWidth={2.4} />
        </div>
        <div>
          <div style={{
            fontSize:      10,
            fontWeight:    typography.weight.bold,
            color:         typography.color.muted,
            textTransform: 'uppercase',
            letterSpacing: '.07em',
          }}>
            Receita · Últimos 7 dias
          </div>
          <div style={{
            fontSize:           typography.scale.base,
            fontWeight:         typography.weight.bold,
            color:              typography.color.primary,
            fontVariantNumeric: 'tabular-nums',
          }}>
            {fmtBRL(total)}
          </div>
        </div>
      </div>

      {/* Canvas */}
      <div style={{ position: 'relative', width: '100%', height: 90 }}>
        <canvas
          ref={canvasRef}
          role="img"
          aria-label="Gráfico de receita dos últimos 7 dias"
        >
          {data.map(d => `${d.label}: R$${Math.round(d.value)}`).join(', ')}
        </canvas>
      </div>
    </div>
  )
}
