'use client'
// src/app/dashboard/clientes/components/LapsedChips.tsx
// @eligi:lapsed-chips — aba Sumidos, direcao A "Chips" (nov/2026): um chip por
// profissional (quem saiu da equipe primeiro, em ambar) e a faixa do valor em
// risco do filtro escolhido. Os grupos vem prontos do back (lapsedGroups).

import { LogOut } from 'lucide-react'
import type { LapsedGroup } from '@/features/clients/types'
import { fmtMoneyShort } from '@/features/clients/utils/format'
import { firstName } from '@/shared/utils/whatsapp'

/** 'none' = sem preferencia; null = todos */
export type LapsedFilter = string | null

interface Props {
  groups:   LapsedGroup[]
  risk:     number
  value:    LapsedFilter
  onChange: (v: LapsedFilter) => void
}

function keyOf(g: LapsedGroup): string { return g.professionalId ?? 'none' }

export default function LapsedChips({ groups, risk, value, onChange }: Props) {
  const total = groups.reduce((t, g) => t + g.count, 0)
  const sel = value == null ? null : groups.find(g => keyOf(g) === value) ?? null
  const count = sel ? sel.count : total
  const money = sel ? sel.monthlyRisk : risk
  const gone = sel != null && sel.professionalId != null && !sel.active
  const w = (one: string, many: string) => (count === 1 ? one : many)
  const who = firstName(sel?.name ?? '')
  const title = !sel
    ? `${count} ${w('cliente sumiu', 'clientes sumiram')}`
    : sel.professionalId == null
      ? `${count} sem profissional preferido`
      : gone
        ? `${count} ${w('cliente', 'clientes')} de ${who}, que saiu da equipe`
        : `${count} ${w('cliente', 'clientes')} de ${who} ${w('sumiu', 'sumiram')}`

  return (
    <div className="cl-lp">
      <div className="cl-chips" role="group" aria-label="Filtrar sumidos por profissional">
        <button type="button" className={`cl-chip${value == null ? ' is-on' : ''}`} aria-pressed={value == null} onClick={() => onChange(null)}>
          Todos <span className="cl-chip-n">{total}</span>
        </button>
        {groups.map(g => {
          const k = keyOf(g)
          const on = value === k
          const isGone = g.professionalId != null && !g.active
          const label = g.professionalId == null ? 'Sem preferência' : firstName(g.name ?? '')
          return (
            <button key={k} type="button" className={`cl-chip${isGone ? ' is-gone' : ''}${on ? ' is-on' : ''}`} aria-pressed={on} onClick={() => onChange(on ? null : k)}>
              {isGone && <LogOut size={14} aria-hidden="true" />}
              {label}{isGone ? ' · saiu' : ''} <span className="cl-chip-n">{g.count}</span>
            </button>
          )
        })}
      </div>
      <div className={`cl-risk${gone ? ' is-gone' : ''}`}>
        <div style={{ minWidth: 0 }}>
          <div className="cl-risk-t">{title}</div>
          <div className="cl-risk-s">
            {gone ? 'Apresente outro profissional antes que eles sigam quem saiu.' : 'Sumido = passou de 2× o ritmo de cada um.'}
          </div>
        </div>
        <div className="cl-risk-v">
          <b>~{fmtMoneyShort(money)}</b>
          <span>por mês</span>
        </div>
      </div>
    </div>
  )
}
