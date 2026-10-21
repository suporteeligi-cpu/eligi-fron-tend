// src/features/expenses/hooks/useExpenseCategories.ts
// @eligi:expcat-front-cat-hook — categorias criadas pelo dono (GET/POST/PATCH/DELETE /expenses/categories).
'use client'

import { useState, useEffect, useCallback } from 'react'
import api from '@/shared/lib/apiClient'
import type { CustomCategory, CustomCategoryInput } from '../types'

/** Erro do back com `code` (ex.: CATEGORY_IN_USE) para a tela decidir o que oferecer. */
export class CategoryApiError extends Error {
  constructor(message: string, readonly code: string | null) { super(message) }
}

function toApiError(err: unknown, fallback: string): CategoryApiError {
  const data = (err as { response?: { data?: { error?: string; code?: string } } })?.response?.data
  return new CategoryApiError(data?.error || fallback, data?.code ?? null)
}

export function useExpenseCategories() {
  const [items, setItems] = useState<CustomCategory[]>([])
  const [ready, setReady] = useState(false)

  const load = useCallback(async () => {
    try {
      const { data } = await api.get<CustomCategory[]>('/expenses/categories')
      setItems(Array.isArray(data) ? data : [])
    } catch {
      // sem categorias proprias a tela continua funcionando com as do Eligi
      setItems([])
    } finally {
      setReady(true)
    }
  }, [])

  useEffect(() => { void load() }, [load])

  const create = useCallback(async (input: CustomCategoryInput) => {
    try {
      const { data } = await api.post<CustomCategory>('/expenses/categories', input)
      setItems((prev) => [...prev, data])
      return data
    } catch (err) { throw toApiError(err, 'Não foi possível criar a categoria.') }
  }, [])

  const update = useCallback(async (id: string, input: Partial<CustomCategoryInput>) => {
    try {
      const { data } = await api.patch<CustomCategory>(`/expenses/categories/${id}`, input)
      setItems((prev) => prev.map((c) => (c.id === id ? data : c)))
      return data
    } catch (err) { throw toApiError(err, 'Não foi possível salvar a categoria.') }
  }, [])

  const archive = useCallback(async (id: string) => {
    try {
      const { data } = await api.post<CustomCategory>(`/expenses/categories/${id}/archive`)
      setItems((prev) => prev.map((c) => (c.id === id ? data : c)))
      return data
    } catch (err) { throw toApiError(err, 'Não foi possível arquivar a categoria.') }
  }, [])

  const restore = useCallback(async (id: string) => {
    try {
      const { data } = await api.post<CustomCategory>(`/expenses/categories/${id}/restore`)
      setItems((prev) => prev.map((c) => (c.id === id ? data : c)))
      return data
    } catch (err) { throw toApiError(err, 'Não foi possível restaurar a categoria.') }
  }, [])

  const remove = useCallback(async (id: string) => {
    try {
      await api.delete(`/expenses/categories/${id}`)
      setItems((prev) => prev.filter((c) => c.id !== id))
    } catch (err) { throw toApiError(err, 'Não foi possível apagar a categoria.') }
  }, [])

  return { items, ready, reload: load, create, update, archive, restore, remove }
}
