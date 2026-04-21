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

// 🔥 TYPE BACKEND (CORRETO)
type Booking = AgendaDay['bookings'][number]

/* =========================================
   HOOK
========================================= */

export function useAgenda(date: string) {
  const [data, setData] = useState<AgendaDay | null>(null)
  const [loading, setLoading] = useState(true)

  /* =========================================
     FETCH INICIAL
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
     🔥 REALTIME HANDLERS (SEM CONVERSÃO)
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

  const removeBooking = useCallback((booking: Booking) => {
    setData((prev) => {
      if (!prev) return prev

      return {
        ...prev,
        bookings: prev.bookings.filter((b) => b.id !== booking.id)
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