// src/features/expenses/components/ExpenseCategoryGrid.tsx
// @eligi:expcat-grid — direcao C: um cartao por categoria do mes. Tocar filtra
// a lista; o ultimo cartao cria categoria. Categoria propria sem despesa no mes
// aparece no fim, apagada (senao a recem-criada some e parece que nao salvou).
'use client'

import { Plus, Zap } from 'lucide-react'
import { tint, type CategoryView } from '../categories'

export interface CategoryCard {
  view:  CategoryView
  total: number
  count: number
}

interface Props {
  cards:     CategoryCard[]
  monthTotal: number
  selected:  string
  loading:   boolean
  onSelect:  (key: string) => void
  onCreate:  () => void
}

const BRL = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })

export default function ExpenseCategoryGrid({ cards, monthTotal, selected, loading, onSelect, onCreate }: Props) {
  if (loading) {
    return (
      <div className="xg-grid" aria-busy="true">
        <style>{CSS}</style>
        {[0, 1, 2, 3].map((i) => <div key={i} className="xg-card xg-skel" />)}
      </div>
    )
  }

  return (
    <div className="xg-grid">
      <style>{CSS}</style>
      {cards.map(({ view, total, count }) => {
        const on = selected === view.key
        const Icon = view.Icon
        const pct = monthTotal > 0 ? Math.round((total / monthTotal) * 100) : 0
        return (
          <button
            key={view.key}
            type="button"
            className={`xg-card${on ? ' is-on' : ''}${count === 0 ? ' is-zero' : ''}`}
            aria-pressed={on}
            onClick={() => onSelect(on ? '' : view.key)}
          >
            {view.auto && count > 0 && (
              <span className="xg-auto" title="Também lançada pelo sistema"><Zap size={12} /></span>
            )}
            <span className="xg-tile" style={{ background: tint(view.color, 0.13), color: view.color }}>
              <Icon size={17} />
            </span>
            <span className="xg-name">{view.label}</span>
            <span className="xg-val">{BRL.format(total)}</span>
            <span className="xg-meta">{count === 0 ? 'sem despesa no mês' : `${pct}% · ${count}x`}</span>
          </button>
        )
      })}
      <button type="button" className="xg-card is-add" onClick={onCreate}>
        <Plus size={20} />
        <span className="xg-addt">Criar categoria</span>
        <span className="xg-meta">ex.: Aluguel, Contador</span>
      </button>
    </div>
  )
}

const CSS = `
.xg-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;margin-bottom:22px}
@media (min-width:720px){.xg-grid{grid-template-columns:repeat(4,minmax(0,1fr))}}
.xg-card{position:relative;min-height:124px;padding:14px;border-radius:16px;background:#fff;border:1px solid rgba(17,17,20,.07);box-shadow:0 1px 2px rgba(17,17,20,.04),0 8px 24px rgba(17,17,20,.04);display:flex;flex-direction:column;align-items:flex-start;text-align:left;cursor:pointer;font-family:inherit;color:#111114;transition:box-shadow .15s,transform .15s}
.xg-card:hover{transform:translateY(-1px)}
.xg-card.is-on{box-shadow:inset 0 0 0 2px #111114,0 8px 24px rgba(17,17,20,.06)}
.xg-card.is-zero .xg-tile,.xg-card.is-zero .xg-val{opacity:.5}
.xg-tile{width:34px;height:34px;border-radius:10px;display:grid;place-items:center;margin-bottom:10px}
.xg-auto{position:absolute;top:12px;right:12px;color:#a1a1aa;display:grid}
.xg-name{font-size:13.5px;font-weight:600;color:#111114;max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.xg-val{font-family:var(--font-display);font-size:19px;font-weight:700;letter-spacing:-.03em;font-variant-numeric:tabular-nums;color:#111114;margin-top:2px}
.xg-meta{font-family:var(--font-mono);font-size:11px;color:#8a8a93;margin-top:auto;padding-top:6px}
.xg-card.is-add{border:1.5px dashed rgba(17,17,20,.2);background:transparent;box-shadow:none;align-items:center;justify-content:center;text-align:center;gap:4px;color:#111114}
.xg-card.is-add:hover{background:#fff}
.xg-addt{font-size:13.5px;font-weight:600;color:#111114}
.xg-card.is-add .xg-meta{margin-top:0;padding-top:0}
.xg-skel{cursor:default;background:linear-gradient(90deg,#f0f0f3 25%,#f7f7f9 50%,#f0f0f3 75%);background-size:200% 100%;animation:xg-sh 1.2s infinite;border-color:transparent;box-shadow:none}
@keyframes xg-sh{from{background-position:200% 0}to{background-position:-200% 0}}
@media (prefers-reduced-motion:reduce){.xg-skel{animation:none}.xg-card:hover{transform:none}}
`
