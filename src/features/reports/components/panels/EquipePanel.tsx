// src/features/reports/components/panels/EquipePanel.tsx
'use client'

import { useReportData } from '../../hooks/useReportData'
import { GLASS_CARD } from '../../constants'
import type { EquipeData } from '../../types'

const ACCENT = '#dc2626'
const brl = (n: number) => n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

function Kpi({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ ...GLASS_CARD, padding: '16px 18px' }}>
      <div style={{ fontSize: 12, color: 'rgba(0,0,0,0.5)', marginBottom: 6 }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 600, color: '#0c0c12', lineHeight: 1.1 }}>{value}</div>
    </div>
  )
}

function ini(s: string) {
  return s.split(' ').slice(0, 2).map((w) => w[0]).join('').toUpperCase()
}

export default function EquipePanel({ period }: { period: string }) {
  const { data, loading } = useReportData<EquipeData>('/reports/equipe', period)

  if (loading || !data) {
    return <div style={{ padding: 40, textAlign: 'center', color: 'rgba(0,0,0,0.4)' }}>Carregando…</div>
  }

  const { kpis, profissionais } = data
  const maxReceita = Math.max(1, ...profissionais.map((p) => p.receita))

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0,1fr))', gap: 12 }}>
        <Kpi label="Profissionais ativos" value={String(kpis.profissionais)} />
        <Kpi label="Receita da equipe" value={brl(kpis.receita)} />
        <Kpi label="Comissões" value={brl(kpis.comissoes)} />
        <Kpi label="Ocupação média" value={kpis.ocupacaoMedia != null ? `${kpis.ocupacaoMedia}%` : '—'} />
      </div>

      <div style={{ ...GLASS_CARD, padding: 18 }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: '#0c0c12', marginBottom: 8 }}>
          Desempenho por profissional
        </div>
        <div style={{ display: 'flex', fontSize: 11, color: 'rgba(0,0,0,0.4)', paddingBottom: 6 }}>
          <span style={{ flex: 1 }}>Profissional</span>
          <span style={{ width: 70, textAlign: 'right' }}>Reservas</span>
          <span style={{ width: 100, textAlign: 'right' }}>Receita</span>
          <span style={{ width: 100, textAlign: 'right' }}>Comissão</span>
          <span style={{ width: 80, textAlign: 'right' }}>Ocupação</span>
        </div>
        {profissionais.length === 0 ? (
          <div style={{ fontSize: 13, color: 'rgba(0,0,0,0.4)', padding: '8px 0' }}>Nenhum profissional ativo.</div>
        ) : (
          profissionais.map((p, i) => (
            <div key={i} style={{ borderTop: '0.5px solid rgba(0,0,0,0.06)', padding: '9px 0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 14 }}>
                <div style={{
                  width: 30, height: 30, borderRadius: '50%', flex: 'none',
                  background: 'rgba(220,38,38,0.12)', color: ACCENT,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 600,
                }}>
                  {ini(p.nome)}
                </div>
                <span style={{ flex: 1, color: '#0c0c12' }}>{p.nome}</span>
                <span style={{ width: 70, textAlign: 'right', color: 'rgba(0,0,0,0.6)' }}>{p.reservas}</span>
                <span style={{ width: 100, textAlign: 'right', color: '#0c0c12', fontWeight: 500 }}>{brl(p.receita)}</span>
                <span style={{ width: 100, textAlign: 'right', color: 'rgba(0,0,0,0.6)' }}>{brl(p.comissao)}</span>
                <span style={{ width: 80, textAlign: 'right', color: 'rgba(0,0,0,0.6)' }}>{p.ocupacao != null ? `${p.ocupacao}%` : '—'}</span>
              </div>
              {/* barra de receita relativa */}
              <div style={{ height: 4, borderRadius: 2, background: 'rgba(0,0,0,0.05)', marginTop: 6 }}>
                <div style={{ height: '100%', borderRadius: 2, background: ACCENT, width: `${(p.receita / maxReceita) * 100}%` }} />
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
