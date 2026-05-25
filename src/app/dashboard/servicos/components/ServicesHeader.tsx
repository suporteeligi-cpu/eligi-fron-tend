'use client'
// src/app/dashboard/servicos/components/ServicesHeader.tsx

import { Plus } from 'lucide-react'
import { colors, typography, radius, shadows } from '@/shared/theme'

interface Props {
  totalServices: number
  isMobile:      boolean
  onCreate:      () => void
}

export default function ServicesHeader({ totalServices, isMobile, onCreate }: Props) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      marginBottom: isMobile ? 12 : 24,
      gap: 12,
    }}>
      <div style={{ minWidth: 0 }}>
        <h2 style={{
          margin: 0,
          fontSize: isMobile ? 22 : typography.scale['2xl'],
          fontWeight: typography.weight.bold,
          letterSpacing: '-0.025em',
          color: typography.color.primary,
        }}>
          Serviços
        </h2>
        {!isMobile && (
          <p style={{
            margin: '4px 0 0',
            fontSize: typography.scale.base,
            color: typography.color.muted,
          }}>
            {totalServices} serviço{totalServices !== 1 ? 's' : ''} cadastrado{totalServices !== 1 ? 's' : ''}
          </p>
        )}
      </div>

      <button
        onClick={onCreate}
        style={{
          display: 'flex', alignItems: 'center', gap: 6,
          padding: isMobile ? '9px 14px' : '10px 18px',
          borderRadius: radius.md,
          border: 'none',
          background: colors.red.gradient,
          color: '#fff',
          fontSize: isMobile ? typography.scale.sm : typography.scale.base,
          fontWeight: typography.weight.semibold,
          cursor: 'pointer',
          boxShadow: shadows.redMd,
          flexShrink: 0,
          WebkitTapHighlightColor: 'transparent',
          transition: 'transform 0.12s ease, box-shadow 0.12s ease',
        }}
        onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = shadows.redLg }}
        onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)';    e.currentTarget.style.boxShadow = shadows.redMd }}
      >
        <Plus size={isMobile ? 14 : 16} strokeWidth={2.5} />
        {isMobile ? 'Novo' : 'Novo serviço'}
      </button>
    </div>
  )
}
