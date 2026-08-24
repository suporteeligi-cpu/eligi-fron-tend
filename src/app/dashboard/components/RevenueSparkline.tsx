'use client'
// src/app/dashboard/components/RevenueSparkline.tsx
// @eligi:revenue-recharts
// @eligi:revenue-polish
// Grafico de receita do periodo selecionado.
//
// v2 (fatia 3): Chart.js baixado de CDN em runtime -> Recharts, que ja esta no
// bundle (7 paineis de relatorios usam). O que morreu junto:
//   - script injetado de cdnjs.cloudflare.com (CDN lento = retangulo vazio, sem
//     erro visivel, no dashboard financeiro de cliente pagante)
//   - `declare global { Window { Chart: any } }` — poluia o tipo Window do app
//     inteiro para uso de um componente so
//   - dois eslint-disable de no-explicit-any e a variavel morta `lineC`
//   - o par useRef/useEffect com destroy manual do canvas
//
// Corrigido tambem: o titulo era "Receita · Ultimos 7 dias" fixo, enquanto os
// dados vem escopados pelo period. Em "30 dias" o card mentia o rotulo.

import { TrendingUp } from 'lucide-react'
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
} from 'recharts'

import { typography, radius, shadows, glassCard, inkLight } from '@/shared/theme'
import { RevenueChartPoint, DashboardPeriod } from '@/features/dashboard/types'
import { fmtBRL, periodLabel } from '@/features/dashboard/utils/format'

const DISPLAY_FONT = `'Space Grotesk', ${typography.fontFamily}`

const GREEN      = '#10B981'
const GREEN_DARK = '#0f6e56'
const CHART_H    = 132

interface Props {
  data:   RevenueChartPoint[]
  period: DashboardPeriod
}

export default function RevenueSparkline({ data, period }: Props) {
  const total = data.reduce((sum, d) => sum + d.value, 0)
  const empty = data.length === 0 || total === 0

  // Muitos pontos (30 dias) nao cabem no eixo do celular: mostra so as pontas.
  const denseAxis = data.length > 10

  return (
    <div style={{
      ...glassCard,
      borderRadius:  radius['2xl'],
      boxShadow:     shadows.sm,
      padding:       '16px 18px 12px',
      fontFamily:    typography.fontFamily,
      display:       'flex',
      flexDirection: 'column',
      gap:           10,
    }}>
      {/* cabecalho */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{
          display:      'grid',
          placeItems:   'center',
          width:        32,
          height:       32,
          flexShrink:   0,
          borderRadius: radius.sm,
          background:   inkLight.ok.bg,
        }}>
          <TrendingUp size={15} color={GREEN_DARK} strokeWidth={2.2} />
        </span>

        <span style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
          <span style={{
            fontSize:      10.5,
            fontWeight:    typography.weight.bold,
            color:         inkLight.label,
            textTransform: 'uppercase',
            letterSpacing: '.12em',
          }}>
            Receita · {periodLabel(period)}
          </span>
          <span style={{
            fontFamily:         DISPLAY_FONT,
            fontSize:           22,
            fontWeight:         typography.weight.bold,
            color:              inkLight.strong,
            letterSpacing:      '-.02em',
            lineHeight:         1.05,
            fontVariantNumeric: 'tabular-nums',
          }}>
            {fmtBRL(total)}
          </span>
        </span>
      </div>

      {/* grafico — altura fixa: ResponsiveContainer sem altura definida
          colapsa para 0 no primeiro paint e o card pisca ao trocar de coluna */}
      <div
        style={{ width: '100%', height: CHART_H }}
        role="img"
        aria-label={
          empty
            ? `Sem receita registrada em ${periodLabel(period).toLowerCase()}`
            : `Grafico de receita: ${data.map(d => `${d.label} ${fmtBRL(d.value)}`).join(', ')}`
        }
      >
        {empty ? (
          <div style={{
            display:        'flex',
            alignItems:     'center',
            justifyContent: 'center',
            height:         '100%',
            fontSize:       typography.scale.sm,
            color:          inkLight.label,
          }}>
            Nenhuma receita registrada no período
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            {/* margem lateral de 16: com 6 o primeiro e o ultimo rotulo do
                eixo X eram cortados pela borda do container. */}
            <AreaChart data={data} margin={{ top: 6, right: 16, bottom: 0, left: 16 }}>
              <defs>
                <linearGradient id="eligiRevenueFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%"   stopColor={GREEN} stopOpacity={0.22} />
                  <stop offset="100%" stopColor={GREEN} stopOpacity={0} />
                </linearGradient>
              </defs>

              <XAxis
                dataKey="label"
                tick={{ fontSize: 10, fill: 'rgba(0,0,0,0.42)' }}
                axisLine={false}
                tickLine={false}
                interval={denseAxis ? 'preserveStartEnd' : 0}
                minTickGap={denseAxis ? 24 : 4}
              />
              <YAxis hide domain={[0, 'auto']} />

              <Tooltip
                separator=": "
                cursor={{ stroke: 'rgba(0,0,0,0.12)', strokeWidth: 1 }}
                contentStyle={{
                  borderRadius: 12,
                  border:       '0.5px solid rgba(0,0,0,0.10)',
                  boxShadow:    '0 6px 20px rgba(0,0,0,0.10)',
                  fontSize:     12,
                  padding:      '6px 10px',
                }}
                labelStyle={{ color: 'rgba(0,0,0,0.55)', fontSize: 11, marginBottom: 2 }}
                itemStyle={{ color: GREEN_DARK, fontWeight: 700 }}
                formatter={(value: unknown): [string, string] => {
                  // O Formatter do Recharts admite undefined e array; `unknown`
                  // e o unico parametro assinavel sem cast e sem any.
                  const n = typeof value === 'number' ? value : Number(value)
                  return [fmtBRL(Number.isFinite(n) ? n : 0), 'Receita']
                }}
              />

              <Area
                type="monotone"
                dataKey="value"
                stroke={GREEN}
                strokeWidth={2.5}
                fill="url(#eligiRevenueFill)"
                dot={{ r: 3, fill: '#fff', stroke: GREEN, strokeWidth: 2 }}
                activeDot={{ r: 5, fill: GREEN, stroke: '#fff', strokeWidth: 2 }}
                isAnimationActive={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  )
}
