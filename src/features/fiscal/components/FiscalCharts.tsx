// src/features/fiscal/components/FiscalCharts.tsx
'use client'

import { TrendingUp, ChartPie } from 'lucide-react'
import { card, ink, tone, label, body, h3, numeric, SERIES, MONTHS, brl, compact } from '../ui'
import type { FiscalSummary } from '../types'

interface Props {
  summary: FiscalSummary
}

/**
 * Barras em SVG (não canvas/lib): traço fino, controle total do raio e do
 * espaçamento. Meses sem nota viram um traço de 3px — o eixo continua
 * completo e a leitura não engana.
 */
export default function FiscalCharts({ summary }: Props) {
  const max = Math.max(...summary.monthly.map((m) => m.total), 1)
  const curIdx = summary.current.month - 1

  const W = 620
  const H = 150
  const step = W / 12
  const barW = 7

  // donut: circunferência de r=44 ≈ 276.5
  const C = 2 * Math.PI * 44
  const totalSlices = summary.byService.reduce((s, x) => s + x.count, 0) || 1

  // ⚠️ offsets DERIVADOS antes do render. Acumular com `let` dentro do
  // .map() é mutação durante a renderização (react-hooks/immutability).
  const arcs = summary.byService.reduce<Array<{ name: string; len: number; offset: number }>>(
    (acc, s) => {
      const prev = acc[acc.length - 1]
      const offset = prev ? prev.offset + prev.len : 0
      return [...acc, { name: s.name, len: (s.count / totalSlices) * C, offset }]
    },
    [],
  )

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1.7fr) minmax(0,1fr)', gap: 14, marginBottom: 14 }}>
      {/* ── faturamento mensal ── */}
      <div style={{ ...card, padding: '26px 30px', minWidth: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 12 }}>
          <span style={{ ...h3, display: 'flex', alignItems: 'center', gap: 8 }}>
            <TrendingUp size={15} color={tone.red} strokeWidth={1.75} />
            Faturamento com nota
          </span>
          <span style={{ ...body, fontSize: 12 }}>
            {summary.year} · <span style={numeric}>{brl(summary.yearTotal)}</span>
          </span>
        </div>

        <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 150, marginTop: 14, overflow: 'visible' }}>
          <line x1="0" y1="10" x2={W} y2="10" stroke="rgba(0,0,0,.05)" strokeWidth="1" />
          <line x1="0" y1="70" x2={W} y2="70" stroke="rgba(0,0,0,.05)" strokeWidth="1" />
          <line x1="0" y1="130" x2={W} y2="130" stroke="rgba(0,0,0,.08)" strokeWidth="1" />
          {summary.monthly.map((m, i) => {
            const h = m.total > 0 ? Math.max(6, (m.total / max) * 106) : 3
            const x = i * step + step / 2 - barW / 2
            const y = 130 - h
            const isCur = i === curIdx
            return (
              <g key={m.month}>
                <rect
                  x={x}
                  y={y}
                  width={barW}
                  height={h}
                  rx={barW / 2}
                  fill={isCur ? tone.red : m.total > 0 ? 'rgba(8,8,11,.22)' : 'rgba(8,8,11,.10)'}
                />
                {m.total > 0 && (
                  <text
                    x={x + barW / 2}
                    y={y - 8}
                    textAnchor="middle"
                    fontSize="10.5"
                    fontWeight={isCur ? 600 : 400}
                    fill={isCur ? tone.red : 'rgba(8,8,11,.45)'}
                    fontFamily="inherit"
                  >
                    {compact(m.total)}
                  </text>
                )}
              </g>
            )
          })}
        </svg>

        <div style={{ display: 'flex', marginTop: 8 }}>
          {MONTHS.map((mo, i) => (
            <span
              key={mo}
              style={{
                flex: 1,
                textAlign: 'center',
                fontSize: 10.5,
                letterSpacing: '0.03em',
                textTransform: 'uppercase',
                color: i === curIdx ? tone.red : ink.faint,
                fontWeight: i === curIdx ? 600 : 400,
              }}
            >
              {mo}
            </span>
          ))}
        </div>
      </div>

      {/* ── notas por serviço ── */}
      <div style={{ ...card, padding: '26px 28px', minWidth: 0 }}>
        <span style={{ ...h3, display: 'flex', alignItems: 'center', gap: 8 }}>
          <ChartPie size={15} color={tone.violet} strokeWidth={1.75} />
          Notas por serviço
        </span>

        {summary.byService.length === 0 ? (
          <div style={{ ...body, fontSize: 12.5, marginTop: 22 }}>
            Nenhuma nota emitida neste mês ainda.
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: 24, marginTop: 20 }}>
            <svg width="104" height="104" viewBox="0 0 104 104" style={{ flexShrink: 0 }}>
              <circle cx="52" cy="52" r="44" fill="none" stroke="rgba(0,0,0,.05)" strokeWidth="6" />
              {arcs.map((a, i) => (
                <circle
                  key={a.name}
                  cx="52"
                  cy="52"
                  r="44"
                  fill="none"
                  stroke={SERIES[i % SERIES.length]}
                  strokeWidth="6"
                  strokeLinecap="round"
                  strokeDasharray={`${Math.max(0, a.len - 3)} ${C}`}
                  strokeDashoffset={-a.offset}
                  transform="rotate(-90 52 52)"
                />
              ))}
              <text x="52" y="50" textAnchor="middle" fontSize="22" fontWeight="600" fill={ink.strong} fontFamily="inherit" letterSpacing="-1">
                {summary.current.count}
              </text>
              <text x="52" y="64" textAnchor="middle" fontSize="9.5" fill={ink.faint} fontFamily="inherit">
                notas
              </text>
            </svg>

            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 11, minWidth: 0 }}>
              {summary.byService.slice(0, 4).map((s, i) => (
                <div key={s.name} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 12.5 }}>
                  <span style={{ width: 7, height: 7, borderRadius: 2, background: SERIES[i % SERIES.length], flexShrink: 0 }} />
                  <span style={{ flex: 1, color: ink.mid, letterSpacing: '-0.01em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {s.name}
                  </span>
                  <b style={{ fontWeight: 500, ...numeric, color: ink.strong }}>{s.count}</b>
                </div>
              ))}
            </div>
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 24, paddingTop: 20, borderTop: `0.5px solid ${ink.hair}` }}>
          <div>
            <div style={label}>Ticket médio</div>
            <div style={{ fontSize: 19, fontWeight: 600, marginTop: 7, ...numeric, color: ink.strong }}>
              {brl(summary.current.ticketMedio)}
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={label}>Maior nota</div>
            <div style={{ fontSize: 19, fontWeight: 600, marginTop: 7, ...numeric, color: ink.strong }}>
              {brl(summary.current.maiorNota)}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
