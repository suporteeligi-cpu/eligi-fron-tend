// src/features/expenses/hooks/useExpenseSettings.ts
'use client'

import { useState, useEffect, useCallback } from 'react'
import api from '@/shared/lib/apiClient'

export interface ExpenseSettings {
  autoCommission: boolean
  autoStock:      boolean
}

// Montado só quando o sheet abre (gate no componente pai), então o fetch
// na montagem roda 1x por abertura.
export function useExpenseSettings() {
  const [autoCommission, setAutoCommission] = useState(false)
  const [autoStock,      setAutoStock]      = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving,  setSaving]  = useState(false)

  useEffect(() => {
    let alive = true
    async function run() {
      try {
        const { data } = await api.get<ExpenseSettings>('/expenses/settings')
        if (!alive) return
        setAutoCommission(!!data.autoCommission)
        setAutoStock(!!data.autoStock)
      } catch {
        // mantém o default
      } finally {
        if (alive) setLoading(false)
      }
    }
    void run()
    return () => { alive = false }
  }, [])

  const save = useCallback(async (next: ExpenseSettings) => {
    setSaving(true)
    try {
      const { data } = await api.put<ExpenseSettings>('/expenses/settings', next)
      setAutoCommission(!!data.autoCommission)
      setAutoStock(!!data.autoStock)
      return true
    } catch {
      return false
    } finally {
      setSaving(false)
    }
  }, [])

  return {
    autoCommission, setAutoCommission,
    autoStock,      setAutoStock,
    loading, saving, save,
  }
}
