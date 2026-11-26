'use client'
// src/features/client-notices/ReachSummary.tsx
// @eligi:cnot-reach-summary — barra + 3 numeros: recebem, no app sem receber, fora do app.
// Os numeros vem do GET /client-promotions/reach (o back conta; a tela nao recalcula).

import { ChevronRight } from 'lucide-react'
import { REACH_COLOR } from './styles'
import type { Reach } from './types'

export default function ReachSummary({ reach, onOpenList }: { reach: Reach | null; onOpenList?: () => void }) {
  if (!reach) {
    return (
      <div className="cpm-reach" aria-busy="true">
        <h3>Quem recebe</h3>
        <div className="cpm-rbar" />
        <p className="cpm-note">Contando…</p>
      </div>
    )
  }
  const base = Math.max(1, reach.recebem + reach.noAppSemReceber + reach.foraDoApp)
  return (
    <div className="cpm-reach">
      <h3>Quem recebe</h3>
      <div className="cpm-rbar" aria-hidden>
        <span style={{ flex: reach.recebem / base, background: REACH_COLOR.recebem }} />
        <span style={{ flex: reach.noAppSemReceber / base, background: REACH_COLOR.semReceber }} />
        <span style={{ flex: reach.foraDoApp / base, background: REACH_COLOR.fora }} />
      </div>
      <div className="cpm-rnums">
        <div><b>{reach.recebem}</b><small style={{ color: '#0f6e56' }}>recebem no celular</small></div>
        <div><b>{reach.noAppSemReceber}</b><small style={{ color: '#b45309' }}>no app, sem aviso</small></div>
        <div><b>{reach.foraDoApp}</b><small style={{ color: '#4b4b52' }}>fora do app</small></div>
      </div>
      {onOpenList && reach.foraDoApp > 0 && (
        <button type="button" className="cpm-link" onClick={onOpenList}>
          Ver quem não recebe e convidar <ChevronRight size={15} aria-hidden />
        </button>
      )}
    </div>
  )
}
