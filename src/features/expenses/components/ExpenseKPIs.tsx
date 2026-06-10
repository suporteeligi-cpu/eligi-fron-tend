// src/features/expenses/components/ExpenseKPIs.tsx
'use client'

import { typography } from '@/shared/theme'
import type { ExpenseKPIs, ExpenseCategory } from '../types'
import { CATEGORY_META } from '../types'

function fmtBRL(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

interface Props {
  kpis:            ExpenseKPIs
  loading:         boolean
  isMobile:        boolean
  selectedCategory: ExpenseCategory | ''
  onSelectCategory: (cat: ExpenseCategory | '') => void
}

// Ordem fixa para a barra de progresso e os cards
const CAT_ORDER: ExpenseCategory[] = ['OPERACIONAL', 'MARKETING', 'COMISSAO', 'ESTOQUE', 'OUTROS']

export default function ExpenseKPIs({
  kpis, loading, isMobile, selectedCategory, onSelectCategory,
}: Props) {

  const activeCats = CAT_ORDER.filter(c => (kpis.byCategory[c] ?? 0) > 0)
  const total = kpis.total || 1 // evita divisão por zero

  return (
    <div style={{ marginBottom: 16 }}>

      {/* ── Bloco total + fixas/variáveis ──────────────────────────────── */}
      <div style={{
        background:     'var(--card-bg, #fff)',
        border:         '1px solid var(--border, #e5e7eb)',
        borderRadius:   14,
        padding:        isMobile ? '14px 14px 10px' : '16px 18px 12px',
        marginBottom:   10,
      }}>
        {loading ? (
          <div style={{ height: 38, width: 160, borderRadius: 8, background: 'var(--skeleton,#f1f5f9)' }} />
        ) : (
          <>
            <div style={{
              fontSize:   10,
              fontWeight: 600,
              color:      typography.color.muted,
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              marginBottom: 4,
            }}>
              Total do mês
            </div>
            <div style={{
              fontSize:      isMobile ? 26 : 30,
              fontWeight:    typography.weight.bold,
              color:         '#dc2626',
              letterSpacing: '-0.02em',
              lineHeight:    1,
              marginBottom:  10,
            }}>
              {fmtBRL(kpis.total)}
            </div>

            {/* Fixas / Variáveis / Lançamentos */}
            <div style={{ display: 'flex', gap: isMobile ? 16 : 24 }}>
              {[
                { label: 'Fixas',        val: fmtBRL(kpis.fixed)    },
                { label: 'Variáveis',    val: fmtBRL(kpis.variable) },
                { label: 'Lançamentos', val: String(kpis.total > 0 ? '—' : '0') },
              ].map(item => (
                <div key={item.label}>
                  <div style={{
                    fontSize:   9,
                    fontWeight: 600,
                    color:      typography.color.muted,
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                  }}>
                    {item.label}
                  </div>
                  <div style={{
                    fontSize:   isMobile ? 12 : 13,
                    fontWeight: typography.weight.bold,
                    color:      typography.color.primary,
                    marginTop:  2,
                  }}>
                    {item.label === 'Lançamentos'
                      ? String(Object.values(kpis.byCategory).filter(v => v > 0).length)
                      : item.val}
                  </div>
                </div>
              ))}
            </div>

            {/* Barra de progresso colorida por categoria */}
            {activeCats.length > 0 && (
              <div style={{
                display:      'flex',
                gap:          2,
                height:       4,
                borderRadius: 2,
                overflow:     'hidden',
                marginTop:    12,
              }}>
                {activeCats.map(cat => {
                  const pct = ((kpis.byCategory[cat] ?? 0) / total) * 100
                  return (
                    <div
                      key={cat}
                      title={`${CATEGORY_META[cat].label}: ${pct.toFixed(0)}%`}
                      style={{
                        width:        `${pct}%`,
                        background:   CATEGORY_META[cat].textColor,
                        borderRadius: 2,
                        opacity:      selectedCategory === cat ? 1 : selectedCategory ? 0.4 : 1,
                        transition:   'opacity 0.2s',
                        cursor:       'pointer',
                      }}
                      onClick={() => onSelectCategory(selectedCategory === cat ? '' : cat)}
                    />
                  )
                })}
              </div>
            )}
          </>
        )}
      </div>

      {/* ── Mini-cards por categoria ───────────────────────────────────── */}
      {!loading && activeCats.length > 0 && (
        <div style={{
          display:        isMobile ? 'flex' : 'grid',
          gridTemplateColumns: isMobile ? undefined : `repeat(${Math.min(activeCats.length, 4)}, 1fr)`,
          flexDirection:  isMobile ? 'row' : undefined,
          overflowX:      isMobile ? 'auto' : undefined,
          gap:            8,
          paddingBottom:  isMobile ? 4 : 0,
        }}>
          {activeCats.map(cat => {
            const meta    = CATEGORY_META[cat]
            const val     = kpis.byCategory[cat] ?? 0
            const pct     = Math.round((val / total) * 100)
            const active  = selectedCategory === cat

            return (
              <div
                key={cat}
                onClick={() => onSelectCategory(active ? '' : cat)}
                style={{
                  flexShrink:   isMobile ? 0 : undefined,
                  minWidth:     isMobile ? 110 : undefined,
                  background:   'var(--card-bg, #fff)',
                  border:       active
                    ? `1.5px solid ${meta.textColor}`
                    : '1px solid var(--border, #e5e7eb)',
                  borderRadius: 12,
                  padding:      '10px 12px',
                  cursor:       'pointer',
                  transition:   'border-color 0.15s, background 0.15s',
                }}
              >
                {/* Dot + nome */}
                <div style={{
                  display:      'flex',
                  alignItems:   'center',
                  gap:          6,
                  marginBottom: 5,
                }}>
                  <div style={{
                    width:        7,
                    height:       7,
                    borderRadius: '50%',
                    background:   meta.textColor,
                    flexShrink:   0,
                  }} />
                  <span style={{
                    fontSize:   10,
                    color:      active ? meta.textColor : typography.color.muted,
                    fontWeight: active ? 600 : 400,
                  }}>
                    {meta.label}
                  </span>
                </div>

                {/* Valor */}
                <div style={{
                  fontSize:   isMobile ? 12 : 13,
                  fontWeight: typography.weight.bold,
                  color:      typography.color.primary,
                  marginBottom: 2,
                }}>
                  {fmtBRL(val)}
                </div>

                {/* Percentual */}
                <div style={{
                  fontSize: 9,
                  color:    typography.color.muted,
                  marginBottom: 6,
                }}>
                  {pct}% do total
                </div>

                {/* Mini barra de progresso */}
                <div style={{
                  height:       2,
                  background:   'var(--border, #e5e7eb)',
                  borderRadius: 1,
                  overflow:     'hidden',
                }}>
                  <div style={{
                    width:        `${pct}%`,
                    height:       2,
                    background:   meta.textColor,
                    borderRadius: 1,
                    transition:   'width 0.4s ease',
                  }} />
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
