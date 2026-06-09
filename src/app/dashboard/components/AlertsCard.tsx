'use client'
// src/app/dashboard/components/AlertsCard.tsx

import { useRouter } from 'next/navigation'
import { Bell, DollarSign, Package, ChevronRight, CheckCircle2 } from 'lucide-react'
import { colors, typography, radius, shadows } from '@/shared/theme'
import { DashboardAlerts } from '@/features/dashboard/types'
import { fmtBRL } from '@/features/dashboard/utils/format'

interface Props {
  alerts: DashboardAlerts
}

export default function AlertsCard({ alerts }: Props) {
  const router = useRouter()

  const hasCommissions = alerts.pendingCommissions.total > 0
  const hasLowStock    = alerts.lowStock.count > 0
  const hasAny         = hasCommissions || hasLowStock

  return (
    <div style={{
      background:    '#fff',
      border:        `0.5px solid ${colors.gray.borderMd}`,
      borderLeft:    `2.5px solid ${colors.red.DEFAULT}`,
      borderRadius:  radius.lg,
      boxShadow:     shadows.sm,
      padding:       '14px 16px',
      fontFamily:    typography.fontFamily,
      display:       'flex',
      flexDirection: 'column',
      gap:           10,
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{
          width:          24,
          height:         24,
          borderRadius:   7,
          background:     hasAny
            ? 'linear-gradient(135deg, #6366f1, #4f46e5)'
            : 'linear-gradient(135deg, #16a34a, #15803d)',
          display:        'flex',
          alignItems:     'center',
          justifyContent: 'center',
        }}>
          {hasAny
            ? <Bell        size={12} color="#fff" strokeWidth={2.4} />
            : <CheckCircle2 size={12} color="#fff" strokeWidth={2.4} />
          }
        </div>
        <span style={{
          fontSize:      10,
          fontWeight:    typography.weight.bold,
          color:         typography.color.muted,
          textTransform: 'uppercase',
          letterSpacing: '.07em',
        }}>
          {hasAny ? 'Avisos' : 'Tudo em ordem'}
        </span>
      </div>

      {!hasAny ? (
        <div style={{
          padding:   '20px 8px',
          textAlign: 'center',
          color:     typography.color.muted,
          fontSize:  typography.scale.sm,
        }}>
          Nenhuma pendência no momento
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {hasCommissions && (
            <AlertItem
              Icon={DollarSign}
              iconBg="linear-gradient(135deg, #6366f1, #4f46e5)"
              title={`${fmtBRL(alerts.pendingCommissions.total)} em comissões`}
              subtitle={`${alerts.pendingCommissions.professionals} profissional${alerts.pendingCommissions.professionals !== 1 ? 'is' : ''} aguardando pagamento`}
              onClick={() => router.push(alerts.pendingCommissions.href)}
            />
          )}

          {hasLowStock && (
            <AlertItem
              Icon={Package}
              iconBg="linear-gradient(135deg, #d97706, #b45309)"
              title={`${alerts.lowStock.count} produto${alerts.lowStock.count !== 1 ? 's' : ''} com estoque baixo`}
              subtitle={
                alerts.lowStock.items.length > 0
                  ? alerts.lowStock.items.map(i => i.name).join(', ')
                  : 'Verifique o estoque'
              }
              onClick={() => router.push(alerts.lowStock.href)}
            />
          )}
        </div>
      )}
    </div>
  )
}

function AlertItem({
  Icon, iconBg, title, subtitle, onClick,
}: {
  Icon:     React.ComponentType<{ size?: number; color?: string; strokeWidth?: number }>
  iconBg:   string
  title:    string
  subtitle: string
  onClick:  () => void
}) {
  return (
    <button
      onClick={onClick}
      style={{
        background:              colors.background.page,
        border:                  `0.5px solid ${colors.gray.borderMd}`,
        borderRadius:            radius.sm,
        padding:                 '9px 10px',
        cursor:                  'pointer',
        textAlign:               'left',
        fontFamily:              'inherit',
        display:                 'flex',
        alignItems:              'center',
        gap:                     10,
        transition:              'all 0.15s ease',
        WebkitTapHighlightColor: 'transparent',
        width:                   '100%',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.background  = '#fff'
        e.currentTarget.style.borderColor = colors.red.borderHover
      }}
      onMouseLeave={e => {
        e.currentTarget.style.background  = colors.background.page
        e.currentTarget.style.borderColor = colors.gray.borderMd
      }}
    >
      <div style={{
        width:          28,
        height:         28,
        borderRadius:   7,
        background:     iconBg,
        display:        'flex',
        alignItems:     'center',
        justifyContent: 'center',
        flexShrink:     0,
      }}>
        <Icon size={13} color="#fff" strokeWidth={2.4} />
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize:     typography.scale.sm,
          fontWeight:   typography.weight.bold,
          color:        typography.color.primary,
          whiteSpace:   'nowrap',
          overflow:     'hidden',
          textOverflow: 'ellipsis',
        }}>
          {title}
        </div>
        <div style={{
          fontSize:     10,
          color:        typography.color.muted,
          whiteSpace:   'nowrap',
          overflow:     'hidden',
          textOverflow: 'ellipsis',
        }}>
          {subtitle}
        </div>
      </div>

      <ChevronRight size={14} color={colors.gray.dimTextLight} style={{ flexShrink: 0 }} />
    </button>
  )
}
