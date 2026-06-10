'use client'
// src/app/dashboard/financeiro/despesas/page.tsx

import { useState, useCallback } from 'react'
import { Plus, ChevronLeft, ChevronRight } from 'lucide-react'
import dayjs from 'dayjs'
import 'dayjs/locale/pt-br'
import { typography } from '@/shared/theme'
import { useDeviceMode } from '@/features/agenda/hooks/useDeviceMode'
import { useExpenses }   from '@/features/expenses/hooks/useExpenses'
import ExpenseKPIs       from '@/features/expenses/components/ExpenseKPIs'
import ExpenseList       from '@/features/expenses/components/ExpenseList'
import ExpenseModal      from '@/features/expenses/components/ExpenseModal'
import type {
  Expense,
  ExpenseCategory,
  CreateExpensePayload,
} from '@/features/expenses/types'

dayjs.locale('pt-br')

export default function DespesasPage() {
  const mode     = useDeviceMode()
  const isMobile = mode === 'mobile'

  // ── Navegação de mês ─────────────────────────────────────────────────────
  const [currentMonth, setCurrentMonth] = useState(() => dayjs().format('YYYY-MM'))
  const goPrev = useCallback(() =>
    setCurrentMonth(m => dayjs(m + '-01').subtract(1, 'month').format('YYYY-MM')), [])
  const goNext = useCallback(() =>
    setCurrentMonth(m => dayjs(m + '-01').add(1, 'month').format('YYYY-MM')), [])

  // ── Filtro por categoria (controlado pelos mini-cards da V3) ─────────────
  const [selectedCategory, setSelectedCategory] = useState<ExpenseCategory | ''>('')

  // ── Modal criar/editar ───────────────────────────────────────────────────
  const [modalOpen,    setModalOpen]    = useState(false)
  const [editTarget,   setEditTarget]   = useState<Expense | null>(null)

  // ── Confirmação de exclusão ──────────────────────────────────────────────
  const [deleteTarget, setDeleteTarget] = useState<Expense | null>(null)
  const [deleting,     setDeleting]     = useState(false)

  // ── Toast ────────────────────────────────────────────────────────────────
  const [toastMsg, setToastMsg] = useState<string | null>(null)
  function showToast(msg: string) {
    setToastMsg(msg)
    setTimeout(() => setToastMsg(null), 3000)
  }

  // ── Dados ────────────────────────────────────────────────────────────────
  const { expenses, kpis, loading, create, update, remove } = useExpenses({
    month:    currentMonth,
    category: selectedCategory || undefined,
  })

  // ── Handlers ─────────────────────────────────────────────────────────────
  function handleNew() { setEditTarget(null); setModalOpen(true) }
  function handleEdit(e: Expense) { setEditTarget(e); setModalOpen(true) }

  async function handleSave(payload: CreateExpensePayload) {
    try {
      if (editTarget) {
        await update(editTarget.id, payload)
        showToast('Despesa atualizada')
      } else {
        await create(payload)
        showToast('Despesa adicionada')
      }
    } catch {
      showToast('Erro ao salvar despesa')
      throw new Error('save failed')
    }
  }

  async function handleConfirmDelete() {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await remove(deleteTarget.id)
      setDeleteTarget(null)
      showToast('Despesa removida')
    } catch {
      showToast('Erro ao remover despesa')
    } finally {
      setDeleting(false)
    }
  }

  const monthLabel     = dayjs(currentMonth + '-01').format('MMMM [de] YYYY')
  const isCurrentMonth = currentMonth === dayjs().format('YYYY-MM')

  return (
    <>
      <style>{`
        @keyframes fadeUp  { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
        @keyframes toastIn { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
      `}</style>

      <div style={{
        maxWidth:   900,
        padding:    isMobile ? '0 12px' : 0,
        animation:  'fadeUp 0.3s ease',
        fontFamily: typography.fontFamily,
      }}>

        {/* ── Header ────────────────────────────────────────────────────── */}
        <div style={{
          display:        'flex',
          alignItems:     isMobile ? 'flex-start' : 'center',
          justifyContent: 'space-between',
          flexDirection:  isMobile ? 'column' : 'row',
          gap:            10,
          marginBottom:   20,
        }}>
          <div>
            <h1 style={{
              fontSize:      isMobile ? 22 : 26,
              fontWeight:    typography.weight.bold,
              color:         typography.color.primary,
              margin:        0,
              letterSpacing: '-0.02em',
            }}>
              Despesas
            </h1>
            <p style={{
              fontSize:  typography.scale.base,
              color:     typography.color.muted,
              margin:    '3px 0 0',
            }}>
              Custos operacionais e saídas do negócio
            </p>
          </div>

          <button
            onClick={handleNew}
            style={{
              display:      'flex',
              alignItems:   'center',
              gap:          7,
              padding:      isMobile ? '10px 18px' : '10px 20px',
              borderRadius: 10,
              border:       'none',
              background:   'linear-gradient(135deg,#dc2626,#b91c1c)',
              color:        '#fff',
              fontSize:     14,
              fontWeight:   700,
              cursor:       'pointer',
              whiteSpace:   'nowrap',
              boxShadow:    '0 2px 8px rgba(220,38,38,0.25)',
            }}
          >
            <Plus size={16} />
            Nova despesa
          </button>
        </div>

        {/* ── Seletor de mês ────────────────────────────────────────────── */}
        <div style={{
          display:     'flex',
          alignItems:  'center',
          gap:         6,
          marginBottom: 14,
          width:       'fit-content',
        }}>
          <div style={{
            display:      'flex',
            alignItems:   'center',
            gap:          2,
            background:   'var(--card-bg,#fff)',
            border:       '1px solid var(--border,#e5e7eb)',
            borderRadius: 10,
            padding:      '4px 6px',
          }}>
            <button
              onClick={goPrev}
              style={{
                background: 'transparent', border: 'none',
                cursor: 'pointer', padding: 5, borderRadius: 7,
                color: typography.color.muted, lineHeight: 0,
              }}
            >
              <ChevronLeft size={15} />
            </button>

            <span style={{
              fontSize:      13,
              fontWeight:    600,
              color:         typography.color.primary,
              padding:       '0 8px',
              minWidth:      isMobile ? 118 : 148,
              textAlign:     'center',
              textTransform: 'capitalize',
            }}>
              {monthLabel}
              {isCurrentMonth && (
                <span style={{
                  fontSize:     10,
                  fontWeight:   600,
                  color:        '#dc2626',
                  marginLeft:   6,
                  background:   'rgba(220,38,38,0.1)',
                  padding:      '1px 6px',
                  borderRadius: 10,
                }}>
                  atual
                </span>
              )}
            </span>

            <button
              onClick={goNext}
              style={{
                background: 'transparent', border: 'none',
                cursor: 'pointer', padding: 5, borderRadius: 7,
                color: typography.color.muted, lineHeight: 0,
              }}
            >
              <ChevronRight size={15} />
            </button>
          </div>
        </div>

        {/* ── KPIs (total + barra + mini-cards clicáveis) ───────────────── */}
        <ExpenseKPIs
          kpis={kpis}
          loading={loading}
          isMobile={isMobile}
          selectedCategory={selectedCategory}
          onSelectCategory={setSelectedCategory}
        />

        {/* ── Lista ─────────────────────────────────────────────────────── */}
        <ExpenseList
          expenses={expenses}
          loading={loading}
          isMobile={isMobile}
          selectedCategory={selectedCategory}
          onEdit={handleEdit}
          onDelete={e => setDeleteTarget(e)}
        />
      </div>

      {/* ── Modal criar/editar ─────────────────────────────────────────── */}
      <ExpenseModal
        open={modalOpen}
        expense={editTarget}
        onClose={() => setModalOpen(false)}
        onSave={handleSave}
      />

      {/* ── Modal confirmação exclusão ─────────────────────────────────── */}
      {deleteTarget && (
        <>
          <div
            onClick={() => !deleting && setDeleteTarget(null)}
            style={{
              position: 'fixed', inset: 0,
              background: 'rgba(0,0,0,0.4)', zIndex: 9997,
            }}
          />
          <div style={{
            position:   'fixed',
            top:        '50%', left: '50%',
            transform:  'translate(-50%,-50%)',
            zIndex:     9998,
            background: 'var(--card-bg,#fff)',
            borderRadius: 16,
            padding:    '24px 28px',
            width:      'min(380px, 90vw)',
            boxShadow:  '0 20px 60px rgba(0,0,0,0.2)',
            animation:  'fadeUp 0.2s cubic-bezier(0.34,1.56,0.64,1)',
          }}>
            <div style={{
              width: 40, height: 40, borderRadius: 12,
              background: 'linear-gradient(135deg,#dc2626,#b91c1c)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              marginBottom: 14, fontSize: 22, fontWeight: 900,
              color: '#fff', fontFamily: 'serif',
            }}>
              e
            </div>
            <div style={{
              fontSize: 16, fontWeight: typography.weight.bold,
              color: typography.color.primary, marginBottom: 6,
            }}>
              Remover despesa?
            </div>
            <div style={{
              fontSize: 13, color: typography.color.muted, marginBottom: 20,
            }}>
              &quot;<strong>{deleteTarget.description}</strong>&quot; será removida permanentemente.
              Essa ação não pode ser desfeita.
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={() => setDeleteTarget(null)}
                disabled={deleting}
                style={{
                  flex: 1, padding: '10px 0', borderRadius: 10,
                  border: '1.5px solid var(--border,#e5e7eb)',
                  background: 'transparent', cursor: 'pointer',
                  fontSize: 14, fontWeight: 600, color: typography.color.muted,
                }}
              >
                Voltar
              </button>
              <button
                onClick={handleConfirmDelete}
                disabled={deleting}
                style={{
                  flex: 2, padding: '10px 0', borderRadius: 10,
                  border: 'none',
                  background: deleting ? '#94a3b8' : 'linear-gradient(135deg,#dc2626,#b91c1c)',
                  cursor: deleting ? 'not-allowed' : 'pointer',
                  fontSize: 14, fontWeight: 700, color: '#fff',
                  letterSpacing: '0.04em',
                }}
              >
                {deleting ? 'REMOVENDO…' : 'REMOVER'}
              </button>
            </div>
          </div>
        </>
      )}

      {/* ── Toast ─────────────────────────────────────────────────────── */}
      {toastMsg && (
        <div style={{
          position:     'fixed',
          bottom:       isMobile ? 80 : 24,
          left:         '50%',
          transform:    'translateX(-50%)',
          zIndex:       10000,
          background:   '#1e293b',
          color:        '#fff',
          padding:      '10px 20px',
          borderRadius: 10,
          fontSize:     13,
          fontWeight:   600,
          animation:    'toastIn 0.2s ease',
          boxShadow:    '0 4px 20px rgba(0,0,0,0.2)',
          whiteSpace:   'nowrap',
        }}>
          {toastMsg}
        </div>
      )}
    </>
  )
}
