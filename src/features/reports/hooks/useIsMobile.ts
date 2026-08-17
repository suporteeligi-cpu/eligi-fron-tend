// src/features/reports/hooks/useIsMobile.ts  [rpt-mobile-leva1]
// Nasceu no Relatórios (como o glassCard); promover pra @/shared quando
// um segundo módulo precisar. useSyncExternalStore = Compiler-safe
// (nada de useEffect + setState), sem re-render por resize fora do breakpoint.
'use client'

import { useSyncExternalStore } from 'react'
import { MOBILE_BP } from '../constants'

const QUERY = `(max-width: ${MOBILE_BP}px)`

function subscribe(onChange: () => void): () => void {
  const mql = window.matchMedia(QUERY)
  mql.addEventListener('change', onChange)
  return () => mql.removeEventListener('change', onChange)
}

const getSnapshot = (): boolean => window.matchMedia(QUERY).matches
/** SSR/hidratação: assume desktop; React re-sincroniza no cliente. */
const getServerSnapshot = (): boolean => false

export function useIsMobile(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
}
