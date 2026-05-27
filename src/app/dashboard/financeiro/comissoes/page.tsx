'use client'
// src/app/dashboard/financeiro/comissoes/page.tsx

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import api from '@/shared/lib/apiClient'
import { colors, typography } from '@/shared/theme'
import { useDeviceMode } from '@/features/agenda/hooks/useDeviceMode'
import { PayoutSettings, PayoutListItem } from '@/features/payouts/types'

import PayoutSettingsCard    from './components/PayoutSettingsCard'
import PayoutSettingsModal   from './components/PayoutSettingsModal'
import PendingCommissionsTab from './components/PendingCommissionsTab'
import PayoutsHistoryTab     from './components/PayoutsHistoryTab'
import MarkAsPaidModal       from './components/MarkAsPaidModal'

type Tab = 'pending' | 'history'

export default function ComissoesPage() {
  const router   = useRouter()
  const mode     = useDeviceMode()
  const isMobile = mode === 'mobile'

  const [settings, setSettings]               = useState<PayoutSettings | null>(null)
  const [settingsLoading, setSettingsLoading] = useState(true)
  const [showSettingsModal, setShowSettingsModal] = useState(false)
  const [showPayModal, setShowPayModal]       = useState<PayoutListItem | null>(null)
  const [activeTab, setActiveTab]             = useState<Tab>('pending')
  const [refreshSignal, setRefreshSignal]     = useState(0)

  const fetchSettings = useCallback(async () => {
    try {
      const res = await api.get('/payouts/settings')
      const data = res.data?.data ?? null
      setSettings(data)
    } catch {
      setSettings(null)
    } finally {
      setSettingsLoading(false)
    }
  }, [])

  useEffect(() => { fetchSettings() }, [fetchSettings])

  function bumpRefresh() {
    setRefreshSignal(n => n + 1)
  }

  return (
    <>
      <style>{`
        @keyframes fadeUp{from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)}}
      `}</style>

      {/* Modal de config */}
      {showSettingsModal && (
        <PayoutSettingsModal
          settings={settings}
          isMobile={isMobile}
          onClose={() => setShowSettingsModal(false)}
          onSaved={(s) => {
            setSettings(s)
            setShowSettingsModal(false)
            bumpRefresh()
          }}
        />
      )}

      {/* Modal marcar como pago */}
      {showPayModal && (
        <MarkAsPaidModal
          payout={showPayModal}
          isMobile={isMobile}
          onClose={() => setShowPayModal(null)}
          onPaid={() => {
            setShowPayModal(null)
            bumpRefresh()
          }}
        />
      )}

      <div style={{
        maxWidth: 900,
        padding: isMobile ? '0 12px' : 0,
        animation: 'fadeUp 0.3s ease',
        fontFamily: typography.fontFamily,
      }}>
        {/* Header */}
        <div style={{ marginBottom: 16 }}>
          <button
            onClick={() => router.push('/dashboard/financeiro')}
            style={{
              background: 'transparent',
              border: 'none',
              color: typography.color.muted,
              fontSize: typography.scale.sm,
              cursor: 'pointer',
              padding: 0,
              marginBottom: 6,
              fontFamily: 'inherit',
            }}
          >
            ← Financeiro
          </button>
          <h1 style={{
            fontSize: isMobile ? 24 : 28,
            fontWeight: typography.weight.bold,
            color: typography.color.primary,
            margin: 0,
            letterSpacing: '-0.02em',
          }}>
            Comissões
          </h1>
          <p style={{
            fontSize: typography.scale.base,
            color: typography.color.muted,
            marginTop: 4, marginBottom: 0,
          }}>
            Pagamentos de comissões à equipe
          </p>
        </div>

        {/* Card de config */}
        <PayoutSettingsCard
          settings={settings}
          loading={settingsLoading}
          onClick={() => setShowSettingsModal(true)}
        />

        {/* Abas */}
        <div style={{
          display: 'flex',
          gap: 6,
          marginBottom: 16,
          borderBottom: `1px solid ${colors.gray.border}`,
        }}>
          <TabButton
            label="Pendentes"
            active={activeTab === 'pending'}
            onClick={() => setActiveTab('pending')}
          />
          <TabButton
            label="Histórico de pagos"
            active={activeTab === 'history'}
            onClick={() => setActiveTab('history')}
          />
        </div>

        {/* Conteúdo da aba */}
        {activeTab === 'pending' ? (
          <PendingCommissionsTab
            isMobile={isMobile}
            settings={settings}
            onOpenDetail={(id) => router.push(`/dashboard/financeiro/comissoes/${id}`)}
            onPayPayout={(p) => setShowPayModal(p)}
            refreshSignal={refreshSignal}
          />
        ) : (
          <PayoutsHistoryTab
            isMobile={isMobile}
            onOpenDetail={(id) => router.push(`/dashboard/financeiro/comissoes/${id}`)}
            refreshSignal={refreshSignal}
          />
        )}
      </div>
    </>
  )
}

function TabButton({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '10px 14px',
        marginBottom: -1,
        border: 'none',
        background: 'transparent',
        cursor: 'pointer',
        fontFamily: 'inherit',
        fontSize: typography.scale.base,
        fontWeight: typography.weight.semibold,
        color: active ? colors.red.DEFAULT : typography.color.muted,
        borderBottom: `2px solid ${active ? colors.red.DEFAULT : 'transparent'}`,
        transition: 'all 0.15s ease',
        WebkitTapHighlightColor: 'transparent',
      }}
    >
      {label}
    </button>
  )
}
