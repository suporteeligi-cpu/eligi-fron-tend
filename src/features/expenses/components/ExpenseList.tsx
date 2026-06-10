// src/features/expenses/components/ExpenseList.tsx
'use client'

import { TrendingDown } from 'lucide-react'
import { typography } from '@/shared/theme'
import ExpenseRow from './ExpenseRow'
import type { Expense, ExpenseCategory } from '../types'
import { CATEGORY_META } from '../types'

function fmtBRL(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

interface Props {
  expenses:         Expense[]
  loading:          boolean
  isMobile:         boolean
  selectedCategory: ExpenseCategory | ''
  onEdit:           (e: Expense) => void
  onDelete:         (e: Expense) => void
}

export default function ExpenseList({
  expenses, loading, isMobile, selectedCategory, onEdit, onDelete,
}: Props) {

  // ── Skeleton ─────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div style={{
        background: 'var(--card-bg, #fff)',
        border: '1px solid var(--border, #e5e7eb)',
        borderRadius: 14, overflow: 'hidden',
      }}>
        {[...Array(4)].map((_, i) => (
          <div key={i} style={{
            padding: '13px 16px', borderBottom: i < 3 ? '1px solid var(--border,#f1f5f9)' : 'none',
            display: 'flex', gap: 12, alignItems: 'center',
          }}>
            <div style={{ width: 3, height: 36, borderRadius: 2, background: 'var(--skeleton,#f1f5f9)' }} />
            <div style={{ width: 30, height: 36, borderRadius: 6, background: 'var(--skeleton,#f1f5f9)' }} />
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div style={{ height: 13, width: '55%', borderRadius: 5, background: 'var(--skeleton,#f1f5f9)' }} />
              <div style={{ height: 10, width: '30%', borderRadius: 5, background: 'var(--skeleton,#f1f5f9)' }} />
            </div>
            <div style={{ height: 14, width: 72, borderRadius: 5, background: 'var(--skeleton,#f1f5f9)' }} />
          </div>
        ))}
      </div>
    )
  }

  // ── Vazio ─────────────────────────────────────────────────────────────────
  if (expenses.length === 0) {
    return (
      <div style={{
        background: 'var(--card-bg, #fff)',
        border: '1px solid var(--border, #e5e7eb)',
        borderRadius: 14, padding: '48px 24px', textAlign: 'center',
      }}>
        <div style={{
          width: 52, height: 52, borderRadius: 14,
          background: 'rgba(220,38,38,0.08)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 14px',
        }}>
          <TrendingDown size={24} color="#dc2626" />
        </div>
        <div style={{
          fontSize: 15, fontWeight: typography.weight.bold,
          color: typography.color.primary, marginBottom: 4,
        }}>
          {selectedCategory
            ? `Nenhuma despesa em ${CATEGORY_META[selectedCategory]?.label}`
            : 'Nenhuma despesa neste período'}
        </div>
        <div style={{ fontSize: 13, color: typography.color.muted }}>
          Clique em &quot;+ Nova despesa&quot; para registrar
        </div>
      </div>
    )
  }

  // ── Header contextual (V3: mostra categoria selecionada + total filtrado) ──
  const filteredTotal = expenses.reduce((s, e) => s + e.amount, 0)
  const headerLabel   = selectedCategory
    ? `Lançamentos · ${CATEGORY_META[selectedCategory]?.label}`
    : 'Todos os lançamentos'
  const headerRight   = selectedCategory
    ? `${expenses.length} item${expenses.length > 1 ? 's' : ''} · ${fmtBRL(filteredTotal)}`
    : `${expenses.length} item${expenses.length > 1 ? 's' : ''}`

  return (
    <div style={{
      background:   'var(--card-bg, #fff)',
      border:       '1px solid var(--border, #e5e7eb)',
      borderRadius: 14,
      overflow:     'hidden',
    }}>
      {/* Header contextual */}
      <div style={{
        display:        'flex',
        alignItems:     'center',
        justifyContent: 'space-between',
        padding:        isMobile ? '8px 12px' : '9px 16px',
        background:     'var(--card-bg-secondary, #f8fafc)',
        borderBottom:   '1px solid var(--border, #e5e7eb)',
      }}>
        <span style={{
          fontSize:      11,
          fontWeight:    600,
          color:         selectedCategory
            ? CATEGORY_META[selectedCategory]?.textColor
            : typography.color.muted,
          textTransform: 'uppercase',
          letterSpacing: '0.06em',
        }}>
          {headerLabel}
        </span>
        <span style={{
          fontSize: 11,
          color:    typography.color.muted,
        }}>
          {headerRight}
        </span>
      </div>

      {/* Linhas */}
      {expenses.map(expense => (
        <ExpenseRow
          key={expense.id}
          expense={expense}
          isMobile={isMobile}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </div>
  )
}
