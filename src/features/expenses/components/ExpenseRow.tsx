// src/features/expenses/components/ExpenseRow.tsx
'use client'

import { Pencil, Trash2, RefreshCw, Zap, MoreHorizontal } from 'lucide-react'
import dayjs from 'dayjs'
import 'dayjs/locale/pt-br'
import { typography } from '@/shared/theme'
import type { Expense } from '../types'
import { CATEGORY_META } from '../types'

dayjs.locale('pt-br')

function fmtBRL(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

interface Props {
  expense:   Expense
  isMobile:  boolean
  onEdit:    (e: Expense) => void
  onDelete:  (e: Expense) => void
  onMenu:    (e: Expense) => void
}

export default function ExpenseRow({ expense, isMobile, onEdit, onDelete, onMenu }: Props) {
  const isAuto = expense.origin !== 'MANUAL'
  const meta   = CATEGORY_META[expense.category]

  // 3 estados de ação:
  //  MANUAL     -> editar + excluir (lixeira direta)
  //  RECURRING  -> menu (pular este mês / parar recorrência)
  //  AUTO_*     -> read-only (sem ação)
  const actionKind: 'edit' | 'menu' | 'none' =
    expense.origin === 'MANUAL' ? 'edit'
    : expense.origin === 'RECURRING' ? 'menu'
    : 'none'

  return (
    <div
      style={{
        display:      'flex',
        alignItems:   'center',
        gap:          isMobile ? 10 : 12,
        padding:      isMobile ? '11px 12px' : '12px 16px',
        borderBottom: '1px solid var(--border, #f1f5f9)',
        background:   'transparent',
        transition:   'background 0.15s',
      }}
      onMouseEnter={e => (e.currentTarget.style.background = 'var(--row-hover,#f8fafc)')}
      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
    >
      {/* Borda lateral colorida da categoria (V3) */}
      <div style={{
        width:        3,
        height:       isMobile ? 30 : 36,
        borderRadius: 2,
        background:   meta.textColor,
        flexShrink:   0,
      }} />

      {/* Data */}
      <div style={{
        width:      isMobile ? 26 : 30,
        flexShrink: 0,
        textAlign:  'center',
      }}>
        <div style={{
          fontSize:   isMobile ? 13 : 14,
          fontWeight: typography.weight.bold,
          color:      typography.color.primary,
          lineHeight: 1,
        }}>
          {dayjs(expense.date).format('DD')}
        </div>
        <div style={{
          fontSize:      9,
          fontWeight:    500,
          color:         typography.color.muted,
          textTransform: 'uppercase',
          letterSpacing: '0.04em',
        }}>
          {dayjs(expense.date).format('MMM')}
        </div>
      </div>

      {/* Separador */}
      <div style={{
        width:      1,
        height:     28,
        background: 'var(--border, #e5e7eb)',
        flexShrink: 0,
      }} />

      {/* Descrição + meta */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          display:    'flex',
          alignItems: 'center',
          gap:        5,
          marginBottom: 3,
        }}>
          <span style={{
            fontSize:     isMobile ? 12 : 13,
            fontWeight:   typography.weight.medium,
            color:        typography.color.primary,
            overflow:     'hidden',
            textOverflow: 'ellipsis',
            whiteSpace:   'nowrap',
            maxWidth:     isMobile ? 130 : 280,
          }}>
            {expense.description}
          </span>
          {isAuto && (
            <span title="Gerado automaticamente" style={{ lineHeight: 0 }}>
              <Zap size={11} color="#d97706" />
            </span>
          )}
        </div>

        {/* Meta linha: categoria · recorrência */}
        <div style={{
          display:    'flex',
          alignItems: 'center',
          gap:        5,
          fontSize:   isMobile ? 9 : 10,
          color:      typography.color.muted,
        }}>
          <span style={{ color: meta.textColor, fontWeight: 500 }}>{meta.label}</span>
          {expense.isRecurring && (
            <>
              <span>·</span>
              <RefreshCw size={9} color="#0891b2" />
              <span style={{ color: '#0891b2' }}>
                fixa{expense.recurringDay ? ` dia ${expense.recurringDay}` : ''}
              </span>
            </>
          )}
          {!expense.isRecurring && (
            <>
              <span>·</span>
              <span>variável</span>
            </>
          )}
        </div>
      </div>

      {/* Valor */}
      <div style={{
        fontSize:   isMobile ? 13 : 14,
        fontWeight: typography.weight.bold,
        color:      '#dc2626',
        flexShrink: 0,
        letterSpacing: '-0.01em',
      }}>
        {fmtBRL(expense.amount)}
      </div>

      {/* Ações — 3 estados (edit / menu / none) */}
      {actionKind === 'menu' && (
        <button
          onClick={() => onMenu(expense)}
          aria-label="Ações da recorrência"
          style={{
            background: 'transparent', border: 'none', cursor: 'pointer',
            padding: 6, borderRadius: 7, flexShrink: 0,
            color: typography.color.muted, lineHeight: 0, transition: 'background 0.15s',
          }}
          onMouseEnter={e => (e.currentTarget.style.background = 'rgba(0,0,0,0.06)')}
          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
        >
          <MoreHorizontal size={16} />
        </button>
      )}

      {actionKind === 'edit' ? (
        <div style={{ display: 'flex', gap: 2, flexShrink: 0 }}>
          <button
            onClick={() => onEdit(expense)}
            style={{
              background: 'transparent', border: 'none', cursor: 'pointer',
              padding: 5, borderRadius: 7,
              color: typography.color.muted, lineHeight: 0, transition: 'background 0.15s',
            }}
            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(0,0,0,0.06)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
          >
            <Pencil size={13} />
          </button>
          <button
            onClick={() => onDelete(expense)}
            style={{
              background: 'transparent', border: 'none', cursor: 'pointer',
              padding: 5, borderRadius: 7,
              color: typography.color.muted, lineHeight: 0, transition: 'background 0.15s',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = 'rgba(220,38,38,0.08)'
              e.currentTarget.style.color = '#dc2626'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'transparent'
              e.currentTarget.style.color = typography.color.muted
            }}
          >
            <Trash2 size={13} />
          </button>
        </div>
      ) : actionKind === 'none' ? (
        <div style={{ width: 52 }} />
      ) : null}
    </div>
  )
}
