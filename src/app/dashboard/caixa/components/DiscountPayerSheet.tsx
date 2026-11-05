'use client'
// src/app/dashboard/caixa/components/DiscountPayerSheet.tsx
// @eligi:dcm-sheet
//
// Pergunta "Quem paga esse desconto?" (direcao A, nov/2026). Abre em TODO desconto
// aplicado no caixa, antes de gravar. Nada vem marcado: o botao so libera depois
// da escolha, para ninguem confirmar no automatico.
//  - Loja paga (ESTABLISHMENT): a comissao segue sobre o preco cheio.
//  - Dividido (SPLIT): a comissao e calculada sobre o valor com desconto.
// Os valores mostrados sao a BASE da comissao, nao a comissao em reais: o
// percentual de cada profissional (e as excecoes por servico) nao chega a todo
// cargo, e numero inventado aqui seria pior que nenhum.
// Celular: folha embaixo. Computador: cartao no centro. Esc ou fundo = Voltar.

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import type { SaleItem, ProfLite } from '@/features/sales/types'
import { formatBRL } from '@/features/sales/utils/format'
import { commissionBases, commissionedItems, type DiscountPayer } from '@/features/sales/utils/discount'
import { C } from '../ui'

interface Props {
  value:         number
  items:         SaleItem[]
  professionals: ProfLite[]
  current:       DiscountPayer | null
  onAnswer:      (mode: DiscountPayer | null) => void
}

function joinNames(names: string[]): string {
  if (names.length <= 1) return names[0] ?? ''
  return `${names.slice(0, -1).join(', ')} e ${names[names.length - 1]}`
}

export default function DiscountPayerSheet({ value, items, professionals, current, onAnswer }: Props) {
  const [choice, setChoice] = useState<DiscountPayer | null>(current)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onAnswer(null) }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onAnswer])

  const bases = commissionBases(items, value)
  const ids = Array.from(new Set(commissionedItems(items).map(it => it.professionalId as string)))
  const names = ids
    .map(id => professionals.find(p => p.id === id)?.name?.split(' ')[0])
    .filter((n): n is string => !!n)
  const who = names.length > 0 ? joinNames(names) : 'o profissional'

  const options: Array<{ mode: DiscountPayer; title: string; desc: string; base: number }> = [
    { mode: 'ESTABLISHMENT', title: 'Só o estabelecimento', desc: `${who} ganha a comissão sobre o preço cheio.`, base: bases.full },
    { mode: 'SPLIT', title: 'Os dois, na proporção', desc: `A comissão de ${who} é calculada sobre o valor com desconto.`, base: bases.split },
  ]

  const content = (
    <div className="dps-root" role="presentation" onClick={() => onAnswer(null)}>
      <div
        className="dps-sheet"
        role="dialog"
        aria-modal="true"
        aria-labelledby="dps-q"
        onClick={e => e.stopPropagation()}
      >
        <div className="dps-grab" aria-hidden="true" />
        <div>
          <div className="dps-kicker">Desconto de {formatBRL(value)}</div>
          <h2 id="dps-q" className="dps-q">Quem paga esse desconto?</h2>
        </div>

        <div role="radiogroup" aria-labelledby="dps-q" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {options.map(o => (
            <button
              key={o.mode}
              type="button"
              role="radio"
              aria-checked={choice === o.mode}
              className="dps-opt"
              onClick={() => setChoice(o.mode)}
            >
              <span className="dps-dot" aria-hidden="true" />
              <span style={{ minWidth: 0 }}>
                <span className="dps-ot">{o.title}</span>
                <span className="dps-od">{o.desc}</span>
                <span className="dps-chip">Comissão sobre <b>{formatBRL(o.base)}</b></span>
              </span>
            </button>
          ))}
        </div>

        <button
          type="button"
          className="dps-go"
          disabled={!choice}
          onClick={() => { if (choice) onAnswer(choice) }}
        >Aplicar desconto</button>
        <button type="button" className="dps-back" onClick={() => onAnswer(null)}>Voltar sem aplicar</button>
      </div>

      <style>{`
        .dps-root { position: fixed; inset: 0; z-index: 11990; background: rgba(17,17,20,.38);
          display: flex; align-items: flex-end; justify-content: center; font-family: ${C.body}; }
        .dps-sheet { width: 100%; max-width: 480px; background: ${C.card}; border-radius: 22px 22px 0 0;
          padding: 10px 16px calc(18px + env(safe-area-inset-bottom)); display: flex; flex-direction: column; gap: 12px;
          box-shadow: 0 -8px 30px rgba(17,17,20,.14); }
        @media (min-width: 768px) {
          .dps-root { align-items: center; }
          .dps-sheet { border-radius: 20px; padding: 20px; max-width: 440px; }
          .dps-grab { display: none; }
        }
        .dps-grab { width: 38px; height: 4px; border-radius: 4px; background: ${C.line2}; margin: 0 auto 2px; }
        .dps-kicker { font-size: 11px; font-weight: 700; letter-spacing: .09em; text-transform: uppercase; color: ${C.ink3}; }
        .dps-q { font-family: ${C.display}; font-weight: 600; font-size: 20px; letter-spacing: -.025em; margin: 2px 0 0; color: ${C.ink}; }
        .dps-opt { display: flex; gap: 12px; align-items: flex-start; text-align: left; width: 100%; min-height: 44px;
          border: 1.5px solid ${C.line2}; border-radius: 14px; padding: 13px; background: ${C.card}; cursor: pointer; font-family: inherit; }
        .dps-opt[aria-checked="true"] { border-color: ${C.ink}; box-shadow: inset 0 0 0 1px ${C.ink}; }
        .dps-dot { flex-shrink: 0; width: 20px; height: 20px; border-radius: 50%; border: 2px solid ${C.ink3}; margin-top: 1px;
          display: grid; place-items: center; }
        .dps-opt[aria-checked="true"] .dps-dot { border-color: ${C.ink}; }
        .dps-opt[aria-checked="true"] .dps-dot::after { content: ""; width: 10px; height: 10px; border-radius: 50%; background: ${C.ink}; }
        .dps-ot { display: block; font-weight: 700; font-size: 15px; color: ${C.ink}; }
        .dps-od { display: block; font-size: 13px; color: ${C.ink2}; line-height: 1.45; margin-top: 3px; }
        .dps-chip { display: inline-block; margin-top: 8px; font-size: 12.5px; border-radius: 8px; padding: 4px 8px;
          background: ${C.sunken}; color: ${C.ink2}; font-variant-numeric: tabular-nums; }
        .dps-chip b { color: ${C.ink}; font-weight: 700; }
        .dps-go { min-height: 50px; border: none; border-radius: 14px; background: ${C.ink}; color: ${C.onInk};
          font-size: 15px; font-weight: 700; cursor: pointer; font-family: inherit; }
        .dps-go:disabled { opacity: .35; cursor: not-allowed; }
        .dps-back { min-height: 44px; border: none; background: transparent; color: ${C.ink2}; font-size: 13.5px;
          font-weight: 600; cursor: pointer; font-family: inherit; }
        .dps-sheet button:focus-visible { outline: 2px solid ${C.danger}; outline-offset: 2px; }
      `}</style>
    </div>
  )

  if (typeof document === 'undefined') return null
  return createPortal(content, document.body)
}
