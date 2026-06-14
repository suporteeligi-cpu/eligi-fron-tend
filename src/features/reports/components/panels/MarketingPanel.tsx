// src/features/reports/components/panels/MarketingPanel.tsx
'use client'

import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell } from 'recharts'
import { ArrowDown, ArrowUp } from 'lucide-react'
import { useMarketing } from '../../hooks/useMarketing'
import { GLASS_CARD, ONLINE, ONLINE_HI } from '../../constants'

// cores do canal online (ONLINE/ONLINE_HI) vêm de constants
const MANUAL = '#B4B2A9'

const brl = (n: number) => n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

function DeltaPill({ pct }: { pct: number }) {
  const up = pct >= 0
  const color = up ? '#0f6e56' : '#a32d2d'
  const bg = up ? 'rgba(29,158,117,0.12)' : 'rgba(220,38,38,0.10)'
  const Icon = up ? ArrowUp : ArrowDown
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: 11, fontWeight: 600,
      color, background: bg, borderRadius: 8, padding: '2px 7px',
    }}>
      <Icon size={11} /> {Math.abs(pct)}%
    </span>
  )
}

function Kpi({ label, value, children }: { label: string; value: string; children?: React.ReactNode }) {
  return (
    <div style={{ ...GLASS_CARD, padding: '16px 18px' }}>
      <div style={{ fontSize: 12, color: 'rgba(0,0,0,0.5)', marginBottom: 6 }}>{label}</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 24, fontWeight: 600, color: '#0c0c12', lineHeight: 1.1 }}>{value}</span>
        {children}
      </div>
    </div>
  )
}

function ini(s: string) {
  return s.split(' ').slice(0, 2).map((w) => w[0]).join('').toUpperCase()
}

export default function MarketingPanel({ period }: { period: string }) {
  const { data, loading } = useMarketing(period)

  if (loading || !data) {
    return <div style={{ padding: 40, textAlign: 'center', color: 'rgba(0,0,0,0.4)' }}>Carregando…</div>
  }

  const { kpis, serieOnline, origem, topClientes } = data
  const totalOrigem = origem.online + origem.manual
  const onlinePctOrigem = totalOrigem > 0 ? Math.round((origem.online / totalOrigem) * 100) : 0
  const lastIdx = serieOnline.reduce((acc, d, i) => (d.total != null ? i : acc), -1)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0,1fr))', gap: 12 }}>
        <Kpi label="Agendamentos online" value={String(kpis.agendamentosOnline)}>
          <DeltaPill pct={kpis.agendamentosOnlineDelta.pct} />
        </Kpi>
        <Kpi label="Receita online" value={brl(kpis.receitaOnline)}>
          <span style={{ fontSize: 12, color: 'rgba(0,0,0,0.4)' }}>{kpis.receitaOnlinePct}% do fat.</span>
        </Kpi>
        <Kpi label="Novos clientes via link" value={String(kpis.novosClientesLink)} />
        <Kpi label="Escolheram o profissional" value={`${kpis.escolheuProfissionalPct}%`} />
      </div>

      {/* gráfico de barras */}
      <div style={{ ...GLASS_CARD, padding: 18 }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: '#0c0c12', marginBottom: 8 }}>
          Agendamentos pelo link por mês
        </div>
        <div style={{ width: '100%', height: 200 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={serieOnline} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
              <XAxis dataKey="mes" tick={{ fontSize: 10, fill: 'rgba(0,0,0,0.4)' }} axisLine={false} tickLine={false} />
              <YAxis hide />
              <Tooltip
                formatter={(value) => [`${value ?? 0} agendamentos`, 'Online']}
                contentStyle={{ borderRadius: 12, border: '0.5px solid rgba(0,0,0,0.1)', fontSize: 12 }}
              />
              <Bar dataKey="total" radius={[4, 4, 0, 0]} maxBarSize={34}>
                {serieOnline.map((_, i) => (
                  <Cell key={i} fill={i === lastIdx ? ONLINE_HI : ONLINE} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* origem online vs manual */}
      <div style={{ ...GLASS_CARD, padding: 18 }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: '#0c0c12', marginBottom: 10 }}>
          Origem dos agendamentos
        </div>
        <div style={{ display: 'flex', height: 12, borderRadius: 6, overflow: 'hidden', marginBottom: 12 }}>
          <div style={{ width: `${onlinePctOrigem}%`, background: ONLINE }} />
          <div style={{ width: `${100 - onlinePctOrigem}%`, background: MANUAL }} />
        </div>
        <div style={{ display: 'flex', gap: 18, fontSize: 13, color: 'rgba(0,0,0,0.55)' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 10, height: 10, borderRadius: 2, background: ONLINE }} />
            Online · {origem.online} ({onlinePctOrigem}%)
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 10, height: 10, borderRadius: 2, background: MANUAL }} />
            Manual · {origem.manual} ({100 - onlinePctOrigem}%)
          </span>
        </div>
      </div>

      {/* top clientes do link */}
      <div style={{ ...GLASS_CARD, padding: 18 }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: '#0c0c12', marginBottom: 8 }}>
          Top clientes do link
        </div>
        {topClientes.length === 0 ? (
          <div style={{ fontSize: 13, color: 'rgba(0,0,0,0.4)', padding: '8px 0' }}>
            Nenhum agendamento online neste período.
          </div>
        ) : (
          topClientes.map((c, i) => (
            <div
              key={i}
              style={{
                display: 'flex', alignItems: 'center', gap: 12, padding: '9px 0',
                fontSize: 14, borderTop: '0.5px solid rgba(0,0,0,0.06)',
              }}
            >
              <div style={{
                width: 32, height: 32, borderRadius: '50%', flex: 'none',
                background: 'rgba(124,58,237,0.14)', color: '#6D28D9',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 12, fontWeight: 600,
              }}>
                {ini(c.nome)}
              </div>
              <span style={{ flex: 1, color: '#0c0c12' }}>{c.nome}</span>
              <span style={{ color: 'rgba(0,0,0,0.5)', width: 90, textAlign: 'right' }}>{c.reservas} reservas</span>
              <span style={{ color: '#0c0c12', width: 100, textAlign: 'right', fontWeight: 500 }}>{brl(c.receita)}</span>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
