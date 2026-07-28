// src/features/fiscal/hooks/useEmissions.ts
'use client'

import { useCallback, useEffect, useState } from 'react'
import api from '@/shared/lib/apiClient'
import type { NfseEmission } from '../types'
import { apiErrorMessage } from '../utils'

const POLL_MS = 6000

/** Lista as emissões; enquanto houver nota na fila, refaz o fetch sozinho. */
export function useEmissions() {
  const [emissions, setEmissions] = useState<NfseEmission[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [tick, setTick] = useState(0)

  const refetch = useCallback(() => setTick((t) => t + 1), [])

  useEffect(() => {
    let alive = true
    let timer: ReturnType<typeof setTimeout> | null = null

    api
      .get<NfseEmission[]>('/fiscal/emissions')
      .then((res) => {
        if (!alive) return
        const list = Array.isArray(res.data) ? res.data : []
        setEmissions(list)
        setError(null)
        // só continua acordado enquanto tem nota em processamento
        const pending = list.some((e) => e.status === 'PENDING' || e.status === 'PROCESSING')
        if (pending) timer = setTimeout(() => setTick((t) => t + 1), POLL_MS)
      })
      .catch((err: unknown) => {
        if (alive) setError(apiErrorMessage(err))
      })
      .finally(() => {
        if (alive) setLoading(false)
      })

    return () => {
      alive = false
      if (timer) clearTimeout(timer)
    }
  }, [tick])

  return { emissions, loading, error, refetch }
}
