'use client'
// src/app/dashboard/clientes/components/ClientsHeader.tsx

import { useRouter } from 'next/navigation'
import { UserPlus } from 'lucide-react'
import { colors, typography, radius, shadows } from '@/shared/theme'

interface Props {
  totalClients: number
  isMobile:     boolean
}

export default function ClientsHeader({ totalClients, isMobile }: Props) {
  const router = useRouter()

  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      marginBottom: isMobile ? 12 : 20,
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
          Clientes
        </h2>
        {!isMobile && (
          <p style={{
            margin: '3px 0 0',
            fontSize: typography.scale.sm,
            color: typography.color.muted,
          }}>
            {totalClients} cliente{totalClients !== 1 ? 's' : ''} cadastrado{totalClients !== 1 ? 's' : ''}
          </p>
        )}
      </div>

      <button
        onClick={() => router.push('/dashboard/clientes/novo')}
        style={{
          display: 'flex', alignItems: 'center', gap: 6,
          padding: isMobile ? '9px 14px' : '9px 16px',
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
        <UserPlus size={isMobile ? 14 : 15} strokeWidth={2.5} />
        {isMobile ? 'Novo' : 'Novo cliente'}
      </button>
    </div>
  )
}
