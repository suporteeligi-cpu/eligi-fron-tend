// src/features/expenses/hooks/useExpenses.ts
'use client'

import { useState, useEffect, useCallback } from 'react'
import dayjs from 'dayjs'
import api from '@/shared/lib/apiClient'
import type {
  Expense,
  ExpenseKPIs,
  ExpenseCategory,
  CreateExpensePayload,
  UpdateExpensePayload,
  ExpensesResponse,
} from '../types'

interface UseExpensesOptions {
  month:     string
  category?: ExpenseCategory | ''
}

export function useExpenses({ month, category }: UseExpensesOptions) {
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [kpis, setKpis]         = useState<ExpenseKPIs>({
    total: 0, fixed: 0, variable: 0, byCategory: {},
  })
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState<string | null>(null)

  const fetch = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const params: Record<string, string> = { month }
      if (category) params.category = category
      const { data } = await api.get<ExpensesResponse>('/expenses', { params })
      setExpenses(data.expenses)
      setKpis(data.kpis)
    } catch {
      setError('Erro ao carregar despesas')
    } finally {
      setLoading(false)
    }
  }, [month, category])

  useEffect(() => { fetch() }, [fetch])

  const create = useCallback(async (payload: CreateExpensePayload) => {
    const { data } = await api.post<Expense>('/expenses', payload)
    const expMonth = dayjs(data.date).format('YYYY-MM')
    if (expMonth === month) {
      setExpenses(prev =>
        [data, ...prev].sort((a, b) => dayjs(b.date).unix() - dayjs(a.date).unix())
      )
      setKpis(prev => ({
        total:    prev.total + data.amount,
        fixed:    prev.fixed    + (data.isRecurring ? data.amount : 0),
        variable: prev.variable + (data.isRecurring ? 0 : data.amount),
        byCategory: {
          ...prev.byCategory,
          [data.category]: (prev.byCategory[data.category] ?? 0) + data.amount,
        },
      }))
    }
    return data
  }, [month])

  const update = useCallback(async (id: string, payload: UpdateExpensePayload) => {
    const { data } = await api.put<Expense>(`/expenses/${id}`, payload)
    setExpenses(prev => prev.map(e => e.id === id ? data : e))
    await fetch()
    return data
  }, [fetch])

  const remove = useCallback(async (id: string) => {
    await api.delete(`/expenses/${id}`)
    setExpenses(prev => prev.filter(e => e.id !== id))
    await fetch()
  }, [fetch])

  return { expenses, kpis, loading, error, refetch: fetch, create, update, remove }
}
