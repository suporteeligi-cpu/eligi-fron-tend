// src/features/reports/components/panels/PainelPanel.tsx
'use client'

import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip } from 'recharts'
import { ArrowDown, ArrowUp } from 'lucide-react'
import { useOverview } from '../../hooks/useOverview'
import { ACCENT, GLASS_CARD, ONLINE } from '../../constants'

const brl = (n: number) =>
  n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

function MetricCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div style={{ ...GLASS_CARD, padding: '16px 18px' }}>
      <div style={{ fontSize: 12, color: 'rgba(0,0,0,0.5)', marginBottom: 6 }}>{label}</div>
      <div style={{ fontSize: 26, fontWeight: 600, color: '#0c0c12', lineHeight: 1.1 }}>{value}</div>
      {sub && <div style={{ fontSize: 12, color: 'rgba(0,0,0,0.4)', marginTop: 4 }}>{sub}</div>}
    </div>
  )
}

function DeltaPill({ pct }: { pct: number }) {
  const up = pct >= 0
  const color = up ? '#0f6e56' : '#a32d2d'
  const bg = up ? 'rgba(29,158,117,0.12)' : 'rgba(220,38,38,0.10)'
  const Icon = up ? ArrowUp : ArrowDown
  return (
    <span
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: 11, fontWeight: 600,
        color, background: bg, borderRadius: 8, padding: '2px 7px',
      }}
    >
      <Icon size={11} /> {Math.abs(pct)}%
    </span>
  )
}

export default function PainelPanel({ period }: { period: string }) {
  const { data, loading } = useOverview(period)

  if (loading || !data) {
    return <div style={{ padding: 40, textAlign: 'center', color: 'rgba(0,0,0,0.4)' }}>Carregando…</div>
  }

  const { kpis, serieReceita, receitaPorTipo } = data

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* faixa de KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0,1fr))', gap: 12 }}>
        <div style={{ ...GLASS_CARD, padding: '16px 18px' }}>
          <div style={{ fontSize: 12, color: 'rgba(0,0,0,0.5)', marginBottom: 6 }}>Agendamentos</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 26, fontWeight: 600, color: '#0c0c12', lineHeight: 1.1 }}>
              {kpis.agendamentos}
            </span>
            <DeltaPill pct={kpis.agendamentosDelta.pct} />
          </div>
        </div>
        <div style={{ ...GLASS_CARD, padding: '16px 18px' }}>
          <div style={{ fontSize: 12, color: 'rgba(0,0,0,0.5)', marginBottom: 6 }}>Receita</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 26, fontWeight: 600, color: '#0c0c12', lineHeight: 1.1 }}>
              {brl(kpis.receita)}
            </span>
            <DeltaPill pct={kpis.receitaDelta.pct} />
          </div>
        </div>
        <MetricCard label="Clientes" value={String(kpis.clientes)} sub={`${kpis.clientesNovos} novos`} />
        {/* destaque do canal online (link público = "marketing" no eligi) */}
        <div
          style={{
            ...GLASS_CARD, padding: '16px 18px',
            borderColor: 'rgba(124,58,237,0.3)',
          }}
        >
          <div style={{ fontSize: 12, color: ONLINE, marginBottom: 6, fontWeight: 600 }}>Online (link)</div>
          <div style={{ fontSize: 26, fontWeight: 600, color: '#0c0c12', lineHeight: 1.1 }}>
            {kpis.onlinePct}%
          </div>
          <div style={{ fontSize: 12, color: 'rgba(0,0,0,0.4)', marginTop: 4 }}>do faturamento</div>
        </div>
      </div>

      {/* gráfico de receita */}
      <div style={{ ...GLASS_CARD, padding: 18 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <span style={{ fontSize: 14, fontWeight: 600, color: '#0c0c12' }}>Receita</span>
          <span style={{ fontSize: 11, color: ACCENT, fontWeight: 600 }}>— Projeção</span>
        </div>
        <div style={{ width: '100%', height: 200 }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={serieReceita} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
              <defs>
                <linearGradient id="recv" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={ACCENT} stopOpacity={0.22} />
                  <stop offset="100%" stopColor={ACCENT} stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="mes" tick={{ fontSize: 10, fill: 'rgba(0,0,0,0.4)' }} axisLine={false} tickLine={false} />
              <YAxis hide />
              <Tooltip
                formatter={(v) => brl(Number(v ?? 0))}
                contentStyle={{ borderRadius: 12, border: '0.5px solid rgba(0,0,0,0.1)', fontSize: 12 }}
              />
              <Area type="monotone" dataKey="real" stroke={ACCENT} strokeWidth={3} fill="url(#recv)" connectNulls />
              <Area
                type="monotone" dataKey="projecao" stroke={ACCENT} strokeWidth={2.5}
                strokeDasharray="5 5" fill="url(#recv)" fillOpacity={0.4} connectNulls
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* receita por tipo */}
      <div style={{ ...GLASS_CARD, padding: 18 }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: '#0c0c12', marginBottom: 10 }}>
          Receita por tipo de venda
        </div>
        {/* barra empilhada */}
        <div style={{ display: 'flex', height: 10, borderRadius: 6, overflow: 'hidden', marginBottom: 12 }}>
          {receitaPorTipo.map((r) => (
            <div key={r.tipo} style={{ width: `${r.pct}%`, background: r.cor }} />
          ))}
        </div>
        {receitaPorTipo.map((r) => (
          <div
            key={r.tipo}
            style={{
              display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0',
              fontSize: 13, borderTop: '0.5px solid rgba(0,0,0,0.06)',
            }}
          >
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: r.cor, flex: 'none' }} />
            <span style={{ flex: 1, color: '#0c0c12' }}>{r.tipo}</span>
            <span style={{ color: 'rgba(0,0,0,0.5)', width: 56, textAlign: 'right' }}>
              {r.pct.toFixed(2)}%
            </span>
            <span style={{ color: '#0c0c12', width: 110, textAlign: 'right', fontWeight: 500 }}>
              {brl(r.valor)}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
