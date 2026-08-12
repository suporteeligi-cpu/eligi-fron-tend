// src/features/fiscal/components/DasCard.tsx
'use client'

import { useEffect, useState } from 'react'
import { CalendarClock, ExternalLink, Info } from 'lucide-react'
import api from '@/shared/lib/apiClient'
import { card, ink, tone, label, body, numeric } from '../ui'
import type { DasAgenda } from '../types'

/**
 * Agenda do DAS. Deliberadamente SEM valor e SEM botão de pagar:
 * o valor só existe após a declaração no PGDAS-D (que o contador faz) e
 * a guia é federal, com código de barras próprio — não há API pública de
 * pagamento. O que agrega aqui é lembrar e levar ao portal.
 */
export default function DasCard() {
  const [das, setDas] = useState<DasAgenda | null>(null)

  useEffect(() => {
    let alive = true
    async function run() {
      try {
        const res = await api.get<DasAgenda>('/fiscal/das')
        if (alive) setDas(res.data)
      } catch {
        if (alive) setDas(null)
      }
    }
    void run()
    return () => {
      alive = false
    }
  }, [])

  if (!das) return null

  const dias = das.diasRestantes
  const urgente = !das.vencido && dias <= 5
  const cor = das.vencido ? tone.red : urgente ? tone.amber : ink.strong

  const dataFmt = new Date(`${das.vencimento}T12:00:00Z`).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
  })

  return (
    <div style={{ ...card, padding: '22px 26px', marginBottom: 14 }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, flexWrap: 'wrap' }}>
        <CalendarClock size={16} color={tone.blue} strokeWidth={1.8} style={{ marginTop: 2, flexShrink: 0 }} />

        <div style={{ flex: 1, minWidth: 220 }}>
          <div style={label}>DAS · competência {das.competenciaLabel}</div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginTop: 8, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 26, fontWeight: 600, lineHeight: 1, ...numeric, color: cor }}>
              {das.vencido
                ? 'Vencido'
                : dias === 0
                  ? 'Vence hoje'
                  : dias === 1
                    ? 'Vence amanhã'
                    : `${dias} dias`}
            </span>
            <span style={{ ...body, fontSize: 13 }}>
              {das.vencido ? `venceu em ${dataFmt}` : `vence em ${dataFmt}`}
            </span>
          </div>
          <div style={{ ...body, fontSize: 12, marginTop: 6 }}>
            Próxima competência vence em{' '}
            {new Date(`${das.proxima.vencimento}T12:00:00Z`).toLocaleDateString('pt-BR')}
          </div>
        </div>

        <a
          href={das.portalUrl}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 7,
            background: '#fff',
            border: `0.5px solid ${ink.hair2}`,
            color: ink.strong,
            fontSize: 12.5,
            fontWeight: 500,
            padding: '9px 15px',
            borderRadius: 10,
            textDecoration: 'none',
            whiteSpace: 'nowrap',
          }}
        >
          <ExternalLink size={13} strokeWidth={1.8} />
          Gerar guia no portal
        </a>
      </div>

      <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start', marginTop: 14 }}>
        <Info size={12} color={ink.faint} strokeWidth={1.9} style={{ marginTop: 2, flexShrink: 0 }} />
        <span style={{ fontSize: 11.5, color: ink.faint, lineHeight: 1.45 }}>
          O valor do DAS é calculado na declaração mensal (PGDAS-D), feita pelo seu contador. O Eligi
          acompanha o prazo — a guia com código de barras sai no portal do Simples Nacional.
        </span>
      </div>
    </div>
  )
}
