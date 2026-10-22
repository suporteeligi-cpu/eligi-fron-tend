// src/features/expenses/components/ExpenseList.tsx
// @eligi:expcat-list — lancamentos agrupados por dia, com o subtotal do dia.
// Acoes por origem: MANUAL edita (toque na linha) e remove; RECURRING edita
// (toque na linha) e abre o menu (pular mes / parar); automatica e so leitura.
// @eligi:exprec-front-list
'use client'

import { MoreHorizontal, RefreshCw, Trash2, Zap } from 'lucide-react'
import dayjs from 'dayjs'
import 'dayjs/locale/pt-br'
import { expenseView, tint } from '../categories'
import type { Expense } from '../types'

dayjs.locale('pt-br')

const BRL = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })

interface Props {
  expenses: Expense[]
  onEdit:   (e: Expense) => void
  onDelete: (e: Expense) => void
  onMenu:   (e: Expense) => void
}

function dayLabel(iso: string): string {
  return dayjs(iso).format('ddd · DD MMM').replace('.', '').toUpperCase()
}

export default function ExpenseList({ expenses, onEdit, onDelete, onMenu }: Props) {
  const groups: { day: string; items: Expense[]; total: number }[] = []
  for (const e of expenses) {
    const day = dayjs(e.date).format('YYYY-MM-DD')
    const last = groups[groups.length - 1]
    if (last && last.day === day) { last.items.push(e); last.total += e.amount }
    else groups.push({ day, items: [e], total: e.amount })
  }

  return (
    <div>
      <style>{CSS}</style>
      {groups.map((g) => (
        <section key={g.day} className="xl-day">
          <div className="xl-dayh">
            <span className="xl-dayl">{dayLabel(g.items[0].date)}</span>
            <span className="xl-dayt">{BRL.format(g.total)}</span>
          </div>
          <div className="xl-card">
            {g.items.map((e) => {
              const v = expenseView(e)
              const Icon = v.Icon
              const manual = e.origin === 'MANUAL'
              const recurring = e.origin === 'RECURRING'
              const auto = !manual && !recurring
              return (
                <div key={e.id} className="xl-row">
                  <button
                    type="button"
                    className="xl-main"
                    disabled={auto}
                    onClick={() => !auto && onEdit(e)}
                    aria-label={auto ? undefined : `Editar ${e.description}`}
                  >
                    <span className="xl-tile" style={{ background: tint(v.color, 0.13), color: v.color }}>
                      <Icon size={17} />
                    </span>
                    <span className="xl-tx">
                      <span className="xl-ds">{e.description}</span>
                      <span className="xl-mt">
                        <span className="xl-cat">{v.label}</span>
                        {e.isRecurring && <span className="xl-tag"><RefreshCw size={10} />fixa</span>}
                        {auto && <span className="xl-tag"><Zap size={10} />automática</span>}
                      </span>
                    </span>
                    <span className="xl-am">{BRL.format(e.amount)}</span>
                  </button>
                  {manual && (
                    <button type="button" className="xl-act" onClick={() => onDelete(e)} aria-label={`Remover ${e.description}`}>
                      <Trash2 size={16} />
                    </button>
                  )}
                  {recurring && (
                    <button type="button" className="xl-act" onClick={() => onMenu(e)} aria-label={`Opções de ${e.description}`}>
                      <MoreHorizontal size={18} />
                    </button>
                  )}
                  {auto && <span className="xl-act-sp" aria-hidden />}
                </div>
              )
            })}
          </div>
        </section>
      ))}
    </div>
  )
}

const CSS = `
.xl-day{margin-bottom:6px}
.xl-dayh{display:flex;justify-content:space-between;align-items:baseline;padding:12px 4px 6px}
.xl-dayl,.xl-dayt{font-family:var(--font-mono);font-size:11px;font-weight:600;letter-spacing:.08em;color:#8a8a93;font-variant-numeric:tabular-nums}
.xl-card{background:#fff;border:1px solid rgba(17,17,20,.07);border-radius:16px;box-shadow:0 1px 2px rgba(17,17,20,.04);overflow:hidden}
.xl-row{display:flex;align-items:center;border-top:1px solid rgba(17,17,20,.07)}
.xl-row:first-child{border-top:0}
.xl-main{flex:1;min-width:0;display:flex;align-items:center;gap:12px;padding:12px 6px 12px 14px;background:none;border:0;text-align:left;font-family:inherit;cursor:pointer;min-height:60px}
.xl-main:disabled{cursor:default;opacity:1}
.xl-main:not(:disabled):hover{background:#fafafb}
.xl-tile{width:38px;height:38px;border-radius:11px;display:grid;place-items:center;flex-shrink:0}
.xl-tx{flex:1;min-width:0;display:flex;flex-direction:column}
.xl-ds{font-size:14.5px;font-weight:600;color:#111114;line-height:1.3;overflow:hidden;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow-wrap:break-word}
.xl-mt{display:flex;align-items:center;gap:6px;flex-wrap:wrap;margin-top:2px}
.xl-cat{font-size:12.5px;color:#8a8a93}
.xl-tag{display:inline-flex;align-items:center;gap:3px;font-family:var(--font-mono);font-size:10px;font-weight:600;letter-spacing:.06em;text-transform:uppercase;color:#4b4b52;background:#f0f0f3;padding:2px 6px;border-radius:6px}
.xl-am{font-family:var(--font-display);font-size:15px;font-weight:600;letter-spacing:-.02em;font-variant-numeric:tabular-nums;color:#111114;white-space:nowrap;padding-left:6px}
.xl-act{width:44px;height:44px;margin-right:6px;border-radius:12px;border:0;background:none;color:#8a8a93;display:grid;place-items:center;cursor:pointer;flex-shrink:0}
.xl-act:hover{background:#f0f0f3;color:#111114}
.xl-act-sp{width:50px;flex-shrink:0}
@media (max-width:379px){.xl-tile{display:none}.xl-main{padding-left:14px}.xl-am{font-size:14px}}
`
