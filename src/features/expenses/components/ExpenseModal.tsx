// src/features/expenses/components/ExpenseModal.tsx
// @eligi:expcat-modal — lancar ou editar despesa (direcao C, out/2026).
// A pagina monta este componente so quando abre (e com key por despesa), entao
// o estado nasce do valor inicial: nada de efeito copiando prop para state.
// @eligi:exprec-front-modal — despesa fixa (origin RECURRING): dia do mes no
// lugar da data e escolha entre so este mes / este e os proximos. Manda so os
// campos que mudaram: senao um ajuste feito so neste mes vazaria para os proximos.
'use client'

import { useMemo, useState } from 'react'
import { Plus, RefreshCw } from 'lucide-react'
import dayjs from 'dayjs'
import ExpenseSheet from './ExpenseSheet'
import CategoryEditorSheet from './CategoryEditorSheet'
import {
  BASE_CATEGORIES, BASE_ORDER, baseView, customView, tint,
  type CategoryView,
} from '../categories'
import type {
  CreateExpensePayload, CustomCategory, CustomCategoryInput, EditRecurringPayload, Expense, ExpenseCategory,
  RecurringScope,
} from '../types'

interface Props {
  expense:          Expense | null        // null = nova
  categories:       CustomCategory[]
  onCreateCategory: (input: CustomCategoryInput) => Promise<CustomCategory>
  onSave:           (payload: CreateExpensePayload) => Promise<void>
  onSaveRecurring:  (payload: EditRecurringPayload) => Promise<void>
  onClose:          () => void
}

const BRL = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })

function centsFromAmount(v: number): string {
  return v > 0 ? String(Math.round(v * 100)) : ''
}

function catKeyOf(e: Expense): string {
  return e.customCategoryId ? `custom:${e.customCategoryId}` : e.category
}

export default function ExpenseModal({ expense, categories, onCreateCategory, onSave, onSaveRecurring, onClose }: Props) {
  // ocorrencia de despesa fixa: edita so este mes ou daqui pra frente
  const fixed = expense?.origin === 'RECURRING' && !!expense.recurrenceId && !!expense.competence
  const monthName = expense?.competence ? dayjs(`${expense.competence}-01`).format('MMMM') : ''
  const MonthName = monthName.charAt(0).toUpperCase() + monthName.slice(1)
  const [scope, setScope] = useState<RecurringScope>('FORWARD')
  const [cents, setCents] = useState(() => centsFromAmount(expense?.amount ?? 0))
  const [description, setDescription] = useState(expense?.description ?? '')
  const [date, setDate] = useState(() => dayjs(expense?.date ?? undefined).format('YYYY-MM-DD'))
  const [catKey, setCatKey] = useState<string>(() => (expense ? catKeyOf(expense) : ''))
  const [isRecurring, setIsRecurring] = useState(expense?.isRecurring ?? false)
  const [recurringDay, setRecurringDay] = useState<number>(() => expense?.recurringDay ?? Math.min(dayjs().date(), 28))
  const [touched, setTouched] = useState(false)
  const [saving, setSaving] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)
  const [editorOpen, setEditorOpen] = useState(false)

  const amount = cents ? Number(cents) / 100 : 0

  // escolha: as do Eligi que se lanca a mao + as proprias ativas
  // (+ a arquivada que a despesa ja usa, para editar sem trocar)
  const options = useMemo<CategoryView[]>(() => {
    const base = BASE_ORDER.filter((k) => BASE_CATEGORIES[k].manual).map(baseView)
    const own = categories
      .filter((c) => !c.archived || `custom:${c.id}` === catKey)
      .map(customView)
    return [...base, ...own]
  }, [categories, catKey])

  // so o que mudou em relacao a esta ocorrencia (despesa fixa)
  const changes: Omit<EditRecurringPayload, 'scope'> = {}
  if (fixed && expense) {
    if (Math.round(amount * 100) !== Math.round(expense.amount * 100)) changes.amount = amount
    if (description.trim() !== expense.description) changes.description = description.trim()
    if (catKey !== catKeyOf(expense)) {
      const custom = catKey.startsWith('custom:') ? catKey.slice(7) : null
      changes.customCategoryId = custom
      changes.category = custom ? 'OUTROS' : (catKey as ExpenseCategory)
    }
    if (recurringDay !== expense.recurringDay) changes.recurringDay = recurringDay
  }

  const errors = {
    amount: amount <= 0 ? 'Informe o valor.' : null,
    description: description.trim().length < 2 ? 'Descreva a despesa (mínimo 2 letras).' : null,
    date: !fixed && !date ? 'Escolha a data.' : null,
    category: !catKey ? 'Escolha uma categoria.' : null,
    nothing: fixed && Object.keys(changes).length === 0 ? 'Nada mudou ainda.' : null,
  }
  const firstError = Object.values(errors).find(Boolean) ?? null

  async function save() {
    setTouched(true)
    if (firstError || saving) return
    setSaving(true)
    setServerError(null)
    const custom = catKey.startsWith('custom:') ? catKey.slice(7) : null
    try {
      if (fixed) {
        await onSaveRecurring({ scope, ...changes })
        onClose()
        return
      }
      await onSave({
        date: dayjs(date).hour(12).toISOString(),
        amount,
        description: description.trim(),
        category: custom ? 'OUTROS' : (catKey as ExpenseCategory),
        customCategoryId: custom,
        isRecurring: expense ? expense.isRecurring : isRecurring,
        recurringDay: (expense ? expense.isRecurring : isRecurring) ? recurringDay : null,
      })
      onClose()
    } catch (err) {
      setServerError(err instanceof Error ? err.message : 'Não foi possível salvar a despesa.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <ExpenseSheet
        title={fixed ? 'Editar despesa fixa' : expense ? 'Editar despesa' : 'Nova despesa'}
        onClose={onClose}
        footer={
          <>
            {(serverError || (touched && firstError)) && (
              <div className="em-ferr" role="alert">{serverError ?? firstError}</div>
            )}
            <button type="button" className="em-save" onClick={save} disabled={saving}>
              {saving ? 'Salvando…'
                : fixed ? (scope === 'FORWARD' ? 'Salvar daqui para frente' : `Salvar só em ${monthName}`)
                : expense ? 'Salvar alterações' : 'Adicionar despesa'}
            </button>
          </>
        }
      >
        <style>{CSS}</style>

        <label className="em-lbl" htmlFor="em-amount">Valor</label>
        <input
          id="em-amount"
          className={`em-in em-amount${touched && errors.amount ? ' is-err' : ''}`}
          inputMode="numeric"
          autoComplete="off"
          placeholder="R$ 0,00"
          autoFocus={!expense}
          value={cents ? BRL.format(amount) : ''}
          onChange={(e) => setCents(e.target.value.replace(/\D/g, '').replace(/^0+/, '').slice(0, 9))}
        />

        <label className="em-lbl" htmlFor="em-desc">Descrição</label>
        <input
          id="em-desc"
          className={`em-in${touched && errors.description ? ' is-err' : ''}`}
          placeholder="Ex.: Conta de luz, aluguel do salão"
          maxLength={200}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />

        {fixed ? (
          <div className="em-day is-solo">
            <span className="em-dayl">Dia do mês</span>
            <div className="em-step">
              <button type="button" aria-label="Dia anterior" onClick={() => setRecurringDay((d) => (d <= 1 ? 28 : d - 1))}>−</button>
              <span className="em-dayv">{recurringDay}</span>
              <button type="button" aria-label="Próximo dia" onClick={() => setRecurringDay((d) => (d >= 28 ? 1 : d + 1))}>+</button>
            </div>
          </div>
        ) : (
          <>
            <label className="em-lbl" htmlFor="em-date">Data</label>
            <input
              id="em-date"
              type="date"
              className={`em-in${touched && errors.date ? ' is-err' : ''}`}
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </>
        )}

        <div className="em-lbl">Categoria</div>
        <div className={`em-cats${touched && errors.category ? ' is-err' : ''}`} role="radiogroup" aria-label="Categoria">
          {options.map((o) => {
            const Icon = o.Icon
            const on = catKey === o.key
            return (
              <button
                key={o.key}
                type="button"
                role="radio"
                aria-checked={on}
                className={`em-cat${on ? ' is-on' : ''}`}
                onClick={() => setCatKey(o.key)}
              >
                <span className="em-ctile" style={{ background: tint(o.color, 0.13), color: o.color }}><Icon size={15} /></span>
                <span className="em-cname">{o.label}</span>
              </button>
            )
          })}
          <button type="button" className="em-cat is-add" onClick={() => setEditorOpen(true)}>
            <Plus size={18} />
            <span className="em-cname">Nova categoria</span>
          </button>
        </div>

        {!expense ? (
          <div className={`em-fix${isRecurring ? ' is-on' : ''}`}>
            <button type="button" className="em-fixrow" role="switch" aria-checked={isRecurring}
              onClick={() => setIsRecurring((v) => !v)}>
              <span className="em-sw" aria-hidden><span /></span>
              <span style={{ textAlign: 'left', minWidth: 0 }}>
                <span className="em-fixt"><RefreshCw size={13} /> Despesa fixa</span>
                <span className="em-fixs">Lança sozinha todo mês, no mesmo dia</span>
              </span>
            </button>
            {isRecurring && (
              <div className="em-day">
                <span className="em-dayl">Dia do mês</span>
                <div className="em-step">
                  <button type="button" aria-label="Dia anterior" onClick={() => setRecurringDay((d) => (d <= 1 ? 28 : d - 1))}>−</button>
                  <span className="em-dayv">{recurringDay}</span>
                  <button type="button" aria-label="Próximo dia" onClick={() => setRecurringDay((d) => (d >= 28 ? 1 : d + 1))}>+</button>
                </div>
              </div>
            )}
          </div>
        ) : fixed ? (
          <>
            <div className="em-lbl">Aplicar a</div>
            <div className="em-scopes" role="radiogroup" aria-label="Aplicar a">
              <button type="button" role="radio" aria-checked={scope === 'THIS'}
                className={`em-scope${scope === 'THIS' ? ' is-on' : ''}`} onClick={() => setScope('THIS')}>
                <span className="em-dot" aria-hidden />
                <span className="em-st">
                  <span className="em-stt">Só {monthName}</span>
                  <span className="em-sts">Os outros meses continuam como estão</span>
                </span>
              </button>
              <button type="button" role="radio" aria-checked={scope === 'FORWARD'}
                className={`em-scope${scope === 'FORWARD' ? ' is-on' : ''}`} onClick={() => setScope('FORWARD')}>
                <span className="em-dot" aria-hidden />
                <span className="em-st">
                  <span className="em-stt">{MonthName} e os próximos meses</span>
                  <span className="em-sts">Os meses que já passaram não mudam</span>
                </span>
              </button>
            </div>
          </>
        ) : expense.isRecurring ? (
          <div className="em-note"><RefreshCw size={13} /> Despesa fixa. Para mudar a recorrência, use o menu da despesa na lista.</div>
        ) : null}
      </ExpenseSheet>

      {editorOpen && (
        <CategoryEditorSheet
          existing={categories}
          level={2}
          onClose={() => setEditorOpen(false)}
          onSubmit={async (input) => {
            const created = await onCreateCategory(input)
            setCatKey(`custom:${created.id}`)
          }}
        />
      )}
    </>
  )
}

const CSS = `
.em-lbl{display:block;font-family:var(--font-mono);font-size:10.5px;font-weight:600;letter-spacing:.09em;text-transform:uppercase;color:#8a8a93;margin:0 0 8px}
.em-in{width:100%;height:48px;border-radius:12px;border:1.5px solid rgba(17,17,20,.14);padding:0 14px;font-size:16px;font-family:inherit;color:#111114;background:#fff;box-sizing:border-box;margin-bottom:16px}
.em-in.is-err{border-color:#dc2626}
.em-amount{height:60px;font-family:var(--font-display);font-size:28px;font-weight:700;letter-spacing:-.03em;font-variant-numeric:tabular-nums}
.em-cats{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px;margin-bottom:16px;border-radius:14px}
.em-cats.is-err{outline:1.5px solid #dc2626;outline-offset:4px}
.em-cat{min-height:68px;border-radius:14px;border:1px solid rgba(17,17,20,.08);background:#fff;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:6px;padding:8px 4px;cursor:pointer;font-family:inherit;color:#111114}
.em-cat:hover{background:#fafafb}
.em-cat.is-on{box-shadow:inset 0 0 0 2px #111114}
.em-cat.is-add{border-style:dashed;border-color:rgba(17,17,20,.22);color:#4b4b52}
.em-ctile{width:30px;height:30px;border-radius:9px;display:grid;place-items:center}
.em-cname{font-size:12.5px;font-weight:600;text-align:center;line-height:1.2;overflow:hidden;text-overflow:ellipsis;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;max-width:100%}
.em-fix{border-radius:14px;border:1px solid rgba(17,17,20,.08);padding:12px}
.em-fix.is-on{background:#f5f5f7}
.em-fixrow{display:flex;align-items:center;gap:12px;width:100%;background:none;border:0;padding:0;cursor:pointer;font-family:inherit;min-height:44px}
.em-sw{width:42px;height:26px;border-radius:13px;background:#d4d4da;position:relative;flex-shrink:0;transition:background .2s}
.em-sw span{position:absolute;top:3px;left:3px;width:20px;height:20px;border-radius:50%;background:#fff;box-shadow:0 1px 3px rgba(0,0,0,.2);transition:left .2s}
.em-fix.is-on .em-sw{background:#111114}
.em-fix.is-on .em-sw span{left:19px}
.em-fixt{display:flex;align-items:center;gap:6px;font-size:14.5px;font-weight:600;color:#111114}
.em-fixs{display:block;font-size:12.5px;color:#8a8a93;margin-top:2px}
.em-day{display:flex;align-items:center;justify-content:space-between;margin-top:12px;padding-top:12px;border-top:1px solid rgba(17,17,20,.07)}
.em-dayl{font-size:13.5px;color:#4b4b52}
.em-step{display:flex;align-items:center;gap:4px}
.em-step button{width:44px;height:44px;border-radius:12px;border:1px solid rgba(17,17,20,.14);background:#fff;font-size:20px;color:#111114;cursor:pointer;font-family:inherit}
.em-dayv{min-width:40px;text-align:center;font-family:var(--font-display);font-size:20px;font-weight:700;font-variant-numeric:tabular-nums;color:#111114}
.em-day.is-solo{margin:0 0 16px;padding:8px 12px;border:1px solid rgba(17,17,20,.08);border-radius:14px}
.em-scopes{display:flex;flex-direction:column;gap:8px}
.em-scope{display:flex;align-items:center;gap:12px;min-height:60px;width:100%;padding:10px 14px;border-radius:14px;border:1px solid rgba(17,17,20,.1);background:#fff;cursor:pointer;font-family:inherit;text-align:left}
.em-scope:hover{background:#fafafb}
.em-scope.is-on{box-shadow:inset 0 0 0 2px #111114}
.em-dot{width:20px;height:20px;border-radius:50%;border:2px solid #c4c4cc;flex-shrink:0;box-sizing:border-box}
.em-scope.is-on .em-dot{border:6px solid #111114}
.em-st{display:flex;flex-direction:column;min-width:0}
.em-stt{font-size:14.5px;font-weight:600;color:#111114}
.em-sts{font-size:12.5px;color:#8a8a93;margin-top:2px}
.em-note{display:flex;align-items:center;gap:6px;font-size:12.5px;color:#8a8a93;padding:4px 2px}
.em-ferr{font-size:13px;color:#b91c1c;margin-bottom:10px}
.em-save{width:100%;height:50px;border-radius:14px;border:0;background:#111114;color:#fff;font-size:15px;font-weight:700;font-family:inherit;cursor:pointer}
.em-save:hover{background:#26262c}
.em-save:disabled{background:#a1a1aa;cursor:not-allowed}
`
