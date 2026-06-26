// src/features/reports/components/panels/ClubReportPanel.tsx
'use client'

import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, PieChart, Pie, Cell } from 'recharts'
import { ArrowDown, ArrowUp } from 'lucide-react'
import { useReportData } from '../../hooks/useReportData'
import { GLASS_CARD, GREEN, MONTHS_PT } from '../../constants'
import type { ClubReportData } from '../../types'
import EligiClubIcon from '@/app/components/navigation/EligiClubIcon'

const brl = (n: number) => n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

function fmtDesde(iso: string) {
  const d = new Date(iso)
  return `${MONTHS_PT[d.getMonth()]}/${String(d.getFullYear()).slice(2)}`
}

function Card({ label, value, sub }: { label: string; value: string; sub?: React.ReactNode }) {
  return (
    <div style={{ ...GLASS_CARD, padding: '16px 18px' }}>
      <div style={{ fontSize: 12, color: 'rgba(0,0,0,0.5)', marginBottom: 6 }}>{label}</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 22, fontWeight: 600, color: '#0c0c12', lineHeight: 1.1 }}>{value}</span>
        {sub}
      </div>
    </div>
  )
}

function PlanoDonut({ rows, mrr }: { rows: ClubReportData['receitaPorPlano']; mrr: number }) {
  if (rows.length === 0) return null
  return (
    <div style={{ ...GLASS_CARD, padding: 18 }}>
      <div style={{ fontSize: 14, fontWeight: 600, color: '#0c0c12', marginBottom: 12 }}>Receita por plano (MRR)</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
        <div style={{ width: 150, height: 150, position: 'relative' }}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={rows} dataKey="valor" nameKey="label" cx="50%" cy="50%" innerRadius={48} outerRadius={70} paddingAngle={2} stroke="none">
                {rows.map((r) => <Cell key={r.label} fill={r.cor} />)}
              </Pie>
              <Tooltip formatter={(value) => brl(typeof value === 'number' ? value : 0)} contentStyle={{ borderRadius: 12, border: '0.5px solid rgba(0,0,0,0.1)', fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: '#0c0c12' }}>{brl(mrr)}</span>
            <span style={{ fontSize: 9, color: 'rgba(0,0,0,0.45)', textTransform: 'uppercase', letterSpacing: '.05em' }}>/mês</span>
          </div>
        </div>
        <div style={{ flex: 1, minWidth: 180, display: 'flex', flexDirection: 'column', gap: 8 }}>
          {rows.map((r) => (
            <div key={r.label} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
              <span style={{ width: 10, height: 10, borderRadius: 3, background: r.cor, flex: 'none' }} />
              <span style={{ flex: 1, color: '#0c0c12', fontWeight: 500 }}>{r.label}</span>
              <span style={{ color: 'rgba(0,0,0,0.45)' }}>{r.pct}%</span>
              <span style={{ width: 90, textAlign: 'right', color: '#0c0c12', fontWeight: 500 }}>{brl(r.valor)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function MembrosList({ rows }: { rows: ClubReportData['membros'] }) {
  return (
    <div style={{ ...GLASS_CARD, padding: 18 }}>
      <div style={{ fontSize: 14, fontWeight: 600, color: '#0c0c12', marginBottom: 8 }}>Membros ({rows.length})</div>
      {rows.length === 0 ? (
        <div style={{ fontSize: 13, color: 'rgba(0,0,0,0.4)', padding: '6px 0' }}>Nenhum membro ativo no clube.</div>
      ) : rows.map((m) => (
        <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0', fontSize: 14, borderTop: '0.5px solid rgba(0,0,0,0.06)' }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ color: '#0c0c12', fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{m.nome}</div>
            <div style={{ fontSize: 11, color: 'rgba(0,0,0,0.45)' }}>desde {fmtDesde(m.desde)} · {m.fichas} fichas</div>
          </div>
          <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 9px', borderRadius: 999, flexShrink: 0, color: m.planoCor ?? '#888780', background: `${m.planoCor ?? '#888780'}1a` }}>{m.plano}</span>
        </div>
      ))}
    </div>
  )
}

export default function ClubReportPanel({ period }: { period: string }) {
  const { data, loading } = useReportData<ClubReportData>('/reports/club', period)

  if (loading || !data) {
    return <div style={{ padding: 40, textAlign: 'center', color: 'rgba(0,0,0,0.4)' }}>Carregando…</div>
  }

  const { kpis, evolucaoPote, receitaPorPlano, membros, resumo } = data

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* header do clube */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ width: 34, height: 34, borderRadius: 10, background: '#0E0E12', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <EligiClubIcon size={18} color="#F4F2EC" />
        </span>
        <div>
          <div style={{ fontSize: 17, fontWeight: 700, color: '#0c0c12' }}>EligiClub</div>
          <div style={{ fontSize: 12, color: 'rgba(0,0,0,0.45)' }}>Assinatura recorrente · visão de negócio</div>
        </div>
      </div>

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0,1fr))', gap: 12 }}>
        <Card label="Membros ativos" value={String(kpis.membrosAtivos)} />
        <Card label="MRR (recorrente)" value={brl(kpis.mrr)} />
        <Card label="Novos no mês" value={String(kpis.novos)} sub={kpis.novos > 0 ? <span style={{ display: 'inline-flex', alignItems: 'center', color: '#0f6e56', fontSize: 11, fontWeight: 600 }}><ArrowUp size={11} /></span> : undefined} />
        <Card label="Cancelados" value={String(kpis.cancelados)} sub={kpis.cancelados > 0 ? <span style={{ display: 'inline-flex', alignItems: 'center', color: '#a32d2d', fontSize: 11, fontWeight: 600 }}><ArrowDown size={11} /></span> : undefined} />
      </div>

      {/* evolução do pote */}
      <div style={{ ...GLASS_CARD, padding: 18 }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: '#0c0c12', marginBottom: 8 }}>Evolução do pote (rateado aos barbeiros)</div>
        {evolucaoPote.length === 0 ? (
          <div style={{ fontSize: 13, color: 'rgba(0,0,0,0.4)', padding: '20px 0', textAlign: 'center' }}>Nenhum período fechado ainda.</div>
        ) : (
          <div style={{ width: '100%', height: 200 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={evolucaoPote} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
                <defs>
                  <linearGradient id="clubPote" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={GREEN} stopOpacity={0.22} />
                    <stop offset="100%" stopColor={GREEN} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="mes" tick={{ fontSize: 10, fill: 'rgba(0,0,0,0.4)' }} axisLine={false} tickLine={false} />
                <YAxis hide />
                <Tooltip formatter={(value) => brl(typeof value === 'number' ? value : 0)} contentStyle={{ borderRadius: 12, border: '0.5px solid rgba(0,0,0,0.1)', fontSize: 12 }} />
                <Area type="monotone" dataKey="valor" stroke={GREEN} strokeWidth={3} fill="url(#clubPote)" connectNulls />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* receita por plano (anel) */}
      <PlanoDonut rows={receitaPorPlano} mrr={kpis.mrr} />

      {/* resumo */}
      <div style={{ ...GLASS_CARD, padding: 18 }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: '#0c0c12', marginBottom: 10 }}>Resumo</div>
        <div style={{ fontSize: 13, color: 'rgba(0,0,0,0.7)', lineHeight: 2 }}>
          Ticket médio: <b style={{ color: '#0c0c12' }}>{brl(resumo.ticketMedio)}/membro</b><br />
          Pote do mês: <b style={{ color: '#0c0c12' }}>{brl(resumo.poteMesAtual)}</b><br />
          Total rateado (histórico): <b style={{ color: '#0c0c12' }}>{brl(resumo.rateadoHistorico)}</b>
        </div>
      </div>

      {/* membros */}
      <MembrosList rows={membros} />
    </div>
  )
}
