// src/features/reports/components/panels/ReceitaPanel.tsx
'use client'

import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip } from 'recharts'
import { ArrowDown, ArrowUp } from 'lucide-react'
import { useReportData } from '../../hooks/useReportData'
import { GLASS_CARD, GREEN } from '../../constants'
import type { ReceitaData } from '../../types'

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

function Card({ label, value, children }: { label: string; value: string; children?: React.ReactNode }) {
  return (
    <div style={{ ...GLASS_CARD, padding: '16px 18px' }}>
      <div style={{ fontSize: 12, color: 'rgba(0,0,0,0.5)', marginBottom: 6 }}>{label}</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 22, fontWeight: 600, color: '#0c0c12', lineHeight: 1.1 }}>{value}</span>
        {children}
      </div>
    </div>
  )
}

function Breakdown({ title, rows }: { title: string; rows: { label: string; valor: number; pct: number; cor: string }[] }) {
  if (rows.length === 0) return null
  return (
    <div style={{ ...GLASS_CARD, padding: 18 }}>
      <div style={{ fontSize: 14, fontWeight: 600, color: '#0c0c12', marginBottom: 10 }}>{title}</div>
      <div style={{ display: 'flex', height: 12, borderRadius: 6, overflow: 'hidden', marginBottom: 12 }}>
        {rows.map((r) => <div key={r.label} title={r.label} style={{ width: `${r.pct}%`, background: r.cor }} />)}
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
    </div>
  )
}

function TopList({ title, rows, empty }: { title: string; rows: { nome: string; valor: number }[]; empty: string }) {
  return (
    <div style={{ ...GLASS_CARD, padding: 18 }}>
      <div style={{ fontSize: 14, fontWeight: 600, color: '#0c0c12', marginBottom: 8 }}>{title}</div>
      {rows.length === 0 ? (
        <div style={{ fontSize: 13, color: 'rgba(0,0,0,0.4)', padding: '6px 0' }}>{empty}</div>
      ) : (
        rows.map((r, i) => (
          <div key={i} style={{
            display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0',
            fontSize: 14, borderTop: '0.5px solid rgba(0,0,0,0.06)',
          }}>
            <span style={{ flex: 1, color: '#0c0c12' }}>{r.nome}</span>
            <span style={{ width: 110, textAlign: 'right', color: '#0c0c12', fontWeight: 500 }}>{brl(r.valor)}</span>
          </div>
        ))
      )}
    </div>
  )
}

export default function ReceitaPanel({ period }: { period: string }) {
  const { data, loading } = useReportData<ReceitaData>('/reports/receita', period)

  if (loading || !data) {
    return <div style={{ padding: 40, textAlign: 'center', color: 'rgba(0,0,0,0.4)' }}>Carregando…</div>
  }

  const { kpis, serie, porTipo, porPagamento, topServicos, topProdutos } = data

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0,1fr))', gap: 12 }}>
        <Card label="Receita total" value={brl(kpis.receita)}>
          <DeltaPill pct={kpis.receitaDelta.pct} />
        </Card>
        <Card label="Vendas" value={String(kpis.vendas)} />
        <Card label="Ticket médio" value={brl(kpis.ticketMedio)} />
        <Card label="Descontos" value={brl(kpis.descontos)} />
      </div>

      {/* tendência */}
      <div style={{ ...GLASS_CARD, padding: 18 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <span style={{ fontSize: 14, fontWeight: 600, color: '#0c0c12' }}>Receita por mês</span>
          <span style={{ fontSize: 11, color: GREEN, fontWeight: 600 }}>— Projeção</span>
        </div>
        <div style={{ width: '100%', height: 200 }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={serie} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
              <defs>
                <linearGradient id="recvR" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={GREEN} stopOpacity={0.22} />
                  <stop offset="100%" stopColor={GREEN} stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="mes" tick={{ fontSize: 10, fill: 'rgba(0,0,0,0.4)' }} axisLine={false} tickLine={false} />
              <YAxis hide />
              <Tooltip formatter={(value) => brl(typeof value === 'number' ? value : 0)}
                contentStyle={{ borderRadius: 12, border: '0.5px solid rgba(0,0,0,0.1)', fontSize: 12 }} />
              <Area type="monotone" dataKey="real" stroke={GREEN} strokeWidth={3} fill="url(#recvR)" connectNulls />
              <Area type="monotone" dataKey="projecao" stroke={GREEN} strokeWidth={2.5} strokeDasharray="5 5" fill="url(#recvR)" fillOpacity={0.4} connectNulls />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <Breakdown title="Receita por tipo de venda" rows={porTipo} />
      <Breakdown title="Receita por forma de pagamento" rows={porPagamento} />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        <TopList title="Top serviços" rows={topServicos} empty="Sem serviços no período." />
        <TopList title="Top produtos" rows={topProdutos} empty="Sem produtos no período." />
      </div>
    </div>
  )
}
