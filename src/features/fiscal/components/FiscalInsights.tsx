// src/features/fiscal/components/FiscalInsights.tsx
'use client'

import { Gauge, TriangleAlert, CircleCheck, Info } from 'lucide-react'
import { card, ink, tone, label, body, numeric, brl, compact } from '../ui'
import type { FiscalSummary } from '../types'

interface Props {
  summary: FiscalSummary
}

export default function FiscalInsights({ summary }: Props) {
  const s = summary.simples
  const pct = Math.min(100, Math.max(0.6, s.percentual))
  const rejeitadas = summary.status.rejected

  const rows: Array<{ color: string; icon: React.ReactNode; title: string; text: string }> = []

  if (s.faltaParaProxima != null && s.aliquotaProxima != null) {
    rows.push({
      color: tone.amber,
      icon: <TriangleAlert size={13} color={tone.amber} strokeWidth={1.9} />,
      title: `A faixa muda em ${brl(s.faltaParaProxima)}.`,
      text: `Ao ultrapassar ${brl(s.teto === 4800000 ? s.faltaParaProxima + s.rbt12 : 0)} em 12 meses, a alíquota nominal vai de ${s.aliquotaFaixa}% para ${s.aliquotaProxima}% — avise seu contador para atualizar o percentual das notas.`,
    })
  }

  if (rejeitadas > 0) {
    rows.push({
      color: tone.red,
      icon: <TriangleAlert size={13} color={tone.red} strokeWidth={1.9} />,
      title: `${rejeitadas} ${rejeitadas === 1 ? 'nota rejeitada' : 'notas rejeitadas'} neste ano.`,
      text: 'Abra a lista para ver o motivo e reemitir.',
    })
  } else {
    rows.push({
      color: tone.green,
      icon: <CircleCheck size={13} color={tone.green} strokeWidth={1.9} />,
      title: 'Nenhuma nota rejeitada.',
      text: 'Todas as emissões do período foram autorizadas na primeira tentativa.',
    })
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) minmax(0,1.35fr)', gap: 14, marginBottom: 14 }}>
      {/* medidor do Simples */}
      <div style={{ ...card, padding: '26px 28px', minWidth: 0 }}>
        <span style={{ ...label, display: 'flex', alignItems: 'center', gap: 7 }}>
          <Gauge size={13} color={tone.blue} strokeWidth={1.9} />
          Limite do Simples Nacional
        </span>

        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginTop: 16 }}>
          <span style={{ fontSize: 34, fontWeight: 600, lineHeight: 1, ...numeric, color: ink.strong }}>
            {s.percentual.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}%
          </span>
          <span style={{ ...body, fontSize: 12.5 }}>do teto utilizado</span>
        </div>

        <div style={{ height: 3, background: 'rgba(0,0,0,0.07)', borderRadius: 99, position: 'relative', margin: '18px 0 12px' }}>
          <div
            style={{
              position: 'absolute',
              left: 0,
              top: 0,
              bottom: 0,
              width: `${pct}%`,
              background: s.percentual > 80 ? tone.amber : ink.strong,
              borderRadius: 99,
              transition: 'width 1s cubic-bezier(0.25,0.8,0.35,1)',
            }}
          />
          <div style={{ position: 'absolute', left: '75%', top: -3, bottom: -3, width: 1, background: ink.faint }} />
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5, color: ink.faint }}>
          <span style={numeric}>{brl(s.rbt12)} em 12 meses</span>
          <span style={numeric}>R$ {compact(s.teto)}</span>
        </div>

        <div style={{ marginTop: 22, paddingTop: 18, borderTop: `0.5px solid ${ink.hair}`, display: 'flex', alignItems: 'baseline', gap: 10 }}>
          <span style={{ fontSize: 26, fontWeight: 600, lineHeight: 1, ...numeric, color: ink.strong }}>
            {s.aliquotaFaixa.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}%
          </span>
          <div style={{ flex: 1 }}>
            <div style={{ ...body, fontSize: 12.5, color: ink.strong }}>Anexo III · {s.faixa}ª faixa</div>
            <div style={{ ...body, fontSize: 12 }}>alíquota nominal da faixa</div>
          </div>
        </div>

        {/* ⚠️ aviso obrigatório — o número é parcial */}
        {s.parcial && (
          <div style={{ display: 'flex', gap: 8, marginTop: 16, alignItems: 'flex-start' }}>
            <Info size={12} color={ink.faint} strokeWidth={1.9} style={{ marginTop: 2, flexShrink: 0 }} />
            <span style={{ fontSize: 11.5, color: ink.faint, lineHeight: 1.45 }}>
              Considera apenas as vendas registradas no Eligi. Confirme o valor real com seu contador.
            </span>
          </div>
        )}
      </div>

      {/* leituras */}
      <div style={{ ...card, padding: '22px 26px', minWidth: 0 }}>
        <div style={label}>Leituras do período</div>
        <div style={{ marginTop: 14 }}>
          {rows.map((r, i) => (
            <div
              key={r.title}
              style={{
                display: 'flex',
                gap: 12,
                alignItems: 'flex-start',
                padding: '13px 0',
                borderBottom: i === rows.length - 1 ? 'none' : `0.5px solid ${ink.hair}`,
                fontSize: 13,
                lineHeight: 1.5,
              }}
            >
              <span style={{ flexShrink: 0, marginTop: 2 }}>{r.icon}</span>
              <span style={{ color: ink.mid }}>
                <b style={{ fontWeight: 600, color: ink.strong, letterSpacing: '-0.01em' }}>{r.title}</b>{' '}
                {r.text}
              </span>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 28, marginTop: 18, paddingTop: 18, borderTop: `0.5px solid ${ink.hair}`, flexWrap: 'wrap' }}>
          <div>
            <div style={label}>ISS estimado</div>
            <div style={{ fontSize: 19, fontWeight: 600, marginTop: 7, ...numeric, color: ink.strong }}>
              {brl(summary.current.issEstimado)}
            </div>
          </div>
          <div>
            <div style={label}>Tributos aproximados</div>
            <div style={{ fontSize: 19, fontWeight: 600, marginTop: 7, ...numeric, color: ink.strong }}>
              {brl(summary.current.tributosAproximados)}
            </div>
          </div>
          <div>
            <div style={label}>Notas no mês</div>
            <div style={{ fontSize: 19, fontWeight: 600, marginTop: 7, ...numeric, color: ink.strong }}>
              {summary.current.count}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
