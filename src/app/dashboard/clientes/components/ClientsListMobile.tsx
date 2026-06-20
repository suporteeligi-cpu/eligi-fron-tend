'use client'
// src/app/dashboard/clientes/components/ClientsListMobile.tsx
// sel-massa v1

import { useRef, type TouchEvent as ReactTouchEvent } from 'react'
import { useRouter } from 'next/navigation'
import { Phone, ChevronRight, Check } from 'lucide-react'
import dayjs from 'dayjs'
import 'dayjs/locale/pt-br'

import { colors, typography, radius, shadows, transitions, glass } from '@/shared/theme'
import { ClientListItem } from '@/features/clients/types'
import { avatarColor, getInitials, formatPhone, fmtRevenue } from '@/features/clients/utils/format'

dayjs.locale('pt-br')

interface Props {
  clients:         ClientListItem[]
  selectedIds:     Set<string>
  selectionActive: boolean
  onToggle:        (id: string) => void
}

/**
 * Lista compacta de clientes para mobile.
 * Toque: abre o cliente. Segure (long-press 420ms): entra em selecao.
 * Em modo selecao, toque alterna; toque-e-arraste (>8px) cancela o long-press.
 */
export default function ClientsListMobile({ clients, selectedIds, selectionActive, onToggle }: Props) {
  const router = useRouter()
  const lp = useRef<{ timer: ReturnType<typeof setTimeout> | null; startY: number; moved: boolean; fired: boolean }>({
    timer: null, startY: 0, moved: false, fired: false,
  })

  const handleTouchStart = (e: ReactTouchEvent<HTMLDivElement>, id: string) => {
    const s = lp.current
    s.startY = e.touches[0].clientY
    s.moved = false
    s.fired = false
    s.timer = setTimeout(() => {
      s.fired = true
      if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(40)
      onToggle(id)
      s.timer = null
    }, 420)
  }

  const handleTouchMove = (e: ReactTouchEvent<HTMLDivElement>) => {
    const s = lp.current
    if (Math.abs(e.touches[0].clientY - s.startY) > 8) {
      s.moved = true
      if (s.timer) { clearTimeout(s.timer); s.timer = null }
    }
  }

  const handleTouchEnd = () => {
    const s = lp.current
    if (s.timer) { clearTimeout(s.timer); s.timer = null }
  }

  const handleClick = (id: string) => {
    const s = lp.current
    if (s.fired) { s.fired = false; return }
    if (selectionActive) { onToggle(id); return }
    router.push(`/dashboard/clientes/${id}`)
  }

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
        .clm-row-sel{ background: rgba(220,38,38,0.08) }
        .clm-avatar{
          position: relative;
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
        .clm-check{
          position: absolute; inset: 0;
          border-radius: ${radius.full}px;
          background: ${colors.red.DEFAULT};
          display: flex; align-items: center; justify-content: center;
          animation: clmPop 0.2s cubic-bezier(.34,1.56,.64,1);
        }
        @keyframes clmPop{ from{ transform: scale(0.5); opacity: 0 } to{ transform: scale(1); opacity: 1 } }
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
          const sel        = selectedIds.has(c.id)
          const hasRevenue = c.totalRevenue > 0
          const hasVisit   = c.lastVisit != null

          let kpiValue: string = 'Sem historico'
          let kpiSub:   string | null = null
          let kpiColor: string = typography.color.muted

          if (hasRevenue) {
            kpiValue = fmtRevenue(c.totalRevenue)
            kpiColor = colors.red.DEFAULT
            kpiSub   = c.totalBookings > 0
              ? `${c.completed} concluido${c.completed !== 1 ? 's' : ''}`
              : null
          } else if (hasVisit) {
            kpiValue = dayjs(c.lastVisit).format('DD MMM')
            kpiColor = typography.color.primary
            kpiSub   = 'ultima visita'
          }

          return (
            <div
              key={c.id}
              className={`clm-row${sel ? ' clm-row-sel' : ''}`}
              onClick={() => handleClick(c.id)}
              onTouchStart={(e) => handleTouchStart(e, c.id)}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
              role="button"
              aria-label={`Cliente ${c.name}`}
            >
              {/* Avatar */}
              <div className="clm-avatar" style={{ background: avatarColor(c.name) }}>
                {getInitials(c.name)}
                {sel && (
                  <span className="clm-check">
                    <Check size={16} strokeWidth={3} color="#fff" />
                  </span>
                )}
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

              {!selectionActive && (
                <ChevronRight size={16} color={colors.gray.dimText} className="clm-chev" strokeWidth={2} />
              )}
            </div>
          )
        })}
      </div>
    </>
  )
}
