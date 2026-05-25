'use client'
// src/app/dashboard/equipe/components/ComissoesTab.tsx

import { useState } from 'react'
import { DollarSign, ChevronLeft } from 'lucide-react'
import { colors, typography } from '@/shared/theme'
import { Professional, ServiceItem } from '@/features/professionals/types'
import {
  CommissionCategoryId,
} from '@/features/professionals/constants/commissionCategories'
import { fmtCommission } from '@/features/professionals/utils/format'

import ProfSidebar               from './ProfSidebar'
import CategoryList              from './CategoryList'
import CommissionServicesEditor  from './CommissionServicesEditor'
import Avatar                    from './Avatar'

interface Props {
  professionals: Professional[]
  allServices:   ServiceItem[]
  selected:      Professional | null
  query:         string
  loading:       boolean
  isMobile:      boolean
  /** Mobile drill state: 'list' | 'categories' | 'editor' */
  mobileLevel:   'list' | 'categories' | 'editor'
  onQueryChange: (q: string) => void
  onSelect:      (p: Professional) => void
  onUpdated:     (p: Professional) => void
  onMobileLevel: (level: 'list' | 'categories' | 'editor') => void
}

export default function ComissoesTab({
  professionals, allServices, selected, query, loading,
  isMobile, mobileLevel,
  onQueryChange, onSelect, onUpdated, onMobileLevel,
}: Props) {
  const [category, setCategory] = useState<CommissionCategoryId>('services')

  function handleSelect(p: Professional) {
    onSelect(p)
    if (isMobile) onMobileLevel('categories')
  }

  function handleCategorySelect(id: CommissionCategoryId) {
    setCategory(id)
    if (isMobile) onMobileLevel('editor')
  }

  const summaries: Partial<Record<CommissionCategoryId, string>> = selected
    ? {
        services:
          selected.commissionType && selected.commissionValue != null
            ? `${fmtCommission(selected.commissionType, selected.commissionValue)} padrão`
            : 'Não definido',
      }
    : {}

  // ─── MOBILE ──────────────────────────────────────────────────────
  if (isMobile) {
    if (mobileLevel === 'editor' && selected) {
      return (
        <div style={{
          background: 'rgba(255,255,255,0.85)',
          backdropFilter: 'blur(20px)',
          borderRadius: 12,
          overflow: 'hidden',
          border: `1px solid ${colors.gray.border}`,
        }}>
          <MobileMiniHeader
            prof={selected}
            onBack={() => onMobileLevel('categories')}
          />
          <div style={{ padding: '14px 16px 20px' }}>
            {category === 'services' && (
              <CommissionServicesEditor
                key={selected.id}
                prof={selected}
                allServices={allServices}
                isMobile
                onChanged={onUpdated}
              />
            )}
          </div>
        </div>
      )
    }

    if (mobileLevel === 'categories' && selected) {
      return (
        <div style={{
          background: 'rgba(255,255,255,0.85)',
          backdropFilter: 'blur(20px)',
          borderRadius: 12,
          overflow: 'hidden',
          border: `1px solid ${colors.gray.border}`,
        }}>
          <MobileMiniHeader
            prof={selected}
            onBack={() => onMobileLevel('list')}
          />
          <CategoryList
            selected={category}
            onSelect={handleCategorySelect}
            summaries={summaries}
            variant="mobile"
          />
        </div>
      )
    }

    // mobile lista
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

  // ─── DESKTOP (3 colunas) ─────────────────────────────────────────
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: '220px 200px 1fr',
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
        borderRight: `1px solid ${colors.gray.border}`,
        background: 'rgba(255,255,255,0.5)',
        overflowY: 'auto',
      }}>
        {selected ? (
          <CategoryList
            selected={category}
            onSelect={setCategory}
            summaries={summaries}
            variant="desktop"
          />
        ) : (
          <div style={{
            padding: '40px 16px', textAlign: 'center',
            color: colors.gray.dimText, fontSize: 12,
            fontFamily: typography.fontFamily,
          }}>
            Selecione um profissional
          </div>
        )}
      </div>

      <div style={{
        overflowY: 'auto',
        padding: '16px 20px',
      }}>
        {!selected ? (
          <EmptyState />
        ) : category === 'services' ? (
          <CommissionServicesEditor
            key={selected.id}
            prof={selected}
            allServices={allServices}
            isMobile={false}
            onChanged={onUpdated}
          />
        ) : (
          <LockedCategory category={category} />
        )}
      </div>
    </div>
  )
}

function MobileMiniHeader({
  prof, onBack,
}: {
  prof:   Professional
  onBack: () => void
}) {
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
          WebkitTapHighlightColor: 'transparent',
        }}
      >
        <ChevronLeft size={18} strokeWidth={2.5} />
        Voltar
      </button>
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8 }}>
        <Avatar name={prof.name} size={28} url={prof.avatarUrl} />
        <div style={{
          fontSize: 13, fontWeight: 700,
          color: colors.gray[900],
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
        }}>
          {prof.name}
        </div>
      </div>
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
      <DollarSign size={32} style={{ opacity: 0.18 }} />
      <span style={{ fontSize: 13 }}>Selecione um profissional</span>
    </div>
  )
}

function LockedCategory({ category }: { category: CommissionCategoryId }) {
  const labels: Record<CommissionCategoryId, string> = {
    services:      'Serviços',
    products:      'Produtos',
    packages:      'Pacotes',
    giftcards:     'Cartões presente',
    subscriptions: 'Assinaturas',
  }
  const phases: Record<CommissionCategoryId, string> = {
    services:      '',
    products:      'Fase 2',
    packages:      'Fase 3',
    giftcards:     'Fase 4',
    subscriptions: 'Fase 5',
  }
  return (
    <div style={{
      height: '100%',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      gap: 10,
      color: colors.gray.dimText,
      padding: 40,
      fontFamily: typography.fontFamily,
      textAlign: 'center',
    }}>
      <div style={{ fontSize: 32, opacity: 0.18 }}>🔒</div>
      <div>
        <div style={{ fontSize: 14, fontWeight: 600, color: colors.gray[700], marginBottom: 4 }}>
          {labels[category]} — em breve
        </div>
        <div style={{ fontSize: 12 }}>
          Disponível na {phases[category]}
        </div>
      </div>
    </div>
  )
}
