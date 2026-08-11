// src/features/fiscal/components/FiscalHero.tsx
'use client'

import { ArrowUpRight, ArrowDownRight } from 'lucide-react'
import { card, ink, tone, label, body, numeric, splitBRL, MONTHS } from '../ui'
import type { FiscalSummary } from '../types'

export default function FiscalHero({ summary }: { summary: FiscalSummary }) {
  const { int, cents } = splitBRL(summary.current.total)
  const delta = summary.current.deltaPct
  const up = (delta ?? 0) >= 0
  const mes = MONTHS[summary.current.month - 1]

  return (
    <div style={{ ...card, padding: '28px 32px', marginBottom: 14 }}>
      <div style={label}>Emitido em {mes}</div>

      <div style={{ display: 'flex', alignItems: 'baseline', gap: 2, margin: '14px 0 10px' }}>
        <span style={{ fontSize: 30, fontWeight: 600, color: ink.mid, letterSpacing: '-0.03em' }}>R$&nbsp;</span>
        <span style={{ fontSize: 60, fontWeight: 600, lineHeight: 0.95, ...numeric, letterSpacing: '-0.045em', color: ink.strong }}>
          {int}
        </span>
        <span style={{ fontSize: 32, fontWeight: 600, color: ink.mid, letterSpacing: '-0.03em' }}>{cents}</span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
        <span style={body}>
          {summary.current.count} {summary.current.count === 1 ? 'nota autorizada' : 'notas autorizadas'}
        </span>
        {delta != null && (
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              fontSize: 12.5,
              fontWeight: 500,
              color: up ? tone.green : tone.red,
              letterSpacing: '-0.01em',
            }}
          >
            {up ? <ArrowUpRight size={13} strokeWidth={2} /> : <ArrowDownRight size={13} strokeWidth={2} />}
            {Math.abs(delta).toLocaleString('pt-BR', { maximumFractionDigits: 1 })}% vs mês anterior
          </span>
        )}
      </div>
    </div>
  )
}
