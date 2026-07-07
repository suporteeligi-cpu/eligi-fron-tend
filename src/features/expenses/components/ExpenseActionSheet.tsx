// src/features/expenses/components/ExpenseActionSheet.tsx
'use client'

import { CalendarOff, Ban, X } from 'lucide-react'
import { typography } from '@/shared/theme'
import type { Expense } from '../types'

function fmtBRL(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

interface Props {
  expense:   Expense
  onSkip:    (e: Expense) => void   // pular este mês  (DELETE /:id → RECURRING_SKIPPED)
  onStop:    (e: Expense) => void   // parar recorrência (PATCH /recurrences/:id/stop)
  onClose:   () => void
}

// Bottom-sheet de ações da ocorrência recorrente (Direção B).
// "Pular" neutro; "Parar" em vermelho (destrutivo, separado por divisor).
// position: fixed no wrapper; a animação de entrada mora no elemento interno
// (relative) — evita o deslocamento de `fixed + transform` no Android Chrome.
export default function ExpenseActionSheet({ expense, onSkip, onStop, onClose }: Props) {
  return (
    <>
      <style>{`
        @keyframes sheetFadeIn { from { opacity: 0 } to { opacity: 1 } }
        @keyframes sheetSlideUp { from { transform: translateY(100%) } to { transform: translateY(0) } }
      `}</style>

      {/* Overlay */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0,
          background: 'rgba(0,0,0,0.4)',
          zIndex: 9998,
          animation: 'sheetFadeIn 0.18s ease',
        }}
      />

      {/* Wrapper fixo no rodapé (sem transform aqui — Android Chrome) */}
      <div style={{
        position: 'fixed',
        left: 0, right: 0, bottom: 0,
        zIndex: 9999,
        display: 'flex',
        justifyContent: 'center',
      }}>
        {/* Animação de entrada no elemento interno relative */}
        <div style={{
          position: 'relative',
          width: '100%',
          maxWidth: 460,
          background: 'var(--card-bg, #fff)',
          borderTopLeftRadius: 18,
          borderTopRightRadius: 18,
          paddingBottom: 'calc(12px + env(safe-area-inset-bottom))',
          boxShadow: '0 -8px 40px rgba(0,0,0,0.16)',
          animation: 'sheetSlideUp 0.24s cubic-bezier(0.34,1.2,0.64,1)',
        }}>
          {/* Grab handle */}
          <div style={{
            width: 34, height: 4, borderRadius: 2,
            background: 'var(--border, #cbd5e1)',
            margin: '8px auto 4px',
          }} />

          {/* Header */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '6px 18px 12px',
            borderBottom: '1px solid var(--border, #f1f5f9)',
          }}>
            <div style={{ minWidth: 0 }}>
              <div style={{
                fontSize: 11, fontWeight: 600, color: typography.color.muted,
                textTransform: 'uppercase', letterSpacing: '0.05em',
              }}>
                Despesa fixa
              </div>
              <div style={{
                fontSize: 14, fontWeight: typography.weight.bold,
                color: typography.color.primary,
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                marginTop: 1,
              }}>
                {expense.description} · {fmtBRL(expense.amount)}
              </div>
            </div>
            <button
              onClick={onClose}
              aria-label="Fechar"
              style={{
                background: 'transparent', border: 'none', cursor: 'pointer',
                padding: 6, borderRadius: 8, color: typography.color.muted, lineHeight: 0,
                flexShrink: 0,
              }}
            >
              <X size={20} />
            </button>
          </div>

          {/* Ação 1: Pular este mês (neutro) */}
          <button
            onClick={() => onSkip(expense)}
            style={{
              width: '100%', display: 'flex', alignItems: 'center', gap: 12,
              padding: '14px 18px', background: 'transparent', border: 'none',
              cursor: 'pointer', textAlign: 'left',
            }}
          >
            <CalendarOff size={20} color={typography.color.muted} style={{ flexShrink: 0 }} />
            <span style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: 14, color: typography.color.primary }}>Pular este mês</span>
              <span style={{ fontSize: 11, color: typography.color.muted, marginTop: 1 }}>
                Remove só este mês. Volta no próximo.
              </span>
            </span>
          </button>

          {/* Divisor */}
          <div style={{ height: 1, background: 'var(--border, #f1f5f9)', margin: '2px 18px' }} />

          {/* Ação 2: Parar recorrência (destrutivo, vermelho) */}
          <button
            onClick={() => onStop(expense)}
            style={{
              width: '100%', display: 'flex', alignItems: 'center', gap: 12,
              padding: '14px 18px', background: 'transparent', border: 'none',
              cursor: 'pointer', textAlign: 'left',
            }}
          >
            <Ban size={20} color="#dc2626" style={{ flexShrink: 0 }} />
            <span style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: 14, color: '#dc2626' }}>Parar recorrência</span>
              <span style={{ fontSize: 11, color: '#dc2626', opacity: 0.75, marginTop: 1 }}>
                Não lança mais a partir do próximo mês.
              </span>
            </span>
          </button>
        </div>
      </div>
    </>
  )
}
