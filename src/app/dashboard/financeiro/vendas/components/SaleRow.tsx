'use client'
// src/app/dashboard/financeiro/vendas/components/SaleRow.tsx

import { useState } from 'react'
import { ChevronDown, ChevronRight, Briefcase, Package } from 'lucide-react'
import { colors, typography, radius } from '@/shared/theme'
import { SaleReportRow } from '@/features/sales-report/types'
import { fmtBRL, fmtDateTime, methodLabel, statusLabel } from '@/features/sales-report/utils'

interface Props {
  sale:     SaleReportRow
  isMobile: boolean
}

export default function SaleRow({ sale, isMobile }: Props) {
  const [expanded, setExpanded] = useState(false)

  const isCanceled = sale.status === 'CANCELED'
  const hasCredit  = sale.creditTotal > 0

  const statusColor = isCanceled ? colors.gray.dimText : '#16a34a'
  const statusBg    = isCanceled ? 'rgba(0,0,0,0.04)' : 'rgba(22,163,74,0.08)'

  return (
    <div style={{
      background: '#fff',
      border: `1px solid ${colors.gray.border}`,
      borderRadius: radius.md,
      fontFamily: typography.fontFamily,
      overflow: 'hidden',
    }}>
      {/* Linha principal */}
      <button
        onClick={() => setExpanded(e => !e)}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          padding: '11px 13px',
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
          textAlign: 'left',
          fontFamily: 'inherit',
          WebkitTapHighlightColor: 'transparent',
        }}
      >
        {/* Chevron */}
        <div style={{ flexShrink: 0, color: colors.gray.dimText }}>
          {expanded ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
        </div>

        {/* Cliente + data */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontSize: typography.scale.sm,
            fontWeight: typography.weight.semibold,
            color: typography.color.primary,
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
            textDecoration: isCanceled ? 'line-through' : 'none',
          }}>
            {sale.clientName ?? 'Cliente avulso'}
          </div>
          <div style={{
            fontSize: 10,
            color: typography.color.muted,
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          }}>
            {fmtDateTime(sale.confirmedAt)}
            {sale.itemsCount > 0 && ` · ${sale.itemsCount} ${sale.itemsCount === 1 ? 'item' : 'itens'}`}
            {!isMobile && sale.methods.length > 0 && ` · ${sale.methods.map(methodLabel).join(', ')}`}
          </div>
        </div>

        {/* Status badge */}
        {!isMobile && (
          <span style={{
            padding: '3px 8px',
            borderRadius: radius.full,
            background: statusBg,
            color: statusColor,
            fontSize: 9,
            fontWeight: typography.weight.bold,
            textTransform: 'uppercase',
            letterSpacing: '.04em',
            flexShrink: 0,
          }}>
            {statusLabel(sale.status)}
          </span>
        )}

        {/* Valor */}
        <div style={{ flexShrink: 0, textAlign: 'right' }}>
          <div style={{
            fontSize: typography.scale.sm,
            fontWeight: typography.weight.bold,
            color: isCanceled ? colors.gray.dimText : typography.color.primary,
            fontVariantNumeric: 'tabular-nums',
            textDecoration: isCanceled ? 'line-through' : 'none',
          }}>
            {fmtBRL(sale.netTotal)}
          </div>
          {hasCredit && (
            <div style={{
              fontSize: 9,
              color: '#d97706',
              fontWeight: typography.weight.semibold,
            }}>
              NC: {fmtBRL(sale.creditTotal)}
            </div>
          )}
        </div>
      </button>

      {/* Detalhe expandido */}
      {expanded && (
        <div style={{
          padding: '0 13px 12px 38px',
          borderTop: `1px solid ${colors.gray.border}`,
          paddingTop: 10,
        }}>
          {/* Itens */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5, marginBottom: 8 }}>
            {sale.items.map(it => (
              <div key={it.id} style={{
                display: 'flex', alignItems: 'center', gap: 8,
                fontSize: 11,
              }}>
                {it.type === 'SERVICE'
                  ? <Briefcase size={11} color={colors.gray.dimText} />
                  : <Package size={11} color={colors.gray.dimText} />
                }
                <span style={{
                  flex: 1, minWidth: 0,
                  color: typography.color.primary,
                  whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                }}>
                  {it.quantity > 1 && `${it.quantity}× `}{it.name}
                  {it.professional && (
                    <span style={{ color: typography.color.muted }}> · {it.professional}</span>
                  )}
                </span>
                <span style={{
                  color: typography.color.secondary,
                  fontVariantNumeric: 'tabular-nums',
                  flexShrink: 0,
                }}>
                  {fmtBRL(it.total)}
                </span>
              </div>
            ))}
          </div>

          {/* Resumo financeiro */}
          <div style={{
            display: 'flex', flexDirection: 'column', gap: 3,
            paddingTop: 8,
            borderTop: `1px dashed ${colors.gray.border}`,
            fontSize: 11,
          }}>
            <SummaryLine label="Subtotal" value={fmtBRL(sale.subtotal)} />
            {sale.discount > 0 && (
              <SummaryLine label="Desconto" value={`− ${fmtBRL(sale.discount)}`} color={colors.red.DEFAULT} />
            )}
            <SummaryLine label="Total" value={fmtBRL(sale.total)} bold />
            {hasCredit && (
              <SummaryLine label="Nota de crédito" value={`− ${fmtBRL(sale.creditTotal)}`} color="#d97706" />
            )}
            {hasCredit && (
              <SummaryLine label="Líquido" value={fmtBRL(sale.netTotal)} bold color="#16a34a" />
            )}
          </div>

          {/* Métodos + status (mobile) */}
          {isMobile && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 6,
              marginTop: 8, flexWrap: 'wrap',
            }}>
              <span style={{
                padding: '2px 7px',
                borderRadius: radius.full,
                background: statusBg,
                color: statusColor,
                fontSize: 9,
                fontWeight: typography.weight.bold,
                textTransform: 'uppercase',
              }}>
                {statusLabel(sale.status)}
              </span>
              {sale.methods.map(m => (
                <span key={m} style={{
                  padding: '2px 7px',
                  borderRadius: radius.full,
                  background: colors.background.page,
                  color: typography.color.muted,
                  fontSize: 9,
                  fontWeight: typography.weight.semibold,
                }}>
                  {methodLabel(m)}
                </span>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function SummaryLine({ label, value, bold, color }: { label: string; value: string; bold?: boolean; color?: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
      <span style={{
        color: color ?? typography.color.muted,
        fontWeight: bold ? typography.weight.bold : typography.weight.normal,
      }}>{label}</span>
      <span style={{
        color: color ?? typography.color.primary,
        fontWeight: bold ? typography.weight.bold : typography.weight.normal,
        fontVariantNumeric: 'tabular-nums',
      }}>{value}</span>
    </div>
  )
}
