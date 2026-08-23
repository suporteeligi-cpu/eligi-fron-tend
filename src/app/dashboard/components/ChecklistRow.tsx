'use client'
// src/app/dashboard/components/ChecklistRow.tsx
// @eligi:checklist-row
// Linha de item do checklist de configuracao.
//
// Movida do OnboardingChecklistCard na fatia 2 SEM mudanca de comportamento:
// segue clicavel por teclado (role/tabIndex/Enter/Espaco), com badge
// contextual (trial / sem foto / progresso) e estado concluido apagado.

import { CheckCircle2, Circle, ChevronRight } from 'lucide-react'
import { typography, colors } from '@/shared/theme'
import { ChecklistItem } from '@/features/dashboard/hooks/useOnboardingChecklist'

const GREEN    = '#16a34a'
const AMBER_BG = 'rgba(234,179,8,0.14)'
const AMBER_FG = '#a16207'

const badgeBase: React.CSSProperties = {
  fontSize:     11,
  padding:      '3px 9px',
  borderRadius: 8,
  whiteSpace:   'nowrap',
  flexShrink:   0,
}

/** Badge do lado direito da linha — so aparece quando agrega informacao. */
function ItemBadge({ item }: { item: ChecklistItem }) {
  if (item.done) return null

  const trial = item.meta?.trialDaysLeft
  if (typeof trial === 'number' && trial > 0) {
    return (
      <span style={{ ...badgeBase, background: AMBER_BG, color: AMBER_FG }}>
        {trial} {trial === 1 ? 'dia' : 'dias'} de trial
      </span>
    )
  }

  const missing = item.meta?.missing
  if (typeof missing === 'number' && missing > 0) {
    return (
      <span style={{
        ...badgeBase,
        background: 'rgba(220,38,38,0.10)',
        color:      colors.red.DEFAULT,
      }}>
        {missing} sem foto
      </span>
    )
  }

  const current = item.meta?.current
  const target  = item.meta?.target
  if (typeof current === 'number' && typeof target === 'number') {
    return (
      <span style={{
        ...badgeBase,
        background: 'rgba(0,0,0,0.05)',
        color:      typography.color.muted,
      }}>
        {current} de {target}
      </span>
    )
  }

  return null
}

export default function ChecklistRow({
  item,
  onGo,
}: {
  item: ChecklistItem
  onGo: (href: string) => void
}) {
  const clickable = !item.done

  const activate = () => {
    if (clickable) onGo(item.href)
  }

  return (
    <div
      role={clickable ? 'button' : undefined}
      tabIndex={clickable ? 0 : undefined}
      aria-label={clickable ? item.label : undefined}
      onClick={activate}
      onKeyDown={(e) => {
        if (!clickable) return
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          activate()
        }
      }}
      style={{
        display:      'flex',
        alignItems:   'center',
        gap:          12,
        padding:      '10px 6px',
        borderRadius: 8,
        cursor:       clickable ? 'pointer' : 'default',
        transition:   'background 0.15s',
        outline:      'none',
      }}
      onMouseEnter={(e) => {
        if (clickable) (e.currentTarget as HTMLDivElement).style.background = 'rgba(0,0,0,0.03)'
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLDivElement).style.background = 'transparent'
      }}
      onFocus={(e) => {
        if (clickable) (e.currentTarget as HTMLDivElement).style.background = 'rgba(0,0,0,0.05)'
      }}
      onBlur={(e) => {
        (e.currentTarget as HTMLDivElement).style.background = 'transparent'
      }}
    >
      {item.done ? (
        <CheckCircle2 size={20} color={GREEN} style={{ flexShrink: 0 }} />
      ) : (
        <Circle size={20} color="rgba(0,0,0,0.25)" style={{ flexShrink: 0 }} />
      )}

      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 2 }}>
        <span style={{
          fontSize: 14,
          color:    item.done ? typography.color.muted : typography.color.primary,
        }}>
          {item.label}
        </span>
        {!item.done && item.hint && (
          <span style={{ fontSize: 11.5, color: typography.color.muted, lineHeight: 1.35 }}>
            {item.hint}
          </span>
        )}
      </div>

      <ItemBadge item={item} />

      {clickable && <ChevronRight size={18} color="rgba(0,0,0,0.3)" style={{ flexShrink: 0 }} />}
    </div>
  )
}
