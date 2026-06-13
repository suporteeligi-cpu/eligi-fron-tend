// src/features/reports/hooks/useMarketing.ts
'use client'

import { useEffect, useState } from 'react'
import api from '@/shared/lib/apiClient'
import type { MarketingData } from '../types'

export function useMarketing(period: string) {
  const [data, setData] = useState<MarketingData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let alive = true

    // Sem setState síncrono no corpo do effect (regra React Compiler).
    api
      .get<MarketingData>('/reports/marketing', { params: { period } })
      .then((res) => {
        if (alive) {
          setData(res.data)
          setError(null)
        }
      })
      .catch((err: unknown) => {
        if (alive) setError(err instanceof Error ? err.message : 'Erro ao carregar')
      })
      .finally(() => {
        if (alive) setLoading(false)
      })

    return () => {
      alive = false
    }
  }, [period])

  return { data, loading, error }
}
