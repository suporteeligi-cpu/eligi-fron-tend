'use client'
// src/app/dashboard/servicos/components/ServiceRow.tsx

import { Clock, Pencil, Trash2, ChevronRight } from 'lucide-react'
import { colors, typography, radius, transitions } from '@/shared/theme'
import { Service } from '@/features/services/types'
import { formatDuration, formatPrice } from '@/features/services/utils/format'
import { colorHexToGradient } from '@/features/services/constants/colorPalette'

interface Props {
  service:   Service
  isMobile:  boolean
  onEdit:    (s: Service) => void
  onDelete:  (s: Service) => void
}

export default function ServiceRow({ service: s, isMobile, onEdit, onDelete }: Props) {
  const gradient = colorHexToGradient(s.color)

  // ─── Mobile: card vertical compacto ───────────────────────────────
  if (isMobile) {
    return (
      <div
        onClick={() => onEdit(s)}
        role="button"
        aria-label={`Editar ${s.name}`}
        style={{
          display: 'flex', alignItems: 'center', gap: 12,
          padding: '12px 14px',
          borderBottom: `1px solid ${colors.gray.border}`,
          cursor: 'pointer',
          WebkitTapHighlightColor: 'transparent',
          transition: `background ${transitions.fast}`,
        }}
      >
        {/* Bolinha colorida */}
        <div style={{
          width: 38, height: 38, borderRadius: '50%',
          background: gradient,
          flexShrink: 0,
          boxShadow: '0 2px 6px rgba(0,0,0,0.08)',
        }} />

        {/* Nome + duração + descrição (1 linha) */}
        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 2 }}>
          <div style={{
            fontSize: typography.scale.md,
            fontWeight: typography.weight.semibold,
            color: typography.color.primary,
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
            letterSpacing: '-0.01em',
          }}>
            {s.name}
          </div>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 4,
            fontSize: typography.scale.sm,
            color: typography.color.muted,
          }}>
            <Clock size={11} color={colors.gray.dimText} strokeWidth={2} />
            <span>{formatDuration(s.duration)}</span>
            {s.category && (
              <>
                <span style={{ color: colors.gray.dimTextLight }}>·</span>
                <span style={{
                  whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                  flex: 1, minWidth: 0,
                }}>
                  {s.category}
                </span>
              </>
            )}
          </div>
        </div>

        {/* Preço + chevron */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 6,
          flexShrink: 0,
        }}>
          <span style={{
            fontSize: typography.scale.base,
            fontWeight: typography.weight.bold,
            color: s.price != null && s.price > 0
              ? colors.red.DEFAULT
              : typography.color.muted,
            fontVariantNumeric: 'tabular-nums',
            whiteSpace: 'nowrap',
          }}>
            {formatPrice(s.price)}
          </span>
          <ChevronRight size={16} color={colors.gray.dimText} strokeWidth={2} />
        </div>
      </div>
    )
  }

  // ─── Desktop: linha horizontal com hover-actions ───────────────────
  return (
    <>
      <style>{`
        .svc-row{
          display: flex; align-items: center; gap: 12px;
          padding: 14px 20px;
          cursor: pointer;
          transition: background ${transitions.fast};
          border-bottom: 1px solid ${colors.gray.border};
        }
        .svc-row:last-child{ border-bottom: none }
        .svc-row:hover{ background: ${colors.red.subtle} }
        .svc-row:hover .svc-actions{ opacity: 1 }
        .svc-actions{
          opacity: 0;
          display: flex; gap: 4px;
          transition: opacity ${transitions.fast};
        }
        .svc-icon-btn{
          width: 30px; height: 30px;
          border-radius: ${radius.sm}px;
          border: 1px solid ${colors.gray.borderMd};
          background: rgba(255,255,255,0.8);
          cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          transition: all ${transitions.fast};
        }
        .svc-icon-btn:hover{
          background: ${colors.red.subtle};
          border-color: ${colors.red.borderHover};
        }
        .svc-icon-btn.del:hover{
          background: rgba(220,38,38,0.10);
        }
      `}</style>

      <div className="svc-row" onClick={() => onEdit(s)}>
        {/* Barra colorida do serviço */}
        <div style={{
          width: 3, height: 36, borderRadius: 2,
          background: gradient,
          flexShrink: 0,
        }} />

        {/* Nome + duração */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontSize: typography.scale.md,
            fontWeight: typography.weight.semibold,
            color: typography.color.primary,
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          }}>
            {s.name}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
            <Clock size={11} color={colors.gray.dimText} />
            <span style={{ fontSize: typography.scale.sm, color: typography.color.muted }}>
              {formatDuration(s.duration)}
            </span>
          </div>
        </div>

        {/* Preço */}
        <span style={{
          fontSize: typography.scale.md,
          fontWeight: typography.weight.semibold,
          color: s.price != null && s.price > 0
            ? typography.color.primary
            : typography.color.muted,
          minWidth: 80, textAlign: 'right',
          fontVariantNumeric: 'tabular-nums',
        }}>
          {formatPrice(s.price)}
        </span>

        {/* Ações */}
        <div className="svc-actions" onClick={e => e.stopPropagation()}>
          <button
            className="svc-icon-btn"
            onClick={() => onEdit(s)}
            title="Editar"
            aria-label="Editar serviço"
          >
            <Pencil size={13} color={typography.color.secondary} />
          </button>
          <button
            className="svc-icon-btn del"
            onClick={() => onDelete(s)}
            title="Excluir"
            aria-label="Excluir serviço"
          >
            <Trash2 size={13} color={colors.red.DEFAULT} />
          </button>
        </div>

        <ChevronRight size={15} color={colors.gray.dimText} />
      </div>
    </>
  )
}
