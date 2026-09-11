// src/features/reports/components/panels/FluxoCaixaPanel.tsx
'use client'

import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts'
import { useReportData } from '../../hooks/useReportData'
import { CLUB_BAD, CLUB_INK, CLUB_LINE, CLUB_OK, CLUB_PAPER, CLUB_PAPER_MUTED, GLASS_CARD } from '../../constants'
import type { FluxoCaixaData, FluxoCaixaRaia, FluxoCaixaRaiaClube, FluxoFatia } from '../../types'
import DeltaBadge from '../DeltaBadge'
import EligiClubIcon from '@/app/components/navigation/EligiClubIcon'

// @eligi:fluxo-direcao-a
// Direcao A (set/26): operacional e EligiClub em duas raias com a mesma anatomia
// (entradas, saidas, saldo, margem) e o consolidado numa faixa abaixo. Negocio
// sem clube mantem a faixa de 4 KPIs de sempre, lendo a raia operacional.
// Os campos legados do payload (kpis, serie, porCategoria) nao sao mais lidos.

const IN = '#1D9E75'
const OUT = '#dc2626'
const OUT_CLUB = '#7f1d1d'
const OK = '#0f6e56'
const BAD = '#a32d2d'
const INK = '#0c0c12'
const LABEL = 'rgba(0,0,0,0.5)'
const FAINT = 'rgba(0,0,0,0.4)'
const HAIRLINE = 'rgba(0,0,0,0.06)'
const NUM: React.CSSProperties = { fontVariantNumeric: 'tabular-nums' }
const TOP_RADIUS: [number, number, number, number] = [3, 3, 0, 0]

type Tone = 'light' | 'dark'

const brl = (n: number) => n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

/** 'YYYY-MM' -> 'agosto' (sem depender do fuso do navegador). */
function monthName(periodo: string): string {
  const [y, m] = periodo.split('-').map(Number)
  return new Date(Date.UTC(y, m - 1, 15)).toLocaleDateString('pt-BR', { month: 'long', timeZone: 'UTC' })
}

function plural(n: number, one: string, many: string): string {
  return `${n} ${n === 1 ? one : many}`
}

/** ['a', 'b', 'c'] -> 'a, b e c' */
function joinPt(parts: string[]): string {
  if (parts.length <= 1) return parts.join('')
  return `${parts.slice(0, -1).join(', ')} e ${parts[parts.length - 1]}`
}

// ─── Blocos ────────────────────────────────────────────────────────────────────

function KpiCard({ label, value, valueColor = INK, children }: {
  label: string; value: string; valueColor?: string; children?: React.ReactNode
}) {
  return (
    <div style={{ ...GLASS_CARD, padding: '16px 18px' }}>
      <div style={{ fontSize: 12, color: LABEL, marginBottom: 6 }}>{label}</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 22, fontWeight: 600, color: valueColor, lineHeight: 1.1, ...NUM }}>{value}</span>
        {children}
      </div>
    </div>
  )
}

function LaneHeader({ title, subtitle, tone }: { title: string; subtitle: string; tone: Tone }) {
  const dark = tone === 'dark'
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, minHeight: 34, marginBottom: 12 }}>
      {dark && (
        <span style={{
          width: 34, height: 34, borderRadius: 10, background: 'rgba(244,242,236,0.08)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        }}>
          <EligiClubIcon size={18} color={CLUB_PAPER} />
        </span>
      )}
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: 16, fontWeight: 600, color: dark ? CLUB_PAPER : INK }}>{title}</div>
        <div style={{ fontSize: 12, color: dark ? CLUB_PAPER_MUTED : LABEL }}>{subtitle}</div>
      </div>
    </div>
  )
}

function LaneRow({ label, value, tone, valueColor, children }: {
  label: string; value: string; tone: Tone; valueColor?: string; children?: React.ReactNode
}) {
  const dark = tone === 'dark'
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10,
      minHeight: 50, borderTop: `0.5px solid ${dark ? CLUB_LINE : HAIRLINE}`,
    }}>
      <span style={{ fontSize: 13, color: dark ? CLUB_PAPER_MUTED : LABEL }}>{label}</span>
      <span style={{
        display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', justifyContent: 'flex-end',
        fontSize: 20, fontWeight: 600, color: valueColor ?? (dark ? CLUB_PAPER : INK), ...NUM,
      }}>
        {value}
        {children}
      </span>
    </div>
  )
}

/** Mesma anatomia nas duas raias: e isso que deixa a comparacao horizontal. */
function LaneRows({ raia, tone }: { raia: FluxoCaixaRaia; tone: Tone }) {
  const dark = tone === 'dark'
  const saldoColor = raia.saldo >= 0 ? (dark ? CLUB_OK : OK) : (dark ? CLUB_BAD : BAD)
  return (
    <div>
      <LaneRow label="Entradas" value={brl(raia.entradas)} tone={tone}>
        <DeltaBadge pct={raia.entradasDelta.pct} hasValue={raia.entradas > 0} tone={tone} />
      </LaneRow>
      <LaneRow label="Saídas" value={brl(raia.saidas)} tone={tone} />
      <LaneRow label="Saldo" value={brl(raia.saldo)} tone={tone} valueColor={saldoColor} />
      <LaneRow label="Margem" value={`${raia.margem}%`} tone={tone} />
    </div>
  )
}

function OperacionalLane({ raia }: { raia: FluxoCaixaRaia }) {
  return (
    <section aria-label="Operacional" style={{ ...GLASS_CARD, padding: 18 }}>
      <LaneHeader title="Operacional" subtitle="Caixa, despesas e comissões" tone="light" />
      <LaneRows raia={raia} tone="light" />
    </section>
  )
}

function OrigemItem({ label, valor, qtd, align }: { label: string; valor: number; qtd: number; align: 'left' | 'right' }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', textAlign: align, minWidth: 0 }}>
      <span style={{ color: CLUB_PAPER_MUTED }}>{label}</span>
      <span style={{ fontSize: 14, fontWeight: 600, color: CLUB_PAPER, ...NUM }}>{brl(valor)}</span>
      <span style={{ color: CLUB_PAPER_MUTED }}>{plural(qtd, 'pagamento', 'pagamentos')}</span>
    </div>
  )
}

function clubNotes(clube: FluxoCaixaRaiaClube): string[] {
  const d = clube.saidasDetalhe
  const notes: string[] = []

  const parts: string[] = []
  if (d.taxas > 0) parts.push(`taxa do Asaas ${brl(d.taxas)}`)
  if (d.rateio > 0) parts.push(`rateio do pote ${brl(d.rateio)}`)
  if (d.estornos > 0) parts.push(`estornos ${brl(d.estornos)}`)
  const saidas: string[] = []
  if (parts.length > 0) saidas.push(`Saídas do clube: ${joinPt(parts)}.`)
  if (d.taxasPendentes > 0) {
    saidas.push(`A taxa de ${plural(d.taxasPendentes, 'pagamento', 'pagamentos')} ainda não chegou do Asaas.`)
  }
  if (saidas.length > 0) notes.push(saidas.join(' '))

  if (clube.aLiberar > 0) {
    notes.push(`${brl(clube.aLiberar)} já pagos pelos membros e ainda a liberar pelo Asaas.`)
  }
  if (clube.poteAberto) {
    notes.push(
      `O rateio de ${monthName(clube.poteAberto.periodo)} (${brl(clube.poteAberto.valor)}) ainda não foi fechado. ` +
      'Quando fechar, entra nas saídas do clube.',
    )
  }
  return notes
}

function ClubLane({ clube }: { clube: FluxoCaixaRaiaClube }) {
  const { origem } = clube
  const autoPct = clube.entradas > 0 ? (origem.automatico / clube.entradas) * 100 : 0
  const subtitle = clube.pagamentos > 0
    ? `${plural(clube.pagamentos, 'mensalidade recebida', 'mensalidades recebidas')}`
    : 'Nenhuma mensalidade recebida no mês'
  const notes = clubNotes(clube)

  return (
    <section aria-label="EligiClub" style={{ background: CLUB_INK, color: CLUB_PAPER, borderRadius: 16, padding: 18 }}>
      <LaneHeader title="EligiClub" subtitle={subtitle} tone="dark" />
      <LaneRows raia={clube} tone="dark" />

      {clube.entradas > 0 && (
        <div style={{ marginTop: 14 }}>
          <div
            role="img"
            aria-label={`Cobrança automática ${brl(origem.automatico)}; registrado no balcão ${brl(origem.balcao)}`}
            style={{ display: 'flex', height: 8, borderRadius: 4, overflow: 'hidden', gap: 2 }}
          >
            {origem.automatico > 0 && <div style={{ width: `${autoPct}%`, background: CLUB_OK }} />}
            {origem.balcao > 0 && <div style={{ flex: 1, background: 'rgba(244,242,236,0.35)' }} />}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, marginTop: 8, fontSize: 12 }}>
            <OrigemItem label="Cobrança automática" valor={origem.automatico} qtd={origem.automaticoQtd} align="left" />
            <OrigemItem label="Registrado no balcão" valor={origem.balcao} qtd={origem.balcaoQtd} align="right" />
          </div>
        </div>
      )}

      {notes.map((note) => (
        <p key={note} style={{
          margin: '12px 0 0', fontSize: 12, lineHeight: 1.45, color: CLUB_PAPER_MUTED,
          background: 'rgba(244,242,236,0.06)', borderRadius: 10, padding: '9px 11px', ...NUM,
        }}>
          {note}
        </p>
      ))}
    </section>
  )
}

function TotalBand({ consolidado, parcial }: { consolidado: FluxoCaixaData['raias']['consolidado']; parcial: boolean }) {
  const item = (label: string, value: string, color: string = INK) => (
    <div style={{ minWidth: 0 }}>
      <div style={{ fontSize: 12, color: LABEL }}>{label}</div>
      <div style={{ fontSize: 18, fontWeight: 600, color, ...NUM }}>{value}</div>
    </div>
  )
  return (
    <div className="rpt-total" style={{ ...GLASS_CARD, padding: '14px 18px' }}>
      {item('Entradas no total', brl(consolidado.entradas))}
      {item('Saídas no total', brl(consolidado.saidas))}
      {item('Saldo no total', brl(consolidado.saldo), consolidado.saldo >= 0 ? OK : BAD)}
      <div style={{ fontSize: 12, color: FAINT, ...NUM }}>
        <div>Margem de {consolidado.margem}%</div>
        <div>{parcial ? 'Mês em andamento' : 'Mês fechado'}</div>
      </div>
    </div>
  )
}

function FluxoChart({ serie, comClube }: { serie: FluxoCaixaData['serieRaias']; comClube: boolean }) {
  const legend: [string, string][] = comClube
    ? [[IN, 'Entradas do caixa'], [CLUB_INK, 'Entradas do clube'], [OUT, 'Saídas do caixa'], [OUT_CLUB, 'Saídas do clube']]
    : [[IN, 'Entradas'], [OUT, 'Saídas']]
  return (
    <div style={{ ...GLASS_CARD, padding: 18 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap', marginBottom: 8 }}>
        <span style={{ fontSize: 14, fontWeight: 600, color: INK }}>Entradas e saídas por mês</span>
        <span style={{ display: 'flex', gap: 14, flexWrap: 'wrap', fontSize: 12, color: 'rgba(0,0,0,0.55)' }}>
          {legend.map(([cor, label]) => (
            <span key={label} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <span style={{ width: 9, height: 9, borderRadius: 2, background: cor }} />{label}
            </span>
          ))}
        </span>
      </div>
      <div style={{ width: '100%', height: 200 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={serie} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
            <XAxis dataKey="mes" tick={{ fontSize: 10, fill: FAINT }} axisLine={false} tickLine={false} />
            <YAxis hide />
            <Tooltip
              formatter={(value) => brl(typeof value === 'number' ? value : 0)}
              contentStyle={{ borderRadius: 12, border: '0.5px solid rgba(0,0,0,0.1)', fontSize: 12 }}
            />
            <Bar dataKey="operacionalEntradas" name={comClube ? 'Entradas do caixa' : 'Entradas'} stackId="in" fill={IN} radius={comClube ? 0 : TOP_RADIUS} maxBarSize={16} />
            {comClube && <Bar dataKey="clubeEntradas" name="Entradas do clube" stackId="in" fill={CLUB_INK} radius={TOP_RADIUS} maxBarSize={16} />}
            <Bar dataKey="operacionalSaidas" name={comClube ? 'Saídas do caixa' : 'Saídas'} stackId="out" fill={OUT} radius={comClube ? 0 : TOP_RADIUS} maxBarSize={16} />
            {comClube && <Bar dataKey="clubeSaidas" name="Saídas do clube" stackId="out" fill={OUT_CLUB} radius={TOP_RADIUS} maxBarSize={16} />}
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

function Breakdown({ title, rows, empty }: { title: string; rows: FluxoFatia[]; empty: string }) {
  return (
    <div style={{ ...GLASS_CARD, padding: 18 }}>
      <div style={{ fontSize: 14, fontWeight: 600, color: INK, marginBottom: 10 }}>{title}</div>
      {rows.length === 0 ? (
        <div style={{ fontSize: 13, color: FAINT, padding: '6px 0' }}>{empty}</div>
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
              fontSize: 14, borderTop: `0.5px solid ${HAIRLINE}`,
            }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: r.cor, flex: 'none' }} />
              <span style={{ flex: 1, color: INK }}>{r.label}</span>
              <span style={{ width: 56, textAlign: 'right', color: LABEL, ...NUM }}>{r.pct}%</span>
              <span style={{ width: 110, textAlign: 'right', color: INK, fontWeight: 500, ...NUM }}>{brl(r.valor)}</span>
            </div>
          ))}
        </>
      )}
    </div>
  )
}

// ─── Painel ────────────────────────────────────────────────────────────────────

export default function FluxoCaixaPanel({ period }: { period: string }) {
  const { data, loading, error } = useReportData<FluxoCaixaData>('/reports/fluxo-caixa', period)

  if (error && !data) {
    return (
      <div role="alert" style={{ padding: 40, textAlign: 'center', color: LABEL, fontSize: 14 }}>
        Não foi possível carregar o fluxo de caixa. Troque de mês ou recarregue a página.
      </div>
    )
  }
  if (loading || !data) {
    return <div style={{ padding: 40, textAlign: 'center', color: FAINT }}>Carregando…</div>
  }

  const { raias, serieRaias, porPagamento } = data
  const { operacional, clube, consolidado, parcial } = raias
  const comClube = clube !== null

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {clube ? (
        <>
          <div className="rpt-lanes">
            <OperacionalLane raia={operacional} />
            <ClubLane clube={clube} />
          </div>
          <TotalBand consolidado={consolidado} parcial={parcial} />
        </>
      ) : (
        <div className="rpt-kpis">
          <KpiCard label="Entradas" value={brl(operacional.entradas)}>
            <DeltaBadge pct={operacional.entradasDelta.pct} hasValue={operacional.entradas > 0} />
          </KpiCard>
          <KpiCard label="Saídas" value={brl(operacional.saidas)} />
          <KpiCard label="Saldo" value={brl(operacional.saldo)} valueColor={operacional.saldo >= 0 ? OK : BAD} />
          <KpiCard label="Margem" value={`${operacional.margem}%`} />
        </div>
      )}

      <FluxoChart serie={serieRaias} comClube={comClube} />

      <Breakdown
        title={comClube ? 'Entradas do caixa por forma de pagamento' : 'Entradas por forma de pagamento'}
        rows={porPagamento}
        empty="Nenhuma entrada no período."
      />
      <Breakdown
        title={comClube ? 'Saídas do caixa por categoria' : 'Saídas por categoria'}
        rows={operacional.porCategoria}
        empty="Nenhuma despesa no período."
      />
    </div>
  )
}
