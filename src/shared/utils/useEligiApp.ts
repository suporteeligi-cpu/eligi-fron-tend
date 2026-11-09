'use client'
// src/shared/utils/useEligiApp.ts
// @eligi:app-purchase-hook
//
// O painel aberto dentro do app (Android e iPhone) NAO mostra contratacao nem
// pagamento do plano do Eligi: as lojas exigem o sistema de pagamento delas
// para servico digital (Google Play Payments, Apple 3.1.1). Decisao do Eli
// (out/2026): esconder nas duas plataformas. Fica so informacao neutra.
//
// Tres estados de proposito: no servidor (e no 1o render da hidratacao) nao da
// para saber se e o app. "unknown" esconde a compra E o aviso do app; no
// navegador a compra aparece logo depois da hidratacao, sem pisca no app.

import { useSyncExternalStore } from 'react'
import { appSupportsApple } from './appApple'
import { appSupportsGoogle } from './appGoogle'
import { eligiApp } from './eligiApp'

export type EligiAppState = 'unknown' | 'web' | 'ios' | 'android'

const noSubscribe = () => () => {}
const readClient = (): EligiAppState => eligiApp()?.platform ?? 'web'
const readServer = (): EligiAppState => 'unknown'

export function useEligiAppState(): EligiAppState {
  return useSyncExternalStore(noSubscribe, readClient, readServer)
}

/** Pode mostrar contratar/pagar/ativar coisa paga do Eligi? So no navegador. */
export function useCanBuyPlan(): boolean {
  return useEligiAppState() === 'web'
}

// @eligi:app-login-options
// Quais logins sociais a tela de entrar/criar conta mostra.
// - navegador e Android: Google (Apple nao existe fora do iPhone);
// - app de iPhone: Apple quando o app sabe fazer (1.0.3+). O Google so aparece
//   JUNTO com a Apple: diretriz 4.8 (app com Google precisa oferecer Apple).
// No servidor: so Google, igual ao navegador (o iPhone corrige na hidratacao).
type LoginKey = 'g' | 'ga' | 'a' | 'none'
const readLoginClient = (): LoginKey => {
  if (eligiApp()?.platform !== 'ios') return 'g'
  if (!appSupportsApple()) return 'none'
  return appSupportsGoogle() ? 'ga' : 'a'
}
const readLoginServer = (): LoginKey => 'g'

export function useAppLoginOptions(): { google: boolean; apple: boolean } {
  const k = useSyncExternalStore(noSubscribe, readLoginClient, readLoginServer)
  return { google: k === 'g' || k === 'ga', apple: k === 'ga' || k === 'a' }
}

/** Esta dentro do app (Android ou iPhone). */
export function useInEligiApp(): boolean {
  const s = useEligiAppState()
  return s === 'ios' || s === 'android'
}
