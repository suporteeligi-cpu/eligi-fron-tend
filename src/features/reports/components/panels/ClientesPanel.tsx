// src/features/reports/components/panels/ClientesPanel.tsx
'use client'

import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts'
import { useReportData } from '../../hooks/useReportData'
import { GLASS_CARD } from '../../constants'
import type { ClientesData } from '../../types'

const NOVOS = '#1D9E75'
const REC = '#185FA5'
const brl = (n: number) => n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

function Kpi({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ ...GLASS_CARD, padding: '16px 18px' }}>
      <div style={{ fontSize: 12, color: 'rgba(0,0,0,0.5)', marginBottom: 6 }}>{label}</div>
      <div style={{ fontSize: 24, fontWeight: 600, color: '#0c0c12', lineHeight: 1.1 }}>{value}</div>
    </div>
  )
}

function ini(s: string) {
  return s.split(' ').slice(0, 2).map((w) => w[0]).join('').toUpperCase()
}

export default function ClientesPanel({ period }: { period: string }) {
  const { data, loading } = useReportData<ClientesData>('/reports/clientes', period)

  if (loading || !data) {
    return <div style={{ padding: 40, textAlign: 'center', color: 'rgba(0,0,0,0.4)' }}>Carregando…</div>
  }

  const { kpis, serie, receitaPorTipo, topClientes } = data
  const recTotal = receitaPorTipo.novos + receitaPorTipo.recorrentes
  const novosPct = recTotal > 0 ? Math.round((receitaPorTipo.novos / recTotal) * 100) : 0

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0,1fr))', gap: 12 }}>
        <Kpi label="Clientes ativos no mês" value={String(kpis.ativos)} />
        <Kpi label="Novos" value={String(kpis.novos)} />
        <Kpi label="Recorrentes" value={String(kpis.recorrentes)} />
        <Kpi label="Ticket médio" value={brl(kpis.ticketMedio)} />
      </div>

      {/* novos vs recorrentes por mês */}
      <div style={{ ...GLASS_CARD, padding: 18 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <span style={{ fontSize: 14, fontWeight: 600, color: '#0c0c12' }}>Novos e recorrentes por mês</span>
          <span style={{ display: 'flex', gap: 14, fontSize: 12, color: 'rgba(0,0,0,0.55)' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <span style={{ width: 9, height: 9, borderRadius: 2, background: NOVOS }} />Novos
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <span style={{ width: 9, height: 9, borderRadius: 2, background: REC }} />Recorrentes
            </span>
          </span>
        </div>
        <div style={{ width: '100%', height: 200 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={serie} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
              <XAxis dataKey="mes" tick={{ fontSize: 10, fill: 'rgba(0,0,0,0.4)' }} axisLine={false} tickLine={false} />
              <YAxis hide />
              <Tooltip contentStyle={{ borderRadius: 12, border: '0.5px solid rgba(0,0,0,0.1)', fontSize: 12 }} />
              <Bar dataKey="novos" name="Novos" fill={NOVOS} radius={[3, 3, 0, 0]} maxBarSize={16} />
              <Bar dataKey="recorrentes" name="Recorrentes" fill={REC} radius={[3, 3, 0, 0]} maxBarSize={16} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* receita por tipo de cliente */}
      <div style={{ ...GLASS_CARD, padding: 18 }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: '#0c0c12', marginBottom: 10 }}>
          Receita por tipo de cliente
        </div>
        <div style={{ display: 'flex', height: 12, borderRadius: 6, overflow: 'hidden', marginBottom: 12 }}>
          <div style={{ width: `${novosPct}%`, background: NOVOS }} />
          <div style={{ width: `${100 - novosPct}%`, background: REC }} />
        </div>
        <div style={{ display: 'flex', gap: 18, fontSize: 13, color: 'rgba(0,0,0,0.55)' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 10, height: 10, borderRadius: 2, background: NOVOS }} />
            Novos · {brl(receitaPorTipo.novos)} ({novosPct}%)
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 10, height: 10, borderRadius: 2, background: REC }} />
            Recorrentes · {brl(receitaPorTipo.recorrentes)} ({100 - novosPct}%)
          </span>
        </div>
      </div>

      {/* top clientes */}
      <div style={{ ...GLASS_CARD, padding: 18 }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: '#0c0c12', marginBottom: 8 }}>
          Top clientes por receita
        </div>
        {topClientes.length === 0 ? (
          <div style={{ fontSize: 13, color: 'rgba(0,0,0,0.4)', padding: '8px 0' }}>Sem clientes no período.</div>
        ) : (
          topClientes.map((c, i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', gap: 12, padding: '9px 0',
              fontSize: 14, borderTop: '0.5px solid rgba(0,0,0,0.06)',
            }}>
              <div style={{
                width: 32, height: 32, borderRadius: '50%', flex: 'none',
                background: 'rgba(24,95,165,0.12)', color: '#185FA5',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 12, fontWeight: 600,
              }}>
                {ini(c.nome)}
              </div>
              <span style={{ flex: 1, color: '#0c0c12' }}>{c.nome}</span>
              <span style={{ width: 90, textAlign: 'right', color: 'rgba(0,0,0,0.5)' }}>{c.reservas} reservas</span>
              <span style={{ width: 100, textAlign: 'right', color: '#0c0c12', fontWeight: 500 }}>{brl(c.receita)}</span>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
