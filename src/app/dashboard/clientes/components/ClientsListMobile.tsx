'use client'
// src/app/dashboard/clientes/components/ClientsListMobile.tsx

import { useRouter } from 'next/navigation'
import { Phone, ChevronRight } from 'lucide-react'
import dayjs from 'dayjs'
import 'dayjs/locale/pt-br'

import { colors, typography, radius, shadows, transitions, glass } from '@/shared/theme'
import { ClientListItem } from '@/features/clients/types'
import { avatarColor, getInitials, formatPhone, fmtRevenue } from '@/features/clients/utils/format'

dayjs.locale('pt-br')

interface Props {
  clients: ClientListItem[]
}

/**
 * Lista compacta de clientes para mobile.
 * Cada row: avatar 40px + nome + telefone, com KPI principal à direita.
 *
 * KPI hierarquia:
 * - Se tem receita > 0 → mostra receita destacada em vermelho
 * - Senão se tem última visita → mostra data
 * - Senão → "Sem histórico" em cinza
 */
export default function ClientsListMobile({ clients }: Props) {
  const router = useRouter()

  return (
    <>
      <style>{`
        .clm-list{
          background: ${glass.surface.default.background};
          backdrop-filter: ${glass.surface.default.backdropFilter};
          -webkit-backdrop-filter: ${glass.surface.default.backdropFilter};
          border-radius: ${radius.xl}px;
          border: 1px solid ${colors.gray.border};
          box-shadow: ${shadows.sm};
          overflow: hidden;
        }
        .clm-row{
          display: flex; align-items: center; gap: 12px;
          padding: 12px 14px;
          cursor: pointer;
          transition: background ${transitions.fast};
          border-bottom: 1px solid ${colors.gray.border};
          -webkit-tap-highlight-color: transparent;
        }
        .clm-row:last-child{ border-bottom: none }
        .clm-row:active{ background: ${colors.red.subtle} }
        .clm-avatar{
          width: 40px; height: 40px;
          border-radius: ${radius.full}px;
          color: #fff;
          font-size: ${typography.scale.base}px;
          font-weight: ${typography.weight.bold};
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
          box-shadow: ${shadows.sm};
          letter-spacing: -0.02em;
        }
        .clm-body{
          flex: 1; min-width: 0;
          display: flex; flex-direction: column; gap: 2px;
        }
        .clm-name{
          font-size: ${typography.scale.md}px;
          font-weight: ${typography.weight.semibold};
          color: ${typography.color.primary};
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
          letter-spacing: -0.01em;
        }
        .clm-phone{
          display: flex; align-items: center; gap: 4px;
          font-size: ${typography.scale.sm}px;
          color: ${typography.color.muted};
          font-variant-numeric: tabular-nums;
          white-space: nowrap;
        }
        .clm-kpi{
          display: flex; flex-direction: column; align-items: flex-end; gap: 2px;
          flex-shrink: 0;
        }
        .clm-kpi-value{
          font-size: ${typography.scale.base}px;
          font-weight: ${typography.weight.bold};
          font-variant-numeric: tabular-nums;
          white-space: nowrap;
          letter-spacing: -0.01em;
        }
        .clm-kpi-sub{
          font-size: ${typography.scale.xs}px;
          color: ${typography.color.muted};
          white-space: nowrap;
        }
        .clm-chev{ flex-shrink: 0; opacity: 0.4 }
      `}</style>

      <div className="clm-list">
        {clients.map(c => {
          const hasRevenue = c.totalRevenue > 0
          const hasVisit   = c.lastVisit != null

          // KPI principal — receita > visita > "sem histórico"
          let kpiValue: string = 'Sem histórico'
          let kpiSub:   string | null = null
          let kpiColor: string = typography.color.muted

          if (hasRevenue) {
            kpiValue = fmtRevenue(c.totalRevenue)
            kpiColor = colors.red.DEFAULT
            kpiSub   = c.totalBookings > 0
              ? `${c.completed} concluído${c.completed !== 1 ? 's' : ''}`
              : null
          } else if (hasVisit) {
            kpiValue = dayjs(c.lastVisit).format('DD MMM')
            kpiColor = typography.color.primary
            kpiSub   = 'última visita'
          }

          return (
            <div
              key={c.id}
              className="clm-row"
              onClick={() => router.push(`/dashboard/clientes/${c.id}`)}
              role="button"
              aria-label={`Cliente ${c.name}`}
            >
              {/* Avatar */}
              <div className="clm-avatar" style={{ background: avatarColor(c.name) }}>
                {getInitials(c.name)}
              </div>

              {/* Nome + telefone */}
              <div className="clm-body">
                <div className="clm-name">{c.name}</div>
                <div className="clm-phone">
                  <Phone size={11} color={colors.gray.dimText} strokeWidth={2} />
                  {formatPhone(c.phone)}
                </div>
              </div>

              {/* KPI */}
              <div className="clm-kpi">
                <span className="clm-kpi-value" style={{ color: kpiColor }}>
                  {kpiValue}
                </span>
                {kpiSub && (
                  <span className="clm-kpi-sub">{kpiSub}</span>
                )}
              </div>

              <ChevronRight size={16} color={colors.gray.dimText} className="clm-chev" strokeWidth={2} />
            </div>
          )
        })}
      </div>
    </>
  )
}
