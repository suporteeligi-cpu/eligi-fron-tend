// src/features/anamnesis/hooks/useRecords.ts
// @eligi:anamnese-front-records
// Lista paginada de fichas. Busca e filtros vao para o BACK: a lista e
// paginada, filtrar so a pagina carregada esconderia quem esta na proxima.
// Cada resultado guarda a chave que o gerou (filtro + busca): resposta de uma
// busca antiga nunca aparece em outra.
'use client'

import { useCallback, useEffect, useState } from 'react'
import { apiMessage, fetchRecords } from '../api'
import type { RecordFilter, RecordListItem } from '../types'

interface Loaded {
  key: string
  items: RecordListItem[]
  nextCursor: string | null
  error: string | null
}

export function useRecords(filter: RecordFilter, q: string) {
  const [version, setVersion] = useState(0)
  const key = `${filter}|${q}|${version}`
  const [data, setData] = useState<Loaded | null>(null)
  const [loadingMore, setLoadingMore] = useState(false)
  const [moreError, setMoreError] = useState<string | null>(null)

  useEffect(() => {
    let alive = true
    fetchRecords({ filter, q }).then(
      (p) => { if (alive) setData({ key, items: p.items, nextCursor: p.nextCursor, error: null }) },
      (e) => { if (alive) setData({ key, items: [], nextCursor: null, error: apiMessage(e, 'Não foi possível carregar as fichas.') }) },
    )
    return () => { alive = false }
  }, [key, filter, q])

  const current = data && data.key === key ? data : null
  const cursor = current?.nextCursor ?? null

  const loadMore = useCallback(async () => {
    if (!cursor || loadingMore) return
    setLoadingMore(true)
    setMoreError(null)
    try {
      const p = await fetchRecords({ filter, q, cursor })
      setData((d) => (d && d.key === key ? { ...d, items: [...d.items, ...p.items], nextCursor: p.nextCursor } : d))
    } catch (e) {
      setMoreError(apiMessage(e, 'Não foi possível carregar mais fichas.'))
    } finally {
      setLoadingMore(false)
    }
  }, [cursor, loadingMore, filter, q, key])

  /** Ficha excluida a pedido do cliente sai da lista sem recarregar tudo. */
  const removeItem = useCallback((id: string) => {
    setData((d) => (d ? { ...d, items: d.items.filter((it) => it.id !== id) } : d))
  }, [])

  const reload = useCallback(() => setVersion((v) => v + 1), [])

  return {
    loading: !current,
    items: current?.items ?? [],
    error: current?.error ?? null,
    hasMore: !!cursor,
    loadingMore,
    moreError,
    loadMore,
    removeItem,
    reload,
  }
}
