// src/features/reports/hooks/useOverview.ts
'use client'

import { useEffect, useState } from 'react'
import api from '@/shared/lib/apiClient'
import type { OverviewData } from '../types'

export function useOverview(period: string) {
  const [data, setData] = useState<OverviewData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let alive = true

    const run = async () => {
      setLoading(true)
      setError(null)
      try {
        const res = await api.get<OverviewData>('/reports/overview', { params: { period } })
        if (alive) setData(res.data)
      } catch (err: unknown) {
        if (alive) setError(err instanceof Error ? err.message : 'Erro ao carregar')
      } finally {
        if (alive) setLoading(false)
      }
    }

    void run()

    return () => {
      alive = false
    }
  }, [period])

  return { data, loading, error }
}
