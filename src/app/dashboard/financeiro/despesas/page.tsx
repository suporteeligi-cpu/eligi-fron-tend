'use client'
// src/app/dashboard/financeiro/despesas/page.tsx
// @eligi:expcat-page — direcao C "Por categoria" (out/2026).
// Topo com o total do mes, um cartao por categoria (tocar filtra a lista) e os
// lancamentos por dia. Botao principal PRETO; vermelho so em acao destrutiva
// (pedido do Eli). Layout por @media; useIsMobile so para o CalendarPicker,
// que pede a prop.

import { useMemo, useRef, useState } from 'react'
import { ChevronLeft, ChevronRight, Plus, RefreshCw, SlidersHorizontal, Tag } from 'lucide-react'
import dayjs from 'dayjs'
import 'dayjs/locale/pt-br'
import CalendarPicker from '@/shared/components/CalendarPicker'
import FinanceBackLink from '../components/FinanceBackLink' // @eligi:fin-back-dsp-imp
import { useIsMobile } from '@/hooks/useIsMobile'
import { useExpenses, useMonthTotal } from '@/features/expenses/hooks/useExpenses'
import { useExpenseCategories } from '@/features/expenses/hooks/useExpenseCategories'
import { customView, expenseKey, expenseView } from '@/features/expenses/categories'
import ExpenseCategoryGrid, { type CategoryCard } from '@/features/expenses/components/ExpenseCategoryGrid'
import ExpenseList from '@/features/expenses/components/ExpenseList'
import ExpenseModal from '@/features/expenses/components/ExpenseModal'
import ExpenseSheet from '@/features/expenses/components/ExpenseSheet'
import CategoryEditorSheet from '@/features/expenses/components/CategoryEditorSheet'
import CategoryManagerSheet from '@/features/expenses/components/CategoryManagerSheet'
import ExpenseSettingsSheet from '@/features/expenses/components/ExpenseSettingsSheet'
import ExpenseActionSheet from '@/features/expenses/components/ExpenseActionSheet'
import type {
  CreateExpensePayload, CustomCategory, CustomCategoryInput, EditRecurringPayload, Expense,
} from '@/features/expenses/types'

dayjs.locale('pt-br')

const BRL = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })

function splitBRL(v: number): [string, string] {
  const s = BRL.format(v)
  const i = s.lastIndexOf(',')
  return i < 0 ? [s, ''] : [s.slice(0, i), s.slice(i)]
}

type EditorState = { editing: CustomCategory | null } | null

export default function DespesasPage() {
  const isMobile = useIsMobile()

  // ── mes ────────────────────────────────────────────────────────────────
  const [month, setMonth] = useState(() => dayjs().format('YYYY-MM'))
  const [monthOpen, setMonthOpen] = useState(false)
  const prevMonth = dayjs(`${month}-01`).subtract(1, 'month').format('YYYY-MM')
  const monthRaw = dayjs(`${month}-01`).format('MMMM [de] YYYY')
  const monthLabel = monthRaw.charAt(0).toUpperCase() + monthRaw.slice(1)

  // ── dados ──────────────────────────────────────────────────────────────
  const { expenses, kpis, loading, error, refetch, create, update, editRecurring, remove, skipOccurrence, stopRecurrence } = useExpenses(month)
  const prevTotal = useMonthTotal(prevMonth)
  const cats = useExpenseCategories()

  // ── filtro / folhas ────────────────────────────────────────────────────
  const [selected, setSelected] = useState('')
  const [modal, setModal] = useState<{ expense: Expense | null; seq: number } | null>(null)
  const [editor, setEditor] = useState<EditorState>(null)
  const [managerOpen, setManagerOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [menuTarget, setMenuTarget] = useState<Expense | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Expense | null>(null)
  const [stopTarget, setStopTarget] = useState<Expense | null>(null)
  const [busy, setBusy] = useState(false)
  const [confirmError, setConfirmError] = useState<string | null>(null)

  // ── toast ──────────────────────────────────────────────────────────────
  const [toast, setToast] = useState<string | null>(null)
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  function showToast(msg: string) {
    if (toastTimer.current) clearTimeout(toastTimer.current)
    setToast(msg)
    toastTimer.current = setTimeout(() => setToast(null), 2800)
  }

  // ── cartoes por categoria ──────────────────────────────────────────────
  const cards = useMemo<CategoryCard[]>(() => {
    const acc = new Map<string, CategoryCard>()
    for (const e of expenses) {
      const key = expenseKey(e)
      const cur = acc.get(key)
      if (cur) { cur.total += e.amount; cur.count += 1 }
      else acc.set(key, { view: expenseView(e), total: e.amount, count: 1 })
    }
    const used = [...acc.values()].sort((a, b) => b.total - a.total)
    // categorias proprias ativas sem despesa no mes aparecem no fim
    const idle = cats.items
      .filter((c) => !c.archived && !acc.has(`custom:${c.id}`))
      .map((c) => ({ view: customView(c), total: 0, count: 0 }))
    return [...used, ...idle]
  }, [expenses, cats.items])

  // filtro selecionado que deixou de existir (troca de mes) nao prende a lista vazia
  const activeFilter = cards.some((c) => c.view.key === selected) ? selected : ''
  const visible = activeFilter ? expenses.filter((e) => expenseKey(e) === activeFilter) : expenses
  const filterLabel = activeFilter ? cards.find((c) => c.view.key === activeFilter)?.view.label : null

  const total = kpis.total
  const [whole, cents] = splitBRL(total)
  const delta = prevTotal != null && prevTotal > 0 && !loading ? (total - prevTotal) / prevTotal : null

  // ── acoes ──────────────────────────────────────────────────────────────
  async function handleSave(payload: CreateExpensePayload) {
    const target = modal?.expense
    if (target) await update(target.id, payload)
    else await create(payload)
    void cats.reload() // contagem de uso das categorias mudou
    showToast(target ? 'Despesa atualizada' : 'Despesa adicionada')
  }

  // @eligi:exprec-front-page — despesa fixa: so este mes ou daqui pra frente
  async function handleSaveRecurring(payload: EditRecurringPayload) {
    const target = modal?.expense
    if (!target) return
    await editRecurring(target.id, payload)
    void cats.reload()
    showToast(payload.scope === 'FORWARD' ? 'Despesa fixa atualizada daqui para frente' : 'Despesa atualizada só neste mês')
  }

  async function handleCreateCategory(input: CustomCategoryInput) {
    const created = await cats.create(input)
    showToast(`Categoria "${created.name}" criada`)
    return created
  }

  async function handleSkip(e: Expense) {
    setMenuTarget(null)
    try { await skipOccurrence(e.id); showToast('Despesa pulada neste mês') }
    catch { showToast('Não foi possível pular a despesa') }
  }

  async function confirm(kind: 'delete' | 'stop') {
    const target = kind === 'delete' ? deleteTarget : stopTarget
    if (!target) return
    setBusy(true)
    setConfirmError(null)
    try {
      if (kind === 'delete') { await remove(target.id); setDeleteTarget(null); showToast('Despesa removida') }
      else if (target.recurrenceId) { await stopRecurrence(target.recurrenceId); setStopTarget(null); showToast('Despesa fixa encerrada') }
      else setStopTarget(null)
      void cats.reload()
    } catch {
      setConfirmError(kind === 'delete' ? 'Não foi possível remover. Tente de novo.' : 'Não foi possível parar. Tente de novo.')
    } finally {
      setBusy(false)
    }
  }

  function closeConfirm() {
    if (busy) return
    setDeleteTarget(null); setStopTarget(null); setConfirmError(null)
  }

  const confirmTarget = deleteTarget ?? stopTarget
  const confirmKind: 'delete' | 'stop' = deleteTarget ? 'delete' : 'stop'

  return (
    <div className="dp">
      <style>{CSS}</style>

      {/* ── cabecalho ─────────────────────────────────────────────────── */}
      {/* @eligi:fin-back-dsp-jsx: tela so do dono, o menu sempre abre */}
      <FinanceBackLink />

      <header className="dp-head">
        <div style={{ minWidth: 0 }}>
          <h1 className="dp-h1">Despesas</h1>
          <div className="dp-month">
            <button type="button" className="dp-mbtn" aria-label="Mês anterior"
              onClick={() => setMonth(prevMonth)}><ChevronLeft size={17} /></button>
            <button type="button" className="dp-mlbl" onClick={() => setMonthOpen(true)}>{monthLabel}</button>
            <button type="button" className="dp-mbtn" aria-label="Próximo mês"
              onClick={() => setMonth(dayjs(`${month}-01`).add(1, 'month').format('YYYY-MM'))}><ChevronRight size={17} /></button>
          </div>
        </div>
        <div className="dp-acts">
          <button type="button" className="dp-ghost" onClick={() => setManagerOpen(true)} aria-label="Categorias">
            <Tag size={16} /><span className="dp-ghl">Categorias</span>
          </button>
          <button type="button" className="dp-ghost is-icon" onClick={() => setSettingsOpen(true)} aria-label="Despesas automáticas">
            <SlidersHorizontal size={16} />
          </button>
          <button type="button" className="dp-new" onClick={() => setModal({ expense: null, seq: Date.now() })} aria-label="Nova despesa">
            <Plus size={18} /><span className="dp-newl">Nova despesa</span>
          </button>
        </div>
      </header>

      {/* ── total do mes ──────────────────────────────────────────────── */}
      <section className="dp-hero" aria-live="polite">
        <div className="dp-eyebrow">SAIU NESTE MÊS</div>
        {loading ? (
          <div className="dp-skel" style={{ width: 200, height: 46, marginTop: 6 }} />
        ) : (
          <div className="dp-total"><span>{whole}</span><span className="dp-cents">{cents}</span></div>
        )}
        <div className="dp-sub">
          {delta != null && (
            <span className={`dp-delta ${delta > 0 ? 'is-up' : 'is-down'}`}>
              {delta > 0 ? '▲' : '▼'} {Math.abs(Math.round(delta * 100))}% vs {dayjs(`${prevMonth}-01`).format('MMM')}
            </span>
          )}
          {!loading && (
            <span className="dp-fix">
              <RefreshCw size={12} /> {BRL.format(kpis.fixed)} em fixas · {expenses.length} lançamento{expenses.length === 1 ? '' : 's'}
            </span>
          )}
        </div>
      </section>

      {/* ── categorias ────────────────────────────────────────────────── */}
      <ExpenseCategoryGrid
        cards={cards}
        monthTotal={total}
        selected={activeFilter}
        loading={loading}
        onSelect={setSelected}
        onCreate={() => setEditor({ editing: null })}
      />

      {/* ── lancamentos ──────────────────────────────────────────────── */}
      <div className="dp-lhead">
        <h2 className="dp-h2">{filterLabel ?? 'Lançamentos'}</h2>
        {filterLabel && <button type="button" className="dp-clear" onClick={() => setSelected('')}>Ver todas</button>}
      </div>

      {error ? (
        <div className="dp-state">
          <div className="dp-st">{error}</div>
          <button type="button" className="dp-ghost" onClick={() => void refetch()}>Tentar de novo</button>
        </div>
      ) : loading ? (
        <div className="dp-skel" style={{ height: 180, borderRadius: 16 }} />
      ) : visible.length === 0 ? (
        <div className="dp-state">
          <div className="dp-st">{filterLabel ? `Nada em ${filterLabel} neste mês.` : 'Nenhuma despesa neste mês.'}</div>
          <div className="dp-ss">Lance contas, compras e fixas para ver para onde vai o dinheiro.</div>
          <button type="button" className="dp-new" onClick={() => setModal({ expense: null, seq: Date.now() })}>
            <Plus size={18} /><span className="dp-newl is-always">Nova despesa</span>
          </button>
        </div>
      ) : (
        <ExpenseList
          expenses={visible}
          onEdit={(e) => setModal({ expense: e, seq: Date.now() })}
          onDelete={(e) => { setConfirmError(null); setDeleteTarget(e) }}
          onMenu={setMenuTarget}
        />
      )}

      {/* ── folhas ───────────────────────────────────────────────────── */}
      {modal && (
        <ExpenseModal
          key={`${modal.expense?.id ?? 'new'}-${modal.seq}`}
          expense={modal.expense}
          categories={cats.items}
          onCreateCategory={handleCreateCategory}
          onSave={handleSave}
          onSaveRecurring={handleSaveRecurring}
          onClose={() => setModal(null)}
        />
      )}

      {managerOpen && (
        <CategoryManagerSheet
          items={cats.items}
          onCreate={() => setEditor({ editing: null })}
          onEdit={(c) => setEditor({ editing: c })}
          onArchive={async (id) => { await cats.archive(id); showToast('Categoria arquivada') }}
          onRestore={async (id) => { await cats.restore(id); showToast('Categoria restaurada') }}
          onDelete={async (id) => { await cats.remove(id); showToast('Categoria apagada') }}
          onClose={() => setManagerOpen(false)}
        />
      )}

      {editor && (
        <CategoryEditorSheet
          key={editor.editing?.id ?? 'new'}
          existing={cats.items}
          editing={editor.editing}
          level={managerOpen ? 2 : 1}
          onClose={() => setEditor(null)}
          onSubmit={async (input) => {
            if (editor.editing) {
              await cats.update(editor.editing.id, input)
              await refetch() // nome/cor novos aparecem nas despesas
              showToast('Categoria salva')
            } else {
              await handleCreateCategory(input)
            }
          }}
        />
      )}

      {settingsOpen && <ExpenseSettingsSheet onClose={() => setSettingsOpen(false)} onSaved={() => void refetch()} />}

      {menuTarget && (
        <ExpenseActionSheet
          expense={menuTarget}
          onEdit={(e) => { setMenuTarget(null); setModal({ expense: e, seq: Date.now() }) }}
          onSkip={handleSkip}
          onStop={(e) => { setMenuTarget(null); setConfirmError(null); setStopTarget(e) }}
          onClose={() => setMenuTarget(null)}
        />
      )}

      {confirmTarget && (
        <ExpenseSheet
          title={confirmKind === 'delete' ? 'Remover despesa?' : 'Parar despesa fixa?'}
          onClose={closeConfirm}
          footer={
            <>
              {confirmError && <div className="dp-cerr" role="alert">{confirmError}</div>}
              <div className="dp-cacts">
                <button type="button" className="dp-ghost dp-grow" onClick={closeConfirm} disabled={busy}>Voltar</button>
                <button type="button" className="dp-danger dp-grow" onClick={() => void confirm(confirmKind)} disabled={busy}>
                  {busy ? 'Aguarde…' : confirmKind === 'delete' ? 'Remover' : 'Parar'}
                </button>
              </div>
            </>
          }
        >
          <p className="dp-ctext">
            {confirmKind === 'delete'
              ? <>“{confirmTarget.description}” ({BRL.format(confirmTarget.amount)}) sai do mês. Não dá para desfazer.</>
              : <>“{confirmTarget.description}” deixa de ser lançada a partir do próximo mês. O que já foi lançado continua no histórico.</>}
          </p>
        </ExpenseSheet>
      )}

      {monthOpen && (
        <CalendarPicker
          mode="month"
          date={dayjs(`${month}-01`)}
          isMobile={isMobile}
          monthValue={month}
          maxMonth={dayjs().format('YYYY-MM')}
          onSelect={() => {}}
          onClose={() => setMonthOpen(false)}
          onSelectMonth={(m) => { setMonth(m); setMonthOpen(false) }}
        />
      )}

      {toast && <div className="dp-toast" role="status">{toast}</div>}
    </div>
  )
}

const CSS = `
.dp{max-width:980px;margin:0 auto;padding:4px 16px 96px;font-family:var(--font-sans);color:#111114}
@media (min-width:720px){.dp{padding:8px 24px 64px}}
@media (max-width:359px){.dp-h1{font-size:22px}.dp-acts{gap:6px}}
.dp-head{display:flex;align-items:flex-start;justify-content:space-between;gap:12px;margin-bottom:18px}
.dp-h1{font-family:var(--font-display);font-size:28px;font-weight:700;letter-spacing:-.04em;margin:0;color:#111114;line-height:1.1}
.dp-month{display:flex;align-items:center;gap:2px;margin-top:6px;margin-left:-8px}
.dp-mbtn{width:36px;height:36px;border-radius:10px;border:0;background:none;color:#4b4b52;display:grid;place-items:center;cursor:pointer}
.dp-mbtn:hover{background:#ececf0}
.dp-mlbl{min-height:36px;padding:0 6px;border:0;background:none;font-family:inherit;font-size:14.5px;font-weight:600;color:#111114;white-space:nowrap;cursor:pointer;border-radius:10px}
.dp-mlbl:hover{background:#ececf0}
.dp-acts{display:flex;align-items:center;gap:8px;flex-shrink:0}
.dp-ghost{min-height:44px;padding:0 14px;border-radius:12px;border:1px solid rgba(17,17,20,.12);background:#fff;color:#111114;font-family:inherit;font-size:14px;font-weight:600;display:inline-flex;align-items:center;justify-content:center;gap:7px;cursor:pointer}
.dp-ghost:hover{background:#f5f5f7}
.dp-ghost span{color:#111114}
.dp-ghost:disabled{opacity:.5;cursor:not-allowed}
.dp-ghost.is-icon{width:44px;padding:0}
.dp-new{min-height:44px;min-width:44px;padding:0 16px;border-radius:12px;border:0;background:#111114;color:#fff;font-family:inherit;font-size:14px;font-weight:700;display:inline-flex;align-items:center;justify-content:center;gap:7px;cursor:pointer}
.dp-new:hover{background:#26262c}
.dp-new span{color:#fff}
@media (max-width:639px){
  .dp-ghl,.dp-newl:not(.is-always){display:none}
  .dp-ghost:not(.is-icon){width:44px;padding:0}
  .dp-acts .dp-new{width:44px;padding:0;border-radius:50%}
}
.dp-hero{margin-bottom:18px}
.dp-eyebrow{font-family:var(--font-mono);font-size:11px;font-weight:600;letter-spacing:.1em;color:#8a8a93}
.dp-total{font-family:var(--font-display);font-size:44px;font-weight:700;letter-spacing:-.05em;line-height:1.05;font-variant-numeric:tabular-nums;margin-top:4px}
.dp-total span{color:#111114}
.dp-total .dp-cents{font-size:24px;color:#8a8a93;letter-spacing:-.03em}
@media (min-width:720px){.dp-total{font-size:52px}.dp-total .dp-cents{font-size:28px}}
.dp-sub{display:flex;flex-wrap:wrap;align-items:center;gap:10px;margin-top:8px}
.dp-delta{font-size:12.5px;font-weight:600;padding:3px 8px;border-radius:8px;font-variant-numeric:tabular-nums}
.dp-delta.is-up{color:#b45309;background:#fffbeb}
.dp-delta.is-down{color:#0f6e56;background:#ecfdf5}
.dp-fix{display:inline-flex;align-items:center;gap:5px;font-size:12.5px;color:#8a8a93;font-variant-numeric:tabular-nums}
.dp-lhead{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:2px}
.dp-h2{font-family:var(--font-display);font-size:19px;font-weight:700;letter-spacing:-.03em;margin:0;color:#111114}
.dp-clear{min-height:40px;padding:0 10px;border:0;background:none;font-family:inherit;font-size:13.5px;font-weight:600;color:#4b4b52;cursor:pointer;border-radius:10px}
.dp-clear:hover{background:#ececf0}
.dp-state{background:#fff;border:1px solid rgba(17,17,20,.07);border-radius:16px;padding:28px 20px;display:flex;flex-direction:column;align-items:center;text-align:center;gap:8px;margin-top:10px}
.dp-st{font-size:15px;font-weight:600;color:#111114}
.dp-ss{font-size:13px;color:#8a8a93;max-width:320px;line-height:1.45;margin-bottom:6px}
.dp-skel{background:linear-gradient(90deg,#ececf0 25%,#f5f5f7 50%,#ececf0 75%);background-size:200% 100%;animation:dp-sh 1.2s infinite;border-radius:10px;margin-top:10px}
@keyframes dp-sh{from{background-position:200% 0}to{background-position:-200% 0}}
.dp-cacts{display:flex;gap:10px}
.dp-grow{flex:1}
.dp-danger{min-height:48px;border-radius:12px;border:0;background:#dc2626;color:#fff;font-family:inherit;font-size:14.5px;font-weight:700;cursor:pointer}
.dp-danger:hover{background:#b91c1c}
.dp-danger:disabled{background:#a1a1aa;cursor:not-allowed}
.dp-cacts .dp-ghost{min-height:48px}
.dp-ctext{font-size:14px;color:#4b4b52;line-height:1.5;margin:4px 0 6px}
.dp-cerr{font-size:13px;color:#b91c1c;margin-bottom:10px}
.dp-toast{position:fixed;left:50%;bottom:calc(var(--bottom-nav-h,0px) + 20px + env(safe-area-inset-bottom));transform:translateX(-50%);z-index:10010;background:#111114;color:#fff;padding:11px 18px;border-radius:12px;font-size:13.5px;font-weight:600;box-shadow:0 8px 24px rgba(17,17,20,.25);white-space:nowrap;animation:dp-toast .2s ease}
@keyframes dp-toast{from{opacity:0;transform:translate(-50%,8px)}}
@media (prefers-reduced-motion:reduce){.dp-skel,.dp-toast{animation:none}}
`
