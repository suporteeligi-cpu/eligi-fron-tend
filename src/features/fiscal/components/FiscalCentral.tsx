// src/features/fiscal/components/FiscalCentral.tsx
'use client'

import { useState } from 'react'
import { Settings2, FileDown } from 'lucide-react'
import { card, ink, tone, btn, body } from '../ui'
import type { FiscalOverview, FiscalStatus } from '../types'
import { useEmissionState } from '../hooks/useEmissionState'
import { useFiscalSummary } from '../hooks/useFiscalSummary'
import NfseMasterSwitch from './NfseMasterSwitch'
import FiscalIdCard from './FiscalIdCard'
import FiscalHero from './FiscalHero'
import FiscalCharts from './FiscalCharts'
import FiscalInsights from './FiscalInsights'
import EmissionsList from './EmissionsList'
import FiscalSetup from './FiscalSetup'
import DasCard from './DasCard'
import RelatorioModal from './RelatorioModal'

const STATUS_LABEL: Record<FiscalStatus, string> = {
  INCOMPLETE: 'Configuração incompleta',
  READY_TO_TEST: 'Pronto para emitir',
  ACTIVE: 'Emissão ativa',
  BLOCKED: 'Certificado vencido',
}

interface Props {
  overview: FiscalOverview
  onChanged: () => void
}

export default function FiscalCentral({ overview, onChanged }: Props) {
  const profile = overview.profile
  const status: FiscalStatus = profile?.status ?? 'INCOMPLETE'
  const { state: emissionState, refetch: refetchEmission } = useEmissionState()
  const { summary } = useFiscalSummary(new Date().getFullYear())
  const [showSetup, setShowSetup] = useState(status === 'INCOMPLETE')
  const [relatorio, setRelatorio] = useState(false)

  return (
    <div>
      {/* master — o dono precisa poder desligar a qualquer momento */}
      {emissionState && status !== 'INCOMPLETE' && (
        <NfseMasterSwitch state={emissionState} onChanged={refetchEmission} />
      )}

      {summary && <FiscalIdCard business={summary.business} profile={profile} />}

      {summary && summary.current.count > 0 && <FiscalHero summary={summary} />}
      {summary && <FiscalCharts summary={summary} />}
      {summary && <FiscalInsights summary={summary} />}

      <DasCard />

      <div style={{ marginBottom: 14 }}>
        <EmissionsList />
      </div>

      <button
        onClick={() => setRelatorio(true)}
        style={{
          ...btn,
          display: 'inline-flex',
          alignItems: 'center',
          gap: 8,
          marginBottom: 14,
        }}
      >
        <FileDown size={14} strokeWidth={1.8} />
        Exportar relatório
      </button>

      {/* configuração recolhida: coisa de 1x por ano, não merece a dobra */}
      <div style={{ ...card, padding: showSetup ? '22px 26px' : '18px 26px' }}>
        <button
          onClick={() => setShowSetup((v) => !v)}
          style={{
            ...btn,
            border: 'none',
            background: 'transparent',
            padding: 0,
            display: 'flex',
            alignItems: 'center',
            gap: 9,
            width: '100%',
            justifyContent: 'space-between',
          }}
        >
          <span style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
            <Settings2 size={15} color={tone.blue} strokeWidth={1.75} />
            <span style={{ fontSize: 15, fontWeight: 600, letterSpacing: '-0.015em', color: ink.strong }}>
              Configuração fiscal
            </span>
          </span>
          <span style={{ ...body, fontSize: 12.5 }}>
            {STATUS_LABEL[status]} {showSetup ? '▴' : '▾'}
          </span>
        </button>

        {showSetup && (
          <div style={{ marginTop: 20, paddingTop: 20, borderTop: `0.5px solid ${ink.hair}` }}>
            <FiscalSetup overview={overview} onChanged={onChanged} />
          </div>
        )}
      </div>

      {relatorio && <RelatorioModal onClose={() => setRelatorio(false)} />}
    </div>
  )
}
