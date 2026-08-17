// src/features/reports/components/ReportsModule.tsx  [rpt-mobile-leva1]
'use client'

import { useState } from 'react'
import dayjs from 'dayjs'
import 'dayjs/locale/pt-br'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import CalendarPicker from '@/shared/components/CalendarPicker'

import { TABS, ACCENT, MOBILE_BP } from '../constants'
import type { ReportTab } from '../types'
import { useIsMobile } from '../hooks/useIsMobile'
import TabSelector from './TabSelector'
import PainelPanel from './panels/PainelPanel'
import PlaceholderPanel from './panels/PlaceholderPanel'
import MarketingPanel from './panels/MarketingPanel'
import AgendamentosPanel from './panels/AgendamentosPanel'
import ClientesPanel from './panels/ClientesPanel'
import FluxoCaixaPanel from './panels/FluxoCaixaPanel'
import EquipePanel from './panels/EquipePanel'
import EstoquePanel from './panels/EstoquePanel'
import ReceitaPanel from './panels/ReceitaPanel'
import ClubReportPanel from './panels/ClubReportPanel'

dayjs.locale('pt-br')

const NAVBAR_OFFSET = 104
const BOTTOM_NAV = 64

/** mês atual no formato 'YYYY-MM' (limite superior do seletor) */
const CURRENT = dayjs().format('YYYY-MM')

function cap(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1)
}

/**
 * Único CSS do módulo. Os painéis marcam a faixa de KPIs com className="rpt-kpis"
 * (4 col desktop → 2 col mobile). Vive em <style> porque o front é inline-styles
 * e media query não existe em style={}. Trocar MOBILE_BP aqui e no constants.
 */
const RPT_CSS = `
.rpt-kpis{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px}
@media (max-width:${MOBILE_BP}px){
  .rpt-kpis{grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}
  .rpt-kpis>*{min-width:0}
}
`

export default function ReportsModule() {
  const isMobile = useIsMobile()
  const [tab, setTab] = useState<ReportTab>('painel')
  // primitivo na state (regra React Compiler); dayjs sempre dentro do callback
  const [period, setPeriod] = useState<string>(CURRENT)
  const [monthOpen, setMonthOpen] = useState(false)

  const isCurrent = period >= CURRENT
  const label = cap(dayjs(`${period}-01`).format('MMM YYYY')) // ex: "Jun 2026"

  function shiftMonth(delta: number) {
    setPeriod((p) => {
      const next = dayjs(`${p}-01`).add(delta, 'month')
      const nextStr = next.format('YYYY-MM')
      return nextStr > CURRENT ? CURRENT : nextStr
    })
  }

  const monthNav = (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <button type="button" aria-label="Mês anterior" onClick={() => shiftMonth(-1)} style={navBtn}>
        <ChevronLeft size={18} />
      </button>
      <button
        type="button"
        onClick={() => setMonthOpen(true)}
        style={{
          minWidth: isMobile ? 96 : 116, textAlign: 'center', fontSize: isMobile ? 15 : 14, fontWeight: 600,
          color: '#0c0c12', border: '0.5px solid rgba(0,0,0,0.12)',
          borderRadius: 10, padding: '8px 14px', background: 'rgba(255,255,255,0.7)',
          cursor: 'pointer', height: 38,
        }}
      >
        {label}
      </button>
      {monthOpen && (
        <CalendarPicker
          mode="month"
          date={dayjs(`${period}-01`)}
          isMobile={isMobile}
          monthValue={period}
          maxMonth={CURRENT}
          onSelect={() => {}}
          onClose={() => setMonthOpen(false)}
          onSelectMonth={(m) => { setPeriod(m); setMonthOpen(false) }}
        />
      )}
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
  )

  return (
    <div
      style={{
        maxWidth: 1180,
        margin: '0 auto',
        padding: isMobile ? '0 14px' : '0 20px',
        // respeita a navbar fixa (regra mobile/desktop do eligi)
        paddingTop: NAVBAR_OFFSET + (isMobile ? 8 : 16),
        paddingBottom: isMobile ? `calc(${BOTTOM_NAV}px + env(safe-area-inset-bottom) + 24px)` : 40,
      }}
    >
      <style>{RPT_CSS}</style>

      {isMobile ? (
        <>
          {/* header compacto: título vira eyebrow, mês é o destaque */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: '2px 2px 10px' }}>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'rgba(0,0,0,0.45)' }}>
                Relatórios
              </div>
              <h1 style={{ fontSize: 22, fontWeight: 700, color: '#0c0c12', margin: 0, letterSpacing: '-0.02em' }}>{label}</h1>
            </div>
            {monthNav}
          </div>

          {/* seletor colapsável, sticky logo abaixo da navbar */}
          <div
            style={{
              position: 'sticky', top: NAVBAR_OFFSET, zIndex: 5, padding: '0 0 10px',
              background: 'linear-gradient(#f2f2f5 86%, rgba(242,242,245,0))',
            }}
          >
            <TabSelector value={tab} onChange={setTab} />
          </div>
        </>
      ) : (
        <>
          {/* header desktop (inalterado) */}
          <div
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              gap: 16, marginBottom: 20, flexWrap: 'wrap',
            }}
          >
            <h1 style={{ fontSize: 26, fontWeight: 700, color: '#0c0c12', margin: 0 }}>
              Estatísticas e Relatórios
            </h1>
            {monthNav}
          </div>

          {/* navegação de abas desktop */}
          <div
            style={{
              display: 'flex', gap: 22, borderBottom: '0.5px solid rgba(0,0,0,0.1)',
              marginBottom: 20, overflowX: 'auto',
            }}
          >
            {TABS.map((t) => {
              const active = t.id === tab
              const Icon = t.icon
              const showIcon = t.id === 'marketing' || t.id === 'club'
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTab(t.id)}
                  style={{
                    background: 'none', border: 'none', cursor: 'pointer',
                    display: 'inline-flex', alignItems: 'center', gap: 6,
                    fontSize: 14, whiteSpace: 'nowrap', padding: '0 0 12px',
                    fontWeight: active ? 600 : 400,
                    color: active ? '#0c0c12' : 'rgba(0,0,0,0.45)',
                    borderBottom: `2px solid ${active ? ACCENT : 'transparent'}`,
                    marginBottom: -1,
                  }}
                >
                  {showIcon && <Icon size={14} />}{t.label}
                </button>
              )
            })}
          </div>
        </>
      )}

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
      ) : tab === 'equipe' ? (
        <EquipePanel period={period} />
      ) : tab === 'estoque' ? (
        <EstoquePanel period={period} />
      ) : tab === 'receita' ? (
        <ReceitaPanel period={period} />
      ) : tab === 'club' ? (
        <ClubReportPanel period={period} />
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
