// src/features/reports/components/ReportsModule.tsx
'use client'

import { useState } from 'react'
import dayjs from 'dayjs'
import 'dayjs/locale/pt-br'
import { ChevronLeft, ChevronRight } from 'lucide-react'

import { TABS, ACCENT } from '../constants'
import type { ReportTab } from '../types'
import PainelPanel from './panels/PainelPanel'
import PlaceholderPanel from './panels/PlaceholderPanel'
import MarketingPanel from './panels/MarketingPanel'
import AgendamentosPanel from './panels/AgendamentosPanel'
import ClientesPanel from './panels/ClientesPanel'
import FluxoCaixaPanel from './panels/FluxoCaixaPanel'

dayjs.locale('pt-br')

const NAVBAR_OFFSET = 104

/** mês atual no formato 'YYYY-MM' (limite superior do seletor) */
const CURRENT = dayjs().format('YYYY-MM')

function cap(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1)
}

export default function ReportsModule() {
  const [tab, setTab] = useState<ReportTab>('painel')
  // primitivo na state (regra React Compiler); dayjs sempre dentro do callback
  const [period, setPeriod] = useState<string>(CURRENT)

  const isCurrent = period >= CURRENT
  const label = cap(dayjs(`${period}-01`).format('MMM YYYY')) // ex: "Jun 2026"

  function shiftMonth(delta: number) {
    setPeriod((p) => {
      const next = dayjs(`${p}-01`).add(delta, 'month')
      const nextStr = next.format('YYYY-MM')
      return nextStr > CURRENT ? CURRENT : nextStr
    })
  }

  return (
    <div
      style={{
        maxWidth: 1180,
        margin: '0 auto',
        padding: '0 20px',
        // respeita a navbar fixa (regra mobile/desktop do eligi)
        paddingTop: NAVBAR_OFFSET + 16,
      }}
    >
      {/* header */}
      <div
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          gap: 16, marginBottom: 20, flexWrap: 'wrap',
        }}
      >
        <h1 style={{ fontSize: 26, fontWeight: 700, color: '#0c0c12', margin: 0 }}>
          Estatísticas e Relatórios
        </h1>

        {/* seletor de mês */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <button
            type="button"
            aria-label="Mês anterior"
            onClick={() => shiftMonth(-1)}
            style={navBtn}
          >
            <ChevronLeft size={18} />
          </button>
          <div
            style={{
              minWidth: 116, textAlign: 'center', fontSize: 14, fontWeight: 600,
              color: '#0c0c12', border: '0.5px solid rgba(0,0,0,0.12)',
              borderRadius: 10, padding: '8px 14px', background: 'rgba(255,255,255,0.7)',
            }}
          >
            {label}
          </div>
          <button
            type="button"
            aria-label="Próximo mês"
            onClick={() => shiftMonth(1)}
            disabled={isCurrent}
            style={{ ...navBtn, opacity: isCurrent ? 0.35 : 1, cursor: isCurrent ? 'default' : 'pointer' }}
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      {/* navegação de abas */}
      <div
        style={{
          display: 'flex', gap: 22, borderBottom: '0.5px solid rgba(0,0,0,0.1)',
          marginBottom: 20, overflowX: 'auto',
        }}
      >
        {TABS.map((t) => {
          const active = t.id === tab
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                fontSize: 14, whiteSpace: 'nowrap', padding: '0 0 12px',
                fontWeight: active ? 600 : 400,
                color: active ? '#0c0c12' : 'rgba(0,0,0,0.45)',
                borderBottom: `2px solid ${active ? ACCENT : 'transparent'}`,
                marginBottom: -1,
              }}
            >
              {t.label}
            </button>
          )
        })}
      </div>

      {/* conteúdo */}
      {tab === 'painel' ? (
        <PainelPanel period={period} />
      ) : tab === 'marketing' ? (
        <MarketingPanel period={period} />
      ) : tab === 'agendamentos' ? (
        <AgendamentosPanel period={period} />
      ) : tab === 'clientes' ? (
        <ClientesPanel period={period} />
      ) : tab === 'fluxo-de-caixa' ? (
        <FluxoCaixaPanel period={period} />
      ) : (
        <PlaceholderPanel label={TABS.find((t) => t.id === tab)?.label ?? ''} />
      )}
    </div>
  )
}

const navBtn: React.CSSProperties = {
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  width: 38, height: 38, borderRadius: 10, cursor: 'pointer',
  border: '0.5px solid rgba(0,0,0,0.12)', background: 'rgba(255,255,255,0.7)',
  color: '#0c0c12',
}
