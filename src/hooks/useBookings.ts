import { useEffect, useState, useCallback } from 'react'
import api from '@/lib/apiClient'
import { Booking } from '@/types/booking'

export function useBookings(date: string) {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    try {
      const res = await api.get('/bookings', {
        params: { date }
      })

      setBookings(res.data)
    } catch {
      console.error('Erro ao carregar bookings')
    } finally {
      setLoading(false)
    }
  }, [date])

  useEffect(() => {
    load()
  }, [load])

  return {
    bookings,
    loading,
    reload: load
  }
}