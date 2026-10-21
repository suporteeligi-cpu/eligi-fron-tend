// src/features/expenses/components/CategoryManagerSheet.tsx
// @eligi:expcat-manager — lista das categorias: as do dono (editar, arquivar,
// apagar, restaurar) e as do Eligi (travadas).
// Apagar so aparece para categoria nunca usada; com uso, so arquivar
// (decisao do Eli, out/2026). Confirmacao na propria linha, sem window.confirm.
'use client'

import { useState } from 'react'
import { Lock, Plus } from 'lucide-react'
import ExpenseSheet from './ExpenseSheet'
import { BASE_CATEGORIES, BASE_ORDER, CATEGORY_MAX_ACTIVE, iconFor, tint } from '../categories'
import type { CustomCategory } from '../types'

interface Props {
  items:     CustomCategory[]
  onCreate:  () => void
  onEdit:    (c: CustomCategory) => void
  onArchive: (id: string) => Promise<unknown>
  onRestore: (id: string) => Promise<unknown>
  onDelete:  (id: string) => Promise<unknown>
  onClose:   () => void
}

function usageText(c: CustomCategory): string {
  const n = c.usage.expenses
  if (n === 0 && c.usage.recurrences === 0) return 'Ainda sem despesas'
  const parts: string[] = []
  if (n > 0) parts.push(`${n} despesa${n === 1 ? '' : 's'}`)
  if (c.usage.recurrences > 0) parts.push(`${c.usage.recurrences} fixa${c.usage.recurrences === 1 ? '' : 's'}`)
  return parts.join(' · ')
}

export default function CategoryManagerSheet({ items, onCreate, onEdit, onArchive, onRestore, onDelete, onClose }: Props) {
  const [confirmId, setConfirmId] = useState<string | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [error, setError] = useState<{ id: string; msg: string } | null>(null)

  const active = items.filter((c) => !c.archived)
  const archived = items.filter((c) => c.archived)
  const atLimit = active.length >= CATEGORY_MAX_ACTIVE

  async function run(id: string, fn: (id: string) => Promise<unknown>) {
    setBusyId(id)
    setError(null)
    try {
      await fn(id)
      setConfirmId(null)
    } catch (err) {
      setError({ id, msg: err instanceof Error ? err.message : 'Não foi possível concluir.' })
    } finally {
      setBusyId(null)
    }
  }

  function row(c: CustomCategory) {
    const Icon = iconFor(c.icon)
    const confirming = confirmId === c.id
    const busy = busyId === c.id
    return (
      <div key={c.id} className={`cm-row${c.archived ? ' is-arch' : ''}`}>
        <div className="cm-main">
          <span className="cm-tile" style={{ background: tint(c.color, 0.13), color: c.color }}><Icon size={17} /></span>
          <div style={{ minWidth: 0, flex: 1 }}>
            <div className="cm-name">{c.name}</div>
            <div className="cm-meta">{c.archived ? 'Arquivada · ' : ''}{usageText(c)}</div>
          </div>
          {!confirming && (
            <div className="cm-acts">
              {c.archived ? (
                <button type="button" className="cm-btn" disabled={busy || atLimit} onClick={() => run(c.id, onRestore)}
                  title={atLimit ? `Limite de ${CATEGORY_MAX_ACTIVE} categorias ativas` : undefined}>
                  Restaurar
                </button>
              ) : (
                <>
                  <button type="button" className="cm-btn" disabled={busy} onClick={() => onEdit(c)}>Editar</button>
                  <button type="button" className="cm-btn" disabled={busy} onClick={() => setConfirmId(c.id)}>
                    {c.canDelete ? 'Apagar' : 'Arquivar'}
                  </button>
                </>
              )}
            </div>
          )}
        </div>
        {confirming && (
          <div className="cm-confirm">
            <span className="cm-ctext">
              {c.canDelete
                ? `Apagar "${c.name}"? Ela ainda não tem despesas.`
                : `Arquivar "${c.name}"? Sai da lista de escolha. As despesas continuam nela.`}
            </span>
            <div className="cm-cacts">
              <button type="button" className="cm-btn" disabled={busy} onClick={() => setConfirmId(null)}>Voltar</button>
              <button type="button" className={c.canDelete ? 'cm-btn is-danger' : 'cm-btn is-ink'} disabled={busy}
                onClick={() => run(c.id, c.canDelete ? onDelete : onArchive)}>
                {busy ? 'Aguarde…' : c.canDelete ? 'Apagar' : 'Arquivar'}
              </button>
            </div>
          </div>
        )}
        {error?.id === c.id && <div className="cm-err">{error.msg}</div>}
      </div>
    )
  }

  return (
    <ExpenseSheet title="Categorias" subtitle="Organize as despesas do seu jeito." onClose={onClose}>
      <style>{CSS}</style>

      <div className="cm-grp">Suas categorias</div>
      {active.length === 0 && (
        <div className="cm-empty">Crie categorias como Aluguel, Contador ou Limpeza para ver para onde vai o seu dinheiro.</div>
      )}
      {active.map(row)}
      <button type="button" className="cm-new" onClick={onCreate} disabled={atLimit}>
        <Plus size={16} /> Nova categoria
      </button>
      {atLimit && <div className="cm-limit">Você chegou ao limite de {CATEGORY_MAX_ACTIVE} categorias ativas. Arquive uma para criar outra.</div>}

      {archived.length > 0 && (
        <>
          <div className="cm-grp">Arquivadas</div>
          {archived.map(row)}
        </>
      )}

      <div className="cm-grp">Do Eligi</div>
      {BASE_ORDER.map((k) => {
        const m = BASE_CATEGORIES[k]
        const Icon = m.Icon
        return (
          <div key={k} className="cm-row">
            <div className="cm-main">
              <span className="cm-tile" style={{ background: tint(m.color, 0.13), color: m.color }}><Icon size={17} /></span>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div className="cm-name">{m.label}</div>
                <div className="cm-meta">{m.auto ? 'Também lançada pelo sistema' : 'Padrão'}</div>
              </div>
              <span className="cm-lock" title="Não pode ser alterada"><Lock size={14} /></span>
            </div>
          </div>
        )
      })}
      <div className="cm-foot">Arquivar tira a categoria da lista de escolha. As despesas antigas continuam nela, nos relatórios e no histórico.</div>
    </ExpenseSheet>
  )
}

const CSS = `
.cm-grp{font-family:var(--font-mono);font-size:10.5px;font-weight:600;letter-spacing:.09em;text-transform:uppercase;color:#8a8a93;margin:14px 2px 4px}
.cm-grp:first-of-type{margin-top:2px}
.cm-row{border-top:1px solid rgba(17,17,20,.07);padding:10px 0}
.cm-row:first-of-type{border-top:0}
.cm-row.is-arch .cm-tile,.cm-row.is-arch .cm-name{opacity:.55}
.cm-main{display:flex;align-items:center;gap:12px}
.cm-tile{width:36px;height:36px;border-radius:11px;display:grid;place-items:center;flex-shrink:0}
.cm-name{font-size:14.5px;font-weight:600;color:#111114;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.cm-meta{font-size:12.5px;color:#8a8a93;margin-top:2px}
.cm-acts,.cm-cacts{display:flex;gap:6px;flex-wrap:wrap;justify-content:flex-end}
.cm-btn{min-height:40px;padding:0 13px;border-radius:11px;border:1px solid rgba(17,17,20,.14);background:#fff;color:#111114;font-size:13px;font-weight:600;font-family:inherit;cursor:pointer}
.cm-btn:hover{background:#f5f5f7}
.cm-btn:disabled{opacity:.5;cursor:not-allowed}
.cm-btn.is-ink{background:#111114;border-color:#111114;color:#fff}
.cm-btn.is-danger{background:#dc2626;border-color:#dc2626;color:#fff}
.cm-confirm{margin-top:10px;padding:12px;border-radius:12px;background:#f5f5f7;display:flex;flex-direction:column;gap:10px}
.cm-ctext{font-size:13px;color:#4b4b52;line-height:1.45}
.cm-err{margin-top:8px;font-size:12.5px;color:#b91c1c}
.cm-new{width:100%;min-height:46px;margin-top:8px;border-radius:12px;border:1.5px dashed rgba(17,17,20,.22);background:#fff;color:#111114;font-size:14px;font-weight:600;font-family:inherit;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:6px}
.cm-new:hover{background:#f5f5f7}
.cm-new:disabled{opacity:.5;cursor:not-allowed}
.cm-limit{font-size:12.5px;color:#b45309;margin-top:8px}
.cm-empty{font-size:13px;color:#8a8a93;line-height:1.5;padding:6px 2px 4px}
.cm-lock{color:#a1a1aa;flex-shrink:0;display:grid;place-items:center;width:32px}
.cm-foot{font-size:12px;color:#8a8a93;line-height:1.5;margin-top:14px}
`
