'use client'
// src/app/dashboard/financeiro/comissoes/components/PayoutSettingsCard.tsx

import { Settings, Calendar, AlertCircle } from 'lucide-react'
import { colors, typography, radius, shadows } from '@/shared/theme'
import { PayoutSettings } from '@/features/payouts/types'
import { freqLabel } from '@/features/payouts/utils/format'

interface Props {
  settings: PayoutSettings | null
  loading:  boolean
  onClick:  () => void
}

export default function PayoutSettingsCard({ settings, loading, onClick }: Props) {
  if (loading) {
    return (
      <div style={{
        padding: '14px 16px',
        background: colors.background.surface,
        border: `1px solid ${colors.gray.border}`,
        borderRadius: radius.lg,
        height: 68,
        opacity: 0.5,
        marginBottom: 16,
      }} />
    )
  }

  // Sem settings configurado ainda OU desabilitado
  const isUnconfigured = !settings || !settings.enabled

  if (isUnconfigured) {
    return (
      <button
        onClick={onClick}
        style={{
          width: '100%',
          padding: '14px 16px',
          background: 'rgba(220, 38, 38, 0.05)',
          border: `1px dashed ${colors.red.border}`,
          borderRadius: radius.lg,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          textAlign: 'left',
          fontFamily: typography.fontFamily,
          marginBottom: 16,
          transition: 'all 0.15s ease',
          WebkitTapHighlightColor: 'transparent',
        }}
        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(220, 38, 38, 0.08)' }}
        onMouseLeave={e => { e.currentTarget.style.background = 'rgba(220, 38, 38, 0.05)' }}
      >
        <div style={{
          width: 36, height: 36, borderRadius: '50%',
          background: colors.red.subtle,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
        }}>
          <AlertCircle size={18} color={colors.red.DEFAULT} strokeWidth={2.2} />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{
            fontSize: typography.scale.base,
            fontWeight: typography.weight.semibold,
            color: typography.color.primary,
          }}>
            Pagamento de comissões não configurado
          </div>
          <div style={{
            fontSize: typography.scale.sm,
            color: typography.color.muted,
            marginTop: 2,
          }}>
            Configure a frequência e o dia de pagamento para começar
          </div>
        </div>
        <span style={{
          fontSize: typography.scale.xs,
          fontWeight: typography.weight.bold,
          color: colors.red.DEFAULT,
          textTransform: 'uppercase',
          letterSpacing: '.06em',
          padding: '5px 10px',
          background: '#fff',
          border: `1px solid ${colors.red.border}`,
          borderRadius: radius.sm,
          flexShrink: 0,
        }}>
          Configurar
        </span>
      </button>
    )
  }

  // Configurado e habilitado
  const types: string[] = []
  if (settings.includeServices) types.push('Serviços')
  if (settings.includeProducts) types.push('Produtos')

  return (
    <button
      onClick={onClick}
      style={{
        width: '100%',
        padding: '14px 16px',
        background: '#fff',
        border: `1px solid ${colors.gray.border}`,
        borderRadius: radius.lg,
        boxShadow: shadows.sm,
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        textAlign: 'left',
        fontFamily: typography.fontFamily,
        marginBottom: 16,
        transition: 'all 0.15s ease',
        WebkitTapHighlightColor: 'transparent',
      }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = colors.red.borderHover }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = colors.gray.border }}
    >
      <div style={{
        width: 36, height: 36, borderRadius: '50%',
        background: colors.red.gradient,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0,
      }}>
        <Calendar size={17} color="#fff" strokeWidth={2.2} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: 10,
          fontWeight: typography.weight.bold,
          color: typography.color.muted,
          textTransform: 'uppercase',
          letterSpacing: '.07em',
          marginBottom: 2,
        }}>
          Pagamento configurado
        </div>
        <div style={{
          fontSize: typography.scale.base,
          fontWeight: typography.weight.semibold,
          color: typography.color.primary,
        }}>
          {freqLabel(settings.frequency, settings.weekday, settings.monthDay)}
        </div>
        <div style={{
          fontSize: typography.scale.sm,
          color: typography.color.muted,
          marginTop: 1,
        }}>
          Incluindo: {types.join(' e ')}
        </div>
      </div>
      <div style={{
        width: 32, height: 32, borderRadius: '50%',
        background: colors.background.page,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0,
      }}>
        <Settings size={14} color={colors.gray.dimText} strokeWidth={2} />
      </div>
    </button>
  )
}
