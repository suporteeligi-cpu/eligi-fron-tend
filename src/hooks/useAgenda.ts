'use client'

import { useEffect, useState, useCallback } from 'react'
import api from '@/lib/api'
import { AgendaDay } from '@/types/agenda'

/* =========================================
   TYPES
========================================= */

type Booking = AgendaDay['bookings'][number]

interface AgendaRawResponse {
  success?: boolean
  data?: AgendaDay & { businessId?: string }
}

/* =========================================
   HOOK
========================================= */

export function useAgenda(date: string) {
  const [data, setData] = useState<AgendaDay | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  /* =========================================
     FETCH
  ========================================= */

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const res = await api.get<AgendaRawResponse>('/agenda/day', {
        params: { date }
      })

      // Backend retorna { success: true, data: { ... } }
      const payload = res.data?.data ?? (res.data as unknown as AgendaDay)

      // Garante que businessId está presente — busca no payload direto
      // se o backend não retornar, mantém o anterior
      setData(prev => ({
        ...(payload as AgendaDay),
        businessId: (payload as AgendaDay & { businessId?: string }).businessId
          ?? prev?.businessId
          ?? ''
      }))
    } catch (err: unknown) {
      console.error('[useAgenda] Erro ao carregar agenda:', err)
      setError('Não foi possível carregar a agenda.')
      setData(null)
    } finally {
      setLoading(false)
    }
  }, [date])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  /* =========================================
     REALTIME HANDLERS
  ========================================= */

  const addBooking = useCallback((booking: Booking) => {
    setData(prev => {
      if (!prev) return prev
      const exists = prev.bookings.some(b => b.id === booking.id)
      if (exists) return prev
      return { ...prev, bookings: [...prev.bookings, booking] }
    })
  }, [])

  const updateBooking = useCallback((booking: Booking) => {
    setData(prev => {
      if (!prev) return prev
      return {
        ...prev,
        bookings: prev.bookings.map(b => b.id === booking.id ? booking : b)
      }
    })
  }, [])

  const removeBooking = useCallback((id: string) => {
    setData(prev => {
      if (!prev) return prev
      return { ...prev, bookings: prev.bookings.filter(b => b.id !== id) }
    })
  }, [])

  return {
    data,
    loading,
    error,
    refetch: fetchData,
    addBooking,
    updateBooking,
    removeBooking
  }
}