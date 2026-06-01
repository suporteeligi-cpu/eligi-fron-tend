'use client'
// src/app/dashboard/caixa/components/SalesSummaryCards.tsx
// Fechamento do dia: seletor de data + KPIs + por método + por profissional + serviços×produtos

import { useState } from 'react'
import { ShoppingBag, TrendingUp, Percent, Scissors, Package, Calendar, ChevronLeft, ChevronRight, User } from 'lucide-react'
import dayjs from 'dayjs'
import { colors, typography } from '@/shared/theme'
import { SalesSummary, SaleItemType } from '@/features/sales/types'
import { formatBRL, PAYMENT_METHOD_LABEL, PAYMENT_METHOD_ORDER } from '@/features/sales/utils/format'
import CalendarPicker from '@/shared/components/CalendarPicker'

interface Props {
  summary:           SalesSummary | null
  loading:           boolean
  isMobile:          boolean
  date:              string                    // YYYY-MM-DD
  onDateChange:      (date: string) => void
  category:          SaleItemType | null
  onCategoryChange:  (cat: SaleItemType | null) => void
}

// Formata YYYY-MM-DD → "Seg, 26 de mai" (sem libs externas)
function formatDateLabel(ymd: string): string {
  const [y, m, d] = ymd.split('-').map(Number)
  const dt = new Date(y, m - 1, d)
  const dias  = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
  const meses = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez']
  return `${dias[dt.getDay()]}, ${d} de ${meses[m - 1]}`
}

function shiftDate(ymd: string, days: number): string {
  const [y, m, d] = ymd.split('-').map(Number)
  const dt = new Date(y, m - 1, d + days)
  const off = dt.getTimezoneOffset() * 60000
  return new Date(dt.getTime() - off).toISOString().slice(0, 10)
}

export default function SalesSummaryCards({ summary, loading, isMobile, date, onDateChange, category, onCategoryChange }: Props) {
  const [showPicker, setShowPicker] = useState(false)
  const today = (() => {
    const d = new Date()
    const off = d.getTimezoneOffset() * 60000
    return new Date(d.getTime() - off).toISOString().slice(0, 10)
  })()
  const isToday  = date === today
  const isFuture = date >= today

  const cards = [
    {
      label: 'Vendas',
      value: summary ? String(summary.salesCount) : '—',
      sub:   isToday ? 'confirmadas hoje' : 'confirmadas no dia',
      icon:  ShoppingBag,
      color: '#1d4ed8',
      bg:    'rgba(59,130,246,0.10)',
    },
    {
      label: 'Bruto',
      value: summary ? formatBRL(summary.grossTotal) : '—',
      sub:   summary && summary.creditTotal > 0
        ? `- ${formatBRL(summary.creditTotal)} NC`
        : 'antes de notas',
      icon:  TrendingUp,
      color: '#15803d',
      bg:    'rgba(22,163,74,0.10)',
    },
    {
      label: 'Líquido',
      value: summary ? formatBRL(summary.netTotal) : '—',
      sub:   'bruto - notas crédito',
      icon:  TrendingUp,
      color: colors.red.DEFAULT,
      bg:    colors.red.subtle,
    },
    {
      label: 'Comissões',
      value: summary ? formatBRL(summary.commissionTotal) : '—',
      sub:   'a pagar aos profs',
      icon:  Percent,
      color: '#b45309',
      bg:    'rgba(245,158,11,0.12)',
    },
  ]

  const cardSurface = {
    background: 'rgba(255,255,255,0.85)',
    backdropFilter: 'blur(20px) saturate(160%)',
    WebkitBackdropFilter: 'blur(20px) saturate(160%)',
    border: '1px solid rgba(255,255,255,0.6)',
    borderRadius: 14,
  } as const

  const hasProfs = summary?.byProfessional && summary.byProfessional.length > 0
  const isEmpty  = summary && summary.salesCount === 0

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', gap: isMobile ? 10 : 14,
      fontFamily: typography.fontFamily,
    }}>
      {showPicker && (
        <CalendarPicker
          date={dayjs(date)}
          isMobile={isMobile}
          maxDate={dayjs(today)}
          showWeekJump={false}
          onSelect={d => onDateChange(d.format('YYYY-MM-DD'))}
          onClose={() => setShowPicker(false)}
        />
      )}

      {/* ── Seletor de data ── */}
      <div style={{
        ...cardSurface,
        padding: isMobile ? '10px 12px' : '12px 14px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10,
      }}>
        <button
          onClick={() => onDateChange(shiftDate(date, -1))}
          aria-label="Dia anterior"
          style={{
            width: 34, height: 34, borderRadius: 9,
            border: `1px solid ${colors.gray.borderMd}`,
            background: colors.background.page,
            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0, color: colors.gray[700],
          }}
        >
          <ChevronLeft size={16} strokeWidth={2.4} />
        </button>

        <button
          onClick={() => setShowPicker(true)}
          style={{
            flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            cursor: 'pointer', background: 'transparent', border: 'none',
            fontFamily: typography.fontFamily, padding: '6px 4px',
          }}
        >
          <Calendar size={15} color={colors.red.DEFAULT} strokeWidth={2} />
          <span style={{ fontSize: 14, fontWeight: 700, color: colors.gray[900] }}>
            {formatDateLabel(date)}{isToday ? ' · hoje' : ''}
          </span>
        </button>

        <button
          onClick={() => onDateChange(shiftDate(date, 1))}
          disabled={isFuture}
          aria-label="Próximo dia"
          style={{
            width: 34, height: 34, borderRadius: 9,
            border: `1px solid ${colors.gray.borderMd}`,
            background: colors.background.page,
            cursor: isFuture ? 'not-allowed' : 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0, color: colors.gray[700], opacity: isFuture ? 0.35 : 1,
          }}
        >
          <ChevronRight size={16} strokeWidth={2.4} />
        </button>
      </div>

      {/* ── Filtro por categoria ── */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {([
          { key: null,      label: 'Todos'    },
          { key: 'SERVICE', label: 'Serviços' },
          { key: 'PRODUCT', label: 'Produtos' },
          { key: 'PACKAGE', label: 'Pacotes'  },
        ] as Array<{ key: SaleItemType | null; label: string }>).map(cat => {
          const active = category === cat.key
          return (
            <button
              key={cat.label}
              onClick={() => onCategoryChange(cat.key)}
              style={{
                padding: '6px 14px', borderRadius: 18, cursor: 'pointer',
                fontSize: 12, fontWeight: 700, whiteSpace: 'nowrap',
                border: active ? '1px solid transparent' : `1px solid ${colors.gray.borderMd}`,
                background: active ? colors.red.gradient : 'rgba(255,255,255,0.85)',
                color: active ? '#fff' : colors.gray[700],
                boxShadow: active ? `0 3px 10px ${colors.red.glow}` : 'none',
                transition: 'all 0.15s ease',
                WebkitTapHighlightColor: 'transparent',
              }}
            >
              {cat.label}
            </button>
          )
        })}
      </div>

      {/* ── KPIs principais ── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)',
        gap: isMobile ? 8 : 12,
      }}>
        {cards.map((card, i) => {
          const Icon = card.icon
          return (
            <div key={i} style={{
              ...cardSurface,
              padding: isMobile ? '12px 14px' : '14px 16px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
              opacity: loading ? 0.5 : 1,
              transition: 'opacity 0.3s ease',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: isMobile ? 6 : 8 }}>
                <div style={{
                  width: isMobile ? 26 : 30, height: isMobile ? 26 : 30, borderRadius: 8,
                  background: card.bg, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: card.color, flexShrink: 0,
                }}>
                  <Icon size={isMobile ? 14 : 16} strokeWidth={2} />
                </div>
                <span style={{
                  fontSize: 10, fontWeight: 700, color: colors.gray.dimText,
                  textTransform: 'uppercase', letterSpacing: '.06em',
                  whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                }}>
                  {card.label}
                </span>
              </div>
              <div style={{
                fontSize: isMobile ? 17 : 22, fontWeight: 700, color: colors.gray[900],
                letterSpacing: '-0.02em', fontVariantNumeric: 'tabular-nums',
                lineHeight: 1, marginBottom: 2,
              }}>
                {card.value}
              </div>
              {card.sub && (
                <div style={{ fontSize: 10, color: colors.gray.dimText, fontWeight: 500 }}>
                  {card.sub}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* ── Estado vazio ── */}
      {isEmpty && !loading && (
        <div style={{
          ...cardSurface, padding: '32px 16px', textAlign: 'center',
        }}>
          <Calendar size={28} color={colors.gray.dimText} style={{ opacity: 0.3, marginBottom: 8 }} />
          <div style={{ fontSize: 14, fontWeight: 600, color: colors.gray[700] }}>
            Nenhuma venda confirmada neste dia
          </div>
        </div>
      )}

      {/* ── Por método de pagamento ── */}
      {summary && Object.keys(summary.byMethod).length > 0 && (
        <div style={{ ...cardSurface, padding: '14px 16px' }}>
          <div style={{
            fontSize: 10, fontWeight: 700, color: colors.gray.dimText,
            textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 10,
          }}>Por método de pagamento</div>
          <div style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(3, 1fr)',
            gap: 10,
          }}>
            {PAYMENT_METHOD_ORDER
              .filter(m => (summary.byMethod[m] ?? 0) > 0)
              .map(method => (
                <div key={method} style={{
                  padding: '8px 10px', background: colors.background.page,
                  borderRadius: 9, display: 'flex', flexDirection: 'column', gap: 2,
                }}>
                  <span style={{ fontSize: 10, color: colors.gray.dimText, fontWeight: 600 }}>
                    {PAYMENT_METHOD_LABEL[method]}
                  </span>
                  <span style={{
                    fontSize: 14, fontWeight: 700, color: colors.gray[900],
                    fontVariantNumeric: 'tabular-nums',
                  }}>
                    {formatBRL(summary.byMethod[method])}
                  </span>
                </div>
              ))}
          </div>

          {/* Serviços vs produtos */}
          {(summary.serviceTotal > 0 || summary.productTotal > 0) && (
            <div style={{
              marginTop: 12, paddingTop: 12,
              borderTop: `1px dashed ${colors.gray.border}`,
              display: 'flex', gap: 14, flexWrap: 'wrap',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Scissors size={12} color={colors.gray.dimText} />
                <span style={{ fontSize: 11, color: colors.gray.dimText }}>Serviços:</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: colors.gray[900], fontVariantNumeric: 'tabular-nums' }}>
                  {formatBRL(summary.serviceTotal)}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Package size={12} color={colors.gray.dimText} />
                <span style={{ fontSize: 11, color: colors.gray.dimText }}>Produtos:</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: colors.gray[900], fontVariantNumeric: 'tabular-nums' }}>
                  {formatBRL(summary.productTotal)}
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Por profissional ── */}
      {hasProfs && (
        <div style={{ ...cardSurface, padding: '14px 16px' }}>
          <div style={{
            fontSize: 10, fontWeight: 700, color: colors.gray.dimText,
            textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 10,
          }}>Por profissional</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {summary!.byProfessional!.map(prof => (
              <div key={prof.professionalId} style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '10px 12px', background: colors.background.page, borderRadius: 10,
              }}>
                <div style={{
                  width: 32, height: 32, borderRadius: '50%',
                  background: 'rgba(71,85,105,0.10)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0,
                }}>
                  <User size={15} color="#475569" strokeWidth={2} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontSize: 13, fontWeight: 700, color: colors.gray[900],
                    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                  }}>
                    {prof.name}
                  </div>
                  <div style={{ fontSize: 10, color: colors.gray.dimText }}>
                    Comissão: {formatBRL(prof.commission)}
                  </div>
                </div>
                <div style={{
                  fontSize: 14, fontWeight: 700, color: colors.gray[900],
                  fontVariantNumeric: 'tabular-nums', flexShrink: 0,
                }}>
                  {formatBRL(prof.total)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
