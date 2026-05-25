'use client'
// src/app/dashboard/equipe/components/CategoryList.tsx

import {
  Scissors, Package, Gift, CreditCard, Repeat, Lock, ChevronRight,
} from 'lucide-react'
import { colors, typography, transitions } from '@/shared/theme'
import {
  COMMISSION_CATEGORIES, CommissionCategoryId,
} from '@/features/professionals/constants/commissionCategories'

const ICON_MAP = {
  Scissors, Package, Gift, CreditCard, Repeat,
} as const

interface Props {
  selected:   CommissionCategoryId
  onSelect:   (id: CommissionCategoryId) => void
  /** Resumo por categoria (ex: "38% padrão") — mostrado abaixo do nome */
  summaries?: Partial<Record<CommissionCategoryId, string>>
  /** "mobile" mostra como cards full-width navegáveis, "desktop" como sidebar */
  variant?:   'desktop' | 'mobile'
}

export default function CategoryList({
  selected, onSelect, summaries = {}, variant = 'desktop',
}: Props) {
  const isMobile = variant === 'mobile'

  return (
    <div style={{
      padding: isMobile ? 0 : '12px 8px',
      fontFamily: typography.fontFamily,
    }}>
      {!isMobile && (
        <div style={{
          fontSize: 10, fontWeight: 700,
          color: colors.gray.dimText,
          textTransform: 'uppercase',
          letterSpacing: '.07em',
          padding: '0 8px 8px',
        }}>
          Comissão padrão
        </div>
      )}

      {COMMISSION_CATEGORIES.map(cat => {
        const Icon = ICON_MAP[cat.icon as keyof typeof ICON_MAP]
        const isSelected = !cat.locked && selected === cat.id
        const summary = !cat.locked ? summaries[cat.id] : cat.phaseLabel

        return (
          <button
            key={cat.id}
            onClick={() => !cat.locked && onSelect(cat.id)}
            disabled={cat.locked}
            style={{
              width: '100%',
              display: 'flex', alignItems: 'center', gap: 10,
              padding: isMobile ? '12px 14px' : '9px 11px',
              border: 'none',
              textAlign: 'left',
              cursor: cat.locked ? 'not-allowed' : 'pointer',
              background: isSelected
                ? 'rgba(255,255,255,0.95)'
                : 'transparent',
              borderRadius: isMobile ? 0 : 9,
              borderLeft: isSelected
                ? `3px solid ${colors.red.DEFAULT}`
                : '3px solid transparent',
              borderBottom: isMobile
                ? `1px solid ${colors.gray.border}`
                : 'none',
              opacity: cat.locked ? 0.45 : 1,
              transition: `all ${transitions.fast}`,
              marginBottom: isMobile ? 0 : 2,
              boxShadow: isSelected ? '0 2px 8px rgba(0,0,0,0.04)' : 'none',
              WebkitTapHighlightColor: 'transparent',
              fontFamily: 'inherit',
            }}
            onMouseEnter={e => {
              if (!cat.locked && !isSelected)
                e.currentTarget.style.background = 'rgba(255,255,255,0.5)'
            }}
            onMouseLeave={e => {
              if (!cat.locked && !isSelected)
                e.currentTarget.style.background = 'transparent'
            }}
          >
            <div style={{
              width: 32, height: 32, borderRadius: 8,
              background: isSelected ? colors.red.subtle : colors.background.page,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: isSelected ? colors.red.DEFAULT : colors.gray.dimText,
              flexShrink: 0,
              transition: `all ${transitions.fast}`,
            }}>
              <Icon size={16} strokeWidth={2} />
            </div>

            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{
                fontSize: isMobile ? 14 : 13,
                fontWeight: 600,
                color: isSelected ? colors.red.DEFAULT : colors.gray[900],
                display: 'flex', alignItems: 'center', gap: 4,
                letterSpacing: '-0.01em',
              }}>
                {cat.locked && <Lock size={10} strokeWidth={2.5} style={{ flexShrink: 0 }} />}
                <span style={{
                  whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                }}>
                  {cat.label}
                </span>
              </div>
              {summary && (
                <div style={{
                  fontSize: 11,
                  color: colors.gray.dimText,
                  marginTop: 1,
                  whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                }}>
                  {summary}
                </div>
              )}
            </div>

            {isMobile && !cat.locked && (
              <ChevronRight
                size={16}
                color={colors.gray.dimText}
                strokeWidth={2}
              />
            )}
          </button>
        )
      })}
    </div>
  )
}
