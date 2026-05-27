'use client'
// src/features/sales/hooks/useSalesSummary.ts

import { useState, useEffect, useCallback } from 'react'
import api from '@/shared/lib/apiClient'
import { SalesSummary } from '../types'

interface Filters {
  dateFrom?: string
  dateTo?:   string
}

export function useSalesSummary(filters: Filters = {}) {
  const [summary, setSummary] = useState<SalesSummary | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchSummary = useCallback(async (signal?: AbortSignal) => {
    try {
      const res = await api.get('/sales/summary', {
        signal,
        params: filters,
      })
      if (signal?.aborted) return
      const data = res.data?.data ?? res.data
      setSummary(data ?? null)
    } catch {
      if (!signal?.aborted) setSummary(null)
    } finally {
      if (!signal?.aborted) setLoading(false)
    }
  }, [filters.dateFrom, filters.dateTo]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const ctrl = new AbortController()
    fetchSummary(ctrl.signal)
    return () => ctrl.abort()
  }, [fetchSummary])

  return { summary, loading, refetch: () => fetchSummary() }
}
