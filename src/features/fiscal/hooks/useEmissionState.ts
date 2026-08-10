// src/features/fiscal/hooks/useEmissionState.ts
'use client'

import { useCallback, useEffect, useState } from 'react'
import api from '@/shared/lib/apiClient'
import type { NfseEmissionState } from '../types'

/** Estado do master switch de emissão. Qualquer cargo lê; só o dono altera. */
export function useEmissionState() {
  const [state, setState] = useState<NfseEmissionState | null>(null)
  const [loading, setLoading] = useState(true)
  const [tick, setTick] = useState(0)

  useEffect(() => {
    let alive = true
    api
      .get<NfseEmissionState>('/fiscal/emission-state')
      .then((res) => {
        if (alive) setState(res.data)
      })
      .catch(() => {
        if (alive) setState(null)
      })
      .finally(() => {
        if (alive) setLoading(false)
      })
    return () => {
      alive = false
    }
  }, [tick])

  const refetch = useCallback(() => setTick((t) => t + 1), [])

  return { state, loading, refetch }
}
