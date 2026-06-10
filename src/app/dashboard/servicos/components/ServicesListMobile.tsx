'use client'
// src/app/dashboard/servicos/components/ServicesListMobile.tsx

import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { colors, typography, radius, shadows, glass } from '@/shared/theme'
import { Service } from '@/features/services/types'
import { groupByCategory } from '@/features/services/utils/format'
import ServiceRow from './ServiceRow'

interface Props {
  services: Service[]
  onEdit:   (s: Service) => void
  onDelete: (s: Service) => void
}

export default function ServicesListMobile({ services, onEdit, onDelete }: Props) {
  const grouped  = groupByCategory(services)
  const keys     = Object.keys(grouped)
  const multiCat = keys.length > 1

  const [collapsed, setCollapsed] = useState<Set<string>>(new Set())

  function toggleCat(cat: string) {
    setCollapsed(prev => {
      const next = new Set(prev)
      if (next.has(cat)) { next.delete(cat) } else { next.add(cat) }
      return next
    })
  }

  // Lista flat se só tiver 1 categoria
  if (!multiCat) {
    const items = grouped[keys[0]] ?? []
    return (
      <div style={{
        background: glass.surface.default.background,
        backdropFilter: glass.surface.default.backdropFilter,
        WebkitBackdropFilter: glass.surface.default.backdropFilter,
        borderRadius: radius.xl,
        border: `1px solid ${colors.gray.border}`,
        boxShadow: shadows.sm,
        overflow: 'hidden',
      }}>
        {items.map((s, idx) => (
          <div key={s.id} style={idx === items.length - 1 ? { borderBottom: 'none' } : undefined}>
            <ServiceRow service={s} isMobile onEdit={onEdit} onDelete={onDelete} />
          </div>
        ))}
      </div>
    )
  }

  // Agrupado com accordion
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {keys.map(cat => {
        const items    = grouped[cat]
        const isOpen   = !collapsed.has(cat)
        const catColor = items[0]?.serviceCategory?.color ?? null

        return (
          <div key={cat} style={{
            background: glass.surface.default.background,
            backdropFilter: glass.surface.default.backdropFilter,
            WebkitBackdropFilter: glass.surface.default.backdropFilter,
            borderRadius: radius.xl,
            border: `1px solid ${colors.gray.border}`,
            boxShadow: shadows.sm,
            overflow: 'hidden',
          }}>
            <button
              onClick={() => toggleCat(cat)}
              style={{
                width: '100%', display: 'flex', alignItems: 'center',
                padding: '11px 16px', gap: 8,
                background: 'rgba(245,245,247,0.7)',
                border: 'none',
                borderBottom: isOpen ? `1px solid ${colors.gray.border}` : 'none',
                cursor: 'pointer', fontFamily: 'inherit',
                WebkitTapHighlightColor: 'transparent',
                transition: 'background 0.15s',
              }}
            >
              {catColor !== null && (
                <div style={{
                  width: 8, height: 8, borderRadius: '50%',
                  background: catColor, flexShrink: 0,
                }} />
              )}
              <span style={{
                flex: 1, textAlign: 'left',
                fontSize: typography.scale.xs,
                fontWeight: typography.weight.bold,
                color: typography.color.muted,
                textTransform: 'uppercase',
                letterSpacing: '.07em',
              }}>
                {cat}
              </span>
              <span style={{ fontSize: typography.scale.xs, color: typography.color.muted, marginRight: 6 }}>
                {items.length}
              </span>
              <ChevronDown
                size={14}
                color={colors.gray.dimText}
                style={{
                  transition: 'transform 0.2s',
                  transform: isOpen ? 'rotate(0deg)' : 'rotate(-90deg)',
                  flexShrink: 0,
                }}
              />
            </button>

            {isOpen && items.map((s, idx) => (
              <div key={s.id} style={idx === items.length - 1 ? { borderBottom: 'none' } : undefined}>
                <ServiceRow service={s} isMobile onEdit={onEdit} onDelete={onDelete} />
              </div>
            ))}
          </div>
        )
      })}
    </div>
  )
}
