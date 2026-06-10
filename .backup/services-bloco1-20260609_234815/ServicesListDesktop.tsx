'use client'
// src/app/dashboard/servicos/components/ServicesListDesktop.tsx

import { colors, typography, radius, shadows, glass } from '@/shared/theme'
import { Service } from '@/features/services/types'
import { groupByCategory } from '@/features/services/utils/format'
import ServiceRow from './ServiceRow'

interface Props {
  services: Service[]
  onEdit:   (s: Service) => void
  onDelete: (s: Service) => void
}

export default function ServicesListDesktop({ services, onEdit, onDelete }: Props) {
  const grouped = groupByCategory(services)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {Object.entries(grouped).map(([category, items]) => (
        <div
          key={category}
          style={{
            background: glass.surface.default.background,
            backdropFilter: glass.surface.default.backdropFilter,
            borderRadius: radius.xl,
            border: `1px solid ${colors.gray.border}`,
            boxShadow: shadows.sm,
            overflow: 'hidden',
          }}
        >
          {/* Header da categoria */}
          <div style={{
            padding: '12px 20px',
            borderBottom: `1px solid ${colors.gray.border}`,
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            background: 'rgba(245,245,247,0.6)',
          }}>
            <span style={{
              fontSize: typography.scale.xs,
              fontWeight: typography.weight.bold,
              color: typography.color.muted,
              letterSpacing: '.07em',
              textTransform: 'uppercase',
            }}>
              {category}
            </span>
            <span style={{
              fontSize: typography.scale.xs,
              color: typography.color.muted,
            }}>
              {items.length} serviço{items.length !== 1 ? 's' : ''}
            </span>
          </div>

          {/* Linhas */}
          {items.map(s => (
            <ServiceRow
              key={s.id}
              service={s}
              isMobile={false}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))}
        </div>
      ))}
    </div>
  )
}
