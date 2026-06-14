// src/features/reports/components/panels/FluxoCaixaPanel.tsx
'use client'

import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts'
import { ArrowDown, ArrowUp } from 'lucide-react'
import { useReportData } from '../../hooks/useReportData'
import { GLASS_CARD } from '../../constants'
import type { FluxoCaixaData } from '../../types'

const IN = '#1D9E75'
const OUT = '#dc2626'
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

function Card({ label, value, valueColor = '#0c0c12', children }: {
  label: string; value: string; valueColor?: string; children?: React.ReactNode
}) {
  return (
    <div style={{ ...GLASS_CARD, padding: '16px 18px' }}>
      <div style={{ fontSize: 12, color: 'rgba(0,0,0,0.5)', marginBottom: 6 }}>{label}</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 22, fontWeight: 600, color: valueColor, lineHeight: 1.1 }}>{value}</span>
        {children}
      </div>
    </div>
  )
}

function Breakdown({ title, rows, empty }: {
  title: string
  rows: { label: string; valor: number; pct: number; cor: string }[]
  empty: string
}) {
  return (
    <div style={{ ...GLASS_CARD, padding: 18 }}>
      <div style={{ fontSize: 14, fontWeight: 600, color: '#0c0c12', marginBottom: 10 }}>{title}</div>
      {rows.length === 0 ? (
        <div style={{ fontSize: 13, color: 'rgba(0,0,0,0.4)', padding: '6px 0' }}>{empty}</div>
      ) : (
        <>
          <div style={{ display: 'flex', height: 12, borderRadius: 6, overflow: 'hidden', marginBottom: 12 }}>
            {rows.map((r) => (
              <div key={r.label} title={r.label} style={{ width: `${r.pct}%`, background: r.cor }} />
            ))}
          </div>
          {rows.map((r) => (
            <div key={r.label} style={{
              display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0',
              fontSize: 14, borderTop: '0.5px solid rgba(0,0,0,0.06)',
            }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: r.cor, flex: 'none' }} />
              <span style={{ flex: 1, color: '#0c0c12' }}>{r.label}</span>
              <span style={{ width: 56, textAlign: 'right', color: 'rgba(0,0,0,0.5)' }}>{r.pct}%</span>
              <span style={{ width: 110, textAlign: 'right', color: '#0c0c12', fontWeight: 500 }}>{brl(r.valor)}</span>
            </div>
          ))}
        </>
      )}
    </div>
  )
}

export default function FluxoCaixaPanel({ period }: { period: string }) {
  const { data, loading } = useReportData<FluxoCaixaData>('/reports/fluxo-caixa', period)

  if (loading || !data) {
    return <div style={{ padding: 40, textAlign: 'center', color: 'rgba(0,0,0,0.4)' }}>Carregando…</div>
  }

  const { kpis, serie, porPagamento, porCategoria } = data

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0,1fr))', gap: 12 }}>
        <Card label="Entradas" value={brl(kpis.entradas)}>
          <DeltaPill pct={kpis.entradasDelta.pct} />
        </Card>
        <Card label="Saídas" value={brl(kpis.saidas)} />
        <Card label="Saldo" value={brl(kpis.saldo)} valueColor={kpis.saldo >= 0 ? '#0f6e56' : '#a32d2d'} />
        <Card label="Margem" value={`${kpis.margem}%`} />
      </div>

      {/* fluxo mensal */}
      <div style={{ ...GLASS_CARD, padding: 18 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <span style={{ fontSize: 14, fontWeight: 600, color: '#0c0c12' }}>Entradas e saídas por mês</span>
          <span style={{ display: 'flex', gap: 14, fontSize: 12, color: 'rgba(0,0,0,0.55)' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <span style={{ width: 9, height: 9, borderRadius: 2, background: IN }} />Entradas
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <span style={{ width: 9, height: 9, borderRadius: 2, background: OUT }} />Saídas
            </span>
          </span>
        </div>
        <div style={{ width: '100%', height: 200 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={serie} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
              <XAxis dataKey="mes" tick={{ fontSize: 10, fill: 'rgba(0,0,0,0.4)' }} axisLine={false} tickLine={false} />
              <YAxis hide />
              <Tooltip
                formatter={(value) => brl(typeof value === 'number' ? value : 0)}
                contentStyle={{ borderRadius: 12, border: '0.5px solid rgba(0,0,0,0.1)', fontSize: 12 }}
              />
              <Bar dataKey="entradas" name="Entradas" fill={IN} radius={[3, 3, 0, 0]} maxBarSize={16} />
              <Bar dataKey="saidas" name="Saídas" fill={OUT} radius={[3, 3, 0, 0]} maxBarSize={16} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <Breakdown title="Entradas por forma de pagamento" rows={porPagamento} empty="Nenhuma entrada no período." />
      <Breakdown title="Saídas por categoria" rows={porCategoria} empty="Nenhuma despesa no período." />
    </div>
  )
}
