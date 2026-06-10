// src/features/expenses/components/ExpenseModal.tsx
'use client'

import { useState, useEffect } from 'react'
import { X, RefreshCw } from 'lucide-react'
import dayjs from 'dayjs'
import { typography } from '@/shared/theme'
import { CATEGORY_OPTIONS, CATEGORY_META } from '../types'
import type { Expense, CreateExpensePayload, ExpenseCategory } from '../types'

interface Props {
  open:      boolean
  expense:   Expense | null    // null = criar
  onClose:   () => void
  onSave:    (payload: CreateExpensePayload) => Promise<void>
}

const INITIAL: CreateExpensePayload = {
  date:         dayjs().format('YYYY-MM-DD'),
  amount:       0,
  description:  '',
  category:     'OPERACIONAL',
  isRecurring:  false,
  recurringDay: null,
}

export default function ExpenseModal({ open, expense, onClose, onSave }: Props) {
  const [form,    setForm]    = useState<CreateExpensePayload>(INITIAL)
  const [saving,  setSaving]  = useState(false)
  const [errors,  setErrors]  = useState<Partial<Record<keyof CreateExpensePayload, string>>>({})

  // Populate quando edita
  useEffect(() => {
    if (expense) {
      setForm({
        date:         dayjs(expense.date).format('YYYY-MM-DD'),
        amount:       expense.amount,
        description:  expense.description,
        category:     expense.category,
        isRecurring:  expense.isRecurring,
        recurringDay: expense.recurringDay,
      })
    } else {
      setForm({ ...INITIAL, date: dayjs().format('YYYY-MM-DD') })
    }
    setErrors({})
  }, [expense, open])

  if (!open) return null

  function validate(): boolean {
    const e: typeof errors = {}
    if (!form.description.trim() || form.description.trim().length < 2)
      e.description = 'Descrição muito curta'
    if (!form.amount || form.amount <= 0)
      e.amount = 'Valor deve ser maior que zero'
    if (!form.date)
      e.date = 'Data obrigatória'
    if (form.isRecurring && form.recurringDay) {
      if (form.recurringDay < 1 || form.recurringDay > 28)
        e.recurringDay = 'Dia deve ser entre 1 e 28'
    }
    setErrors(e)
    return Object.keys(e).length === 0
  }

  async function handleSave() {
    if (!validate()) return
    setSaving(true)
    try {
      await onSave({
        ...form,
        date: dayjs(form.date).toISOString(),
        recurringDay: form.isRecurring ? (form.recurringDay ?? null) : null,
      })
      onClose()
    } catch {
      // erro tratado pelo pai
    } finally {
      setSaving(false)
    }
  }

  const set = <K extends keyof CreateExpensePayload>(
    key: K, val: CreateExpensePayload[K]
  ) => setForm(p => ({ ...p, [key]: val }))

  const inputStyle: React.CSSProperties = {
    width:        '100%',
    padding:      '9px 12px',
    borderRadius: 10,
    border:       '1.5px solid var(--border, #e5e7eb)',
    fontSize:     14,
    color:        typography.color.primary,
    background:   'var(--input-bg, #f8fafc)',
    outline:      'none',
    boxSizing:    'border-box',
    fontFamily:   typography.fontFamily,
  }

  const labelStyle: React.CSSProperties = {
    fontSize:     12,
    fontWeight:   600,
    color:        typography.color.muted,
    marginBottom: 5,
    display:      'block',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  }

  return (
    <>
      {/* Overlay */}
      <div
        onClick={onClose}
        style={{
          position:   'fixed', inset: 0,
          background: 'rgba(0,0,0,0.35)',
          zIndex:     9997,
          animation:  'fadeIn 0.18s ease',
        }}
      />

      {/* Sheet */}
      <div style={{
        position:    'fixed',
        top:         0,
        right:       0,
        bottom:      0,
        width:       'min(420px, 100vw)',
        background:  'var(--card-bg, #fff)',
        zIndex:      9998,
        display:     'flex',
        flexDirection: 'column',
        animation:   'slideInRight 0.22s cubic-bezier(0.34,1.56,0.64,1)',
        boxShadow:   '-8px 0 40px rgba(0,0,0,0.12)',
      }}>
        <style>{`
          @keyframes fadeIn      { from{opacity:0} to{opacity:1} }
          @keyframes slideInRight{ from{transform:translateX(100%)} to{transform:translateX(0)} }
        `}</style>

        {/* Header */}
        <div style={{
          display:      'flex',
          alignItems:   'center',
          justifyContent: 'space-between',
          padding:      '20px 22px 16px',
          borderBottom: '1px solid var(--border, #e5e7eb)',
        }}>
          <div>
            <div style={{
              fontSize:   18,
              fontWeight: typography.weight.bold,
              color:      typography.color.primary,
            }}>
              {expense ? 'Editar despesa' : 'Nova despesa'}
            </div>
            <div style={{
              fontSize: 12,
              color:    typography.color.muted,
              marginTop: 2,
            }}>
              {expense ? 'Altere os dados abaixo' : 'Preencha os dados da despesa'}
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'transparent', border: 'none',
              cursor: 'pointer', padding: 8, borderRadius: 8,
              color: typography.color.muted, lineHeight: 0,
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div style={{
          flex:       1,
          overflowY:  'auto',
          padding:    '20px 22px',
          display:    'flex',
          flexDirection: 'column',
          gap:        16,
        }}>
          {/* Descrição */}
          <div>
            <label style={labelStyle}>Descrição</label>
            <input
              style={{
                ...inputStyle,
                borderColor: errors.description ? '#dc2626' : 'var(--border, #e5e7eb)',
              }}
              placeholder="Ex: Aluguel do espaço, material de limpeza…"
              value={form.description}
              onChange={e => set('description', e.target.value)}
              maxLength={200}
            />
            {errors.description && (
              <span style={{ fontSize: 11, color: '#dc2626', marginTop: 3, display: 'block' }}>
                {errors.description}
              </span>
            )}
          </div>

          {/* Valor + Data — linha */}
          <div style={{ display: 'flex', gap: 12 }}>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>Valor (R$)</label>
              <input
                style={{
                  ...inputStyle,
                  borderColor: errors.amount ? '#dc2626' : 'var(--border, #e5e7eb)',
                }}
                type="number"
                min="0"
                step="0.01"
                placeholder="0,00"
                value={form.amount || ''}
                onChange={e => set('amount', parseFloat(e.target.value) || 0)}
              />
              {errors.amount && (
                <span style={{ fontSize: 11, color: '#dc2626', marginTop: 3, display: 'block' }}>
                  {errors.amount}
                </span>
              )}
            </div>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>Data</label>
              <input
                style={{
                  ...inputStyle,
                  borderColor: errors.date ? '#dc2626' : 'var(--border, #e5e7eb)',
                }}
                type="date"
                value={form.date}
                onChange={e => set('date', e.target.value)}
              />
            </div>
          </div>

          {/* Categoria */}
          <div>
            <label style={labelStyle}>Categoria</label>
            <div style={{
              display:   'flex',
              flexWrap:  'wrap',
              gap:       8,
              marginTop: 2,
            }}>
              {CATEGORY_OPTIONS.map(opt => {
                const meta    = CATEGORY_META[opt.value]
                const active  = form.category === opt.value
                return (
                  <button
                    key={opt.value}
                    onClick={() => set('category', opt.value as ExpenseCategory)}
                    style={{
                      padding:      '6px 14px',
                      borderRadius: 20,
                      border:       `1.5px solid ${active ? meta.textColor : 'var(--border, #e5e7eb)'}`,
                      background:   active ? meta.color : 'transparent',
                      color:        active ? meta.textColor : typography.color.muted,
                      fontSize:     13,
                      fontWeight:   active ? 600 : 400,
                      cursor:       'pointer',
                      transition:   'all 0.15s',
                    }}
                  >
                    {meta.label}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Recorrência */}
          <div style={{
            padding:      14,
            borderRadius: 12,
            border:       '1.5px solid var(--border, #e5e7eb)',
            background:   form.isRecurring ? 'rgba(8,145,178,0.05)' : 'transparent',
            transition:   'background 0.2s',
          }}>
            <div
              style={{
                display:    'flex',
                alignItems: 'center',
                gap:        10,
                cursor:     'pointer',
              }}
              onClick={() => set('isRecurring', !form.isRecurring)}
            >
              {/* Toggle */}
              <div style={{
                width:      38,
                height:     22,
                borderRadius: 11,
                background: form.isRecurring ? '#0891b2' : 'var(--border, #cbd5e1)',
                position:   'relative',
                flexShrink: 0,
                transition: 'background 0.2s',
              }}>
                <div style={{
                  position:   'absolute',
                  top:        3,
                  left:       form.isRecurring ? 19 : 3,
                  width:      16,
                  height:     16,
                  borderRadius: '50%',
                  background: '#fff',
                  transition: 'left 0.2s',
                  boxShadow:  '0 1px 3px rgba(0,0,0,0.2)',
                }} />
              </div>

              <div>
                <div style={{
                  fontSize:   14,
                  fontWeight: typography.weight.medium,
                  color:      typography.color.primary,
                  display:    'flex',
                  alignItems: 'center',
                  gap:        6,
                }}>
                  <RefreshCw size={13} color={form.isRecurring ? '#0891b2' : '#94a3b8'} />
                  Despesa fixa (recorrente)
                </div>
                <div style={{
                  fontSize: 11,
                  color:    typography.color.muted,
                  marginTop: 1,
                }}>
                  Repete mensalmente no mesmo dia
                </div>
              </div>
            </div>

            {form.isRecurring && (
              <div style={{ marginTop: 12 }}>
                <label style={{ ...labelStyle, textTransform: 'none', fontSize: 12 }}>
                  Dia do mês para cobrança
                </label>
                <input
                  style={{
                    ...inputStyle,
                    width:      80,
                    borderColor: errors.recurringDay ? '#dc2626' : 'var(--border, #e5e7eb)',
                  }}
                  type="number"
                  min={1}
                  max={28}
                  placeholder="Ex: 5"
                  value={form.recurringDay ?? ''}
                  onChange={e => set('recurringDay', parseInt(e.target.value) || null)}
                />
                {errors.recurringDay && (
                  <span style={{ fontSize: 11, color: '#dc2626', marginTop: 3, display: 'block' }}>
                    {errors.recurringDay}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div style={{
          padding:      '14px 22px',
          borderTop:    '1px solid var(--border, #e5e7eb)',
          display:      'flex',
          gap:          10,
        }}>
          <button
            onClick={onClose}
            style={{
              flex:         1,
              padding:      '11px 0',
              borderRadius: 10,
              border:       '1.5px solid var(--border, #e5e7eb)',
              background:   'transparent',
              cursor:       'pointer',
              fontSize:     14,
              fontWeight:   600,
              color:        typography.color.muted,
            }}
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            style={{
              flex:         2,
              padding:      '11px 0',
              borderRadius: 10,
              border:       'none',
              background:   saving ? '#94a3b8' : 'linear-gradient(135deg,#dc2626,#b91c1c)',
              cursor:       saving ? 'not-allowed' : 'pointer',
              fontSize:     14,
              fontWeight:   700,
              color:        '#fff',
              letterSpacing: '0.02em',
              transition:   'opacity 0.15s',
            }}
          >
            {saving ? 'Salvando…' : expense ? 'Salvar alterações' : 'Adicionar despesa'}
          </button>
        </div>
      </div>
    </>
  )
}
