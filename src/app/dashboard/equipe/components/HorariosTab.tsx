'use client'
// src/app/dashboard/equipe/components/HorariosTab.tsx

import { Clock, ChevronLeft } from 'lucide-react'
import { colors, typography } from '@/shared/theme'
import { Professional } from '@/features/professionals/types'

import ProfSidebar from './ProfSidebar'
import HoursPanel  from './HoursPanel'

interface Props {
  professionals:   Professional[]
  selected:        Professional | null
  query:           string
  loading:         boolean
  isMobile:        boolean
  showMobilePanel: boolean
  onQueryChange:   (q: string) => void
  onSelect:        (p: Professional) => void
  onMobileBack:    () => void
  onMobileOpen:    () => void
}

export default function HorariosTab({
  professionals, selected, query, loading,
  isMobile, showMobilePanel,
  onQueryChange, onSelect,
  onMobileBack, onMobileOpen,
}: Props) {
  function handleSelect(p: Professional) {
    onSelect(p)
    if (isMobile) onMobileOpen()
  }

  if (isMobile) {
    if (showMobilePanel && selected) {
      return (
        <div style={{
          background: 'rgba(255,255,255,0.85)',
          backdropFilter: 'blur(20px)',
          borderRadius: 12,
          overflow: 'hidden',
          border: `1px solid ${colors.gray.border}`,
        }}>
          <MobileHeader prof={selected} onBack={onMobileBack} />
          <div style={{ padding: '14px 16px 20px' }}>
            <HoursPanel
              key={selected.id}
              profId={selected.id}
              profName={selected.name}
              isMobile
            />
          </div>
        </div>
      )
    }
    return (
      <div style={{
        background: 'rgba(255,255,255,0.85)',
        backdropFilter: 'blur(20px)',
        borderRadius: 12,
        overflow: 'hidden',
        border: `1px solid ${colors.gray.border}`,
      }}>
        <ProfSidebar
          professionals={professionals}
          selected={null}
          query={query}
          onQueryChange={onQueryChange}
          onSelect={handleSelect}
          loading={loading}
        />
      </div>
    )
  }

  // ─── DESKTOP ─────────────────────────────────────────────────────
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: '220px 1fr',
      height: '100%',
    }}>
      <ProfSidebar
        professionals={professionals}
        selected={selected}
        query={query}
        onQueryChange={onQueryChange}
        onSelect={handleSelect}
        loading={loading}
      />

      <div style={{
        overflowY: 'auto',
        padding: '16px 20px',
      }}>
        {selected ? (
          <HoursPanel
            key={selected.id}
            profId={selected.id}
            profName={selected.name}
            isMobile={false}
          />
        ) : (
          <EmptyState />
        )}
      </div>
    </div>
  )
}

function MobileHeader({ prof, onBack }: { prof: Professional; onBack: () => void }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10,
      padding: '12px 16px',
      borderBottom: `1px solid ${colors.gray.border}`,
      fontFamily: typography.fontFamily,
    }}>
      <button
        onClick={onBack}
        style={{
          display: 'flex', alignItems: 'center', gap: 2,
          background: 'none', border: 'none', cursor: 'pointer',
          fontSize: 13, fontWeight: 600,
          color: colors.gray.dimText,
          padding: 0,
          fontFamily: 'inherit',
        }}
      >
        <ChevronLeft size={18} strokeWidth={2.5} />
        Voltar
      </button>
      <div style={{ flex: 1, textAlign: 'center', fontSize: 13, fontWeight: 700 }}>
        {prof.name}
      </div>
      <div style={{ width: 60 }} />
    </div>
  )
}

function EmptyState() {
  return (
    <div style={{
      height: '100%',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      gap: 10,
      color: colors.gray.dimText,
      fontFamily: typography.fontFamily,
    }}>
      <Clock size={32} style={{ opacity: 0.18 }} />
      <span style={{ fontSize: 13 }}>Selecione um profissional</span>
    </div>
  )
}
