// src/features/fiscal/hooks/useNfseEnabled.ts
'use client'

import { useEffect, useState } from 'react'
import api from '@/shared/lib/apiClient'

interface BillingResponse {
  success: boolean
  data: { nfseAddon?: boolean }
}

// Cache de sessão: o caixa abre o modal dezenas de vezes por dia —
// não faz sentido perguntar ao back em toda abertura.
let cached: boolean | null = null

/** Diz se o módulo de Notas Fiscais está ativo (pro switch do caixa). */
export function useNfseEnabled(): boolean {
  const [enabled, setEnabled] = useState<boolean>(() => cached ?? false)

  useEffect(() => {
    if (cached !== null) return
    let alive = true
    api
      .get<BillingResponse>('/billing/subscription')
      .then((res) => {
        const value = res.data.data?.nfseAddon ?? false
        cached = value
        if (alive) setEnabled(value)
      })
      .catch(() => {
        cached = false
      })
    return () => {
      alive = false
    }
  }, [])

  return enabled
}
