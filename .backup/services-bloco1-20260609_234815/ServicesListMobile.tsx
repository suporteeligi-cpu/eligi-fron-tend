'use client'
// src/app/dashboard/servicos/components/ServicesListMobile.tsx

import { colors, radius, shadows, glass } from '@/shared/theme'
import { Service } from '@/features/services/types'
import ServiceRow from './ServiceRow'

interface Props {
  services: Service[]
  onEdit:   (s: Service) => void
  onDelete: (s: Service) => void
}

/**
 * Lista flat de serviços para mobile (sem agrupamento por categoria).
 * Long-press abre o menu de excluir (TODO futuro).
 */
export default function ServicesListMobile({ services, onEdit, onDelete }: Props) {
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
      {services.map((s, idx) => (
        <div key={s.id} style={idx === services.length - 1 ? { borderBottom: 'none' } : undefined}>
          <ServiceRow
            service={s}
            isMobile={true}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        </div>
      ))}
    </div>
  )
}
