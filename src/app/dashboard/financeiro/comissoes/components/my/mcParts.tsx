// src/app/dashboard/financeiro/comissoes/components/my/mcParts.tsx
// @eligi:mc-d-parts — pecas pequenas da tela "Minhas comissoes" (direcao D).
'use client'

import { FileText, ChartBar, ChartColumn, ArrowLeftRight, CircleCheck } from 'lucide-react'
import EligiClubIcon from '@/app/components/navigation/EligiClubIcon'
import { brl, brlParts } from './mcFormat'
import type { ModKey } from './mcTypes'

export function Money({ v, className }: { v: number; className?: string }) {
  const { int, cents } = brlParts(v)
  return (
    <span className={`mc-num${className ? ` ${className}` : ''}`}>
      R$ {int}<span className="mc-cents">,{cents}</span>
    </span>
  )
}

export function MoneyFlat({ v }: { v: number }) {
  return <span className="mc-num">R$ {brl(v)}</span>
}

export function ModIcon({ k, size = 20 }: { k: ModKey; size?: number }) {
  const p = { size, strokeWidth: 2, 'aria-hidden': true as const }
  switch (k) {
    case 'extrato':  return <FileText {...p} />
    case 'servicos': return <ChartBar {...p} />
    case 'dias':     return <ChartColumn {...p} />
    case 'comparar': return <ArrowLeftRight {...p} />
    case 'recebi':   return <CircleCheck {...p} />
    case 'clube':    return <EligiClubIcon size={size} aria-hidden />
  }
}
