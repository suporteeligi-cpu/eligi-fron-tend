// src/features/expenses/hooks/useExpenses.ts
// @eligi:expcat-front-hook
// Busca o MES inteiro, sem filtro: os cartoes de categoria (direcao C) precisam
// do total de todas as categorias mesmo com uma selecionada. O filtro e feito na
// tela, sobre a mesma lista. Depois de gravar, recarrega do back (os KPIs sao
// do back, nao recalculados aqui).
'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import api from '@/shared/lib/apiClient'
import type {
  Expense,
  ExpenseKPIs,
  CreateExpensePayload,
  UpdateExpensePayload,
  ExpensesResponse,
  EditRecurringPayload,
} from '../types'

const EMPTY_KPIS: ExpenseKPIs = { total: 0, fixed: 0, variable: 0, byCategory: {}, byKey: {} }

interface State {
  month:    string | null
  expenses: Expense[]
  kpis:     ExpenseKPIs
  error:    string | null
}

async function fetchMonth(month: string): Promise<State> {
  try {
    const { data } = await api.get<ExpensesResponse>('/expenses', { params: { month } })
    return { month, expenses: data.expenses, kpis: { ...EMPTY_KPIS, ...data.kpis }, error: null }
  } catch {
    return { month, expenses: [], kpis: EMPTY_KPIS, error: 'Não foi possível carregar as despesas.' }
  }
}

export function useExpenses(month: string) {
  const [state, setState] = useState<State>({ month: null, expenses: [], kpis: EMPTY_KPIS, error: null })
  const reqRef = useRef(0)

  // Resultado da busca vira estado so no callback da promise (regra do React
  // Compiler: nada de setState sincrono no corpo do efeito). O token descarta
  // resposta atrasada de outro mes.
  const load = useCallback(() => {
    const req = ++reqRef.current
    return fetchMonth(month).then((next) => {
      if (req === reqRef.current) setState((s) => next.error ? { ...s, month, error: next.error } : next)
    })
  }, [month])

  useEffect(() => { void load() }, [load])

  // carregando = ainda nao chegou resposta do mes pedido (troca de mes mostra esqueleto)
  const loading = state.month !== month

  const create = useCallback(async (payload: CreateExpensePayload) => {
    const { data } = await api.post<Expense>('/expenses', payload)
    await load()
    return data
  }, [load])

  const update = useCallback(async (id: string, payload: UpdateExpensePayload) => {
    const { data } = await api.put<Expense>(`/expenses/${id}`, payload)
    await load()
    return data
  }, [load])

  // @eligi:exprec-front-hook — so este mes (THIS) ou este e os proximos (FORWARD)
  const editRecurring = useCallback(async (id: string, payload: EditRecurringPayload) => {
    await api.patch(`/expenses/${id}/recurring`, payload)
    await load()
  }, [load])

  const remove = useCallback(async (id: string) => {
    await api.delete(`/expenses/${id}`)
    await load()
  }, [load])

  // Pular ocorrencia recorrente: o back faz soft-delete (RECURRING_SKIPPED).
  const skipOccurrence = remove

  // Parar recorrencia: desativa o modelo; o que ja foi lancado fica.
  const stopRecurrence = useCallback(async (recurrenceId: string) => {
    await api.patch(`/expenses/recurrences/${recurrenceId}/stop`)
    await load()
  }, [load])

  return {
    expenses: loading ? [] : state.expenses,
    kpis:     loading ? EMPTY_KPIS : state.kpis,
    loading,
    error:    loading ? null : state.error,
    refetch:  load,
    create, update, editRecurring, remove, skipOccurrence, stopRecurrence,
  }
}

/**
 * Total de um mes (para comparar com o mes anterior no topo da tela).
 * Falha = null: a comparacao some, a tela continua.
 */
export function useMonthTotal(month: string): number | null {
  const [state, setState] = useState<{ month: string; total: number | null } | null>(null)
  useEffect(() => {
    let alive = true
    api.get<ExpensesResponse>('/expenses', { params: { month } })
      .then(({ data }) => { if (alive) setState({ month, total: data.kpis?.total ?? 0 }) })
      .catch(() => { if (alive) setState({ month, total: null }) })
    return () => { alive = false }
  }, [month])
  return state && state.month === month ? state.total : null
}
