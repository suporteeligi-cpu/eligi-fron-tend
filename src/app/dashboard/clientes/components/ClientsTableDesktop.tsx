'use client'
// src/app/dashboard/clientes/components/ClientsTableDesktop.tsx
// sel-massa v1

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

export default function ClientsTableDesktop({ clients, selectedIds, selectionActive, onToggle }: Props) {
  const router = useRouter()

  return (
    <>
      <style>{`
        .cl-row{
          display: flex; align-items: center; gap: 14px;
          padding: 13px 20px;
          cursor: pointer;
          transition: background ${transitions.fast};
          border-bottom: 1px solid ${colors.gray.border};
        }
        .cl-row:last-child{ border-bottom: none }
        .cl-row:hover{ background: ${colors.red.subtle} }
        .cl-row:hover .cl-arrow{ opacity: 1; transform: translateX(2px) }
        .cl-arrow{ opacity: 0; transition: all ${transitions.fast} }
        .cl-row-sel{ background: rgba(220,38,38,0.09) }
        .cl-row-sel:hover{ background: rgba(220,38,38,0.13) }
        .cl-av-wrap{
          position: relative; width: 42px; height: 42px;
          flex-shrink: 0; cursor: pointer; border-radius: 50%;
        }
        .cl-av-check{
          position: absolute; inset: 0; border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          background: rgba(0,0,0,0.45);
          opacity: 0; transition: opacity 0.15s ease;
        }
        .cl-selecting .cl-av-check{ opacity: 0.5 }
        .cl-row:hover .cl-av-check{ opacity: 1 }
        .cl-row-sel .cl-av-check{ opacity: 1; background: ${colors.red.DEFAULT} }
      `}</style>

      <div className={selectionActive ? 'cl-table cl-selecting' : 'cl-table'} style={{
        background: glass.surface.default.background,
        backdropFilter: glass.surface.default.backdropFilter,
        borderRadius: radius.xl,
        border: `1px solid ${colors.gray.border}`,
        boxShadow: shadows.sm,
        overflow: 'hidden',
      }}>
        {/* Cabecalho */}
        <div style={{
          padding: '9px 20px',
          borderBottom: `1px solid ${colors.gray.border}`,
          display: 'flex', alignItems: 'center', gap: 14,
          background: 'rgba(245,245,247,0.6)',
        }}>
          <div style={{ width: 42, flexShrink: 0 }} />
          <div style={{ flex: 1, fontSize: typography.scale.xs, fontWeight: typography.weight.bold, color: typography.color.muted, textTransform: 'uppercase', letterSpacing: '.07em' }}>Cliente</div>
          <div style={{ width: 70, textAlign: 'center', fontSize: typography.scale.xs, fontWeight: typography.weight.bold, color: typography.color.muted, textTransform: 'uppercase', letterSpacing: '.07em' }}>Agend.</div>
          <div style={{ width: 70, textAlign: 'center', fontSize: typography.scale.xs, fontWeight: typography.weight.bold, color: '#16a34a', textTransform: 'uppercase', letterSpacing: '.07em' }}>Concl.</div>
          <div style={{ width: 70, textAlign: 'center', fontSize: typography.scale.xs, fontWeight: typography.weight.bold, color: colors.gray.dimText, textTransform: 'uppercase', letterSpacing: '.07em' }}>Canc.</div>
          <div style={{ width: 110, textAlign: 'right', fontSize: typography.scale.xs, fontWeight: typography.weight.bold, color: colors.red.DEFAULT, textTransform: 'uppercase', letterSpacing: '.07em' }}>Receita</div>
          <div style={{ width: 90, fontSize: typography.scale.xs, fontWeight: typography.weight.bold, color: typography.color.muted, textTransform: 'uppercase', letterSpacing: '.07em' }}>Ultima visita</div>
          <div style={{ width: 16 }} />
        </div>

        {clients.map(c => {
          const sel = selectedIds.has(c.id)
          return (
          <div
            key={c.id}
            className={`cl-row${sel ? ' cl-row-sel' : ''}`}
            onClick={() => router.push(`/dashboard/clientes/${c.id}`)}
            role="button"
            aria-label={`Cliente ${c.name}`}
          >
            <div
              className="cl-av-wrap"
              onClick={(e) => { e.stopPropagation(); onToggle(c.id) }}
              role="checkbox"
              aria-checked={sel}
              aria-label={`Selecionar ${c.name}`}
            >
              <div style={{
                width: 42, height: 42, borderRadius: radius.full,
                background: avatarColor(c.name),
                color: '#fff', fontSize: typography.scale.base, fontWeight: typography.weight.bold,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: shadows.sm,
              }}>
                {getInitials(c.name)}
              </div>
              <span className="cl-av-check"><Check size={18} strokeWidth={3} color="#fff" /></span>
            </div>

            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{
                fontSize: typography.scale.md, fontWeight: typography.weight.semibold,
                color: typography.color.primary,
                whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
              }}>
                {c.name}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
                <Phone size={11} color={colors.gray.dimText} />
                <span style={{ fontSize: typography.scale.sm, color: typography.color.muted, fontVariantNumeric: 'tabular-nums' }}>
                  {formatPhone(c.phone)}
                </span>
              </div>
            </div>

            <div style={{ width: 70, textAlign: 'center' }}>
              <span style={{
                fontSize: typography.scale.lg, fontWeight: typography.weight.bold,
                color: c.totalBookings > 0 ? typography.color.primary : typography.color.muted,
              }}>
                {c.totalBookings}
              </span>
            </div>

            <div style={{ width: 70, textAlign: 'center' }}>
              <span style={{
                fontSize: typography.scale.base, fontWeight: typography.weight.semibold,
                color: c.completed > 0 ? '#16a34a' : typography.color.muted,
              }}>
                {c.completed}
              </span>
            </div>

            <div style={{ width: 70, textAlign: 'center' }}>
              <span style={{
                fontSize: typography.scale.base, fontWeight: typography.weight.semibold,
                color: c.canceled > 0 ? colors.gray.dimText : typography.color.muted,
              }}>
                {c.canceled}
              </span>
            </div>

            <div style={{ width: 110, textAlign: 'right' }}>
              <span style={{
                fontSize: typography.scale.base, fontWeight: typography.weight.bold,
                color: c.totalRevenue > 0 ? colors.red.DEFAULT : typography.color.muted,
                fontVariantNumeric: 'tabular-nums',
              }}>
                {fmtRevenue(c.totalRevenue)}
              </span>
            </div>

            <div style={{ width: 90 }}>
              <span style={{ fontSize: typography.scale.sm, color: typography.color.muted }}>
                {c.lastVisit ? dayjs(c.lastVisit).format('DD MMM YY') : '—'}
              </span>
            </div>

            <ChevronRight size={15} color={colors.gray.dimText} className="cl-arrow" />
          </div>
          )
        })}
      </div>
    </>
  )
}
