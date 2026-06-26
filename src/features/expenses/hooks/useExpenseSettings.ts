// src/features/expenses/hooks/useExpenseSettings.ts
'use client'

import { useState, useEffect, useCallback } from 'react'
import api from '@/shared/lib/apiClient'

export interface ExpenseSettings {
  autoCommission: boolean
  autoStock:      boolean
  autoCardFee:    boolean
}

export interface CardFeeRate {
  method:  string
  percent: number
}

// Draft editável na UI: percent como string (aceita vírgula enquanto digita).
export interface CardFeeDraft {
  method:  string
  percent: string
}

// Montado só quando o sheet abre (gate no componente pai), então o fetch
// na montagem roda 1x por abertura.
export function useExpenseSettings() {
  const [autoCommission, setAutoCommission] = useState(false)
  const [autoStock,      setAutoStock]      = useState(false)
  const [autoCardFee,    setAutoCardFee]    = useState(false)
  const [cardFees,       setCardFees]       = useState<CardFeeDraft[]>([])
  const [loading, setLoading] = useState(true)
  const [saving,  setSaving]  = useState(false)

  useEffect(() => {
    let alive = true
    async function run() {
      try {
        const [s, cf] = await Promise.all([
          api.get<ExpenseSettings>('/expenses/settings'),
          api.get<CardFeeRate[]>('/expenses/card-fees'),
        ])
        if (!alive) return
        setAutoCommission(!!s.data.autoCommission)
        setAutoStock(!!s.data.autoStock)
        setAutoCardFee(!!s.data.autoCardFee)
        setCardFees(cf.data.map((r) => ({ method: r.method, percent: String(r.percent).replace('.', ',') })))
      } catch {
        // mantém o default
      } finally {
        if (alive) setLoading(false)
      }
    }
    void run()
    return () => { alive = false }
  }, [])

  const setCardFee = useCallback((method: string, percent: string) => {
    setCardFees((prev) => prev.map((r) => (r.method === method ? { ...r, percent } : r)))
  }, [])

  const save = useCallback(async (next: {
    autoCommission: boolean
    autoStock:      boolean
    autoCardFee:    boolean
    cardFees:       CardFeeDraft[]
  }) => {
    setSaving(true)
    try {
      const rates: CardFeeRate[] = next.cardFees.map((r) => ({
        method:  r.method,
        percent: Number(r.percent.replace(',', '.')) || 0,
      }))
      const [s] = await Promise.all([
        api.put<ExpenseSettings>('/expenses/settings', {
          autoCommission: next.autoCommission,
          autoStock:      next.autoStock,
          autoCardFee:    next.autoCardFee,
        }),
        api.put('/expenses/card-fees', { rates }),
      ])
      setAutoCommission(!!s.data.autoCommission)
      setAutoStock(!!s.data.autoStock)
      setAutoCardFee(!!s.data.autoCardFee)
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
    autoCardFee,    setAutoCardFee,
    cardFees,       setCardFee,
    loading, saving, save,
  }
}
