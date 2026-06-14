// src/features/reports/hooks/useReportData.ts
'use client'

import { useEffect, useState } from 'react'
import api from '@/shared/lib/apiClient'

/** Hook genérico: busca qualquer endpoint de relatório por período. */
export function useReportData<T>(path: string, period: string) {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let alive = true

    // Sem setState síncrono no corpo do effect (regra React Compiler).
    api
      .get<T>(path, { params: { period } })
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
  }, [path, period])

  return { data, loading, error }
}
