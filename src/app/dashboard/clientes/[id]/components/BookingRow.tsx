'use client'
// src/app/dashboard/clientes/[id]/components/BookingRow.tsx

import { Clock, CheckCircle, X, AlertCircle } from 'lucide-react'   // @eligi:bookingrow-icons
import type { LucideIcon } from 'lucide-react'
import dayjs from 'dayjs'
import 'dayjs/locale/pt-br'

import { colors, typography, radius } from '@/shared/theme'
import { colorToGradient } from '@/features/agenda/constants/serviceColors'

dayjs.locale('pt-br')

export interface BookingItem {
  id:               string
  startAt:          string
  endAt:            string
  status:           'CONFIRMED' | 'COMPLETED' | 'CANCELED' | 'NO_SHOW'   // @eligi:bookingrow-statustype
  serviceName:      string
  serviceColor:     string | null
  servicePrice:     number | null
  professionalName: string | null
}

interface Props {
  booking:  BookingItem
  isMobile: boolean
}

// @eligi:bookingrow-cfgmap
interface StatusCfg {
  label: string
  color: string
  bg:    string
  Icon:  LucideIcon
}

/** Usado quando o status vier de fora do mapa (enum novo no back, dado legado).
 *  Degradação elegante > página inteira no error boundary. */
const STATUS_FALLBACK: StatusCfg = {
  label: 'Agendado', color: colors.gray.dimText, bg: 'rgba(0,0,0,0.04)', Icon: Clock,
}

/** `| undefined` é DE PROPÓSITO: obriga o `??` no lookup e impede que um
 *  status desconhecido volte a derrubar o render. */
const STATUS_CFG: Record<string, StatusCfg | undefined> = {
  CONFIRMED: { label: 'Confirmado', color: colors.red.DEFAULT,   bg: colors.red.subtle,       Icon: Clock       },
  COMPLETED: { label: 'Concluído',  color: colors.slate.DEFAULT, bg: colors.slate.subtle,     Icon: CheckCircle },
  CANCELED:  { label: 'Cancelado',  color: colors.gray.dimText,  bg: 'rgba(0,0,0,0.04)',      Icon: X           },
  NO_SHOW:   { label: 'Não veio',   color: '#b45309',            bg: 'rgba(245,158,11,0.14)', Icon: AlertCircle },
}

export default function BookingRow({ booking: b, isMobile }: Props) {
  const cfg      = STATUS_CFG[b.status] ?? STATUS_FALLBACK   // @eligi:bookingrow-lookup
  const gradient = b.serviceColor ? colorToGradient(b.serviceColor) : colors.red.gradient

  // ─── Mobile: card vertical 2-linhas ───────────────────────────────────
  if (isMobile) {
    return (
      <div style={{
        display: 'flex', alignItems: 'stretch', gap: 10,
        padding: '11px 14px',
        borderBottom: `1px solid ${colors.gray.border}`,
      }}>
        {/* Barra colorida do serviço */}
        <div style={{
          width: 3, alignSelf: 'stretch',
          borderRadius: 2,
          background: gradient,
          flexShrink: 0,
        }} />

        {/* Conteúdo */}
        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 3 }}>
          {/* Linha 1: data + horário · status */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, lineHeight: 1.1 }}>
            <span style={{
              fontSize: typography.scale.base,
              fontWeight: typography.weight.semibold,
              color: typography.color.primary,
              fontVariantNumeric: 'tabular-nums',
            }}>
              {dayjs(b.startAt).format('DD MMM')}
            </span>
            <span style={{ color: colors.gray.dimTextLight, fontSize: typography.scale.sm }}>·</span>
            <span style={{
              fontSize: typography.scale.sm,
              color: typography.color.muted,
              fontVariantNumeric: 'tabular-nums',
            }}>
              {dayjs(b.startAt).format('HH:mm')}–{dayjs(b.endAt).format('HH:mm')}
            </span>
            <span style={{ flex: 1 }} />
            <span style={{
              padding: '2px 8px',
              borderRadius: radius.full,
              background: cfg.bg,
              fontSize: 10,
              fontWeight: typography.weight.bold,
              color: cfg.color,
              flexShrink: 0,
              letterSpacing: '0.02em',
            }}>
              {cfg.label}
            </span>
          </div>

          {/* Linha 2: serviço + (prof) · preço */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{
              flex: 1, minWidth: 0,
              fontSize: typography.scale.sm,
              color: typography.color.secondary,
              whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
            }}>
              <strong style={{
                color: typography.color.primary,
                fontWeight: typography.weight.semibold,
              }}>{b.serviceName}</strong>
              {b.professionalName && (
                <span style={{ color: typography.color.muted }}> · {b.professionalName}</span>
              )}
            </span>
            {b.servicePrice != null && (
              <span style={{
                fontSize: typography.scale.sm,
                fontWeight: typography.weight.bold,
                color: colors.red.DEFAULT,
                fontVariantNumeric: 'tabular-nums',
                flexShrink: 0,
              }}>
                R$ {b.servicePrice.toFixed(2).replace('.', ',')}
              </span>
            )}
          </div>
        </div>
      </div>
    )
  }

  // ─── Desktop: linha horizontal ────────────────────────────────────────
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 12,
      padding: '13px 20px',
      borderBottom: `1px solid ${colors.gray.border}`,
      transition: 'background 0.15s ease',
    }}>
      <div style={{
        width: 3, height: 42, borderRadius: 2,
        background: gradient,
        flexShrink: 0,
      }} />
      <div style={{ minWidth: 82, flexShrink: 0 }}>
        <div style={{
          fontSize: typography.scale.base,
          fontWeight: typography.weight.semibold,
          color: typography.color.primary,
        }}>
          {dayjs(b.startAt).format('DD MMM')}
        </div>
        <div style={{
          fontSize: typography.scale.sm,
          color: typography.color.muted,
          fontVariantNumeric: 'tabular-nums',
        }}>
          {dayjs(b.startAt).format('HH:mm')}–{dayjs(b.endAt).format('HH:mm')}
        </div>
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: typography.scale.base,
          fontWeight: typography.weight.semibold,
          color: typography.color.primary,
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
        }}>{b.serviceName}</div>
        {b.professionalName && (
          <div style={{ fontSize: typography.scale.sm, color: typography.color.muted }}>
            {b.professionalName}
          </div>
        )}
      </div>
      {b.servicePrice != null && (
        <div style={{
          fontSize: typography.scale.base,
          fontWeight: typography.weight.semibold,
          color: typography.color.primary,
          flexShrink: 0,
        }}>
          R$ {b.servicePrice.toFixed(2).replace('.', ',')}
        </div>
      )}
      <div style={{
        padding: '3px 10px',
        borderRadius: radius.full,
        background: cfg.bg,
        fontSize: typography.scale.xs,
        fontWeight: typography.weight.bold,
        color: cfg.color,
        flexShrink: 0,
      }}>
        {cfg.label}
      </div>
    </div>
  )
}
