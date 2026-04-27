'use client'

import { useEffect, useState, useCallback } from 'react'
import api from '@/lib/apiClient'
import { AgendaDay } from '@/types/agenda'

/* =========================================
   TYPES
========================================= */

interface AgendaResponse {
  data?: AgendaDay
}

type Booking = AgendaDay['bookings'][number]

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

      const payload = res.data?.data || res.data

      setData(payload as AgendaDay)
    } catch (error) {
      console.error('Erro ao carregar agenda', error)
      setData(null)
    } finally {
      setLoading(false)
    }
  }, [date])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  /* =========================================
     REALTIME HANDLERS (🔥 PADRÃO FINAL)
  ========================================= */

  const addBooking = useCallback((booking: Booking) => {
    setData((prev) => {
      if (!prev) return prev

      const exists = prev.bookings.some((b) => b.id === booking.id)
      if (exists) return prev

      return {
        ...prev,
        bookings: [...prev.bookings, booking]
      }
    })
  }, [])

  const updateBooking = useCallback((booking: Booking) => {
    setData((prev) => {
      if (!prev) return prev

      return {
        ...prev,
        bookings: prev.bookings.map((b) =>
          b.id === booking.id ? booking : b
        )
      }
    })
  }, [])

  // 🔥 ALTERAÇÃO CRÍTICA (AGORA POR ID)
  const removeBooking = useCallback((id: string) => {
    setData((prev) => {
      if (!prev) return prev

      return {
        ...prev,
        bookings: prev.bookings.filter((b) => b.id !== id)
      }
    })
  }, [])

  /* =========================================
     RETURN
  ========================================= */

  return {
    data,
    loading,
    refetch: fetchData,

    addBooking,
    updateBooking,
    removeBooking
  }
}