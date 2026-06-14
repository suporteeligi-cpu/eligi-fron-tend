// src/features/reports/components/panels/AgendamentosPanel.tsx
'use client'

import { ArrowDown, ArrowUp } from 'lucide-react'
import { useReportData } from '../../hooks/useReportData'
import { GLASS_CARD } from '../../constants'
import type { AgendamentosData } from '../../types'

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
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: 24, fontWeight: 600, color: '#0c0c12', lineHeight: 1.1 }}>{value}</span>
        {children}
      </div>
    </div>
  )
}

export default function AgendamentosPanel({ period }: { period: string }) {
  const { data, loading } = useReportData<AgendamentosData>('/reports/agendamentos', period)

  if (loading || !data) {
    return <div style={{ padding: 40, textAlign: 'center', color: 'rgba(0,0,0,0.4)' }}>Carregando…</div>
  }

  const { kpis, status, topServicos } = data
  const totalQ = status.reduce((s, r) => s + r.quantidade, 0)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0,1fr))', gap: 12 }}>
        <Kpi label="Total no mês" value={String(kpis.total)}>
          <DeltaPill pct={kpis.totalDelta.pct} />
        </Kpi>
        <Kpi label="Finalizados" value={String(kpis.finalizados)} />
        <Kpi label="Não compareceram" value={String(kpis.naoCompareceram)} />
        <Kpi label="Cancelados" value={String(kpis.cancelados)} />
      </div>

      {/* status */}
      <div style={{ ...GLASS_CARD, padding: 18 }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: '#0c0c12', marginBottom: 12 }}>
          Status dos agendamentos
        </div>
        <div style={{ display: 'flex', height: 12, borderRadius: 6, overflow: 'hidden', marginBottom: 14 }}>
          {status.filter((r) => r.quantidade > 0).map((r) => (
            <div key={r.status} title={r.label} style={{ width: `${totalQ > 0 ? (r.quantidade / totalQ) * 100 : 0}%`, background: r.cor }} />
          ))}
        </div>
        <div style={{ display: 'flex', fontSize: 12, color: 'rgba(0,0,0,0.4)', paddingBottom: 6 }}>
          <span style={{ flex: 1 }}>Status</span>
          <span style={{ width: 70, textAlign: 'right' }}>Qtd</span>
          <span style={{ width: 60, textAlign: 'right' }}>%</span>
          <span style={{ width: 100, textAlign: 'right' }}>Valor</span>
        </div>
        {status.map((r) => (
          <div key={r.status} style={{
            display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0',
            fontSize: 14, borderTop: '0.5px solid rgba(0,0,0,0.06)',
          }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: r.cor, flex: 'none' }} />
            <span style={{ flex: 1, color: '#0c0c12' }}>{r.label}</span>
            <span style={{ width: 60, textAlign: 'right', color: 'rgba(0,0,0,0.6)' }}>{r.quantidade}</span>
            <span style={{ width: 60, textAlign: 'right', color: 'rgba(0,0,0,0.5)' }}>{r.pct}%</span>
            <span style={{ width: 100, textAlign: 'right', color: '#0c0c12', fontWeight: 500 }}>{brl(r.valor)}</span>
          </div>
        ))}
      </div>

      {/* top serviços */}
      <div style={{ ...GLASS_CARD, padding: 18 }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: '#0c0c12', marginBottom: 8 }}>
          Serviços mais populares
        </div>
        {topServicos.length === 0 ? (
          <div style={{ fontSize: 13, color: 'rgba(0,0,0,0.4)', padding: '8px 0' }}>Sem agendamentos no período.</div>
        ) : (
          topServicos.map((s, i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', gap: 10, padding: '9px 0',
              fontSize: 14, borderTop: '0.5px solid rgba(0,0,0,0.06)',
            }}>
              <span style={{ flex: 1, color: '#0c0c12' }}>{s.nome}</span>
              <span style={{ width: 90, textAlign: 'right', color: 'rgba(0,0,0,0.5)' }}>{s.reservas} reservas</span>
              <span style={{ width: 100, textAlign: 'right', color: '#0c0c12', fontWeight: 500 }}>{brl(s.valor)}</span>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
