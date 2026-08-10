// src/features/fiscal/hooks/useNfseEnabled.ts
'use client'

import { useEffect, useState } from 'react'
import api from '@/shared/lib/apiClient'
import type { NfseEmissionState } from '../types'

// Cache de sessão: o caixa abre o modal dezenas de vezes por dia.
let cached: NfseEmissionState | null = null

/**
 * Estado da emissão para o CAIXA. Quem decide ligar/desligar é o dono
 * (master switch no módulo fiscal) — o operador só é informado.
 */
export function useNfseEnabled(): NfseEmissionState | null {
  const [state, setState] = useState<NfseEmissionState | null>(() => cached)

  useEffect(() => {
    if (cached !== null) return
    let alive = true
    api
      .get<NfseEmissionState>('/fiscal/emission-state')
      .then((res) => {
        cached = res.data
        if (alive) setState(res.data)
      })
      .catch(() => {
        // sem módulo / sem permissão → nada é exibido no caixa
        cached = { ativa: false, ativadaEm: null, producaoLiberada: false, ambienteProducao: false }
      })
    return () => {
      alive = false
    }
  }, [])

  return state
}
