// src/features/reports/components/panels/EstoquePanel.tsx
'use client'

import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts'
import { useReportData } from '../../hooks/useReportData'
import { GLASS_CARD } from '../../constants'
import type { EstoqueData } from '../../types'

const IN = '#1D9E75'
const OUT = '#EF9F27'
const brl = (n: number) => n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

function Kpi({ label, value, alert }: { label: string; value: string; alert?: boolean }) {
  return (
    <div style={{ ...GLASS_CARD, padding: '16px 18px' }}>
      <div style={{ fontSize: 12, color: 'rgba(0,0,0,0.5)', marginBottom: 6 }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 600, color: alert ? '#a32d2d' : '#0c0c12', lineHeight: 1.1 }}>{value}</div>
    </div>
  )
}

export default function EstoquePanel({ period }: { period: string }) {
  const { data, loading } = useReportData<EstoqueData>('/reports/estoque', period)

  if (loading || !data) {
    return <div style={{ padding: 40, textAlign: 'center', color: 'rgba(0,0,0,0.4)' }}>Carregando…</div>
  }

  const { kpis, movimentacao, baixoEstoque, topValor } = data

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0,1fr))', gap: 12 }}>
        <Kpi label="Unidades em estoque" value={String(kpis.unidades)} />
        <Kpi label="Valor do estoque" value={brl(kpis.valor)} />
        <Kpi label="Vendidos no mês" value={String(kpis.vendidosMes)} />
        <Kpi label="Baixo estoque" value={String(kpis.baixoEstoque)} alert={kpis.baixoEstoque > 0} />
      </div>

      {/* movimentação */}
      <div style={{ ...GLASS_CARD, padding: 18 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <span style={{ fontSize: 14, fontWeight: 600, color: '#0c0c12' }}>Movimentação por mês (unidades)</span>
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
            <BarChart data={movimentacao} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
              <XAxis dataKey="mes" tick={{ fontSize: 10, fill: 'rgba(0,0,0,0.4)' }} axisLine={false} tickLine={false} />
              <YAxis hide />
              <Tooltip contentStyle={{ borderRadius: 12, border: '0.5px solid rgba(0,0,0,0.1)', fontSize: 12 }} />
              <Bar dataKey="entradas" name="Entradas" fill={IN} radius={[3, 3, 0, 0]} maxBarSize={16} />
              <Bar dataKey="saidas" name="Saídas" fill={OUT} radius={[3, 3, 0, 0]} maxBarSize={16} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* baixo estoque */}
      <div style={{ ...GLASS_CARD, padding: 18 }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: '#0c0c12', marginBottom: 8 }}>
          Produtos com baixo estoque
        </div>
        {baixoEstoque.length === 0 ? (
          <div style={{ fontSize: 13, color: 'rgba(0,0,0,0.4)', padding: '6px 0' }}>Nenhum produto abaixo do alerta. 👍</div>
        ) : (
          baixoEstoque.map((p, i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0',
              fontSize: 14, borderTop: '0.5px solid rgba(0,0,0,0.06)',
            }}>
              <span style={{ flex: 1, color: '#0c0c12' }}>{p.nome}</span>
              <span style={{ width: 120, textAlign: 'right', color: '#a32d2d', fontWeight: 500 }}>
                {p.estoque} {p.alerta != null ? `/ alerta ${p.alerta}` : ''}
              </span>
            </div>
          ))
        )}
      </div>

      {/* top por valor */}
      <div style={{ ...GLASS_CARD, padding: 18 }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: '#0c0c12', marginBottom: 8 }}>
          Maior valor parado em estoque
        </div>
        {topValor.length === 0 ? (
          <div style={{ fontSize: 13, color: 'rgba(0,0,0,0.4)', padding: '6px 0' }}>
            Sem valor de estoque (defina o custo dos produtos para calcular).
          </div>
        ) : (
          topValor.map((p, i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0',
              fontSize: 14, borderTop: '0.5px solid rgba(0,0,0,0.06)',
            }}>
              <span style={{ flex: 1, color: '#0c0c12' }}>{p.nome}</span>
              <span style={{ width: 90, textAlign: 'right', color: 'rgba(0,0,0,0.5)' }}>{p.estoque} un.</span>
              <span style={{ width: 110, textAlign: 'right', color: '#0c0c12', fontWeight: 500 }}>{brl(p.valor)}</span>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
