// src/features/fiscal/components/FiscalInsights.tsx
'use client'

import { Gauge, TriangleAlert, CircleCheck, Info, FileCheck2 } from 'lucide-react'
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

  // a alíquota das notas precisa acompanhar a faixa — se o RBT12 subiu e
  // o perfil ficou pra trás, toda nota informa um percentual errado
  if (summary.business.aliquotaSimplesNacional < s.aliquotaFaixa - 0.01) {
    rows.push({
      color: tone.amber,
      icon: <TriangleAlert size={13} color={tone.amber} strokeWidth={1.9} />,
      title: `Você está na ${s.faixa}ª faixa, mas as notas informam ${summary.business.aliquotaSimplesNacional}%.`,
      text: `A alíquota nominal da sua faixa é ${s.aliquotaFaixa}%. Peça ao contador a alíquota efetiva atual e atualize na configuração fiscal.`,
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
    <div className="fis-grid-insights">
      {/* medidor do Simples */}
      <div className="fis-card-pad" style={{ ...card, minWidth: 0 }}>
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

        <div className="fis-row" style={{ fontSize: 12.5, color: ink.faint }}>
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

        {/* origem do número — a UI nunca mostra o medidor sem dizer de onde veio */}
        {s.parcial ? (
          <div style={{ display: 'flex', gap: 8, marginTop: 16, alignItems: 'flex-start' }}>
            <Info size={12} color={tone.amber} strokeWidth={1.9} style={{ marginTop: 2, flexShrink: 0 }} />
            <span style={{ fontSize: 11.5, color: ink.faint, lineHeight: 1.45 }}>
              <b style={{ color: tone.amber }}>Pode estar subestimado.</b> Considera apenas as vendas
              registradas no Eligi. Informe a receita do extrato do Simples na configuração fiscal.
            </span>
          </div>
        ) : (
          <div style={{ marginTop: 16 }}>
            <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
              <FileCheck2 size={12} color={tone.green} strokeWidth={1.9} style={{ marginTop: 2, flexShrink: 0 }} />
              <span style={{ fontSize: 11.5, color: ink.faint, lineHeight: 1.45 }}>
                {brl(s.rbt12Declarado ?? 0)} declarados no extrato de{' '}
                {s.rbt12Competencia ?? '—'} + {brl(s.rbt12Complemento ?? 0)} em vendas registradas depois.
              </span>
            </div>
            {s.declaracaoDesatualizada && (
              <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start', marginTop: 8 }}>
                <TriangleAlert size={12} color={tone.amber} strokeWidth={1.9} style={{ marginTop: 2, flexShrink: 0 }} />
                <span style={{ fontSize: 11.5, color: tone.amber, lineHeight: 1.45 }}>
                  O extrato tem mais de três meses. Peça o mais recente ao seu contador.
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* leituras */}
      <div className="fis-card-pad" style={{ ...card, minWidth: 0, letterSpacing: 0 }}>
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
