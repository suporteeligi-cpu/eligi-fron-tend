'use client'

import { useEffect, useState, useCallback } from 'react'
import api from '@/lib/apiClient'
import { AgendaDay } from '@/types/agenda'

/* =========================================
   TYPES (fallback seguro)
========================================= */

interface AgendaResponse {
  data?: AgendaDay
  businessId?: string
  professionals?: AgendaDay['professionals']
  bookings?: AgendaDay['bookings']
}

/* =========================================
   HOOK
========================================= */

export function useAgenda(date: string) {
  const [data, setData] = useState<AgendaDay | null>(null)
  const [loading, setLoading] = useState(true)

  /* =========================================
     FETCH
  ========================================= */

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)

      const res = await api.get<AgendaResponse>('/agenda/day', {
        params: { date }
      })

      // 🔥 SUPORTE A DOIS FORMATOS DE BACKEND
      const payload = res.data?.data || res.data

      setData(payload as AgendaDay)
    } catch (error) {
      console.error('Erro ao carregar agenda', error)
      setData(null)
    } finally {
      setLoading(false)
    }
  }, [date])

  /* =========================================
     EFFECT
  ========================================= */

  useEffect(() => {
    fetchData()
  }, [fetchData])

  /* =========================================
     RETURN
  ========================================= */

  return {
    data,
    loading,
    refetch: fetchData // 🔥 ESSENCIAL PARA SOCKET
  }
}