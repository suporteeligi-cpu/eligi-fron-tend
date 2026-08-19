'use client'
// src/hooks/useIsMobile.ts
//
// @eligi:usemobile-sync-store
// A versao anterior usava useState(false) + useEffect com listener de resize:
// no mobile o primeiro render dizia "desktop" e so' corrigia depois do paint,
// produzindo flash de layout em toda tela que troca de estrutura por breakpoint.
//
// useSyncExternalStore le o matchMedia DURANTE o render, entao o primeiro paint
// ja sai certo. getServerSnapshot devolve false porque no SSR nao existe
// viewport — o valor real chega na hidratacao, sem setState em efeito.
//
// Assinatura preservada de proposito: quem ja importava nao muda uma linha.

import { useCallback, useSyncExternalStore } from 'react'

export function useIsMobile(breakpoint = 768): boolean {
  const query = `(max-width: ${breakpoint - 1}px)`

  const subscribe = useCallback(
    (onStoreChange: () => void) => {
      if (typeof window === 'undefined') return () => {}
      const mql = window.matchMedia(query)
      mql.addEventListener('change', onStoreChange)
      return () => mql.removeEventListener('change', onStoreChange)
    },
    [query],
  )

  const getSnapshot = useCallback(() => window.matchMedia(query).matches, [query])
  const getServerSnapshot = useCallback(() => false, [])

  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
}
